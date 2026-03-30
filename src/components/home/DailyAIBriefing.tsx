import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Shield, AlertTriangle, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface Briefing {
  date: string;
  mode: string;
  leagues_analyzed: number;
  matches_discarded: number;
  picks_retained: number;
  avg_confidence: number;
  daily_focus: string | null;
}

const MODE_CONFIG: Record<string, { icon: typeof Brain; label: string; color: string; bg: string }> = {
  normal: { icon: Brain, label: "Normal", color: "text-primary", bg: "bg-primary/10" },
  caution: { icon: AlertTriangle, label: "🟡 Prudence", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  streak: { icon: Shield, label: "🔴 Protection", color: "text-destructive", bg: "bg-destructive/10" },
  emergency: { icon: Zap, label: "⚫ Urgence", color: "text-foreground", bg: "bg-foreground/10" },
};

export function DailyAIBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
    supabase
      .from("daily_briefings")
      .select("*")
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBriefing(data as Briefing);
      });
  }, []);

  if (!briefing) return null;

  const config = MODE_CONFIG[briefing.mode] || MODE_CONFIG.normal;
  const Icon = config.icon;
  const dateLabel = new Date(briefing.date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="container px-3 sm:px-4 py-2"
    >
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-semibold">📋 Briefing IA du {dateLabel}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <div className={`rounded-lg ${config.bg} p-2 text-center`}>
            <Icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${config.color}`} />
            <span className={`text-[9px] font-bold ${config.color}`}>{config.label}</span>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <span className="text-sm font-bold tabular-nums">{briefing.leagues_analyzed}</span>
            <span className="block text-[8px] text-muted-foreground">Analysés</span>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <span className="text-sm font-bold tabular-nums text-destructive">{briefing.matches_discarded}</span>
            <span className="block text-[8px] text-muted-foreground">Écartés</span>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <span className="text-sm font-bold tabular-nums text-primary">{briefing.picks_retained}</span>
            <span className="block text-[8px] text-muted-foreground">Retenus</span>
          </div>
        </div>

        {briefing.avg_confidence > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Confiance moyenne</span>
            <span className="font-semibold text-foreground">{briefing.avg_confidence}%</span>
          </div>
        )}

        {briefing.daily_focus && (
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/80 italic">
            🎯 {briefing.daily_focus}
          </p>
        )}
      </div>
    </motion.div>
  );
}
