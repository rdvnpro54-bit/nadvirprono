import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Success() {
  const { user, checkSubscription, isPremium } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      await checkSubscription();
      attempts++;
      if (attempts >= maxAttempts) {
        setChecking(false);
        return;
      }
      // Keep polling until premium is detected or max attempts reached
      setTimeout(poll, 3000);
    };

    // Start polling after a short delay to let Stripe webhook fire
    const timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, [checkSubscription]);

  useEffect(() => {
    if (isPremium) setChecking(false);
  }, [isPremium]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-md pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          {checking ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <h1 className="text-xl font-bold">Activation en cours…</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vérification de ton paiement auprès de Stripe.
              </p>
            </>
          ) : isPremium ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold">✅ Paiement réussi</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ton accès Premium est maintenant activé. Profite de toutes les prédictions IA !
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
                🟢 Premium actif
              </div>
              <Button
                className="mt-6 w-full gap-2"
                onClick={() => navigate("/matches")}
              >
                Voir les pronostics <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
                <CheckCircle className="h-10 w-10 text-warning" />
              </div>
              <h1 className="text-xl font-bold">Paiement reçu</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ton paiement a été reçu. L'activation peut prendre quelques instants.
              </p>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => checkSubscription()}
              >
                Vérifier mon statut
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full text-xs"
                onClick={() => navigate("/compte")}
              >
                Aller à mon compte
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
