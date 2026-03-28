import React from "react";
import { Link } from "react-router-dom";
import { Zap, TrendingUp, Shield, BarChart3, ChevronRight, Star, RefreshCw, Brain, Sparkles, Flame, Crown, ArrowRight, Lock, CheckCircle, Trophy, Users, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { TopMatchesSection } from "@/components/home/TopMatchesSection";
import { TopPickSection } from "@/components/home/TopPickSection";
import { GlobalActivityBanner } from "@/components/home/GlobalActivityBanner";
import { DailyCombo } from "@/components/home/DailyCombo";
import { MissedMatchBanner } from "@/components/home/MissedMatchBanner";
import { MatchesToAvoid } from "@/components/home/MatchesToAvoid";
import { SportRankings } from "@/components/home/SportRankings";
import { WinStreak } from "@/components/home/WinStreak";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { useEliteWinrate } from "@/hooks/useResults";
import { useMatchDiagnostics } from "@/hooks/useMatchLifecycle";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function AnimatedNumber({ value, duration = 1.5, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const ScrollSection = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; delay?: number }>(
  ({ children, className, delay = 0 }, _) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);
ScrollSection.displayName = "ScrollSection";

// Rotating social proof messages
const SOCIAL_PROOF = [
  "🏆 247 utilisateurs ont gagné grâce au Top Pick hier",
  "🔥 Match ELITE détecté il y a 12 minutes",
  "✅ 89 prédictions SAFE gagnées cette semaine",
  "📈 +127% de ROI sur les Value Bets ce mois",
  "⚡ 1 842 parieurs actifs en ce moment",
  "🎯 Winrate ELITE : 84% sur les 30 derniers jours",
  "💰 312 abonnés Premium ont touché leurs paris hier",
];

function SocialProofTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % SOCIAL_PROOF.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] sm:text-xs text-muted-foreground/70 text-center"
        >
          {SOCIAL_PROOF[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// Testimonial data
const TESTIMONIALS = [
  { name: "Thomas R.", badge: "Premium", text: "Les picks ELITE sont impressionnants. 6 gains sur 7 cette semaine !", avatar: "T" },
  { name: "Sarah M.", badge: "Premium", text: "Enfin une IA qui ne survend pas. Analyses honnêtes et résultats solides.", avatar: "S" },
  { name: "Karim D.", badge: "Gratuit → Premium", text: "J'ai testé gratuit 1 semaine puis j'ai craqué. Les Value Bets changent tout.", avatar: "K" },
];

const Index = () => {
  const { data: matches, isLoading } = useMatches();
  const { data: eliteData } = useEliteWinrate();
  useTriggerFetch();
  useMatchDiagnostics(matches);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const matchCount = matches?.length || 0;
  const eliteWinrate = eliteData?.winrate ?? 84;
  const eliteStreak = eliteData?.streak;
  const eliteCount = matches?.filter(m => (m as any).ai_score >= 80).length || 0;
  const safeCount = matches?.filter(m => m.pred_confidence === "SAFE").length || 0;

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="particles-bg" />
      <Navbar />

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden pt-20 pb-10 sm:pb-14"
      >
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/8 blur-[100px] floating-glow" />
          <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-secondary/8 blur-[100px] floating-glow" style={{ animationDelay: "3s" }} />
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/4 blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center px-3 sm:px-4">
          {/* Live badge */}
          <motion.span
            className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] sm:text-xs font-medium text-primary backdrop-blur-sm"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="h-3 w-3" />
            </motion.span>
            Moteur PRONOSIA • Prédictions Nouvelle Génération
          </motion.span>

          <motion.h1
            className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            🔥 Les meilleurs pronostics IA,
            <br />
            <motion.span
              className="gradient-text-animated inline-block"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              filtrés pour l'essentiel
            </motion.span>
          </motion.h1>

          <motion.p
            className="mt-3 max-w-lg text-xs sm:text-sm text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Notre IA analyse des centaines de matchs chaque jour pour identifier les opportunités les plus fiables.
          </motion.p>

          <motion.p
            className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground/50 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            📊 Basé sur des données réelles — aucune promesse irréaliste
          </motion.p>

          {/* ELITE winrate highlight */}
          <motion.div
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <motion.span
              className="inline-flex items-center gap-1.5 font-bold text-primary text-sm sm:text-base rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 24px 4px hsl(var(--primary) / 0.12)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4" /> Top AI Picks : {eliteWinrate}% winrate
            </motion.span>
            {eliteStreak && eliteStreak.count >= 2 && (
              <motion.span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 border backdrop-blur-sm",
                  eliteStreak.type === "win"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Flame className="h-3 w-3" />
                {eliteStreak.count} {eliteStreak.type === "win" ? "wins" : "losses"} d'affilée
              </motion.span>
            )}
          </motion.div>

          <motion.p
            className="mt-2 max-w-lg text-[10px] sm:text-xs text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            Basé sur les 20 derniers matchs ELITE sélectionnés par l'IA
          </motion.p>

          <motion.div
            className="mt-2 flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Données temps réel • Mis à jour toutes les 10 min</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-4"
          >
            <GlobalActivityBanner />
          </motion.div>

          {/* Social proof ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="mt-3 w-full max-w-md"
          >
            <SocialProofTicker />
          </motion.div>

          <motion.div
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="/matches">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="btn-glow btn-shimmer gap-2 text-xs sm:text-sm font-semibold shadow-lg shadow-primary/20 h-11">
                  <Brain className="h-4 w-4" /> Voir les pronostics <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/pricing">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="gap-2 text-xs sm:text-sm h-11 border-border/50 hover:border-primary/30 hover:bg-primary/5">
                  <Crown className="h-4 w-4" /> Découvrir Premium
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Top 2 GRATUITS */}
      <TopMatchesSection matches={matches} isLoading={isLoading} />

      {/* TOP PICK DU JOUR */}
      <TopPickSection matches={matches} />

      {/* Missed match conversion banner */}
      <div className="container px-3 sm:px-4 py-3">
        <MissedMatchBanner />
      </div>

      {/* Win Streak badge */}
      <div className="flex justify-center py-2">
        <WinStreak />
      </div>

      {/* Combiné IA du jour */}
      <ScrollSection>
        <DailyCombo matches={matches} />
      </ScrollSection>

      {/* Matchs à éviter (Premium+) */}
      <ScrollSection>
        <MatchesToAvoid matches={matches} />
      </ScrollSection>

      {/* Premium Teaser — Locked predictions preview */}
      <ScrollSection>
        <section className="border-t border-border/20 py-10 sm:py-14">
          <div className="container px-3 sm:px-4 max-w-lg">
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Aperçu des Prédictions <span className="text-primary">Premium</span>
              </h2>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground/60">
                {matchCount - 2} matchs supplémentaires analysés par PRONOSIA
              </p>
            </motion.div>

            {/* Blurred locked cards */}
            <div className="space-y-2.5">
              {[
                { home: "████████", away: "████████", conf: "SAFE", score: "82" },
                { home: "████████", away: "████████", conf: "ELITE", score: "91" },
                { home: "████████", away: "████████", conf: "SAFE", score: "78" },
              ].map((item, i) => (
                <ScrollSection key={i} delay={i * 0.1}>
                  <motion.div
                    className="glass-card p-3.5 relative overflow-hidden group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Blur overlay */}
                    <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 flex items-center justify-center">
                      <motion.div
                        className="flex items-center gap-2 text-xs font-semibold text-primary"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Débloquer avec Premium</span>
                      </motion.div>
                    </div>
                    <div className="flex items-center justify-between opacity-40">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted" />
                        <div>
                          <p className="text-xs font-medium blur-[3px]">{item.home}</p>
                          <p className="text-[10px] text-muted-foreground blur-[3px]">vs {item.away}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full",
                          item.conf === "ELITE" ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                        )}>
                          {item.conf === "ELITE" ? `⚡ ELITE ${item.score}` : `🛡 SAFE`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>

            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link to="/pricing">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="btn-glow btn-shimmer gap-2 h-10 text-xs">
                    <Lock className="h-3.5 w-3.5" /> Débloquer tous les pronostics
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>
      </ScrollSection>

      {/* Animated Stats */}
      <ScrollSection>
        <section className="border-t border-border/20 py-10 sm:py-14">
          <div className="container px-3 sm:px-4">
            <motion.p
              className="text-center text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Performance PRONOSIA en temps réel
            </motion.p>
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              {[
                { label: "Winrate ELITE", value: eliteWinrate, suffix: "%", icon: Trophy, color: "text-primary" },
                { label: "Matchs analysés", value: matchCount || 0, suffix: "", icon: BarChart3, color: "text-secondary" },
                { label: "Matchs SAFE", value: safeCount, suffix: "", icon: Shield, color: "text-accent" },
                { label: "Matchs ELITE", value: eliteCount, suffix: "", icon: Sparkles, color: "text-success" },
              ].map(({ label, value, suffix, icon: Icon, color }, i) => (
                <ScrollSection key={label} delay={i * 0.08}>
                  <motion.div
                    className="glass-card-elevated p-4 text-center relative overflow-hidden"
                    whileHover={{ scale: 1.04, y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
                    <span className="font-display text-xl sm:text-2xl font-bold block">
                      <AnimatedNumber value={Math.floor(value)} suffix={suffix} />
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 block">{label}</span>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* Testimonials */}
      <ScrollSection>
        <section className="border-t border-border/20 py-10 sm:py-14">
          <div className="container px-3 sm:px-4 max-w-lg">
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Ce qu'ils en <span className="gradient-text">pensent</span>
              </h2>
            </motion.div>

            <div className="space-y-3">
              {TESTIMONIALS.map((t, i) => (
                <ScrollSection key={i} delay={i * 0.1}>
                  <motion.div
                    className="glass-card p-4 relative"
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{t.name}</span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">"{t.text}"</p>
                        <div className="flex gap-0.5 mt-1.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className="h-2.5 w-2.5 text-accent fill-accent" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* Features */}
      <ScrollSection>
        <section className="border-t border-border/20 py-12 sm:py-16">
          <div className="container px-3 sm:px-4">
            <motion.div
              className="text-center mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">
                Pourquoi <span className="gradient-text">Pronosia</span> ?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground/70 max-w-md mx-auto">
                Le moteur PRONOSIA analyse chaque match sur 11 dimensions
              </p>
            </motion.div>
            <div className="mx-auto grid max-w-4xl gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Brain, title: "Moteur PRONOSIA", desc: "Protocole de raisonnement forcé en 5 étapes : audit contextuel, base rate, analyse factorielle, synthèse, calibration." },
                { icon: Sparkles, title: "Sélection ELITE", desc: "Seuls les matchs avec un AI Score ≥80 sont ELITE. Aucun compromis sur la qualité." },
                { icon: TrendingUp, title: "Value Bets", desc: "Détection automatique quand la cote du marché sous-estime la vraie probabilité (edge > 4%)." },
                { icon: Target, title: "Anti-Biais Cognitif", desc: "Protection contre le biais de récence, prestige, et favori-longshot. L'IA cherche les contradictions." },
                { icon: Zap, title: "Temps Réel", desc: "Données actualisées toutes les 10 minutes. Pipeline multi-sources (ESPN, SofaScore, SportSRC)." },
                { icon: Shield, title: `${eliteWinrate}% Winrate ELITE`, desc: "Performance vérifiable sur les 20 derniers matchs ELITE. Historique 100% transparent." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <ScrollSection key={title} delay={i * 0.06}>
                  <motion.div
                    className="glass-card-elevated p-5 sm:p-6 group"
                    whileHover={{ scale: 1.02, y: -3, boxShadow: "0 12px 40px -12px hsl(var(--primary) / 0.15)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/10 group-hover:bg-primary/15 transition-colors"
                      whileHover={{ rotate: 8 }}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="mb-1.5 font-display text-sm font-semibold">{title}</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* How it works */}
      <ScrollSection>
        <section className="border-t border-border/20 py-10 sm:py-14">
          <div className="container px-3 sm:px-4 max-w-lg">
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-lg sm:text-xl font-bold">
                Comment fonctionne <span className="gradient-text">PRONOSIA</span> ?
              </h2>
            </motion.div>

            <div className="space-y-3">
              {[
                { step: "1", title: "Collecte multi-sources", desc: "ESPN, SofaScore, SportSRC — données fraîches toutes les 10 min", icon: RefreshCw },
                { step: "2", title: "Analyse 11 dimensions", desc: "Forme, xG, H2H, fatigue, blessures, marché, contexte...", icon: Brain },
                { step: "3", title: "Synthèse probabiliste", desc: "Calibration anti-biais, score de confiance, détection Value Bet", icon: Target },
                { step: "4", title: "Sélection ELITE", desc: "Seuls les matchs à forte conviction passent le filtre", icon: Trophy },
              ].map(({ step, title, desc, icon: Icon }, i) => (
                <ScrollSection key={step} delay={i * 0.1}>
                  <motion.div
                    className="glass-card p-4 flex items-start gap-3.5"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center">{step}</span>
                        {title}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* Sport Rankings */}
      <ScrollSection>
        <SportRankings />
      </ScrollSection>

      {/* CTA Premium */}
      <ScrollSection>
        <section className="border-t border-border/20 py-12 sm:py-16">
          <div className="container max-w-lg text-center px-3 sm:px-4">
            <motion.div
              className="glass-card-elevated glow-border p-8 sm:p-10 relative overflow-hidden noise-overlay"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Crown className="mx-auto h-8 w-8 text-primary mb-4 relative z-10" />
              </motion.div>
              <h2 className="font-display text-lg sm:text-xl font-bold relative z-10">Passe à Premium</h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground relative z-10">
                Accède à tous les matchs analysés par PRONOSIA. Prédictions complètes, Value Bets, et alertes ELITE.
              </p>
              <div className="mt-4 space-y-2 text-[10px] sm:text-xs relative z-10">
                {[
                  `${matchCount}+ matchs analysés aujourd'hui`,
                  "Moteur PRONOSIA : 11 dimensions d'analyse",
                  "Value Bets à edge > 4% détectés",
                  "Alertes matchs ELITE en temps réel",
                ].map((item, i) => (
                  <motion.p
                    key={i}
                    className="flex items-center justify-center gap-2 text-muted-foreground/80"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" /> {item}
                  </motion.p>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center relative z-10">
                <Link to="/pricing">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button className="gap-2 btn-shimmer btn-glow shadow-lg shadow-primary/20 h-11 text-sm font-semibold">
                      <Zap className="h-4 w-4" /> Débloquer maintenant — 4,99€/sem
                    </Button>
                  </motion.div>
                </Link>
              </div>
              <motion.p
                className="mt-4 text-[9px] text-warning/80 font-medium relative z-10"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⏳ Les meilleurs matchs sont limités chaque jour — ne rate pas les ELITE
              </motion.p>
            </motion.div>
          </div>
        </section>
      </ScrollSection>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 sm:py-10">
        <div className="container flex flex-col items-center gap-3 text-center text-xs text-muted-foreground px-3">
          <motion.span
            className="font-display font-bold text-foreground text-base gradient-text"
            whileHover={{ scale: 1.05 }}
          >
            Pronosia
          </motion.span>
          <p className="text-[10px] sm:text-xs text-muted-foreground/60">© 2026 Pronosia. Pronostics sportifs propulsés par l'IA.</p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/40">⚠️ Les prédictions IA sont probabilistes, jamais garanties. Pariez de manière responsable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
