import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "expand" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("expand"), 1200);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "#080810" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Glow orbs */}
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(42 90% 55% / 0.15), transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-[200px] h-[200px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(217 70% 50% / 0.1), transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.4], opacity: [0, 0.5, 0.2] }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
          />

          {/* Logo P */}
          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={
              phase === "logo"
                ? { scale: 1, opacity: 1 }
                : { scale: 1.1, opacity: 0, y: -20 }
            }
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img src="/pronosia-p-logo.png" alt="Pronosia logo" className="h-full w-full object-cover" />
            </motion.div>

            {/* App name */}
            <motion.span
              className="text-lg font-semibold tracking-wide text-foreground/80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Pronosia
            </motion.span>

            {/* Loading bar */}
            <motion.div
              className="w-24 h-0.5 rounded-full overflow-hidden bg-muted/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-primary)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
