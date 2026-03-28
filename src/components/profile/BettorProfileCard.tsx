import { motion } from "framer-motion";
import { Shield, Zap, Brain, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBettorProfile, type BettorType } from "@/hooks/useBettorProfile";

const TYPE_ICONS: Record<Exclude<BettorType, "unknown">, React.ElementType> = {
  safe: Shield,
  aggressive: Zap,
  balanced: Target,
  analyst: Brain,
};

export function BettorProfileCard() {
  const profile = useBettorProfile();

  if (!profile) return null;

  const Icon = TYPE_ICONS[profile.type as Exclude<BettorType, "unknown">] || Brain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20"
            whileHover={{ rotate: 10 }}
          >
            <Icon className={cn("h-5 w-5", profile.color)} />
          </motion.div>
          <div>
            <p className="text-xs font-bold flex items-center gap-1.5">
              {profile.emoji} {profile.label}
            </p>
            <p className="text-[10px] text-muted-foreground">Profil IA détecté</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
          {profile.description}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-card/50 border border-border/30 p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Confiance moy.</p>
            <p className={cn("text-xs font-bold", profile.stats.avgConfidence === "ELITE" ? "text-amber-400" : "text-primary")}>
              {profile.stats.avgConfidence}
            </p>
          </div>
          <div className="rounded-lg bg-card/50 border border-border/30 p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Sport favori</p>
            <p className="text-xs font-bold truncate">{profile.stats.preferredSport}</p>
          </div>
          <div className="rounded-lg bg-card/50 border border-border/30 p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Risque</p>
            <div className="flex justify-center gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-3 rounded-full",
                    i <= profile.stats.riskLevel ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {profile.stats.favoriteCount > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            {profile.stats.favoriteCount} match{profile.stats.favoriteCount > 1 ? "s" : ""} suivi{profile.stats.favoriteCount > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </motion.div>
  );
}
