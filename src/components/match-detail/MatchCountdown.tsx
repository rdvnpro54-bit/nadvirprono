import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface MatchCountdownProps {
  kickoff: string;
  isLive: boolean;
  sport: string;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-card/90 border border-border/50 backdrop-blur-sm"
      >
        <span className="font-display text-lg sm:text-2xl font-bold tabular-nums text-foreground">
          {String(value).padStart(2, "0")}
        </span>
      </motion.div>
      <span className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col justify-center pb-4">
      <span className="text-lg sm:text-xl font-bold text-primary animate-pulse">:</span>
    </div>
  );
}

export function MatchCountdown({ kickoff, isLive, sport }: MatchCountdownProps) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const kickoffMs = new Date(kickoff).getTime();
  const diff = kickoffMs - now;

  // LIVE mode — show elapsed match timer
  if (isLive || diff <= 0) {
    const elapsed = now - kickoffMs;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-destructive uppercase tracking-wider">En direct</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2">
          <span className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-destructive">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }

  // Countdown mode
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Coup d'envoi dans</span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {days > 0 && (
          <>
            <TimeUnit value={days} label="Jours" />
            <Separator />
          </>
        )}
        <TimeUnit value={hours} label="Heures" />
        <Separator />
        <TimeUnit value={minutes} label="Min" />
        <Separator />
        <TimeUnit value={seconds} label="Sec" />
      </div>
    </div>
  );
}
