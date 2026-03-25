import { Navbar } from "@/components/layout/Navbar";
import { Star, CheckCircle, XCircle, Clock, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useMatchHistory, useWinrateStats } from "@/hooks/useMatchHistory";
import { useMatches, type CachedMatch } from "@/hooks/useMatches";
import { MatchCard } from "@/components/matches/MatchCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ResultBadge({ result }: { result: string | null }) {
  if (result === "win") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-500">
      <CheckCircle className="h-3 w-3" /> ✔ Gagné
    </span>
  );
  if (result === "loss") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-500">
      <XCircle className="h-3 w-3" /> ✖ Perdu
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      <Clock className="h-3 w-3" /> En attente
    </span>
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 glass-card p-4 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">Winrate IA : {stats.winrate}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.wins} victoires • {stats.losses} défaites • {stats.total} prédictions
              </p>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-bold">{stats.winrate}%</span>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="favoris" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="favoris">⭐ Favoris ({favoriteMatches.length})</TabsTrigger>
            <TabsTrigger value="historique">📊 Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="favoris" className="mt-4">
            {!user ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mt-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">Connecte-toi pour suivre des matchs</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Crée un compte pour ajouter des matchs en favoris et recevoir des alertes.
                </p>
                <Link to="/login" className="mt-4">
                  <Button>Se connecter</Button>
                </Link>
              </motion.div>
            ) : loadingFavs ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : favoriteMatches.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mt-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">Aucun match suivi</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Clique sur l'étoile ☆ d'un match pour le suivre.
                </p>
                <Link to="/matches" className="mt-4">
                  <Button variant="outline">Voir les matchs</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteMatches.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            {loadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : !history || history.length === 0 ? (
              <div className="flex flex-col items-center text-center mt-8">
                <div className="text-3xl mb-3">📊</div>
                <p className="text-sm font-semibold">Aucun historique pour le moment</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les résultats des prédictions passées apparaîtront ici automatiquement.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="glass-card p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">{result.sport}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{result.league_name}</span>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {result.home_team} vs {result.away_team}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Prédiction : {result.predicted_winner} ({result.predicted_confidence})
                      </p>
                    </div>
                    <ResultBadge result={result.result} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
