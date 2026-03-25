import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = timeLeft;

  return (
    <motion.div
      className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Clock className="h-4 w-4 text-primary" />
      <span>
        Nouveaux pronostics dans{" "}
        <span className="font-mono font-bold text-foreground">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </span>
    </motion.div>
  );
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
