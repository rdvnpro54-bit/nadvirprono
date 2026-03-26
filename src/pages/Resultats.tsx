import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useResultStats } from "@/hooks/useResults";
import type { MatchResult } from "@/hooks/useResults";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Lock, Crown, Sparkles, Zap, TrendingUp, Trophy } from "lucide-react";
import { ResultFilters } from "@/components/results/ResultFilters";
import { ResultCard } from "@/components/results/ResultCard";
import { WinrateProgressChart } from "@/components/results/WinrateProgressChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const staggerItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function groupByDay(results: MatchResult[]): { label: string; results: MatchResult[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const groups: Record<string, MatchResult[]> = {};
  for (const r of results) {
    const d = new Date(r.kickoff);
    let label: string;
    if (d.toDateString() === today) label = "📅 Aujourd'hui";
    else if (d.toDateString() === yesterday) label = "📅 Hier";
    else if (d >= weekAgo) label = "📅 Cette semaine";
    else if (d >= twoWeeksAgo) label = "📅 Semaine dernière";
    else label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  }

  const order = ["📅 Aujourd'hui", "📅 Hier", "📅 Cette semaine", "📅 Semaine dernière"];
  const entries = Object.entries(groups);
  entries.sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
  return entries.map(([label, results]) => ({ label, results }));
}

function isEliteOrStrong(r: MatchResult): boolean {
  const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
  return r.predicted_confidence === "SAFE" || maxProb >= 65;
}

function filterResults(results: MatchResult[], sport: string, status: string, period: string): MatchResult[] {
  let filtered = results;
  if (sport !== "all") filtered = filtered.filter(r => r.sport === sport);
  if (status === "win") filtered = filtered.filter(r => r.result === "win");
  else if (status === "loss") filtered = filtered.filter(r => r.result === "loss");
  else if (status === "high_conf") filtered = filtered.filter(r => isEliteOrStrong(r));
  if (period !== "all") {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = filtered.filter(r => {
      const d = new Date(r.kickoff);
      if (period === "today") return d.toDateString() === today;
      if (period === "yesterday") return d.toDateString() === yesterday;
      if (period === "week") return d >= weekAgo;
      if (period === "month") return d >= monthStart;
      return true;
    });
  }
  return filtered;
}

function getRecentPending(results: MatchResult[]): MatchResult[] {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  return results
    .filter(r => new Date(r.kickoff) >= weekAgo)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 20);
}

export default function Resultats() {
  const { user, isMonthlyPremium, isAdmin } = useAuth();
  const hasAccess = isMonthlyPremium || isAdmin;
  const { results, eliteStats, allStats, isLoading } = useResultStats();
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("high_conf");
  const [period, setPeriod] = useState("all");

  const displayResults = useMemo(() => {
    if (!results) return [];
    // Hide RISQUÉ losses — only show SAFE/MODÉRÉ wins + all pending
    const resolved = results.filter(r => {
      if (r.result !== "win" && r.result !== "loss") return false;
      const conf = (r.predicted_confidence || "").toUpperCase();
      if (conf === "RISQUÉ" && r.result === "loss") return false;
      return true;
    });
    return filterResults(resolved, sport, status, period);
  }, [results, sport, status, period]);

  const grouped = useMemo(() => groupByDay(displayResults), [displayResults]);
  const resolvedResults = useMemo(() => results?.filter(r => r.result === "win" || r.result === "loss") || [], [results]);
  const recentPending = useMemo(() => results ? getRecentPending(results) : [], [results]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
        <Navbar />
        <div className="container pt-20 pb-16 px-3 sm:px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center max-w-md"
          >
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Lock className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Résultats <span className="gradient-text">Premium</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              L'accès aux résultats et statistiques IA est réservé aux abonnés <strong>Premium Mensuel</strong>.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mb-6">Protège nos analyses et données exclusives.</p>
            <div className="flex flex-col gap-2">
              <Link to="/pricing">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="w-full gap-2 btn-glow">
                    <Crown className="h-4 w-4" /> Passer au Premium Mensuel — 29,90€/mois
                  </Button>
                </motion.div>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button variant="outline" className="w-full text-xs">Se connecter</Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 px-3 sm:px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            Résultats <span className="gradient-text">IA</span>
          </h1>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground">Performances vérifiables • Tous les résultats</p>
        </motion.div>

        {/* Stats Banner */}
        {eliteStats && eliteStats.total > 0 && (
          <motion.div
            className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {[
              { icon: Sparkles, color: "text-amber-400", value: `${eliteStats.winrate}%`, label: "Winrate ELITE" },
              { icon: TrendingUp, color: eliteStats.streak.type === "win" ? "text-success" : "text-destructive", value: `${eliteStats.streak.count} ${eliteStats.streak.type === "win" ? "✅" : "❌"}`, label: "Série en cours" },
              { icon: Flame, color: "text-primary", value: `${eliteStats.last20.winrate}%`, label: "20 derniers ELITE" },
              { icon: Zap, color: "text-primary", value: `${eliteStats.total}`, label: "Pronostics analysés" },
            ].map(({ icon: Icon, color, value, label }) => (
              <motion.div
                key={label}
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -4 }}
                className="glass-card p-3 text-center"
              >
                <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                </motion.div>
                <p className="font-display text-lg font-bold">{value}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {results && results.filter(r => r.result === "win" || r.result === "loss").length >= 2 && (
          <WinrateProgressChart results={results} />
        )}

        {/* Streak Tracker */}
        {eliteStats && eliteStats.streak.count >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={cn(
              "mt-4 rounded-xl border p-3 flex items-center gap-3",
              eliteStats.streak.type === "win" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
            )}
          >
            <motion.span
              className="text-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {eliteStats.streak.type === "win" ? "🔥" : "❄️"}
            </motion.span>
            <div>
              <p className="text-sm font-bold">
                Série de {eliteStats.streak.count} {eliteStats.streak.type === "win" ? "victoires" : "défaites"} consécutives
              </p>
              <p className="text-[10px] text-muted-foreground">
                {eliteStats.streak.type === "win" ? "L'IA est en feu ! 🎯" : "Phase de recalibration"}
              </p>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              >
                <Skeleton className="h-20 rounded-xl" />
              </motion.div>
            ))}
          </div>
        ) : resolvedResults.length === 0 ? (
          <motion.div
            className="mt-6 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="rounded-xl border border-border/50 bg-card/60 p-4 text-center"
              animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 15px 3px hsl(var(--primary) / 0.1)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div className="text-3xl mb-2" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>📊</motion.div>
              <p className="text-sm font-semibold">Aucun résultat finalisé pour le moment</p>
              <p className="mt-1 text-xs text-muted-foreground">Les résultats apparaîtront après chaque match terminé.</p>
            </motion.div>
            {recentPending.length > 0 && (
              <div>
                <h2 className="text-xs font-bold mb-2 flex items-center gap-1.5">📅 Matchs des 7 derniers jours — En attente</h2>
                <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                  {recentPending.map((r, i) => (
                    <motion.div key={r.id} variants={staggerItem}>
                      <ResultCard result={r} index={i} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="mt-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ResultFilters sport={sport} setSport={setSport} status={status} setStatus={setStatus} period={period} setPeriod={setPeriod} />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {displayResults.length} pronostic{displayResults.length !== 1 ? "s" : ""} affiché{displayResults.length !== 1 ? "s" : ""}
              </p>
            </div>
            {grouped.length > 0 ? (
              grouped.map((group, gi) => (
                <motion.div
                  key={group.label}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 }}
                >
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1 z-10">{group.label}</h3>
                  <motion.div variants={staggerContainer} initial="hidden" animate="show">
                    {group.results.map((r, i) => (
                      <motion.div key={r.id} variants={staggerItem}>
                        <ResultCard result={r} index={i} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ))
            ) : (
              <div className="text-center rounded-xl border bg-card p-8">
                <p className="text-sm font-semibold">Aucun résultat pour ces filtres</p>
              </div>
            )}
            <p className="text-[9px] text-muted-foreground/60 text-center mt-4">
              ⚠️ Les prédictions IA sont probabilistes, jamais garanties.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
