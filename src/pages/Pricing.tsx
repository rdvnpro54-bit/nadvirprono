import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Clock, Loader2, Lock, Sparkles, Shield, Brain, Users, TrendingUp, Crown, Flame, Trophy, Eye, AlertTriangle, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEliteWinrate, useAllResults } from "@/hooks/useResults";
import { useMatches } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";

function UrgencyTimer() {
  const [secs, setSecs] = useState(() => (Math.floor(Math.random() * 20) + 5) * 60);
  useEffect(() => {
    const i = setInterval(() => setSecs(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, []);
  if (secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-amber-400 text-xs font-semibold"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Clock className="h-3.5 w-3.5" />
      Offre disponible encore {m}:{s.toString().padStart(2, "0")}
    </motion.div>
  );
}

function AnimatedCount({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 45;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count.toLocaleString()}</>;
}

function DurationToggle({ isMonthly, onChange }: { isMonthly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted/50 p-0.5 text-[10px] font-medium w-full">
      <button
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 rounded-full py-1.5 px-2 transition-all duration-200",
          !isMonthly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Hebdo
      </button>
      <button
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 rounded-full py-1.5 px-2 transition-all duration-200",
          isMonthly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Mensuel
      </button>
    </div>
  );
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

  const eliteWinrate = eliteData?.winrate ?? 84;
  const matchCount = matches?.length || 0;
  const eliteCount = matches?.filter(m => (m as any).ai_score >= 80).length || 0;

  const recentWins = useMemo(() => {
    if (!allResults) return [];
    return allResults
      .filter(r => r.result === "win" && r.predicted_confidence === "SAFE")
      .slice(0, 3);
  }, [allResults]);

  const handleCheckout = async (priceId: string, planKey: string) => {
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
  };

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

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <Navbar />

      <div className="container max-w-5xl pt-20 pb-8 px-3 sm:px-6 relative z-10">

        {/* === HERO === */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg mx-auto"
        >
          <motion.div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Crown className="h-7 w-7 text-primary" />
          </motion.div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
            Accède aux meilleurs <br />
            <span className="gradient-text-animated">pronostics IA</span> 🔥
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Notre IA analyse des centaines de matchs pour ne garder que les plus fiables
          </p>

          <p className="mt-1.5 text-[10px] text-muted-foreground/50">
            📊 Basé sur des données réelles — aucune promesse irréaliste
          </p>

          <motion.div
            className="mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <UrgencyTimer />
          </motion.div>
        </motion.div>

        {/* === STATS BAR === */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto"
        >
          {[
            { icon: Trophy, value: eliteWinrate, suffix: "%", label: "Winrate ELITE", color: "text-primary" },
            { icon: Sparkles, value: eliteCount, suffix: "", label: "Matchs ELITE", color: "text-amber-400" },
            { icon: Shield, value: matchCount, suffix: "+", label: "Analysés", color: "text-emerald-400" },
          ].map(({ icon: Icon, value, suffix, label, color }) => (
            <div key={label} className="glass-card p-3 text-center">
              <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
              <p className="font-display text-lg font-bold">
                <AnimatedCount value={value} />{suffix}
              </p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* === PRICING CARDS — 3 COLUMN GRID === */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10"
        >
          {/* Mobile: horizontal snap scroll / Desktop: 3-col grid */}
          <div className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-3 px-3
            md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:gap-5
            scrollbar-hide
          ">

            {/* ===== FREE ===== */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-5 flex flex-col min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink"
            >
              <h2 className="font-display text-lg font-bold">Gratuit</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Découverte • Aperçu limité
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold">0€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pour toujours</p>

              <ul className="mt-5 space-y-2.5 text-xs flex-1">
                {[
                  "2 pronostics SAFE / jour",
                  "Top Pick du jour",
                  "Aperçu des matchs",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" /> {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-muted-foreground/50">
                  <Lock className="h-3.5 w-3.5 shrink-0" /> Analyses détaillées
                </li>
                <li className="flex items-center gap-2 text-muted-foreground/50">
                  <Lock className="h-3.5 w-3.5 shrink-0" /> Matchs suspects
                </li>
              </ul>

              {!user ? (
                <Link to="/login" className="mt-5">
                  <Button variant="outline" size="sm" className="w-full text-xs h-10">S'inscrire gratuitement</Button>
                </Link>
              ) : !isPremium ? (
                <Button variant="outline" size="sm" className="mt-5 w-full text-xs h-10" disabled>Plan Actuel</Button>
              ) : null}
            </motion.div>

            {/* ===== PREMIUM ===== */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-5 flex flex-col min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink relative border-primary/20"
            >
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                🔥 Populaire
              </span>

              <h2 className="font-display text-lg font-bold mt-1">Premium</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Accès aux pronostics IA et aux analyses
              </p>

              <div className="mt-4">
                <DurationToggle isMonthly={premiumMonthly} onChange={setPremiumMonthly} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={premiumMonthly ? "pm" : "pw"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 flex items-baseline gap-1"
                >
                  <span className="font-display text-3xl font-extrabold">{premiumPrice}</span>
                  <span className="text-sm text-muted-foreground">{premiumPeriod}</span>
                </motion.div>
              </AnimatePresence>
              {premiumMonthly && (
                <p className="text-[10px] text-emerald-400 font-medium mt-0.5">💰 Économise 35%</p>
              )}

              <ul className="mt-5 space-y-2.5 text-xs flex-1">
                {[
                  "Prédictions illimitées",
                  "Analyses détaillées",
                  "Value Bets détectés",
                  "12 sports couverts",
                  "Résultats & statistiques IA",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-5">
                <Button
                  className="w-full h-11 text-sm font-bold gap-2 btn-shimmer"
                  onClick={() => handleCheckout(premiumPriceId, premiumPlanKey)}
                  disabled={loadingPlan === premiumPlanKey || isCurrentPlan(premiumProductId)}
                >
                  {loadingPlan === premiumPlanKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {isCurrentPlan(premiumProductId) ? "Plan actuel" : `Choisir Premium — ${premiumPrice}${premiumPeriod}`}
                </Button>
              </motion.div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement</p>
            </motion.div>

            {/* ===== PREMIUM+ (RECOMMENDED — HIGHLIGHTED) ===== */}
            <motion.div
              whileHover={{ y: -6, boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.25)" }}
              className="glass-card p-5 flex flex-col min-w-[280px] snap-center shrink-0 md:min-w-0 md:shrink relative overflow-hidden md:scale-[1.04] md:z-10"
              style={{ border: "1px solid hsl(var(--primary) / 0.4)" }}
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none" />
              <motion.div
                className="absolute -top-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <motion.span
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-0.5 text-[10px] font-bold text-black z-10"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐ Recommandé
              </motion.span>

              <div className="relative z-10 flex flex-col flex-1">
                <h2 className="font-display text-lg font-bold mt-2">
                  Premium<span className="text-amber-400">+</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Évite les mauvais paris grâce à l'analyse avancée
                </p>

                <div className="mt-4">
                  <DurationToggle isMonthly={plusMonthly} onChange={setPlusMonthly} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={plusMonthly ? "ppm" : "ppw"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 flex items-baseline gap-1"
                  >
                    <span className="font-display text-3xl font-extrabold">{plusPrice}</span>
                    <span className="text-sm text-muted-foreground">{plusPeriod}</span>
                  </motion.div>
                </AnimatePresence>
                {plusMonthly && (
                  <p className="text-[10px] text-emerald-400 font-medium mt-0.5">💰 Économise 40%</p>
                )}

                <ul className="mt-5 space-y-2.5 text-xs flex-1">
                  {[
                    { icon: "✅", text: "Tout l'accès Premium inclus" },
                    { icon: "🎯", text: "Scores prédits par l'IA" },
                    { icon: "🚨", text: "Détection de matchs suspects" },
                    { icon: "🚫", text: "Matchs à éviter identifiés" },
                    { icon: "⚡", text: "Matchs ELITE en priorité absolue" },
                    { icon: "📊", text: "Analyses ultra-détaillées" },
                    { icon: "💎", text: "Support VIP prioritaire" },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-2">
                      <span>{icon}</span> {text}
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-5">
                  <Button
                    className="w-full h-12 text-sm font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20"
                    onClick={() => handleCheckout(plusPriceId, plusPlanKey)}
                    disabled={loadingPlan === plusPlanKey || isCurrentPlan(plusProductId)}
                  >
                    {loadingPlan === plusPlanKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    {isCurrentPlan(plusProductId) ? "Plan actuel" : `Passer en Premium+ — ${plusPrice}${plusPeriod}`}
                  </Button>
                </motion.div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* === NOT LOGGED IN CTA === */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 text-center max-w-md mx-auto"
          >
            <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-base font-bold">Crée ton compte gratuit</h2>
            <p className="mt-1 text-xs text-muted-foreground">Pour accéder aux analyses complètes</p>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 inline-block">
                <Button className="h-11 px-8 text-sm font-bold gap-2 btn-shimmer">
                  Créer un compte gratuit
                </Button>
              </motion.div>
            </Link>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Déjà un compte ? <Link to="/login" className="text-primary underline">Se connecter</Link>
            </p>
          </motion.div>
        )}

        {/* === LOSS AVERSION === */}
        {recentWins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 max-w-md mx-auto"
          >
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
            <p className="mt-2 text-[10px] text-muted-foreground">
              Ces matchs étaient réservés aux abonnés Premium+
            </p>
          </motion.div>
        )}

        {/* === PSYCHOLOGICAL TRIGGERS === */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-2 gap-2 max-w-md mx-auto"
        >
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
        </motion.div>

        {/* === FAQ === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-10 max-w-lg mx-auto"
        >
          <h2 className="mb-4 text-center font-display text-lg font-bold">Questions Fréquentes</h2>
          <div className="space-y-2">
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre moteur analyse 11 dimensions : forme, H2H, xG, blessures, contexte, fatigue, marché, etc." },
              { q: "Taux de réussite ?", a: `${eliteWinrate}% de réussite sur les 20 derniers matchs ELITE, avec confiance calibrée.` },
              { q: "Quelle différence entre Premium et Premium+ ?", a: "Premium donne accès à toutes les prédictions. Premium+ ajoute les scores prédits, la détection d'anomalies, et les matchs à éviter — l'option pour éviter les mauvais paris." },
              { q: "Annulation possible ?", a: "Oui, sans engagement. Annulez à tout moment depuis votre compte." },
              { q: "Paiement sécurisé ?", a: "Stripe gère tous les paiements. Vos données bancaires ne transitent jamais par nos serveurs." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card p-3.5">
                <h3 className="font-semibold text-xs mb-0.5">{q}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-8 text-[9px] text-muted-foreground/50 text-center">
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties. Ne pariez que ce que vous pouvez vous permettre de perdre.
        </p>
      </div>

      {/* === STICKY MOBILE CTA === */}
      {user && !isPremium && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2 sm:hidden"
        >
          <Button
            className="w-full h-12 text-sm font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black shadow-2xl shadow-amber-500/30"
            onClick={() => handleCheckout(plusPriceId, plusPlanKey)}
            disabled={loadingPlan !== null}
          >
            {loadingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            Passer en Premium+
          </Button>
        </motion.div>
      )}
    </div>
  );
}
