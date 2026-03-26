import { Link } from "react-router-dom";
import { type CachedMatch } from "@/hooks/useMatches";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { AiScoreBadge } from "./AiScoreBadge";
import { Lock, TrendingUp, Clock, Star, Dribbble, Swords, Car, Trophy, Dumbbell, CircleDot, type LucideIcon, Brain, Zap, Info, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useGlobalActivity } from "@/components/home/ActivityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { PremiumModal } from "@/components/PremiumModal";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SPORT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  football: { icon: Dribbble, label: "Football" },
  tennis: { icon: CircleDot, label: "Tennis" },
  basketball: { icon: Trophy, label: "Basketball" },
  nba: { icon: Trophy, label: "NBA" },
  nfl: { icon: Swords, label: "NFL" },
  hockey: { icon: Swords, label: "Hockey" },
  mma: { icon: Dumbbell, label: "MMA" },
  f1: { icon: Car, label: "F1" },
  baseball: { icon: Star, label: "Baseball" },
  afl: { icon: Dribbble, label: "AFL" },
  rugby: { icon: Dribbble, label: "Rugby" },
};

const TEAM_ALIASES: Record<string, string> = {
  "Manchester United": "Man Utd",
  "Manchester City": "Man City",
  "Fútbol Club Barcelona": "Barça",
  "FC Barcelona": "Barça",
  "Paris Saint-Germain": "PSG",
  "Borussia Dortmund": "Dortmund",
  "Atlético Madrid": "Atlético",
  "Atletico Madrid": "Atlético",
  "Inter Miami CF": "Inter Miami",
  "Tottenham Hotspur": "Tottenham",
  "Wolverhampton Wanderers": "Wolves",
  "Newcastle United": "Newcastle",
  "West Ham United": "West Ham",
  "Real Sociedad": "R. Sociedad",
  "Bayer Leverkusen": "Leverkusen",
  "Bayern München": "Bayern",
  "Bayern Munich": "Bayern",
  "Los Angeles Lakers": "LA Lakers",
  "Golden State Warriors": "GS Warriors",
  "Indiana Pacers": "Pacers",
  "Philadelphia 76ers": "76ers",
};

function shortName(name: string): string {
  return TEAM_ALIASES[name] || name;
}

function TeamDisplay({ name, logo, isFav, side }: { name: string; logo: string | null; isFav: boolean; side: "home" | "away" }) {
  const display = shortName(name);
  const initials = display.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", side === "home" ? "flex-row-reverse text-right" : "flex-row text-left")}>
      {logo ? (
        <img src={logo} alt="" className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
          {initials}
        </div>
      )}
      <p className={cn("text-[12px] sm:text-sm font-semibold truncate max-w-[85px] sm:max-w-[120px]", isFav && "text-primary")}>
        {display}
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

const UserActivity = React.forwardRef<HTMLSpanElement, { fixtureId: number; sport: string }>(
  ({ fixtureId, sport }, ref) => {
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
      <span ref={ref} className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
        </span>
        {count} analysent
      </span>
    );
  }
);
UserActivity.displayName = "UserActivity";

function SocialProofBadge({ aiScore, fixtureId }: { aiScore: number; fixtureId: number }) {
  if (aiScore < 80) return null;
  // Deterministic "followers" based on fixture_id
  const followers = 12 + (fixtureId % 38);
  const isTrending = aiScore >= 85;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <Users className="h-2.5 w-2.5" /> {followers} suivent ce pick
      </span>
      {isTrending && (
        <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-400">
          <Flame className="h-2.5 w-2.5" /> Trending
        </span>
      )}
    </div>
  );
}

function getPredictionText(match: CachedMatch): string {
  if (match.pred_draw > match.pred_home_win && match.pred_draw > match.pred_away_win) {
    return "Match nul probable";
  }
  const winner = match.pred_home_win >= match.pred_away_win ? match.home_team : match.away_team;
  const displayName = shortName(winner);
  return `${displayName} gagne`;
}

function getAiScoreGlow(score: number): string {
  if (score >= 90) return "ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20";
  if (score >= 80) return "ring-1 ring-emerald-400/30 shadow-md shadow-emerald-500/10";
  return "";
}

export function MatchCard({ match, locked = false, index = 0 }: { match: CachedMatch; locked?: boolean; index?: number }) {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const isFav = favorites.some(f => f.fixture_id === match.fixture_id);
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.pred_home_win >= match.pred_away_win ? "home" : "away";
  const aiScore = match.ai_score || 0;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const apiLive = ["1H", "2H", "HT", "ET", "LIVE"].includes(match.status.toUpperCase());
  const kickoffTime = new Date(match.kickoff).getTime();
  const now = Date.now();
  const sportDurations: Record<string, number> = { football: 120, tennis: 180, basketball: 150 };
  const maxDuration = (sportDurations[(match.sport || "football").toLowerCase()] || 120) * 60 * 1000;
  const isFinished = ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO", "FINISHED"].includes(match.status.toUpperCase());
  const timeLive = now >= kickoffTime && now <= kickoffTime + maxDuration && !isFinished;
  const isLive = apiLive || timeLive;
  const confidence = Math.max(Number(match.pred_home_win), Number(match.pred_away_win), Number(match.pred_draw));
  const bothLogos = !!match.home_logo && !!match.away_logo;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("🔒 Connecte-toi pour ajouter aux favoris");
      return;
    }
    toggleFavorite.mutate({ matchId: match.id, fixtureId: match.fixture_id });
  };

  const handleLockedClick = (e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      toast("🔒 Réservé Premium", { description: "Passe Premium pour accéder à toutes les prédictions IA." });
      setShowPremiumModal(true);
    }
  };

  return (
    <>
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (index || 0) * 0.03, duration: 0.25 }}
      >
        <Link to={locked ? "#" : `/match/${match.id}`} onClick={handleLockedClick} className="block">
          <div className={cn(
            "glass-card match-card-hover p-2.5 sm:p-3.5 group relative overflow-hidden w-full max-w-full active:scale-[0.98] transition-transform duration-200",
            locked && "opacity-80",
            getAiScoreGlow(aiScore)
          )}>
            {/* LIVE indicator overlay */}
            {isLive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive live-bar-pulse" />
            )}

            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {(() => {
                  const sportKey = (match.sport || "football").toLowerCase();
                  const sportInfo = SPORT_ICONS[sportKey] || { icon: Trophy, label: sportKey };
                  const SportIcon = sportInfo.icon;
                  return (
                    <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary mr-1 shrink-0">
                      <SportIcon className="h-2.5 w-2.5" />
                      {sportInfo.label}
                    </span>
                  );
                })()}
                <span className="truncate">{match.league_name}{match.league_country ? ` • ${match.league_country}` : ""}</span>
              </span>
              <div className="flex items-center gap-1">
                {match.pred_value_bet && !locked && (
                  <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary badge-pulse">
                    <TrendingUp className="h-2.5 w-2.5" /> Value
                  </span>
                )}
                {match.pred_value_bet && locked && (
                  <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary badge-pulse">
                    ⚡ Value
                  </span>
                )}
                {!locked && <ConfidenceBadge confidence={match.pred_confidence as any} />}
                {!locked && aiScore > 0 && <AiScoreBadge score={aiScore} />}
                <button onClick={handleFav} className="ml-0.5" title={user ? "Ajouter aux favoris" : "Connecte-toi"}>
                  <Star className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors",
                    isFav ? "fill-warning text-warning" : "text-muted-foreground/40 hover:text-warning"
                  )} />
                </button>
              </div>
            </div>

            {/* Teams row */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                <TeamDisplay name={match.home_team} logo={bothLogos ? match.home_logo : null} isFav={!locked && fav === "home"} side="home" />
              </div>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {isLive ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                      </span>
                      <span className="text-destructive">LIVE</span>
                    </span>
                    {match.home_score != null && match.away_score != null && (
                      <span className="text-sm font-bold font-display">
                        {match.home_score} - {match.away_score}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" /> {time}
                    </span>
                    <Countdown kickoff={match.kickoff} />
                  </div>
                )}
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">VS</span>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <TeamDisplay name={match.away_team} logo={bothLogos ? match.away_logo : null} isFav={!locked && fav === "away"} side="away" />
              </div>
            </div>

            {/* Social proof for ELITE */}
            {!locked && <SocialProofBadge aiScore={aiScore} fixtureId={match.fixture_id} />}

            {/* AI PREDICTION — UNLOCKED */}
            {!locked && (
              <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-primary truncate">
                      🔥 {getPredictionText(match)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ConfidenceBadge confidence={match.pred_confidence as any} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="text-[10px]">Basé sur 11 facteurs : forme, stats avancées, blessures, H2H, contexte, fatigue, marché...</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">💎 Confiance</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary prob-bar-shimmer"
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 0.8, delay: (index || 0) * 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-foreground">{confidence}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">🎯 Score prédit</span>
                  <span className="text-[11px] sm:text-xs font-bold text-foreground">
                    {match.pred_score_home} - {match.pred_score_away}
                  </span>
                </div>
              </div>
            )}

            {/* LOCKED PREDICTION — Enhanced blur teaser */}
            {locked && (
              <div className="mt-2.5 rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                      Prédiction verrouillée
                    </span>
                  </div>
                  <span className="text-[9px] rounded-full bg-amber-500/15 text-amber-400 px-1.5 py-0.5 font-semibold">
                    ⚡ Confiance élevée
                  </span>
                </div>

                {/* Blurred data teaser */}
                <div className="relative">
                  <div className="flex items-center justify-between blur-[6px] select-none pointer-events-none">
                    <span className="text-xs font-bold">Équipe gagne</span>
                    <span className="text-xs font-bold">78%</span>
                  </div>
                  <div className="flex items-center justify-between blur-[6px] select-none pointer-events-none mt-1">
                    <span className="text-[10px]">Score prédit</span>
                    <span className="text-[10px] font-bold">2 - 1</span>
                  </div>
                </div>

                <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-primary/20 animate-pulse" style={{ width: "40%" }} />
                  <div className="bg-muted-foreground/10" style={{ width: "20%" }} />
                  <div className="bg-secondary/20 animate-pulse" style={{ width: "40%" }} />
                </div>

                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  🔥 Confiance IA élevée détectée • Analyse complète disponible
                </p>
                <div className="flex gap-2">
                  <Link to={`/match/${match.id}`} onClick={e => e.stopPropagation()} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1 text-[9px] sm:text-[10px] h-7">
                      Voir l'analyse
                    </Button>
                  </Link>
                  <Link to="/pricing" onClick={e => e.stopPropagation()} className="flex-1">
                    <Button size="sm" className="w-full gap-1 text-[9px] sm:text-[10px] h-7 btn-shimmer">
                      <Zap className="h-3 w-3" /> Premium
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Probability bar + activity */}
            {!locked && (
              <div className="mt-2">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="bg-primary" initial={{ width: 0 }} animate={{ width: `${match.pred_home_win}%` }} transition={{ duration: 1, delay: (index || 0) * 0.1 }} />
                  <motion.div className="bg-muted-foreground/30" initial={{ width: 0 }} animate={{ width: `${match.pred_draw}%` }} transition={{ duration: 1, delay: (index || 0) * 0.1 + 0.1 }} />
                  <motion.div className="bg-secondary" initial={{ width: 0 }} animate={{ width: `${match.pred_away_win}%` }} transition={{ duration: 1, delay: (index || 0) * 0.1 + 0.2 }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                  <span>🏠 {match.pred_home_win}%</span>
                  <UserActivity fixtureId={match.fixture_id} sport={match.sport || "football"} />
                  <span>✈️ {match.pred_away_win}%</span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    </>
  );
}
