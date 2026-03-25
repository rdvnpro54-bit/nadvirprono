import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        logStep("ERROR", { message: "Missing stripe-signature header" });
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        logStep("ERROR", { message: `Signature verification failed: ${err}` });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // No webhook secret — parse event directly (dev mode)
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING: No STRIPE_WEBHOOK_SECRET set, skipping signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const customerEmail = session.customer_email || session.customer_details?.email;
        logStep("Checkout completed", { customerEmail, subscriptionId: session.subscription });

        if (!customerEmail) {
          logStep("ERROR", { message: "No customer email in session" });
          break;
        }

        // Get subscription details from Stripe
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const productId = subscription.items.data[0]?.price?.product as string;
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

          // Determine plan name
          let planName = "premium";
          if (productId === "prod_UD5hQvXfBtn5ZP") planName = "weekly";
          else if (productId === "prod_UD5hiOayA1AIxl") planName = "monthly";

          // Update subscription in DB
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              is_premium: true,
              plan: planName,
              expires_at: periodEnd,
              activated_by: "stripe",
              updated_at: new Date().toISOString(),
            })
            .eq("email", customerEmail);

          if (updateError) {
            logStep("ERROR updating subscription", { error: updateError.message, email: customerEmail });
          } else {
            logStep("Subscription activated", { email: customerEmail, plan: planName, expiresAt: periodEnd });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;
        logStep("Subscription updated", { customerId, status });

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (!email) {
          logStep("ERROR", { message: "No email for customer" });
          break;
        }

        const isActive = status === "active" || status === "trialing";
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            is_premium: isActive,
            expires_at: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);

        if (error) {
          logStep("ERROR updating subscription", { error: error.message });
        } else {
          logStep("Subscription status updated", { email, isActive, periodEnd });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        logStep("Subscription deleted", { customerId });

        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (email) {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              is_premium: false,
              plan: "free",
              expires_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);

          if (error) {
            logStep("ERROR deactivating subscription", { error: error.message });
          } else {
            logStep("Subscription deactivated", { email });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        logStep("Payment failed", { customerEmail: invoice.customer_email });
        // Could send notification email here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
