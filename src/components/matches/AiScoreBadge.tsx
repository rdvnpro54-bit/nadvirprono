import { Sparkles, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Classification = "ELITE" | "STRONG" | "AVERAGE";

function classify(score: number): Classification {
  if (score >= 80) return "ELITE";
  if (score >= 65) return "STRONG";
  return "AVERAGE";
}

const config: Record<Classification, { icon: typeof Sparkles; className: string; label: string }> = {
  ELITE: { icon: Sparkles, className: "bg-amber-500/20 text-amber-400 border border-amber-500/30", label: "ELITE" },
  STRONG: { icon: Zap, className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", label: "STRONG" },
  AVERAGE: { icon: TrendingUp, className: "bg-muted text-muted-foreground border border-border", label: "AVERAGE" },
};

export function AiScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const classification = classify(score);
  const { icon: Icon, className, label } = config[classification];

  if (score <= 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      className
    )}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
      {label} {score}
    </span>
  );
}
