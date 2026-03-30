import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import type { MatchResult } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Lock, Crown, Sparkles, Zap, TrendingUp, Trophy, BarChart3, Target, DollarSign, CheckCircle, XCircle, Filter, Calendar } from "lucide-react";
import { ResultFilters } from "@/components/results/ResultFilters";
import { ResultCard } from "@/components/results/ResultCard";
import { WinrateProgressChart } from "@/components/results/WinrateProgressChart";
import { ProfitChart } from "@/components/results/ProfitChart";
import { SportBreakdown } from "@/components/results/SportBreakdown";
import { ConfidenceBreakdown } from "@/components/results/ConfidenceBreakdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const staggerItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function groupByDay(results: MatchResult[]): { label: string; results: MatchResult[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const groups: Record<string, MatchResult[]> = {};
  for (const r of results) {
    const d = new Date(r.kickoff);
    let label: string;
    if (d.toDateString() === today) label = "📅 Aujourd'hui";
    else if (d.toDateString() === yesterday) label = "📅 Hier";
    else if (d >= weekAgo) label = "📅 Cette semaine";
    else if (d >= twoWeeksAgo) label = "📅 Semaine dernière";
    else label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  }

  const order = ["📅 Aujourd'hui", "📅 Hier", "📅 Cette semaine", "📅 Semaine dernière"];
  const entries = Object.entries(groups);
  entries.sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
  return entries.map(([label, results]) => ({ label, results }));
}

function isEliteOrStrong(r: MatchResult): boolean {
  const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
  return r.predicted_confidence === "SAFE" || maxProb >= 65;
}

function filterResults(results: MatchResult[], sport: string, status: string, period: string): MatchResult[] {
  let filtered = results;
  if (sport !== "all") filtered = filtered.filter(r => r.sport === sport);
  if (status === "win") filtered = filtered.filter(r => r.result === "win");
  else if (status === "loss") filtered = filtered.filter(r => r.result === "loss");
  else if (status === "high_conf") filtered = filtered.filter(r => isEliteOrStrong(r));
  if (period !== "all") {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = filtered.filter(r => {
      const d = new Date(r.kickoff);
      if (period === "today") return d.toDateString() === today;
      if (period === "yesterday") return d.toDateString() === yesterday;
      if (period === "week") return d >= weekAgo;
      if (period === "month") return d >= monthStart;
      return true;
    });
  }
  return filtered;
}

function getRecentPending(results: MatchResult[]): MatchResult[] {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  return results
    .filter(r => new Date(r.kickoff) >= weekAgo)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 20);
}

// v3.0: Best/worst leagues from league_performance
function useLeagueRankings() {
  const [bestLeagues, setBestLeagues] = useState<{ name: string; winrate: number; roi: number }[]>([]);
  const [worstLeagues, setWorstLeagues] = useState<{ name: string; winrate: number; is_blacklisted: boolean }[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("league_performance")
        .select("league_name, winrate, roi, is_blacklisted, total_picks")
        .gte("total_picks", 3)
        .order("winrate", { ascending: false });

      if (data && data.length > 0) {
        setBestLeagues(
          (data as any[])
            .filter(d => d.winrate >= 50)
            .slice(0, 3)
            .map(d => ({ name: d.league_name, winrate: d.winrate, roi: d.roi }))
        );
        setWorstLeagues(
          (data as any[])
            .filter(d => d.winrate < 50)
            .slice(-3)
            .reverse()
            .map(d => ({ name: d.league_name, winrate: d.winrate, is_blacklisted: d.is_blacklisted }))
        );
      }
    }
    fetch();
  }, []);

  return { bestLeagues, worstLeagues };
}

export default function Resultats() {
  const { user, isMonthlyPremium, isAdmin } = useAuth();
  const hasAccess = isMonthlyPremium || isAdmin;
  const { results, eliteStats, allStats, topPickStats, monthStats, isLoading } = useResultStats();
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("high_conf");
  const [period, setPeriod] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const { bestLeagues, worstLeagues } = useLeagueRankings();

  const displayResults = useMemo(() => {
    if (!results) return [];
    const resolved = results.filter(r => {
      if (r.result !== "win" && r.result !== "loss") return false;
      const conf = (r.predicted_confidence || "").toUpperCase();
      if (conf === "RISQUÉ" && r.result === "loss") return false;
      return true;
    });
    return filterResults(resolved, sport, status, period);
  }, [results, sport, status, period]);

  const grouped = useMemo(() => groupByDay(displayResults), [displayResults]);
  const resolvedResults = useMemo(() => results?.filter(r => r.result === "win" || r.result === "loss") || [], [results]);
  const recentPending = useMemo(() => results ? getRecentPending(results) : [], [results]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
        <Navbar />
        <div className="container pt-20 pb-16 px-3 sm:px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center max-w-md"
          >
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Lock className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Résultats <span className="gradient-text">Premium</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              L'accès aux résultats et statistiques IA est réservé aux abonnés <strong>Premium Mensuel</strong>.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mb-6">Protège nos analyses et données exclusives.</p>
            <div className="flex flex-col gap-2">
              <Link to="/pricing">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="w-full gap-2 btn-glow">
                    <Crown className="h-4 w-4" /> Passer au Premium Mensuel — 29,90€/mois
                  </Button>
                </motion.div>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button variant="outline" className="w-full text-xs">Se connecter</Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            Résultats <span className="gradient-text">PRONOSIA v3.0</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">Performances vérifiables • Intelligence adaptative par sport</p>
        </motion.div>

        {/* Hero Stats Grid */}
        {allStats && allStats.total > 0 && (
          <motion.div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2" variants={staggerContainer} initial="hidden" animate="show">
            {[
              { icon: CheckCircle, color: "text-success", value: allStats.wins, label: "Gagnés" },
              { icon: XCircle, color: "text-destructive", value: allStats.losses, label: "Perdus" },
              { icon: BarChart3, color: "text-primary", value: `${allStats.winrate}%`, label: "Winrate" },
              { icon: DollarSign, color: allStats.profit >= 0 ? "text-success" : "text-destructive", value: `${allStats.profit >= 0 ? "+" : ""}${allStats.profit}€`, label: "Profit" },
            ].map(({ icon: Icon, color, value, label }) => (
              <motion.div key={label} variants={staggerItem} className="glass-card p-2.5 sm:p-3 text-center">
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto mb-1", color)} />
                <p className="font-display text-base sm:text-lg font-bold">{value}</p>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {allStats && allStats.total > 0 && (
          <motion.div className="mt-2 grid grid-cols-3 gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-2 text-center">
              <p className="text-[8px] text-muted-foreground">ROI</p>
              <p className={cn("font-display text-sm font-bold", allStats.roi >= 0 ? "text-success" : "text-destructive")}>
                {allStats.roi >= 0 ? "+" : ""}{allStats.roi}%
              </p>
            </div>
            <div className="glass-card p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Misé total</p>
              <p className="font-display text-sm font-bold">{allStats.totalStaked}€</p>
            </div>
            <div className="glass-card p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Total analysés</p>
              <p className="font-display text-sm font-bold">{allStats.total}</p>
            </div>
          </motion.div>
        )}

        {eliteStats && eliteStats.streak.count >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            className={cn(
              "mt-3 rounded-xl border p-3 flex items-center gap-3",
              eliteStats.streak.type === "win" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
            )}
          >
            <motion.span className="text-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              {eliteStats.streak.type === "win" ? "🔥" : "❄️"}
            </motion.span>
            <div>
              <p className="text-sm font-bold">
                Série de {eliteStats.streak.count} {eliteStats.streak.type === "win" ? "victoires" : "défaites"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {eliteStats.streak.type === "win" ? "L'IA PRONOSIA v3.0 est en feu ! 🎯" : "Phase de recalibration"}
              </p>
            </div>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">📊 Vue globale</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">📈 Détails</TabsTrigger>
            <TabsTrigger value="leagues" className="text-xs">🏆 Ligues</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">📋 Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-3">
            {results && resolvedResults.length >= 2 && <WinrateProgressChart results={results} />}
            {results && resolvedResults.length >= 2 && <ProfitChart results={results} />}

            {(eliteStats || topPickStats || monthStats) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold">Comparaison par catégorie</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {eliteStats && eliteStats.total > 0 && (
                    <div className="glass-card-elevated p-3 text-center border border-amber-400/20">
                      <p className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">ELITE</p>
                      <p className="font-display text-2xl font-bold text-amber-400 mt-1">{eliteStats.winrate}%</p>
                      <p className="text-[9px] text-muted-foreground">{eliteStats.wins}W / {eliteStats.losses}L</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">ROI: {eliteStats.roi >= 0 ? "+" : ""}{eliteStats.roi}%</p>
                    </div>
                  )}
                  {topPickStats && topPickStats.total > 0 && (
                    <div className="glass-card p-3 text-center border border-success/20">
                      <p className="text-[9px] font-semibold text-success uppercase tracking-wider">TOP PICK</p>
                      <p className="font-display text-2xl font-bold text-success mt-1">{topPickStats.winrate}%</p>
                      <p className="text-[9px] text-muted-foreground">{topPickStats.wins}W / {topPickStats.losses}L</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">ROI: {topPickStats.roi >= 0 ? "+" : ""}{topPickStats.roi}%</p>
                    </div>
                  )}
                  {monthStats && monthStats.total > 0 && (
                    <div className="glass-card p-3 text-center">
                      <p className="text-[9px] font-semibold text-primary uppercase tracking-wider">CE MOIS</p>
                      <p className="font-display text-2xl font-bold text-primary mt-1">{monthStats.winrate}%</p>
                      <p className="text-[9px] text-muted-foreground">{monthStats.wins}W / {monthStats.losses}L</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">ROI: {monthStats.roi >= 0 ? "+" : ""}{monthStats.roi}%</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-5 mt-3">
            {resolvedResults.length > 0 ? (
              <>
                <ConfidenceBreakdown results={resolvedResults} />
                <SportBreakdown results={resolvedResults} />

                {allStats && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">Forme récente</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass-card p-3 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase">10 derniers</p>
                        <p className={cn("font-display text-xl font-bold mt-1",
                          allStats.last10.winrate >= 60 ? "text-success" : allStats.last10.winrate >= 45 ? "text-primary" : "text-destructive"
                        )}>{allStats.last10.winrate}%</p>
                        <p className="text-[9px] text-muted-foreground">{allStats.last10.wins}W / {allStats.last10.total - allStats.last10.wins}L</p>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase">20 derniers</p>
                        <p className={cn("font-display text-xl font-bold mt-1",
                          allStats.last20.winrate >= 60 ? "text-success" : allStats.last20.winrate >= 45 ? "text-primary" : "text-destructive"
                        )}>{allStats.last20.winrate}%</p>
                        <p className="text-[9px] text-muted-foreground">{allStats.last20.wins}W / {allStats.last20.total - allStats.last20.wins}L</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center py-10"><p className="text-sm text-muted-foreground">Pas encore assez de données</p></div>
            )}
          </TabsContent>

          {/* v3.0: Leagues Tab */}
          <TabsContent value="leagues" className="space-y-4 mt-3">
            {bestLeagues.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold">🏆 Meilleures ligues (ROI)</h3>
                </div>
                <div className="space-y-2">
                  {bestLeagues.map((l, i) => (
                    <div key={l.name} className="glass-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        <span className="text-xs font-medium">{l.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-success font-bold">{l.winrate}% WR</span>
                        <span className={l.roi >= 0 ? "text-success" : "text-destructive"}>
                          {l.roi >= 0 ? "+" : ""}{l.roi}% ROI
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {worstLeagues.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-destructive" />
                  <h3 className="text-sm font-bold">⚠️ Ligues en difficulté</h3>
                </div>
                <div className="space-y-2">
                  {worstLeagues.map((l) => (
                    <div key={l.name} className={cn(
                      "glass-card p-3 flex items-center justify-between",
                      l.is_blacklisted && "border-destructive/20"
                    )}>
                      <div className="flex items-center gap-2">
                        {l.is_blacklisted && <span className="text-[10px] bg-destructive/10 text-destructive rounded px-1.5 py-0.5 font-bold">BLACKLISTÉE</span>}
                        <span className="text-xs font-medium">{l.name}</span>
                      </div>
                      <span className="text-xs text-destructive font-bold">{l.winrate}% WR</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {bestLeagues.length === 0 && worstLeagues.length === 0 && (
              <div className="text-center py-10">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Pas encore de données de performance par ligue</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Les données seront disponibles après le premier audit hebdomadaire</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : (
              <>
                <ResultFilters
                  sport={sport} setSport={setSport}
                  status={status} setStatus={setStatus}
                  period={period} setPeriod={setPeriod}
                />

                {grouped.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Aucun résultat pour ces filtres</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-3">
                    {grouped.map(({ label, results: groupResults }) => (
                      <div key={label}>
                        <p className="text-xs font-bold text-muted-foreground mb-2">{label}</p>
                        <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                          {groupResults.map((r, i) => (
                            <motion.div key={r.id} variants={staggerItem}>
                              <ResultCard result={r} index={i} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
