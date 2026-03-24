import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MatchCard } from "@/components/matches/MatchCard";
import { generateDailyMatches, type Sport, type Confidence } from "@/data/simulatedData";
import { Filter, TrendingUp, Shield, Flame, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const sportFilters: { value: Sport | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Tous", emoji: "🏆" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "basketball", label: "Basket", emoji: "🏀" },
];

const confidenceFilters: { value: Confidence | "all"; label: string; icon: typeof Shield }[] = [
  { value: "all", label: "Tous", icon: Filter },
  { value: "SAFE", label: "SAFE", icon: Shield },
  { value: "MODÉRÉ", label: "MODÉRÉ", icon: AlertTriangle },
  { value: "RISQUÉ", label: "RISQUÉ", icon: Flame },
];

export default function Matches() {
  const allMatches = useMemo(() => generateDailyMatches(), []);
  const [sport, setSport] = useState<Sport | "all">("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");
  const [valueBetsOnly, setValueBetsOnly] = useState(false);

  const filtered = useMemo(() => {
    return allMatches.filter(m => {
      if (sport !== "all" && m.sport !== sport) return false;
      if (confidence !== "all" && m.prediction.confidence !== confidence) return false;
      if (valueBetsOnly && !m.prediction.valueBet) return false;
      return true;
    });
  }, [allMatches, sport, confidence, valueBetsOnly]);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">
            Matchs du <span className="gradient-text">Jour</span>
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{today} — {allMatches.length} matchs analysés par l'IA</p>
        </motion.div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Sport */}
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card p-1">
            {sportFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSport(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  sport === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {/* Confidence */}
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card p-1">
            {confidenceFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setConfidence(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  confidence === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Value bets */}
          <Button
            variant={valueBetsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setValueBetsOnly(!valueBetsOnly)}
            className="gap-1.5 text-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Value Bets
          </Button>
        </div>

        {/* Match grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              locked={!match.isFree && i > 0}
              index={i}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">Aucun match trouvé avec ces filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
