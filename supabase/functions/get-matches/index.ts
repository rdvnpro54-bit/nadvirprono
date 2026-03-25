import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prediction fields to strip for non-premium
const PRED_FIELDS_TO_STRIP = [
  "pred_home_win",
  "pred_draw",
  "pred_away_win",
  "pred_score_home",
  "pred_score_away",
  "pred_over_under",
  "pred_over_prob",
  "pred_btts_prob",
  "pred_value_bet",
  "pred_confidence",
  "pred_analysis",
] as const;

function stripPredictions(match: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...match };
  for (const field of PRED_FIELDS_TO_STRIP) {
    stripped[field] = null;
  }
  // Override confidence to a generic value
  stripped.pred_confidence = "LOCKED";
  return stripped;
}

/**
 * Determine the 3 free matches of the day:
 * Prefer 1 football + 1 tennis + 1 basketball.
 * Falls back to any available sport.
 */
function pickFreeMatches(matches: Record<string, unknown>[]): Set<string> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Only today's matches
  const todayMatches = matches.filter(
    (m) => (m.kickoff as string) >= todayStart && (m.kickoff as string) < tomorrowStart
  );

  const pool = todayMatches.length > 0 ? todayMatches : matches.slice(0, 10);

  const sportOrder = ["football", "tennis", "basketball"];
  const picked: string[] = [];
  const usedIds = new Set<string>();

  // 1st pass: one per sport
  for (const sport of sportOrder) {
    const match = pool.find(
      (m) => (m.sport as string)?.toLowerCase() === sport && !usedIds.has(m.id as string)
    );
    if (match) {
      picked.push(match.id as string);
      usedIds.add(match.id as string);
    }
  }

  // 2nd pass: fill to 3
  if (picked.length < 3) {
    for (const m of pool) {
      if (picked.length >= 3) break;
      if (!usedIds.has(m.id as string)) {
        picked.push(m.id as string);
        usedIds.add(m.id as string);
      }
    }
  }

  return new Set(picked.slice(0, 3));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Check if user is authenticated + premium
    let isPremium = false;
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;

        // Check subscription
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("is_premium, expires_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (sub?.is_premium) {
          // Check expiration
          if (!sub.expires_at || new Date(sub.expires_at) > new Date()) {
            isPremium = true;
          }
        }

        // Admin is always premium
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) isPremium = true;
      }
    }

    // Parse query params
    const url = new URL(req.url);
    const matchId = url.searchParams.get("id"); // single match detail

    const adminClient = createClient(supabaseUrl, serviceKey);

    if (matchId) {
      // Single match detail
      const { data: match, error } = await adminClient
        .from("cached_matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error || !match) {
        return new Response(JSON.stringify({ error: "Match not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For single match: only premium can see predictions
      // Unless it's one of today's free matches
      if (!isPremium) {
        const allMatches = await adminClient
          .from("cached_matches")
          .select("id, sport, kickoff")
          .order("kickoff", { ascending: true });

        const freeIds = pickFreeMatches((allMatches.data || []) as Record<string, unknown>[]);
        
        if (!freeIds.has(matchId)) {
          return new Response(
            JSON.stringify(stripPredictions(match as Record<string, unknown>)),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(JSON.stringify(match), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All matches list
    const { data: matches, error } = await adminClient
      .from("cached_matches")
      .select("*")
      .order("kickoff", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allMatches = (matches || []) as Record<string, unknown>[];

    if (isPremium) {
      // Premium: full data
      return new Response(JSON.stringify(allMatches), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-premium: strip predictions except 3 free matches
    const freeIds = pickFreeMatches(allMatches);

    const result = allMatches.map((m) => {
      if (freeIds.has(m.id as string)) {
        return { ...m, is_free: true };
      }
      return { ...stripPredictions(m), is_free: false };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-matches error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
