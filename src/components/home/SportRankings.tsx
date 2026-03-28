import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import { useAllResults } from "@/hooks/useResults";
import { cn } from "@/lib/utils";

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", baseball: "⚾",
  hockey: "🏒", rugby: "🏉", mma: "🥊", afl: "🏈", f1: "🏎️",
};

interface SportRank {
  sport: string;
  wins: number;
  total: number;
  winrate: number;
}

export function SportRankings() {
  const { data: results } = useAllResults();

  const rankings = useMemo(() => {
    if (!results) return [];
    const map = new Map<string, { wins: number; total: number }>();
    for (const r of results) {
      if (r.result !== "win" && r.result !== "loss") continue;
      const entry = map.get(r.sport) || { wins: 0, total: 0 };
      entry.total++;
      if (r.result === "win") entry.wins++;
      map.set(r.sport, entry);
    }
    const ranks: SportRank[] = [];
    for (const [sport, { wins, total }] of map) {
      if (total < 3) continue;
      ranks.push({ sport, wins, total, winrate: Math.round((wins / total) * 100) });
    }
    return ranks.sort((a, b) => b.winrate - a.winrate).slice(0, 5);
  }, [results]);

  if (rankings.length < 2) return null;

  return (
    <section className="border-t border-border/20 py-8 sm:py-12">
      <div className="container px-3 sm:px-4 max-w-2xl">
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-lg sm:text-xl font-bold inline-flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Classement par sport
          </h2>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground/70">
            Performance IA par discipline
          </p>
        </motion.div>

        <div className="space-y-2">
          {rankings.map((r, i) => (
            <motion.div
              key={r.sport}
              className="glass-card p-3 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="text-lg w-7 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <span className="text-base">{SPORT_EMOJI[r.sport] || "🏅"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold capitalize">{r.sport}</p>
                <div className="mt-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      r.winrate >= 70 ? "bg-success" : r.winrate >= 50 ? "bg-primary" : "bg-destructive"
                    )}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${r.winrate}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold",
                  r.winrate >= 70 ? "text-success" : r.winrate >= 50 ? "text-primary" : "text-destructive"
                )}>
                  {r.winrate}%
                </p>
                <p className="text-[9px] text-muted-foreground">{r.wins}W/{r.total - r.wins}L</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
