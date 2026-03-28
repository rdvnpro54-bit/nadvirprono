import { motion } from "framer-motion";
import { Flame, TrendingDown } from "lucide-react";
import { useAllResults } from "@/hooks/useResults";
import { cn } from "@/lib/utils";

export function WinStreak() {
  const { data: results } = useAllResults();

  if (!results || results.length < 3) return null;

  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  if (resolved.length === 0) return null;

  const sorted = [...resolved].sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
  const firstResult = sorted[0].result as "win" | "loss";
  let count = 0;
  for (const r of sorted) {
    if (r.result === firstResult) count++;
    else break;
  }

  if (count < 2) return null;

  const isWin = firstResult === "win";

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border backdrop-blur-sm",
        isWin
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {isWin ? (
        <Flame className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      🔥 Série : {count} {isWin ? "gagnés" : "perdus"} d'affilée
    </motion.div>
  );
}
