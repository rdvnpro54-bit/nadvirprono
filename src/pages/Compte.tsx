import { Navbar } from "@/components/layout/Navbar";
import { User, Zap, CreditCard, LogOut, Loader2, Shield, BarChart3, Users, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardStats {
  totalUsers: number;
  premiumCount: number;
  matchCount: number;
  apiStatus: { lastFetch: string; requestsToday: number } | null;
}

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const staggerItem = { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } } };

export default function Compte() {
  const { user, isPremium, isAdmin, subscription, signOut, checkSubscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Paiement réussi ! Bienvenue Premium 🎉");
      checkSubscription();
    }
  }, [searchParams, checkSubscription]);

  const adminCall = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Non connecté");
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action, ...extra },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
  }, []);

  const fetchAdminStats = useCallback(async () => {
    if (!isAdmin || !user) return;
    setAdminLoading(true);
    try {
      const data = await adminCall("dashboard");
      setAdminStats({ totalUsers: data.totalUsers || 0, premiumCount: data.premiumCount || 0, matchCount: data.matchCount || 0, apiStatus: data.apiStatus || null });
    } catch (err: any) { console.error("Admin stats error:", err); }
    finally { setAdminLoading(false); }
  }, [isAdmin, user, adminCall]);

  useEffect(() => { fetchAdminStats(); }, [fetchAdminStats]);

  const handleForceRefresh = async () => {
    setRefreshLoading(true);
    try {
      const data = await adminCall("force-refresh");
      toast.success(`✅ ${data.matches_count || 0} matchs rafraîchis (${data.free_count || 0} gratuits)`);
      queryClient.invalidateQueries({ queryKey: ["cached-matches"] });
      queryClient.invalidateQueries({ queryKey: ["trigger-fetch"] });
      fetchAdminStats();
    } catch (err: any) { toast.error(err.message || "Erreur lors du rafraîchissement"); }
    finally { setRefreshLoading(false); }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Erreur"); }
    finally { setPortalLoading(false); }
  };

  const handleSignOut = async () => { await signOut(); toast.success("Déconnecté"); };

  const planLabel = isPremium
    ? subscription.productId === STRIPE_PLANS.weekly.productId ? "Premium Hebdo" : "Premium Mensuel"
    : "Gratuit";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-lg pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Mon <span className="gradient-text">Compte</span></h1>
        </motion.div>

        {!user ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-6 space-y-4"
          >
            {/* Hero */}
            <motion.div variants={staggerItem} className="text-center">
              <motion.div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20"
                animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 30px 8px hsl(var(--primary) / 0.3)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Zap className="h-10 w-10 text-primary" />
                </motion.div>
              </motion.div>
              <h2 className="font-display text-xl font-bold">Rejoins Pronosia 🚀</h2>
              <p className="mt-1 text-sm text-muted-foreground">Accède aux meilleurs pronostics IA et booste tes gains</p>
            </motion.div>

            {/* Primary CTA */}
            <motion.div variants={staggerItem}>
              <Link to="/login?mode=register">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="w-full h-14 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]" size="lg">
                    <Zap className="h-5 w-5" />
                    Créer un compte gratuit
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login" className="mt-2 block text-center">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">Déjà un compte ? <span className="underline">Se connecter</span></span>
              </Link>
            </motion.div>

            {/* Benefits */}
            <motion.div variants={staggerItem} className="glass-card p-5 space-y-3">
              {[
                { icon: BarChart3, text: "Accès aux pronostics IA" },
                { icon: Zap, text: "Matchs ELITE sélectionnés automatiquement" },
                { icon: Activity, text: "Résultats en temps réel" },
                { icon: Users, text: "Suivi de tes performances" },
              ].map(({ icon: Icon, text }) => (
                <motion.div key={text} className="flex items-center gap-3" whileHover={{ x: 4 }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust */}
            <motion.div variants={staggerItem} className="flex flex-col items-center gap-1 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Inscription gratuite en 10 secondes</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                <span>Aucune carte bancaire requise</span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {/* Profile */}
            <motion.div variants={staggerItem} className="mt-6 glass-card p-5" whileHover={{ y: -2, boxShadow: "0 8px 25px -8px hsl(var(--primary) / 0.15)" }}>
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20"
                  whileHover={{ rotate: 10 }}
                  animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 15px 3px hsl(var(--primary) / 0.2)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <User className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <p className="font-display text-sm font-bold">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">Membre Pronosia</p>
                    {isAdmin && (
                      <motion.span
                        className="rounded-full bg-destructive/20 px-2 py-0.5 text-[9px] font-bold text-destructive"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ADMIN
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Admin Console */}
            {isAdmin && (
              <motion.div variants={staggerItem} className="mt-3 glass-card p-5 border border-destructive/30">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-destructive" />
                  <h2 className="font-display text-sm font-bold">Console Admin</h2>
                </div>
                <div className="mb-4 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                  <p className="text-[11px] font-semibold text-foreground mb-1">🔄 Rafraîchir les Pronostics</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Force le rechargement immédiat des pronostics du jour.</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="destructive" size="sm" className="w-full gap-1.5 text-[11px]" onClick={handleForceRefresh} disabled={refreshLoading}>
                      {refreshLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      {refreshLoading ? "Rafraîchissement..." : "Forcer le rafraîchissement"}
                    </Button>
                  </motion.div>
                </div>
                {adminLoading ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : adminStats ? (
                  <motion.div className="grid grid-cols-2 gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {[
                      { icon: Users, label: "Utilisateurs", value: adminStats.totalUsers },
                      { icon: Zap, label: "Premium", value: adminStats.premiumCount },
                      { icon: BarChart3, label: "Matchs cachés", value: adminStats.matchCount },
                      { icon: Activity, label: "Dernier fetch", value: adminStats.apiStatus ? new Date(adminStats.apiStatus.lastFetch).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A", sub: adminStats.apiStatus ? `${adminStats.apiStatus.requestsToday} req/jour` : undefined },
                    ].map(({ icon: Icon, label, value, sub }) => (
                      <motion.div key={label} variants={staggerItem} whileHover={{ scale: 1.03 }} className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Icon className="h-3.5 w-3.5" /><span className="text-[10px] font-medium">{label}</span>
                        </div>
                        <p className="font-display text-lg font-bold">{value}</p>
                        {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <Link to="/admin" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Shield className="h-3.5 w-3.5" /> Panneau Admin
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-[11px]" onClick={fetchAdminStats} disabled={adminLoading}>
                    {adminLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Subscription */}
            <motion.div variants={staggerItem} className="mt-3 glass-card p-5" whileHover={{ y: -2 }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Statut</p>
                  <p className="text-[11px] text-muted-foreground">{planLabel}</p>
                </div>
                <motion.span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${isPremium ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                  animate={isPremium ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isPremium ? "PREMIUM" : "FREE"}
                </motion.span>
              </div>
              {isPremium && subscription.subscriptionEnd && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-[11px] text-muted-foreground">Expire le {new Date(subscription.subscriptionEnd).toLocaleDateString("fr-FR")}</p>
                </div>
              )}
              {!isPremium && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-[11px] text-muted-foreground">3 matchs gratuits / jour</p>
                  <Link to="/pricing" className="mt-3 block">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm" className="w-full gap-1.5 btn-shimmer"><Zap className="h-3.5 w-3.5" /> Passer Premium</Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div variants={staggerItem} className="mt-3 space-y-2">
              {isPremium && (
                <motion.div whileHover={{ x: 4 }}>
                  <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={handlePortal} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Gérer l'abonnement
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ x: 4 }}>
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={staggerItem} className="mt-4">
              <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground" onClick={checkSubscription}>
                Vérifier le statut d'abonnement
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
