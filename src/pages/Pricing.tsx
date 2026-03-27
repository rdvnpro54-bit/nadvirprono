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
    <motion.span
      className="flex items-center gap-1.5 text-warning text-xs font-medium"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Clock className="h-3.5 w-3.5" /> ⏳ Offre disponible encore {mins} min
    </motion.span>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Pricing() {
  const { user, isPremium, subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: eliteData } = useEliteWinrate();

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!user) { navigate("/login"); return; }
    setLoadingPlan(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Session expirée, reconnecte-toi"); navigate("/login"); return; }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL de paiement manquante");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du paiement. Réessaie.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const eliteWinrate = eliteData?.winrate ?? 84;

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-secondary/5 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <Navbar />
      <div className="container max-w-3xl pt-20 pb-16 px-3 sm:px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.h1
            className="font-display text-3xl font-extrabold sm:text-4xl"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            Débloquez <span className="gradient-text-animated">Pronosia</span> Premium
          </motion.h1>
          <motion.p
            className="mt-3 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Basé sur les récentes sélections haute confiance • {eliteWinrate}% winrate ELITE
          </motion.p>
          <motion.div
            className="mt-3 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <UrgencyTimer />
          </motion.div>
        </motion.div>

        {/* Proof block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-xl border border-border/50 bg-card/60 p-4 sm:p-5"
          whileHover={{ boxShadow: "0 8px 30px -10px hsl(var(--primary) / 0.15)" }}
        >
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {[
              { icon: Brain, color: "text-primary", text: "IA basée sur", bold: "11 dimensions réelles" },
              { icon: Sparkles, color: "text-amber-400", text: "Sélection automatique des", bold: "meilleurs matchs" },
              { icon: Shield, color: "text-emerald-400", text: "Accès prioritaire aux matchs", bold: "ELITE" },
            ].map(({ icon: Icon, color, text, bold }) => (
              <motion.div key={bold} variants={staggerItem} className="flex items-center justify-center gap-2">
                <Icon className={`h-4 w-4 ${color} shrink-0`} />
                <span className="text-[11px] sm:text-xs text-muted-foreground">✔ {text} <strong className="text-foreground">{bold}</strong></span>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="mt-3 grid grid-cols-2 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" /> Communauté active de parieurs
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Détection automatique Value Bets
            </div>
          </motion.div>
          <motion.p
            className="mt-3 text-center text-[9px] text-warning font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⏳ Les meilleurs matchs sont limités chaque jour
          </motion.p>
        </motion.div>

        {/* Not logged in */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.06] p-6 text-center"
          >
            <motion.div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="h-6 w-6 text-primary" />
            </motion.div>
            <h2 className="text-lg font-bold">Accédez à toutes les prédictions IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">Créez un compte pour débloquer les analyses complètes</p>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 inline-block">
                <Button className="h-11 px-8 text-sm font-bold gap-2 btn-shimmer">
                  Créer un compte gratuit
                </Button>
              </motion.div>
            </Link>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Déjà un compte ? <Link to="/login" className="text-primary underline">Se connecter</Link>
            </p>
          </motion.div>
        )}

        <motion.div
          className="mt-8 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* Free */}
          <motion.div variants={staggerItem} whileHover={{ y: -6 }} className="glass-card flex flex-col p-6">
            <h2 className="font-display text-lg font-bold">Gratuit</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Pour découvrir</p>
            <p className="mt-4 font-display text-3xl font-extrabold">0€</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {["3 matchs gratuits / jour", "Aperçu des prédictions", "Dashboard basique"].map(f => (
                <li key={f} className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {f}</li>
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

          {/* Premium Mensuel */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -6 }}
            className="glass-card flex flex-col p-6"
          >
            <h2 className="font-display text-lg font-bold">Premium</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Hebdo 9,90€ · Mensuel 29,90€</p>
            <p className="mt-4 font-display text-3xl font-extrabold">9,90€<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-xs">
              {["Prédictions illimitées", "Analyses détaillées", "Value Bets", "12 sports couverts", "Résultats & statistiques IA"].map(f => (
                <li key={f} className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}</li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 text-xs"
                  onClick={() => handleCheckout(STRIPE_PLANS.weekly.priceId, "weekly")}
                  disabled={loadingPlan === "weekly" || (isPremium && subscription.productId === STRIPE_PLANS.weekly.productId)}
                >
                  {loadingPlan === "weekly" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {isPremium && subscription.productId === STRIPE_PLANS.weekly.productId ? "Actuel" : "Hebdo"}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  className="w-full gap-1 text-xs btn-shimmer"
                  onClick={() => handleCheckout(STRIPE_PLANS.monthly.priceId, "monthly")}
                  disabled={loadingPlan === "monthly" || (isPremium && subscription.productId === STRIPE_PLANS.monthly.productId)}
                >
                  {loadingPlan === "monthly" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {isPremium && subscription.productId === STRIPE_PLANS.monthly.productId ? "Actuel" : "Mensuel"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Premium+ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <motion.div
            whileHover={{ y: -8, boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.25)" }}
            className="glass-card flex flex-col p-6 glow-border relative"
          >
            <motion.span
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-black"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⭐ PREMIUM+
            </motion.span>
            <h2 className="font-display text-xl font-bold mt-2">Premium<span className="text-amber-400">+</span></h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Tout le Premium + Scores prédits IA exclusifs</p>
            <p className="mt-4 font-display text-3xl font-extrabold">9,90€<span className="text-sm font-normal text-muted-foreground">/sem</span> <span className="text-lg text-muted-foreground mx-1">ou</span> 39,90€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-5 space-y-2.5 text-xs">
              {[
                "✅ Tout l'accès Premium inclus",
                "🎯 Scores prédits par l'IA pour chaque match",
                "📊 Analyses ultra-détaillées avec probabilités",
                "⚡ Matchs ELITE en priorité absolue",
                "🏆 Statistiques avancées exclusives",
                "💎 Support VIP prioritaire",
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-foreground">{f}</li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusWeekly.priceId, "premiumPlusWeekly")}
                  disabled={loadingPlan === "premiumPlusWeekly" || (subscription.productId === STRIPE_PLANS.premiumPlusWeekly.productId)}
                >
                  {loadingPlan === "premiumPlusWeekly" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {subscription.productId === STRIPE_PLANS.premiumPlusWeekly.productId ? "Actuel" : "Hebdo 9,90€"}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                <Button
                  size="sm"
                  className="w-full gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => handleCheckout(STRIPE_PLANS.premiumPlusMonthly.priceId, "premiumPlusMonthly")}
                  disabled={loadingPlan === "premiumPlusMonthly" || (subscription.productId === STRIPE_PLANS.premiumPlusMonthly.productId)}
                >
                  {loadingPlan === "premiumPlusMonthly" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {subscription.productId === STRIPE_PLANS.premiumPlusMonthly.productId ? "Actuel" : "Mensuel 39,90€"}
                </Button>
              </motion.div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Sans engagement • Annulation facile</p>
          </motion.div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h2 className="mb-6 text-center font-display text-xl font-bold">Questions Fréquentes</h2>
          <motion.div
            className="grid gap-3 sm:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {[
              { q: "Comment fonctionne l'IA ?", a: "Notre moteur analyse 11 dimensions : forme récente, H2H, xG, blessures, contexte, fatigue, conditions, marché et plus encore." },
              { q: "Taux de réussite ?", a: `${eliteWinrate}% de réussite sur les 20 derniers matchs ELITE sélectionnés par l'IA, avec confiance calibrée.` },
              { q: "Annulation possible ?", a: "Oui, sans engagement. Annulez à tout moment depuis votre compte." },
              { q: "Paiement sécurisé ?", a: "Stripe gère tous les paiements. Vos données bancaires ne transitent jamais par nos serveurs." },
            ].map(({ q, a }) => (
              <motion.div
                key={q}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass-card p-4"
              >
                <h3 className="font-semibold text-xs mb-1">{q}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-8 text-[9px] text-muted-foreground/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties. Ne pariez que ce que vous pouvez vous permettre de perdre.
        </motion.p>
      </div>
    </div>
  );
}
