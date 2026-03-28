import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Clock, Loader2, Lock, Sparkles, Shield, Brain, Users, TrendingUp, Crown, Flame, Trophy, Eye, AlertTriangle, ArrowRight, Star } from "lucide-react";
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

const SOCIAL_PROOF_MSGS = [
  "🏆 312 utilisateurs ont suivi un pick gagnant hier",
  "🔥 Nouveau match ELITE détecté il y a 8 min",
  "✅ 94 prédictions SAFE gagnées cette semaine",
  "💰 +127% de ROI sur les Value Bets ce mois",
];

function RotatingSocial() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % SOCIAL_PROOF_MSGS.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="h-5 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] text-muted-foreground/70 text-center"
        >
          {SOCIAL_PROOF_MSGS[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function Pricing() {
  const { user, isPremium, isPremiumPlus, subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px]"
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-secondary/5 blur-[100px]"
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <Navbar />

      <div className="container max-w-lg pt-20 pb-8 px-3 sm:px-4 relative z-10">

        {/* === HERO === */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
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
          className="mt-6 grid grid-cols-3 gap-2"
        >
          {[
            { icon: Trophy, value: eliteWinrate, suffix: "%", label: "Winrate ELITE", color: "text-primary" },
            { icon: Sparkles, value: eliteCount, suffix: "", label: "Matchs ELITE", color: "text-amber-400" },
            { icon: Shield, value: matchCount, suffix: "+", label: "Analysés", color: "text-emerald-400" },
          ].map(({ icon: Icon, value, suffix, label, color }) => (
            <motion.div
              key={label}
              className="glass-card p-3 text-center"
              whileHover={{ scale: 1.03 }}
            >
              <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
              <p className="font-display text-lg font-bold">
                <AnimatedCount value={value} />{suffix}
              </p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* === SOCIAL PROOF === */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <RotatingSocial />
        </motion.div>

        {/* === VALUE PROPOSITION === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-xl border border-primary/20 bg-primary/[0.04] p-4"
        >
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" /> Ce que tu débloques
          </p>
          <ul className="space-y-2">
            {[
              { icon: Sparkles, text: "Matchs ELITE à forte probabilité", color: "text-amber-400" },
              { icon: TrendingUp, text: "Analyse avancée du marché & Value Bets", color: "text-primary" },
              { icon: AlertTriangle, text: "Détection des matchs à risque", color: "text-amber-500" },
              { icon: Zap, text: "Accès prioritaire aux meilleurs picks", color: "text-emerald-400" },
              { icon: Eye, text: "Résultats & statistiques IA complets", color: "text-secondary" },
            ].map(({ icon: Icon, text, color }, i) => (
              <motion.li
                key={text}
                className="flex items-center gap-2.5 text-xs"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
                <span>{text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* === LOCKED PREVIEW (FRUSTRATION) === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" /> 🔒 Analyse complète réservée aux membres Premium+
          </p>
          <p className="text-[10px] text-muted-foreground/70 mb-3">
            Accède aux insights avancés, aux signaux de risque et à l'analyse complète de l'IA.
          </p>
          <div className="space-y-2">
            {[
              { conf: "ELITE", score: "91", teams: "Match à forte conviction" },
              { conf: "SAFE", score: "82", teams: "Marché protégé détecté" },
              { conf: "ELITE", score: "88", teams: "Anomalie de marché repérée" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="glass-card p-3 relative overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <div className="absolute inset-0 bg-card/70 backdrop-blur-[3px] z-10 flex items-center justify-center">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <Lock className="h-3 w-3" /> Disponible en Premium
                  </span>
                </div>
                <div className="flex items-center justify-between opacity-40 select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <span className="text-[11px] blur-[4px]">{item.teams}</span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full",
                    item.conf === "ELITE" ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                  )}>
                    {item.conf === "ELITE" ? `⚡ ${item.score}` : "🛡 SAFE"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* === LOSS AVERSION === */}
        {recentWins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4"
          >
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-amber-400">
              <Flame className="h-3.5 w-3.5" /> ❌ Tu as raté ces prédictions gagnantes (réservé Premium+)
            </p>
            <div className="space-y-1.5">
              {recentWins.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate flex-1">{w.home_team} vs {w.away_team}</span>
                  <span className="text-success font-semibold shrink-0 ml-2">✅ Gagné</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Ces matchs étaient réservés aux abonnés Premium+
            </p>
          </motion.div>
        )}

        {/* === NOT LOGGED IN CTA === */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 text-center"
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

        {/* === PRICING CARDS === */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-4"
        >

          {/* ===== PREMIUM+ (RECOMMENDED — FIRST & LARGEST) ===== */}
          <motion.div
            whileHover={{ y: -6, boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.25)" }}
            className="glass-card p-6 relative overflow-hidden"
            style={{ border: "1px solid hsl(var(--primary) / 0.4)" }}
          >
            {/* Glow effect */}
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

            <div className="relative z-10">
              <h2 className="font-display text-xl font-bold mt-2">
                Premium<span className="text-amber-400">+</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Évite les mauvais paris grâce à l'analyse avancée et aux détections de risque.
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold">9,99€</span>
                <span className="text-sm text-muted-foreground">/sem</span>
                <span className="text-muted-foreground mx-1">ou</span>
                <span className="font-display text-xl font-extrabold">24,99€</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <p className="text-[10px] text-success font-medium mt-1">💰 Économise 40% avec le mensuel</p>

              <ul className="mt-4 space-y-2 text-xs">
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

              <div className="mt-4 flex gap-2">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1 text-xs h-10 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusWeekly.priceId, "premiumPlusWeekly")}
                    disabled={loadingPlan === "premiumPlusWeekly" || (subscription.productId === STRIPE_PLANS.premiumPlusWeekly.productId)}
                  >
                    {loadingPlan === "premiumPlusWeekly" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {subscription.productId === STRIPE_PLANS.premiumPlusWeekly.productId ? "Actuel" : "Hebdo 9,99€"}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full gap-1 text-xs h-10 font-semibold bg-amber-500 hover:bg-amber-600 text-black"
                    onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusMonthly.priceId, "premiumPlusMonthly")}
                    disabled={loadingPlan === "premiumPlusMonthly" || (subscription.productId === STRIPE_PLANS.premiumPlusMonthly.productId)}
                  >
                    {loadingPlan === "premiumPlusMonthly" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    {subscription.productId === STRIPE_PLANS.premiumPlusMonthly.productId ? "Actuel" : "Mensuel 24,99€"}
                  </Button>
                </motion.div>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>
            </div>
          </motion.div>

          {/* ===== PREMIUM ===== */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-5 border-primary/20 relative"
          >
            <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
              🔥 Populaire
            </span>
            <h2 className="font-display text-lg font-bold mt-1">Premium</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Accès complet aux pronostics IA. Idéal pour consulter les analyses et suivre les meilleurs matchs.
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold">4,99€</span>
              <span className="text-sm text-muted-foreground">/semaine</span>
            </div>
            <p className="text-[10px] text-muted-foreground">ou 12,99€/mois (économise 35%)</p>

            <ul className="mt-4 space-y-2 text-xs">
              {["Prédictions illimitées", "Analyses détaillées", "Value Bets détectés", "12 sports couverts", "Résultats & statistiques IA"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 text-xs h-10"
                  onClick={() => handleCheckout(STRIPE_PLANS.weekly.priceId, "weekly")}
                  disabled={loadingPlan === "weekly" || (isPremium && subscription.productId === STRIPE_PLANS.weekly.productId)}
                >
                  {loadingPlan === "weekly" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {isPremium && subscription.productId === STRIPE_PLANS.weekly.productId ? "Plan actuel" : "Hebdo 4,99€"}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  className="w-full gap-1 text-xs h-10 btn-shimmer"
                  onClick={() => handleCheckout(STRIPE_PLANS.monthly.priceId, "monthly")}
                  disabled={loadingPlan === "monthly" || (isPremium && subscription.productId === STRIPE_PLANS.monthly.productId)}
                >
                  {loadingPlan === "monthly" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {isPremium && subscription.productId === STRIPE_PLANS.monthly.productId ? "Plan actuel" : "Mensuel 12,99€"}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* ===== FREE ===== */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-4 opacity-70"
          >
            <h2 className="font-display text-sm font-bold">Gratuit</h2>
            <p className="text-[10px] text-muted-foreground">Découverte • 2 matchs gratuits / jour • Aperçu limité</p>
            <ul className="mt-2 space-y-1 text-[10px] text-muted-foreground">
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-muted-foreground/50" /> 2 pronostics SAFE du jour</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-muted-foreground/50" /> Top Pick du jour</li>
              <li className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-muted-foreground/30" /> Analyses détaillées verrouillées</li>
            </ul>
            {!user ? (
              <Link to="/login"><Button variant="outline" size="sm" className="mt-3 w-full text-xs">S'inscrire</Button></Link>
            ) : !isPremium ? (
              <Button variant="outline" size="sm" className="mt-3 w-full text-xs" disabled>Plan Actuel</Button>
            ) : null}
          </motion.div>
        </motion.div>

        {/* === PROOF — Recent Results === */}
        {recentWins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8"
          >
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-success" /> 📈 Précision IA (30 derniers jours) : {eliteWinrate}%
            </p>
            <div className="space-y-1.5">
              {recentWins.map((w, i) => (
                <div key={i} className="glass-card p-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-success font-bold">✅</span>
                    <span className="truncate">{w.home_team} vs {w.away_team}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{w.predicted_confidence}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* === PSYCHOLOGICAL TRIGGERS === */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-2 gap-2"
        >
          {[
            { icon: Users, text: "1 842+ parieurs actifs", color: "text-primary" },
            { icon: TrendingUp, text: `+${eliteWinrate}% précision ELITE`, color: "text-success" },
            { icon: Sparkles, text: "Mis à jour en temps réel", color: "text-amber-400" },
            { icon: Shield, text: "Données 100% vérifiables", color: "text-emerald-400" },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Icon className={cn("h-3 w-3 shrink-0", color)} /> {text}
            </div>
          ))}
        </motion.div>

        {/* === BIG CTA (MOBILE FIRST) === */}
        {user && !isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-8 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold gap-2 btn-shimmer btn-glow shadow-xl shadow-primary/25"
                onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusWeekly.priceId, "premiumPlusWeekly")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                Débloquer maintenant — 9,99€/sem
              </Button>
            </motion.div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Sans engagement • Annulation facile • Paiement sécurisé Stripe
            </p>
          </motion.div>
        )}

        {/* === FAQ === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10"
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
              <motion.div key={q} whileHover={{ scale: 1.01 }} className="glass-card p-3.5">
                <h3 className="font-semibold text-xs mb-0.5">{q}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          className="mt-8 text-[9px] text-muted-foreground/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties. Ne pariez que ce que vous pouvez vous permettre de perdre.
        </motion.p>
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
            className="w-full h-12 text-sm font-bold gap-2 btn-shimmer btn-glow shadow-2xl shadow-primary/30"
            onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusWeekly.priceId, "premiumPlusWeekly")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Débloquer maintenant
          </Button>
        </motion.div>
      )}
    </div>
  );
}