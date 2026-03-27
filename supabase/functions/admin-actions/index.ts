import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "rdvnpro54@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CRITICAL: Verify admin role server-side
    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Double-check role in database
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Not an admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── GET DASHBOARD STATS ──────────────────────────────────
    if (action === "dashboard") {
      const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
      if (usersErr) throw usersErr;

      const totalUsers = users?.users?.length || 0;

      const { data: subs } = await supabase.from("subscriptions").select("*");
      const premiumCount = subs?.filter((s: any) => s.is_premium && (!s.expires_at || new Date(s.expires_at) > new Date())).length || 0;

      const { count: matchCount } = await supabase
        .from("cached_matches")
        .select("*", { count: "exact", head: true });

      const { data: meta } = await supabase
        .from("cache_metadata")
        .select("*")
        .eq("id", "api_football")
        .single();

      const { data: logs } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({
        totalUsers,
        premiumCount,
        conversionRate: totalUsers > 0 ? Math.round((premiumCount / totalUsers) * 100) : 0,
        matchCount: matchCount || 0,
        apiStatus: meta ? {
          lastFetch: meta.last_fetched_at,
          requestsToday: meta.request_count_today,
          lastResetDate: meta.last_reset_date,
        } : null,
        logs: logs || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── LIST USERS WITH SUBSCRIPTIONS ────────────────────────
    if (action === "list-users") {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const { data: subs } = await supabase.from("subscriptions").select("*");

      const subsMap = new Map((subs || []).map((s: any) => [s.user_id, s]));

      const userList = (authUsers?.users || []).map((u: any) => {
        const sub = subsMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          is_premium: sub?.is_premium || false,
          plan: sub?.plan || "free",
          expires_at: sub?.expires_at || null,
        };
      });

      return new Response(JSON.stringify({ users: userList }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── FORCE REFRESH PREDICTIONS ────────────────────────────
    if (action === "force-refresh") {
      console.log("[ADMIN] Force refresh triggered by", user.email);

      // 1. Delete ALL existing cached matches to force fresh data
      const { error: delErr } = await supabase.from("cached_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) console.error("Delete error:", delErr);

      // 2. Reset cache metadata to force re-fetch
      await supabase.from("cache_metadata").upsert({
        id: "api_football",
        last_fetched_at: new Date(0).toISOString(), // epoch = force re-fetch
        request_count_today: 0,
        last_reset_date: new Date().toISOString().split("T")[0],
      });

      // 3. Trigger fetch-matches to get fresh data
      const fetchUrl = `${supabaseUrl}/functions/v1/fetch-matches`;
      const fetchRes = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
      });
      const fetchData = await fetchRes.json();

      // 4. Log the action
      await supabase.from("admin_logs").insert({
        action: "force_refresh",
        details: { result: fetchData },
        admin_email: user.email!,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Pronostics rafraîchis avec succès",
        ...fetchData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTIVATE PREMIUM ─────────────────────────────────────
    if (action === "activate-premium") {
      const { email, duration, tier } = body;
      if (!email || !duration) {
        return new Response(JSON.stringify({ error: "email and duration required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers?.users?.find((u: any) => u.email === email);

      if (!targetUser) {
        return new Response(JSON.stringify({ error: `User ${email} not found` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const days = duration === "weekly" ? 7 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const isPremiumPlus = tier === "premium_plus";
      const planLabel = isPremiumPlus
        ? (duration === "weekly" ? "premium_plus_hebdo" : "premium_plus_mensuel")
        : (duration === "weekly" ? "hebdo" : "mensuel");

      const { error: upsertErr } = await supabase.from("subscriptions").upsert({
        user_id: targetUser.id,
        email: targetUser.email,
        is_premium: true,
        plan: planLabel,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        activated_by: "admin:" + user.email,
      }, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      await supabase.from("admin_logs").insert({
        action: "activate_premium",
        details: { target_email: email, duration, tier: tier || "premium", expires_at: expiresAt.toISOString() },
        admin_email: user.email!,
      });

      return new Response(JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DEACTIVATE PREMIUM ───────────────────────────────────
    if (action === "deactivate-premium") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers?.users?.find((u: any) => u.email === email);

      if (!targetUser) {
        return new Response(JSON.stringify({ error: `User ${email} not found` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase.from("subscriptions").upsert({
        user_id: targetUser.id,
        email: targetUser.email,
        is_premium: false,
        plan: "free",
        expires_at: null,
        updated_at: new Date().toISOString(),
        activated_by: null,
      }, { onConflict: "user_id" });

      if (updateErr) throw updateErr;

      await supabase.from("admin_logs").insert({
        action: "deactivate_premium",
        details: { target_email: email },
        admin_email: user.email!,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── LIST MATCH RESULTS ──────────────────────────────────
    if (action === "list-results") {
      const { data: results, error: resErr } = await supabase
        .from("match_results")
        .select("*")
        .order("kickoff", { ascending: false })
        .limit(100);

      if (resErr) throw resErr;

      return new Response(JSON.stringify({ results: results || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── UPDATE MATCH RESULT ──────────────────────────────────
    if (action === "update-result") {
      const { matchId, newResult } = body;
      if (!matchId || !newResult) {
        return new Response(JSON.stringify({ error: "matchId and newResult required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase
        .from("match_results")
        .update({ result: newResult })
        .eq("id", matchId);

      if (updateErr) throw updateErr;

      await supabase.from("admin_logs").insert({
        action: "update_result",
        details: { match_id: matchId, new_result: newResult },
        admin_email: user.email!,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Admin error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
