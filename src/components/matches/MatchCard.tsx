import { Link } from "react-router-dom";
import { type CachedMatch } from "@/hooks/useMatches";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { AiScoreBadge } from "./AiScoreBadge";
import { Lock, TrendingUp, Clock, Star, Dribbble, Swords, Car, Trophy, Dumbbell, CircleDot, type LucideIcon, Brain, Zap, Info, Users, Flame, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback, memo } from "react";
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
  "Manchester United": "Man Utd", "Manchester City": "Man City",
  "Fútbol Club Barcelona": "Barça", "FC Barcelona": "Barça",
  "Paris Saint-Germain": "PSG", "Borussia Dortmund": "Dortmund",
  "Atlético Madrid": "Atlético", "Atletico Madrid": "Atlético",
  "Inter Miami CF": "Inter Miami", "Tottenham Hotspur": "Tottenham",
  "Wolverhampton Wanderers": "Wolves", "Newcastle United": "Newcastle",
  "West Ham United": "West Ham", "Real Sociedad": "R. Sociedad",
  "Bayer Leverkusen": "Leverkusen", "Bayern München": "Bayern", "Bayern Munich": "Bayern",
  "Los Angeles Lakers": "LA Lakers", "Golden State Warriors": "GS Warriors",
  "Indiana Pacers": "Pacers", "Philadelphia 76ers": "76ers",
};

function shortName(name: string): string {
  return TEAM_ALIASES[name] || name;
}

const TeamLogo = memo(({ name, logo, size = "sm" }: { name: string; logo: string | null; size?: "sm" | "md" }) => {
  const initials = shortName(name).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "md" ? "h-10 w-10" : "h-7 w-7";
  if (logo) {
    return <img src={logo} alt="" className={`${dim} shrink-0 object-contain rounded-full`} loading="lazy" />;
  }
  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground`}>
      {initials}
    </div>
  );
});
TeamLogo.displayName = "TeamLogo";

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

const UserActivity = memo(React.forwardRef<HTMLSpanElement, { fixtureId: number; sport: string }>(
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
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60" />
        </span>
        {count}
      </span>
    );
  }
));
UserActivity.displayName = "UserActivity";

function getPredictionText(match: CachedMatch): string {
  const winner = match.pred_home_win >= match.pred_away_win ? match.home_team : match.away_team;
  if (match.pred_score_home != null && match.pred_score_away != null && match.pred_score_home === match.pred_score_away) {
    return `${shortName(winner)} ou Nul`;
  }
  return `${shortName(winner)}`;
}

// v2.0: Value score computation
function computeValueInfo(match: CachedMatch): { score: number; label: string; color: string } | null {
  const mainProb = Math.max(Number(match.pred_home_win), Number(match.pred_away_win));
  if (mainProb <= 0) return null;
  const odds = Math.round((100 / mainProb) * 0.92 * 100) / 100;
  const value = (mainProb / 100 * odds) - 1;
  if (value < 0.05) return null;
  if (value <= 0.10) return { score: value, label: "🟡 Low Value", color: "text-amber-400" };
  if (value <= 0.20) return { score: value, label: "🟢 Good Value", color: "text-emerald-400" };
  return { score: value, label: "🔥 High Value", color: "text-primary" };
}

function getAiScoreGlow(score: number): string {
  if (score >= 90) return "ring-1 ring-amber-400/30 shadow-md shadow-amber-500/10";
  if (score >= 80) return "ring-1 ring-emerald-400/20 shadow-sm shadow-emerald-500/5";
  return "";
}

const SPORT_DURATIONS: Record<string, number> = {
  football: 120, tennis: 180, basketball: 150, hockey: 150,
  baseball: 210, nfl: 210, mma: 180, f1: 150, afl: 150, rugby: 120,
};

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO", "FINISHED", "COMPLETED", "ENDED"]);
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "LIVE"]);

export const MatchCard = memo(function MatchCard({ match, locked = false, index = 0 }: { match: CachedMatch; locked?: boolean; index?: number }) {
  const { user, isPremiumPlus } = useAuth();
  const { favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const anomalyScore = (match as any).anomaly_score || 0;
  const anomalyLabel = (match as any).anomaly_label as string | null;
  const anomalyReason = (match as any).anomaly_reason as string | null;
  const valueInfo = computeValueInfo(match);

  const isFav = favorites.some(f => f.fixture_id === match.fixture_id);
  const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fav = match.pred_home_win >= match.pred_away_win ? "home" : "away";
  const aiScore = match.ai_score || 0;
  const bothLogos = !!match.home_logo && !!match.away_logo;

  const sportKey = (match.sport || "football").toLowerCase();
  const sportInfo = SPORT_ICONS[sportKey] || { icon: Trophy, label: sportKey };
  const SportIcon = sportInfo.icon;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const apiLive = LIVE_STATUSES.has(match.status.toUpperCase());
  const kickoffTime = new Date(match.kickoff).getTime();
  const now = Date.now();
  const maxDuration = (SPORT_DURATIONS[sportKey] || 120) * 60 * 1000;
  const isFinished = FINISHED_STATUSES.has(match.status.toUpperCase());
  const timeLive = now >= kickoffTime && now <= kickoffTime + maxDuration && !isFinished;
  const isLive = apiLive || timeLive;
  const confidence = Math.max(Number(match.pred_home_win), Number(match.pred_away_win), Number(match.pred_draw));

  const handleFav = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("🔒 Connecte-toi pour ajouter aux favoris");
      return;
    }
    toggleFavorite.mutate({ matchId: match.id, fixtureId: match.fixture_id });
  }, [user, match.id, match.fixture_id, toggleFavorite]);

  const handleLockedClick = useCallback((e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      toast("🔒 Réservé Premium", { description: "Passe Premium pour accéder à toutes les prédictions IA." });
      setShowPremiumModal(true);
    }
  }, [locked]);

  const hasAnomaly = anomalyScore >= 30 || !!anomalyLabel;
  const isHighAnomaly = anomalyScore >= 60 || (anomalyLabel && anomalyLabel.includes("🚨"));

  // SAFE market badge info
  const noDrawSports = ["tennis", "basketball", "nba", "baseball", "nfl", "mma"];
  const isNoDraw = noDrawSports.includes(sportKey);

  // P4.2: League tier badge
  const leagueTier = (match as any).league_tier as number | undefined;
  const tierBadge = leagueTier === 1 ? "👑" : leagueTier === 3 ? "⚠️" : null;

  // Consensus badge
  const consensusPassed = (match as any).consensus_passed as boolean | undefined;

  return (
    <>
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        className="will-change-transform"
      >
        <Link to={locked ? "#" : `/match/${match.id}`} onClick={handleLockedClick} className="block">
          <div className={cn(
            "relative overflow-hidden rounded-2xl p-3 sm:p-3.5 transition-all duration-300 active:scale-[0.98]",
            "bg-[rgba(255,255,255,0.03)] backdrop-blur-xl",
            "border border-[rgba(255,215,0,0.1)]",
            "hover:border-[rgba(255,215,0,0.25)] hover:shadow-[0_8px_32px_rgba(255,215,0,0.08)]",
            locked && "opacity-75",
            aiScore >= 90 && "border-[rgba(255,215,0,0.2)] shadow-[0_0_20px_rgba(255,215,0,0.08)]",
            aiScore >= 80 && aiScore < 90 && "border-[rgba(16,185,129,0.15)] shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          ))>
            {/* Live accent bar */}
            {isLive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive animate-pulse" />}

            {/* === Header: Sport + League + Time + Badges === */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary shrink-0">
                  <SportIcon className="h-2.5 w-2.5" />
                  {sportInfo.label}
                </span>
                <span className="text-[9px] text-muted-foreground truncate">{match.league_name}</span>
                {tierBadge && <span className="text-[9px] shrink-0">{tierBadge}</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isLive ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                    </span>
                    LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" /> {time}
                  </span>
                )}
              </div>
            </div>

            {/* === Teams Row: Horizontal sportsbook layout === */}
            <div className="flex items-center gap-2 mb-2">
              {/* Home */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <TeamLogo name={match.home_team} logo={bothLogos ? match.home_logo : null} />
                <span className={cn(
                  "text-xs font-semibold truncate",
                  !locked && fav === "home" && "text-primary"
                )}>
                  {shortName(match.home_team)}
                </span>
              </div>

              {/* Score / VS */}
              <div className="shrink-0 flex flex-col items-center px-1">
                {isLive && match.home_score != null && match.away_score != null ? (
                  <span className="font-display text-base font-extrabold">{match.home_score} - {match.away_score}</span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground/60">VS</span>
                )}
                {!isLive && <Countdown kickoff={match.kickoff} />}
              </div>

              {/* Away */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                <span className={cn(
                  "text-xs font-semibold truncate text-right",
                  !locked && fav === "away" && "text-primary"
                )}>
                  {shortName(match.away_team)}
                </span>
                <TeamLogo name={match.away_team} logo={bothLogos ? match.away_logo : null} />
              </div>
            </div>

            {/* === Badges row === */}
            {!locked && (
              <div className="flex items-center gap-1 flex-wrap mb-2">
                <ConfidenceBadge confidence={match.pred_confidence as any} />
                {aiScore > 0 && <AiScoreBadge score={aiScore} />}
                {valueInfo && (
                  <span className={cn("flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold", valueInfo.color)}>
                    <TrendingUp className="h-2.5 w-2.5" /> {valueInfo.label}
                  </span>
                )}
                {match.pred_value_bet && !valueInfo && (
                  <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    <TrendingUp className="h-2.5 w-2.5" /> Value
                  </span>
                )}
                {/* Consensus badge - Premium+ only */}
                {isPremiumPlus && consensusPassed === true && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-2.5 w-2.5" /> Double IA
                  </span>
                )}
                {isPremiumPlus && consensusPassed === false && (
                  <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    <Brain className="h-2.5 w-2.5" /> Simple IA
                  </span>
                )}
                {hasAnomaly && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold cursor-help",
                          isHighAnomaly
                            ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/10 text-amber-400"
                        )}>
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {isHighAnomaly ? "🚨 Suspect" : "⚠️ Risque"}
                          {!isPremiumPlus && <Lock className="h-2 w-2 ml-0.5" />}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {isPremiumPlus ? (
                          <>
                            <p className="text-[10px] font-medium">{anomalyReason || "Patterns inhabituels détectés"}</p>
                            <p className="text-[9px] text-muted-foreground mt-1">Score : {anomalyScore}/100</p>
                          </>
                        ) : (
                          <p className="text-[10px]">🔒 Analyse détaillée disponible uniquement en Premium+</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* === Prediction block (unlocked) === */}
            {!locked && (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-2 space-y-1.5">
                {/* Prediction text */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <Brain className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] font-bold text-primary truncate">
                      {getPredictionText(match)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground shrink-0">{confidence}%</span>
                </div>

                {/* Confidence bar */}
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      confidence >= 75 ? "bg-success" : confidence >= 55 ? "bg-primary" : confidence >= 40 ? "bg-amber-400" : "bg-destructive"
                    )}
                    style={{ width: `${confidence}%` }}
                  />
                </div>

                <p className="text-[8px] text-muted-foreground/60 italic">Probabilité calibrée — ajustée pour biais du modèle</p>


                {match.pred_confidence === "SAFE" && (
                  <div className="flex items-center gap-1 text-[9px]">
                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">
                      {isNoDraw ? "Pari protégé" : "Double Chance"} • {
                        isNoDraw
                          ? `${shortName(fav === "home" ? match.home_team : match.away_team)} vainqueur`
                          : fav === "home"
                            ? `${shortName(match.home_team)} ou Nul`
                            : `Nul ou ${shortName(match.away_team)}`
                      }
                    </span>
                  </div>
                )}

                {/* Predicted score */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Score prédit</span>
                  {match.pred_score_home != null && match.pred_score_away != null ? (
                    <span className="font-bold">{match.pred_score_home} - {match.pred_score_away}</span>
                  ) : (
                    <span className="text-amber-400 font-semibold text-[9px]">🔒 Premium+</span>
                  )}
                </div>
              </div>
            )}

            {/* === Locked prediction === */}
            {locked && (
              <div className="rounded-lg border border-primary/10 bg-primary/[0.03] p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-primary/60" />
                    <span className="text-[11px] font-semibold">Prédiction Premium</span>
                  </div>
                  <span className="text-[9px] rounded-full bg-amber-500/15 text-amber-400 px-1.5 py-0.5 font-semibold animate-pulse">
                    ⚡ Confiance élevée
                  </span>
                </div>
                <div className="blur-[5px] select-none pointer-events-none space-y-1">
                  <div className="flex justify-between text-xs"><span>Équipe gagne</span><span className="font-bold">78%</span></div>
                  <div className="flex justify-between text-[10px]"><span>Score prédit</span><span className="font-bold">2 - 1</span></div>
                </div>
                <div className="flex h-1 overflow-hidden rounded-full bg-muted">
                  <div className="bg-primary/20 animate-pulse" style={{ width: "40%" }} />
                  <div className="bg-muted-foreground/10" style={{ width: "20%" }} />
                  <div className="bg-secondary/20 animate-pulse" style={{ width: "40%" }} />
                </div>
                <div className="flex gap-2">
                  <Link to={`/match/${match.id}`} onClick={e => e.stopPropagation()} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-[10px] h-7">Aperçu</Button>
                  </Link>
                  <Button size="sm" className="flex-1 text-[10px] h-7 gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPremiumModal(true); }}>
                    <Zap className="h-3 w-3" /> Débloquer
                  </Button>
                </div>
              </div>
            )}

            {/* === Probability bar + favorite + activity === */}
            <div className="mt-2 flex items-center justify-between gap-2">
              {!locked && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div className="bg-primary" style={{ width: `${match.pred_home_win}%` }} />
                    <div className="bg-muted-foreground/20" style={{ width: `${match.pred_draw}%` }} />
                    <div className="bg-secondary" style={{ width: `${match.pred_away_win}%` }} />
                  </div>
                  <UserActivity fixtureId={match.fixture_id} sport={match.sport || "football"} />
                </div>
              )}
              <button
                onClick={handleFav}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 shrink-0",
                  isFav ? "bg-warning/15 text-warning" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                )}
              >
                <Star className={cn("h-3 w-3", isFav && "fill-warning")} />
                {isFav ? "Suivi" : "Suivre"}
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    </>
  );
});
