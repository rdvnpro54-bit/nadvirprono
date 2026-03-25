import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MatchResult } from "@/hooks/useResults";

const FIXED_STAKE = 10;

function estimateOdds(probability: number): number {
  if (probability <= 0) return 2.0;
  const raw = 100 / probability;
  return Math.round(Math.max(raw * 0.92, 1.1) * 100) / 100;
}

interface ChartPoint {
  date: string;
  profit: number;
  cumulative: number;
}

export function ProfitChart({ results }: { results: MatchResult[] }) {
  const data = useMemo(() => {
    if (!results || results.length === 0) return [];

    // Sort by kickoff ascending
    const sorted = [...results]
      .filter(r => r.result === "win" || r.result === "loss")
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    // Group by day
    const byDay = new Map<string, { wins: number; losses: number; profit: number }>();
    for (const r of sorted) {
      const day = new Date(r.kickoff).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const entry = byDay.get(day) || { wins: 0, losses: 0, profit: 0 };
      if (r.result === "win") {
        const winProb = r.predicted_winner === r.home_team ? r.pred_home_win : r.pred_away_win;
        const odds = estimateOdds(winProb);
        entry.wins++;
        entry.profit += FIXED_STAKE * odds - FIXED_STAKE;
      } else {
        entry.losses++;
        entry.profit -= FIXED_STAKE;
      }
      byDay.set(day, entry);
    }

    // Build cumulative
    let cumulative = 0;
    const points: ChartPoint[] = [];
    for (const [date, entry] of byDay) {
      cumulative += entry.profit;
      points.push({
        date,
        profit: Math.round(entry.profit * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
      });
    }

    return points;
  }, [results]);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">📈 Le graphique des gains apparaîtra après les premiers résultats.</p>
      </div>
    );
  }

  const lastPoint = data[data.length - 1];
  const isPositive = lastPoint.cumulative >= 0;

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold">📈 Évolution des gains</h3>
        <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
          {isPositive ? "+" : ""}{lastPoint.cumulative}€
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}€`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value: number) => [`${value}€`, "Cumul"]}
            labelFormatter={(label) => `📅 ${label}`}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
            fill="url(#profitGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[9px] text-muted-foreground text-center">
        Mise fixe 10€/match • Cotes estimées • Gains cumulés
      </p>
    </div>
  );
}
