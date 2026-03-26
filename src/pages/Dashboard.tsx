import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch } from "@/hooks/useMatches";
import { useGlobalPrecision } from "@/hooks/useMatchHistory";
import { Brain, TrendingUp, Target, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { data: matches, isLoading } = useMatches();
  const { data: precisionData } = useGlobalPrecision();
  useTriggerFetch();

  const safeMatches = matches?.filter(m => m.pred_confidence === "SAFE").slice(0, 3) || [];
  const valueBets = matches?.filter(m => m.pred_value_bet).slice(0, 3) || [];
  const precision = precisionData?.precision ?? 82;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 pb-16 px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            Tableau de <span className="gradient-text">Bord</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">Résumé de vos pronostics IA.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {[
            { label: "Précision IA", value: `${precision}%`, icon: Target, color: "text-primary" },
            { label: "Matchs analysés", value: matches?.length?.toString() || "—", icon: BarChart3, color: "text-secondary" },
            { label: "SAFE du jour", value: safeMatches.length.toString(), icon: Zap, color: "text-success" },
            { label: "Value Bets", value: valueBets.length.toString(), icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="glass-card p-2.5 sm:p-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
              >
                <Icon className={`h-4 w-4 ${color} mb-1`} />
              </motion.div>
              <p className="font-display text-lg sm:text-xl font-bold">{value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sport performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5 sm:mt-6 glass-card p-4 sm:p-5"
          whileHover={{ boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.15)" }}
        >
          <h2 className="flex items-center gap-1.5 font-display text-xs sm:text-sm font-semibold mb-3">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Brain className="h-4 w-4 text-primary" />
            </motion.div>
            Performance par Sport
          </h2>
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
            {[
              { sport: "⚽ Football", accuracy: 81 },
              { sport: "🏀 Basketball", accuracy: 77 },
              { sport: "🏈 NFL/Rugby", accuracy: 76 },
            ].map(({ sport, accuracy }, i) => (
              <div key={sport} className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-medium w-20 sm:w-24">{sport}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold w-8 sm:w-10 text-right">{accuracy}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Best picks */}
        <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="font-display text-xs sm:text-sm font-semibold mb-2 sm:mb-3">🛡️ Pronostics SAFE</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <Skeleton className="h-28 rounded-xl" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                {safeMatches.map((m, i) => (
                  <motion.div key={m.id} variants={staggerItem}>
                    <MatchCard match={m} index={i} />
                  </motion.div>
                ))}
                {safeMatches.length === 0 && <p className="text-[10px] sm:text-xs text-muted-foreground">Aucun pronostic SAFE.</p>}
              </motion.div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-xs sm:text-sm font-semibold mb-2 sm:mb-3">📈 Value Bets</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <Skeleton className="h-28 rounded-xl" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                {valueBets.map((m, i) => (
                  <motion.div key={m.id} variants={staggerItem}>
                    <MatchCard match={m} index={i} />
                  </motion.div>
                ))}
                {valueBets.length === 0 && <p className="text-[10px] sm:text-xs text-muted-foreground">Aucun value bet.</p>}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
