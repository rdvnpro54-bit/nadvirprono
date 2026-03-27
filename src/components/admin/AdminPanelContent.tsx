import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Crown,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Radio,
  FileEdit,
  Trophy,
  Ban,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface AdminPanelContentProps {
  embedded?: boolean;
}

export function AdminPanelContent({ embedded = false }: AdminPanelContentProps) {
  const { user, session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [premiumEmail, setPremiumEmail] = useState("");
  const [premiumDuration, setPremiumDuration] = useState<"weekly" | "monthly">("weekly");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResultEntry[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultSearch, setResultSearch] = useState("");

  const adminCall = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) throw new Error("Session admin introuvable");
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
    fetchDashboard();
    fetchUsers();
  }, [fetchDashboard, fetchUsers]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-realtime-${embedded ? "embedded" : "page"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => {
        fetchUsers();
        fetchDashboard();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_logs" }, () => {
        fetchDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [embedded, fetchUsers, fetchDashboard, session, user]);

  useEffect(() => {
    const presenceChannel = supabase.channel(`admin-presence-viewer-${embedded ? "embedded" : "page"}`);

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

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [embedded]);

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

  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={embedded ? "mt-3" : ""}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold">Panneau Admin</h2>
        </div>
        <p className="text-sm text-muted-foreground">Gestion en temps réel • {user?.email}</p>
      </motion.div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full max-w-xl grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-1 text-[10px] sm:text-xs"><BarChart3 className="h-3 w-3" /> Stats</TabsTrigger>
          <TabsTrigger value="live" className="gap-1 text-[10px] sm:text-xs"><Radio className="h-3 w-3" /> Live</TabsTrigger>
          <TabsTrigger value="users" className="gap-1 text-[10px] sm:text-xs"><Users className="h-3 w-3" /> Users</TabsTrigger>
          <TabsTrigger value="premium" className="gap-1 text-[10px] sm:text-xs"><Crown className="h-3 w-3" /> Premium</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1 text-[10px] sm:text-xs"><Activity className="h-3 w-3" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-24 animate-pulse bg-muted/50 p-4" />
              ))
            ) : stats ? (
              <>
                <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="text-secondary" />
                <StatCard icon={Crown} label="Premium" value={stats.premiumCount} color="text-warning" />
                <StatCard icon={BarChart3} label="Conversion" value={`${stats.conversionRate}%`} color="text-success" />
                <StatCard icon={Activity} label="Matchs analysés" value={stats.matchCount} color="text-primary" />
              </>
            ) : null}
          </div>

          {stats?.apiStatus && (
            <Card className="mt-4 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-display font-semibold">
                <Activity className="h-4 w-4 text-primary" /> Statut API
              </h3>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  {stats.apiStatus.lastFetch ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Dernier fetch: {stats.apiStatus.lastFetch ? new Date(stats.apiStatus.lastFetch).toLocaleString("fr-FR") : "Jamais"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Requêtes: <span className="font-semibold text-foreground">{stats.apiStatus.requestsToday}/960</span>
                </div>
                <div className="text-xs text-muted-foreground">
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

        <TabsContent value="live">
          <Card className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display font-semibold">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                </span>
                Utilisateurs en ligne
              </h3>
              <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success">{onlineUsers.length}</span>
            </div>

            {onlineUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur connecté en temps réel</p>
                <p className="mt-1 text-[10px] text-muted-foreground/60">Les utilisateurs apparaîtront ici lorsqu'ils navigueront sur le site</p>
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
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
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
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
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
                      className="border-b border-border/20 transition-colors hover:bg-muted/30"
                    >
                      <td className="py-2.5 pr-4 text-xs font-medium">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        {u.is_premium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Free</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.plan}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="premium">
          <Card className="max-w-lg p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display font-semibold">
              <Crown className="h-5 w-5 text-warning" /> Gestion Premium
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Email utilisateur</label>
                <Input type="email" placeholder="user@example.com" value={premiumEmail} onChange={(e) => setPremiumEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Durée</label>
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
                  className="glass-card flex items-start gap-3 p-3"
                >
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    log.action.includes("activate") ? "bg-success" : log.action.includes("deactivate") ? "bg-destructive" : "bg-secondary"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{log.admin_email} • {JSON.stringify(log.details)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Aucun log pour le moment</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg bg-muted p-2 ${color}`}>
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