import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, ChevronDown, PlusSquare } from "lucide-react";

const STORAGE_KEY = "pronosia_ios_install_shown";

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  const isStandalone = ("standalone" in navigator && (navigator as any).standalone) || window.matchMedia("(display-mode: standalone)").matches;
  return isIOS && isSafari && !isStandalone;
}

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

          {/* Popup */}
          <motion.div
            className="relative w-full max-w-[360px] rounded-2xl border border-primary/20 bg-[hsl(var(--card))] shadow-2xl overflow-hidden"
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 rounded-full bg-muted/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-lg font-bold text-primary">P</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Installer Pronosia</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Accédez à vos pronostics en un clic depuis votre écran d'accueil
              </p>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-center gap-3 px-5 pb-3">
              <Step number={1} icon={<Share className="h-3.5 w-3.5" />} label="Partager" />
              <ChevronArrow />
              <Step number={2} icon={<ChevronDown className="h-3.5 w-3.5" />} label="Descendre" />
              <ChevronArrow />
              <Step number={3} icon={<PlusSquare className="h-3.5 w-3.5" />} label="Ajouter" highlight />
            </div>

            {/* GIF */}
            <div className="mx-5 mb-4 overflow-hidden rounded-xl border border-border/50 bg-black/20">
              <img
                src="/images/ios-install-tutorial.gif"
                alt="Tutoriel d'installation sur iPhone"
                className="w-full h-auto"
                loading="lazy"
              />
              {/* Highlight overlay for "Sur l'écran d'accueil" */}
              <div className="relative -mt-1">
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/10 to-transparent h-8 pointer-events-none" />
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <button
                onClick={dismiss}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                ✅ J'ai compris, installer l'app
              </button>
              <button
                onClick={dismiss}
                className="mt-2 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ number, icon, label, highlight }: { number: number; icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
        highlight
          ? "bg-primary/20 border border-primary/40 text-primary ring-2 ring-primary/20"
          : "bg-muted/50 border border-border/50"
      }`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

function ChevronArrow() {
  return (
    <div className="text-muted-foreground/40 mt-[-10px]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
