import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
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
  isPremiumPlus: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: (currentSession?: Session | null) => Promise<SubscriptionState>;
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
    priceId: "price_1TFrA8GpVYXx1jPPT53PB4nL",
    productId: "prod_UEJnPE6H6BG45p",
    label: "Hebdo",
    price: "4,99€/sem",
  },
  monthly: {
    priceId: "price_1TFrAsGpVYXx1jPPDUM9x2nk",
    productId: "prod_UEJoKqDz91r89k",
    label: "Mensuel",
    price: "12,99€/mois",
  },
  premiumPlusWeekly: {
    priceId: "price_1TFrBoGpVYXx1jPPoIzae5vm",
    productId: "prod_UEJp3TBa1RECPD",
    label: "Premium+ Hebdo",
    price: "9,99€/sem",
  },
  premiumPlusMonthly: {
    priceId: "price_1TFrClGpVYXx1jPPZwOi8qA7",
    productId: "prod_UEJqF0K4vVqUMF",
    label: "Premium+ Mensuel",
    price: "24,99€/mois",
  },
} as const;

const PREMIUM_PLUS_PRODUCT_IDS = [
  STRIPE_PLANS.premiumPlusWeekly.productId,
  STRIPE_PLANS.premiumPlusMonthly.productId,
  // Legacy product IDs for existing subscribers
  "prod_UDq3Yi5NV5UBwi",
  "prod_UDq3gv6WVIiSIn",
  // Manual premium plus (admin-activated)
  "manual_premium_plus",
] as const;

const DEFAULT_SUB: SubscriptionState = { subscribed: false, productId: null, subscriptionEnd: null, isAdmin: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUB);
  const initialSyncDoneRef = useRef(false);

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

      console.log("[AUTH] check-subscription response:", { data, error });

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

    const syncAuthState = async (currentSession: Session | null, isInitialSync = false) => {
      if (!isMounted) return;

      if (isInitialSync && !initialSyncDoneRef.current) {
        setLoading(true);
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      try {
        if (currentSession?.user) {
          await checkSubscription(currentSession);
        } else {
          setSubscription(DEFAULT_SUB);
        }
      } catch (err) {
        console.error("syncAuthState error:", err);
        setSubscription(DEFAULT_SUB);
      } finally {
        if (isMounted) {
          initialSyncDoneRef.current = true;
          setLoading(false);
        }
      }
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        void syncAuthState(newSession, false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void syncAuthState(s, true);
    });

    const interval = setInterval(() => {
      void checkSubscription();
    }, 60000);

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
  const isPremiumPlus = subscription.subscribed && (
    PREMIUM_PLUS_PRODUCT_IDS.includes(subscription.productId as any) || subscription.isAdmin
  );
  const isAdmin = subscription.isAdmin;

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, isPremium, isMonthlyPremium, isPremiumPlus, isAdmin, signUp, signIn, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
