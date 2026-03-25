import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityProvider } from "@/components/home/ActivityProvider";
import { SmartNotifications } from "@/components/home/SmartNotifications";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Suivis from "./pages/Suivis";
import Compte from "./pages/Compte";
import Admin from "./pages/Admin";
import Success from "./pages/Success";

const queryClient = new QueryClient();

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
        <Route path="/matches" element={<PageWrapper><Matches /></PageWrapper>} />
        <Route path="/match/:id" element={<PageWrapper><MatchDetail /></PageWrapper>} />
        <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/suivis" element={<PageWrapper><Suivis /></PageWrapper>} />
        <Route path="/compte" element={<PageWrapper><Compte /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ActivityProvider>
            <AnimatedRoutes />
            <SmartNotifications />
          </ActivityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
