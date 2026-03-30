import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import type { MatchResult } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Crown, BarChart3, TrendingUp, Trophy, Filter, Flame, DollarSign, CheckCircle, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const staggerItem = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function Historique() {
  const { user, isMonthlyPremium, isPremiumPlus, isAdmin } = useAuth();
  const hasAccess = isMonthlyPremium || isAdmin;
  const { results, allStats, isLoading } = useResultStats();
  const [sportFilter, setSportFilter] = useState("all");
  const [confFilter, setConfFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stake, setStake] = useState(10);

  const resolvedResults = useMemo(() => {
    if (!results) return [];
    let filtered = results.filter(r => r.result === "win" || r.result === "loss");
    if (sportFilter !== "all") filtered = filtered.filter(r => r.sport === sportFilter);
    if (confFilter !== "all") filtered = filtered.filter(r => r.predicted_confidence === confFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.home_team.toLowerCase().includes(q) ||
        r.away_team.toLowerCase().includes(q) ||
        r.league_name.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
  }, [results, sportFilter, confFilter, search]);

  // ROI Calculator
  const roiCalc = useMemo(() => {
    const avgOdds = 1.85;
    const allPicks = resolvedResults;
    const safeOnly = resolvedResults.filter(r => r.predicted_confidence === "SAFE");

    const calc = (picks: typeof resolvedResults) => {
      const w = picks.filter(r => r.result === "win").length;
      const t = picks.length;
      const revenue = w * stake * avgOdds;
      const cost = t * stake;
      const profit = revenue - cost;
      const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;
      return { wins: w, total: t, profit: Math.round(profit * 100) / 100, roi };
    };

    return { all: calc(allPicks), safe: calc(safeOnly) };
  }, [resolvedResults, stake]);

  // Streaks
  const streaks = useMemo(() => {
    if (!results) return { longest_win: 0, longest_loss: 0, current: { type: "none" as string, count: 0 } };
    const resolved = results
      .filter(r => r.result === "win" || r.result === "loss")
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    let longestWin = 0, longestLoss = 0, currentStreak = 0, currentType = "";
    let tempWin = 0, tempLoss = 0;

    for (const r of resolved) {
      if (r.result === "win") {
        tempWin++;
        tempLoss = 0;
        if (tempWin > longestWin) longestWin = tempWin;
      } else {
        tempLoss++;
        tempWin = 0;
        if (tempLoss > longestLoss) longestLoss = tempLoss;
      }
    }

    // Current streak
    for (let i = resolved.length - 1; i >= 0; i--) {
      if (i === resolved.length - 1) {
        currentType = resolved[i].result!;
        currentStreak = 1;
      } else if (resolved[i].result === currentType) {
        currentStreak++;
      } else break;
    }

    return { longest_win: longestWin, longest_loss: longestLoss, current: { type: currentType, count: currentStreak } };
  }, [results]);

  // Sports list
  const sports = useMemo(() => {
    if (!results) return [];
    return [...new Set(results.map(r => r.sport))];
  }, [results]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
        <Navbar />
        <div className="container pt-20 pb-16 px-3 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <Lock className="mx-auto mb-4 h-12 w-12 text-primary/60" />
            <h1 className="font-display text-xl font-bold mb-2">Historique <span className="gradient-text">Premium</span></h1>
            <p className="text-sm text-muted-foreground mb-6">Accédez à l'historique complet des prédictions IA avec le plan Premium.</p>
            <Link to="/pricing"><Button className="gap-2"><Crown className="h-4 w-4" /> Voir les plans</Button></Link>
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
            Historique <span className="gradient-text">Complet</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">Toutes les prédictions IA • Filtres avancés • Calculateur ROI</p>
        </motion.div>

        <Tabs defaultValue="history" className="mt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="history" className="text-xs">📋 Chronologie</TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs">💰 Calculateur ROI</TabsTrigger>
            <TabsTrigger value="streaks" className="text-xs">🔥 Séries</TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="mt-3 space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Rechercher équipe/ligue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[200px] h-8 text-xs"
              />
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="all">Tous les sports</option>
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={confFilter}
                onChange={(e) => setConfFilter(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="all">Toutes confiances</option>
                <option value="SAFE">SAFE</option>
                <option value="MODÉRÉ">MODÉRÉ</option>
                <option value="RISQUÉ">RISQUÉ</option>
              </select>
              <span className="flex items-center text-[10px] text-muted-foreground">{resolvedResults.length} résultats</span>
            </div>

            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : resolvedResults.length === 0 ? (
              <div className="text-center py-10"><p className="text-sm text-muted-foreground">Aucun résultat trouvé</p></div>
            ) : (
              <motion.div className="space-y-1.5" variants={staggerContainer} initial="hidden" animate="show">
                {resolvedResults.slice(0, 50).map((r) => {
                  const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
                  const isWin = r.result === "win";
                  return (
                    <motion.div
                      key={r.id}
                      variants={staggerItem}
                      className={cn(
                        "rounded-lg border p-2.5 flex items-center gap-3 text-xs",
                        isWin ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
                      )}
                    >
                      <span className="text-lg shrink-0">{isWin ? "✅" : "❌"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{r.home_team} vs {r.away_team}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span>{r.league_name}</span>
                          <span>•</span>
                          <span>{new Date(r.kickoff).toLocaleDateString("fr-FR")}</span>
                          <span>•</span>
                          <span className="capitalize">{r.sport}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <span className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                          r.predicted_confidence === "SAFE" ? "bg-success/15 text-success" :
                          r.predicted_confidence === "MODÉRÉ" ? "bg-warning/15 text-warning" :
                          "bg-destructive/15 text-destructive"
                        )}>
                          {r.predicted_confidence}
                        </span>
                        <p className="text-[9px] text-muted-foreground">{maxProb}%</p>
                        {r.actual_home_score !== null && (
                          <p className="text-[9px] font-mono">{r.actual_home_score}-{r.actual_away_score}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {resolvedResults.length > 50 && (
                  <p className="text-center text-[10px] text-muted-foreground py-2">
                    Affichage limité à 50 résultats — utilisez les filtres pour affiner
                  </p>
                )}
              </motion.div>
            )}
          </TabsContent>

          {/* ROI Calculator */}
          <TabsContent value="calculator" className="mt-3 space-y-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold mb-3">
                <DollarSign className="h-4 w-4 text-primary" /> Calculateur ROI
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs text-muted-foreground">Mise par pick (€) :</label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value) || 10)}
                  className="w-24 h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-semibold">Tous les picks</p>
                  <p className={cn("font-display text-xl font-bold mt-1", roiCalc.all.profit >= 0 ? "text-success" : "text-destructive")}>
                    {roiCalc.all.profit >= 0 ? "+" : ""}{roiCalc.all.profit}€
                  </p>
                  <p className="text-[9px] text-muted-foreground">{roiCalc.all.wins}W / {roiCalc.all.total}T • ROI {roiCalc.all.roi}%</p>
                </div>
                <div className="rounded-lg bg-success/5 border border-success/20 p-3 text-center">
                  <p className="text-[9px] text-success uppercase font-semibold">SAFE uniquement</p>
                  <p className={cn("font-display text-xl font-bold mt-1", roiCalc.safe.profit >= 0 ? "text-success" : "text-destructive")}>
                    {roiCalc.safe.profit >= 0 ? "+" : ""}{roiCalc.safe.profit}€
                  </p>
                  <p className="text-[9px] text-muted-foreground">{roiCalc.safe.wins}W / {roiCalc.safe.total}T • ROI {roiCalc.safe.roi}%</p>
                </div>
              </div>

              <p className="mt-3 text-[9px] text-muted-foreground/60 text-center">
                Basé sur une cote moyenne de 1.85 • Simulation à titre indicatif
              </p>
            </motion.div>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="mt-3 space-y-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-3 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">Plus longue série W</p>
                  <p className="font-display text-2xl font-bold text-success mt-1">{streaks.longest_win}</p>
                  <p className="text-lg">🔥</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">Plus longue série L</p>
                  <p className="font-display text-2xl font-bold text-destructive mt-1">{streaks.longest_loss}</p>
                  <p className="text-lg">❄️</p>
                </div>
                <div className={cn(
                  "glass-card p-3 text-center border",
                  streaks.current.type === "win" ? "border-success/20" : "border-destructive/20"
                )}>
                  <p className="text-[9px] text-muted-foreground uppercase">Série actuelle</p>
                  <p className={cn(
                    "font-display text-2xl font-bold mt-1",
                    streaks.current.type === "win" ? "text-success" : "text-destructive"
                  )}>
                    {streaks.current.count}
                  </p>
                  <p className="text-lg">{streaks.current.type === "win" ? "✅" : "❌"}</p>
                </div>
              </div>

              {/* Day of week heatmap */}
              {resolvedResults.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-sm font-bold mb-3">📅 Performance par jour</h3>
                  <div className="grid grid-cols-7 gap-1.5">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, dayIndex) => {
                      const dayResults = resolvedResults.filter(r => new Date(r.kickoff).getDay() === (dayIndex === 6 ? 0 : dayIndex + 1));
                      const dayWins = dayResults.filter(r => r.result === "win").length;
                      const dayTotal = dayResults.length;
                      const dayWinrate = dayTotal > 0 ? Math.round((dayWins / dayTotal) * 100) : -1;

                      return (
                        <div key={day} className="text-center">
                          <p className="text-[9px] text-muted-foreground mb-1">{day}</p>
                          <div className={cn(
                            "rounded-lg p-2 text-xs font-bold",
                            dayWinrate === -1 ? "bg-muted/30 text-muted-foreground" :
                            dayWinrate >= 60 ? "bg-success/20 text-success" :
                            dayWinrate >= 45 ? "bg-warning/20 text-warning" :
                            "bg-destructive/20 text-destructive"
                          )}>
                            {dayWinrate >= 0 ? `${dayWinrate}%` : "—"}
                          </div>
                          <p className="text-[8px] text-muted-foreground mt-0.5">{dayTotal}p</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
