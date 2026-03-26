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
  const { user, isPremium, isAdmin } = useAuth();

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20"
              whileHover={{ rotate: 10, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-lg font-bold text-primary">P</span>
            </motion.div>
            <motion.span
              className="font-display text-lg font-bold tracking-tight"
              whileHover={{ scale: 1.03 }}
            >
              Pronosia
            </motion.span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {desktopNav.map((item, i) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full"
                        layoutId="navbar-indicator"
                        style={{ x: "-50%", width: "60%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                  <Link to="/admin">
                    <motion.span
                      className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 8px 2px hsl(var(--primary) / 0.3)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Shield className="h-3 w-3" /> ADMIN
                    </motion.span>
                  </Link>
                ) : isPremium ? (
                  <motion.span
                    className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    PREMIUM
                  </motion.span>
                ) : null}
                <Link to="/compte">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                    <User className="h-3.5 w-3.5" /> Compte
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">Connexion</Button>
                </Link>
                <Link to="/pricing">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="gap-1.5 text-xs btn-shimmer">
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
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  animate={isActive ? { y: [0, -2, 0] } : {}}
                  transition={isActive ? { duration: 0.4 } : { type: "spring" }}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                </motion.div>
                {item.label}
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 left-1/2 h-0.5 w-6 bg-primary rounded-full"
                    layoutId="mobile-indicator"
                    style={{ x: "-50%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
