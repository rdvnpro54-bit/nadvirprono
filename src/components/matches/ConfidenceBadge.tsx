import React from "react";
import { Shield, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";

const config: Record<Confidence, { icon: typeof Shield; className: string }> = {
  "SAFE": { icon: Shield, className: "safe-badge" },
  "MODÉRÉ": { icon: AlertTriangle, className: "moderate-badge" },
  "RISQUÉ": { icon: Flame, className: "risky-badge" },
};

export const ConfidenceBadge = React.forwardRef<HTMLSpanElement, { confidence: Confidence; size?: "sm" | "lg" }>(
  ({ confidence, size = "sm" }, ref) => {
    const entry = config[confidence] || config["MODÉRÉ"];
    const { icon: Icon, className } = entry;
    return (
      <motion.span
        ref={ref}
        whileHover={{ scale: 1.1, y: -1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-semibold cursor-default transition-shadow",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
          className,
          "hover:shadow-lg"
        )}
      >
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
        {confidence}
      </motion.span>
    );
  }
);

ConfidenceBadge.displayName = "ConfidenceBadge";
