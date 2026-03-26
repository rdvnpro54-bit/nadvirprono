import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionState;
  isPremium: boolean;
  isMonthlyPremium: boolean;
  isAdmin: boolean;
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

const DEFAULT_SUB: SubscriptionState = { subscribed: false, productId: null, subscriptionEnd: null, isAdmin: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUB);

  const checkSubscription = useCallback(async (currentSession?: Session | null) => {
    try {
      const sessionToUse = currentSession ?? (await supabase.auth.getSession()).data.session;
      if (!sessionToUse) {
        setSubscription(DEFAULT_SUB);
        return DEFAULT_SUB;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${sessionToUse.access_token}` },
      });

      if (error) {
        console.error("Check subscription error:", error);
        setSubscription(DEFAULT_SUB);
        return DEFAULT_SUB;
      }

      const nextSubscription = {
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
        isAdmin: data?.is_admin || false,
      };

      setSubscription(nextSubscription);
      return nextSubscription;
    } catch (err) {
      console.error("Subscription check failed:", err);
      setSubscription(DEFAULT_SUB);
      return DEFAULT_SUB;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (currentSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await checkSubscription(currentSession);
      } else {
        setSubscription(DEFAULT_SUB);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await syncAuthState(newSession);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await syncAuthState(s);
    });

    const interval = setInterval(() => checkSubscription(), 60000);

    return () => {
      isMounted = false;
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
    setSubscription(DEFAULT_SUB);
  };

  const isPremium = subscription.subscribed;
  const isMonthlyPremium = subscription.subscribed && subscription.productId === STRIPE_PLANS.monthly.productId;
  const isAdmin = subscription.isAdmin;

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, isPremium, isMonthlyPremium, isAdmin, signUp, signIn, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
