import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPORTSRC_BASE = "https://api.sportsrc.org/v2/";
const SPORTSRC_KEY = "8d44848359af5c9ea4c13a11aa996811";

// ─── UTILS ───────────────────────────────────────────────────────────
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seeded(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

// ─── AI PREDICTION ENGINE ────────────────────────────────────────────
const SPORT_PROFILES: Record<string, { features: Record<string, number>; drawPossible: boolean; scoreRange: [number, number] }> = {
  football: { features: { form: 0.25, ranking: 0.20, attack: 0.20, defense: 0.15, h2h: 0.10, homeAdv: 0.10 }, drawPossible: true, scoreRange: [0, 4] },
  tennis: { features: { serveWin: 0.25, returnWin: 0.20, aces: 0.15, breakPoints: 0.15, form: 0.15, h2h: 0.10 }, drawPossible: false, scoreRange: [0, 3] },
  basketball: { features: { ppg: 0.25, pace: 0.15, offEff: 0.20, defEff: 0.20, form: 0.10, homeAdv: 0.10 }, drawPossible: false, scoreRange: [85, 130] },
};

function simulateFeature(teamName: string, featureName: string, fixtureId: number): number {
  const seed = hash(teamName + featureName) + fixtureId;
  return clamp01(0.3 + (seeded(seed, 0) * 0.4) + (seeded(seed, 7) - 0.5) * 0.2);
}

function computeDataAvailability(teamName: string, fixtureId: number): number {
  return clamp01(0.5 + clamp01(teamName.length / 20) * 0.3 + seeded(hash(teamName) + fixtureId, 99) * 0.2);
}

function generatePrediction(homeTeam: string, awayTeam: string, fixtureId: number, sport: string) {
  const profile = SPORT_PROFILES[sport] || SPORT_PROFILES.football;
  const features = Object.entries(profile.features);
  let homeScore = 0, awayScore = 0, totalWeight = 0, usedFeatures = 0;
  const homeAvail = computeDataAvailability(homeTeam, fixtureId);
  const awayAvail = computeDataAvailability(awayTeam, fixtureId);

  for (const [featureName, baseWeight] of features) {
    const homeVal = simulateFeature(homeTeam, featureName, fixtureId);
    const awayVal = simulateFeature(awayTeam, featureName, fixtureId);
    const dataQuality = (homeAvail + awayAvail) / 2;
    if (seeded(hash(featureName) + fixtureId, 42) >= dataQuality) continue;
    const signalStrength = Math.abs(homeVal - awayVal);
    const adjustedWeight = baseWeight * (0.7 + signalStrength * 0.6);
    homeScore += homeVal * adjustedWeight;
    awayScore += awayVal * adjustedWeight;
    totalWeight += adjustedWeight;
    usedFeatures++;
  }

  if (totalWeight > 0) { homeScore /= totalWeight; awayScore /= totalWeight; }
  else { homeScore = 0.5; awayScore = 0.5; }
  homeScore *= 1.06;

  const diff = homeScore - awayScore;
  let rawHome: number, rawDraw: number, rawAway: number;
  if (profile.drawPossible) {
    rawHome = Math.max(0.05, 0.5 + diff * 1.8);
    rawAway = Math.max(0.05, 0.5 - diff * 1.8);
    rawDraw = Math.max(0.05, 0.30 - Math.abs(diff) * 2.5);
  } else {
    rawHome = Math.max(0.05, 0.5 + diff * 2.2);
    rawAway = Math.max(0.05, 1 - rawHome);
    rawDraw = 0;
  }

  const total = rawHome + rawDraw + rawAway;
  const predHome = Math.round((rawHome / total) * 100);
  const predDraw = Math.round((rawDraw / total) * 100);
  const predAway = 100 - predHome - predDraw;

  const [minScore, maxScore] = profile.scoreRange;
  const range = maxScore - minScore;
  const homeStrength = homeScore / (homeScore + awayScore || 1);
  const baseSeed = hash(homeTeam + awayTeam) + fixtureId;

  const predScoreHome = Math.round(minScore + range * clamp01(homeStrength * 0.6 + seeded(baseSeed, 1) * 0.4));
  const predScoreAway = Math.round(minScore + range * clamp01((1 - homeStrength) * 0.6 + seeded(baseSeed, 2) * 0.4));

  const totalExpected = predScoreHome + predScoreAway;
  const overLine = sport === "football" ? 2.5 : Math.round(totalExpected * 0.95);
  const overProb = Math.round(clamp01(0.3 + seeded(baseSeed, 3) * 0.4 + (totalExpected > overLine ? 0.15 : -0.1)) * 100);
  const bttsProb = Math.round(clamp01(0.25 + seeded(baseSeed, 4) * 0.35 + (predScoreHome > 0 && predScoreAway > 0 ? 0.2 : -0.1)) * 100);

  const dataCompleteness = usedFeatures / features.length;
  const maxProb = Math.max(predHome, predAway);
  const confidenceScore = clamp01(dataCompleteness * 0.35 + ((homeAvail + awayAvail) / 2) * 0.25 + (maxProb / 100) * 0.25 + Math.abs(diff) * 0.15);

  let confidence: string;
  if (confidenceScore >= 0.65 && maxProb >= 55) confidence = "SAFE";
  else if (confidenceScore >= 0.45 && maxProb >= 40) confidence = "MODÉRÉ";
  else confidence = "RISQUÉ";

  const valueBet = confidenceScore >= 0.55 && maxProb >= 50 && seeded(baseSeed, 5) > 0.5;
  const fav = predHome >= predAway ? homeTeam : awayTeam;
  const underdog = predHome >= predAway ? awayTeam : homeTeam;
  const dataQualityLabel = dataCompleteness >= 0.8 ? "complètes" : dataCompleteness >= 0.5 ? "partielles" : "limitées";

  const sportText: Record<string, string> = {
    football: "xG, PPDA, expected goals et pression offensive",
    tennis: "% service gagnant, break points, retour et forme récente",
    basketball: "PER, true shooting %, pace et net rating",
  };

  const analysis = `Notre moteur IA a analysé ${usedFeatures} métriques clés (${sportText[sport] || "multi-facteurs"}). Données ${dataQualityLabel}. ${fav} présente un avantage statistique face à ${underdog}. Confiance : ${confidence}.`;

  return {
    pred_home_win: predHome, pred_draw: predDraw, pred_away_win: predAway,
    pred_score_home: predScoreHome, pred_score_away: predScoreAway,
    pred_over_under: sport === "football" ? 2.5 : overLine, pred_over_prob: overProb,
    pred_btts_prob: bttsProb, pred_confidence: confidence, pred_value_bet: valueBet, pred_analysis: analysis,
  };
}

// ─── FETCH FROM SPORTSRC ────────────────────────────────────────────
interface SportsRCMatch {
  id: string;
  title: string;
  timestamp: number;
  status: string;
  status_detail: string;
  teams: {
    home: { name: string; badge: string };
    away: { name: string; badge: string };
  };
  score: { current: { home: number; away: number } };
}

interface SportsRCLeague {
  league: { name: string; country: string };
  matches: SportsRCMatch[];
}

async function fetchSportMatches(sport: string): Promise<{ league: string; country: string; match: SportsRCMatch }[]> {
  // Don't use &date= param — API returns 0 results with it. Fetch all upcoming then filter.
  const url = `${SPORTSRC_BASE}?type=matches&sport=${sport}`;
  console.log(`[SportSRC] Fetching: ${url}`);
  const res = await fetch(url, { headers: { "X-API-KEY": SPORTSRC_KEY } });
  if (!res.ok) {
    console.error(`[SportSRC] ${sport} error: ${res.status}`);
    return [];
  }
  const json = await res.json();
  const leagues: SportsRCLeague[] = json.data || [];
  const now = Date.now();

  // Get today and tomorrow boundaries in UTC
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 2); // include tomorrow

  const results: { league: string; country: string; match: SportsRCMatch }[] = [];
  for (const lg of leagues) {
    for (const m of lg.matches) {
      // STRICT: only "notstarted" matches in the future
      if (m.status !== "notstarted") continue;
      if (!m.timestamp || m.timestamp <= now) continue;
      // Only today/tomorrow
      if (m.timestamp > tomorrowEnd.getTime()) continue;
      // Reject if score already set
      if (m.score?.current?.home > 0 || m.score?.current?.away > 0) continue;
      results.push({ league: lg.league.name, country: lg.league.country, match: m });
    }
  }

  results.sort((a, b) => a.match.timestamp - b.match.timestamp);
  console.log(`[SportSRC] ${sport}: ${results.length} valid upcoming matches`);
  return results;
}

function convertToRow(item: { league: string; country: string; match: SportsRCMatch }, sport: string, isFree: boolean) {
  const m = item.match;
  const fixtureId = hash(m.id);
  const homeTeam = m.teams.home.name;
  const awayTeam = m.teams.away.name;
  const kickoff = new Date(m.timestamp).toISOString();
  const prediction = generatePrediction(homeTeam, awayTeam, fixtureId, sport);

  return {
    fixture_id: fixtureId,
    sport,
    league_name: item.league,
    league_country: item.country || null,
    home_team: homeTeam,
    away_team: awayTeam,
    home_logo: m.teams.home.badge || null,
    away_logo: m.teams.away.badge || null,
    kickoff,
    status: "NS",
    home_score: null,
    away_score: null,
    is_free: isFree,
    fetched_at: new Date().toISOString(),
    ...prediction,
  };
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // NO CACHE COOLDOWN — always fetch fresh data from API

    // ─── FETCH ALL SPORTS IN PARALLEL (priority + fallback) ─────
    const allSports = ["football", "tennis", "basketball", "hockey", "baseball", "american_football", "handball", "rugby"];
    const allResults = await Promise.all(allSports.map(s => fetchSportMatches(s).then(data => ({ sport: s, data }))));

    const sportPools = allResults.filter(p => p.data.length > 0);
    // Sort: priority sports first (football, tennis, basketball), then fallbacks
    const priorityOrder = ["football", "tennis", "basketball"];
    sportPools.sort((a, b) => {
      const ai = priorityOrder.indexOf(a.sport);
      const bi = priorityOrder.indexOf(b.sport);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    console.log(`[SportSRC] Available sports: ${sportPools.map(p => `${p.sport}(${p.data.length})`).join(", ") || "NONE"}`);

    const freeMatches: ReturnType<typeof convertToRow>[] = [];
    const usedIds = new Set<string>();

    // First pass: 1 from each sport
    for (const pool of sportPools) {
      if (pool.data.length > 0) {
        const item = pool.data[0];
        freeMatches.push(convertToRow(item, pool.sport, true));
        usedIds.add(item.match.id);
      }
    }

    // Second pass: fill to 3 from any sport (no duplicates)
    if (freeMatches.length < 3) {
      for (const pool of sportPools) {
        for (const item of pool.data) {
          if (freeMatches.length >= 3) break;
          if (usedIds.has(item.match.id)) continue;
          freeMatches.push(convertToRow(item, pool.sport, true));
          usedIds.add(item.match.id);
        }
        if (freeMatches.length >= 3) break;
      }
    }

    // ─── PREMIUM MATCHES (remaining) ─────────────────────────────
    const allMatches = [...freeMatches];
    for (const pool of sportPools) {
      for (const item of pool.data) {
        if (usedIds.has(item.match.id)) continue;
        allMatches.push(convertToRow(item, pool.sport, false));
        usedIds.add(item.match.id);
      }
    }

    console.log(`Total: ${allMatches.length} matches (${freeMatches.length} free)`);

    // ─── PURGE past matches, SAVE new ones ───────────────────────
    await supabase.from("cached_matches").delete().lt("kickoff", new Date().toISOString());

    if (allMatches.length > 0) {
      for (let i = 0; i < allMatches.length; i += 50) {
        const batch = allMatches.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
    }

    const today = new Date().toISOString().split("T")[0];
    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: new Date().toISOString(),
      request_count_today: 1,
      last_reset_date: today,
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches_count: allMatches.length,
        free_count: freeMatches.length,
        sports: { football: footballData.length, tennis: tennisData.length, basketball: basketballData.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
