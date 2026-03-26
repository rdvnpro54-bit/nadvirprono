import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRED_FIELDS_TO_STRIP = [
  "pred_home_win", "pred_draw", "pred_away_win",
  "pred_score_home", "pred_score_away",
  "pred_over_under", "pred_over_prob", "pred_btts_prob",
  "pred_value_bet", "pred_confidence", "pred_analysis",
] as const;

// ═══════════════════════════════════════════════════════
// DETERMINISTIC DAILY SELECTIONS — SAME FOR ALL USERS
// ═══════════════════════════════════════════════════════

function getParisDayBounds() {
  const now = new Date();
  const parisDate = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const [year, month, day] = parisDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day - 1, 23, 0, 0)).toISOString();
  const end = new Date(Date.UTC(year, month - 1, day, 23, 0, 0)).toISOString();
  return { start, end, dateKey: parisDate };
}

/** Deterministic hash from date string — same for every user */
function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h) + dateStr.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getConfidenceRank(confidence: unknown): number {
  const n = String(confidence || "").toUpperCase();
  if (n === "SAFE") return 3;
  if (n === "MODÉRÉ" || n === "MODERE") return 2;
  if (n === "RISQUÉ" || n === "RISQUE" || n === "RISK") return 1;
  return 0;
}

function getPredictionStrength(m: Record<string, unknown>): number {
  return Math.max(Number(m.pred_home_win ?? 0), Number(m.pred_away_win ?? 0), Number(m.pred_draw ?? 0));
}

function stripPredictions(match: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...match };
  for (const field of PRED_FIELDS_TO_STRIP) stripped[field] = null;
  stripped.pred_confidence = "LOCKED";
  return stripped;
}

/**
 * Pick exactly 2 FREE matches (most SAFE, highest confidence).
 * Uses ALL matches with predictions (non-LOCKED in DB).
 * If only 1 has predictions, pick 1. Top pick is excluded after.
 */
function pickTop2Free(matches: Record<string, unknown>[], dateKey: string): Set<string> {
  const { start, end } = getParisDayBounds();
  
  // Get matches with actual predictions (non-null confidence that isn't LOCKED)
  const withPredictions = matches.filter(m => {
    const conf = String(m.pred_confidence || "").toUpperCase();
    return conf !== "LOCKED" && conf !== "" && m.pred_home_win != null;
  });

  // Prefer today's matches, fallback to all with predictions
  const todayPool = withPredictions.filter(m => {
    const k = String(m.kickoff || "");
    return k >= start && k < end;
  });

  const pool = todayPool.length >= 2 ? todayPool : withPredictions;

  // Sort: SAFE first → highest prediction → highest ai_score → stable id sort
  const sorted = [...pool].sort((a, b) => {
    const cr = getConfidenceRank(b.pred_confidence) - getConfidenceRank(a.pred_confidence);
    if (cr !== 0) return cr;
    const ps = getPredictionStrength(b) - getPredictionStrength(a);
    if (ps !== 0) return ps;
    const ai = (Number(b.ai_score) || 0) - (Number(a.ai_score) || 0);
    if (ai !== 0) return ai;
    return String(a.id).localeCompare(String(b.id));
  });

  return new Set(sorted.slice(0, 2).map(m => String(m.id)));
}

/**
 * Pick exactly 1 TOP PICK (most RISQUÉ, highest ai_score).
 * Deterministic: uses date hash for stable rotation among top candidates.
 */
function pickTopPick(matches: Record<string, unknown>[], excludeIds: Set<string>, dateKey: string): string | null {
  const { start, end } = getParisDayBounds();
  const pool = matches.filter(m => {
    const k = String(m.kickoff || "");
    const conf = String(m.pred_confidence || "").toUpperCase();
    return k >= start && k < end && !excludeIds.has(String(m.id)) && conf !== "LOCKED" && conf !== "";
  });

  if (pool.length === 0) return null;

  // Prioritize RISQUÉ → MODÉRÉ → SAFE
  const risque = pool.filter(m => getConfidenceRank(m.pred_confidence) === 1);
  const modere = pool.filter(m => getConfidenceRank(m.pred_confidence) === 2);
  const safe = pool.filter(m => getConfidenceRank(m.pred_confidence) === 3);
  const candidates = risque.length > 0 ? risque : modere.length > 0 ? modere : safe;

  // Sort by ai_score desc → id for determinism
  const sorted = [...candidates].sort((a, b) => {
    const ai = (Number(b.ai_score) || 0) - (Number(a.ai_score) || 0);
    if (ai !== 0) return ai;
    return String(a.id).localeCompare(String(b.id));
  });

  // Use date hash for stable pick among top 3 candidates
  const top = sorted.slice(0, Math.min(3, sorted.length));
  const seed = hashDate(dateKey);
  return String(top[seed % top.length].id);
}

// ═══════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    let isPremium = false;
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
        const adminClient = createClient(supabaseUrl, serviceKey);

        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("is_premium, expires_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (sub?.is_premium && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
          isPremium = true;
        }

        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) isPremium = true;
      }
    }

    const url = new URL(req.url);
    const matchId = url.searchParams.get("id");
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { dateKey } = getParisDayBounds();

    // ─── SINGLE MATCH DETAIL ───
    if (matchId) {
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

      if (isPremium) {
        return new Response(JSON.stringify({ ...match, is_top_pick: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if this match is one of the daily free/top picks
      const { data: allIds } = await adminClient
        .from("cached_matches")
        .select("id, sport, kickoff, pred_confidence, pred_home_win, pred_away_win, pred_draw, ai_score")
        .order("kickoff", { ascending: true });

      const all = (allIds || []) as Record<string, unknown>[];
      const freeIds = new Set(pickTop2Free(all, dateKey));
      const topPickId = pickTopPick(all, freeIds, dateKey);

      if (freeIds.has(matchId) || topPickId === matchId) {
        return new Response(JSON.stringify({ ...match, is_free: freeIds.has(matchId), is_top_pick: topPickId === matchId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ...stripPredictions(match as Record<string, unknown>), is_top_pick: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ALL MATCHES LIST ───
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
    const freeIds = pickTop2Free(allMatches, dateKey);
    const topPickId = pickTopPick(allMatches, freeIds, dateKey);

    console.log(`[get-matches] dateKey=${dateKey}, total=${allMatches.length}, freeIds=${JSON.stringify([...freeIds])}, topPickId=${topPickId}`);
    console.log(`[get-matches] matches with predictions: ${allMatches.filter(m => m.pred_home_win != null).length}`);

    if (isPremium) {
      return new Response(JSON.stringify(allMatches.map(m => ({
        ...m,
        is_free: freeIds.has(String(m.id)),
        is_top_pick: topPickId === String(m.id),
      }))), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-premium: show predictions only for free + top pick
    const result = allMatches.map(m => {
      const id = String(m.id);
      const isFree = freeIds.has(id);
      const isTopPick = topPickId === id;

      if (isFree || isTopPick) {
        return { ...m, is_free: isFree, is_top_pick: isTopPick };
      }
      return { ...stripPredictions(m), is_free: false, is_top_pick: false };
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
