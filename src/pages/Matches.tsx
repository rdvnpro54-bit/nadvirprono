import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { useMatches, useTriggerFetch, type CachedMatch } from "@/hooks/useMatches";
import { TrendingUp, Search, Loader2, AlertCircle, Zap, Lock, Sparkles, Brain, Flame } from "lucide-react";
import { FilteredMatchesSection } from "@/components/matches/FilteredMatchesSection";
import { Elite5Section } from "@/components/matches/Elite5Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CooldownTimer } from "@/components/matches/CooldownTimer";
import { LiveUpdateBanner } from "@/components/home/LiveUpdateBanner";
import { supabase } from "@/integrations/supabase/client";

const AI_LOADING_MESSAGES = [
  "Analyse des données en cours...",
  "Traitement IA...",
  "Calcul des probabilités...",
  "Synthèse des prédictions...",
  "Évaluation des performances...",
];

function RotatingLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setMsgIndex(i => (i + 1) % AI_LOADING_MESSAGES.length), 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <AnimatePresence mode="wait">
        <motion.span
          key={msgIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-[10px] sm:text-xs text-muted-foreground"
        >
          {AI_LOADING_MESSAGES[msgIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function Matches() {
  const { data: matches, isLoading, error, refetch, dataUpdatedAt } = useMatches();
  const { data: triggerData } = useTriggerFetch();
  const { isPremium, isPremiumPlus, isAdmin, user } = useAuth();

  const [sport, setSport] = useState("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");
  const [aiTier, setAiTier] = useState<AiTier>("ALL");
  const [valueBetsOnly, setValueBetsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const freePicksUsed = useMemo(() => {
    if (!matches) return 0;
    return matches.filter(m => m.is_free).length;
  }, [matches]);
  const freePicksLeft = Math.max(3 - freePicksUsed, 0);

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
      if (aiTier === "STRONG" && (score >= 80 || score < 65)) return false;
      return true;
    });
  }, [matches, sport, confidence, valueBetsOnly, searchQuery, aiTier]);

  // Auto-trigger AI for LOCKED matches
  const triggerAIPredictions = useCallback(async () => {
    if (!matches) return;
    const lockedCount = matches.filter(m => m.pred_confidence === "LOCKED").length;
    if (lockedCount === 0) return;
    console.log(`[AI-TRIGGER] ${lockedCount} LOCKED matches, triggering ai-predict...`);
    try {
      await supabase.functions.invoke("ai-predict", { body: { batch: 10 } });
      // Refetch matches after AI processes them
      setTimeout(() => refetch(), 5000);
    } catch (e) {
      console.warn("[AI-TRIGGER] Failed:", e);
    }
  }, [matches, refetch]);

  // Auto-trigger on load and retry every 60s
  useEffect(() => {
    triggerAIPredictions();
    const interval = setInterval(triggerAIPredictions, 60_000);
    return () => clearInterval(interval);
  }, [triggerAIPredictions]);

  const trendingMatches = useMemo(() => {
    if (!filtered || filtered.length === 0) return [];
    return filtered
      .filter(m => (m.ai_score || 0) >= 80 && !["FT", "FINISHED"].includes(m.status.toUpperCase()))
      .sort((a, b) => {
        const aLive = new Date(a.kickoff).getTime() <= Date.now() ? 1 : 0;
        const bLive = new Date(b.kickoff).getTime() <= Date.now() ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;
        if ((b.ai_score || 0) !== (a.ai_score || 0)) return (b.ai_score || 0) - (a.ai_score || 0);
        return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      })
      .slice(0, 4);
  }, [filtered]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [sport, confidence, aiTier, valueBetsOnly, searchQuery]);

  // Intersection Observer for auto-load-more
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => prev + 30);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  const grouped = useMemo(() => {
    const now = Date.now();
    const FINISHED_STATUSES = ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "FINISHED", "COMPLETED", "ENDED"];
    
    const getStatus = (m: CachedMatch) => {
      const statusUp = m.status.toUpperCase();
      if (FINISHED_STATUSES.includes(statusUp)) return "finished";
      if (m.home_score !== null && m.away_score !== null) return "finished";
      const kickoff = new Date(m.kickoff).getTime();
      if (now >= kickoff) return "live";
      return "upcoming";
    };

    const sortedFiltered = [...filtered].sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const order: Record<string, number> = { live: 0, upcoming: 1, finished: 2 };
      if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
      if (statusA === "finished") return new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime();
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    });

    // Progressive loading: only process first N matches
    const limited = sortedFiltered.slice(0, visibleCount);

    const groups: Record<string, CachedMatch[]> = {};
    limited.forEach(m => {
      const date = new Date(m.kickoff).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filtered, visibleCount]);

  const hasMore = filtered.length > visibleCount;
  const freeMatches = filtered.filter(m => m.is_free).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

  // Elite 5: top 5 highest-confidence matches tagged by server (Premium+ only)
  const elite5Matches = useMemo(() => {
    if (!isPremiumPlus && !isAdmin) return [];
    if (!matches) return [];
    return matches
      .filter(m => m.is_elite5 === true)
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
      .slice(0, 5);
  }, [matches, isPremiumPlus, isAdmin]);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 overflow-x-hidden px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                Analyse <span className="gradient-text">IA</span>
              </h1>
              <motion.p
                className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {filtered.length} matchs affichés
                {sport !== "all" && ` • ${sportFilters.find(f => f.value === sport)?.label || sport}`}
                {sport === "all" && " • Tous les sports"}
              </motion.p>
            </div>
            <CooldownTimer lastUpdate={dataUpdatedAt} intervalMs={3 * 60 * 1000} />
          </div>
        </motion.div>

        {/* v3.1: Streak Severity Banner */}
        {(() => {
          const streakData = (window as any).__pronosia_streak;
          if (!streakData?.streakMode) return null;
          const level = streakData.level || "streak";
          const winrate = streakData.rollingWinrate ?? 0;
          const lastResults = streakData.lastResults || [];

          const config: Record<string, { emoji: string; title: string; desc: string; border: string; bg: string; titleColor: string }> = {
            caution: {
              emoji: "🟡", title: "Mode Prudence — Sélection renforcée",
              desc: `Max 3 picks/jour • Confiance min 70%`,
              border: "border-yellow-500/30", bg: "bg-yellow-500/10", titleColor: "text-yellow-600",
            },
            streak: {
              emoji: "🔴", title: "Mode Protection — Picks ultra-sélectifs",
              desc: `Max 2 picks/jour • Double Chance et Under uniquement`,
              border: "border-destructive/30", bg: "bg-destructive/10", titleColor: "text-destructive",
            },
            emergency: {
              emoji: "⚫", title: "Mode Urgence — 1 seul pick élite",
              desc: `Ligues Tier 1 uniquement • Double Chance obligatoire`,
              border: "border-foreground/30", bg: "bg-foreground/10", titleColor: "text-foreground",
            },
          };
          const c = config[level] || config.streak;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 rounded-xl border ${c.border} ${c.bg} p-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{c.emoji}</span>
                <p className={`text-xs font-bold ${c.titleColor}`}>{c.title}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Winrate récent : {winrate}% • {c.desc}
              </p>
              {lastResults.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] text-muted-foreground">Derniers :</span>
                  {lastResults.map((r: string, i: number) => (
                    <span key={i} className={`text-[10px] font-bold ${r === "win" ? "text-green-500" : "text-destructive"}`}>
                      {r === "win" ? "✅" : "❌"}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Premium banner */}
        {!isPremium && !isLoading && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 flex items-center gap-3"
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Lock className="h-5 w-5 text-primary shrink-0" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-sm font-semibold text-foreground">
                🔓 Accès limité — Passe Premium pour toutes les prédictions
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                ⚡ Seulement {freePicksLeft > 0 ? freePicksLeft : "0"} pronostic{freePicksLeft !== 1 ? "s" : ""} gratuit{freePicksLeft !== 1 ? "s" : ""} restant{freePicksLeft !== 1 ? "s" : ""} aujourd'hui
              </p>
            </div>
            <Link to="/pricing">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="shrink-0 text-[10px] sm:text-xs gap-1 btn-shimmer">
                  <Zap className="h-3 w-3" /> Premium
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        )}

        <motion.div
          className="mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <LiveUpdateBanner lastUpdate={dataUpdatedAt} matchCount={matches?.length || 0} />
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-3 sm:mt-4 relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher équipe, compétition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border/50 h-8 sm:h-9 text-xs sm:text-sm"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-0.5 rounded-lg border border-primary/20 bg-primary/5 p-0.5">
            {aiTierFilters.map(f => {
              const Icon = f.icon;
              const isActive = aiTier === f.value;
              return (
                <motion.button
                  key={f.value}
                  onClick={() => setAiTier(f.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-md px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors flex items-center gap-1",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" /> {f.label}
                </motion.button>
              );
            })}
          </div>
          <div className="flex gap-0.5 rounded-lg border border-border/50 bg-card p-0.5 overflow-x-auto max-w-full">
            {sportFilters.map(f => {
              const count = f.value === "all" ? (matches?.length || 0) : (matches?.filter(m => m.sport === f.value).length || 0);
              const isActive = sport === f.value;
              return (
                <motion.button
                  key={f.value}
                  onClick={() => setSport(f.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-md px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium transition-all whitespace-nowrap relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.emoji} {f.label}
                  {count > 0 && isActive && (
                    <span className="ml-0.5 text-[8px] opacity-70">({count})</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="flex gap-0.5 rounded-lg border border-border/50 bg-card p-0.5">
            {confidenceFilters.map(f => (
              <motion.button
                key={f.value}
                onClick={() => setConfidence(f.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "rounded-md px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium transition-colors",
                  confidence === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={valueBetsOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setValueBetsOnly(!valueBetsOnly)}
              className="gap-1 text-[10px] sm:text-[11px] h-7"
            >
              <TrendingUp className="h-3 w-3" /> Value
            </Button>
          </motion.div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 space-y-3">
            <RotatingLoader />
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                >
                  <Skeleton className="h-32 rounded-xl" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <motion.div
            className="mt-8 glass-card p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5 }}>
              <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            </motion.div>
            <p className="text-xs sm:text-sm font-medium">Données temporairement indisponibles</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Réessayer</Button>
          </motion.div>
        )}

        {/* Top 3 free */}
        {!isLoading && !error && freeMatches.length > 0 && !isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 sm:mt-6"
          >
            <motion.h2
              className="font-display text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1.5"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </motion.span>
              Top 3 Gratuits — Meilleur AI Score
            </motion.h2>
            <motion.div
              className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {freeMatches.slice(0, 3).map((match, i) => (
                <motion.div key={match.id} variants={staggerItem}>
                  <MatchCard match={match} index={i} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* 🔥 Trending */}
        {!isLoading && !error && trendingMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 sm:mt-6"
          >
            <motion.h2
              className="font-display text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-1.5"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Flame className="h-4 w-4 text-destructive" />
              </motion.span>
              Trending — Matchs les plus suivis
            </motion.h2>
            <motion.div
              className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {trendingMatches.map((match, i) => {
                const isLocked = !isPremium && !match.is_free && match.pred_confidence === "LOCKED";
                return (
                  <motion.div key={match.id} variants={staggerItem}>
                    <MatchCard match={match} locked={isLocked} index={i} />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* Grouped matches */}
        <AnimatePresence mode="wait">
          {!isLoading && !error && Object.entries(grouped).map(([date, dateMatches], gi) => (
            <motion.div
              key={date}
              className="mt-5 sm:mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + gi * 0.05 }}
            >
              <motion.h3
                className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3 capitalize"
                initial={{ x: -15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + gi * 0.05 }}
              >
                {date}
              </motion.h3>
              <motion.div
                className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {dateMatches.map((match, i) => {
                  const isLocked = !isPremium && !match.is_free && match.pred_confidence === "LOCKED";
                  return (
                    <motion.div key={match.id} variants={staggerItem}>
                      <MatchCard match={match} locked={isLocked} index={i} />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Load more trigger */}
        {!isLoading && !error && hasMore && (
          <div ref={loadMoreRef} className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="gap-2 text-xs border-border/40 hover:border-primary/30"
            >
              Charger plus de matchs ({filtered.length - visibleCount} restants)
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <motion.div
            className="mt-10 sm:mt-12 text-center glass-card p-6 sm:p-8 max-w-sm mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <motion.div
              className="text-3xl mb-3"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⏳
            </motion.div>
            <p className="text-xs sm:text-sm font-semibold">Analyse en cours…</p>
            <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
              Notre IA scanne les prochains matchs du jour.
            </p>
            <motion.p
              className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🟢 Mise à jour automatique toutes les 5 minutes
            </motion.p>
          </motion.div>
        )}

        {/* v2.0: Filtered matches transparency */}
        {!isLoading && !error && (
          <FilteredMatchesSection allMatches={matches} displayedCount={filtered.length} />
        )}

        <motion.p
          className="mt-6 text-[9px] text-muted-foreground/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ⚠️ Les prédictions IA sont probabilistes, jamais garanties.
        </motion.p>
      </div>
    </div>
  );
}
