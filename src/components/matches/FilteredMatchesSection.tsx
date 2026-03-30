import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, ShieldAlert, TrendingDown, AlertTriangle } from "lucide-react";
import type { MatchWithFlags } from "@/hooks/useMatches";

interface FilteredMatch {
  match: MatchWithFlags;
  reason: string;
  icon: typeof ShieldAlert;
}

function getExclusionReason(match: MatchWithFlags): FilteredMatch | null {
  const aiScore = match.ai_score || 0;
  const maxProb = Math.max(match.pred_home_win || 0, match.pred_away_win || 0);
  const anomalyScore = match.anomaly_score || 0;

  if (anomalyScore >= 65) {
    return { match, reason: `Match suspect (score anomalie: ${anomalyScore}) — aucun pari recommandé`, icon: ShieldAlert };
  }
  if (aiScore > 0 && aiScore < 70) {
    return { match, reason: `AI Score insuffisant (${aiScore}/100) — sous le seuil minimum de 70`, icon: TrendingDown };
  }
  if (maxProb > 0 && maxProb < 65) {
    return { match, reason: `Confiance trop faible (${maxProb}%) — sous le seuil de 65%`, icon: AlertTriangle };
  }
  return null;
}

interface Props {
  allMatches: MatchWithFlags[] | undefined;
  displayedCount: number;
}

export function FilteredMatchesSection({ allMatches, displayedCount }: Props) {
  const [open, setOpen] = useState(false);

  if (!allMatches || allMatches.length === 0) return null;

  const filtered: FilteredMatch[] = [];
  for (const m of allMatches) {
    const exclusion = getExclusionReason(m);
    if (exclusion) filtered.push(exclusion);
  }

  if (filtered.length === 0) return null;

  return (
    <motion.div
      className="mt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-3 py-2.5 text-left transition-colors hover:bg-card/80"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
            🚫 Matchs filtrés aujourd'hui
          </span>
          <span className="rounded-full bg-destructive/10 text-destructive text-[9px] font-bold px-1.5 py-0.5">
            {filtered.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {filtered.slice(0, 10).map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.match.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5 mt-0.5 text-destructive/70 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-foreground truncate">
                        {item.match.home_team} vs {item.match.away_team}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                    <span className="text-[8px] text-muted-foreground/60 shrink-0">
                      {item.match.league_name}
                    </span>
                  </motion.div>
                );
              })}
              {filtered.length > 10 && (
                <p className="text-[9px] text-muted-foreground text-center py-1">
                  +{filtered.length - 10} autres matchs filtrés
                </p>
              )}
            </div>
            <p className="mt-2 text-[8px] text-muted-foreground/60 text-center">
              Ces matchs ont été exclus par les filtres v2.0 pour protéger votre bankroll
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
