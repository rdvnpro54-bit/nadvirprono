import { Link } from "react-router-dom";
import { type Match } from "@/data/simulatedData";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Lock, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const sportEmoji: Record<string, string> = {
  football: "⚽",
  tennis: "🎾",
  basketball: "🏀",
};

export function MatchCard({ match, locked = false, index = 0 }: { match: Match; locked?: boolean; index?: number }) {
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.prediction.homeWin >= match.prediction.awayWin ? "home" : "away";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={locked ? "/pricing" : `/match/${match.id}`} className="block">
        <div className={cn(
          "glass-card p-4 transition-all hover:border-primary/40 hover:shadow-lg group relative overflow-hidden",
          locked && "opacity-70"
        )}>
          {/* League & time */}
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{sportEmoji[match.sport]}</span>
              {match.league}
            </span>
            <div className="flex items-center gap-2">
              {match.prediction.valueBet && !locked && (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  <TrendingUp className="h-3 w-3" /> Value
                </span>
              )}
              <ConfidenceBadge confidence={match.prediction.confidence} />
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-right">
              <p className={cn("font-semibold text-sm", fav === "home" && "text-primary")}>
                {match.homeTeam.name}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {time}
              </div>
              {!locked && (
                <span className="text-lg font-bold font-display text-foreground">
                  {match.prediction.predictedScore[0]} - {match.prediction.predictedScore[1]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className={cn("font-semibold text-sm", fav === "away" && "text-primary")}>
                {match.awayTeam.name}
              </p>
            </div>
          </div>

          {/* Probabilities bar */}
          {!locked && (
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary transition-all" style={{ width: `${match.prediction.homeWin}%` }} />
                <div className="bg-muted-foreground/40 transition-all" style={{ width: `${match.prediction.draw}%` }} />
                <div className="bg-accent transition-all" style={{ width: `${match.prediction.awayWin}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{match.prediction.homeWin}%</span>
                {match.prediction.draw > 0 && <span>N {match.prediction.draw}%</span>}
                <span>{match.prediction.awayWin}%</span>
              </div>
            </div>
          )}

          {/* Lock overlay */}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <span className="text-xs font-medium">Premium requis</span>
              </div>
            </div>
          )}

          {/* Free badge */}
          {match.isFree && !locked && (
            <div className="absolute top-2 right-2">
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">
                GRATUIT
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
