import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Brain, Shield, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-4xl font-extrabold">
            Débloquez la puissance de <span className="gradient-text">Nadvir AI</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choisissez le plan qui vous convient et commencez à gagner.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col p-8"
          >
            <h2 className="font-display text-2xl font-bold">Gratuit</h2>
            <p className="mt-1 text-muted-foreground">Idéal pour découvrir</p>
            <p className="mt-6 font-display text-5xl font-extrabold">0€<span className="text-lg font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-8 flex-1 space-y-4">
              {[
                "1 pronostic détaillé par jour",
                "Aperçu des matchs du jour",
                "Statistiques globales IA",
                "Accès Dashboard basique",
              ].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="mt-8 w-full">
              Plan Actuel
            </Button>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card flex flex-col p-8 glow-border relative"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1 text-xs font-bold text-primary-foreground">
              ⚡ RECOMMANDÉ
            </span>
            <h2 className="font-display text-2xl font-bold">Premium</h2>
            <p className="mt-1 text-muted-foreground">Accès complet à l'IA</p>
            <p className="mt-6 font-display text-5xl font-extrabold">29€<span className="text-lg font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-8 flex-1 space-y-4">
              {[
                "Pronostics illimités",
                "Analyses détaillées complètes",
                "Détection Value Bets automatique",
                "Filtres avancés (SAFE, MODÉRÉ, RISQUÉ)",
                "Alertes personnalisées en temps réel",
                "Combinés intelligents générés par l'IA",
                "Historique complet de performance",
                "Support prioritaire",
              ].map(f => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full gap-2 text-base font-semibold">
              <Zap className="h-5 w-5" /> Passer Premium
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Annulation possible à tout moment. Sans engagement.
            </p>
          </motion.div>
        </div>

        {/* FAQ-like section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="mb-8 text-center font-display text-2xl font-bold">Questions Fréquentes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre IA combine modèles statistiques (Poisson), machine learning (Gradient Boosting) et réseaux neuronaux pour analyser des milliers de variables par match." },
              { q: "Quel est le taux de réussite ?", a: "Notre IA affiche 78.4% de réussite globale, avec 89.1% sur les pronostics classés SAFE. Ces chiffres sont vérifiables dans l'historique." },
              { q: "Puis-je annuler à tout moment ?", a: "Oui, l'abonnement Premium est sans engagement. Vous pouvez annuler depuis votre profil à tout moment." },
              { q: "Quels sports sont couverts ?", a: "Football (Top 5 ligues européennes), Tennis (ATP/WTA) et Basketball (NBA), avec d'autres sports à venir." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card p-5">
                <h3 className="font-semibold text-sm mb-2">{q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
