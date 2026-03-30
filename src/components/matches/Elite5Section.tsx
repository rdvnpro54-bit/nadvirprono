import { memo } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, ShieldCheck } from "lucide-react";
import { MatchCard } from "./MatchCard";
import type { MatchWithFlags } from "@/hooks/useMatches";

interface Elite5SectionProps {
  matches: MatchWithFlags[];
}

export const Elite5Section = memo(function Elite5Section({ matches }: Elite5SectionProps) {
  if (matches.length === 0) return null;

  return (
    <motion.div
      className="mt-5 sm:mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <motion.div
          className="flex items-center gap-2"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
            animate={{ scale: [1, 1.05, 1] }}
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
              Les 5 matchs avec la plus haute confiance IA — sélection ultra-stricte
            </p>
          </div>
        </motion.div>

        {/* Confidence indicators */}
        <motion.div
          className="mt-2 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" />
            Confiance maximale
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" />
            Données multi-sources vérifiées
          </div>
        </motion.div>
      </div>

      {/* Match cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, type: "spring", stiffness: 200 }}
            className="relative"
          >
            {/* Rank badge */}
            <div className="absolute -top-2 -left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-[10px] font-bold text-background shadow-lg">
              {i + 1}
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
              <MatchCard match={match} index={i} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
