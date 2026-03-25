import { Link } from "react-router-dom";
import { type CachedMatch } from "@/hooks/useMatches";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Lock, TrendingUp, Clock, Wifi, Star, Dribbble, Swords, Car, Trophy, Dumbbell, CircleDot, type LucideIcon, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useGlobalActivity } from "@/components/home/ActivityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";

const SPORT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  football: { icon: Dribbble, label: "Football" },
  tennis: { icon: CircleDot, label: "Tennis" },
  basketball: { icon: Trophy, label: "Basketball" },
  nba: { icon: Trophy, label: "NBA" },
  nfl: { icon: Swords, label: "NFL" },
  hockey: { icon: Swords, label: "Hockey" },
  mma: { icon: Dumbbell, label: "MMA" },
  f1: { icon: Car, label: "F1" },
};

function TeamDisplay({ name, logo, isFav, side }: { name: string; logo: string | null; isFav: boolean; side: "home" | "away" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", side === "home" ? "flex-row-reverse text-right" : "flex-row text-left")}>
      {logo ? (
        <img src={logo} alt="" className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
          {initials}
        </div>
      )}
      <p className={cn("text-[13px] sm:text-sm font-semibold truncate max-w-[90px] sm:max-w-[120px]", isFav && "text-primary")}>
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
  if (diff <= 0 || diff > 24 * 3600000) return null;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="text-[10px] text-warning font-medium">
      dans {hours > 0 ? `${hours}h` : ""}{mins}min
    </span>
  );
}

function UserActivity({ fixtureId, sport }: { fixtureId: number; sport: string }) {
  const { getMatchCount } = useGlobalActivity();
  const [count, setCount] = useState(() => getMatchCount(fixtureId, sport));
  useEffect(() => {
    const schedule = () => {
      const delay = 10000 + Math.random() * 10000;
      return setTimeout(() => { setCount(getMatchCount(fixtureId, sport)); timerId = schedule(); }, delay);
    };
    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, [fixtureId, sport, getMatchCount]);
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
      </span>
      {count} analysent
    </span>
  );
}

function getPredictionText(match: CachedMatch): string {
  if (match.pred_draw > match.pred_home_win && match.pred_draw > match.pred_away_win) {
    return "Match nul probable";
  }
  const winner = match.pred_home_win >= match.pred_away_win ? match.home_team : match.away_team;
  const shortName = winner.length > 20 ? winner.split(" ").slice(0, 2).join(" ") : winner;
  return `${shortName} gagne`;
}

export function MatchCard({ match, locked = false, index = 0 }: { match: CachedMatch; locked?: boolean; index?: number }) {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const isFav = favorites.some(f => f.fixture_id === match.fixture_id);
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.pred_home_win >= match.pred_away_win ? "home" : "away";
  const isLive = ["1H", "2H", "HT", "ET", "LIVE"].includes(match.status.toUpperCase());
  const confidence = Math.max(Number(match.pred_home_win), Number(match.pred_away_win), Number(match.pred_draw));
  const bothLogos = !!match.home_logo && !!match.away_logo;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ matchId: match.id, fixtureId: match.fixture_id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03, duration: 0.25 }}
    >
      <Link to={locked ? "/pricing" : `/match/${match.id}`} className="block">
        <div className={cn(
          "glass-card match-card-hover p-3 sm:p-3.5 group relative overflow-hidden w-full max-w-full active:scale-[0.98] transition-transform duration-200",
          locked && "opacity-80"
        )}>
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
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
              <span className="truncate">{match.league_name}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {match.pred_value_bet && !locked && (
                <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary badge-pulse">
                  <TrendingUp className="h-2.5 w-2.5" /> Value
                </span>
              )}
              {match.pred_value_bet && locked && (
                <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary badge-pulse">
                  ⚡ Value
                </span>
              )}
              {!locked && <ConfidenceBadge confidence={match.pred_confidence as any} />}
              {/* Favorite button - requires auth */}
              <button onClick={handleFav} className="ml-0.5" title={user ? "Ajouter aux favoris" : "Connecte-toi pour ajouter aux favoris"}>
                <Star className={cn(
                  "h-4 w-4 transition-colors",
                  isFav ? "fill-warning text-warning" : "text-muted-foreground/40 hover:text-warning"
                )} />
              </button>
            </div>
          </div>

          {/* Teams row */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
            <div className="flex-1 min-w-0 overflow-hidden">
              <TeamDisplay name={match.home_team} logo={bothLogos ? match.home_logo : null} isFav={!locked && fav === "home"} side="home" />
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              {isLive ? (
                <span className="flex items-center gap-1 text-[11px] text-success font-bold whitespace-nowrap">
                  <Wifi className="h-3 w-3 animate-pulse" /> LIVE
                </span>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" /> {time}
                  </span>
                  <Countdown kickoff={match.kickoff} />
                </div>
              )}
              <span className="text-[10px] text-muted-foreground">VS</span>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <TeamDisplay name={match.away_team} logo={bothLogos ? match.away_logo : null} isFav={!locked && fav === "away"} side="away" />
            </div>
          </div>

          {/* AI PREDICTION — UNLOCKED */}
          {!locked && (
            <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/5 p-2 sm:p-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="text-[12px] sm:text-sm font-bold text-primary truncate">
                  🔥 IA : {getPredictionText(match)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">Confiance :</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-foreground">{confidence}%</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 0.8, delay: (index || 0) * 0.1 }}
                  />
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">🎯 Score prédit :</span>
                <span className="text-[11px] font-bold text-foreground">
                  {match.pred_score_home} - {match.pred_score_away}
                </span>
              </div>
              {isLive && match.home_score !== null && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-success/70">📡 Live :</span>
                  <span className="text-[10px] font-medium text-success">
                    {match.home_score} - {match.away_score}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* LOCKED PREDICTION — PREMIUM TEASE */}
          {locked && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                  🔒 Prédiction IA verrouillée
                </span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted mb-2">
                <div className="bg-primary/30 transition-all" style={{ width: `${match.pred_home_win}%` }} />
                <div className="bg-muted-foreground/15 transition-all" style={{ width: `${match.pred_draw}%` }} />
                <div className="bg-secondary/30 transition-all" style={{ width: `${match.pred_away_win}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mb-2.5">
                <span>🏠 ???%</span>
                <span>✈️ ???%</span>
              </div>
              <Link to="/pricing">
                <Button size="sm" className="w-full gap-1.5 text-[11px]">
                  <Zap className="h-3 w-3" /> Voir le prono → Premium
                </Button>
              </Link>
              <p className="text-[9px] text-muted-foreground text-center mt-1.5">
                Accède aux pronos + value bets en temps réel
              </p>
            </div>
          )}

          {/* Probability bar + activity — only unlocked */}
          {!locked && (
            <div className="mt-2">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary transition-all" style={{ width: `${match.pred_home_win}%` }} />
                <div className="bg-muted-foreground/30 transition-all" style={{ width: `${match.pred_draw}%` }} />
                <div className="bg-secondary transition-all" style={{ width: `${match.pred_away_win}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>🏠 {match.pred_home_win}%</span>
                <UserActivity fixtureId={match.fixture_id} sport={match.sport || "football"} />
                <span>✈️ {match.pred_away_win}%</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
