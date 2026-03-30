import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiScoreBadge } from "@/components/matches/AiScoreBadge";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { ConfidenceGraph } from "@/components/matches/ConfidenceGraph";
import type { MatchResult } from "@/hooks/useResults";

function estimateOdds(probability: number): number {
  if (probability <= 0) return 2.0;
  const raw = 100 / probability;
  return Math.round(Math.max(raw * 0.92, 1.1) * 100) / 100;
}

const sportEmojis: Record<string, string> = {
  football: "⚽", tennis: "🎾", basketball: "🏀", hockey: "🏒",
  baseball: "⚾", nfl: "🏈", mma: "🥊", f1: "🏎️", afl: "🏉", rugby: "🏉",
};

function getAiScoreFromConfidence(result: MatchResult): number {
  const maxProb = Math.max(result.pred_home_win, result.pred_away_win);
  if (result.predicted_confidence === "SAFE" && maxProb >= 70) return 85;
  if (result.predicted_confidence === "SAFE") return 78;
  if (maxProb >= 65) return 72;
  return 55;
}

function getValueScore(result: MatchResult): { score: number; label: string } {
  const maxProb = Math.max(result.pred_home_win, result.pred_away_win);
  const odds = estimateOdds(maxProb);
  const ev = (maxProb / 100) * odds;
  if (ev >= 1.15) return { score: 95, label: "Excellente" };
  if (ev >= 1.05) return { score: 75, label: "Bonne" };
  if (ev >= 0.95) return { score: 55, label: "Neutre" };
  return { score: 30, label: "Faible" };
}

export function ResultCard({ result, index }: { result: MatchResult; index: number }) {
  const date = new Date(result.kickoff).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const time = new Date(result.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const isWin = result.result === "win";
  const isLoss = result.result === "loss";
  const isPending = !isWin && !isLoss;
  const emoji = sportEmojis[result.sport] || "⚽";
  const aiScore = getAiScoreFromConfidence(result);
  const valueScore = getValueScore(result);

  const winProb = result.predicted_winner === result.home_team ? result.pred_home_win : result.pred_away_win;
  const odds = estimateOdds(winProb);
  const drawProb = 100 - result.pred_home_win - result.pred_away_win;

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
      whileHover={{ scale: 1.01, y: -2 }}
      className={cn(
        "rounded-xl border p-3 sm:p-4 space-y-2 transition-all",
        isWin && "border-success/30 bg-success/5",
        isLoss && "border-destructive/30 bg-destructive/5",
        isPending && "border-border/50 bg-card/60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">{emoji}</span>
          <span className="text-[10px] font-semibold uppercase text-muted-foreground truncate">{result.league_name}</span>
          <ConfidenceBadge confidence={result.predicted_confidence as any} />
          <AiScoreBadge score={aiScore} />
        </div>
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shrink-0",
            isWin && "bg-success/15 text-success",
            isLoss && "bg-destructive/15 text-destructive",
            isPending && "bg-muted text-muted-foreground"
          )}
        >
          {isWin ? <CheckCircle className="h-3.5 w-3.5" /> : isLoss ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5 animate-pulse" />}
          {isWin ? "GAGNÉ ✅" : isLoss ? "PERDU ❌" : "EN ATTENTE ⏳"}
        </motion.span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{result.home_team} vs {result.away_team}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{date} • {time}</p>
        </div>
        {result.actual_home_score != null && result.actual_away_score != null && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-center shrink-0"
          >
            <p className="text-lg font-bold font-display">{result.actual_home_score} - {result.actual_away_score}</p>
            <p className="text-[9px] text-muted-foreground">Score final</p>
          </motion.div>
        )}
      </div>

      {/* Confidence Graph */}
      <ConfidenceGraph
        homeWin={result.pred_home_win}
        draw={Math.max(drawProb, 0)}
        awayWin={result.pred_away_win}
        homeTeam={result.home_team}
        awayTeam={result.away_team}
        size="sm"
      />

      {/* Bet Type Badge */}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          (!result.bet_type || result.bet_type === "winner") && "bg-primary/10 text-primary",
          result.bet_type === "double_chance" && "bg-primary/15 text-primary",
          result.bet_type === "btts" && "bg-accent/15 text-accent-foreground",
          result.bet_type === "over" && "bg-success/15 text-success",
          result.bet_type === "under" && "bg-muted text-muted-foreground",
          result.bet_type === "draw" && "bg-warning/15 text-warning",
        )}>
          {!result.bet_type || result.bet_type === "winner" ? "🏆 Winner" :
           result.bet_type === "double_chance" ? "🎲 Double Chance" :
           result.bet_type === "btts" ? "⚽ BTTS" :
           result.bet_type === "over" ? "📈 Over 2.5" :
           result.bet_type === "under" ? "📉 Under 2.5" :
           result.bet_type === "draw" ? "🤝 Nul" : result.bet_type}
        </span>
      </div>

      {/* Prediction vs Reality */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">🎯 Prédiction</p>
          <p className="text-xs font-semibold mt-0.5">{result.predicted_winner}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">🏆 Résultat</p>
          <p className="text-xs font-semibold mt-0.5">{realWinner}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">💎 Valeur</p>
          <p className={cn("text-xs font-semibold mt-0.5", valueScore.score >= 75 ? "text-success" : valueScore.score >= 55 ? "text-warning" : "text-muted-foreground")}>
            {valueScore.label}
          </p>
        </div>
      </div>

      {/* Odds */}
      {!isPending && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>📊 Cote : <strong className="text-foreground">{odds}</strong></span>
          <span>💰 Mise : <strong className="text-foreground">10€</strong></span>
          <span className={cn("font-bold", isWin ? "text-success" : "text-destructive")}>
            {isWin ? `+${Math.round((odds * 10 - 10) * 100) / 100}€` : "-10€"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
