import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/matches/ConfidenceBadge";
import { Brain, TrendingUp, Activity, BarChart3, CheckCircle, Target, Swords, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { CachedMatch } from "@/hooks/useMatches";
import { OddsTab } from "./OddsTab";

interface DetailTabsProps {
  match: CachedMatch;
  predictionText: string;
  confidence: number;
  keyFactors: string[];
  userCount: number;
  isLive?: boolean;
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function PredictionTab({ match, predictionText, confidence }: Pick<DetailTabsProps, "match" | "predictionText" | "confidence">) {
  return (
    <div className="space-y-4">
      {/* Main prediction */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card glow-border p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
          <Target className="h-4 w-4 text-primary" /> Pronostic Principal
        </h4>
        <div className="space-y-2">
          <StatRow label="📊 Pronostic"><span className="font-bold text-primary">{predictionText}</span></StatRow>
          <StatRow label="💎 Confiance"><ConfidenceBadge confidence={match.pred_confidence as any} /></StatRow>
          <StatRow label="🎯 Score prédit"><span className="font-bold">{match.pred_score_home} - {match.pred_score_away}</span></StatRow>
          {match.pred_value_bet && (
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 p-2 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Value Bet détecté — cote sous-estimée</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Detailed predictions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
          <Brain className="h-4 w-4 text-primary" /> Marchés IA
        </h4>
        <div className="space-y-3">
          {[
            { label: `Over ${match.pred_over_under}`, value: match.pred_over_prob, color: "bg-primary" },
            { label: `Under ${match.pred_over_under}`, value: 100 - Number(match.pred_over_prob), color: "bg-secondary" },
            { label: "BTTS Oui", value: match.pred_btts_prob, color: "bg-success" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${color} rounded-full prob-bar-fill`} style={{ width: `${value}%` }} />
                </div>
                <span className="text-xs font-semibold w-10 text-right tabular-nums">{value}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatsTab({ match, userCount }: Pick<DetailTabsProps, "match" | "userCount">) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
          <Activity className="h-4 w-4 text-primary" /> Informations
        </h4>
        <div className="space-y-1 divide-y divide-border/30">
          <StatRow label="Confiance IA"><ConfidenceBadge confidence={match.pred_confidence as any} /></StatRow>
          <StatRow label="Sport"><span className="text-xs font-medium capitalize">{match.sport}</span></StatRow>
          <StatRow label="Ligue"><span className="text-xs font-medium">{match.league_name}</span></StatRow>
          <StatRow label="Facteurs analysés"><span className="text-xs font-medium text-primary">+250</span></StatRow>
          <StatRow label="Utilisateurs actifs">
            <span className="flex items-center gap-1 text-xs font-medium">
              <Users className="h-3 w-3 text-primary" /> {userCount}
            </span>
          </StatRow>
          <StatRow label="Dernière MAJ">
            <span className="text-[10px] tabular-nums">{new Date(match.fetched_at).toLocaleTimeString("fr-FR")}</span>
          </StatRow>
        </div>
      </div>
    </motion.div>
  );
}

function H2HTab({ match }: { match: CachedMatch }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
        <Swords className="h-4 w-4 text-primary" /> Confrontations directes
      </h4>
      <p className="text-xs text-muted-foreground">
        L'historique des confrontations entre {match.home_team} et {match.away_team} est intégré dans l'analyse IA.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: match.home_team, pct: match.pred_home_win, color: "text-primary" },
          { label: "Nul", pct: match.pred_draw, color: "text-muted-foreground" },
          { label: match.away_team, pct: match.pred_away_win, color: "text-secondary" },
        ].map(({ label, pct, color }) => (
          <div key={label} className="rounded-lg bg-muted/50 p-2.5">
            <span className={`block text-lg sm:text-xl font-bold tabular-nums ${color}`}>{pct}%</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate block">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AnalysisTab({ match, keyFactors }: Pick<DetailTabsProps, "match" | "keyFactors">) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
          <BarChart3 className="h-4 w-4 text-primary" /> Analyse IA
        </h4>
        <p className="text-xs leading-relaxed text-muted-foreground">{match.pred_analysis}</p>
      </div>
      {keyFactors.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
            <CheckCircle className="h-4 w-4 text-primary" /> Facteurs clés
          </h4>
          <ul className="space-y-1.5">
            {keyFactors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

export function DetailTabs({ match, predictionText, confidence, keyFactors, userCount, isLive = false }: DetailTabsProps) {
  return (
    <Tabs defaultValue="prediction" className="mt-4">
      <TabsList className="w-full grid grid-cols-5 bg-card/80 border border-border/50 h-9">
        <TabsTrigger value="prediction" className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <Target className="h-3 w-3 mr-1 hidden sm:inline" /> Prono
        </TabsTrigger>
        <TabsTrigger value="odds" className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <DollarSign className="h-3 w-3 mr-1 hidden sm:inline" /> Cotes
        </TabsTrigger>
        <TabsTrigger value="stats" className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <Activity className="h-3 w-3 mr-1 hidden sm:inline" /> Stats
        </TabsTrigger>
        <TabsTrigger value="h2h" className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <Swords className="h-3 w-3 mr-1 hidden sm:inline" /> H2H
        </TabsTrigger>
        <TabsTrigger value="analysis" className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <Brain className="h-3 w-3 mr-1 hidden sm:inline" /> IA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prediction">
        <PredictionTab match={match} predictionText={predictionText} confidence={confidence} />
      </TabsContent>
      <TabsContent value="odds">
        <OddsTab match={match} isLive={isLive} />
      </TabsContent>
      <TabsContent value="stats">
        <StatsTab match={match} userCount={userCount} />
      </TabsContent>
      <TabsContent value="h2h">
        <H2HTab match={match} />
      </TabsContent>
      <TabsContent value="analysis">
        <AnalysisTab match={match} keyFactors={keyFactors} />
      </TabsContent>
    </Tabs>
  );
}
