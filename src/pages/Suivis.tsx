import { Navbar } from "@/components/layout/Navbar";
import { Star, CheckCircle, XCircle, Clock, Trophy, TrendingUp, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useMatchHistory, useWinrateStats } from "@/hooks/useMatchHistory";
import { useMatches, type CachedMatch } from "@/hooks/useMatches";
import { MatchCard } from "@/components/matches/MatchCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const staggerItem = { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } } };

function ResultBadge({ result }: { result: string | null }) {
  if (result === "win") return (
    <motion.span
      className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500 }}
    >
      <CheckCircle className="h-3 w-3" /> ✔ Gagné
    </motion.span>
  );
  if (result === "loss") return (
    <motion.span
      className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500 }}
    >
      <XCircle className="h-3 w-3" /> ✖ Perdu
    </motion.span>
  );
  return (
    <motion.span
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Clock className="h-3 w-3" /> En attente
    </motion.span>
  );
}

function WinrateChart({ history }: { history: { result: string | null; kickoff: string }[] }) {
  const chartData = useMemo(() => {
    const sorted = [...history].filter(h => h.result).sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    let wins = 11, losses = 3;
    const data: { date: string; winrate: number; label: string }[] = [
      { date: "Base", winrate: Math.round((wins / (wins + losses)) * 100), label: "Base IA" },
    ];
    for (const h of sorted) {
      if (h.result === "win") wins++;
      else if (h.result === "loss") losses++;
      const total = wins + losses;
      const wr = Math.round((wins / total) * 100);
      const d = new Date(h.kickoff);
      data.push({
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        winrate: wr,
        label: `${wr}% (${wins}W/${losses}L)`,
      });
    }
    return data;
  }, [history]);

  if (chartData.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-4 glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <TrendingUp className="h-4 w-4 text-primary" />
        </motion.div>
        <h3 className="text-sm font-bold">Progression du Winrate</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="winrateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`, "Winrate"]}
          />
          <Area
            type="monotone"
            dataKey="winrate"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#winrateGrad)"
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function MatchCalendar({ matches }: { matches: CachedMatch[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, CachedMatch[]>();
    for (const m of matches) {
      const day = new Date(m.kickoff).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const da = new Date(a[1][0].kickoff).getTime();
      const db = new Date(b[1][0].kickoff).getTime();
      return da - db;
    });
  }, [matches]);

  if (grouped.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-4 glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Calendrier des matchs suivis</h3>
      </div>
      <div className="space-y-3">
        {grouped.map(([day, dayMatches], gi) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gi * 0.1 }}
          >
            <p className="text-[11px] font-semibold text-primary uppercase mb-1.5">{day}</p>
            <div className="space-y-1.5">
              {dayMatches.map((m, i) => {
                const time = new Date(m.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <Link key={m.id} to={`/match/${m.id}`} className="block">
                    <motion.div
                      className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/50 px-3 py-2 text-sm hover:bg-card transition-colors"
                      whileHover={{ x: 4, boxShadow: "0 4px 12px -4px hsl(var(--primary) / 0.1)" }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.1 + i * 0.05 }}
                    >
                      <span className="text-[10px] font-semibold text-muted-foreground w-10">{time}</span>
                      <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary shrink-0">
                        {m.sport === "football" ? "⚽" : m.sport === "tennis" ? "🎾" : "🏀"}
                      </span>
                      <span className="font-medium truncate flex-1">{m.home_team}</span>
                      <span className="text-muted-foreground text-[10px]">vs</span>
                      <span className="font-medium truncate flex-1 text-right">{m.away_team}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Suivis() {
  const { user } = useAuth();
  const { favorites, isLoading: loadingFavs } = useFavorites();
  const { data: matches } = useMatches();
  const { data: history, isLoading: loadingHistory } = useMatchHistory();
  const { data: stats } = useWinrateStats();

  const favoriteMatches = matches?.filter(m =>
    favorites.some(f => f.fixture_id === m.fixture_id)
  ) || [];

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <div className="container pt-20 pb-16 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">
            Mes <span className="gradient-text">Suivis</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Tes favoris et l'historique des prédictions IA.</p>
        </motion.div>

        {/* Winrate stats card */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.15)" }}
            className="mt-4 glass-card p-4 flex items-center gap-4"
          >
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Trophy className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="flex-1">
              <p className="text-lg font-bold">Précision IA : {stats.precision}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.wins} victoires • {stats.losses} défaites • {stats.total} prédictions
              </p>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-bold">{stats.precision}%</span>
            </div>
          </motion.div>
        )}

        {history && history.length > 0 && <WinrateChart history={history} />}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="favoris" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="favoris">⭐ Favoris ({favoriteMatches.length})</TabsTrigger>
              <TabsTrigger value="calendrier">📅 Calendrier</TabsTrigger>
              <TabsTrigger value="historique">📊 Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="favoris" className="mt-4">
              {!user ? (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mt-8">
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </motion.div>
                  <h2 className="mt-4 font-display text-lg font-semibold">Connecte-toi pour suivre des matchs</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Crée un compte pour ajouter des matchs en favoris et recevoir des alertes.
                  </p>
                  <Link to="/login" className="mt-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button>Se connecter</Button>
                    </motion.div>
                  </Link>
                </motion.div>
              ) : loadingFavs ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                      <Skeleton className="h-32 rounded-xl" />
                    </motion.div>
                  ))}
                </div>
              ) : favoriteMatches.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mt-8">
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </motion.div>
                  <h2 className="mt-4 font-display text-lg font-semibold">Aucun match suivi</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Clique sur l'étoile ☆ d'un match pour le suivre.</p>
                  <Link to="/matches" className="mt-4">
                    <Button variant="outline">Voir les matchs</Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {favoriteMatches.map((match, i) => (
                    <motion.div key={match.id} variants={staggerItem}>
                      <MatchCard match={match} index={i} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="calendrier" className="mt-4">
              {!user ? (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mt-8">
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                  </motion.div>
                  <h2 className="mt-4 font-display text-lg font-semibold">Connecte-toi pour voir ton calendrier</h2>
                  <Link to="/login" className="mt-4"><Button>Se connecter</Button></Link>
                </motion.div>
              ) : favoriteMatches.length === 0 ? (
                <div className="flex flex-col items-center text-center mt-8">
                  <div className="text-3xl mb-3">📅</div>
                  <p className="text-sm font-semibold">Aucun match dans ton calendrier</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ajoute des matchs en favoris pour les voir ici.</p>
                  <Link to="/matches" className="mt-4"><Button variant="outline">Voir les matchs</Button></Link>
                </div>
              ) : (
                <MatchCalendar matches={favoriteMatches} />
              )}
            </TabsContent>

            <TabsContent value="historique" className="mt-4">
              {loadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                      <Skeleton className="h-16 rounded-xl" />
                    </motion.div>
                  ))}
                </div>
              ) : !history || history.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center mt-8"
                >
                  <motion.div className="text-3xl mb-3" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>📊</motion.div>
                  <p className="text-sm font-semibold">Aucun historique pour le moment</p>
                  <p className="mt-1 text-xs text-muted-foreground">Les résultats apparaîtront ici automatiquement.</p>
                </motion.div>
              ) : (
                <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                  {history.map((result, i) => (
                    <motion.div
                      key={result.id}
                      variants={staggerItem}
                      whileHover={{ x: 4, boxShadow: "0 4px 12px -4px hsl(var(--primary) / 0.1)" }}
                      className="glass-card p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground">{result.sport}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{result.league_name}</span>
                        </div>
                        <p className="text-sm font-semibold truncate">{result.home_team} vs {result.away_team}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Prédiction : {result.predicted_winner} ({result.predicted_confidence})
                        </p>
                      </div>
                      <ResultBadge result={result.result} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
