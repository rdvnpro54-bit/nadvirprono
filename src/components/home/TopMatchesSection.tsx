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
 * Select up to 3 free matches: prioritize 1 Football + 1 Tennis + 1 Basketball.
 * If a sport is missing, fill with next available match (no duplicates).
 */
function getTop3(matches: CachedMatch[]): CachedMatch[] {
  const free = matches.filter(m => m.is_free);
  const pool = free.length > 0 ? free : matches;
  if (pool.length === 0) return [];

  const sportOrder = ["football", "tennis", "basketball"];
  const picked: CachedMatch[] = [];
  const usedIds = new Set<string>();

  // 1st pass: one per sport
  for (const sport of sportOrder) {
    const match = pool.find(m => m.sport?.toLowerCase() === sport && !usedIds.has(m.id));
    if (match) {
      picked.push(match);
      usedIds.add(match.id);
    }
  }

  // 2nd pass: fill to 3 with remaining (no same fixture_id)
  const usedFixtures = new Set(picked.map(m => m.fixture_id));
  if (picked.length < 3) {
    for (const m of pool) {
      if (picked.length >= 3) break;
      if (usedIds.has(m.id) || usedFixtures.has(m.fixture_id)) continue;
      picked.push(m);
      usedIds.add(m.id);
      usedFixtures.add(m.fixture_id);
    }
  }

  return picked.slice(0, 3);
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
      <section className="border-t border-border/30 py-8 sm:py-12 w-full max-w-full overflow-hidden">
        <div className="container px-3 sm:px-4">
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
            <div className="mx-auto grid max-w-4xl gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : topMatches.length > 0 ? (
            <div className="mx-auto grid max-w-4xl gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {topMatches.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="group"
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <div className="rounded-xl transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <MatchCard match={m} index={i} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-card/60 px-4 py-8 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm font-medium text-foreground">Analyse en cours…</p>
              <p className="mt-1 text-xs text-muted-foreground">Notre IA scanne les prochains matchs. Les pronostics apparaîtront automatiquement.</p>
              <p className="mt-2 text-[10px] text-muted-foreground">🟢 Mise à jour automatique toutes les 5 minutes</p>
            </div>
          )}

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
