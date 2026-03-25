import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks user presence via Supabase Realtime Presence.
 * Admin can subscribe to this channel to see who's online.
 */
export function usePresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const channel = supabase.channel("admin-presence-viewer", {
      config: { presence: { key: user?.id || `anon-${Math.random().toString(36).slice(2, 8)}` } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          email: user?.email || "Visiteur anonyme",
          page: location.pathname,
          joined_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email, location.pathname]);
}
