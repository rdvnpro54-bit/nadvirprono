import { Link, useLocation } from "react-router-dom";
import { Home, Search, Star, User, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const desktopNav = [
  { label: "Accueil", path: "/" },
  { label: "Analyse", path: "/matches" },
  { label: "Résultats", path: "/resultats" },
  { label: "Suivis", path: "/suivis" },
  { label: "Premium", path: "/pricing" },
];

const mobileNav = [
  { label: "Accueil", path: "/", icon: Home },
  { label: "Analyse", path: "/matches", icon: Search },
  { label: "Résultats", path: "/resultats", icon: BarChart3 },
  { label: "Suivis", path: "/suivis", icon: Star },
  { label: "Compte", path: "/compte", icon: User },
];

export function Navbar() {
  const location = useLocation();
  const { user, isPremium, isPremiumPlus, isAdmin } = useAuth();

  return (
    <>
      {/* Desktop top navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass-navbar pt-[env(safe-area-inset-top)]"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden"
              whileHover={{ rotate: 10, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img src="/pronosia-p-logo.png" alt="Pronosia logo" className="h-full w-full object-cover" />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight gradient-text-animated">
              Pronosia
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {desktopNav.map((item, i) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-[1px] left-2 right-2 h-0.5 rounded-full"
                        layoutId="navbar-indicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ background: "linear-gradient(90deg, hsl(45 100% 50%), hsl(38 80% 45%))" }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {isAdmin ? (
                  <Link to="/admin" reloadDocument>
                    <motion.span
                      className="inline-flex items-center gap-1 rounded-full badge-elite px-2.5 py-0.5 text-[10px] font-bold cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Shield className="h-3 w-3" /> ADMIN
                    </motion.span>
                  </Link>
                ) : isPremium ? (
                  <span className="rounded-full badge-elite px-2.5 py-0.5 text-[10px] font-bold">
                    {isPremiumPlus ? "PREMIUM+" : "PREMIUM"}
                  </span>
                ) : null}
                <Link to="/compte">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 hover:bg-muted/20">
                    <User className="h-3.5 w-3.5" /> Compte
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/20">Connexion</Button>
                </Link>
                <Link to="/pricing">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="gap-1.5 text-xs btn-shimmer btn-glow">
                      <Zap className="h-3.5 w-3.5" /> Premium
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile bottom navbar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 glass-navbar md:hidden"
        style={{ borderTop: "1px solid rgba(255, 215, 0, 0.08)", borderBottom: "none" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center justify-around py-1.5 pb-[env(safe-area-inset-bottom)]">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive && "text-primary drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]")} />
                </motion.div>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 left-1/2 h-0.5 w-5 rounded-full"
                    layoutId="mobile-indicator"
                    style={{
                      x: "-50%",
                      background: "linear-gradient(90deg, hsl(45 100% 50%), hsl(38 80% 45%))",
                      boxShadow: "0 0 8px rgba(255,215,0,0.4)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
