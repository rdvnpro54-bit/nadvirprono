import { useWeeklyResultStats } from "@/hooks/useResults";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, CheckCircle, BarChart3, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function WeeklyStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { data } = useWeeklyResultStats();

  if (!data || data.total < 3) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md"
    >
      <Link to="/resultats">
        <div className="glass-card match-card-hover p-3 sm:p-4">
          <h3 className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            📊 Résultats des 7 derniers jours
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
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
                <DollarSign className="h-3 w-3 text-success" />
              </div>
              <span className={cn(
                "font-display text-lg sm:text-xl font-bold",
                data.profit >= 0 ? "text-success" : "text-destructive"
              )}>
                {data.profit >= 0 ? "+" : ""}{data.profit}€
              </span>
              <p className="text-[9px] text-muted-foreground">Profit</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <span className={cn(
                "font-display text-lg sm:text-xl font-bold",
                data.roi >= 0 ? "text-success" : "text-destructive"
              )}>
                {data.roi >= 0 ? "+" : ""}{data.roi}%
              </span>
              <p className="text-[9px] text-muted-foreground">ROI</p>
            </div>
          </div>
          <p className="text-center text-[9px] text-muted-foreground mt-2">
            Mise fixe 10€ • Cotes estimées • Voir tous les résultats →
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
