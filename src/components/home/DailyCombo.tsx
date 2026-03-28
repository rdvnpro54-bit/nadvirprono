import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Lock, Shield, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/MatchCard";
import { useAuth } from "@/contexts/AuthContext";
import { type MatchWithFlags } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";

interface DailyComboProps {
  matches: MatchWithFlags[] | undefined;
}

function buildCombo(matches: MatchWithFlags[]): MatchWithFlags[] {
  // Select 2-4 best matches: ELITE/STRONG, no high anomaly, diverse sports/leagues
  const candidates = matches
    .filter(m => {
      const score = m.ai_score || 0;
      const anomaly = m.anomaly_score || 0;
      return score >= 65 && anomaly < 50 && !!m.pred_analysis;
    })
    .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

  const combo: MatchWithFlags[] = [];
  const usedLeagues = new Set<string>();
  const usedSports = new Set<string>();

  for (const m of candidates) {
    // Avoid correlated matches (same league)
    if (usedLeagues.has(m.league_name)) continue;
    combo.push(m);
    usedLeagues.add(m.league_name);
    usedSports.add(m.sport);
    if (combo.length >= 4) break;
  }

  return combo;
}

function computeComboProbability(combo: MatchWithFlags[]): number {
  if (combo.length === 0) return 0;
  let prob = 1;
  for (const m of combo) {
    const maxProb = Math.max(Number(m.pred_home_win), Number(m.pred_away_win)) / 100;
    prob *= maxProb;
  }
  return Math.round(prob * 100);
}

function estimateComboOdds(combo: MatchWithFlags[]): number {
  if (combo.length === 0) return 1;
  let odds = 1;
  for (const m of combo) {
    const maxProb = Math.max(Number(m.pred_home_win), Number(m.pred_away_win));
    const rawOdds = maxProb > 0 ? 100 / maxProb : 2;
    odds *= Math.max(rawOdds * 0.92, 1.08);
  }
  return Math.round(odds * 100) / 100;
}

export function DailyCombo({ matches }: DailyComboProps) {
  const { isPremium, isPremiumPlus } = useAuth();

  const combo = useMemo(() => {
    if (!matches?.length) return [];
    return buildCombo(matches);
  }, [matches]);

  if (combo.length < 2) return null;

  const probability = computeComboProbability(combo);
  const comboOdds = estimateComboOdds(combo);
  const potentialReturn = Math.round(10 * comboOdds * 100) / 100;

  return (
    <section className="border-t border-border/20 py-8 sm:py-12">
      <div className="container px-3 sm:px-4 max-w-2xl">
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold inline-flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            Combiné IA du jour
          </h2>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground/70">
            {combo.length} sélections optimisées • Risque équilibré
          </p>
        </motion.div>

        {/* Combo stats header */}
        <motion.div
          className="glass-card-elevated p-3 mb-4 flex items-center justify-around text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <p className="text-[10px] text-muted-foreground">Probabilité</p>
            <p className="text-sm font-bold text-primary">{probability}%</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div>
            <p className="text-[10px] text-muted-foreground">Cote combinée</p>
            <p className="text-sm font-bold text-accent">{comboOdds.toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div>
            <p className="text-[10px] text-muted-foreground">Retour (10€)</p>
            <p className="text-sm font-bold text-success">{potentialReturn}€</p>
          </div>
        </motion.div>

        {/* Combo matches */}
        <div className="space-y-2.5">
          {combo.map((m, i) => {
            const isVisible = i === 0 || isPremium || isPremiumPlus;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {!isVisible ? (
                  <div className="glass-card p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">Premium requis</span>
                    </div>
                    <div className="opacity-30 blur-[3px]">
                      <p className="text-xs font-medium">████████ vs ████████</p>
                      <p className="text-[10px] text-muted-foreground">Match {i + 1}</p>
                    </div>
                  </div>
                ) : (
                  <MatchCard match={m} index={i} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Premium+ extra: logic + safe alternative */}
        {isPremiumPlus && (
          <motion.div
            className="mt-3 glass-card p-3 space-y-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3 text-success" />
              <span className="font-semibold text-foreground">Logique de sélection :</span>
              Matchs décorrélés, ligues distinctes, score IA élevé, anomalies faibles
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-semibold text-foreground">Risque :</span>
              {probability >= 15 ? "Modéré" : probability >= 8 ? "Élevé" : "Très élevé"}
              {" • "}Alternative safe : jouer en simples
            </div>
          </motion.div>
        )}

        {!isPremium && (
          <motion.div className="mt-4 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link to="/pricing">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 hover:bg-primary/5">
                <Lock className="h-3.5 w-3.5" /> Voir le combiné complet <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
