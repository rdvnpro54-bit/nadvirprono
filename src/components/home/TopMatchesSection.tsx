import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MidnightCountdown } from "./MidnightCountdown";
import { WinrateDisplay } from "./WinrateDisplay";
import { type CachedMatch } from "@/hooks/useMatches";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TopMatchesSectionProps {
  matches: CachedMatch[] | undefined;
  isLoading: boolean;
}

/**
 * Selects exactly 3 free matches: 1 Football, 1 Tennis, 1 Basketball/NBA
 * Sorted by relevance (LIVE > soon > best AI score)
 */
function getTop3(matches: CachedMatch[]): CachedMatch[] {
  const free = matches.filter(m => m.is_free);

  // The edge function already picks exactly 1 football + 1 tennis + 1 basketball
  // Just enforce display order: Football → Tennis → Basketball
  const sportOrder = ["football", "tennis", "nba", "basketball"];

  const sorted = [...free].sort((a, b) => {
    const idxA = sportOrder.indexOf(a.sport?.toLowerCase() || "");
    const idxB = sportOrder.indexOf(b.sport?.toLowerCase() || "");
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return sorted.slice(0, 3);
}

export function TopMatchesSection({ matches, isLoading }: TopMatchesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const topMatches = matches ? getTop3(matches) : [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="border-t border-border/30 py-12">
        <div className="container">
          <div className="mb-6 text-center">
            <h2 className="font-display text-2xl font-bold">
              🔥 Top 3 Pronostics <span className="gradient-text">du Jour</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ⚽ Football • 🎾 Tennis • 🏀 Basketball — sélection IA quotidienne
            </p>
            <div className="mt-3 flex justify-center">
              <WinrateDisplay />
            </div>
          </div>

          {isLoading ? (
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topMatches.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="group"
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <div className="transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary/10 rounded-xl">
                    <MatchCard match={m} index={i} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Midnight Countdown */}
          <div className="mt-6">
            <MidnightCountdown />
          </div>

          <div className="mt-4 text-center">
            <Link to="/matches">
              <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105">
                Voir tous les matchs <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
