import { Link, useLocation } from "react-router-dom";
import { Home, Search, Star, User, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopNav = [
  { label: "Accueil", path: "/" },
  { label: "Analyse", path: "/matches" },
  { label: "Suivis", path: "/suivis" },
  { label: "Premium", path: "/pricing" },
];

const mobileNav = [
  { label: "Accueil", path: "/", icon: Home },
  { label: "Suivis", path: "/suivis", icon: Star },
  { label: "Recherche", path: "/matches", icon: Search },
  { label: "Compte", path: "/compte", icon: User },
];

export function Navbar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <span className="text-lg font-bold text-primary">P</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Pronosia
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {desktopNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">Connexion</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" /> Premium
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
