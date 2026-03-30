import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Clock, Loader2, Lock, Sparkles, Shield, Brain, Users, TrendingUp, Crown, Flame, Trophy, Star, X, Check, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEliteWinrate, useAllResults } from "@/hooks/useResults";
import { useMatches } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";

/* ─── Welcome Offer Hook ─── */
function useWelcomeOffer() {
  const [showOffer, setShowOffer] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(300); // 5 min

  useEffect(() => {
    // Check if user already used the offer
    if (localStorage.getItem("pronosia_offer_used")) return;

    // Check if offer is already active (user came back to page)
    const offerStart = localStorage.getItem("pronosia_offer_start");
    if (offerStart) {
      const elapsed = Math.floor((Date.now() - parseInt(offerStart)) / 1000);
      if (elapsed >= 300) {
        // Offer expired
        localStorage.setItem("pronosia_offer_used", "1");
        return;
      }
      setRemainingSecs(300 - elapsed);
      setShowOffer(true);
      return;
    }

    // Wait 60s on site before showing offer
    const visitStart = parseInt(localStorage.getItem("pronosia_visit_start") || "0");
    if (!visitStart) {
      localStorage.setItem("pronosia_visit_start", Date.now().toString());
    }

    const checkTimer = setInterval(() => {
      const start = parseInt(localStorage.getItem("pronosia_visit_start") || "0");
      if (start && Date.now() - start >= 60000) {
        // 1 min passed, activate offer
        localStorage.setItem("pronosia_offer_start", Date.now().toString());
        setShowOffer(true);
        clearInterval(checkTimer);
      }
    }, 2000);

    return () => clearInterval(checkTimer);
  }, []);

  // Countdown
  useEffect(() => {
    if (!showOffer) return;
    const timer = setInterval(() => {
      setRemainingSecs(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.setItem("pronosia_offer_used", "1");
          setShowOffer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showOffer]);

  return { showOffer, remainingSecs };
}

function AnimatedCount({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 45;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); } else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count.toLocaleString()}</>;
}

function DurationToggle({ isMonthly, onChange }: { isMonthly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5 text-[10px] font-semibold w-full">
      <button
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 rounded-full py-1.5 px-2 transition-colors",
          !isMonthly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        Hebdo
      </button>
      <button
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 rounded-full py-1.5 px-2 transition-colors",
          isMonthly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        Mensuel
      </button>
    </div>
  );
}

const COMPARISON_ROWS = [
  { label: "Pronostics", free: "2/jour", premium: true, plus: true },
  { label: "Matchs ELITE", free: false, premium: true, plus: true },
  { label: "Analyse IA", free: false, premium: true, plus: true },
  { label: "Value Bets", free: false, premium: true, plus: true },
  { label: "12 sports", free: false, premium: true, plus: true },
  { label: "🚨 Matchs suspects", free: false, premium: false, plus: true },
  { label: "❌ À éviter", free: false, premium: false, plus: true },
  { label: "Score IA détaillé", free: false, premium: false, plus: true },
  { label: "Insights avancés", free: false, premium: false, plus: true },
  { label: "Priorité données", free: false, premium: false, plus: true },
  { label: "Support VIP", free: false, premium: false, plus: true },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-[10px] text-muted-foreground">{value}</span>;
  return value
    ? <Check className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
    : <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />;
}

export default function Pricing() {
  const { user, isPremium, isPremiumPlus, subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [premiumMonthly, setPremiumMonthly] = useState(true);
  const [plusMonthly, setPlusMonthly] = useState(true);
  const navigate = useNavigate();
  const { data: eliteData } = useEliteWinrate();
  const { data: matches } = useMatches();
  const { data: allResults } = useAllResults();
  const { showOffer, remainingSecs } = useWelcomeOffer();

  const eliteWinrate = eliteData?.winrate ?? 84;
  const matchCount = matches?.length || 0;
  const eliteCount = matches?.filter(m => (m as any).ai_score >= 80).length || 0;

  const recentWins = useMemo(() => {
    if (!allResults) return [];
    return allResults.filter(r => r.result === "win" && r.predicted_confidence === "SAFE").slice(0, 3);
  }, [allResults]);

  const handleCheckout = useCallback(async (priceId: string, planKey: string) => {
    if (!user) { navigate("/login"); return; }
    setLoadingPlan(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Session expirée, reconnecte-toi"); navigate("/login"); return; }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL de paiement manquante");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du paiement. Réessaie.");
    } finally {
      setLoadingPlan(null);
    }
  }, [user, navigate]);

  const premiumPrice = premiumMonthly ? "12,99€" : "4,99€";
  const premiumPeriod = premiumMonthly ? "/mois" : "/sem";
  const premiumPriceId = premiumMonthly ? STRIPE_PLANS.monthly.priceId : STRIPE_PLANS.weekly.priceId;
  const premiumPlanKey = premiumMonthly ? "monthly" : "weekly";
  const premiumProductId = premiumMonthly ? STRIPE_PLANS.monthly.productId : STRIPE_PLANS.weekly.productId;

  const plusPrice = plusMonthly ? "24,99€" : "9,99€";
  const plusPeriod = plusMonthly ? "/mois" : "/sem";
  const plusPriceId = plusMonthly ? STRIPE_PLANS.premiumPlusMonthly.priceId : STRIPE_PLANS.premiumPlusWeekly.priceId;
  const plusPlanKey = plusMonthly ? "premiumPlusMonthly" : "premiumPlusWeekly";
  const plusProductId = plusMonthly ? STRIPE_PLANS.premiumPlusMonthly.productId : STRIPE_PLANS.premiumPlusWeekly.productId;

  const isCurrentPlan = (productId: string) => subscription.productId === productId;

  const offerMins = Math.floor(remainingSecs / 60);
  const offerSecs = remainingSecs % 60;

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden">
      <Navbar />

      <div className="container max-w-5xl pt-20 pb-8 px-3 sm:px-6 relative z-10">

        {/* HERO */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
            Accède aux meilleurs <br /><span className="gradient-text-animated">pronostics IA</span> 🔥
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Notre IA analyse des centaines de matchs pour ne garder que les plus fiables
          </p>
          <p className="mt-1.5 text-[10px] text-muted-foreground/50">📊 Basé sur des données réelles — aucune promesse irréaliste</p>
        </motion.div>

        {/* WELCOME OFFER BANNER */}
        {showOffer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 mx-auto max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
              <Gift className="h-4 w-4" />
              🎉 Offre de bienvenue : -10% sur tous les abonnements
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-emerald-300 font-mono text-sm font-bold">
              <Clock className="h-3.5 w-3.5" />
              {String(offerMins).padStart(2, "0")}:{String(offerSecs).padStart(2, "0")}
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">Offre unique • Expire bientôt</p>
          </motion.div>
        )}

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto">
          {[
            { icon: Trophy, value: eliteWinrate, suffix: "%", label: "Winrate ELITE", color: "text-primary" },
            { icon: Sparkles, value: eliteCount, suffix: "", label: "Matchs ELITE", color: "text-amber-400" },
            { icon: Shield, value: matchCount, suffix: "+", label: "Analysés", color: "text-emerald-400" },
          ].map(({ icon: Icon, value, suffix, label, color }) => (
            <div key={label} className="glass-card p-3 text-center">
              <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
              <p className="font-display text-lg font-bold"><AnimatedCount value={value} />{suffix}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ========== PRICING CARDS ========== */}
        <div className="mt-10">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-3 px-3 md:grid md:grid-cols-[1fr_1fr_1.15fr] md:overflow-visible md:mx-0 md:px-0 md:gap-5 md:items-start scrollbar-hide">

            {/* FREE */}
            <div className="glass-card p-5 flex flex-col min-w-[260px] snap-center shrink-0 md:min-w-0 md:shrink opacity-80">
              <h2 className="font-display text-lg font-bold">Gratuit</h2>
              <p className="text-[11px] text-muted-foreground mt-1">Découverte limitée</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold">0€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pour toujours</p>
              <ul className="mt-5 space-y-2.5 text-xs flex-1">
                {["2 pronostics SAFE / jour", "Top Pick du jour", "Aperçu des matchs"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" /> {f}
                  </li>
                ))}
                {["Analyses détaillées", "Matchs suspects"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground/40">
                    <Lock className="h-3.5 w-3.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[10px] text-muted-foreground/60 italic">Fonctionnalités limitées</p>
              {!user ? (
                <Link to="/login" className="mt-3"><Button variant="outline" size="sm" className="w-full text-xs h-10">S'inscrire</Button></Link>
              ) : !isPremium ? (
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-10" disabled>Plan Actuel</Button>
              ) : null}
            </div>

            {/* PREMIUM */}
            <div className="glass-card p-5 pt-4 flex flex-col min-w-[260px] snap-center shrink-0 md:min-w-0 md:shrink relative border-primary/20">
              <span className="mb-2 self-start rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-[3px] text-[9px] font-bold text-black leading-none shadow-sm shadow-amber-500/20">🔥 Populaire</span>
              <h2 className="font-display text-lg font-bold">Premium</h2>
              <p className="text-[11px] text-muted-foreground mt-1">Accès complet aux pronostics IA</p>
              <div className="mt-4"><DurationToggle isMonthly={premiumMonthly} onChange={setPremiumMonthly} /></div>
              <div className="mt-3 flex items-baseline gap-1 transition-opacity duration-200">
                <span className="font-display text-3xl font-extrabold">{premiumPrice}</span>
                <span className="text-sm text-muted-foreground">{premiumPeriod}</span>
              </div>
              {premiumMonthly && <p className="text-[10px] text-emerald-400 font-medium mt-0.5">💰 Économise ~35% vs hebdo</p>}
              <ul className="mt-5 space-y-2.5 text-xs flex-1">
                {["Prédictions illimitées", "Analyses détaillées", "Value Bets détectés", "12 sports couverts", "Résultats & stats IA"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {f}</li>
                ))}
              </ul>
              <div className="mt-5">
                <Button className="w-full h-11 text-sm font-bold gap-2 btn-shimmer" onClick={() => handleCheckout(premiumPriceId, premiumPlanKey)} disabled={loadingPlan === premiumPlanKey || isCurrentPlan(premiumProductId)}>
                  {loadingPlan === premiumPlanKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {isCurrentPlan(premiumProductId) ? "Plan actuel" : "Choisir Premium"}
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement</p>
            </div>

            {/* PREMIUM+ */}
            <div
              className="glass-card p-5 md:p-6 flex flex-col min-w-[270px] snap-center shrink-0 md:min-w-0 md:shrink relative overflow-hidden"
              style={{ border: "1px solid hsl(var(--primary) / 0.4)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none" />
              <div className="absolute -top-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-[3px] text-[9px] font-bold text-black z-10 leading-none whitespace-nowrap">
                ⭐ Recommandé
              </span>

              <div className="relative z-10 flex flex-col flex-1">
                <h2 className="font-display text-xl font-bold mt-5">Premium<span className="text-amber-400">+</span></h2>
                <p className="text-[11px] text-muted-foreground mt-1">Évite les mauvais paris grâce à l'analyse avancée de l'IA</p>

                <div className="mt-4"><DurationToggle isMonthly={plusMonthly} onChange={setPlusMonthly} /></div>
                <div className="mt-3 flex items-baseline gap-1 transition-opacity duration-200">
                  <span className="font-display text-3xl font-extrabold">{plusPrice}</span>
                  <span className="text-sm text-muted-foreground">{plusPeriod}</span>
                </div>
                {plusMonthly && <p className="text-[10px] text-emerald-400 font-medium mt-0.5">💰 Économise ~37% vs hebdo</p>}

                <ul className="mt-5 space-y-2.5 text-xs flex-1">
                  {[
                    { icon: "✅", text: "Tous les pronostics IA" },
                    { icon: "⚡", text: "Matchs ELITE en priorité" },
                    { icon: "🚨", text: "Détection des matchs suspects" },
                    { icon: "❌", text: "Matchs à éviter identifiés" },
                    { icon: "🧠", text: "Analyse avancée IA" },
                    { icon: "📊", text: "Score IA détaillé" },
                    { icon: "💎", text: "Support VIP prioritaire" },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-2"><span>{icon}</span> {text}</li>
                  ))}
                </ul>

                <p className="mt-4 text-[10px] text-muted-foreground/70 italic text-center">
                  L'option utilisée pour éviter les erreurs des parieurs
                </p>

                <div className="mt-4">
                  <Button
                    className="w-full h-12 text-sm font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20"
                    onClick={() => handleCheckout(plusPriceId, plusPlanKey)}
                    disabled={loadingPlan === plusPlanKey || isCurrentPlan(plusProductId)}
                  >
                    {loadingPlan === plusPlanKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    {isCurrentPlan(plusProductId) ? "Plan actuel" : "Passer en Premium+"}
                  </Button>
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>

                <p className="mt-2 text-center text-[10px] text-amber-400/80 font-medium">
                  🔥 Déjà choisi par +1 842 utilisateurs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NOT LOGGED IN */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 text-center max-w-md mx-auto">
            <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-base font-bold">Crée ton compte gratuit</h2>
            <p className="mt-1 text-xs text-muted-foreground">Pour accéder aux analyses complètes</p>
            <Link to="/login">
              <Button className="mt-4 h-11 px-8 text-sm font-bold gap-2 btn-shimmer">Créer un compte gratuit</Button>
            </Link>
          </motion.div>
        )}

        {/* ========== COMPARISON TABLE ========== */}
        <div className="mt-12">
          <h2 className="font-display text-lg font-bold text-center mb-5">📊 Comparaison des abonnements</h2>
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
            <table className="w-full text-[11px]" style={{ minWidth: "340px" }}>
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 pr-2 text-muted-foreground font-medium" style={{ width: "38%" }}>Fonctionnalité</th>
                  <th className="text-center py-2.5 px-1 text-muted-foreground font-medium" style={{ width: "16%" }}>Free</th>
                  <th className="text-center py-2.5 px-1 font-semibold" style={{ width: "20%" }}>Premium</th>
                  <th className="text-center py-2.5 px-1" style={{ width: "26%" }}>
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-400 text-[10px]">
                      <Star className="h-3 w-3" /> Premium+
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={cn("border-b border-border/20", i % 2 === 0 && "bg-muted/5")}>
                    <td className="py-2 pr-2 text-[10px]">{row.label}</td>
                    <td className="py-2 px-1 text-center"><ComparisonCell value={row.free} /></td>
                    <td className="py-2 px-1 text-center"><ComparisonCell value={row.premium} /></td>
                    <td className="py-2 px-1 text-center bg-primary/[0.03]"><ComparisonCell value={row.plus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOSS AVERSION */}
        {recentWins.length > 0 && (
          <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 max-w-md mx-auto">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-amber-400">
              <Flame className="h-3.5 w-3.5" /> ❌ Tu as raté ces prédictions gagnantes
            </p>
            <div className="space-y-1.5">
              {recentWins.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate flex-1">{w.home_team} vs {w.away_team}</span>
                  <span className="text-emerald-400 font-semibold shrink-0 ml-2">✅ Gagné</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRUST */}
        <div className="mt-8 grid grid-cols-2 gap-2 max-w-md mx-auto">
          {[
            { icon: Users, text: "1 842+ parieurs actifs", color: "text-primary" },
            { icon: TrendingUp, text: `+${eliteWinrate}% précision ELITE`, color: "text-emerald-400" },
            { icon: Sparkles, text: "Mis à jour en temps réel", color: "text-amber-400" },
            { icon: Shield, text: "Données 100% vérifiables", color: "text-emerald-400" },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Icon className={cn("h-3 w-3 shrink-0", color)} /> {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-10 max-w-lg mx-auto">
          <h2 className="mb-4 text-center font-display text-lg font-bold">Questions Fréquentes</h2>
          <div className="space-y-2">
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre moteur analyse 11 dimensions : forme, H2H, xG, blessures, contexte, fatigue, marché, etc." },
              { q: "Taux de réussite ?", a: `${eliteWinrate}% de réussite sur les 20 derniers matchs ELITE, avec confiance calibrée.` },
              { q: "Différence Premium / Premium+ ?", a: "Premium donne accès aux prédictions. Premium+ ajoute les scores prédits, la détection d'anomalies, et les matchs à éviter." },
              { q: "Annulation possible ?", a: "Oui, sans engagement. Annulez à tout moment depuis votre compte." },
              { q: "Paiement sécurisé ?", a: "Stripe gère tous les paiements. Vos données bancaires ne transitent jamais par nos serveurs." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card p-3.5">
                <h3 className="font-semibold text-xs mb-0.5">{q}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[9px] text-muted-foreground/50 text-center">
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties. Ne pariez que ce que vous pouvez vous permettre de perdre.
        </p>
      </div>

      {/* STICKY MOBILE CTA */}
      {user && !isPremium && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2 sm:hidden">
          <Button
            className="w-full h-12 text-sm font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black shadow-2xl shadow-amber-500/30"
            onClick={() => handleCheckout(plusPriceId, plusPlanKey)}
            disabled={loadingPlan !== null}
          >
            {loadingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            Passer en Premium+
          </Button>
        </div>
      )}
    </div>
  );
}
