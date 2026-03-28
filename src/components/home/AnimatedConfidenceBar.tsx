import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedConfidenceBarProps {
  value: number; // 0-100
  size?: "sm" | "md";
  showLabel?: boolean;
}

function getColor(value: number): string {
  if (value >= 75) return "from-success to-success/80";
  if (value >= 55) return "from-primary to-primary/80";
  if (value >= 40) return "from-amber-400 to-amber-500";
  return "from-destructive to-destructive/80";
}

function getGlow(value: number): string {
  if (value >= 75) return "shadow-success/30";
  if (value >= 55) return "shadow-primary/30";
  if (value >= 40) return "shadow-amber-400/30";
  return "shadow-destructive/30";
}

export function AnimatedConfidenceBar({ value, size = "sm", showLabel = true }: AnimatedConfidenceBarProps) {
  const isSmall = size === "sm";

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-muted-foreground font-medium">Confiance IA</span>
          <motion.span
            className={cn(
              "font-bold",
              isSmall ? "text-[10px]" : "text-xs",
              value >= 75 ? "text-success" : value >= 55 ? "text-primary" : value >= 40 ? "text-amber-400" : "text-destructive"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={value}
          >
            {value}%
          </motion.span>
        </div>
      )}
      <div className={cn("rounded-full bg-muted/30 overflow-hidden relative", isSmall ? "h-1.5" : "h-2.5")}>
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r shadow-lg", getColor(value), getGlow(value))}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
