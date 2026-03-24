import { Link } from "react-router-dom";
import { type CachedMatch } from "@/hooks/useMatches";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Lock, TrendingUp, Clock, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MatchCard({ match, locked = false, index = 0 }: { match: CachedMatch; locked?: boolean; index?: number }) {
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.pred_home_win >= match.pred_away_win ? "home" : "away";
  const isLive = match.status === "1H" || match.status === "2H" || match.status === "HT" || match.status === "ET";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03, duration: 0.3 }}
    >
      <Link to={locked ? "/pricing" : `/match/${match.id}`} className="block">
        <div className={cn(
          "glass-card p-4 transition-all hover:border-primary/40 hover:shadow-lg group relative overflow-hidden",
          locked && "opacity-70"
        )}>
          {/* League & time */}
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {match.league_country && <span className="font-medium">{match.league_country}</span>}
              <span className="text-muted-foreground/60">•</span>
              {match.league_name}
            </span>
            <div className="flex items-center gap-2">
              {match.pred_value_bet && !locked && (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  <TrendingUp className="h-3 w-3" /> Value
                </span>
              )}
              <ConfidenceBadge confidence={match.pred_confidence as any} />
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-2">
                {match.home_logo && <img src={match.home_logo} alt="" className="h-6 w-6 object-contain" />}
                <p className={cn("font-semibold text-sm", fav === "home" && "text-primary")}>
                  {match.home_team}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isLive ? (
                  <span className="flex items-center gap-1 text-success font-semibold">
                    <Wifi className="h-3 w-3 animate-pulse" /> LIVE
                  </span>
                ) : (
                  <>
                    <Clock className="h-3 w-3" /> {time}
                  </>
                )}
              </div>
              {!locked && (
                <span className="text-lg font-bold font-display text-foreground">
                  {isLive && match.home_score !== null ? (
                    <>{match.home_score} - {match.away_score}</>
                  ) : (
                    <>{match.pred_score_home} - {match.pred_score_away}</>
                  )}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold text-sm", fav === "away" && "text-primary")}>
                  {match.away_team}
                </p>
                {match.away_logo && <img src={match.away_logo} alt="" className="h-6 w-6 object-contain" />}
              </div>
            </div>
          </div>

          {/* Probabilities bar */}
          {!locked && (
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary transition-all" style={{ width: `${match.pred_home_win}%` }} />
                <div className="bg-muted-foreground/40 transition-all" style={{ width: `${match.pred_draw}%` }} />
                <div className="bg-accent transition-all" style={{ width: `${match.pred_away_win}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{match.pred_home_win}%</span>
                {Number(match.pred_draw) > 0 && <span>N {match.pred_draw}%</span>}
                <span>{match.pred_away_win}%</span>
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
          {match.is_free && !locked && (
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
