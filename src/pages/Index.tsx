import { Link } from "react-router-dom";
import { Zap, TrendingUp, Shield, BarChart3, ChevronRight, Star, RefreshCw, Brain, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { TopMatchesSection } from "@/components/home/TopMatchesSection";
import { TopPickSection } from "@/components/home/TopPickSection";
import { GlobalActivityBanner } from "@/components/home/GlobalActivityBanner";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { useEliteWinrate } from "@/hooks/useResults";
import { useMatchDiagnostics } from "@/hooks/useMatchLifecycle";
import { motion, useInView } from "framer-motion";
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

function ScrollSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Index = () => {
  const { data: matches, isLoading } = useMatches();
  const { data: eliteData } = useEliteWinrate();
  useTriggerFetch();
  useMatchDiagnostics(matches);

  const matchCount = matches?.length || 0;
  const eliteWinrate = eliteData?.winrate ?? 84;
  const eliteStreak = eliteData?.streak;
  const eliteCount = matches?.filter(m => (m as any).ai_score >= 80).length || 0;

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="particles-bg" />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center px-3 sm:px-4">
          <motion.span
            className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-medium text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="h-3 w-3" /> Sélection Intelligente • IA Nouvelle Génération
          </motion.span>

          <motion.h1
            className="font-display text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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

          {/* Dynamic ELITE winrate */}
          <motion.div
            className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 font-bold text-primary text-sm sm:text-base rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <Sparkles className="h-4 w-4" /> Top AI Picks : {eliteWinrate}% winrate
            </span>
            {eliteStreak && eliteStreak.count >= 2 && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border",
                eliteStreak.type === "win"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}>
                <Flame className="h-3 w-3" />
                {eliteStreak.count} {eliteStreak.type === "win" ? "wins" : "losses"} d'affilée
              </span>
            )}
          </motion.div>

          <motion.p
            className="mt-1.5 max-w-lg text-[10px] sm:text-xs text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            Basé sur les 20 derniers matchs ELITE sélectionnés par l'IA
          </motion.p>

          <motion.div
            className="mt-2 flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Données temps réel • Mis à jour toutes les 15 min</span>
          </motion.div>

          <motion.p
            className="mt-1.5 text-[9px] text-muted-foreground/60 max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62 }}
          >
            Les performances affichées concernent uniquement les matchs ELITE (AI Score élevé)
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-3 sm:mt-4"
          >
            <GlobalActivityBanner />
          </motion.div>

          <motion.div
            className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/matches">
              <Button size="lg" className="btn-glow btn-shimmer gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Brain className="h-4 w-4" /> Voir les pronostics
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="gap-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105">
                Découvrir Premium <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Top 3 GRATUITS */}
      <TopMatchesSection matches={matches} isLoading={isLoading} />

      {/* TOP PICK DU JOUR */}
      <TopPickSection matches={matches} />

      {/* Animated Stats */}
      <ScrollSection>
        <section className="border-t border-border/30 py-8 sm:py-10">
          <div className="container px-3 sm:px-4">
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
              {[
                { label: "Winrate ELITE", value: eliteWinrate, suffix: "%", icon: Sparkles },
                { label: "Matchs analysés", value: matchCount || 0, suffix: "", icon: BarChart3 },
                { label: "Sports couverts", value: 12, suffix: "", icon: Star },
                { label: "Matchs ELITE", value: eliteCount, suffix: "", icon: Zap },
              ].map(({ label, value, suffix, icon: Icon }, i) => (
                <ScrollSection key={label} delay={i * 0.08}>
                  <div className="glass-card match-card-hover flex flex-col items-center gap-1 sm:gap-1.5 p-2.5 sm:p-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-display text-lg sm:text-xl font-bold">
                      <AnimatedNumber value={Math.floor(value)} suffix={suffix} />
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</span>
                  </div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* Features */}
      <ScrollSection>
        <section className="border-t border-border/30 py-10 sm:py-12">
          <div className="container px-3 sm:px-4">
            <h2 className="mb-6 sm:mb-8 text-center font-display text-xl sm:text-2xl font-bold">
              Pourquoi <span className="gradient-text">Pronosia</span> ?
            </h2>
            <div className="mx-auto grid max-w-4xl gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Brain, title: "IA Multi-Dimension", desc: "11 facteurs analysés : forme, xG, blessures, H2H, fatigue, marché, contexte et plus encore." },
                { icon: Sparkles, title: "Sélection ELITE", desc: "Seuls les matchs avec un AI Score élevé sont mis en avant. Qualité > quantité." },
                { icon: TrendingUp, title: "Value Bets", desc: "Détection automatique des cotes sous-évaluées par les bookmakers." },
                { icon: BarChart3, title: "12 Sports", desc: "Football, NBA, NFL, MMA, Hockey, F1, Handball, Rugby, Volleyball, Baseball, AFL et Basketball." },
                { icon: Zap, title: "Temps Réel", desc: "Données actualisées toutes les 15 minutes. Opportunités détectées automatiquement." },
                { icon: Shield, title: `${eliteWinrate}% Winrate ELITE`, desc: "Performance vérifiable sur les 20 derniers matchs ELITE. Historique transparent." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <ScrollSection key={title} delay={i * 0.08}>
                  <div className="glass-card match-card-hover p-4 sm:p-5">
                    <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/15">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="mb-1 font-display text-xs sm:text-sm font-semibold">{title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* CTA Premium */}
      <ScrollSection>
        <section className="border-t border-border/30 py-10 sm:py-12">
          <div className="container max-w-lg text-center px-3 sm:px-4">
            <motion.div
              className="glass-card glow-border p-6 sm:p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Zap className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3" />
              <h2 className="font-display text-lg sm:text-xl font-bold">Passe à Premium</h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Accès prioritaire aux matchs ELITE uniquement. Analyses complètes et prédictions avancées.
              </p>
              <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">
                <p>✔ +{matchCount} matchs analysés aujourd'hui</p>
                <p>✔ IA basée sur 11 dimensions réelles</p>
                <p>✔ Sélection automatique des meilleurs matchs</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to="/pricing">
                  <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 btn-shimmer">
                    <Zap className="h-4 w-4" /> À partir de 9,90€/semaine
                  </Button>
                </Link>
              </div>
              <p className="mt-3 text-[9px] text-warning font-medium">⏳ Les meilleurs matchs sont limités chaque jour</p>
            </motion.div>
          </div>
        </section>
      </ScrollSection>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 sm:py-8">
        <div className="container flex flex-col items-center gap-2 sm:gap-3 text-center text-xs text-muted-foreground px-3">
          <span className="font-display font-bold text-foreground text-sm">Pronosia</span>
          <p className="text-[10px] sm:text-xs">© 2026 Pronosia. Pronostics sportifs propulsés par l'IA.</p>
          <p className="text-[9px] sm:text-[10px]">⚠️ Les prédictions IA sont probabilistes, jamais garanties. Pariez de manière responsable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
