import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Zap, CheckCircle, Lock } from "lucide-react";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!user) {
      onOpenChange(false);
      navigate("/login");
      return;
    }
    setLoading(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée, reconnecte-toi");
        navigate("/login");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement manquante");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erreur lors du paiement. Réessaie.");
    } finally {
      setLoading(null);
    }
  };

  if (isPremium) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-primary/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">✅ Tu es Premium !</DialogTitle>
            <DialogDescription className="text-center">
              Tu as déjà accès à toutes les prédictions IA.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => { onOpenChange(false); navigate("/matches"); }} className="w-full">
            Voir les pronostics
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/20 max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            {user ? <Zap className="h-6 w-6 text-primary" /> : <Lock className="h-6 w-6 text-primary" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {user ? "🚀 Débloque tous les pronostics" : "🔒 Accès Premium requis"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {user
                ? "Accède aux prédictions IA complètes, value bets et analyses en temps réel."
                : "Crée un compte gratuit pour accéder aux pronostics IA."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {/* Features */}
          <ul className="space-y-2">
            {["Pronostics IA complets", "Value bets détectés", "Score prédit & confiance", "Analyses en temps réel"].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {user ? (
            <div className="space-y-2">
              <Button
                onClick={() => handleCheckout(STRIPE_PLANS.monthly.priceId, "monthly")}
                disabled={loading === "monthly"}
                className="w-full h-11 text-sm font-bold gap-2 bg-primary hover:bg-primary/90 btn-shimmer"
              >
                {loading === "monthly" ? (
                  <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Premium Mensuel — 29,90€/mois
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCheckout(STRIPE_PLANS.weekly.priceId, "weekly")}
                disabled={loading === "weekly"}
                className="w-full h-10 text-sm gap-2"
              >
                {loading === "weekly" ? (
                  <span className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Hebdo — 9,90€/sem
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile • Paiement sécurisé Stripe</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => { onOpenChange(false); navigate("/login"); }}
                className="w-full h-11 text-sm font-bold gap-2 bg-primary hover:bg-primary/90 btn-shimmer"
              >
                Créer un compte gratuit
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                Déjà un compte ? <Link to="/login" onClick={() => onOpenChange(false)} className="text-primary underline">Se connecter</Link>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
