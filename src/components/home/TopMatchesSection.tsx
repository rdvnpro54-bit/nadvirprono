import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MidnightCountdown } from "./MidnightCountdown";
import { type MatchWithFlags } from "@/hooks/useMatches";
import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TopMatchesSectionProps {
  matches: MatchWithFlags[] | undefined;
  isLoading: boolean;
}

function useBackendTop2(matches: MatchWithFlags[] | undefined): MatchWithFlags[] {
  return useMemo(() => {
    if (!matches?.length) return [];
    // SECURITY: Only use matches the SERVER flagged as free — never promote client-side
    return matches.filter((m) => m.is_free === true).slice(0, 2);
  }, [matches]);
}

export function TopMatchesSection({ matches, isLoading }: TopMatchesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const topMatches = useBackendTop2(matches);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="border-t border-border/20 py-8 sm:py-12 w-full max-w-full overflow-hidden">
        <div className="container px-3 sm:px-4">
          <div className="mb-5 sm:mb-7 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.h2
                    className="font-display text-xl sm:text-2xl font-bold inline-flex items-center gap-2 cursor-help"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Shield className="h-5 w-5 text-success" />
                    Top 2 du Jour <span className="gradient-text">IA</span>
                  </motion.h2>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">Les 2 matchs les plus sûrs du jour, identiques pour tous. Réinitialisés à minuit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <motion.p
              className="mt-1.5 text-[10px] sm:text-sm text-muted-foreground/70"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              🛡️ Sélection SAFE • Confiance maximale • Identique pour tous
            </motion.p>
          </div>

          {isLoading ? (
            <div className="mx-auto grid max-w-2xl gap-3 grid-cols-1 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  <Skeleton className="h-36 rounded-xl" />
                </motion.div>
              ))}
            </div>
          ) : topMatches.length > 0 ? (
            <div className="mx-auto grid max-w-2xl gap-4 grid-cols-1 md:grid-cols-2">
              {topMatches.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2 } }}
                >
                  <MatchCard match={m} index={i} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="mx-auto max-w-2xl glass-card-elevated px-6 py-8 text-center"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                className="text-3xl mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⏳
              </motion.div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Analyse en cours…</p>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground/70">Notre IA scanne les prochains matchs. Les pronostics apparaîtront automatiquement.</p>
            </motion.div>
          )}

          <motion.div
            className="mt-5 sm:mt-7"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            <MidnightCountdown />
          </motion.div>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
          >
            <Link to="/matches">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Button variant="outline" className="gap-2 text-xs sm:text-sm border-border/40 hover:border-primary/30 hover:bg-primary/5">
                  Voir tous les matchs <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
