import { useMemo } from "react";
import { motion } from "framer-motion";
import { Ban, AlertTriangle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { type MatchWithFlags } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";

interface MatchesToAvoidProps {
  matches: MatchWithFlags[] | undefined;
}

export function MatchesToAvoid({ matches }: MatchesToAvoidProps) {
  const { isPremiumPlus } = useAuth();

  const riskyMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter(m => (m.anomaly_score || 0) >= 40)
      .sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0))
      .slice(0, 3);
  }, [matches]);

  if (riskyMatches.length === 0) return null;

  return (
    <section className="border-t border-border/20 py-8 sm:py-12">
      <div className="container px-3 sm:px-4 max-w-2xl">
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-lg sm:text-xl font-bold inline-flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Matchs à éviter
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Premium+
            </span>
          </h2>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground/70">
            Matchs à risque identifiés par l'IA
          </p>
        </motion.div>

        {isPremiumPlus ? (
          <div className="space-y-2.5">
            {riskyMatches.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/match/${m.id}`}>
                  <div className="glass-card p-3 border-destructive/15 hover:border-destructive/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className={cn(
                          "h-4 w-4 flex-shrink-0",
                          (m.anomaly_score || 0) >= 60 ? "text-destructive" : "text-amber-400"
                        )} />
                        <div>
                          <p className="text-xs font-medium">{m.home_team} vs {m.away_team}</p>
                          <p className="text-[10px] text-muted-foreground">{m.league_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          (m.anomaly_score || 0) >= 60
                            ? "bg-destructive/20 text-destructive"
                            : "bg-amber-500/20 text-amber-400"
                        )}>
                          {(m.anomaly_score || 0) >= 60 ? "🚨" : "⚠️"} Score: {m.anomaly_score}
                        </span>
                        {m.anomaly_label && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">{m.anomaly_label}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="glass-card p-6 text-center relative overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                {riskyMatches.length} match{riskyMatches.length > 1 ? "s" : ""} à risque détecté{riskyMatches.length > 1 ? "s" : ""}
              </p>
              <Link to="/pricing">
                <Button size="sm" className="gap-2 text-[10px] h-8 btn-glow">
                  <Lock className="h-3 w-3" /> Débloquer avec Premium+
                </Button>
              </Link>
            </div>
            <div className="opacity-20 blur-[4px] space-y-2">
              {riskyMatches.map(m => (
                <div key={m.id} className="h-12 bg-muted/20 rounded-lg" />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
