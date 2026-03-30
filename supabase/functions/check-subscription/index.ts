import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[CHECK-SUB] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    log("User", { id: user.id, email: user.email });

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;
    log("Admin check", { isAdmin });

    // Check manual premium in subscriptions table
    const { data: subData, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("is_premium, plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    log("Sub query", { subData, subError: subError?.message || null });

    const now = new Date();
    const manualPremium = subData?.is_premium === true &&
      (!subData.expires_at || new Date(subData.expires_at) > now);

    log("Manual premium", { manualPremium, isPremium: subData?.is_premium, expiresAt: subData?.expires_at, now: now.toISOString() });

    // Determine plan tier for manual premium
    const plan = subData?.plan || "premium";
    const isManualPremiumPlus = plan.includes("premium_plus");

    // If admin or manual premium, return subscribed immediately
    if (isAdmin || manualPremium) {
      const result = {
        subscribed: true,
        is_admin: isAdmin,
        product_id: manualPremium
          ? (isManualPremiumPlus ? "manual_premium_plus" : "manual_premium")
          : "admin",
        subscription_end: subData?.expires_at || null,
        plan: plan,
        is_premium_plus: isAdmin || isManualPremiumPlus,
      };
      log("Returning manual/admin", result);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe subscription
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("No Stripe key");
      return new Response(JSON.stringify({ subscribed: false, is_admin: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      log("No Stripe customer");
      return new Response(JSON.stringify({ subscribed: false, is_admin: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const sub = subscriptions.data[0];
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      productId = sub.items.data[0].price.product;
    }

    log("Stripe result", { hasActiveSub, productId });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      is_admin: false,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
