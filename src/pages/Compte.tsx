import { Navbar } from "@/components/layout/Navbar";
import { User, Zap, CreditCard, LogOut, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Compte() {
  const { user, isPremium, subscription, signOut, checkSubscription, loading } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if returning from checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Paiement réussi ! Bienvenue Premium 🎉");
      checkSubscription();
    }
  }, [searchParams, checkSubscription]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnecté");
  };

  const planLabel = isPremium
    ? subscription.productId === STRIPE_PLANS.weekly.productId
      ? "Premium Hebdo"
      : "Premium Mensuel"
    : "Gratuit";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-lg pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Mon Compte</h1>
        </motion.div>

        {!user ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 glass-card p-6 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Non connecté</p>
            <p className="mt-1 text-xs text-muted-foreground">Connecte-toi pour accéder à ton compte.</p>
            <Link to="/login" className="mt-4 block">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 glass-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">{user.email}</p>
                  <p className="text-[11px] text-muted-foreground">Membre Pronosia</p>
                </div>
              </div>
            </motion.div>

            {/* Subscription status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-3 glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Statut</p>
                  <p className="text-[11px] text-muted-foreground">{planLabel}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${isPremium ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {isPremium ? "PREMIUM" : "FREE"}
                </span>
              </div>

              {isPremium && subscription.subscriptionEnd && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Expire le {new Date(subscription.subscriptionEnd).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}

              {!isPremium && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-[11px] text-muted-foreground">3 matchs gratuits / jour</p>
                  <Link to="/pricing" className="mt-3 block">
                    <Button size="sm" className="w-full gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Passer Premium
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-3 space-y-2">
              {isPremium && (
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={handlePortal} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Gérer l'abonnement
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>
            </motion.div>

            {/* Refresh */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
              <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground" onClick={checkSubscription}>
                Vérifier le statut d'abonnement
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
