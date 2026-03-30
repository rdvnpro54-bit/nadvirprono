import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
      } else {
        setSuccess(true);
        toast.success("Mot de passe mis à jour !");
        setTimeout(() => navigate("/compte"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container flex min-h-screen items-center justify-center pt-14">
          <div className="glass-card p-6 max-w-sm w-full text-center">
            <h1 className="font-display text-xl font-bold mb-2">Lien invalide</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container flex min-h-screen items-center justify-center pt-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-sm w-full text-center"
          >
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <h1 className="font-display text-xl font-bold mb-2">Mot de passe mis à jour !</h1>
            <p className="text-sm text-muted-foreground">Redirection en cours...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <Navbar />
      <div className="container flex min-h-screen items-center justify-center pt-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card p-6">
            <div className="mb-6 text-center">
              <motion.div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img src="/pronosia-p-logo.png" alt="Pronosia logo" className="h-full w-full object-cover" />
              </motion.div>
              <h1 className="font-display text-xl font-bold">Nouveau mot de passe</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choisis un nouveau mot de passe sécurisé
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-muted/50 pl-9 h-9 text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-muted/50 pl-9 h-9 text-sm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button className="w-full gap-2 h-9 text-sm btn-shimmer" type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Mettre à jour le mot de passe
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
