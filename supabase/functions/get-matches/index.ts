import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRED_FIELDS_TO_STRIP = [
  "pred_home_win", "pred_draw", "pred_away_win",
  "pred_over_under", "pred_over_prob", "pred_btts_prob",
  "pred_value_bet", "pred_confidence", "pred_analysis",
] as const;

const SCORE_FIELDS_TO_STRIP = [
  "pred_score_home", "pred_score_away",
] as const;

// Detailed anomaly fields stripped for non-Premium+ (but anomaly_label kept for ALL)
const ANOMALY_DETAIL_FIELDS = [
  "anomaly_score", "anomaly_reason",
] as const;

// Premium+ product IDs
const PREMIUM_PLUS_PRODUCTS = [
  "prod_UDq3Yi5NV5UBwi", // Premium+ Hebdo
  "prod_UDq3gv6WVIiSIn", // Premium+ Mensuel
];

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
] as const;

const SPORT_DURATIONS_MINUTES: Record<string, number> = {
  football: 120,
  tennis: 150,
  basketball: 150,
  hockey: 150,
  baseball: 210,
  nfl: 210,
  mma: 180,
  f1: 150,
  afl: 150,
  rugby: 120,
};

// ═══════════════════════════════════════════════════════
// DETERMINISTIC DAILY SELECTIONS — SAME FOR ALL USERS
// ═══════════════════════════════════════════════════════

function getParisDayBounds(): { startMs: number; endMs: number; dateKey: string } {
  const now = new Date();
  const parisDate = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const [year, month, day] = parisDate.split("-").map(Number);
  const startMs = Date.UTC(year, month - 1, day - 1, 23, 0, 0);
  const endMs = Date.UTC(year, month - 1, day, 23, 0, 0);
  return { startMs, endMs, dateKey: parisDate };
}

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

function getKickoffMs(m: Record<string, unknown>): number {
  return new Date(String(m.kickoff || "")).getTime();
}

function hasPredictions(m: Record<string, unknown>): boolean {
  const conf = String(m.pred_confidence || "").toUpperCase();
  return conf !== "LOCKED" && conf !== "" && m.pred_home_win != null;
}

function isFinishedMatch(match: Record<string, unknown>): boolean {
  const status = String(match.status || "").toUpperCase();
  if (FINISHED_STATUSES.includes(status as (typeof FINISHED_STATUSES)[number])) return true;
  if (match.home_score != null && match.away_score != null) return true;
  const kickoffMs = new Date(String(match.kickoff || "")).getTime();
  if (Number.isFinite(kickoffMs)) {
    const sport = String(match.sport || "football").toLowerCase();
    const durationMinutes = SPORT_DURATIONS_MINUTES[sport] || 120;
    if (Date.now() > kickoffMs + durationMinutes * 60 * 1000) return true;
  }
  return false;
}

function stripPredictions(match: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...match };
  for (const field of PRED_FIELDS_TO_STRIP) stripped[field] = null;
  for (const field of SCORE_FIELDS_TO_STRIP) stripped[field] = null;
  for (const field of ANOMALY_DETAIL_FIELDS) stripped[field] = null;
  // Keep anomaly_label visible
  stripped.pred_confidence = "LOCKED";
  return stripped;
}

function stripAnomalyDetails(match: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...match };
  for (const field of ANOMALY_DETAIL_FIELDS) {
    stripped[field] = null;
  }
  // Keep anomaly_label visible for ALL users (public badge)
  return stripped;
}

function stripScoresOnly(match: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...match };
  for (const field of SCORE_FIELDS_TO_STRIP) stripped[field] = null;
  return stripped;
}

/**
 * Pick exactly 2 FREE matches (most SAFE, highest confidence).
 * Deterministic and identical for ALL users.
 */
function pickTop2Free(matches: Record<string, unknown>[]): Set<string> {
  const { startMs, endMs } = getParisDayBounds();

  const withPreds = matches.filter(m => hasPredictions(m));

  // Prefer today's matches
  const todayPool = withPreds.filter(m => {
    const k = getKickoffMs(m);
    return k >= startMs && k < endMs;
  });

  const pool = todayPool.length >= 2 ? todayPool : withPreds;

  // Sort: SAFE first → highest prediction → highest ai_score → id
  const sorted = [...pool].sort((a, b) => {
    const cr = getConfidenceRank(b.pred_confidence) - getConfidenceRank(a.pred_confidence);
    if (cr !== 0) return cr;
    const ps = getPredictionStrength(b) - getPredictionStrength(a);
    if (ps !== 0) return ps;
    const ai = (Number(b.ai_score) || 0) - (Number(a.ai_score) || 0);
    if (ai !== 0) return ai;
    return String(a.id).localeCompare(String(b.id));
  });

  const result = new Set(sorted.slice(0, 2).map(m => String(m.id)));
  console.log(`[pickTop2Free] pool=${pool.length}, result=[${[...result].join(", ")}]`);
  return result;
}

/**
 * Pick exactly 1 TOP PICK (most RISQUÉ, highest ai_score).
 */
function pickTopPick(matches: Record<string, unknown>[], excludeIds: Set<string>): string | null {
  const { startMs, endMs, dateKey } = getParisDayBounds();

  const pool = matches.filter(m => {
    const k = getKickoffMs(m);
    return k >= startMs && k < endMs && !excludeIds.has(String(m.id)) && hasPredictions(m);
  });

  if (pool.length === 0) {
    // Fallback: any match with predictions not in free
    const fallback = matches.filter(m => !excludeIds.has(String(m.id)) && hasPredictions(m));
    if (fallback.length === 0) return null;
    return String(fallback[0].id);
  }

  // Prioritize RISQUÉ → MODÉRÉ → SAFE
  const risque = pool.filter(m => getConfidenceRank(m.pred_confidence) === 1);
  const modere = pool.filter(m => getConfidenceRank(m.pred_confidence) === 2);
  const safe = pool.filter(m => getConfidenceRank(m.pred_confidence) === 3);
  const candidates = risque.length > 0 ? risque : modere.length > 0 ? modere : safe;

  const sorted = [...candidates].sort((a, b) => {
    const ai = (Number(b.ai_score) || 0) - (Number(a.ai_score) || 0);
    if (ai !== 0) return ai;
    return String(a.id).localeCompare(String(b.id));
  });

  const top = sorted.slice(0, Math.min(3, sorted.length));
  const seed = hashDate(dateKey);
  const pick = String(top[seed % top.length].id);
  console.log(`[pickTopPick] candidates=${candidates.length}, pick=${pick}`);
  return pick;
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
    let isPremiumPlus = false;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

      if (!claimsError && claimsData?.claims) {
        const userId = claimsData.claims.sub as string;
        const userEmail = claimsData.claims.email as string | undefined;
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

        if (roleData) {
          isPremium = true;
          isPremiumPlus = true;
        }

        // Check Stripe for Premium+ products
        if (userEmail && !isPremiumPlus) {
          try {
            const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
            if (stripeKey) {
              const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
              const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
              const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
              if (customers.data.length > 0) {
                const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 5 });
                for (const s of subs.data) {
                  const prodId = s.items.data[0]?.price?.product;
                  if (PREMIUM_PLUS_PRODUCTS.includes(prodId as string)) {
                    isPremiumPlus = true;
                    isPremium = true;
                  } else if (prodId) {
                    isPremium = true;
                  }
                }
              }
            }
          } catch (e) {
            console.warn("[get-matches] Stripe check failed:", e);
          }
        }
      }
    }

    const url = new URL(req.url);
    const matchId = url.searchParams.get("id");
    const adminClient = createClient(supabaseUrl, serviceKey);

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
        let matchData = isPremiumPlus ? match : stripScoresOnly(match as Record<string, unknown>);
        if (!isPremiumPlus) matchData = stripAnomalyDetails(matchData as Record<string, unknown>);
        return new Response(JSON.stringify({ ...matchData, is_top_pick: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: allIds } = await adminClient
        .from("cached_matches")
        .select("id, sport, kickoff, pred_confidence, pred_home_win, pred_away_win, pred_draw, ai_score")
        .order("kickoff", { ascending: true });

      const all = (allIds || []) as Record<string, unknown>[];
      const freeIds = pickTop2Free(all);
      const topPickId = pickTopPick(all, freeIds);

      if (freeIds.has(matchId) || topPickId === matchId) {
        return new Response(JSON.stringify({ ...stripAnomalyDetails(stripScoresOnly(match as Record<string, unknown>)), is_free: freeIds.has(matchId), is_top_pick: topPickId === matchId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ...stripPredictions(match as Record<string, unknown>), is_top_pick: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ALL MATCHES LIST ───
    const [{ data: matches, error }, { data: resolvedRows }] = await Promise.all([
      adminClient
        .from("cached_matches")
        .select("*")
        .order("kickoff", { ascending: true }),
      adminClient
        .from("match_results")
        .select("fixture_id")
        .not("result", "is", null)
        .order("kickoff", { ascending: false })
        .limit(1000),
    ]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedFixtureIds = new Set((resolvedRows || []).map((row: { fixture_id: number }) => Number(row.fixture_id)));
    const allMatches = ((matches || []) as Record<string, unknown>[]).filter((match) => {
      const fixtureId = Number(match.fixture_id);
      if (resolvedFixtureIds.has(fixtureId)) return false;
      if (isFinishedMatch(match)) return false;
      return true;
    });
    const freeIds = pickTop2Free(allMatches);
    const topPickId = pickTopPick(allMatches, freeIds);

    console.log(`[get-matches] total=${allMatches.length}, withPreds=${allMatches.filter(hasPredictions).length}, freeIds=[${[...freeIds]}], topPick=${topPickId}`);

    if (isPremium) {
      const mapFn = (m: Record<string, unknown>) => {
        let base = isPremiumPlus ? m : stripScoresOnly(m);
        if (!isPremiumPlus) base = stripAnomalyDetails(base);
        return {
          ...base,
          is_free: freeIds.has(String(m.id)),
          is_top_pick: topPickId === String(m.id),
        };
      };
      return new Response(JSON.stringify(allMatches.map(mapFn)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-premium: show predictions only for free + top pick, strip anomaly details but keep label
    const result = allMatches.map(m => {
      const id = String(m.id);
      const isFree = freeIds.has(id);
      const isTopPick = topPickId === id;

      if (isFree || isTopPick) {
        return { ...stripAnomalyDetails(stripScoresOnly(m)), is_free: isFree, is_top_pick: isTopPick };
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
