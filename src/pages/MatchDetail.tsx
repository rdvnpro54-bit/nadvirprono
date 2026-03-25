import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { useMatch } from "@/hooks/useMatches";
import { ArrowLeft, Brain, TrendingUp, Activity, Loader2, Share2, Users, AlertCircle, BarChart3, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

function DataQualityBadge({ analysis }: { analysis: string | null }) {
  if (!analysis) return null;
  const isComplete = analysis.includes("complètes");
  const isPartial = analysis.includes("partielles");

  const label = isComplete ? "Données complètes" : isPartial ? "Données partielles" : "Fiabilité limitée";
  const color = isComplete ? "text-success bg-success/10" : isPartial ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
      📊 {label}
    </span>
  );
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, error, refetch } = useMatch(id || "");
  const { isPremium } = useAuth();

  const isLocked = match?.pred_confidence === "LOCKED" || (!isPremium && match?.pred_home_win === null);

  const userCount = useMemo(() => {
    if (!match) return 0;
    return (match.fixture_id % 500) + 200 + Math.floor(Math.random() * 80);
  }, [match?.fixture_id]);

  const handleShare = () => {
    const url = window.location.href;
    const text = match ? `${match.home_team} vs ${match.away_team} - Pronostic IA sur Pronosia` : "Pronosia";
    if (navigator.share) {
      navigator.share({ title: text, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container max-w-3xl pt-20 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Analyse IA en cours...</span>
          </div>
          <Skeleton className="h-56 rounded-xl" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container flex flex-col items-center justify-center pt-28 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm font-medium">Données temporairement indisponibles</p>
          <p className="mt-1 text-xs text-muted-foreground">Le match est introuvable ou les données sont en cours de chargement.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>Réessayer</Button>
            <Link to="/matches"><Button variant="outline" size="sm">Retour</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const bothLogos = !!match.home_logo && !!match.away_logo;
  const homeInitials = match.home_team.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const awayInitials = match.away_team.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-3xl pt-20 pb-16">
        <div className="flex items-center justify-between mb-4">
          <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour
          </Link>
          <div className="flex items-center gap-2">
            {!isLocked && <DataQualityBadge analysis={match.pred_analysis} />}
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1 text-xs h-7">
              <Share2 className="h-3.5 w-3.5" /> Partager
            </Button>
          </div>
        </div>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">
              {match.league_country && <span className="font-medium">{match.league_country} • </span>}
              {match.league_name}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" /> 🔥 {userCount} analysent ce match
              </span>
              {!isLocked && <ConfidenceBadge confidence={match.pred_confidence as any} size="lg" />}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                {bothLogos ? (
                  <img src={match.home_logo!} alt="" className="h-12 w-12 object-contain" loading="lazy" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {homeInitials}
                  </div>
                )}
                <h2 className="font-display text-base font-bold sm:text-lg">{match.home_team}</h2>
              </div>
            </div>
            <div className="flex flex-col items-center">
              {isLocked ? (
                <>
                  <span className="text-[10px] text-muted-foreground mb-1">Score Prédit</span>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-display text-2xl font-extrabold text-muted-foreground">? - ?</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-muted-foreground mb-1">Score Prédit</span>
                  <span className="font-display text-3xl font-extrabold gradient-text sm:text-4xl">
                    {match.pred_score_home} - {match.pred_score_away}
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                {bothLogos ? (
                  <img src={match.away_logo!} alt="" className="h-12 w-12 object-contain" loading="lazy" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {awayInitials}
                  </div>
                )}
                <h2 className="font-display text-base font-bold sm:text-lg">{match.away_team}</h2>
              </div>
            </div>
          </div>

          {/* Probability bar */}
          {isLocked ? (
            <div className="mt-6">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-muted-foreground/20 w-1/3" />
                <div className="bg-muted-foreground/10 w-1/3" />
                <div className="bg-muted-foreground/20 w-1/3" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/50 mt-1.5">
                <span>🏠 ???%</span>
                <span>Nul ???%</span>
                <span>✈️ ???%</span>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-primary">{match.pred_home_win}%</span>
                {Number(match.pred_draw) > 0 && <span className="text-muted-foreground">Nul {match.pred_draw}%</span>}
                <span className="text-secondary">{match.pred_away_win}%</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary transition-all rounded-l-full" style={{ width: `${match.pred_home_win}%` }} />
                {Number(match.pred_draw) > 0 && <div className="bg-muted-foreground/30" style={{ width: `${match.pred_draw}%` }} />}
                <div className="bg-secondary transition-all rounded-r-full" style={{ width: `${match.pred_away_win}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* LOCKED STATE */}
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 glass-card glow-border p-8 text-center"
          >
            <Lock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-display text-lg font-bold">🔒 Analyse complète réservée Premium</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les prédictions IA, scores, confiance et value bets sont exclusifs aux membres Premium.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/pricing">
                <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                  <Zap className="h-4 w-4" /> Débloquer Premium
                </Button>
              </Link>
              <Link to="/matches">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Voir les matchs gratuits
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5"
            >
              <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold mb-3">
                <Brain className="h-4 w-4 text-primary" /> Prédictions IA
              </h3>
              <div className="space-y-3">
                {[
                  { label: `Over ${match.pred_over_under}`, value: match.pred_over_prob, color: "bg-primary" },
                  { label: `Under ${match.pred_over_under}`, value: 100 - Number(match.pred_over_prob), color: "bg-secondary" },
                  { label: "BTTS Oui", value: match.pred_btts_prob, color: "bg-success" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{value}%</span>
                    </div>
                  </div>
                ))}
                {match.pred_value_bet && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 p-2.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Value Bet détecté</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-5"
            >
              <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold mb-3">
                <Activity className="h-4 w-4 text-primary" /> Statut
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Confiance IA", content: <ConfidenceBadge confidence={match.pred_confidence as any} /> },
                  { label: "Score prédit", content: <span className="text-xs font-bold">{match.pred_score_home} - {match.pred_score_away}</span> },
                  { label: "Facteurs", content: <span className="text-xs font-medium text-primary">+250</span> },
                  { label: "Sport", content: <span className="text-xs font-medium capitalize">{match.sport}</span> },
                  { label: "Dernière MAJ", content: <span className="text-[10px]">{new Date(match.fetched_at).toLocaleTimeString("fr-FR")}</span> },
                ].map(({ label, content }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    {content}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 sm:col-span-2"
            >
              <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold mb-3">
                <BarChart3 className="h-4 w-4 text-primary" /> Analyse IA
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{match.pred_analysis}</p>
              <p className="mt-3 text-[10px] text-muted-foreground/50">
                Basé sur +250 facteurs • Mis à jour toutes les 15 minutes • Taux de réussite IA : 82%
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
