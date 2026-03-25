import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MidnightCountdown } from "./MidnightCountdown";
import { type CachedMatch } from "@/hooks/useMatches";
import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TopMatchesSectionProps {
  matches: CachedMatch[] | undefined;
  isLoading: boolean;
}

const TOP3_KEY = "pronosia_top3";

interface StoredTop3 {
  ids: string[];
  date: string; // YYYY-MM-DD
}

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/**
 * TOP 3: Fixed for the entire day. Stored in localStorage.
 * ONLY free matches. Priority: 1 football + 1 tennis + 1 basketball.
 * If a sport is missing, fill with duplicates from available sports.
 */
function useFixedTop3(matches: CachedMatch[] | undefined): CachedMatch[] {
  return useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const today = getTodayISO();

    // Check stored top 3
    try {
      const stored = localStorage.getItem(TOP3_KEY);
      if (stored) {
        const parsed: StoredTop3 = JSON.parse(stored);
        if (parsed.date === today && parsed.ids.length > 0) {
          const found = parsed.ids
            .map(id => matches.find(m => m.id === id))
            .filter(Boolean) as CachedMatch[];
          if (found.length > 0) return found;
        }
      }
    } catch { /* ignore */ }

    // ONLY free matches for Top 3
    const freeMatches = matches.filter(m => m.is_free);
    if (freeMatches.length === 0) return [];

    // Sort by confidence (highest pred_home_win or pred_away_win) then ai_score
    const sorted = [...freeMatches].sort((a, b) => {
      const confA = Math.max(Number(a.pred_home_win) || 0, Number(a.pred_away_win) || 0);
      const confB = Math.max(Number(b.pred_home_win) || 0, Number(b.pred_away_win) || 0);
      // Prefer SAFE confidence first
      const rankA = a.pred_confidence === "SAFE" ? 3 : a.pred_confidence === "MODÉRÉ" ? 2 : 1;
      const rankB = b.pred_confidence === "SAFE" ? 3 : b.pred_confidence === "MODÉRÉ" ? 2 : 1;
      if (rankA !== rankB) return rankB - rankA;
      if (confA !== confB) return confB - confA;
      return (b.ai_score || 0) - (a.ai_score || 0);
    });

    // Pick top 2 highest confidence matches
    const top3 = sorted.slice(0, 2);

    if (top3.length > 0) {
      try {
        localStorage.setItem(TOP3_KEY, JSON.stringify({ ids: top3.map(m => m.id), date: today }));
      } catch { /* storage full */ }
    }

    return top3;
  }, [matches]);
}

function getScoreStyle(score: number) {
  if (score >= 90) return "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20";
  if (score >= 80) return "ring-1 ring-emerald-400/40 shadow-md shadow-emerald-500/10";
  return "";
}

export function TopMatchesSection({ matches, isLoading }: TopMatchesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const topMatches = useFixedTop3(matches);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="border-t border-border/30 py-6 sm:py-10 w-full max-w-full overflow-hidden">
        <div className="container px-3 sm:px-4">
          <div className="mb-4 sm:mb-6 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="font-display text-xl sm:text-2xl font-bold inline-flex items-center gap-2 cursor-help">
    <Sparkles className="h-5 w-5 text-amber-400" />
                    Top 2 du Jour <span className="gradient-text">IA</span>
                  </h2>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">Les 2 matchs les plus sûrs du jour. Réinitialisés à minuit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="mt-1 text-[10px] sm:text-sm text-muted-foreground">
              ⚽ Football • 🏀 NBA • 🏒 NHL • ⚾ MLB • 🏈 NFL • 🥊 MMA • 🏎️ F1 • 🏉 AFL • 🎾 Tennis
            </p>
          </div>

          {isLoading ? (
            <div className="mx-auto grid max-w-4xl gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : topMatches.length > 0 ? (
            <div className="mx-auto grid max-w-4xl gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {topMatches.map((m, i) => {
                const aiScore = m.ai_score || 0;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    className={`group rounded-xl ${getScoreStyle(aiScore)}`}
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  >
                    <div className="rounded-xl transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <MatchCard match={m} index={i} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-card/60 px-4 py-6 sm:py-8 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Analyse en cours…</p>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Notre IA scanne les prochains matchs. Les pronostics apparaîtront automatiquement.</p>
            </div>
          )}

          <div className="mt-4 sm:mt-6">
            <MidnightCountdown />
          </div>

          <div className="mt-3 sm:mt-4 text-center">
            <Link to="/matches">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105">
                Voir tous les matchs <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
