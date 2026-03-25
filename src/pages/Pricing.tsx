import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Clock, Loader2, Lock, Sparkles, Shield, Brain, Users, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEliteWinrate } from "@/hooks/useResults";

function UrgencyTimer() {
  const [mins, setMins] = useState(Math.floor(Math.random() * 20) + 5);
  useEffect(() => {
    const i = setInterval(() => setMins(p => (p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(i);
  }, []);
  if (mins <= 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-warning text-xs font-medium">
      <Clock className="h-3.5 w-3.5" /> ⏳ Offre disponible encore {mins} min
    </span>
  );
}

export default function Pricing() {
  const { user, isPremium, subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: eliteData } = useEliteWinrate();

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoadingPlan(planKey);
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
      toast.error(err.message || "Erreur lors du paiement. Réessaie.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const eliteWinrate = eliteData?.winrate ?? 84;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-3xl pt-20 pb-16 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Débloquez <span className="gradient-text">Pronosia</span> Premium
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Basé sur les récentes sélections haute confiance • {eliteWinrate}% winrate ELITE
          </p>
          <div className="mt-3 flex justify-center">
            <UrgencyTimer />
          </div>
        </motion.div>

        {/* Proof block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 rounded-xl border border-border/50 bg-card/60 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">✔ IA basée sur <strong className="text-foreground">11 dimensions réelles</strong></span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">✔ Sélection automatique des <strong className="text-foreground">meilleurs matchs</strong></span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">✔ Accès prioritaire aux matchs <strong className="text-foreground">ELITE</strong></span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Communauté active de parieurs</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Détection automatique Value Bets</span>
            </div>
          </div>
          <p className="mt-3 text-center text-[9px] text-warning font-medium">
            ⏳ Les meilleurs matchs sont limités chaque jour — ne manquez pas les opportunités ELITE
          </p>
        </motion.div>

        {/* Not logged in */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Accédez à toutes les prédictions IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">Créez un compte pour débloquer les analyses complètes et prédictions avancées</p>
            <Link to="/login">
              <Button className="mt-4 h-11 px-8 text-sm font-bold gap-2 btn-shimmer">
                Créer un compte gratuit
              </Button>
            </Link>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Déjà un compte ? <Link to="/login" className="text-primary underline">Se connecter</Link>
            </p>
          </motion.div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col p-6">
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
            {!user ? (
              <Link to="/login"><Button variant="outline" size="sm" className="mt-5 w-full">S'inscrire</Button></Link>
            ) : !isPremium ? (
              <Button variant="outline" size="sm" className="mt-5 w-full" disabled>Plan Actuel</Button>
            ) : (
              <Button variant="outline" size="sm" className="mt-5 w-full" disabled>—</Button>
            )}
          </motion.div>

          {/* Weekly */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card flex flex-col p-6">
            <h2 className="font-display text-lg font-bold">Hebdo</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">7 jours d'accès</p>
            <p className="mt-4 font-display text-3xl font-extrabold">9,90€<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {["Prédictions illimitées", "Analyses détaillées", "Value Bets", "12 sports couverts"].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-5 w-full gap-1.5 btn-shimmer"
              onClick={() => handleCheckout(STRIPE_PLANS.weekly.priceId, "weekly")}
              disabled={loadingPlan === "weekly" || (isPremium && subscription.productId === STRIPE_PLANS.weekly.productId)}
            >
              {loadingPlan === "weekly" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {!user ? "Créer un compte" : isPremium && subscription.productId === STRIPE_PLANS.weekly.productId ? "Plan Actuel" : "Essayer 7 jours"}
            </Button>
          </motion.div>

          {/* Monthly */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card flex flex-col p-6 glow-border relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
              ⚡ MEILLEUR CHOIX
            </span>
            <h2 className="font-display text-lg font-bold">Mensuel</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">30 jours d'accès</p>
            <p className="mt-4 font-display text-3xl font-extrabold">29,90€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {[
                "Tout l'accès Hebdo",
                "Matchs ELITE en priorité",
                "Résultats & statistiques IA",
                "Filtres avancés",
                "Support prioritaire",
                "Économisez 40%",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-5 w-full gap-1.5 text-sm font-semibold btn-shimmer"
              onClick={() => handleCheckout(STRIPE_PLANS.monthly.priceId, "monthly")}
              disabled={loadingPlan === "monthly" || (isPremium && subscription.productId === STRIPE_PLANS.monthly.productId)}
            >
              {loadingPlan === "monthly" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {!user ? "Créer un compte" : isPremium && subscription.productId === STRIPE_PLANS.monthly.productId ? "Plan Actuel" : "Passer Premium"}
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-12">
          <h2 className="mb-6 text-center font-display text-xl font-bold">Questions Fréquentes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre moteur analyse 11 dimensions : forme récente, H2H, xG, blessures, contexte, fatigue, conditions, marché et plus encore." },
              { q: "Taux de réussite ?", a: `${eliteWinrate}% de réussite sur les 20 derniers matchs ELITE sélectionnés par l'IA, avec confiance calibrée.` },
              { q: "Annulation possible ?", a: "Oui, sans engagement. Annulez à tout moment depuis votre compte." },
              { q: "Paiement sécurisé ?", a: "Stripe gère tous les paiements. Vos données bancaires ne transitent jamais par nos serveurs." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card p-4">
                <h3 className="font-semibold text-xs mb-1">{q}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="mt-8 text-[9px] text-muted-foreground/50 text-center">
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties. Ne pariez que ce que vous pouvez vous permettre de perdre.
        </p>
      </div>
    </div>
  );
}
