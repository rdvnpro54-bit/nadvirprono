import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";

interface CooldownTimerProps {
  lastUpdate: number;
  intervalMs: number;
}

export function CooldownTimer({ lastUpdate, intervalMs }: CooldownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = now - lastUpdate;
  const remaining = Math.max(0, intervalMs - elapsed);

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-primary">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>MAJ en cours...</span>
      </div>
    );
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const agoMins = Math.floor(elapsed / 60000);

  return (
    <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        MAJ il y a {agoMins < 1 ? "<1" : agoMins} min
      </span>
      <span className="font-mono text-foreground/70">
        Prochaine : {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
