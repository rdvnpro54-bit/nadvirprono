import { useGlobalActivity } from "./ActivityProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

export function GlobalActivityBanner() {
  const { globalCount } = useGlobalActivity();

  return (
    <motion.div
      className="flex items-center justify-center gap-2 text-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
        {/* Pulsing glow */}
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Flame className="relative h-4 w-4 text-primary" />
        <span className="relative font-medium text-foreground">
          <AnimatedCounter value={globalCount} />{" "}
          <span className="text-muted-foreground">utilisateurs actifs sur Pronosia</span>
        </span>
      </span>
    </motion.div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        className="inline-block font-bold text-primary tabular-nums"
        initial={{ y: 8, opacity: 0, filter: "blur(2px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: -8, opacity: 0, filter: "blur(2px)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {value.toLocaleString("fr-FR")}
      </motion.span>
    </AnimatePresence>
  );
}
