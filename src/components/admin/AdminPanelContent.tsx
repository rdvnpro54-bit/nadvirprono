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
  Megaphone,
  Send,
  Brain,
  Zap,
  TrendingDown,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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

interface MatchResultEntry {
  id: string;
  home_team: string;
  away_team: string;
  league_name: string;
  sport: string;
  predicted_winner: string;
  predicted_confidence: string;
  result: string | null;
  kickoff: string;
  actual_home_score: number | null;
  actual_away_score: number | null;
}

interface AdminPanelContentProps {
  embedded?: boolean;
}

export function AdminPanelContent({ embedded = false }: AdminPanelContentProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [premiumEmail, setPremiumEmail] = useState("");
  const [premiumDuration, setPremiumDuration] = useState<"weekly" | "monthly">("weekly");
  const [premiumTier, setPremiumTier] = useState<"premium" | "premium_plus">("premium");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResultEntry[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultSearch, setResultSearch] = useState("");
  const [promoMessage, setPromoMessage] = useState("Profite de -10% sur tous nos abonnements Premium et Premium+ ! Offre limitée 🔥");
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoDuration, setPromoDuration] = useState(5);
  const [v2Stats, setV2Stats] = useState<{
    streakMode: boolean;
    rollingWinrate: number;
    totalMatches: number;
    eligibleMatches: number;
    excludedCount: number;
    predictionsGenerated: number;
    source: string;
    lastRecalc: string | null;
  } | null>(null);
  const [v2Loading, setV2Loading] = useState(false);
  const [v2Recalculating, setV2Recalculating] = useState(false);
  const [promoSending, setPromoSending] = useState(false);

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

  const fetchResults = useCallback(async () => {
    try {
      setLoadingResults(true);
      const data = await adminCall("list-results");
      if (data?.results) setMatchResults(data.results);
    } catch (err: any) {
      toast.error("Erreur résultats: " + err.message);
    } finally {
      setLoadingResults(false);
    }
  }, [adminCall]);

  const handleUpdateResult = async (matchId: string, newResult: string) => {
    try {
      setActionLoading(true);
      await adminCall("update-result", { matchId, newResult });
      toast.success(`Résultat mis à jour → ${newResult}`);
      queryClient.invalidateQueries({ queryKey: ["match-history"] });
      queryClient.invalidateQueries({ queryKey: ["global-precision"] });
      queryClient.invalidateQueries({ queryKey: ["today-winrate"] });
      queryClient.invalidateQueries({ queryKey: ["high-confidence-precision"] });
      fetchResults();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchResults();
  }, [fetchDashboard, fetchUsers, fetchResults]);

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
      await adminCall("activate-premium", { email: premiumEmail.trim(), duration: premiumDuration, tier: premiumTier });
      const tierLabel = premiumTier === "premium_plus" ? "Premium+" : "Premium";
      toast.success(`${tierLabel} activé pour ${premiumEmail} (${premiumDuration === "weekly" ? "7 jours" : "30 jours"})`);
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
      const data = await adminCall("force-refresh");
      toast.success(data?.message || "🔄 Top 2 du jour rafraîchi");
      queryClient.invalidateQueries({ queryKey: ["cached-matches"] });
      queryClient.invalidateQueries({ queryKey: ["trigger-fetch"] });
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur rafraîchissement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPromo = async () => {
    setPromoSending(true);
    try {
      const channel = supabase.channel("admin-promo-broadcast");
      // Must subscribe before sending
      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") resolve();
          else if (status === "CHANNEL_ERROR") reject(new Error("Channel error"));
        });
      });
      await channel.send({
        type: "broadcast",
        event: "promo-push",
        payload: {
          message: promoMessage,
          discount: promoDiscount,
          duration_minutes: promoDuration,
        },
      });
      toast.success(`🎉 Promo -${promoDiscount}% envoyée à tous les utilisateurs en ligne !`);
      // Clean up admin's channel after sending
      setTimeout(() => supabase.removeChannel(channel), 2000);
    } catch (err: any) {
      toast.error(err.message || "Erreur envoi promo");
    } finally {
      setPromoSending(false);
    }
  };

  const fetchV2Stats = useCallback(async () => {
    setV2Loading(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) return;
      // Fetch recent results for streak
      const { data: recentResults } = await supabase
        .from("match_results")
        .select("result")
        .not("result", "is", null)
        .order("resolved_at", { ascending: false })
        .limit(5);
      
      const wins = (recentResults || []).filter((r: any) => r.result === "win").length;
      const total = (recentResults || []).length;
      const rollingWinrate = total >= 3 ? Math.round((wins / total) * 100) : 100;
      const streakMode = total >= 3 && rollingWinrate < 50;

      // Fetch match counts
      const { count: totalMatches } = await supabase
        .from("cached_matches")
        .select("id", { count: "exact", head: true });
      
      const { count: withPreds } = await supabase
        .from("cached_matches")
        .select("id", { count: "exact", head: true })
        .not("pred_analysis", "is", null)
        .gt("ai_score", 0);

      const { count: lowScore } = await supabase
        .from("cached_matches")
        .select("id", { count: "exact", head: true })
        .lt("ai_score", 70)
        .gt("ai_score", 0);

      setV2Stats({
        streakMode,
        rollingWinrate,
        totalMatches: totalMatches || 0,
        eligibleMatches: withPreds || 0,
        excludedCount: lowScore || 0,
        predictionsGenerated: withPreds || 0,
        source: "—",
        lastRecalc: null,
      });
    } catch (err) {
      console.error("v2 stats error:", err);
    } finally {
      setV2Loading(false);
    }
  }, []);

  const handleForceRecalculate = async () => {
    setV2Recalculating(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) throw new Error("No session");
      
      const { data, error } = await supabase.functions.invoke("ai-predict", {
        body: {},
        headers: { 
          Authorization: `Bearer ${s.access_token}`,
          "Content-Type": "application/json",
        },
      });

      // Call with force=true via URL params
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-predict?force=true&batch=50`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${s.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await res.json();
      
      if (result.success) {
        toast.success(`🤖 IA v2.0 recalculée ! ${result.updated} matchs mis à jour via ${result.source}. ${result.streak_mode ? "📉 Streak Mode actif" : ""}`);
        setV2Stats(prev => prev ? {
          ...prev,
          source: result.source || "pronosia-v2",
          predictionsGenerated: result.predictions_generated || 0,
          excludedCount: (result.batch_size || 0) - (result.eligible || 0),
          streakMode: result.streak_mode ?? prev.streakMode,
          rollingWinrate: result.rolling_winrate ?? prev.rollingWinrate,
          lastRecalc: new Date().toISOString(),
        } : null);
        queryClient.invalidateQueries({ queryKey: ["cached-matches"] });
      } else {
        toast.error("Erreur recalcul: " + (result.error || "Inconnu"));
      }
    } catch (err: any) {
      toast.error("Erreur recalcul IA: " + (err.message || "Inconnu"));
    } finally {
      setV2Recalculating(false);
    }
  };

  useEffect(() => { fetchV2Stats(); }, [fetchV2Stats]);

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
        <TabsList className="grid w-full max-w-2xl grid-cols-4 sm:grid-cols-8">
          <TabsTrigger value="dashboard" className="gap-1 text-[10px] sm:text-xs"><BarChart3 className="h-3 w-3" /> Stats</TabsTrigger>
          <TabsTrigger value="ai-v2" className="gap-1 text-[10px] sm:text-xs"><Brain className="h-3 w-3" /> IA v2</TabsTrigger>
          <TabsTrigger value="live" className="gap-1 text-[10px] sm:text-xs"><Radio className="h-3 w-3" /> Live</TabsTrigger>
          <TabsTrigger value="users" className="gap-1 text-[10px] sm:text-xs"><Users className="h-3 w-3" /> Users</TabsTrigger>
          <TabsTrigger value="results" className="gap-1 text-[10px] sm:text-xs"><FileEdit className="h-3 w-3" /> Résultats</TabsTrigger>
          <TabsTrigger value="premium" className="gap-1 text-[10px] sm:text-xs"><Crown className="h-3 w-3" /> Premium</TabsTrigger>
          <TabsTrigger value="promo" className="gap-1 text-[10px] sm:text-xs"><Megaphone className="h-3 w-3" /> Promo</TabsTrigger>
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
              🔄 Rafraîchir le top 2 du jour
            </Button>
          </div>
        </TabsContent>

        {/* ═══ IA v2.0 TAB ═══ */}
        <TabsContent value="ai-v2">
          <div className="space-y-4">
            {/* Streak Mode Banner */}
            <Card className={`p-4 border ${v2Stats?.streakMode ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${v2Stats?.streakMode ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                  {v2Stats?.streakMode ? <TrendingDown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm">
                    {v2Stats?.streakMode ? "📉 Streak Mode ACTIF" : "✅ Mode Normal"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v2Stats?.streakMode
                      ? `Winrate récent < 50% → sélection ultra-stricte (max 2 picks, confiance min 72%, AI min 75)`
                      : `Les filtres v2.0 fonctionnent en mode standard`}
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={BarChart3}
                label="Rolling Winrate (5 derniers)"
                value={v2Loading ? "..." : `${v2Stats?.rollingWinrate ?? "—"}%`}
                color={v2Stats?.rollingWinrate && v2Stats.rollingWinrate >= 60 ? "text-success" : v2Stats?.rollingWinrate && v2Stats.rollingWinrate >= 40 ? "text-warning" : "text-destructive"}
              />
              <StatCard
                icon={Activity}
                label="Matchs en cache"
                value={v2Loading ? "..." : v2Stats?.totalMatches ?? "—"}
                color="text-primary"
              />
              <StatCard
                icon={Brain}
                label="Prédictions IA actives"
                value={v2Loading ? "..." : v2Stats?.eligibleMatches ?? "—"}
                color="text-secondary"
              />
              <StatCard
                icon={Filter}
                label="Exclus par filtres v2"
                value={v2Loading ? "..." : v2Stats?.excludedCount ?? "—"}
                color="text-muted-foreground"
              />
            </div>

            {/* v2.0 Filter Rules */}
            <Card className="p-4">
              <h3 className="flex items-center gap-2 font-display font-semibold text-sm mb-3">
                <Filter className="h-4 w-4 text-primary" /> Filtres d'exclusion v2.0
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Ban className="h-3 w-3 text-destructive" />
                  <span>AI Score &lt; {v2Stats?.streakMode ? "75" : "70"} → Exclu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban className="h-3 w-3 text-destructive" />
                  <span>Confiance &lt; {v2Stats?.streakMode ? "72" : "65"}% → Exclu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban className="h-3 w-3 text-destructive" />
                  <span>Value Score &lt; 0.05 → Exclu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban className="h-3 w-3 text-destructive" />
                  <span>Ligues amicales/mineures → Exclu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Calibration: &gt;80% → -8%, &gt;90% → -12%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Max affiché: 88% (jamais plus)</span>
                </div>
                {v2Stats?.streakMode && (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-warning" />
                      <span>Max picks/jour: 2 (streak mode)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-warning" />
                      <span>RISQUÉ interdit (streak mode)</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Last recalc info */}
            {v2Stats?.lastRecalc && (
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">
                  Dernier recalcul : <span className="font-semibold text-foreground">{new Date(v2Stats.lastRecalc).toLocaleString("fr-FR")}</span>
                  {" "}via <span className="font-semibold text-primary">{v2Stats.source}</span>
                  {" "}• {v2Stats.predictionsGenerated} prédictions générées
                </p>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={fetchV2Stats} disabled={v2Loading} className="gap-1">
                {v2Loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Actualiser stats
              </Button>
              <Button size="sm" onClick={handleForceRecalculate} disabled={v2Recalculating} className="gap-1 bg-primary">
                {v2Recalculating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                🤖 Forcer recalcul IA v2.0
              </Button>
            </div>

            {v2Recalculating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-2"
                >
                  <Brain className="h-6 w-6 text-primary" />
                </motion.div>
                <p className="text-sm font-semibold">Recalcul IA v2.0 en cours...</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Application des filtres d'exclusion, calibration et value scoring sur tous les matchs
                </p>
              </motion.div>
            )}
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
                <label className="mb-1 block text-xs text-muted-foreground">Type d'abonnement</label>
                <div className="flex gap-2">
                  <Button variant={premiumTier === "premium" ? "default" : "outline"} size="sm" onClick={() => setPremiumTier("premium")}>Premium</Button>
                  <Button variant={premiumTier === "premium_plus" ? "default" : "outline"} size="sm" onClick={() => setPremiumTier("premium_plus")} className="gap-1">
                    <Crown className="h-3 w-3" /> Premium+
                  </Button>
                </div>
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
        <TabsContent value="results">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un match..."
              value={resultSearch}
              onChange={(e) => setResultSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="sm" onClick={fetchResults} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Rafraîchir
            </Button>
          </div>

          {loadingResults ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des résultats...
            </div>
          ) : (
            <div className="space-y-2">
              {matchResults
                .filter((m) => {
                  const q = resultSearch.toLowerCase();
                  return !q || m.home_team.toLowerCase().includes(q) || m.away_team.toLowerCase().includes(q) || m.league_name.toLowerCase().includes(q);
                })
                .map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex flex-col gap-2 rounded-lg border border-border/30 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{m.home_team} vs {m.away_team}</span>
                        {m.result === "win" && <Trophy className="h-3.5 w-3.5 text-success" />}
                        {m.result === "loss" && <Ban className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{m.league_name}</span>
                        <span>•</span>
                        <span>{new Date(m.kickoff).toLocaleDateString("fr-FR")}</span>
                        <span>•</span>
                        <span>Prédit: {m.predicted_winner}</span>
                        {m.actual_home_score !== null && (
                          <>
                            <span>•</span>
                            <span>Score: {m.actual_home_score}-{m.actual_away_score}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        m.result === "win" ? "bg-success/15 text-success" :
                        m.result === "loss" ? "bg-destructive/15 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {m.result || "pending"}
                      </span>
                      <Select
                        defaultValue={m.result || "pending"}
                        onValueChange={(val) => handleUpdateResult(m.id, val)}
                        disabled={actionLoading}
                      >
                        <SelectTrigger className="h-7 w-24 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="win">✅ Win</SelectItem>
                          <SelectItem value="loss">❌ Loss</SelectItem>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                ))}
              {matchResults.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <FileEdit className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Aucun résultat trouvé</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="promo">
          <Card className="max-w-lg p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display font-semibold">
              <Megaphone className="h-5 w-5 text-primary" /> Notification Promo Push
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Envoie une notification promo en temps réel à <span className="font-bold text-foreground">tous les utilisateurs actuellement connectés</span> sur le site.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Message de la promo</label>
                <Input value={promoMessage} onChange={(e) => setPromoMessage(e.target.value)} placeholder="Message promo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Réduction (%)</label>
                  <Input type="number" min={1} max={50} value={promoDiscount} onChange={(e) => setPromoDiscount(Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Durée (minutes)</label>
                  <Input type="number" min={1} max={60} value={promoDuration} onChange={(e) => setPromoDuration(Number(e.target.value))} />
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground">
                <p>📢 Aperçu : <span className="font-semibold text-foreground">-{promoDiscount}%</span> pendant <span className="font-semibold text-foreground">{promoDuration} min</span></p>
                <p className="mt-1 italic">"{promoMessage}"</p>
              </div>

              <Button onClick={handleSendPromo} disabled={promoSending || !promoMessage.trim()} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                {promoSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer à tous les utilisateurs
              </Button>

              <p className="text-[10px] text-muted-foreground/60 text-center">
                ⚡ La notification apparaîtra en haut de l'écran de tous les utilisateurs connectés
              </p>
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