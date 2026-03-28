import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PromoNotification {
  id: string;
  message: string;
  discount: number;
  expiresAt: number;
}

export function PromoListener() {
  const [promo, setPromo] = useState<PromoNotification | null>(null);
  const [remainingSecs, setRemainingSecs] = useState(0);

  const dismiss = useCallback(() => setPromo(null), []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-promo-broadcast")
      .on("broadcast", { event: "promo-push" }, (payload) => {
        const { message, discount, duration_minutes } = payload.payload || {};
        if (!message) return;

        const expiresAt = Date.now() + (duration_minutes || 5) * 60 * 1000;
        setPromo({
          id: `promo-${Date.now()}`,
          message,
          discount: discount || 10,
          expiresAt,
        });
        setRemainingSecs((duration_minutes || 5) * 60);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (!promo) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((promo.expiresAt - Date.now()) / 1000));
      setRemainingSecs(left);
      if (left <= 0) {
        setPromo(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [promo]);

  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;

  return (
    <AnimatePresence>
      {promo && (
        <motion.div
          key={promo.id}
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-[100] px-3 pt-[env(safe-area-inset-top,0px)]"
        >
          <div className="mx-auto mt-2 max-w-lg rounded-xl border border-emerald-500/30 bg-card/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-emerald-500/10">
            <button
              onClick={dismiss}
              className="absolute top-2 right-3 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Gift className="h-4.5 w-4.5 shrink-0" />
              🎉 Offre Flash : -{promo.discount}%
            </div>

            <p className="mt-1 text-xs text-foreground/90">{promo.message}</p>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-bold">
                <Clock className="h-3 w-3" />
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <Link
                to="/pricing"
                onClick={dismiss}
                className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black transition-colors hover:bg-emerald-400"
              >
                En profiter →
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
