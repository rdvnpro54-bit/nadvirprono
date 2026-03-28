import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAllResults } from "@/hooks/useResults";

export function MissedMatchBanner() {
  const { isPremium, user } = useAuth();
  const { data: results } = useAllResults();

  const missedWins = useMemo(() => {
    if (!results || isPremium) return 0;
    // Count yesterday's won predictions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return results.filter(r => {
      const d = new Date(r.kickoff);
      return r.result === "win" && d >= yesterday && d < today;
    }).length;
  }, [results, isPremium]);

  if (missedWins < 2 || isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Link to="/pricing" className="block">
        <motion.div
          className="mx-auto max-w-2xl glass-card border-destructive/20 bg-destructive/5 p-3 flex items-center gap-3 cursor-pointer group"
          whileHover={{ scale: 1.01 }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          </motion.div>
          <p className="text-[11px] text-foreground flex-1">
            <span className="font-semibold">❌ Tu as raté {missedWins} prédictions gagnantes hier</span>
            <span className="text-muted-foreground"> • Réservé aux abonnés Premium</span>
          </p>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-primary group-hover:underline">
            <Lock className="h-3 w-3" /> Débloquer <ChevronRight className="h-3 w-3" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
