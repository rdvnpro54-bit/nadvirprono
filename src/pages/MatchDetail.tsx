import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { AiScoreBadge } from "@/components/matches/AiScoreBadge";
import { AnimatedConfidenceBar } from "@/components/home/AnimatedConfidenceBar";
import { useMatch } from "@/hooks/useMatches";
import { ArrowLeft, Loader2, Share2, Users, AlertCircle, Lock, Zap, Shield, AlertTriangle, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalActivity } from "@/components/home/ActivityProvider";
import { SportField } from "@/components/match-detail/SportField";
import { MatchCountdown } from "@/components/match-detail/MatchCountdown";
import { FootballLineup } from "@/components/match-detail/FootballLineup";
import { DetailTabs } from "@/components/match-detail/DetailTabs";

function extractKeyFactors(analysis: string | null, homeTeam: string, awayTeam: string): string[] {
  const factors: string[] = [];
  if (!analysis) {
    return [
      "Forme récente des 5 derniers matchs intégrée",
      "Historique des confrontations directes analysé",
      "Performance domicile/extérieur évaluée",
    ];
  }
  if (analysis.includes("xG")) factors.push("Expected Goals (xG) analysés pour les deux équipes");
  if (analysis.includes("PPDA")) factors.push("Pression offensive (PPDA) comparée");
  if (analysis.includes("PER")) factors.push("Player Efficiency Rating calculé");
  if (analysis.includes("pace")) factors.push("Rythme de jeu (pace) pris en compte");
  if (analysis.includes("complètes")) factors.push("Base de données complète — haute fiabilité");
  if (analysis.includes("partielles")) factors.push("Données partielles — confiance ajustée");
  if (analysis.includes("avantage")) {
    const winner = analysis.includes(homeTeam) ? homeTeam : awayTeam;
    factors.push(`${winner} identifié comme favori statistique`);
  }
  if (factors.length < 3) factors.push("Forme récente des 5 derniers matchs intégrée");
  if (factors.length < 3) factors.push("Historique des confrontations directes analysé");
  if (factors.length < 4) factors.push("Performance domicile vs extérieur évaluée");
  if (factors.length < 5) factors.push("Dynamique et contexte du match analysés");
  return factors.slice(0, 5);
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, error, refetch } = useMatch(id || "");
  const { isPremium, isPremiumPlus } = useAuth();
  const { getMatchCount } = useGlobalActivity();

  const isLocked = match?.pred_confidence === "LOCKED" || (!isPremium && match?.pred_home_win === null);
  const anomalyScore = (match as any)?.anomaly_score || 0;
  const anomalyLabel = (match as any)?.anomaly_label as string | null;
  const anomalyReason = (match as any)?.anomaly_reason as string | null;
  const hasAnomaly = !!(anomalyLabel || anomalyScore >= 30);

  const apiLive = match && ["1H", "2H", "HT", "ET", "LIVE"].includes(match.status.toUpperCase());
  const smartLive = useMemo(() => {
    if (!match) return false;
    const kickoffTime = new Date(match.kickoff).getTime();
    const now = Date.now();
    const sportDurations: Record<string, number> = { football: 120, tennis: 180, basketball: 150 };
    const maxDuration = (sportDurations[(match.sport || "football").toLowerCase()] || 120) * 60 * 1000;
    const finished = ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO", "FINISHED"].includes(match.status.toUpperCase());
    return !finished && now >= kickoffTime && now <= kickoffTime + maxDuration;
  }, [match]);
  const isLive = apiLive || smartLive;

  const userCount = useMemo(() => {
    if (!match) return 0;
    return getMatchCount(match.fixture_id, match.sport || "football");
  }, [match?.fixture_id, match?.sport, getMatchCount]);

  const keyFactors = useMemo(() => {
    if (!match || isLocked) return [];
    return extractKeyFactors(match.pred_analysis, match.home_team, match.away_team);
  }, [match, isLocked]);

  const predictionText = useMemo(() => {
    if (!match || isLocked) return "";
    const winner = match.pred_home_win >= match.pred_away_win ? match.home_team : match.away_team;
    if (match.pred_score_home != null && match.pred_score_away != null && match.pred_score_home === match.pred_score_away) {
      return `${winner} ou match nul`;
    }
    return `${winner} gagne`;
  }, [match, isLocked]);

  const confidence = useMemo(() => {
    if (!match) return 0;
    return Math.max(Number(match.pred_home_win), Number(match.pred_away_win), Number(match.pred_draw));
  }, [match]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    const text = match ? `${match.home_team} vs ${match.away_team} - Pronostic IA sur Pronosia` : "Pronosia";
    if (navigator.share) {
      navigator.share({ title: text, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }, [match]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container max-w-3xl pt-20 pb-16 px-3 sm:px-4">
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Analyse IA en cours...</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Skeleton className="h-64 rounded-xl" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            <Skeleton className="h-10 rounded-md mt-4" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="mt-4"
          >
            <Skeleton className="h-40 rounded-xl" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container flex flex-col items-center justify-center pt-28 text-center px-3">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm font-medium">Données temporairement indisponibles</p>
          <p className="mt-1 text-xs text-muted-foreground">Le match est introuvable.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>Réessayer</Button>
            <Link to="/matches"><Button variant="outline" size="sm">Retour</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const homeInitials = match.home_team.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const awayInitials = match.away_team.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bothLogos = !!match.home_logo && !!match.away_logo;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-3xl pt-20 pb-16 px-3 sm:px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-primary">
              <Shield className="h-3 w-3" /> Analyse IA certifiée
            </span>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1 text-xs h-7">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            🏟️ STADIUM VIEW — Main hero section
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-xl overflow-hidden border border-border/50"
        >
          {/* Stadium field background */}
          <SportField sport={match.sport || "football"} />

          {/* Football lineup overlay */}
          {(match.sport || "football").toLowerCase() === "football" && (
            <FootballLineup
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              homePlayers={[]}
              awayPlayers={[]}
            />
          )}

          {/* Center overlay — teams + score + countdown */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
            {/* League info */}
            <div className="absolute top-3 left-0 right-0 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 px-3 py-1 text-[10px] sm:text-xs text-muted-foreground">
                {match.league_country && <span className="font-medium">{match.league_country}</span>}
                {match.league_country && " • "}
                {match.league_name}
              </span>
            </div>

            {/* Live / Confidence badges */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-[10px] font-bold text-destructive badge-pulse">
                  🔴 LIVE
                </span>
              )}
              {!isLocked && <ConfidenceBadge confidence={match.pred_confidence as any} size="lg" />}
            </div>

            {/* User count */}
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-border/50">
                <Users className="h-3 w-3" /> {userCount}
              </span>
            </div>

            {/* Teams + score */}
            <div className="flex items-center gap-4 sm:gap-8 mt-6">
              {/* Home */}
              <div className="flex flex-col items-center gap-1.5">
                {bothLogos ? (
                  <img src={match.home_logo!} alt="" className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-lg" loading="lazy" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-sm font-bold text-foreground">{homeInitials}</div>
                )}
                <h2 className="font-display text-xs sm:text-sm font-bold text-center max-w-[100px] sm:max-w-[140px] truncate">{match.home_team}</h2>
              </div>

              {/* Center — score or countdown */}
              <div className="flex flex-col items-center">
                {isLocked ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-display text-2xl font-extrabold text-muted-foreground">? - ?</span>
                  </div>
                ) : (
                  <>
                    <span className="text-[9px] text-muted-foreground/70 mb-0.5">Score prédit</span>
                    <span className="font-display text-3xl sm:text-4xl font-extrabold gradient-text">
                      {match.pred_score_home} - {match.pred_score_away}
                    </span>
                  </>
                )}
                <span className="text-[9px] text-muted-foreground mt-1">VS</span>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-1.5">
                {bothLogos ? (
                  <img src={match.away_logo!} alt="" className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-lg" loading="lazy" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-sm font-bold text-foreground">{awayInitials}</div>
                )}
                <h2 className="font-display text-xs sm:text-sm font-bold text-center max-w-[100px] sm:max-w-[140px] truncate">{match.away_team}</h2>
              </div>
            </div>

            {/* Countdown / Live timer */}
            <div className="mt-4 mb-2">
              <MatchCountdown kickoff={match.kickoff} isLive={!!isLive} sport={match.sport || "football"} />
            </div>

            {/* Probability bar */}
            {!isLocked && (
              <div className="w-full max-w-xs sm:max-w-sm px-4 mb-2">
                <div className="flex justify-between text-[10px] font-medium mb-1">
                  <span className="text-primary">{match.pred_home_win}%</span>
                  {Number(match.pred_draw) > 0 && <span className="text-muted-foreground">Nul {match.pred_draw}%</span>}
                  <span className="text-secondary">{match.pred_away_win}%</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm">
                  <div className="bg-primary transition-all rounded-l-full prob-bar-fill" style={{ width: `${match.pred_home_win}%` }} />
                  {Number(match.pred_draw) > 0 && <div className="bg-muted-foreground/30" style={{ width: `${match.pred_draw}%` }} />}
                  <div className="bg-secondary transition-all rounded-r-full prob-bar-fill" style={{ width: `${match.pred_away_win}%` }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            LOCKED / TABS CONTENT BELOW STADIUM
            ═══════════════════════════════════════════ */}
        {isLocked ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4 glass-card glow-border p-6 sm:p-8 text-center">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-display text-lg font-bold">🔒 Analyse complète réservée Premium</h3>
            <p className="mt-2 text-sm text-muted-foreground">Prédictions IA, scores, confiance et value bets exclusifs aux membres Premium.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/pricing">
                <Button className="gap-2 btn-shimmer btn-glow">
                  <Zap className="h-4 w-4" /> Débloquer Premium
                </Button>
              </Link>
              <Link to="/matches">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Matchs gratuits
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <DetailTabs
              match={match}
              predictionText={predictionText}
              confidence={confidence}
              keyFactors={keyFactors}
              userCount={userCount}
            />

            {/* 🧠 AI Risk Analysis Section */}
            {hasAnomaly && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4"
              >
                <div className={cn(
                  "rounded-xl border p-4 space-y-3",
                  anomalyScore >= 60 || (anomalyLabel && anomalyLabel.includes("🚨"))
                    ? "bg-destructive/5 border-destructive/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                    : "bg-amber-500/5 border-amber-500/15 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                )}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      "h-4 w-4",
                      anomalyScore >= 60 || (anomalyLabel && anomalyLabel.includes("🚨"))
                        ? "text-destructive animate-pulse"
                        : "text-amber-400"
                    )} />
                    <h3 className="font-display text-sm font-bold">🧠 Analyse de Risque IA</h3>
                  </div>

                  {/* Badge */}
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold",
                    anomalyScore >= 60 || (anomalyLabel && anomalyLabel.includes("🚨"))
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-400"
                  )}>
                    <AlertTriangle className="h-3 w-3" />
                    {anomalyLabel || (anomalyScore >= 60 ? "🚨 Match suspect" : "⚠️ Risque détecté")}
                  </div>

                  {/* Public message */}
                  <p className="text-xs text-muted-foreground">
                    Ce match présente des patterns inhabituels détectés par notre IA.
                  </p>

                  {isPremiumPlus ? (
                    /* Premium+ full details */
                    <div className="space-y-2 pt-1 border-t border-border/30">
                      {anomalyReason && (
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground shrink-0">📊 Détails :</span>
                          <p className="text-[11px] text-foreground">{anomalyReason}</p>
                        </div>
                      )}
                      {anomalyScore > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">🎯 Score :</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                anomalyScore >= 80 ? "bg-destructive" : anomalyScore >= 60 ? "bg-amber-400" : "bg-amber-300"
                              )}
                              style={{ width: `${anomalyScore}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold">{anomalyScore}/100</span>
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground/60">
                        Impact : confiance automatiquement réduite • Classification ajustée
                      </p>
                    </div>
                  ) : (
                    /* Locked for non-Premium+ */
                    <div className="pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 p-3">
                        <Lock className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-foreground">Analyse complète verrouillée</p>
                          <p className="text-[9px] text-muted-foreground">Score d'anomalie, type de risque et impact sur la prédiction</p>
                        </div>
                        <Link to="/pricing">
                          <Button size="sm" className="h-7 text-[10px] gap-1 btn-shimmer">
                            <Zap className="h-3 w-3" /> Débloquer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/matches">
                <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs">
                  Voir autres pronostics
                </Button>
              </Link>
              {!isPremium && (
                <Link to="/pricing">
                  <Button className="w-full sm:w-auto gap-2 btn-shimmer text-xs">
                    <Zap className="h-4 w-4" /> Passer Premium
                  </Button>
                </Link>
              )}
            </motion.div>

            <p className="text-center text-[9px] text-muted-foreground/50 mt-3">
              Analyse générée par Pronosia IA • Basé sur +250 facteurs
            </p>
          </>
        )}
      </div>
    </div>
  );
}
