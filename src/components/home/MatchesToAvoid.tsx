import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
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
            <ShieldAlert className="h-5 w-5 text-destructive" />
            🚨 Match suspect détecté par l'IA
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Premium+
            </span>
          </h2>
          <p className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground/70 max-w-md mx-auto">
            Ces matchs présentent des signaux anormaux détectés par notre IA (instabilité, incohérences, risque élevé).
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
                  <div className={cn(
                    "glass-card p-3 transition-all duration-300 hover:scale-[1.01]",
                    (m.anomaly_score || 0) >= 60
                      ? "border-destructive/25 hover:border-destructive/40 shadow-[0_0_15px_rgba(239,68,68,0.08)]"
                      : "border-amber-500/20 hover:border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.06)]"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className={cn(
                          "h-4 w-4 flex-shrink-0",
                          (m.anomaly_score || 0) >= 60 ? "text-destructive animate-pulse" : "text-amber-400"
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
                          {(m.anomaly_score || 0) >= 60 ? "🚨 Suspect" : "⚠️ Risque"} • {m.anomaly_score}/100
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
            {/* Blurred preview behind lock */}
            <div className="opacity-20 blur-[5px] select-none pointer-events-none space-y-2 mb-0">
              {riskyMatches.map(m => (
                <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[10px]">{m.home_team} vs {m.away_team}</span>
                  <span className="ml-auto text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">🚨 Suspect</span>
                </div>
              ))}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 bg-card/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2.5 p-4">
              <Lock className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold text-foreground">
                🚨 {riskyMatches.length} match{riskyMatches.length > 1 ? "s" : ""} suspect{riskyMatches.length > 1 ? "s" : ""} détecté{riskyMatches.length > 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-muted-foreground max-w-xs">
                🔒 Analyse détaillée disponible uniquement en Premium+
              </p>
              <p className="text-[9px] text-muted-foreground/60">
                Accède aux analyses avancées et évite les matchs à risque
              </p>
              <Link to="/pricing">
                <Button size="sm" className="gap-2 text-[10px] h-8 btn-glow btn-shimmer mt-1">
                  <Lock className="h-3 w-3" /> Passer en Premium+
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
