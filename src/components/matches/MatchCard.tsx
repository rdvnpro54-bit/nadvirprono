import { Link } from "react-router-dom";
import { type CachedMatch } from "@/hooks/useMatches";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Lock, TrendingUp, Clock, Wifi, Star, Users, Dribbble, Swords, Car, Bike, Trophy, Dumbbell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

const SPORT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  football: { icon: Dribbble, label: "Football" },
  nba: { icon: Trophy, label: "NBA" },
  basketball: { icon: Trophy, label: "Basketball" },
  nfl: { icon: Swords, label: "NFL" },
  nhl: { icon: Swords, label: "NHL" },
  mma: { icon: Dumbbell, label: "MMA" },
  mlb: { icon: Trophy, label: "MLB" },
  f1: { icon: Car, label: "F1" },
  handball: { icon: Dribbble, label: "Handball" },
  rugby: { icon: Dribbble, label: "Rugby" },
  volleyball: { icon: Dribbble, label: "Volleyball" },
  afl: { icon: Dribbble, label: "AFL" },
};

function TeamDisplay({ name, logo, isFav, side }: { name: string; logo: string | null; isFav: boolean; side: "home" | "away" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hasLogo = !!logo;

  return (
    <div className={cn("flex items-center gap-2", side === "home" ? "flex-row-reverse" : "flex-row")}>
      {hasLogo ? (
        <img src={logo} alt="" className="h-7 w-7 object-contain" loading="lazy" />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {initials}
        </div>
      )}
      <p className={cn("text-sm font-semibold truncate max-w-[120px]", isFav && "text-primary")}>
        {name}
      </p>
    </div>
  );
}

function Countdown({ kickoff }: { kickoff: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const diff = new Date(kickoff).getTime() - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (hours > 24) return null;

  return (
    <span className="text-[10px] text-warning font-medium">
      dans {hours > 0 ? `${hours}h` : ""}{mins}min
    </span>
  );
}

function UserActivity({ fixtureId }: { fixtureId: number }) {
  const count = useMemo(() => {
    const base = (fixtureId % 500) + 120;
    return base + Math.floor(Math.random() * 50);
  }, [fixtureId]);

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Users className="h-3 w-3" /> {count}
    </span>
  );
}

export function MatchCard({ match, locked = false, index = 0 }: { match: CachedMatch; locked?: boolean; index?: number }) {
  const [isFav, setIsFav] = useState(false);
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.pred_home_win >= match.pred_away_win ? "home" : "away";
  const isLive = match.status === "1H" || match.status === "2H" || match.status === "HT" || match.status === "ET";

  // Consistent logo display: all logos or all initials
  const bothLogos = !!match.home_logo && !!match.away_logo;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(!isFav);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03, duration: 0.25 }}
    >
      <Link to={locked ? "/pricing" : `/match/${match.id}`} className="block">
        <div className={cn(
          "glass-card match-card-hover p-3.5 group relative overflow-hidden",
          locked && "opacity-60"
        )}>
          {/* Top row: league, badges, fav */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
              {(() => {
                const sportKey = (match.sport || "football").toLowerCase();
                const sportInfo = SPORT_ICONS[sportKey] || { icon: Trophy, label: sportKey };
                const SportIcon = sportInfo.icon;
                return (
                  <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-[10px] font-semibold text-primary mr-1 shrink-0">
                    <SportIcon className="h-2.5 w-2.5" />
                    {sportInfo.label}
                  </span>
                );
              })()}
              {match.league_country && <span className="font-medium">{match.league_country}</span>}
              <span className="opacity-50">•</span>
              <span className="truncate">{match.league_name}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {match.pred_value_bet && !locked && (
                <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  <TrendingUp className="h-2.5 w-2.5" /> Value
                </span>
              )}
              <ConfidenceBadge confidence={match.pred_confidence as any} />
              {!locked && (
                <button onClick={handleFav} className="ml-0.5">
                  <Star className={cn("h-4 w-4 transition-colors", isFav ? "fill-warning text-warning" : "text-muted-foreground/40 hover:text-warning")} />
                </button>
              )}
            </div>
          </div>

          {/* Teams row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <TeamDisplay
                name={match.home_team}
                logo={bothLogos ? match.home_logo : null}
                isFav={fav === "home"}
                side="home"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              {isLive ? (
                <span className="flex items-center gap-1 text-[11px] text-success font-bold">
                  <Wifi className="h-3 w-3 animate-pulse" /> LIVE
                </span>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {time}
                  </span>
                  <Countdown kickoff={match.kickoff} />
                </div>
              )}
              {!locked && (
                <span className="text-base font-bold font-display text-foreground">
                  {isLive && match.home_score !== null ? (
                    <>{match.home_score} - {match.away_score}</>
                  ) : (
                    <>{match.pred_score_home} - {match.pred_score_away}</>
                  )}
                </span>
              )}
            </div>
            <div className="flex-1">
              <TeamDisplay
                name={match.away_team}
                logo={bothLogos ? match.away_logo : null}
                isFav={fav === "away"}
                side="away"
              />
            </div>
          </div>

          {/* Bottom: probabilities + user activity */}
          {!locked && (
            <div className="mt-2.5">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary transition-all" style={{ width: `${match.pred_home_win}%` }} />
                <div className="bg-muted-foreground/30 transition-all" style={{ width: `${match.pred_draw}%` }} />
                <div className="bg-secondary transition-all" style={{ width: `${match.pred_away_win}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{match.pred_home_win}%</span>
                <UserActivity fixtureId={match.fixture_id} />
                <span>{match.pred_away_win}%</span>
              </div>
            </div>
          )}

          {/* Lock overlay */}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <span className="text-[11px] font-semibold">🔒 Débloque avec Premium</span>
              </div>
            </div>
          )}

          {/* No separate GRATUIT badge — free matches are identified by context */}
        </div>
      </Link>
    </motion.div>
  );
}
