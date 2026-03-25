import { Navbar } from "@/components/layout/Navbar";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Suivis() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">
            Mes <span className="gradient-text">Suivis</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Tes prédictions suivies apparaîtront ici.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col items-center text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold">Aucun match suivi</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Clique sur l'étoile ☆ d'un match pour le suivre et recevoir des alertes.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
