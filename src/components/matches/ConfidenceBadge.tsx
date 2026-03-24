import { type Confidence } from "@/data/simulatedData";
import { Shield, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const config: Record<Confidence, { icon: typeof Shield; className: string }> = {
  "SAFE": { icon: Shield, className: "safe-badge" },
  "MODÉRÉ": { icon: AlertTriangle, className: "moderate-badge" },
  "RISQUÉ": { icon: Flame, className: "risky-badge" },
};

export function ConfidenceBadge({ confidence, size = "sm" }: { confidence: Confidence; size?: "sm" | "lg" }) {
  const { icon: Icon, className } = config[confidence];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm",
      className
    )}>
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {confidence}
    </span>
  );
}
