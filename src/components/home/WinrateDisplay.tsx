import { Target, BarChart3 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useHighConfidencePrecision, useTodayWinrate } from "@/hooks/useMatchHistory";

function AnimatedPercent({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const step = value / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <>{count}%</>;
}

export function WinrateDisplay() {
  const { data: hcData } = useHighConfidencePrecision();
  const { data: todayData } = useTodayWinrate();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const precision = hcData?.precision ?? null;

  if (precision === null) return null;

  return (
    <div ref={ref} className="flex flex-wrap items-center justify-center gap-2">
      <motion.div
        className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4 }}
      >
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold">
          📊 Précision IA : <span className="text-primary font-bold"><AnimatedPercent value={precision} inView={inView} /></span>
        </span>
        <span className="text-[9px] text-muted-foreground">
          ({globalData?.total} matchs)
        </span>
      </motion.div>

      {todayData && (
        <motion.div
          className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Target className="h-3.5 w-3.5 text-accent" />
          <span className="text-[11px] font-semibold">
            🔥 Winrate aujourd'hui : <span className="text-accent font-bold"><AnimatedPercent value={todayData.winrate} inView={inView} /></span>
          </span>
          <span className="text-[9px] text-muted-foreground">
            ({todayData.total} matchs)
          </span>
        </motion.div>
      )}
    </div>
  );
}
