import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { Brain, TrendingUp, Target, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: matches, isLoading } = useMatches();
  useTriggerFetch();

  const safeMatches = matches?.filter(m => m.pred_confidence === "SAFE").slice(0, 3) || [];
  const valueBets = matches?.filter(m => m.pred_value_bet).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">
            Tableau de <span className="gradient-text">Bord</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Résumé de vos pronostics IA.</p>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Précision", value: "82%", icon: Target, color: "text-primary" },
            { label: "Matchs analysés", value: matches?.length?.toString() || "—", icon: BarChart3, color: "text-secondary" },
            { label: "SAFE du jour", value: safeMatches.length.toString(), icon: Zap, color: "text-success" },
            { label: "Value Bets", value: valueBets.length.toString(), icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3"
            >
              <Icon className={`h-4 w-4 ${color} mb-1.5`} />
              <p className="font-display text-xl font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Sport performance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 glass-card p-5"
        >
          <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold mb-3">
            <Brain className="h-4 w-4 text-primary" /> Performance par Sport
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { sport: "⚽ Football", accuracy: 81 },
              { sport: "🏀 Basketball", accuracy: 77 },
              { sport: "🏈 NFL/Rugby", accuracy: 76 },
            ].map(({ sport, accuracy }) => (
              <div key={sport} className="flex items-center gap-2">
                <span className="text-xs font-medium w-24">{sport}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${accuracy}%` }} />
                </div>
                <span className="text-xs font-bold w-10 text-right">{accuracy}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Best picks */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-sm font-semibold mb-3">🛡️ Pronostics SAFE</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {safeMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
                {safeMatches.length === 0 && <p className="text-xs text-muted-foreground">Aucun pronostic SAFE.</p>}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold mb-3">📈 Value Bets</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {valueBets.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
                {valueBets.length === 0 && <p className="text-xs text-muted-foreground">Aucun value bet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
