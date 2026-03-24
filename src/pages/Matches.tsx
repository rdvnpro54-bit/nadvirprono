import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch, type CachedMatch } from "@/hooks/useMatches";
import { Filter, TrendingUp, Shield, Flame, AlertTriangle, Search, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";

const ALLOWED_SPORTS = [
  "Football", "AFL", "Baseball", "Basketball", "Formula 1",
  "Handball", "Hockey sur glace", "MMA", "NBA", "NFL", "Rugby", "Volleyball"
];

const sportFilters = [
  { value: "all", label: "Tous", emoji: "🏆" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "basketball", label: "Basket", emoji: "🏀" },
  { value: "nba", label: "NBA", emoji: "🏀" },
  { value: "baseball", label: "Baseball", emoji: "⚾" },
  { value: "rugby", label: "Rugby", emoji: "🏈" },
  { value: "hockey", label: "Hockey", emoji: "🏒" },
  { value: "handball", label: "Handball", emoji: "🤾" },
  { value: "volleyball", label: "Volley", emoji: "🏐" },
  { value: "mma", label: "MMA", emoji: "🥊" },
  { value: "f1", label: "F1", emoji: "🏎️" },
  { value: "afl", label: "AFL", emoji: "🏉" },
  { value: "nfl", label: "NFL", emoji: "🏈" },
];

const confidenceFilters: { value: Confidence | "all"; label: string; icon: typeof Shield }[] = [
  { value: "all", label: "Tous", icon: Filter },
  { value: "SAFE", label: "SAFE", icon: Shield },
  { value: "MODÉRÉ", label: "MODÉRÉ", icon: AlertTriangle },
  { value: "RISQUÉ", label: "RISQUÉ", icon: Flame },
];

export default function Matches() {
  const { data: matches, isLoading, error } = useMatches();
  const { isLoading: isFetching } = useTriggerFetch();
  
  const [sport, setSport] = useState("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");
  const [valueBetsOnly, setValueBetsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!matches) return [];
    return matches.filter(m => {
      if (sport !== "all" && m.sport !== sport) return false;
      if (confidence !== "all" && m.pred_confidence !== confidence) return false;
      if (valueBetsOnly && !m.pred_value_bet) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.home_team.toLowerCase().includes(q) && 
            !m.away_team.toLowerCase().includes(q) &&
            !m.league_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, sport, confidence, valueBetsOnly, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, CachedMatch[]> = {};
    filtered.forEach(m => {
      const date = new Date(m.kickoff).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filtered]);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">
                Matchs du <span className="gradient-text">Jour</span>
              </h1>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {today} — {matches?.length || 0} matchs analysés par l'IA
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isFetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span>Mis à jour toutes les 15 min</span>
            </div>
          </div>

          {/* Credibility stats */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
              🧠 Taux de réussite IA : 82%
            </span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              📊 Basé sur +250 facteurs
            </span>
          </div>
        </motion.div>

        {/* Search bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une équipe, une compétition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Sport filter - scrollable */}
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card p-1 overflow-x-auto max-w-full">
            {sportFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSport(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  sport === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {/* Confidence */}
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card p-1">
            {confidenceFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setConfidence(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  confidence === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Value bets */}
          <Button
            variant={valueBetsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setValueBetsOnly(!valueBetsOnly)}
            className="gap-1.5 text-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Value Bets
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyse IA en cours...</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Top 3 predictions */}
        {!isLoading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              🔥 Top 3 Pronostics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered
                .filter(m => m.pred_confidence === "SAFE")
                .slice(0, 3)
                .map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
            </div>
          </motion.div>
        )}

        {/* Match grid grouped by date */}
        {!isLoading && Object.entries(grouped).map(([date, dateMatches]) => (
          <div key={date} className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 capitalize">
              {date}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dateMatches.map((match, i) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  locked={!match.is_free && i > 0}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">Aucun match trouvé avec ces filtres.</p>
          </div>
        )}

        {error && (
          <div className="mt-8 text-center text-destructive">
            <p>Erreur lors du chargement des données. Rechargement en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
}
