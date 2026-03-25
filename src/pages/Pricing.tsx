import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function UrgencyTimer() {
  const [mins, setMins] = useState(Math.floor(Math.random() * 20) + 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setMins(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (mins <= 0) return null;

  return (
    <span className="flex items-center gap-1.5 text-warning text-xs font-medium">
      <Clock className="h-3.5 w-3.5" /> ⏳ Offre disponible encore {mins} min
    </span>
  );
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-3xl pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Débloquez <span className="gradient-text">Pronosia</span> Premium
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Accédez à toutes les prédictions IA et analyses complètes.
          </p>
          <div className="mt-3 flex justify-center">
            <UrgencyTimer />
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col p-6"
          >
            <h2 className="font-display text-lg font-bold">Gratuit</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Pour découvrir</p>
            <p className="mt-4 font-display text-3xl font-extrabold">0€</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {["3 matchs gratuits / jour", "Aperçu des prédictions", "Dashboard basique"].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-5 w-full">Plan Actuel</Button>
          </motion.div>

          {/* Weekly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card flex flex-col p-6"
          >
            <h2 className="font-display text-lg font-bold">Hebdo</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">7 jours d'accès</p>
            <p className="mt-4 font-display text-3xl font-extrabold">9,90€<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {[
                "Prédictions illimitées",
                "Analyses détaillées",
                "Value Bets",
                "12 sports couverts",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-5 w-full gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Essayer 7 jours
            </Button>
          </motion.div>

          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col p-6 glow-border relative"
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
              ⚡ MEILLEUR CHOIX
            </span>
            <h2 className="font-display text-lg font-bold">Mensuel</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">30 jours d'accès</p>
            <p className="mt-4 font-display text-3xl font-extrabold">29,90€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {[
                "Tout l'accès Hebdo",
                "Alertes personnalisées",
                "Matchs haute confiance",
                "Filtres avancés",
                "Support prioritaire",
                "Économisez 40%",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-5 w-full gap-1.5 text-sm font-semibold">
              <Zap className="h-3.5 w-3.5" /> Passer Premium
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-12"
        >
          <h2 className="mb-6 text-center font-display text-xl font-bold">Questions Fréquentes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre moteur hybride combine pondération dynamique, normalisation 0→1 et features sport-spécifiques pour analyser chaque match." },
              { q: "Taux de réussite ?", a: "82% de réussite globale, avec une confiance calibrée automatiquement selon la qualité des données." },
              { q: "Annulation possible ?", a: "Oui, sans engagement. Annulez à tout moment depuis votre compte." },
              { q: "Quels sports ?", a: "Football, NBA, NFL, MMA, Hockey, F1, Handball, Rugby, Volleyball, Baseball, AFL et Basketball." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card p-4">
                <h3 className="font-semibold text-xs mb-1">{q}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
