import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, TrendingUp, Trophy, Target, DollarSign, BarChart3, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultStats } from "@/hooks/useResults";

function StatCard({ icon: Icon, label, value, color, prefix = "" }: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="glass-card p-3 sm:p-4 flex flex-col items-center gap-1.5 text-center">
      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
      <span className="font-display text-lg sm:text-xl font-bold">{prefix}{value}</span>
      <span className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StatsGrid({ stats, title, icon: Icon }: { stats: ResultStats; title: string; icon: typeof Trophy }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={CheckCircle} label="Gagnés" value={stats.wins} color="text-success" />
        <StatCard icon={XCircle} label="Perdus" value={stats.losses} color="text-destructive" />
        <StatCard icon={BarChart3} label="Winrate" value={`${stats.winrate}%`} color="text-primary" />
        <StatCard icon={DollarSign} label="Profit" value={`${stats.profit}€`} color={stats.profit >= 0 ? "text-success" : "text-destructive"} prefix={stats.profit >= 0 ? "+" : ""} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Target} label="Paris total" value={stats.total} color="text-muted-foreground" />
        <StatCard icon={TrendingUp} label="ROI" value={`${stats.roi}%`} color={stats.roi >= 0 ? "text-success" : "text-destructive"} prefix={stats.roi >= 0 ? "+" : ""} />
        <StatCard icon={DollarSign} label="Misé total" value={`${stats.totalStaked}€`} color="text-muted-foreground" />
      </div>
    </motion.div>
  );
}

function ResultRow({ result, index }: { result: any; index: number }) {
  const date = new Date(result.kickoff).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const time = new Date(result.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const isWin = result.result === "win";
  const sportEmoji = result.sport === "football" ? "⚽" : result.sport === "tennis" ? "🎾" : "🏀";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="glass-card p-3 flex items-center gap-3"
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isWin ? "bg-success/15" : "bg-destructive/15"
      )}>
        {isWin ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">{sportEmoji}</span>
          <span className="text-[10px] font-semibold uppercase text-muted-foreground truncate">{result.league_name}</span>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            result.predicted_confidence === "SAFE" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          )}>
            {result.predicted_confidence}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold truncate mt-0.5">
          {result.home_team} vs {result.away_team}
        </p>
        <p className="text-[10px] text-muted-foreground">
          🎯 Prédiction : {result.predicted_winner} • {date} à {time}
        </p>
      </div>
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0",
        isWin ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
      )}>
        {isWin ? "✅ Gagné" : "❌ Perdu"}
      </span>
    </motion.div>
  );
}

export default function Resultats() {
  const { allStats, topPickStats, monthStats, results, isLoading } = useResultStats();

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
          <div className="mt-10 text-center glass-card p-8">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-sm font-semibold">Aucun résultat disponible</p>
            <p className="mt-1 text-xs text-muted-foreground">Les résultats apparaîtront automatiquement après chaque match.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="text-[11px] sm:text-xs">📊 Vue globale</TabsTrigger>
              <TabsTrigger value="toppicks" className="text-[11px] sm:text-xs">💎 Top Picks</TabsTrigger>
              <TabsTrigger value="history" className="text-[11px] sm:text-xs">📋 Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Month stats */}
              {monthStats && monthStats.total > 0 && (
                <StatsGrid stats={monthStats} title="Ce mois-ci" icon={Trophy} />
              )}

              {/* All time */}
              {allStats && (
                <StatsGrid stats={allStats} title="Tous les pronostics" icon={BarChart3} />
              )}

              {/* Transparency note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-3 sm:p-4 text-center"
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  📊 Statistiques calculées automatiquement à partir des résultats réels.
                  <br />Aucune manipulation. Mise fixe de 10€ par pronostic. Cotes estimées.
                </p>
              </motion.div>
            </TabsContent>

            <TabsContent value="toppicks" className="mt-4 space-y-6">
              {topPickStats && topPickStats.total > 0 ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-success/20 bg-success/5 p-3 sm:p-4 flex items-center gap-3"
                  >
                    <Flame className="h-5 w-5 text-success shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold">
                        💎 Top Picks IA — Confiance SAFE uniquement
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Sélection des matchs avec confiance ≥ 8/10 • Résultats vérifiés
                      </p>
                    </div>
                  </motion.div>
                  <StatsGrid stats={topPickStats} title="Performance Top Picks" icon={Flame} />
                </>
              ) : (
                <div className="text-center glass-card p-8">
                  <p className="text-sm font-semibold">Pas assez de données Top Pick</p>
                </div>
              )}

              {/* Comparison */}
              {topPickStats && allStats && topPickStats.total > 0 && allStats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-3 sm:p-4"
                >
                  <h4 className="text-xs font-bold mb-2">📊 Comparaison</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winrate Top Picks</span>
                      <span className="font-bold text-success">{topPickStats.winrate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winrate Global</span>
                      <span className="font-bold">{allStats.winrate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI Top Picks</span>
                      <span className={cn("font-bold", topPickStats.roi >= 0 ? "text-success" : "text-destructive")}>
                        {topPickStats.roi >= 0 ? "+" : ""}{topPickStats.roi}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI Global</span>
                      <span className={cn("font-bold", allStats.roi >= 0 ? "text-success" : "text-destructive")}>
                        {allStats.roi >= 0 ? "+" : ""}{allStats.roi}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {results && results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <ResultRow key={r.id} result={r} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center glass-card p-8">
                  <p className="text-sm font-semibold">Aucun historique</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
