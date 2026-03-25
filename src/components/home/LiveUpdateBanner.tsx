import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";

interface LiveUpdateBannerProps {
  lastUpdate: number;
  matchCount: number;
}

export function LiveUpdateBanner({ lastUpdate, matchCount }: LiveUpdateBannerProps) {
  const [now, setNow] = useState(Date.now());
  const [prevCount, setPrevCount] = useState(matchCount);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (matchCount > prevCount) {
      setNewCount(matchCount - prevCount);
      const timer = setTimeout(() => setNewCount(0), 5000);
      return () => clearTimeout(timer);
    }
    setPrevCount(matchCount);
  }, [matchCount, prevCount]);

  const agoMs = now - lastUpdate;
  const agoMin = Math.floor(agoMs / 60000);
  const agoText = agoMin < 1 ? "à l'instant" : `il y a ${agoMin} min`;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px]"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <Wifi className="h-3 w-3 text-primary" />
        <span className="text-muted-foreground">
          Données mises à jour <span className="font-semibold text-foreground">{agoText}</span>
        </span>
      </motion.div>

      <AnimatePresence>
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            className="text-[10px] font-semibold text-primary"
          >
            +{newCount} nouveaux matchs ajoutés
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
