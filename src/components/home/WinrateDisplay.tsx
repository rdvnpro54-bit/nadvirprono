import { Target } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useWinrateStats } from "@/hooks/useMatchHistory";

export function WinrateDisplay() {
  const { data } = useWinrateStats();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  const winrate = data?.winrate ?? null;
  const total = data?.total || 0;

  useEffect(() => {
    if (!inView || winrate === null) return;
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

  if (winrate === null) return null;

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
        Winrate IA : <span className="text-primary font-bold">{count}%</span>
      </span>
      <span className="text-[10px] text-muted-foreground">
        ({total} matchs vérifiés)
      </span>
    </motion.div>
  );
}
