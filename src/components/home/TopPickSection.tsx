import { Link } from "react-router-dom";
import { Flame, Brain, ChevronRight, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { type MatchWithFlags } from "@/hooks/useMatches";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";

interface TopPickProps {
  matches: MatchWithFlags[] | undefined;
}

export function TopPickSection({ matches }: TopPickProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const topPick = useMemo(() => {
    if (!matches?.length) return null;

    const flaggedTopPick = matches.find((m) => m.is_top_pick === true && !!m.pred_analysis);
    if (flaggedTopPick) return flaggedTopPick;

    const risqueMatches = matches
      .filter((m) => !m.is_free && m.pred_confidence === "RISQUÉ" && !!m.pred_analysis)
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    if (risqueMatches.length > 0) return risqueMatches[0];

    const analyzedFallback = matches
      .filter((m) => !m.is_free && m.pred_confidence !== "LOCKED" && !!m.pred_analysis)
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    return analyzedFallback[0] ?? null;
  }, [matches]);

  if (!topPick && !matches?.length) return null;

  if (!topPick) {
    return (
      <section className="border-t border-border/20 py-6 sm:py-10">
        <div className="container px-3 sm:px-4">
          <div className="mx-auto max-w-lg glass-card-elevated p-5 sm:p-6 animate-pulse">
            <div className="h-5 w-40 rounded bg-muted mb-4 mx-auto" />
            <div className="h-20 rounded-xl bg-muted/70" />
          </div>
        </div>
      </section>
    );
  }

  const isDraw = topPick.pred_score_home != null && topPick.pred_score_away != null && topPick.pred_score_home === topPick.pred_score_away;
  const confidence = isDraw
    ? Number(topPick.pred_draw) || Math.max(Number(topPick.pred_home_win) || 0, Number(topPick.pred_away_win) || 0)
    : Math.max(Number(topPick.pred_home_win) || 0, Number(topPick.pred_away_win) || 0);
  const winner = isDraw
    ? null
    : (topPick.pred_score_home != null && topPick.pred_score_away != null)
      ? (topPick.pred_score_home > topPick.pred_score_away ? topPick.home_team : topPick.away_team)
      : ((topPick.pred_home_win || 0) >= (topPick.pred_away_win || 0) ? topPick.home_team : topPick.away_team);
  const time = new Date(topPick.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const now = Date.now();
  const kickoff = new Date(topPick.kickoff).getTime();
  const isLive = now >= kickoff && now <= kickoff + 180 * 60 * 1000 && 
    !["FT", "AET", "FINISHED"].includes(topPick.status?.toUpperCase() || "");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="border-t border-border/20 py-6 sm:py-10">
        <div className="container px-3 sm:px-4">
          <div className="mx-auto max-w-lg">
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="h-5 w-5 text-destructive" />
                </motion.span>
                TOP PICK DU JOUR
                <AlertTriangle className="h-4 w-4 text-accent" />
              </h2>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                ⚠️ Pick RISQUÉ • Haute récompense • Sélectionné parmi +{matches?.length || 100} matchs
              </p>
            </motion.div>

            <Link to={`/match/${topPick.id}`}>
              <motion.div
                className="glass-card-elevated p-5 sm:p-6 relative overflow-hidden border-destructive/20"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, y: -3 }}
              >
                {/* Subtle animated glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-destructive/4 via-transparent to-accent/4 rounded-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/25 px-2 py-0.5 text-[10px] font-bold text-destructive badge-pulse">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                      </span>
                      LIVE
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    🔥 RISQUÉ
                  </span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {topPick.home_logo ? (
                      <motion.img
                        src={topPick.home_logo}
                        alt=""
                        className="h-9 w-9 object-contain shrink-0"
                        initial={{ x: -15, opacity: 0 }}
                        animate={inView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3 }}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {topPick.home_team.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold truncate">{topPick.home_team}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium shrink-0 uppercase">vs</span>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-semibold truncate text-right">{topPick.away_team}</span>
                    {topPick.away_logo ? (
                      <motion.img
                        src={topPick.away_logo}
                        alt=""
                        className="h-9 w-9 object-contain shrink-0"
                        initial={{ x: 15, opacity: 0 }}
                        animate={inView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3 }}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {topPick.away_team.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prediction details */}
                <motion.div
                  className="rounded-xl bg-destructive/5 border border-destructive/15 p-3.5 space-y-2.5 relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Brain className="h-3.5 w-3.5" /> Pronostic IA</span>
                    <span className="text-sm font-bold text-destructive">{isDraw ? "Match nul" : `${winner} gagne`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">⚠️ Confiance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{confidence}%</span>
                      <ConfidenceBadge confidence={(topPick.pred_confidence || "RISQUÉ") as any} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isLive ? "🔴 En cours" : "⏰ Heure"}</span>
                    <span className="text-xs font-medium">{isLive ? "LIVE" : time}</span>
                  </div>
                  {topPick.pred_score_home != null && topPick.pred_score_away != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">🎯 Score prédit</span>
                      <span className="text-sm font-bold">{topPick.pred_score_home} - {topPick.pred_score_away}</span>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="mt-4 text-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }} className="inline-block">
                    <Button size="sm" variant="destructive" className="gap-1.5 text-xs btn-shimmer">
                      Voir l'analyse complète <ChevronRight className="h-3 w-3" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
