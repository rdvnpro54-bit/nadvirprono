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
  Shield, Users, Crown, BarChart3, Activity, AlertCircle, CheckCircle,
  XCircle, Loader2, RefreshCw, Search, Radio, FileEdit, Trophy, Ban,
  Megaphone, Send, Brain, Zap, TrendingDown, Filter, ShieldAlert,
  Calendar, Globe, Download,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

interface LeaguePerf {
  league_name: string;
  sport: string;
  total_picks: number;
  wins: number;
  losses: number;
  winrate: number;
  roi: number;
  is_blacklisted: boolean;
  blacklist_expires_at: string | null;
  blacklist_reason: string | null;
  consecutive_bad_weeks: number;
}

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  total_picks: number;
  wins: number;
  losses: number;
  winrate: number;
  roi: number;
  best_league: string | null;
  worst_league: string | null;
  best_bet_type: string | null;
  created_at: string;
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
    consensusRate: number;
    fallbackRate: number;
    consensusPassed: number;
    consensusFailed: number;
    streakLevel: string;
  } | null>(null);
  const [v2Loading, setV2Loading] = useState(false);
  const [v2Recalculating, setV2Recalculating] = useState(false);
  const [promoSending, setPromoSending] = useState(false);
  const [leaguePerfs, setLeaguePerfs] = useState<LeaguePerf[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [leagueSearch, setLeagueSearch] = useState("");
  const [auditRunning, setAuditRunning] = useState(false);
  const [fetchingMatches, setFetchingMatches] = useState(false);

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

  const fetchLeaguePerfs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("league_performance")
        .select("*")
        .order("total_picks", { ascending: false });
      if (data) setLeaguePerfs(data as any[]);
    } catch {}
  }, []);

  const fetchWeeklyReports = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setWeeklyReports(data as any[]);
    } catch {}
  }, []);

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
    fetchLeaguePerfs();
    fetchWeeklyReports();
  }, [fetchDashboard, fetchUsers, fetchResults, fetchLeaguePerfs, fetchWeeklyReports]);

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
    return () => { supabase.removeChannel(channel); };
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
    return () => { supabase.removeChannel(presenceChannel); };
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

  const handleForceFetchMatches = async () => {
    setFetchingMatches(true);
    try {
      const data = await adminCall("force-fetch-matches");
      toast.success(data?.message || "✅ Nouveaux matchs récupérés !");
      queryClient.invalidateQueries({ queryKey: ["cached-matches"] });
      queryClient.invalidateQueries({ queryKey: ["trigger-fetch"] });
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Erreur fetch matchs");
    } finally {
      setFetchingMatches(false);
    }
  };

  const handleSendPromo = async () => {
    setPromoSending(true);
    try {
      const channel = supabase.channel("admin-promo-broadcast");
      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") resolve();
          else if (status === "CHANNEL_ERROR") reject(new Error("Channel error"));
        });
      });
      await channel.send({
        type: "broadcast",
        event: "promo-push",
        payload: { message: promoMessage, discount: promoDiscount, duration_minutes: promoDuration },
      });
      toast.success(`🎉 Promo -${promoDiscount}% envoyée !`);
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

      const { data: v2Data, error: v2Err } = await supabase.functions.invoke("admin-actions", {
        body: { action: "v2-stats" },
        headers: { Authorization: `Bearer ${s.access_token}` },
      });

      let consensusPassed = 0;
      let consensusFailed = 0;
      try {
        const { count: passedCount } = await supabase
          .from("cached_matches")
          .select("fixture_id", { count: "exact", head: true })
          .eq("consensus_passed", true)
          .gt("ai_score", 0);
        const { count: failedCount } = await supabase
          .from("cached_matches")
          .select("fixture_id", { count: "exact", head: true })
          .eq("consensus_passed", false)
          .gt("ai_score", 0);
        consensusPassed = passedCount || 0;
        consensusFailed = failedCount || 0;
      } catch {}

      const totalWithPreds = consensusPassed + consensusFailed;
      const consensusRate = totalWithPreds > 0 ? Math.round((consensusPassed / totalWithPreds) * 100) : 0;

      let streakLevel = "normal";
      if (rollingWinrate < 35) streakLevel = "emergency";
      else if (rollingWinrate < 45) streakLevel = "streak";
      else if (rollingWinrate <= 50) streakLevel = "caution";

      setV2Stats({
        streakMode,
        rollingWinrate,
        totalMatches: v2Err ? 0 : v2Data?.totalMatches || 0,
        eligibleMatches: v2Err ? 0 : v2Data?.eligibleMatches || 0,
        excludedCount: v2Err ? 0 : v2Data?.excludedCount || 0,
        predictionsGenerated: v2Err ? 0 : v2Data?.eligibleMatches || 0,
        source: "—",
        lastRecalc: null,
        consensusRate,
        fallbackRate: 0,
        consensusPassed,
        consensusFailed,
        streakLevel,
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
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-predict?force=true&batch=10`,
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
        toast.success(`🤖 IA recalculée ! ${result.updated || 0} matchs via ${result.source || "Cerebras"}`);
        setV2Stats(prev => prev ? {
          ...prev,
          source: result.source || "pronosia-v3.1",
          predictionsGenerated: result.predictions_generated || 0,
          excludedCount: result.excluded || 0,
          streakMode: result.streak_mode ?? prev.streakMode,
          rollingWinrate: result.rolling_winrate ?? prev.rollingWinrate,
          streakLevel: result.streak_level ?? prev.streakLevel,
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

  const handleForceAudit = async () => {
    setAuditRunning(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) throw new Error("No session");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-audit`,
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
        toast.success(`📊 Audit terminé ! ${result.total_picks} picks, ${result.winrate}% WR`);
        fetchLeaguePerfs();
        fetchWeeklyReports();
      } else {
        toast.error("Erreur audit: " + (result.error || "Inconnu"));
      }
    } catch (err: any) {
      toast.error("Erreur audit: " + (err.message || "Inconnu"));
    } finally {
      setAuditRunning(false);
    }
  };

  const handleToggleBlacklist = async (league: LeaguePerf) => {
    try {
      const { error } = await supabase
        .from("league_performance")
        .update({
          is_blacklisted: !league.is_blacklisted,
          blacklisted_at: !league.is_blacklisted ? new Date().toISOString() : null,
          blacklist_expires_at: !league.is_blacklisted
            ? new Date(Date.now() + 14 * 86400000).toISOString()
            : null,
          blacklist_reason: !league.is_blacklisted ? "Blacklist manuelle admin" : null,
        })
        .eq("league_name", league.league_name)
        .eq("sport", league.sport);
      if (error) throw error;
      toast.success(league.is_blacklisted
        ? `✅ ${league.league_name} retirée de la blacklist`
        : `🚫 ${league.league_name} blacklistée (14j)`);
      fetchLeaguePerfs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => { fetchV2Stats(); }, [fetchV2Stats]);

  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLeagues = leaguePerfs.filter(l =>
    !leagueSearch || l.league_name.toLowerCase().includes(leagueSearch.toLowerCase())
  );
  const blacklistedCount = leaguePerfs.filter(l => l.is_blacklisted).length;

  return (
    <div className={`${embedded ? "mt-3" : ""} px-1`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <h2 className="font-display text-lg font-bold truncate">Admin Panel</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0">v3.2</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user?.email}</p>
      </motion.div>

      <Tabs defaultValue="dashboard" className="space-y-3">
        {/* Mobile-optimized scrollable tabs */}
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="inline-flex w-max gap-0.5">
            <TabsTrigger value="dashboard" className="px-2 py-1.5 text-[10px]">
              <BarChart3 className="h-3 w-3 mr-1" />Stats
            </TabsTrigger>
            <TabsTrigger value="ai-v2" className="px-2 py-1.5 text-[10px]">
              <Brain className="h-3 w-3 mr-1" />IA
            </TabsTrigger>
            <TabsTrigger value="leagues" className="px-2 py-1.5 text-[10px]">
              <Globe className="h-3 w-3 mr-1" />Ligues
            </TabsTrigger>
            <TabsTrigger value="live" className="px-2 py-1.5 text-[10px]">
              <Radio className="h-3 w-3 mr-1" />Live
            </TabsTrigger>
            <TabsTrigger value="users" className="px-2 py-1.5 text-[10px]">
              <Users className="h-3 w-3 mr-1" />Users
            </TabsTrigger>
            <TabsTrigger value="results" className="px-2 py-1.5 text-[10px]">
              <FileEdit className="h-3 w-3 mr-1" />Résultats
            </TabsTrigger>
            <TabsTrigger value="premium" className="px-2 py-1.5 text-[10px]">
              <Crown className="h-3 w-3 mr-1" />Premium
            </TabsTrigger>
            <TabsTrigger value="promo" className="px-2 py-1.5 text-[10px]">
              <Megaphone className="h-3 w-3 mr-1" />Promo
            </TabsTrigger>
            <TabsTrigger value="logs" className="px-2 py-1.5 text-[10px]">
              <Activity className="h-3 w-3 mr-1" />Logs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ DASHBOARD TAB ═══ */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 gap-2">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-20 animate-pulse bg-muted/50 p-3" />
              ))
            ) : stats ? (
              <>
                <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="text-secondary" />
                <StatCard icon={Crown} label="Premium" value={stats.premiumCount} color="text-warning" />
                <StatCard icon={BarChart3} label="Conversion" value={`${stats.conversionRate}%`} color="text-success" />
                <StatCard icon={Activity} label="Matchs" value={stats.matchCount} color="text-primary" />
              </>
            ) : null}
          </div>

          {stats?.apiStatus && (
            <Card className="mt-3 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 font-display text-xs font-semibold">
                <Activity className="h-3.5 w-3.5 text-primary" /> API
              </h3>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {stats.apiStatus.lastFetch ? (
                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                  <span className="truncate">
                    {stats.apiStatus.lastFetch ? new Date(stats.apiStatus.lastFetch).toLocaleString("fr-FR") : "Jamais"}
                  </span>
                </div>
                <p>Requêtes: <span className="font-semibold text-foreground">{stats.apiStatus.requestsToday}/960</span></p>
              </div>
            </Card>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchDashboard(); fetchUsers(); }} className="gap-1 text-[11px] h-8">
              <RefreshCw className="h-3 w-3" /> Rafraîchir
            </Button>
            <Button size="sm" onClick={handleForceRefresh} disabled={actionLoading} className="gap-1 text-[11px] h-8">
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Top 2
            </Button>
            <Button size="sm" variant="secondary" onClick={handleForceFetchMatches} disabled={fetchingMatches} className="gap-1 text-[11px] h-8">
              {fetchingMatches ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Forcer fetch matchs
            </Button>
          </div>

          {fetchingMatches && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 rounded-lg border border-secondary/20 bg-secondary/5 p-3 text-center">
              <Loader2 className="h-5 w-5 text-secondary animate-spin mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground">Import de nouveaux matchs en cours (bypass limite quotidienne)...</p>
            </motion.div>
          )}
        </TabsContent>

        {/* ═══ IA v3 TAB ═══ */}
        <TabsContent value="ai-v2">
          <div className="space-y-3">
            {/* Streak Banner */}
            <Card className={`p-3 border ${v2Stats?.streakMode ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"}`}>
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 shrink-0 ${v2Stats?.streakMode ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                  {v2Stats?.streakMode ? <TrendingDown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs truncate">
                    {v2Stats?.streakMode ? "📉 Streak Mode" : "✅ Mode Normal"}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {v2Stats?.streakMode ? "WR < 50% → filtres renforcés" : "Filtres v3.2 standard"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={BarChart3}
                label="WR (5 derniers)"
                value={v2Loading ? "..." : `${v2Stats?.rollingWinrate ?? "—"}%`}
                color={v2Stats?.rollingWinrate && v2Stats.rollingWinrate >= 60 ? "text-success" : v2Stats?.rollingWinrate && v2Stats.rollingWinrate >= 40 ? "text-warning" : "text-destructive"}
              />
              <StatCard icon={Activity} label="Matchs cache" value={v2Loading ? "..." : v2Stats?.totalMatches ?? "—"} color="text-primary" />
              <StatCard icon={Brain} label="Prédictions IA" value={v2Loading ? "..." : v2Stats?.eligibleMatches ?? "—"} color="text-secondary" />
              <StatCard icon={Filter} label="Exclus v3" value={v2Loading ? "..." : v2Stats?.excludedCount ?? "—"} color="text-muted-foreground" />
            </div>

            {/* Consensus */}
            <Card className="p-3">
              <h3 className="flex items-center gap-1.5 font-display font-semibold text-xs mb-2">
                <Brain className="h-3.5 w-3.5 text-primary" /> Cerebras Dual
              </h3>
              <p className="text-[10px] text-muted-foreground mb-2">Qwen 235B + Llama 3.1 8B</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <p className="text-base font-bold text-primary">{v2Stats?.consensusRate ?? 0}%</p>
                  <p className="text-[9px] text-muted-foreground">Consensus</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <p className="text-base font-bold text-success">{v2Stats?.consensusPassed ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground">✅ Validés</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <p className="text-base font-bold text-warning">{v2Stats?.consensusFailed ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground">🔍 Simple</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <p className="text-base font-bold text-secondary">{v2Stats?.streakLevel ?? "normal"}</p>
                  <p className="text-[9px] text-muted-foreground">Streak</p>
                </div>
              </div>
            </Card>

            {/* Filter Rules - collapsible for mobile */}
            <Card className="p-3">
              <h3 className="flex items-center gap-1.5 font-display font-semibold text-xs mb-2">
                <Filter className="h-3.5 w-3.5 text-primary" /> Filtres v3.2
              </h3>
              <div className="grid grid-cols-1 gap-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Ban className="h-2.5 w-2.5 text-destructive shrink-0" />
                  <span>AI Score &lt; {v2Stats?.streakMode ? "75" : "70"} → Exclu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ban className="h-2.5 w-2.5 text-destructive shrink-0" />
                  <span>Value Score &lt; 0.08 → Exclu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ban className="h-2.5 w-2.5 text-destructive shrink-0" />
                  <span>Suspect ≥ 51 → Non recommandé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-2.5 w-2.5 text-success shrink-0" />
                  <span>Dual Cerebras consensus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-2.5 w-2.5 text-success shrink-0" />
                  <span>Odds: 1.35 – 4.00</span>
                </div>
              </div>
            </Card>

            {/* Weekly Reports */}
            {weeklyReports.length > 0 && (
              <Card className="p-3">
                <h3 className="flex items-center gap-1.5 font-display font-semibold text-xs mb-2">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Rapports hebdo
                </h3>
                <div className="space-y-1.5">
                  {weeklyReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2 text-[10px]">
                      <div className="min-w-0">
                        <span className="font-semibold">{r.week_start}</span>
                        <span className="text-muted-foreground ml-1">{r.total_picks}p</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={r.winrate >= 55 ? "text-success font-bold" : r.winrate >= 45 ? "text-warning font-bold" : "text-destructive font-bold"}>
                          {r.winrate}%
                        </span>
                        <span className={r.roi >= 0 ? "text-success" : "text-destructive"}>
                          {r.roi >= 0 ? "+" : ""}{r.roi}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {v2Stats?.lastRecalc && (
              <Card className="p-2">
                <p className="text-[10px] text-muted-foreground">
                  Recalcul : <span className="font-semibold text-foreground">{new Date(v2Stats.lastRecalc).toLocaleString("fr-FR")}</span>
                  {" • "}{v2Stats.predictionsGenerated} prédictions
                </p>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchV2Stats} disabled={v2Loading} className="gap-1 text-[11px] h-8">
                {v2Loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Stats
              </Button>
              <Button size="sm" onClick={handleForceRecalculate} disabled={v2Recalculating} className="gap-1 text-[11px] h-8 bg-primary">
                {v2Recalculating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                Recalcul IA
              </Button>
              <Button variant="outline" size="sm" onClick={handleForceAudit} disabled={auditRunning} className="gap-1 text-[11px] h-8">
                {auditRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                Audit
              </Button>
              <Button variant="secondary" size="sm" onClick={handleForceFetchMatches} disabled={fetchingMatches} className="gap-1 text-[11px] h-8">
                {fetchingMatches ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Fetch matchs
              </Button>
            </div>

            {v2Recalculating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="inline-block mb-1">
                  <Brain className="h-5 w-5 text-primary" />
                </motion.div>
                <p className="text-xs font-semibold">Recalcul IA v3.2...</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Dual Cerebras en cours</p>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* ═══ LEAGUES TAB ═══ */}
        <TabsContent value="leagues">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Rechercher..."
                value={leagueSearch}
                onChange={(e) => setLeagueSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <Button variant="outline" size="sm" onClick={fetchLeaguePerfs} className="gap-1 text-[11px] h-8 shrink-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={ShieldAlert} label="Blacklist" value={blacklistedCount} color="text-destructive" />
              <StatCard icon={Calendar} label="Rapports" value={weeklyReports.length} color="text-primary" />
              <StatCard icon={Globe} label="Ligues" value={leaguePerfs.length} color="text-secondary" />
            </div>

            {filteredLeagues.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Globe className="mx-auto mb-2 h-6 w-6 opacity-50" />
                <p className="text-xs">Aucune ligue trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeagues.map((l, i) => (
                  <motion.div key={`${l.league_name}-${l.sport}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className={`rounded-lg border p-2.5 ${l.is_blacklisted ? "border-destructive/30 bg-destructive/5" : "border-border/30 bg-card/50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate">{l.league_name}</p>
                          {l.is_blacklisted && <Ban className="h-3 w-3 text-destructive shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{l.sport}</span>
                          <span>{l.total_picks}p</span>
                          <span className={l.winrate >= 55 ? "text-success font-bold" : l.winrate >= 45 ? "text-warning font-bold" : "text-destructive font-bold"}>
                            {l.winrate}% WR
                          </span>
                          <span className={l.roi >= 0 ? "text-success" : "text-destructive"}>
                            {l.roi >= 0 ? "+" : ""}{l.roi}% ROI
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={l.is_blacklisted ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleBlacklist(l)}
                        className="gap-1 text-[10px] h-7 shrink-0 px-2"
                      >
                        {l.is_blacklisted ? <CheckCircle className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />}
                        {l.is_blacklisted ? "Retirer" : "Ban"}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ LIVE TAB ═══ */}
        <TabsContent value="live">
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                En ligne
              </h3>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">{onlineUsers.length}</span>
            </div>
            {onlineUsers.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="mx-auto mb-1 h-6 w-6 text-muted-foreground/40" />
                <p className="text-[11px] text-muted-foreground">Aucun utilisateur connecté</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {onlineUsers.map((u, i) => (
                  <motion.div key={`${u.email}-${i}`} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                      </span>
                      <span className="text-[11px] font-medium truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                      <span className="rounded bg-muted px-1 py-0.5">{u.page}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ═══ USERS TAB ═══ */}
        <TabsContent value="users">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 text-xs" />
            <span className="text-[10px] text-muted-foreground shrink-0">{filteredUsers.length}</span>
          </div>
          {loadingUsers ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Chargement...</div>
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="rounded-lg border border-border/20 bg-card/50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium truncate min-w-0">{u.email}</span>
                    {u.is_premium ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold text-warning shrink-0">
                        <Crown className="h-2.5 w-2.5" /> Pro
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground shrink-0">Free</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                    <span>{u.plan}</span>
                    <span>•</span>
                    <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                    {u.expires_at && (
                      <>
                        <span>•</span>
                        <span>Exp: {new Date(u.expires_at).toLocaleDateString("fr-FR")}</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ PREMIUM TAB ═══ */}
        <TabsContent value="premium">
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold">
              <Crown className="h-4 w-4 text-warning" /> Gestion Premium
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Email</label>
                <Input type="email" placeholder="user@example.com" value={premiumEmail} onChange={(e) => setPremiumEmail(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Type</label>
                <div className="flex gap-1.5">
                  <Button variant={premiumTier === "premium" ? "default" : "outline"} size="sm" onClick={() => setPremiumTier("premium")} className="text-[11px] h-7">Premium</Button>
                  <Button variant={premiumTier === "premium_plus" ? "default" : "outline"} size="sm" onClick={() => setPremiumTier("premium_plus")} className="text-[11px] h-7 gap-1">
                    <Crown className="h-2.5 w-2.5" /> Plus
                  </Button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Durée</label>
                <div className="flex gap-1.5">
                  <Button variant={premiumDuration === "weekly" ? "default" : "outline"} size="sm" onClick={() => setPremiumDuration("weekly")} className="text-[11px] h-7">7j</Button>
                  <Button variant={premiumDuration === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPremiumDuration("monthly")} className="text-[11px] h-7">30j</Button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleActivatePremium} disabled={actionLoading || !premiumEmail.trim()} className="gap-1 text-xs h-8 flex-1">
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Activer
                </Button>
                <Button variant="destructive" onClick={handleDeactivatePremium} disabled={actionLoading || !premiumEmail.trim()} className="gap-1 text-xs h-8 flex-1">
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  Retirer
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ═══ RESULTS TAB ═══ */}
        <TabsContent value="results">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input placeholder="Rechercher..." value={resultSearch} onChange={(e) => setResultSearch(e.target.value)} className="h-8 text-xs" />
            <Button variant="outline" size="sm" onClick={fetchResults} className="h-8 shrink-0">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          {loadingResults ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Chargement...</div>
          ) : (
            <div className="space-y-1.5">
              {matchResults
                .filter((m) => {
                  const q = resultSearch.toLowerCase();
                  return !q || m.home_team.toLowerCase().includes(q) || m.away_team.toLowerCase().includes(q) || m.league_name.toLowerCase().includes(q);
                })
                .map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="rounded-lg border border-border/30 bg-card/50 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <span className="truncate">{m.home_team} vs {m.away_team}</span>
                          {m.result === "win" && <Trophy className="h-3 w-3 text-success shrink-0" />}
                          {m.result === "loss" && <Ban className="h-3 w-3 text-destructive shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5 text-[9px] text-muted-foreground">
                          <span className="truncate">{m.league_name}</span>
                          <span>•</span>
                          <span>{new Date(m.kickoff).toLocaleDateString("fr-FR")}</span>
                          {m.actual_home_score !== null && (
                            <>
                              <span>•</span>
                              <span>{m.actual_home_score}-{m.actual_away_score}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Select defaultValue={m.result || "pending"} onValueChange={(val) => handleUpdateResult(m.id, val)} disabled={actionLoading}>
                        <SelectTrigger className="h-6 w-20 text-[10px] shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="win">✅ Win</SelectItem>
                          <SelectItem value="loss">❌ Loss</SelectItem>
                          <SelectItem value="pending">⏳</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                ))}
              {matchResults.length === 0 && (
                <div className="py-6 text-center text-muted-foreground">
                  <FileEdit className="mx-auto mb-1 h-6 w-6 opacity-50" />
                  <p className="text-xs">Aucun résultat</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ PROMO TAB ═══ */}
        <TabsContent value="promo">
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold">
              <Megaphone className="h-4 w-4 text-primary" /> Promo Push
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Message</label>
                <Input value={promoMessage} onChange={(e) => setPromoMessage(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">Réduction (%)</label>
                  <Input type="number" min={1} max={50} value={promoDiscount} onChange={(e) => setPromoDiscount(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">Durée (min)</label>
                  <Input type="number" min={1} max={60} value={promoDuration} onChange={(e) => setPromoDuration(Number(e.target.value))} className="h-8 text-xs" />
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground">
                <p>📢 <span className="font-semibold text-foreground">-{promoDiscount}%</span> pendant <span className="font-semibold text-foreground">{promoDuration}min</span></p>
              </div>
              <Button onClick={handleSendPromo} disabled={promoSending || !promoMessage.trim()} className="w-full gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700">
                {promoSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Envoyer
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ═══ LOGS TAB ═══ */}
        <TabsContent value="logs">
          {loadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Chargement...</div>
          ) : stats?.logs && stats.logs.length > 0 ? (
            <div className="space-y-1.5">
              {stats.logs.map((log: any, i: number) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="rounded-lg border border-border/20 bg-card/50 p-2.5">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      log.action.includes("activate") ? "bg-success" : log.action.includes("deactivate") ? "bg-destructive" : log.action.includes("audit") ? "bg-primary" : "bg-secondary"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold">{log.action}</span>
                        <span className="text-[9px] text-muted-foreground">{new Date(log.created_at).toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 break-all">{log.admin_email}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-1 h-6 w-6 opacity-50" />
              <p className="text-xs">Aucun log</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-2.5">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg bg-muted p-1.5 shrink-0 ${color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-tight">{value}</p>
            <p className="text-[9px] text-muted-foreground leading-tight truncate">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
