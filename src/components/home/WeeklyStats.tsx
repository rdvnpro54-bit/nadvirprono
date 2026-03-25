import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, CheckCircle, BarChart3 } from "lucide-react";

export function WeeklyStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const { data } = useQuery({
    queryKey: ["weekly-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("match_results")
        .select("result")
        .not("result", "is", null)
        .gte("resolved_at", sevenDaysAgo.toISOString());
      if (error) throw error;

      const wins = data.filter(r => r.result === "win").length;
      const total = data.length;
      const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

      return { wins, total, winrate };
    },
    staleTime: 5 * 60_000,
  });

  if (!data || data.total < 3) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md"
    >
      <div className="glass-card p-3 sm:p-4">
        <h3 className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          📊 Résultats des 7 derniers jours
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CheckCircle className="h-3 w-3 text-success" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold text-foreground">
              {data.wins}/{data.total}
            </span>
            <p className="text-[9px] text-muted-foreground">Gagnés</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <BarChart3 className="h-3 w-3 text-primary" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold text-foreground">
              {data.winrate}%
            </span>
            <p className="text-[9px] text-muted-foreground">Winrate</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold text-success">
              +{Math.round((data.wins - data.total * 0.5) * 10)}€
            </span>
            <p className="text-[9px] text-muted-foreground">ROI estimé</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
