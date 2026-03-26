import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Zap, Shield, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/compte");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message || "Erreur lors de l'inscription");
        } else {
          toast.success("Compte créé ! Vérifie ton email pour confirmer.");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Erreur de connexion");
        } else {
          toast.success("Connecté !");
          navigate("/matches");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <Navbar />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-secondary/5 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container flex min-h-screen items-center justify-center pt-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card p-6 relative overflow-hidden">
            {/* Subtle shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />

            <div className="mb-6 text-center relative z-10">
              <motion.div 
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl font-bold text-primary">P</span>
              </motion.div>
              <motion.h1 
                className="font-display text-xl font-bold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isRegister ? "Créer un compte" : "Connexion"}
              </motion.h1>
              <motion.p 
                className="mt-0.5 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isRegister ? "Rejoins Pronosia" : "Accède à tes pronostics IA"}
              </motion.p>
            </div>

            <form className="space-y-3 relative z-10" onSubmit={handleSubmit}>
              <motion.div 
                className="space-y-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@email.com"
                    className="bg-muted/50 pl-9 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>
              <motion.div 
                className="space-y-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-muted/50 pl-9 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button className="w-full gap-2 h-9 text-sm btn-shimmer" type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isRegister ? "Créer mon compte" : "Se connecter"}
                </Button>
              </motion.div>
            </form>

            {/* Features reminder */}
            <motion.div 
              className="mt-4 flex items-center justify-center gap-3 text-[9px] text-muted-foreground relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary" /> IA avancée</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-400" /> Sécurisé</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-400" /> Temps réel</span>
            </motion.div>

            <motion.div 
              className="mt-3 text-center relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
