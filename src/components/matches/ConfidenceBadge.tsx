import { Shield, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";

const config: Record<Confidence, { icon: typeof Shield; className: string }> = {
  "SAFE": { icon: Shield, className: "safe-badge" },
  "MODÉRÉ": { icon: AlertTriangle, className: "moderate-badge" },
  "RISQUÉ": { icon: Flame, className: "risky-badge" },
};

export function ConfidenceBadge({ confidence, size = "sm" }: { confidence: Confidence; size?: "sm" | "lg" }) {
  const entry = config[confidence] || config["MODÉRÉ"];
  const { icon: Icon, className } = entry;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      className
    )}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
      {confidence}
    </span>
  );
}
