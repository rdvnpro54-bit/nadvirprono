import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/hooks/useResults";
import { useMemo } from "react";

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", tennis: "🎾", basketball: "🏀", hockey: "🏒",
  baseball: "⚾", nfl: "🏈", mma: "🥊", f1: "🏎️", afl: "🏉",
};

interface SportStat {
  sport: string;
  wins: number;
  losses: number;
  total: number;
  winrate: number;
}

function computeBySport(results: MatchResult[]): SportStat[] {
  const map: Record<string, { wins: number; losses: number }> = {};
  for (const r of results) {
    if (r.result !== "win" && r.result !== "loss") continue;
    const s = r.sport || "football";
    if (!map[s]) map[s] = { wins: 0, losses: 0 };
    if (r.result === "win") map[s].wins++;
    else map[s].losses++;
  }
  return Object.entries(map)
    .map(([sport, { wins, losses }]) => ({
      sport,
      wins,
      losses,
      total: wins + losses,
      winrate: Math.round((wins / (wins + losses)) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export function SportBreakdown({ results }: { results: MatchResult[] }) {
  const stats = useMemo(() => computeBySport(results), [results]);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Performance par sport</h3>
      </div>
      <div className="grid gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.sport}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <span className="text-lg">{SPORT_EMOJI[s.sport] || "🏆"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold capitalize">{s.sport}</span>
                <span className={cn(
                  "text-xs font-bold",
                  s.winrate >= 65 ? "text-success" : s.winrate >= 50 ? "text-primary" : "text-destructive"
                )}>
                  {s.winrate}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    s.winrate >= 65 ? "bg-success" : s.winrate >= 50 ? "bg-primary" : "bg-destructive"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.winrate}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-muted-foreground">{s.wins}W - {s.losses}L</span>
                <span className="text-[9px] text-muted-foreground">({s.total} matchs)</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
