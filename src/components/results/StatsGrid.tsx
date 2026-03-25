import { motion } from "framer-motion";
import { CheckCircle, XCircle, TrendingUp, Trophy, Target, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultStats } from "@/hooks/useResults";

function StatCard({ icon: Icon, label, value, color, prefix = "" }: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 flex flex-col items-center gap-1.5 text-center">
      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
      <span className="font-display text-lg sm:text-xl font-bold">{prefix}{value}</span>
      <span className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsGrid({ stats, title, icon: Icon }: { stats: ResultStats; title: string; icon: typeof Trophy }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={CheckCircle} label="Gagnés" value={stats.wins} color="text-success" />
        <StatCard icon={XCircle} label="Perdus" value={stats.losses} color="text-destructive" />
        <StatCard icon={BarChart3} label="Winrate" value={`${stats.winrate}%`} color="text-primary" />
        <StatCard icon={DollarSign} label="Profit" value={`${stats.profit}€`} color={stats.profit >= 0 ? "text-success" : "text-destructive"} prefix={stats.profit >= 0 ? "+" : ""} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Target} label="Paris total" value={stats.total} color="text-muted-foreground" />
        <StatCard icon={TrendingUp} label="ROI" value={`${stats.roi}%`} color={stats.roi >= 0 ? "text-success" : "text-destructive"} prefix={stats.roi >= 0 ? "+" : ""} />
        <StatCard icon={DollarSign} label="Misé total" value={`${stats.totalStaked}€`} color="text-muted-foreground" />
      </div>
    </motion.div>
  );
}
