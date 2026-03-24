import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { useMatch } from "@/hooks/useMatches";
import { ArrowLeft, Brain, TrendingUp, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useMatch(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl pt-24 pb-16">
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Analyse IA en cours...</span>
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex flex-col items-center justify-center pt-32 text-center">
          <p className="text-xl text-muted-foreground">Match introuvable</p>
          <Link to="/matches"><Button variant="outline" className="mt-4">Retour</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl pt-24 pb-16">
        <Link to="/matches" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux matchs
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">
              {match.league_country && <span className="font-medium">{match.league_country} • </span>}
              {match.league_name}
            </span>
            <ConfidenceBadge confidence={match.pred_confidence as any} size="lg" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                {match.home_logo && <img src={match.home_logo} alt="" className="h-12 w-12 object-contain" />}
                <h2 className="font-display text-xl font-bold">{match.home_team}</h2>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Score Prédit</span>
              <span className="font-display text-4xl font-extrabold gradient-text">
                {match.pred_score_home} - {match.pred_score_away}
              </span>
            </div>
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                {match.away_logo && <img src={match.away_logo} alt="" className="h-12 w-12 object-contain" />}
                <h2 className="font-display text-xl font-bold">{match.away_team}</h2>
              </div>
            </div>
          </div>

          {/* Probability bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-primary">{match.home_team} {match.pred_home_win}%</span>
              {Number(match.pred_draw) > 0 && <span className="text-muted-foreground">Nul {match.pred_draw}%</span>}
              <span className="text-accent">{match.away_team} {match.pred_away_win}%</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary transition-all rounded-l-full" style={{ width: `${match.pred_home_win}%` }} />
              {Number(match.pred_draw) > 0 && <div className="bg-muted-foreground/40" style={{ width: `${match.pred_draw}%` }} />}
              <div className="bg-accent transition-all rounded-r-full" style={{ width: `${match.pred_away_win}%` }} />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Prediction details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Brain className="h-5 w-5 text-primary" /> Prédictions IA
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Over {match.pred_over_under} buts</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${match.pred_over_prob}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{match.pred_over_prob}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Under {match.pred_over_under} buts</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${100 - Number(match.pred_over_prob)}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{100 - Number(match.pred_over_prob)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">BTTS Oui</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${match.pred_btts_prob}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{match.pred_btts_prob}%</span>
                </div>
              </div>
              {match.pred_value_bet && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Value Bet détecté</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Activity className="h-5 w-5 text-primary" /> Statut Analyse
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confiance IA</span>
                <ConfidenceBadge confidence={match.pred_confidence as any} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Score prédit</span>
                <span className="font-bold">{match.pred_score_home} - {match.pred_score_away}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Facteurs analysés</span>
                <span className="font-medium text-primary">+250</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière MAJ</span>
                <span className="text-xs">{new Date(match.fetched_at).toLocaleTimeString("fr-FR")}</span>
              </div>
            </div>
          </motion.div>

          {/* AI Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 sm:col-span-2"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Brain className="h-5 w-5 text-primary" /> Analyse IA
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{match.pred_analysis}</p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Basé sur +250 facteurs • Mis à jour toutes les 15 minutes • Taux de réussite IA : 82%
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
