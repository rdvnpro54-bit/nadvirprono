import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import type { MatchResult } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultFilters } from "@/components/results/ResultFilters";
import { ResultCard } from "@/components/results/ResultCard";
import { StatsGrid } from "@/components/results/StatsGrid";

function groupByDay(results: MatchResult[]): { label: string; results: MatchResult[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, MatchResult[]> = {};
  for (const r of results) {
    const d = new Date(r.kickoff);
    let label: string;
    if (d.toDateString() === today) label = "Aujourd'hui";
    else if (d.toDateString() === yesterday) label = "Hier";
    else label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  }

  return Object.entries(groups).map(([label, results]) => ({ label, results }));
}

function filterResults(results: MatchResult[], sport: string, status: string, period: string): MatchResult[] {
  let filtered = results;
  if (sport !== "all") filtered = filtered.filter(r => r.sport === sport);
  if (status !== "all") filtered = filtered.filter(r => r.result === status);
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

export default function Resultats() {
  const { allStats, topPickStats, monthStats, results, isLoading } = useResultStats();
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");

  const filteredResults = useMemo(
    () => (results ? filterResults(results, sport, status, period) : []),
    [results, sport, status, period]
  );
  const grouped = useMemo(() => groupByDay(filteredResults), [filteredResults]);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            Résultats <span className="gradient-text">IA</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
            Performances réelles • Transparence totale • Mise fixe 10€/match
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
            <p className="mt-1 text-xs text-muted-foreground">Les résultats apparaîtront automatiquement après chaque match.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="text-[11px] sm:text-xs">📊 Vue globale</TabsTrigger>
              <TabsTrigger value="history" className="text-[11px] sm:text-xs">📋 Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {monthStats && monthStats.total > 0 && (
                <StatsGrid stats={monthStats} title="Ce mois-ci" icon={Trophy} />
              )}
              {allStats && (
                <StatsGrid stats={allStats} title="Tous les pronostics" icon={BarChart3} />
              )}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-3 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  📊 Statistiques calculées automatiquement à partir des résultats réels.
                  <br />Aucune manipulation. Mise fixe de 10€ par pronostic. Cotes estimées.
                </p>
              </motion.div>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              <ResultFilters sport={sport} setSport={setSport} status={status} setStatus={setStatus} period={period} setPeriod={setPeriod} />

              <p className="text-[10px] text-muted-foreground">
                {filteredResults.length} pronostic{filteredResults.length !== 1 ? "s" : ""} affiché{filteredResults.length !== 1 ? "s" : ""}
                {filteredResults.length !== (results?.length ?? 0) && ` sur ${results?.length}`}
              </p>

              {grouped.length > 0 ? (
                grouped.map(group => (
                  <div key={group.label} className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1 z-10">
                      {group.label}
                    </h3>
                    {group.results.map((r, i) => (
                      <ResultCard key={r.id} result={r} index={i} />
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center rounded-xl border bg-card p-8">
                  <p className="text-sm font-semibold">Aucun résultat pour ces filtres</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
