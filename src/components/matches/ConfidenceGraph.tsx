import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfidenceGraphProps {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeTeam: string;
  awayTeam: string;
  size?: "sm" | "md";
}

export function ConfidenceGraph({ homeWin, draw, awayWin, homeTeam, awayTeam, size = "sm" }: ConfidenceGraphProps) {
  const total = homeWin + draw + awayWin || 1;
  const hPct = Math.round((homeWin / total) * 100);
  const dPct = Math.round((draw / total) * 100);
  const aPct = 100 - hPct - dPct;

  const isSmall = size === "sm";

  return (
    <div className="space-y-1">
      <div className={cn("flex rounded-full overflow-hidden", isSmall ? "h-2" : "h-3")}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-primary"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="bg-muted-foreground/30"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${aPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="bg-secondary"
        />
      </div>
      <div className={cn("flex justify-between", isSmall ? "text-[8px]" : "text-[10px]")}>
        <span className="text-primary font-bold">{hPct}%</span>
        <span className="text-muted-foreground">{dPct}%</span>
        <span className="text-secondary font-bold">{aPct}%</span>
      </div>
    </div>
  );
}
