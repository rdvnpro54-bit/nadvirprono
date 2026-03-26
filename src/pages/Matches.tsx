import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch, type CachedMatch } from "@/hooks/useMatches";
import { TrendingUp, Search, Loader2, AlertCircle, Zap, Lock, Sparkles, Brain, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CooldownTimer } from "@/components/matches/CooldownTimer";
import { LiveUpdateBanner } from "@/components/home/LiveUpdateBanner";

type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";
type AiTier = "ELITE" | "STRONG" | "ALL";

const sportFilters = [
  { value: "all", label: "Tous", emoji: "🏆" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "basketball", label: "Basket", emoji: "🏀" },
  { value: "hockey", label: "Hockey", emoji: "🏒" },
  { value: "baseball", label: "Baseball", emoji: "⚾" },
  { value: "nfl", label: "NFL", emoji: "🏈" },
  { value: "mma", label: "MMA", emoji: "🥊" },
  { value: "f1", label: "F1", emoji: "🏎️" },
  { value: "afl", label: "AFL", emoji: "🏉" },
  { value: "rugby", label: "Rugby", emoji: "🏉" },
];

const confidenceFilters: { value: Confidence | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "SAFE", label: "SAFE" },
  { value: "MODÉRÉ", label: "MODÉRÉ" },
  { value: "RISQUÉ", label: "RISQUÉ" },
];

const aiTierFilters: { value: AiTier; label: string; icon: typeof Sparkles }[] = [
  { value: "ELITE", label: "ELITE", icon: Sparkles },
  { value: "STRONG", label: "STRONG", icon: Zap },
  { value: "ALL", label: "Tous", icon: Brain },
];

export default function Matches() {
  const { data: matches, isLoading, error, refetch, dataUpdatedAt } = useMatches();
  const { data: triggerData } = useTriggerFetch();
  const { isPremium, user } = useAuth();

  const [sport, setSport] = useState("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");
  const [aiTier, setAiTier] = useState<AiTier>("ALL");
  const [valueBetsOnly, setValueBetsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Count free picks remaining
  const freePicksUsed = useMemo(() => {
    if (!matches) return 0;
    return matches.filter(m => m.is_free).length;
  }, [matches]);
  const freePicksLeft = Math.max(3 - freePicksUsed, 0);

  // NO filtering by aiScore — show ALL matches
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
      const score = m.ai_score || 0;
      if (aiTier === "ELITE" && score < 80) return false;
      if (aiTier === "STRONG" && (score >= 80 || score < 1)) return false;
      return true;
    });
  }, [matches, sport, confidence, valueBetsOnly, searchQuery, aiTier]);

  const grouped = useMemo(() => {
    const groups: Record<string, CachedMatch[]> = {};
    const sortedFiltered = [...filtered].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    sortedFiltered.forEach(m => {
      const date = new Date(m.kickoff).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filtered]);

  const freeMatches = filtered.filter(m => m.is_free).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 overflow-x-hidden px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                Analyse <span className="gradient-text">IA</span>
              </h1>
              <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                {matches?.length || 0} matchs analysés • Tous les sports
              </p>
            </div>
            <CooldownTimer lastUpdate={dataUpdatedAt} intervalMs={3 * 60 * 1000} />
          </div>
        </motion.div>

        {/* Premium banner with urgency */}
        {!isPremium && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 flex items-center gap-3"
          >
            <Lock className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-sm font-semibold text-foreground">
                🔓 Accès limité — Passe Premium pour toutes les prédictions
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                ⚡ Seulement {freePicksLeft > 0 ? freePicksLeft : "0"} pronostic{freePicksLeft !== 1 ? "s" : ""} gratuit{freePicksLeft !== 1 ? "s" : ""} restant{freePicksLeft !== 1 ? "s" : ""} aujourd'hui
              </p>
            </div>
            <Link to="/pricing">
              <Button size="sm" className="shrink-0 text-[10px] sm:text-xs gap-1 btn-shimmer">
                <Zap className="h-3 w-3" /> Premium
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="mt-3">
          <LiveUpdateBanner lastUpdate={dataUpdatedAt} matchCount={matches?.length || 0} />
        </div>

        {/* Search */}
        <div className="mt-3 sm:mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher équipe, compétition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border/50 h-8 sm:h-9 text-xs sm:text-sm"
          />
        </div>

        {/* Filters */}
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          <div className="flex gap-0.5 rounded-lg border border-primary/20 bg-primary/5 p-0.5">
            {aiTierFilters.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setAiTier(f.value)}
                  className={cn(
                    "rounded-md px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center gap-1",
                    aiTier === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" /> {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-0.5 rounded-lg border border-border/50 bg-card p-0.5 overflow-x-auto max-w-full">
            {sportFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSport(f.value)}
                className={cn(
                  "rounded-md px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium transition-colors whitespace-nowrap",
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
                  "rounded-md px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium transition-colors",
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
            className="gap-1 text-[10px] sm:text-[11px] h-7"
          >
            <TrendingUp className="h-3 w-3" /> Value
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Analyse IA en cours...</span>
            </div>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-xs sm:text-sm font-medium">Données temporairement indisponibles</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Réessayer</Button>
          </div>
        )}

        {/* Top 3 free */}
        {!isLoading && !error && freeMatches.length > 0 && !isPremium && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 sm:mt-6">
            <h2 className="font-display text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Top 3 Gratuits — Meilleur AI Score
            </h2>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {freeMatches.slice(0, 3).map((match, i) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Grouped matches — ALL visible, no hiding */}
        {!isLoading && !error && Object.entries(grouped).map(([date, dateMatches]) => (
          <div key={date} className="mt-5 sm:mt-6">
            <h3 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3 capitalize">{date}</h3>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dateMatches.map((match, i) => {
                const isLocked = !isPremium && !match.is_free && match.pred_confidence === "LOCKED";
                return (
                  <MatchCard key={match.id} match={match} locked={isLocked} index={i} />
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="mt-10 sm:mt-12 text-center glass-card p-6 sm:p-8 max-w-sm mx-auto">
            <div className="text-3xl mb-3">⏳</div>
            <p className="text-xs sm:text-sm font-semibold">Analyse en cours…</p>
            <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
              Notre IA scanne les prochains matchs du jour. Les pronostics apparaîtront automatiquement.
            </p>
            <p className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground">
              🟢 Mise à jour automatique toutes les 5 minutes
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-6 text-[9px] text-muted-foreground/50 text-center">
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties.
        </p>
      </div>
    </div>
  );
}
