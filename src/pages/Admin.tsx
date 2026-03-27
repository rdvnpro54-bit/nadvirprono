import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Navigate } from "react-router-dom";
import { AdminPanelContent } from "@/components/admin/AdminPanelContent";

const ADMIN_EMAIL = "rdvnpro54@gmail.com";

export default function Admin() {
  const { user, session, loading: authLoading, isAdmin } = useAuth();
  const isAllowedAdmin = !!user && !!session && isAdmin && user.email === ADMIN_EMAIL;

  if (authLoading || (user?.email === ADMIN_EMAIL && !isAllowedAdmin)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-20 w-64 h-64 rounded-full bg-destructive/5 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Shield icon with pulse */}
        <motion.div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Shield className="h-10 w-10 text-primary relative z-10" />
        </motion.div>

        {/* Text */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-lg font-bold">Vérification Admin</h2>
          <p className="text-xs text-muted-foreground mt-1">Contrôle des droits d'accès en cours…</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="relative z-10 w-48 h-1 rounded-full bg-muted overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.div>
      </div>
    );
  }

  if (!isAllowedAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container pt-20 px-3 sm:px-4">
        <AdminPanelContent />
      </div>
    </div>
  );
}
