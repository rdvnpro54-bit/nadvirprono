import { Link } from "react-router-dom";
import { Brain, Zap, TrendingUp, Shield, BarChart3, ChevronRight, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { generateDailyMatches, aiPerformanceStats } from "@/data/simulatedData";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Index = () => {
  const matches = generateDailyMatches().slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center">
          <motion.div {...fadeUp}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" /> Intelligence Artificielle de Nouvelle Génération
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Pronostics Sportifs
            <br />
            <span className="gradient-text">Propulsés par l'IA</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Notre IA analyse des milliers de variables en temps réel pour vous livrer les pronostics
            les plus fiables du marché. +12 000 prédictions analysées avec{" "}
            <span className="font-semibold text-primary">{aiPerformanceStats.overallAccuracy}% de réussite</span>.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/matches">
              <Button size="lg" className="gap-2 text-base font-semibold">
                <Brain className="h-5 w-5" /> Voir les pronostics
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                Découvrir Premium <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {[
              { label: "Précision IA", value: `${aiPerformanceStats.overallAccuracy}%`, icon: TrendingUp },
              { label: "Prédictions", value: aiPerformanceStats.totalPredictions.toLocaleString(), icon: BarChart3 },
              { label: "Série en cours", value: `${aiPerformanceStats.streakWins} W`, icon: Zap },
              { label: "ROI mensuel", value: `+${aiPerformanceStats.monthlyROI}%`, icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass-card flex flex-col items-center gap-2 p-4">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-display text-2xl font-bold">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Preview matches */}
      <section className="border-t border-border/50 py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold">
              Pronostics du <span className="gradient-text">Jour</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Aperçu des meilleures prédictions générées par notre IA
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m, i) => (
              <MatchCard key={m.id} match={m} index={i} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/matches">
              <Button variant="outline" size="lg" className="gap-2">
                Voir tous les matchs <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            Pourquoi <span className="gradient-text">Nadvir AI</span> ?
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, title: "IA Multi-Couches", desc: "Modèles statistiques, machine learning et réseaux neuronaux combinés pour une précision maximale." },
              { icon: Shield, title: "Niveau de Confiance", desc: "Chaque pronostic est classé SAFE, MODÉRÉ ou RISQUÉ pour une gestion optimale de votre bankroll." },
              { icon: TrendingUp, title: "Détection Value Bets", desc: "Notre IA détecte les cotes sous-évaluées par les bookmakers pour maximiser vos gains." },
              { icon: BarChart3, title: "Analyses Détaillées", desc: "Statistiques avancées, forme récente, blessures, classements — tout est analysé." },
              { icon: Zap, title: "Multi-Sports", desc: "Football, Tennis, Basketball — des prédictions couvrant les plus grands championnats." },
              { icon: Star, title: "Transparence Totale", desc: "Historique de performance IA accessible à tous. Pas de promesses irréalistes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 transition-all hover:border-primary/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-t border-border/50 py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            Choisissez votre <span className="gradient-text">Plan</span>
          </h2>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="glass-card flex flex-col p-6">
              <h3 className="font-display text-xl font-bold">Gratuit</h3>
              <p className="mt-1 text-muted-foreground text-sm">Pour découvrir l'IA</p>
              <p className="mt-4 font-display text-4xl font-extrabold">0€<span className="text-lg font-normal text-muted-foreground">/mois</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {["1 pronostic détaillé / jour", "Matchs du jour (aperçu)", "Statistiques basiques"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/matches" className="mt-6">
                <Button variant="outline" className="w-full">Commencer</Button>
              </Link>
            </div>
            {/* Premium */}
            <div className="glass-card flex flex-col p-6 glow-border relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                POPULAIRE
              </span>
              <h3 className="font-display text-xl font-bold">Premium</h3>
              <p className="mt-1 text-muted-foreground text-sm">Accès illimité à l'IA</p>
              <p className="mt-4 font-display text-4xl font-extrabold">29€<span className="text-lg font-normal text-muted-foreground">/mois</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {[
                  "Pronostics illimités",
                  "Analyses détaillées complètes",
                  "Détection Value Bets",
                  "Filtres avancés (SAFE, etc.)",
                  "Alertes personnalisées",
                  "Combinés intelligents",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="mt-6">
                <Button className="w-full gap-2">
                  <Zap className="h-4 w-4" /> Passer Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground">Nadvir AI</span>
          </div>
          <p>© 2026 Nadvir AI. Plateforme de pronostics sportifs propulsée par l'intelligence artificielle.</p>
          <p className="text-xs">Les pronostics sont fournis à titre informatif. Pariez de manière responsable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
