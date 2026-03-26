import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MidnightCountdown } from "./MidnightCountdown";
import { type CachedMatch } from "@/hooks/useMatches";
import { getMatchStatus } from "@/hooks/useMatchLifecycle";
import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TopMatchesSectionProps {
  matches: CachedMatch[] | undefined;
  isLoading: boolean;
}

/**
 * DETERMINISTIC Top 2: Same for ALL users.
 * Picks the 2 most SAFE / highest confidence free matches.
 * No localStorage — pure function of today's match data.
 */
function useDeterministicTop2(matches: CachedMatch[] | undefined): CachedMatch[] {
  return useMemo(() => {
    if (!matches || matches.length === 0) return [];

    // Only free, non-finished matches
    const freeMatches = matches.filter(m => {
      const status = getMatchStatus(m);
      return m.is_free && (status === "upcoming" || status === "live");
    });
    if (freeMatches.length === 0) return [];

    // Sort: SAFE first, then by highest confidence %, then ai_score, then fixture_id for determinism
    const sorted = [...freeMatches].sort((a, b) => {
      const rankA = a.pred_confidence === "SAFE" ? 3 : a.pred_confidence === "MODÉRÉ" ? 2 : 1;
      const rankB = b.pred_confidence === "SAFE" ? 3 : b.pred_confidence === "MODÉRÉ" ? 2 : 1;
      if (rankA !== rankB) return rankB - rankA;
      const confA = Math.max(Number(a.pred_home_win) || 0, Number(a.pred_away_win) || 0);
      const confB = Math.max(Number(b.pred_home_win) || 0, Number(b.pred_away_win) || 0);
      if (confA !== confB) return confB - confA;
      if ((b.ai_score || 0) !== (a.ai_score || 0)) return (b.ai_score || 0) - (a.ai_score || 0);
      return a.fixture_id - b.fixture_id; // deterministic tie-break
    });

    return sorted.slice(0, 2);
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

  const topMatches = useDeterministicTop2(matches);

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
                  <motion.h2
                    className="font-display text-xl sm:text-2xl font-bold inline-flex items-center gap-2 cursor-help"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Shield className="h-5 w-5 text-emerald-400" />
                    </motion.span>
                    Top 2 du Jour <span className="gradient-text">IA</span>
                  </motion.h2>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">Les 2 matchs les plus sûrs du jour, identiques pour tous. Réinitialisés à minuit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <motion.p
              className="mt-1 text-[10px] sm:text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              🛡️ Sélection SAFE • Confiance maximale • Identique pour tous
            </motion.p>
          </div>

          {isLoading ? (
            <div className="mx-auto grid max-w-2xl gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  <Skeleton className="h-32 rounded-xl" />
                </motion.div>
              ))}
            </div>
          ) : topMatches.length > 0 ? (
            <div className="mx-auto grid max-w-2xl gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
              {topMatches.map((m, i) => {
                const aiScore = m.ai_score || 0;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                    className={`group rounded-xl ${getScoreStyle(aiScore)}`}
                    whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="rounded-xl transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <MatchCard match={m} index={i} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-card/60 px-4 py-6 sm:py-8 text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="text-3xl mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⏳
              </motion.div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Analyse en cours…</p>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Notre IA scanne les prochains matchs. Les pronostics apparaîtront automatiquement.</p>
            </motion.div>
          )}

          <motion.div
            className="mt-4 sm:mt-6"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            <MidnightCountdown />
          </motion.div>

          <motion.div
            className="mt-3 sm:mt-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
          >
            <Link to="/matches">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-md">
                Voir tous les matchs <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
