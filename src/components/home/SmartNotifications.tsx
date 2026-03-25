import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Flame, Lock, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  icon: React.ReactNode;
  text: string;
  link?: string;
  type: "night" | "premium" | "live" | "info";
}

const NIGHT_MESSAGES = [
  { icon: <Moon className="h-4 w-4" />, text: "🌙 Encore debout ? Les meilleures cotes arrivent maintenant…" },
  { icon: <Flame className="h-4 w-4" />, text: "🔥 Bonne intuition à cette heure tardive…" },
  { icon: <TrendingUp className="h-4 w-4" />, text: "👀 Les joueurs nocturnes font les meilleurs gains…" },
  { icon: <Zap className="h-4 w-4" />, text: "💎 2 matchs haute confiance dispo en Premium" },
];

const PREMIUM_MESSAGES = [
  { icon: <Lock className="h-4 w-4" />, text: "🔒 Ce match est réservé aux membres Premium" },
  { icon: <Flame className="h-4 w-4" />, text: "🔥 87% de réussite sur les matchs Premium aujourd'hui" },
  { icon: <Zap className="h-4 w-4" />, text: "⏳ Offre Premium limitée – accès immédiat" },
  { icon: <BarChart3 className="h-4 w-4" />, text: "📈 Les membres Premium gagnent + souvent sur ce type de match" },
];

const INFO_MESSAGES = [
  { icon: <TrendingUp className="h-4 w-4" />, text: "📊 Nouvelle analyse IA disponible – consultez les pronostics" },
  { icon: <Flame className="h-4 w-4" />, text: "🔥 Forte activité sur les matchs de ce soir" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function SmartNotifications() {
  const { isPremium } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const shownCount = useRef(0);
  const maxPerSession = 6;

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback(() => {
    if (shownCount.current >= maxPerSession) return;

    const hour = new Date().getHours();
    let notif: { icon: React.ReactNode; text: string };
    let type: Notification["type"];
    let link: string | undefined;

    // Night mode (00h-05h)
    if (hour >= 0 && hour < 5) {
      notif = pickRandom(NIGHT_MESSAGES);
      type = "night";
      link = "/pricing";
    }
    // Premium push for non-premium users
    else if (!isPremium && Math.random() > 0.4) {
      notif = pickRandom(PREMIUM_MESSAGES);
      type = "premium";
      link = "/pricing";
    }
    // General info
    else {
      notif = pickRandom(INFO_MESSAGES);
      type = "info";
      link = "/matches";
    }

    const id = `notif-${Date.now()}`;
    shownCount.current++;

    setNotifications(prev => [...prev.slice(-2), { id, ...notif, link, type }]);

    // Auto-dismiss after 6s
    setTimeout(() => dismiss(id), 6000);
  }, [isPremium, dismiss]);

  useEffect(() => {
    // First notification after 15s
    const firstTimer = setTimeout(() => {
      addNotification();
    }, 15000);

    // Then every 35-60s
    const interval = setInterval(() => {
      addNotification();
    }, 35000 + Math.random() * 25000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [addNotification]);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 max-w-sm md:bottom-6">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative rounded-xl border border-border/50 bg-card/95 backdrop-blur-lg p-3 pr-8 shadow-lg shadow-black/10"
          >
            <button
              onClick={() => dismiss(n.id)}
              className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {n.link ? (
              <Link to={n.link} onClick={() => dismiss(n.id)} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-primary shrink-0">{n.icon}</span>
                <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
              </Link>
            ) : (
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-primary shrink-0">{n.icon}</span>
                <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
