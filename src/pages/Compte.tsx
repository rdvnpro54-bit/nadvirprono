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
      setAdminStats({
        totalUsers: data.totalUsers || 0,
        premiumCount: data.premiumCount || 0,
        matchCount: data.matchCount || 0,
        apiStatus: data.apiStatus || null,
      });
    } catch (err: any) {
      console.error("Admin stats error:", err);
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin, user, adminCall]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleForceRefresh = async () => {
    setRefreshLoading(true);
    try {
      const data = await adminCall("force-refresh");
      toast.success(`✅ ${data.matches_count || 0} matchs rafraîchis (${data.free_count || 0} gratuits)`);
      // Invalidate match queries to reload UI
      queryClient.invalidateQueries({ queryKey: ["cached-matches"] });
      queryClient.invalidateQueries({ queryKey: ["trigger-fetch"] });
      // Refresh admin stats
      fetchAdminStats();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du rafraîchissement");
    } finally {
      setRefreshLoading(false);
    }
  };

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
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">Membre Pronosia</p>
                    {isAdmin && (
                      <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[9px] font-bold text-destructive">ADMIN</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Admin Console */}
            {isAdmin && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-3 glass-card p-5 border border-destructive/30">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-destructive" />
                  <h2 className="font-display text-sm font-bold">Console Admin</h2>
                </div>

                {/* Force Refresh Button */}
                <div className="mb-4 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                  <p className="text-[11px] font-semibold text-foreground mb-1">🔄 Rafraîchir les Pronostics</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Force le rechargement immédiat des 3 pronostics du jour (foot + tennis + basket). Nouveau reset automatique à minuit.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5 text-[11px]"
                    onClick={handleForceRefresh}
                    disabled={refreshLoading}
                  >
                    {refreshLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {refreshLoading ? "Rafraîchissement..." : "Forcer le rafraîchissement maintenant"}
                  </Button>
                </div>

                {adminLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : adminStats ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">Utilisateurs</span>
                      </div>
                      <p className="font-display text-lg font-bold">{adminStats.totalUsers}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">Premium</span>
                      </div>
                      <p className="font-display text-lg font-bold">{adminStats.premiumCount}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">Matchs cachés</span>
                      </div>
                      <p className="font-display text-lg font-bold">{adminStats.matchCount}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Activity className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">Dernier fetch</span>
                      </div>
                      <p className="font-display text-xs font-bold">
                        {adminStats.apiStatus
                          ? new Date(adminStats.apiStatus.lastFetch).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                          : "N/A"}
                      </p>
                      {adminStats.apiStatus && (
                        <p className="text-[9px] text-muted-foreground">{adminStats.apiStatus.requestsToday} req/jour</p>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <Link to="/admin" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Shield className="h-3.5 w-3.5" /> Panneau Admin Complet
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-[11px]" onClick={fetchAdminStats} disabled={adminLoading}>
                    {adminLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </motion.div>
            )}

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
