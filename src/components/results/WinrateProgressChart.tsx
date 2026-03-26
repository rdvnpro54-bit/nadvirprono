import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import type { MatchResult } from "@/hooks/useResults";

interface WinrateProgressChartProps {
  results: MatchResult[];
}

export function WinrateProgressChart({ results }: WinrateProgressChartProps) {
  const data = useMemo(() => {
    const resolved = results
      .filter(r => r.result === "win" || r.result === "loss")
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    if (resolved.length < 2) return [];

    let wins = 0;
    let total = 0;
    const points: { date: string; winrate: number; total: number }[] = [];

    for (const r of resolved) {
      total++;
      if (r.result === "win") wins++;
      const date = new Date(r.kickoff).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      points.push({ date, winrate: Math.round((wins / total) * 100), total });
    }

    return points;
  }, [results]);

  if (data.length < 2) return null;

  const lastWinrate = data[data.length - 1]?.winrate || 0;
  const isPositive = lastWinrate >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-4 mt-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold">📈 Progression du Winrate</h3>
          <p className="text-[9px] text-muted-foreground">Évolution sur {data.length} pronostics</p>
        </div>
        <span className={`text-lg font-display font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
          {lastWinrate}%
        </span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="winrateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "hsl(145 80% 42%)" : "hsl(0 72% 51%)"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? "hsl(145 80% 42%)" : "hsl(0 72% 51%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 10% 15%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215 15% 50%)" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(225 18% 8%)", border: "1px solid hsl(225 10% 15%)", borderRadius: "8px", fontSize: "11px" }}
              labelStyle={{ color: "hsl(210 40% 96%)" }}
              formatter={(value: number) => [`${value}%`, "Winrate"]}
            />
            <Area
              type="monotone"
              dataKey="winrate"
              stroke={isPositive ? "hsl(145 80% 42%)" : "hsl(0 72% 51%)"}
              strokeWidth={2}
              fill="url(#winrateGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
