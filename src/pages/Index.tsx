import { Link } from "react-router-dom";
import { Zap, TrendingUp, Shield, BarChart3, ChevronRight, Star, RefreshCw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { TopMatchesSection } from "@/components/home/TopMatchesSection";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// ─── Animated Counter ──────────────────────────────────────
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

// ─── Scroll-triggered section ──────────────────────────────
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
  useTriggerFetch();

  const matchCount = matches?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center">
          <motion.span
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Zap className="h-3 w-3" /> IA Prédictive de Nouvelle Génération
          </motion.span>

          <motion.h1
            className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Pronostics Sportifs
            <br />
            <motion.span
              className="gradient-text inline-block"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Propulsés par l'IA
            </motion.span>
          </motion.h1>

          <motion.p
            className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Notre moteur IA hybride analyse des centaines de variables par match.{" "}
            <span className="font-semibold text-primary">82% de réussite</span> vérifiée.
          </motion.p>

          <motion.div
            className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Données temps réel • Mis à jour toutes les 15 min</span>
          </motion.div>

          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/matches">
              <Button size="lg" className="gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Brain className="h-4 w-4" /> Voir les pronostics
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="gap-2 text-sm transition-all duration-200 hover:scale-105">
                Découvrir Premium <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {[
              { label: "Précision IA", value: 82, suffix: "%", icon: TrendingUp },
              { label: "Matchs analysés", value: matchCount || 257, suffix: "", icon: BarChart3 },
              { label: "Sports couverts", value: 12, suffix: "", icon: Star },
              { label: "ROI mensuel", value: 14.2, suffix: "%", icon: Shield, prefix: "+" },
            ].map(({ label, value, suffix, icon: Icon, prefix }, i) => (
              <motion.div
                key={label}
                className="glass-card flex flex-col items-center gap-1.5 p-3 transition-all duration-200 hover:scale-105 hover:border-primary/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-display text-xl font-bold">
                  {prefix || ""}<AnimatedNumber value={Math.floor(value)} suffix={suffix} />
                </span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Top 3 */}
      <ScrollSection>
        <section className="border-t border-border/30 py-12">
          <div className="container">
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl font-bold">
                🔥 Top 3 Pronostics <span className="gradient-text">du Jour</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les meilleures prédictions IA multi-sport
              </p>
            </div>

            {isLoading ? (
              <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topMatches.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    className="group"
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  >
                    <div className="transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary/10 rounded-xl">
                      <MatchCard match={m} index={i} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/matches">
                <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105">
                  Voir tous les matchs <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* Features */}
      <ScrollSection>
        <section className="border-t border-border/30 py-12">
          <div className="container">
            <h2 className="mb-8 text-center font-display text-2xl font-bold">
              Pourquoi <span className="gradient-text">Pronosia</span> ?
            </h2>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Brain, title: "IA Hybride Multi-Sport", desc: "Moteur de pondération dynamique adaptatif selon la qualité et la disponibilité des données." },
                { icon: Shield, title: "Confiance Calibrée", desc: "SAFE, MODÉRÉ ou RISQUÉ. La confiance diminue automatiquement si les données sont insuffisantes." },
                { icon: TrendingUp, title: "Value Bets", desc: "Détection automatique des cotes sous-évaluées par les bookmakers." },
                { icon: BarChart3, title: "12 Sports", desc: "Football, NBA, NFL, MMA, Hockey, F1, Handball, Rugby, Volleyball, Baseball, AFL et Basketball." },
                { icon: Zap, title: "Temps Réel", desc: "Données actualisées toutes les 15 minutes. Pronostics toujours frais." },
                { icon: Star, title: "82% de Réussite", desc: "Performance IA vérifiable. Historique transparent et accessible." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <ScrollSection key={title} delay={i * 0.08}>
                  <div className="glass-card p-5 transition-all duration-200 hover:border-primary/30 hover:scale-[1.02] hover:shadow-md">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="mb-1 font-display text-sm font-semibold">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* CTA Premium */}
      <ScrollSection>
        <section className="border-t border-border/30 py-12">
          <div className="container max-w-lg text-center">
            <motion.div
              className="glass-card glow-border p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Zap className="mx-auto h-8 w-8 text-primary mb-3" />
              <h2 className="font-display text-xl font-bold">Passe à Premium</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Débloque toutes les prédictions, analyses complètes et matchs haute confiance.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to="/pricing">
                  <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                    <Zap className="h-4 w-4" /> À partir de 9,90€/semaine
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </ScrollSection>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col items-center gap-3 text-center text-xs text-muted-foreground">
          <span className="font-display font-bold text-foreground text-sm">Pronosia</span>
          <p>© 2026 Pronosia. Pronostics sportifs propulsés par l'IA.</p>
          <p className="text-[10px]">Les pronostics sont fournis à titre informatif. Pariez de manière responsable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
