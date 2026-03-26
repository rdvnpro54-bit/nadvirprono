import { Link } from "react-router-dom";
import { Zap, TrendingUp, Shield, BarChart3, ChevronRight, Star, RefreshCw, Brain, Sparkles, Flame, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { TopMatchesSection } from "@/components/home/TopMatchesSection";
import { TopPickSection } from "@/components/home/TopPickSection";
import { GlobalActivityBanner } from "@/components/home/GlobalActivityBanner";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { useEliteWinrate } from "@/hooks/useResults";
import { useMatchDiagnostics } from "@/hooks/useMatchLifecycle";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
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

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="particles-bg" />
      <Navbar />

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden pt-20 pb-12 sm:pb-16"
      >
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/8 blur-[100px] floating-glow" />
          <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-secondary/8 blur-[100px] floating-glow" style={{ animationDelay: "3s" }} />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center px-3 sm:px-4">
          <motion.span
            className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] sm:text-xs font-medium text-primary backdrop-blur-sm"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="h-3 w-3" />
            </motion.span>
            Sélection Intelligente • IA Nouvelle Génération
          </motion.span>

          <motion.h1
            className="font-display text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Pronostics Sportifs
            <br />
            <motion.span
              className="gradient-text-animated inline-block"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Propulsés par l'IA
            </motion.span>
          </motion.h1>

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
            <span>Données temps réel • Mis à jour toutes les 15 min</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-4"
          >
            <GlobalActivityBanner />
          </motion.div>

          <motion.div
            className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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
              Statistiques en temps réel
            </motion.p>
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              {[
                { label: "Winrate ELITE", value: eliteWinrate, suffix: "%", icon: Sparkles, color: "text-primary" },
                { label: "Matchs analysés", value: matchCount || 0, suffix: "", icon: BarChart3, color: "text-secondary" },
                { label: "Sports couverts", value: 12, suffix: "", icon: Star, color: "text-accent" },
                { label: "Matchs ELITE", value: eliteCount, suffix: "", icon: Zap, color: "text-success" },
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
                Une technologie de prédiction sportive de nouvelle génération
              </p>
            </motion.div>
            <div className="mx-auto grid max-w-4xl gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Brain, title: "IA Multi-Dimension", desc: "11 facteurs analysés : forme, xG, blessures, H2H, fatigue, marché, contexte et plus encore." },
                { icon: Sparkles, title: "Sélection ELITE", desc: "Seuls les matchs avec un AI Score élevé sont mis en avant. Qualité > quantité." },
                { icon: TrendingUp, title: "Value Bets", desc: "Détection automatique des cotes sous-évaluées par les bookmakers." },
                { icon: BarChart3, title: "12 Sports", desc: "Football, NBA, NFL, MMA, Hockey, F1, Handball, Rugby, Volleyball, Baseball, AFL et Basketball." },
                { icon: Zap, title: "Temps Réel", desc: "Données actualisées toutes les 15 minutes. Opportunités détectées automatiquement." },
                { icon: Shield, title: `${eliteWinrate}% Winrate ELITE`, desc: "Performance vérifiable sur les 20 derniers matchs ELITE. Historique transparent." },
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
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="mx-auto h-8 w-8 text-primary mb-4 relative z-10" />
              </motion.div>
              <h2 className="font-display text-lg sm:text-xl font-bold relative z-10">Passe à Premium</h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground relative z-10">
                Accès prioritaire aux matchs ELITE uniquement. Analyses complètes et prédictions avancées.
              </p>
              <div className="mt-4 space-y-2 text-[10px] sm:text-xs text-muted-foreground/80 relative z-10">
                <p>✔ +{matchCount} matchs analysés aujourd'hui</p>
                <p>✔ IA basée sur 11 dimensions réelles</p>
                <p>✔ Sélection automatique des meilleurs matchs</p>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center relative z-10">
                <Link to="/pricing">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button className="gap-2 btn-shimmer btn-glow shadow-lg shadow-primary/20 h-11">
                      <Zap className="h-4 w-4" /> À partir de 9,90€/semaine
                    </Button>
                  </motion.div>
                </Link>
              </div>
              <motion.p
                className="mt-4 text-[9px] text-warning/80 font-medium relative z-10"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⏳ Les meilleurs matchs sont limités chaque jour
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
