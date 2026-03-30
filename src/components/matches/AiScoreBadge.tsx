import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Classification = "ELITE" | "STRONG";

function classify(score: number): Classification {
  if (score >= 80) return "ELITE";
  return "STRONG";
}

const config: Record<Classification, { icon: typeof Sparkles; badgeClass: string; label: string }> = {
  ELITE: { icon: Sparkles, badgeClass: "badge-elite", label: "ELITE" },
  STRONG: { icon: Zap, badgeClass: "badge-strong", label: "STRONG" },
};

export function AiScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const classification = classify(score);
  const { icon: Icon, badgeClass, label } = config[classification];

  if (score <= 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      badgeClass
    )}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
      {label} {score}
    </span>
  );
}
