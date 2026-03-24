import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { generateDailyMatches } from "@/data/simulatedData";
import { ArrowLeft, Brain, TrendingUp, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const resultColor: Record<string, string> = { W: "bg-success", D: "bg-warning", L: "bg-destructive" };

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const matches = useMemo(() => generateDailyMatches(), []);
  const match = matches.find(m => m.id === id);

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex flex-col items-center justify-center pt-32 text-center">
          <p className="text-xl text-muted-foreground">Match introuvable</p>
          <Link to="/matches"><Button variant="outline" className="mt-4">Retour</Button></Link>
        </div>
      </div>
    );
  }

  const { prediction: p, homeTeam: home, awayTeam: away, sport } = match;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl pt-24 pb-16">
        <Link to="/matches" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux matchs
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">{match.league}</span>
            <ConfidenceBadge confidence={p.confidence} size="lg" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <h2 className="font-display text-2xl font-bold">{home.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{home.leaguePosition}e au classement</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Score Prédit</span>
              <span className="font-display text-4xl font-extrabold gradient-text">
                {p.predictedScore[0]} - {p.predictedScore[1]}
              </span>
            </div>
            <div className="flex-1 text-center">
              <h2 className="font-display text-2xl font-bold">{away.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{away.leaguePosition}e au classement</p>
            </div>
          </div>

          {/* Probability bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-primary">{home.name} {p.homeWin}%</span>
              {p.draw > 0 && <span className="text-muted-foreground">Nul {p.draw}%</span>}
              <span className="text-accent">{away.name} {p.awayWin}%</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary transition-all rounded-l-full" style={{ width: `${p.homeWin}%` }} />
              {p.draw > 0 && <div className="bg-muted-foreground/40" style={{ width: `${p.draw}%` }} />}
              <div className="bg-accent transition-all rounded-r-full" style={{ width: `${p.awayWin}%` }} />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Prediction details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Brain className="h-5 w-5 text-primary" /> Prédictions IA
            </h3>
            <div className="space-y-4">
              {sport === "football" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Over 2.5 buts</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.overUnder25.over}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{p.overUnder25.over}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Under 2.5 buts</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${p.overUnder25.under}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{p.overUnder25.under}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">BTTS Oui</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${p.btts.yes}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{p.btts.yes}%</span>
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confiance IA</span>
                <span className="text-sm font-bold text-primary">{p.confidenceScore}%</span>
              </div>
              {p.valueBet && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Value Bet détecté : {p.valueBetType}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Activity className="h-5 w-5 text-primary" /> Forme Récente
            </h3>
            {[home, away].map(team => (
              <div key={team.name} className="mb-4 last:mb-0">
                <p className="text-sm font-medium mb-2">{team.name}</p>
                <div className="flex items-center gap-2">
                  {team.form.last5.map((r, i) => (
                    <span key={i} className={cn("flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-foreground", resultColor[r])}>
                      {r}
                    </span>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {team.form.goalsScored} buts marqués, {team.form.goalsConceded} encaissés
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Injuries */}
          {(home.injured.length > 0 || away.injured.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
                <Users className="h-5 w-5 text-destructive" /> Joueurs Absents
              </h3>
              {[home, away].map(team => (
                team.injured.length > 0 && (
                  <div key={team.name} className="mb-3 last:mb-0">
                    <p className="text-sm font-medium mb-1">{team.name}</p>
                    {team.injured.map(inj => (
                      <p key={inj.name} className="text-xs text-muted-foreground">
                        • {inj.name} — <span className="text-destructive">{inj.reason}</span>
                      </p>
                    ))}
                  </div>
                )
              ))}
            </motion.div>
          )}

          {/* AI Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 sm:col-span-2"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold mb-4">
              <Brain className="h-5 w-5 text-primary" /> Analyse IA
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.aiExplanation}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
