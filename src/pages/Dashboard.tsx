import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { aiPerformanceStats } from "@/data/simulatedData";
import { Brain, TrendingUp, Target, Zap, BarChart3, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: matches, isLoading } = useMatches();
  useTriggerFetch();
  
  const safeMatches = matches?.filter(m => m.pred_confidence === "SAFE").slice(0, 3) || [];
  const valueBets = matches?.filter(m => m.pred_value_bet).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">
            Tableau de <span className="gradient-text">Bord</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Bienvenue ! Voici un résumé de vos pronostics IA.</p>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Précision Globale", value: "82%", icon: Target, color: "text-primary" },
            { label: "Pronostics Analysés", value: aiPerformanceStats.totalPredictions.toLocaleString(), icon: BarChart3, color: "text-accent" },
            { label: "Série Gagnante", value: `${aiPerformanceStats.streakWins}`, icon: Zap, color: "text-success" },
            { label: "ROI Mensuel", value: `+${aiPerformanceStats.monthlyROI}%`, icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className="font-display text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Performance by sport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6"
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
            <Brain className="h-5 w-5 text-primary" /> Performance par Sport
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { sport: "⚽ Football", accuracy: aiPerformanceStats.footballAccuracy },
              { sport: "🏀 Basketball", accuracy: aiPerformanceStats.basketballAccuracy },
              { sport: "🏈 NFL/Rugby", accuracy: 76 },
            ].map(({ sport, accuracy }) => (
              <div key={sport} className="flex items-center gap-3">
                <span className="text-sm font-medium w-28">{sport}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${accuracy}%` }} />
                </div>
                <span className="text-sm font-bold w-12 text-right">{accuracy}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card p-6"
        >
          <h2 className="font-display text-lg font-semibold mb-4">Résultats de la Semaine</h2>
          <div className="flex items-end justify-between gap-2">
            {aiPerformanceStats.weeklyResults.map(({ day, wins, total }) => {
              const pct = Math.round((wins / total) * 100);
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-primary">{pct}%</span>
                  <div className="relative h-20 w-full rounded-md bg-muted overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-primary/70 rounded-md transition-all" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Best picks */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">🛡️ Pronostics SAFE du Jour</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {safeMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
                {safeMatches.length === 0 && <p className="text-sm text-muted-foreground">Aucun pronostic SAFE aujourd'hui.</p>}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">📈 Value Bets du Jour</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {valueBets.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
                {valueBets.length === 0 && <p className="text-sm text-muted-foreground">Aucun value bet détecté.</p>}
              </div>
            )}
          </div>
        </div>

        {/* Free tier notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass-card p-6 glow-border text-center"
        >
          <p className="font-display text-lg font-semibold">🎁 1 pronostic gratuit restant aujourd'hui</p>
          <p className="mt-1 text-sm text-muted-foreground">Passez Premium pour un accès illimité à tous les pronostics IA.</p>
        </motion.div>
      </div>
    </div>
  );
}
