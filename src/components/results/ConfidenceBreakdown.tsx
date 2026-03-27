import { motion } from "framer-motion";
import { Shield, Gauge, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/hooks/useResults";
import { useMemo } from "react";

interface ConfStat {
  level: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  wins: number;
  losses: number;
  total: number;
  winrate: number;
}

const CONF_META: Record<string, { icon: typeof Shield; color: string; bgColor: string; label: string }> = {
  SAFE: { icon: Shield, color: "text-success", bgColor: "bg-success/10 border-success/20", label: "SAFE" },
  "MODÉRÉ": { icon: Gauge, color: "text-primary", bgColor: "bg-primary/10 border-primary/20", label: "MODÉRÉ" },
  "RISQUÉ": { icon: AlertTriangle, color: "text-amber-400", bgColor: "bg-amber-400/10 border-amber-400/20", label: "RISQUÉ" },
};

function computeByConfidence(results: MatchResult[]): ConfStat[] {
  const map: Record<string, { wins: number; losses: number }> = {};
  for (const r of results) {
    if (r.result !== "win" && r.result !== "loss") continue;
    const conf = (r.predicted_confidence || "MODÉRÉ").toUpperCase();
    if (!map[conf]) map[conf] = { wins: 0, losses: 0 };
    if (r.result === "win") map[conf].wins++;
    else map[conf].losses++;
  }

  return ["SAFE", "MODÉRÉ", "RISQUÉ"]
    .filter(level => map[level])
    .map(level => {
      const { wins, losses } = map[level];
      const meta = CONF_META[level] || CONF_META["MODÉRÉ"];
      return {
        level: meta.label,
        icon: meta.icon,
        color: meta.color,
        bgColor: meta.bgColor,
        wins,
        losses,
        total: wins + losses,
        winrate: Math.round((wins / (wins + losses)) * 100),
      };
    });
}

export function ConfidenceBreakdown({ results }: { results: MatchResult[] }) {
  const stats = useMemo(() => computeByConfidence(results), [results]);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Winrate par confiance</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={cn("rounded-xl border p-3 text-center", s.bgColor)}
            >
              <Icon className={cn("h-5 w-5 mx-auto mb-1.5", s.color)} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.level}</p>
              <p className={cn("font-display text-2xl font-bold mt-0.5", s.color)}>{s.winrate}%</p>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden mt-2 mx-4">
                <motion.div
                  className={cn("h-full rounded-full", s.winrate >= 60 ? "bg-success" : s.winrate >= 45 ? "bg-primary" : "bg-destructive")}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.winrate}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">
                {s.wins}W / {s.losses}L — {s.total} matchs
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
