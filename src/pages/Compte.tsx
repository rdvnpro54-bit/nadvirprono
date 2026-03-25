import { Navbar } from "@/components/layout/Navbar";
import { User, Zap, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Compte() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-lg pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Mon Compte</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">Utilisateur</p>
              <p className="text-sm text-muted-foreground">Non connecté</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Statut</p>
              <p className="text-xs text-muted-foreground">Plan Gratuit</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">FREE</span>
          </div>
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">3 matchs gratuits / jour</p>
          </div>
          <Link to="/pricing" className="mt-4 block">
            <Button className="w-full gap-2">
              <Zap className="h-4 w-4" /> Passer Premium
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 space-y-2"
        >
          <Link to="/login">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <User className="h-4 w-4" /> Se connecter
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <CreditCard className="h-4 w-4" /> Gérer l'abonnement
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
