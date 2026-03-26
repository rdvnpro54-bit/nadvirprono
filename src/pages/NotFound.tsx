import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated bg */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-destructive/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <motion.div 
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.h1 
          className="mb-2 text-7xl font-bold font-display gradient-text"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.h1>
        <p className="mb-4 text-lg text-muted-foreground">Page introuvable</p>
        <p className="mb-6 text-sm text-muted-foreground/70 max-w-xs mx-auto">
          La page que tu cherches n'existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button className="gap-2 btn-shimmer">
              <Home className="h-4 w-4" /> Accueil
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
