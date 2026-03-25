import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionState;
  isPremium: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Stripe product/price mapping
export const STRIPE_PLANS = {
  weekly: {
    priceId: "price_1TEfW8GpVYXx1jPP4nqduS4K",
    productId: "prod_UD5hQvXfBtn5ZP",
    label: "Hebdo",
    price: "9,90€/sem",
  },
  monthly: {
    priceId: "price_1TEfWRGpVYXx1jPP2MZtlapj",
    productId: "prod_UD5hiOayA1AIxl",
    label: "Mensuel",
    price: "29,90€/mois",
  },
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (error) {
        console.error("Check subscription error:", error);
        return;
      }

      setSubscription({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
      });
    } catch (err) {
      console.error("Subscription check failed:", err);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          // Defer subscription check to avoid deadlock
          setTimeout(() => checkSubscription(), 0);
        } else {
          setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) checkSubscription();
    });

    // Auto-refresh subscription every 60s
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => {
      authSub.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription({ subscribed: false, productId: null, subscriptionEnd: null });
  };

  const isPremium = subscription.subscribed;

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, isPremium, signUp, signIn, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
