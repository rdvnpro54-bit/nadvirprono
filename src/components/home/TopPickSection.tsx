import { Link } from "react-router-dom";
import { Flame, Brain, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { type CachedMatch } from "@/hooks/useMatches";
import { useTopPick, getMatchStatus } from "@/hooks/useMatchLifecycle";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TopPickProps {
  matches: CachedMatch[] | undefined;
}

export function TopPickSection({ matches }: TopPickProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const topPick = useTopPick(matches);

  if (!topPick) return null;

  const status = getMatchStatus(topPick);
  const confidence = Math.max(Number(topPick.pred_home_win), Number(topPick.pred_away_win));
  const winner = topPick.pred_home_win >= topPick.pred_away_win ? topPick.home_team : topPick.away_team;
  const time = new Date(topPick.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const isLive = status === "live";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <section className="border-t border-border/30 py-4 sm:py-8">
        <div className="container px-3 sm:px-4">
          <div className="mx-auto max-w-lg">
            <motion.div
              className="text-center mb-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="h-5 w-5 text-destructive" />
                </motion.span>
                TOP PICK DU JOUR
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </motion.span>
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ Pick RISQUÉ • Haute récompense • Sélectionné parmi +{matches?.length || 100} matchs
              </p>
            </motion.div>

            <Link to={`/match/${topPick.id}`}>
              <motion.div
                className="glass-card glow-border p-4 sm:p-5 relative overflow-hidden match-card-hover"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-amber-500/5 to-destructive/5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 border border-destructive/30 px-2 py-0.5 text-[10px] font-bold text-destructive badge-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                      </span>
                      LIVE
                    </span>
                  )}
                  <motion.span
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/20 border border-destructive/30 px-2 py-0.5 text-[10px] font-bold text-destructive"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥 RISQUÉ PICK
                  </motion.span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {topPick.home_logo ? (
                      <motion.img
                        src={topPick.home_logo}
                        alt=""
                        className="h-8 w-8 object-contain shrink-0"
                        initial={{ x: -20, opacity: 0 }}
                        animate={inView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3 }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {topPick.home_team.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold truncate">{topPick.home_team}</span>
                  </div>
                  <motion.span
                    className="text-xs text-muted-foreground font-medium shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                  >
                    VS
                  </motion.span>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-semibold truncate text-right">{topPick.away_team}</span>
                    {topPick.away_logo ? (
                      <motion.img
                        src={topPick.away_logo}
                        alt=""
                        className="h-8 w-8 object-contain shrink-0"
                        initial={{ x: 20, opacity: 0 }}
                        animate={inView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3 }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {topPick.away_team.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prediction */}
                <motion.div
                  className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 space-y-2 relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Brain className="h-3 w-3" /> Pronostic IA</span>
                    <span className="text-sm font-bold text-destructive">{winner} gagne</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">⚠️ Confiance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{confidence}%</span>
                      <ConfidenceBadge confidence={topPick.pred_confidence as any} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isLive ? "🔴 En cours" : "⏰ Heure"}</span>
                    <span className="text-xs font-medium">{isLive ? "LIVE" : time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">🎯 Score prédit</span>
                    <span className="text-sm font-bold">{topPick.pred_score_home} - {topPick.pred_score_away}</span>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-3 text-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <Button size="sm" variant="destructive" className="gap-1.5 text-xs btn-shimmer">
                    Voir l'analyse complète <ChevronRight className="h-3 w-3" />
                  </Button>
                </motion.div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
