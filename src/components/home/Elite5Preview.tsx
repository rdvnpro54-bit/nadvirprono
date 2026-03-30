import { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Crown, Lock, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { useAuth } from "@/contexts/AuthContext";
import type { MatchWithFlags } from "@/hooks/useMatches";

interface Elite5PreviewProps {
  matches: MatchWithFlags[] | undefined;
}

export const Elite5Preview = memo(function Elite5Preview({ matches }: Elite5PreviewProps) {
  const { isPremiumPlus, isAdmin } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const elite5 = (matches ?? []).filter((m) => m.is_elite5).slice(0, 5);

  if (elite5.length === 0) return null;

  const canSeeDetails = isPremiumPlus || isAdmin;

  return (
    <div ref={ref} className="container px-3 sm:px-4 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
              animate={inView ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-4 w-4 text-amber-400" />
            </motion.div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold flex items-center gap-1.5">
                Elite 5 du Jour
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PREMIUM+
                </span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                Les 5 matchs avec la plus haute confiance IA
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Confiance maximale
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              Sélection ultra-stricte
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {elite5.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.4, type: "spring", stiffness: 200 }}
              className="relative"
            >
              {/* Rank badge */}
              <div className="absolute -top-2 -left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-[10px] font-bold text-background shadow-lg">
                {i + 1}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] relative overflow-hidden">
                {canSeeDetails ? (
                  <MatchCard match={match} index={i} />
                ) : (
                  <>
                    {/* Show match info but blur predictions */}
                    <MatchCard match={match} locked index={i} />
                    {/* Overlay blur on predictions */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 via-background/70 to-transparent backdrop-blur-[2px] flex flex-col items-center justify-end pb-3">
                      <Lock className="h-4 w-4 text-amber-400 mb-1" />
                      <p className="text-[9px] text-muted-foreground font-medium">
                        Réservé Premium+
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {!canSeeDetails && (
          <motion.div
            className="mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <Link to="/pricing">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-background text-xs font-semibold"
              >
                <Crown className="h-3.5 w-3.5" />
                Débloquer l'Elite 5
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </motion.div>
        )}

        {canSeeDetails && (
          <motion.div
            className="mt-3 flex justify-center"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <Link to="/matches">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                Voir tous les matchs <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});
