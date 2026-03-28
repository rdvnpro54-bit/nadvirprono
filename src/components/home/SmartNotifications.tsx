import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  icon: React.ReactNode;
  text: string;
  link: string;
  type: "match" | "info";
}

const NOTIFICATION_TEMPLATES = [
  (home: string, away: string, conf: number, time: string) =>
    `🔥 Prédiction SAFE — ${home} vs ${away} • Confiance ${conf}% • Coup d'envoi ${time}`,
  (home: string, away: string, conf: number, time: string) =>
    `⚡ Alerte PRONOSIA — ${home} vs ${away} détecté à ${conf}% de confiance • ${time}`,
  (home: string, away: string, conf: number, time: string) =>
    `💎 Opportunité identifiée — ${home} vs ${away} • Signal fort (${conf}%) • ${time}`,
  (home: string, away: string, conf: number, time: string) =>
    `🎯 Match analysé — ${home} vs ${away} • Indice de confiance: ${conf}% • Début ${time}`,
];

const ICONS = [
  <Flame className="h-4 w-4" />,
  <Zap className="h-4 w-4" />,
  <TrendingUp className="h-4 w-4" />,
  <Flame className="h-4 w-4" />,
  <TrendingUp className="h-4 w-4" />,
];

export function SmartNotifications() {
  const { data: matches } = useMatches();
  const { isPremium } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const shownCount = useRef(0);
  const shownFixtures = useRef(new Set<number>());
  const templateIndex = useRef(0);
  const maxPerSession = 5;

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback(() => {
    if (shownCount.current >= maxPerSession || !matches) return;

    const now = Date.now();
    const safeMatches = matches.filter(m => {
      if (m.pred_confidence !== "SAFE") return false;
      if (shownFixtures.current.has(m.fixture_id)) return false;
      const kickoff = new Date(m.kickoff).getTime();
      const diff = kickoff - now;
      // Show upcoming SAFE matches (next 24h) or recently started (< 15 min ago)
      return diff > -15 * 60_000 && diff < 24 * 60 * 60_000;
    });

    if (safeMatches.length === 0) return;

    const match = safeMatches.sort((a, b) =>
      new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )[0];

    const confidence = Math.max(Number(match.pred_home_win), Number(match.pred_away_win));
    const time = new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const id = `notif-${Date.now()}`;
    shownCount.current++;
    shownFixtures.current.add(match.fixture_id);

    const tplIdx = templateIndex.current % NOTIFICATION_TEMPLATES.length;
    templateIndex.current++;

    const notif: Notification = {
      id,
      icon: ICONS[tplIdx],
      text: NOTIFICATION_TEMPLATES[tplIdx](match.home_team, match.away_team, confidence, time),
      // Always redirect to the match page — never to premium/pricing
      link: `/match/${match.id}`,
      type: "match",
    };

    setNotifications(prev => [...prev.slice(-1), notif]);
    setTimeout(() => dismiss(id), 10000);
  }, [matches, dismiss]);

  useEffect(() => {
    const firstDelay = isPremium ? 15000 : 25000;
    const firstTimer = setTimeout(addNotification, firstDelay);
    const interval = setInterval(() => {
      addNotification();
    }, 40000 + Math.random() * 40000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [addNotification, isPremium]);

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
            className="relative rounded-xl border border-primary/20 bg-card/95 backdrop-blur-lg p-3 pr-8 shadow-lg shadow-primary/5"
          >
            <button
              onClick={() => dismiss(n.id)}
              className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Link to={n.link} onClick={() => dismiss(n.id)} className="flex items-start gap-2.5">
              <span className="mt-0.5 text-primary shrink-0">{n.icon}</span>
              <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
