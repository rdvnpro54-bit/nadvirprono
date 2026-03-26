import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sport durations in minutes (match + buffer)
const SPORT_DURATIONS: Record<string, number> = {
  football: 120, tennis: 180, basketball: 150,
  hockey: 150, baseball: 210, nfl: 210,
  mma: 180, f1: 150, afl: 150, rugby: 120,
};

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_SPORT_MAP: Record<string, string> = {
  football: "soccer/all",
  basketball: "basketball/nba",
  hockey: "hockey/nhl",
  baseball: "baseball/mlb",
  nfl: "football/nfl",
  mma: "mma/ufc",
  tennis: "tennis/atp",
};

interface CachedMatch {
  id: string;
  fixture_id: number;
  home_team: string;
  away_team: string;
  sport: string;
  league_name: string;
  kickoff: string;
  pred_home_win: number;
  pred_away_win: number;
  pred_score_home: number;
  pred_score_away: number;
  pred_confidence: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

// Try to fetch real scores from ESPN
async function fetchESPNScores(sport: string): Promise<Map<string, { home: number; away: number }>> {
  const scores = new Map<string, { home: number; away: number }>();
  const espnPath = ESPN_SPORT_MAP[sport.toLowerCase()];
  if (!espnPath) return scores;

  try {
    const res = await fetch(`${ESPN_BASE}/${espnPath}/scoreboard`);
    if (!res.ok) return scores;
    const data = await res.json();

    for (const event of data.events || []) {
      const competitors = event.competitions?.[0]?.competitors || [];
      if (competitors.length < 2) continue;

      const home = competitors.find((c: any) => c.homeAway === "home");
      const away = competitors.find((c: any) => c.homeAway === "away");
      if (!home || !away) continue;

      const status = event.status?.type?.state;
      if (status !== "post") continue; // Only finished matches

      const homeScore = parseInt(home.score, 10);
      const awayScore = parseInt(away.score, 10);
      if (isNaN(homeScore) || isNaN(awayScore)) continue;

      // Key by normalized team names
      const key = `${home.team?.displayName?.toLowerCase()}_${away.team?.displayName?.toLowerCase()}`;
      scores.set(key, { home: homeScore, away: awayScore });

      // Also store short names
      const shortKey = `${home.team?.shortDisplayName?.toLowerCase()}_${away.team?.shortDisplayName?.toLowerCase()}`;
      scores.set(shortKey, { home: homeScore, away: awayScore });
    }
  } catch (e) {
    console.warn(`[resolve] ESPN fetch error for ${sport}:`, e);
  }

  return scores;
}

function findScore(
  scores: Map<string, { home: number; away: number }>,
  homeTeam: string,
  awayTeam: string
): { home: number; away: number } | null {
  const key = `${homeTeam.toLowerCase()}_${awayTeam.toLowerCase()}`;
  if (scores.has(key)) return scores.get(key)!;

  // Fuzzy match: check if any key contains parts of team names
  for (const [k, v] of scores) {
    const h = homeTeam.toLowerCase().split(" ")[0];
    const a = awayTeam.toLowerCase().split(" ")[0];
    if (k.includes(h) && k.includes(a)) return v;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const now = Date.now();

    // Get all cached matches
    const { data: matches, error: fetchErr } = await sb
      .from("cached_matches")
      .select("*");

    if (fetchErr || !matches) {
      console.error("[resolve] Failed to fetch cached_matches:", fetchErr);
      return new Response(JSON.stringify({ error: "fetch failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find matches that should be finished (kickoff + sport duration has passed)
    const finishedMatches: CachedMatch[] = [];
    for (const m of matches) {
      const kickoff = new Date(m.kickoff).getTime();
      const sport = (m.sport || "football").toLowerCase();
      const duration = (SPORT_DURATIONS[sport] || 120) * 60 * 1000;

      // Match is finished if current time > kickoff + duration
      if (now > kickoff + duration) {
        finishedMatches.push(m);
      }
    }

    if (finishedMatches.length === 0) {
      return new Response(JSON.stringify({ resolved: 0, message: "No finished matches" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which ones are already in match_results
    const fixtureIds = finishedMatches.map(m => m.fixture_id);
    const { data: existing } = await sb
      .from("match_results")
      .select("fixture_id")
      .in("fixture_id", fixtureIds);

    const existingIds = new Set((existing || []).map(e => e.fixture_id));

    // Filter to only new ones
    const toResolve = finishedMatches.filter(m => !existingIds.has(m.fixture_id));

    if (toResolve.length === 0) {
      return new Response(JSON.stringify({ resolved: 0, message: "All already resolved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ESPN scores for each sport
    const sportSet = new Set(toResolve.map(m => (m.sport || "football").toLowerCase()));
    const allScores = new Map<string, { home: number; away: number }>();
    for (const sport of sportSet) {
      const scores = await fetchESPNScores(sport);
      for (const [k, v] of scores) allScores.set(k, v);
    }

    // Resolve each match
    const results = [];
    for (const m of toResolve) {
      const predWinner = m.pred_home_win >= m.pred_away_win ? m.home_team : m.away_team;

      // Try to find real scores
      const realScore = findScore(allScores, m.home_team, m.away_team);

      let actualHome: number | null = realScore?.home ?? m.home_score;
      let actualAway: number | null = realScore?.away ?? m.away_score;

      // If we still don't have scores, use predicted scores as placeholder
      // (they'll be updated later when ESPN data becomes available)
      if (actualHome === null || actualAway === null) {
        // Skip this match - wait for real scores
        // Unless it's been > 6 hours past kickoff, then use predicted as estimate
        const kickoff = new Date(m.kickoff).getTime();
        if (now - kickoff > 6 * 60 * 60 * 1000) {
          actualHome = m.pred_score_home;
          actualAway = m.pred_score_away;
        } else {
          continue; // Wait for real scores
        }
      }

      // Determine if prediction was correct
      let actualWinner: string;
      if (actualHome > actualAway) actualWinner = m.home_team;
      else if (actualAway > actualHome) actualWinner = m.away_team;
      else actualWinner = "draw";

      const isWon = predWinner === actualWinner ||
        (actualWinner === "draw" && m.pred_home_win === m.pred_away_win);

      results.push({
        fixture_id: m.fixture_id,
        home_team: m.home_team,
        away_team: m.away_team,
        sport: m.sport || "football",
        league_name: m.league_name,
        kickoff: m.kickoff,
        pred_home_win: m.pred_home_win,
        pred_away_win: m.pred_away_win,
        predicted_winner: predWinner,
        predicted_confidence: m.pred_confidence,
        actual_home_score: actualHome,
        actual_away_score: actualAway,
        result: isWon ? "win" : "loss",
        resolved_at: new Date().toISOString(),
      });
    }

    if (results.length > 0) {
      const { error: insertErr } = await sb
        .from("match_results")
        .upsert(results, { onConflict: "fixture_id" });

      if (insertErr) {
        console.error("[resolve] Insert error:", insertErr);
        return new Response(JSON.stringify({ error: "insert failed", details: insertErr }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`[resolve] ✅ Resolved ${results.length} matches (${results.filter(r => r.result === "won").length} won, ${results.filter(r => r.result === "lost").length} lost)`);

    return new Response(JSON.stringify({
      resolved: results.length,
      won: results.filter(r => r.result === "won").length,
      lost: results.filter(r => r.result === "lost").length,
      details: results.map(r => `${r.home_team} vs ${r.away_team}: ${r.actual_home_score}-${r.actual_away_score} → ${r.result.toUpperCase()}`),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[resolve] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
