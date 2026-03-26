import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield, Users, Crown, BarChart3, Activity,
  AlertCircle, CheckCircle, XCircle,
  Loader2, RefreshCw, Search, Radio
} from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  premiumCount: number;
  conversionRate: number;
  matchCount: number;
  apiStatus: { lastFetch: string; requestsToday: number; lastResetDate: string } | null;
  logs: any[];
}

interface UserEntry {
  id: string;
  email: string;
  created_at: string;
  is_premium: boolean;
  plan: string;
  expires_at: string | null;
}

interface PresenceUser {
  email: string;
  page: string;
  joined_at: string;
}

const ADMIN_EMAIL = "rdvnpro54@gmail.com";

export default function Admin() {
  const { user, session, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [premiumEmail, setPremiumEmail] = useState("");
  const [premiumDuration, setPremiumDuration] = useState<"weekly" | "monthly">("weekly");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  const adminCall = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return null;
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action, ...extra },
      headers: { Authorization: `Bearer ${currentSession.access_token}` },
    });
    if (error) throw error;
    return data;
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await adminCall("dashboard");
      if (data) setStats(data);
    } catch (err: any) {
      toast.error("Erreur dashboard: " + err.message);
    } finally {
      setLoadingStats(false);
    }
  }, [adminCall]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const data = await adminCall("list-users");
      if (data?.users) setUsers(data.users);
    } catch (err: any) {
      toast.error("Erreur utilisateurs: " + err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [adminCall]);

  useEffect(() => {
    if (session && user?.email === ADMIN_EMAIL) {
      fetchDashboard();
      fetchUsers();
    }
  }, [session, user, fetchDashboard, fetchUsers]);

  // Real-time subscription updates
  useEffect(() => {
    if (!session || user?.email !== ADMIN_EMAIL) return;

    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => {
        fetchUsers();
        fetchDashboard();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_logs" }, () => {
        fetchDashboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, user, fetchUsers, fetchDashboard]);

  // Real-time presence tracking
  useEffect(() => {
    if (!session || user?.email !== ADMIN_EMAIL) return;

    const presenceChannel = supabase.channel("admin-presence-viewer");

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const allUsers: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[];
          for (const p of presences) {
            allUsers.push({
              email: p.email || "Anonyme",
              page: p.page || "/",
              joined_at: p.joined_at || new Date().toISOString(),
            });
          }
        }
        setOnlineUsers(allUsers);
      })
      .subscribe();

    return () => { supabase.removeChannel(presenceChannel); };
  }, [session, user]);

  const handleActivatePremium = async () => {
    if (!premiumEmail.trim()) return toast.error("Email requis");
    setActionLoading(true);
    try {
      await adminCall("activate-premium", { email: premiumEmail.trim(), duration: premiumDuration });
      toast.success(`Premium activé pour ${premiumEmail} (${premiumDuration === "weekly" ? "7 jours" : "30 jours"})`);
      setPremiumEmail("");
      fetchUsers();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur activation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivatePremium = async () => {
    if (!premiumEmail.trim()) return toast.error("Email requis");
    setActionLoading(true);
    try {
      await adminCall("deactivate-premium", { email: premiumEmail.trim() });
      toast.success(`Premium retiré pour ${premiumEmail}`);
      setPremiumEmail("");
      fetchUsers();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur désactivation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setActionLoading(true);
    try {
      await adminCall("force-refresh");
      toast.success("🔄 Matchs rafraîchis avec succès");
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur rafraîchissement");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gestion en temps réel • {user.email}</p>
        </motion.div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full max-w-xl grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-1 text-[10px] sm:text-xs"><BarChart3 className="h-3 w-3" /> Stats</TabsTrigger>
            <TabsTrigger value="live" className="gap-1 text-[10px] sm:text-xs"><Radio className="h-3 w-3" /> Live</TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-[10px] sm:text-xs"><Users className="h-3 w-3" /> Users</TabsTrigger>
            <TabsTrigger value="premium" className="gap-1 text-[10px] sm:text-xs"><Crown className="h-3 w-3" /> Premium</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1 text-[10px] sm:text-xs"><Activity className="h-3 w-3" /> Logs</TabsTrigger>
          </TabsList>

          {/* ─── DASHBOARD ─────────────────────────── */}
          <TabsContent value="dashboard">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {loadingStats ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse bg-muted/50 h-24" />
                ))
              ) : stats ? (
                <>
                  <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="text-blue-400" />
                  <StatCard icon={Crown} label="Premium" value={stats.premiumCount} color="text-yellow-400" />
                  <StatCard icon={BarChart3} label="Conversion" value={`${stats.conversionRate}%`} color="text-green-400" />
                  <StatCard icon={Activity} label="Matchs analysés" value={stats.matchCount} color="text-primary" />
                </>
              ) : null}
            </div>

            {stats?.apiStatus && (
              <Card className="mt-4 p-4">
                <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Statut API
                </h3>
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="flex items-center gap-2">
                    {stats.apiStatus.lastFetch ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-muted-foreground text-xs">
                      Dernier fetch: {stats.apiStatus.lastFetch
                        ? new Date(stats.apiStatus.lastFetch).toLocaleString("fr-FR")
                        : "Jamais"}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Requêtes: <span className="font-semibold text-foreground">{stats.apiStatus.requestsToday}/960</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Reset: {stats.apiStatus.lastResetDate}
                  </div>
                </div>
              </Card>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchDashboard(); fetchUsers(); }} className="gap-1">
                <RefreshCw className="h-3 w-3" /> Rafraîchir
              </Button>
              <Button size="sm" onClick={handleForceRefresh} disabled={actionLoading} className="gap-1">
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                🔄 Rafraîchir les matchs
              </Button>
            </div>
          </TabsContent>

          {/* ─── LIVE USERS ────────────────────────── */}
          <TabsContent value="live">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                  </span>
                  Utilisateurs en ligne
                </h3>
                <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success">
                  {onlineUsers.length}
                </span>
              </div>

              {onlineUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucun utilisateur connecté en temps réel</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Les utilisateurs apparaîtront ici lorsqu'ils navigueront sur le site
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((u, i) => (
                    <motion.div
                      key={`${u.email}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/40" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                        <span className="text-sm font-medium">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">{u.page}</span>
                        <span>{new Date(u.joined_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── USERS ─────────────────────────────── */}
          <TabsContent value="users">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <span className="text-xs text-muted-foreground">{filteredUsers.length} utilisateur(s)</span>
            </div>

            {loadingUsers ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-muted-foreground text-xs">
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Statut</th>
                      <th className="pb-2 pr-4">Plan</th>
                      <th className="pb-2 pr-4">Expiration</th>
                      <th className="pb-2">Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-medium text-xs">{u.email}</td>
                        <td className="py-2.5 pr-4">
                          {u.is_premium ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-400">
                              <Crown className="h-3 w-3" /> Premium
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">{u.plan}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                          {u.expires_at ? new Date(u.expires_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs">
                          {new Date(u.created_at).toLocaleDateString("fr-FR")}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ─── PREMIUM MANAGEMENT ────────────────── */}
          <TabsContent value="premium">
            <Card className="p-6 max-w-lg">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" /> Gestion Premium
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email utilisateur</label>
                  <Input type="email" placeholder="user@example.com" value={premiumEmail} onChange={(e) => setPremiumEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Durée</label>
                  <div className="flex gap-2">
                    <Button variant={premiumDuration === "weekly" ? "default" : "outline"} size="sm" onClick={() => setPremiumDuration("weekly")}>7 jours</Button>
                    <Button variant={premiumDuration === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPremiumDuration("monthly")}>30 jours</Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleActivatePremium} disabled={actionLoading || !premiumEmail.trim()} className="gap-1">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Activer Premium
                  </Button>
                  <Button variant="destructive" onClick={handleDeactivatePremium} disabled={actionLoading || !premiumEmail.trim()} className="gap-1">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Retirer Premium
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ─── LOGS ──────────────────────────────── */}
          <TabsContent value="logs">
            {loadingStats ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </div>
            ) : stats?.logs && stats.logs.length > 0 ? (
              <div className="space-y-2">
                {stats.logs.map((log: any, i: number) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-3 flex items-start gap-3"
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      log.action.includes("activate") ? "bg-green-400" :
                      log.action.includes("deactivate") ? "bg-red-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.admin_email} • {JSON.stringify(log.details)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun log pour le moment</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
