import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export function useWinrate() {
  return useQuery({
    queryKey: ["ia-winrate"],
    queryFn: async () => {
      // Fetch finished matches (status FT = Full Time, AET, PEN)
      const { data, error } = await supabase
        .from("cached_matches")
        .select("pred_home_win, pred_away_win, home_score, away_score, status")
        .in("status", ["FT", "AET", "PEN"]);

      if (error) throw error;
      if (!data || data.length === 0) return { winrate: null, total: 0, correct: 0 };

      let correct = 0;
      let total = 0;

      for (const m of data) {
        if (m.home_score === null || m.away_score === null) continue;
        total++;

        const predictedHome = m.pred_home_win > m.pred_away_win;
        const actualHome = m.home_score > m.away_score;
        const isDraw = m.home_score === m.away_score;

        // If it's a draw, skip (hard to predict)
        if (isDraw) {
          total--;
          continue;
        }

        if (predictedHome === actualHome) correct++;
      }

      return {
        winrate: total > 0 ? Math.round((correct / total) * 100) : null,
        total,
        correct,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function WinrateDisplay() {
  const { data } = useWinrate();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  const winrate = data?.winrate;
  const total = data?.total || 0;

  useEffect(() => {
    if (!inView || winrate === null || winrate === undefined) return;
    let current = 0;
    const step = winrate / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= winrate) {
        setCount(winrate);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, winrate]);

  if (winrate === null || winrate === undefined) return null;

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
    >
      <Target className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold">
        IA Accuracy : <span className="text-primary font-bold">{count}%</span>
      </span>
      <span className="text-[10px] text-muted-foreground">
        ({total} matchs vérifiés)
      </span>
    </motion.div>
  );
}
