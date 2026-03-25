import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/hooks/useResults";

function estimateOdds(probability: number): number {
  if (probability <= 0) return 2.0;
  const raw = 100 / probability;
  return Math.round(Math.max(raw * 0.92, 1.1) * 100) / 100;
}

const sportEmojis: Record<string, string> = {
  football: "⚽",
  tennis: "🎾",
  basketball: "🏀",
};

export function ResultCard({ result, index }: { result: MatchResult; index: number }) {
  const date = new Date(result.kickoff).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const time = new Date(result.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const isWin = result.result === "win";
  const emoji = sportEmojis[result.sport] || "⚽";

  const winProb = result.predicted_winner === result.home_team ? result.pred_home_win : result.pred_away_win;
  const odds = estimateOdds(winProb);

  // Determine real winner from scores
  let realWinner = "—";
  if (result.actual_home_score != null && result.actual_away_score != null) {
    if (result.actual_home_score > result.actual_away_score) realWinner = result.home_team;
    else if (result.actual_away_score > result.actual_home_score) realWinner = result.away_team;
    else realWinner = "Match nul";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className={cn(
        "rounded-xl border p-3 sm:p-4 space-y-2",
        isWin ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">{emoji}</span>
          <span className="text-[10px] font-semibold uppercase text-muted-foreground truncate">{result.league_name}</span>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-bold shrink-0",
            result.predicted_confidence === "SAFE" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          )}>
            {result.predicted_confidence}
          </span>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shrink-0",
          isWin ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
        )}>
          {isWin ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {isWin ? "GAGNÉ" : "PERDU"}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{result.home_team} vs {result.away_team}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{date} • {time}</p>
        </div>
        {result.actual_home_score != null && result.actual_away_score != null && (
          <div className="text-center shrink-0">
            <p className="text-lg font-bold font-display">{result.actual_home_score} - {result.actual_away_score}</p>
            <p className="text-[9px] text-muted-foreground">Score final</p>
          </div>
        )}
      </div>

      {/* Prediction vs Reality */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">🎯 Prédiction IA</p>
          <p className="text-xs font-semibold mt-0.5">{result.predicted_winner}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">🏆 Résultat réel</p>
          <p className="text-xs font-semibold mt-0.5">{realWinner}</p>
        </div>
      </div>

      {/* Odds */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>📊 Cote : <strong className="text-foreground">{odds}</strong></span>
        <span>💰 Mise : <strong className="text-foreground">10€</strong></span>
        <span className={cn("font-bold", isWin ? "text-success" : "text-destructive")}>
          {isWin ? `+${Math.round((odds * 10 - 10) * 100) / 100}€` : "-10€"}
        </span>
      </div>
    </motion.div>
  );
}
