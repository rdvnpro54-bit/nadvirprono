import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import type { MatchResult } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { ResultFilters } from "@/components/results/ResultFilters";
import { ResultCard } from "@/components/results/ResultCard";

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

function filterResults(results: MatchResult[], sport: string, status: string, period: string): MatchResult[] {
  let filtered = results;
  if (sport !== "all") filtered = filtered.filter(r => r.sport === sport);
  if (status === "win") filtered = filtered.filter(r => r.result === "win");
  else if (status === "loss") filtered = filtered.filter(r => r.result === "loss");
  else if (status === "high_conf") filtered = filtered.filter(r => {
    const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
    return maxProb >= 60 || r.predicted_confidence === "SAFE";
  });
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

/** Get top performances: high confidence wins sorted by probability */
function getTopPerformances(results: MatchResult[]): MatchResult[] {
  return results
    .filter(r => r.result === "win" && Math.max(r.pred_home_win, r.pred_away_win) >= 60)
    .sort((a, b) => Math.max(b.pred_home_win, b.pred_away_win) - Math.max(a.pred_home_win, a.pred_away_win))
    .slice(0, 12);
}

export default function Resultats() {
  const { results, isLoading } = useResultStats();
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("high_conf");
  const [period, setPeriod] = useState("all");

  const filteredResults = useMemo(
    () => (results ? filterResults(results, sport, status, period) : []),
    [results, sport, status, period]
  );
  const grouped = useMemo(() => groupByDay(filteredResults), [filteredResults]);

  const topPerformances = useMemo(
    () => (results ? getTopPerformances(results) : []),
    [results]
  );

  const highConfStats = useMemo(() => {
    if (!results) return null;
    const hc = results.filter(r => Math.max(r.pred_home_win, r.pred_away_win) >= 60 && (r.result === "win" || r.result === "loss"));
    const wins = hc.filter(r => r.result === "win").length;
    const total = hc.length;
    return { wins, total, winrate: total > 0 ? Math.round((wins / total) * 100) : 0 };
  }, [results]);

  // Console diagnostics
  useMemo(() => {
    if (!results) return;
    const wins = results.filter(r => r.result === "win").length;
    const losses = results.filter(r => r.result === "loss").length;
    console.log(`[PRONOSIA] ━━━ Résultats ━━━`);
    console.log(`[PRONOSIA] Total résultats: ${results.length} | Gagnés: ${wins} | Perdus: ${losses}`);
    console.log(`[PRONOSIA] Winrate: ${results.length > 0 ? Math.round((wins / results.length) * 100) : 0}%`);
  }, [results]);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            Résultats <span className="gradient-text">IA</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
            Sélection IA optimisée • Analyse basée sur les meilleures opportunités
          </p>
        </motion.div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : !allStats || allStats.total === 0 ? (
          <div className="mt-10 text-center rounded-xl border bg-card p-8">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-sm font-semibold">Aucun résultat disponible</p>
            <p className="mt-1 text-xs text-muted-foreground">Les résultats apparaîtront automatiquement après chaque match terminé avec des scores réels.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* TOP PERFORMANCES SECTION */}
            {topPerformances.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Top performances IA</span>
                  </div>
                  {highConfStats && highConfStats.total > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {highConfStats.winrate}% de réussite sur {highConfStats.total} pronostics haute confiance
                    </span>
                  )}
                </div>

                <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-3 space-y-2">
                  {topPerformances.map((r, i) => (
                    <ResultCard key={r.id} result={r} index={i} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Historique complet */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold">📋 Historique complet</h2>
              <ResultFilters sport={sport} setSport={setSport} status={status} setStatus={setStatus} period={period} setPeriod={setPeriod} />

              <p className="text-[10px] text-muted-foreground">
                {filteredResults.length} pronostic{filteredResults.length !== 1 ? "s" : ""} affiché{filteredResults.length !== 1 ? "s" : ""}
                {filteredResults.length !== (results?.length ?? 0) && ` sur ${results?.length}`}
                {" "}— gagnés et perdus inclus
              </p>

              {grouped.length > 0 ? (
                <>
                  {grouped.map(group => (
                    <div key={group.label} className="space-y-2">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1 z-10">
                        {group.label}
                      </h3>
                      {group.results.map((r, i) => (
                        <ResultCard key={r.id} result={r} index={i} />
                      ))}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center rounded-xl border bg-card p-8">
                  <p className="text-sm font-semibold">Aucun résultat pour ces filtres</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
