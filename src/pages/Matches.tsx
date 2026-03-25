import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch, type CachedMatch } from "@/hooks/useMatches";
import { Filter, TrendingUp, Shield, Flame, AlertTriangle, Search, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";

const sportFilters = [
  { value: "all", label: "Tous", emoji: "🏆" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "basketball", label: "Basket", emoji: "🏀" },
  { value: "nba", label: "NBA", emoji: "🏀" },
  { value: "nfl", label: "NFL", emoji: "🏈" },
  { value: "baseball", label: "Baseball", emoji: "⚾" },
  { value: "hockey", label: "Hockey", emoji: "🏒" },
  { value: "handball", label: "Handball", emoji: "🤾" },
  { value: "volleyball", label: "Volley", emoji: "🏐" },
  { value: "mma", label: "MMA", emoji: "🥊" },
  { value: "formula1", label: "F1", emoji: "🏎️" },
  { value: "rugby", label: "Rugby", emoji: "🏉" },
  { value: "afl", label: "AFL", emoji: "🏉" },
];

const confidenceFilters: { value: Confidence | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "SAFE", label: "SAFE" },
  { value: "MODÉRÉ", label: "MODÉRÉ" },
  { value: "RISQUÉ", label: "RISQUÉ" },
];

export default function Matches() {
  const { data: matches, isLoading, error, refetch } = useMatches();
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

  const grouped = useMemo(() => {
    const groups: Record<string, CachedMatch[]> = {};
    filtered.forEach(m => {
      const date = new Date(m.kickoff).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filtered]);

  // Top 3 free matches
  const freeMatches = filtered.filter(m => m.is_free).slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">
                Analyse <span className="gradient-text">IA</span>
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {matches?.length || 0} matchs analysés • 12 sports
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {isFetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">MAJ toutes les 15 min</span>
            </div>
          </div>

          {/* Credibility */}
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
              🧠 Taux IA : 82%
            </span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              📊 +250 facteurs
            </span>
          </div>
        </motion.div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher équipe, compétition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border/50 h-9 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border/50 bg-card p-0.5 overflow-x-auto max-w-full">
            {sportFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSport(f.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                  sport === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-0.5 rounded-lg border border-border/50 bg-card p-0.5">
            {confidenceFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setConfidence(f.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  confidence === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant={valueBetsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setValueBetsOnly(!valueBetsOnly)}
            className="gap-1 text-[11px] h-7"
          >
            <TrendingUp className="h-3 w-3" /> Value
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analyse IA en cours...</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="mt-8 glass-card p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-medium">Données temporairement indisponibles</p>
            <p className="mt-1 text-xs text-muted-foreground">Veuillez réessayer dans quelques instants.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Top 3 free */}
        {!isLoading && !error && freeMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <h2 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5">
              🔥 Top 3 Gratuits
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {freeMatches.map((match, i) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Grouped matches */}
        {!isLoading && !error && Object.entries(grouped).map(([date, dateMatches]) => (
          <div key={date} className="mt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 capitalize">
              {date}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dateMatches.map((match, i) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  locked={!match.is_free && i >= 3}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">Aucun match disponible avec ces filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
