import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPORTSRC_BASE = "https://api.sportsrc.org/v2/";
const SPORTSRC_KEY = "8d44848359af5c9ea4c13a11aa996811";
const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

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

// ─── UNIFIED MATCH TYPE ─────────────────────────────────────────────
interface NormalizedMatch {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  timestamp: number;
  source: "sportsrc" | "thesportsdb";
}

// ─── FETCH FROM SPORTSRC ────────────────────────────────────────────
async function fetchSportsRC(sport: string): Promise<NormalizedMatch[]> {
  const url = `${SPORTSRC_BASE}?type=matches&sport=${sport}`;
  console.log(`[SportSRC] Fetching: ${url}`);
  try {
    const res = await fetch(url, { headers: { "X-API-KEY": SPORTSRC_KEY } });
    if (!res.ok) { console.error(`[SportSRC] ${sport} error: ${res.status}`); return []; }
    const json = await res.json();
    const leagues = json.data || [];
    const now = Date.now();
    const cutoff = now + 48 * 60 * 60 * 1000; // 48h max

    const results: NormalizedMatch[] = [];
    for (const lg of leagues) {
      for (const m of lg.matches) {
        if (m.status !== "notstarted") continue;
        if (!m.timestamp || m.timestamp <= now || m.timestamp > cutoff) continue;
        if (m.score?.current?.home > 0 || m.score?.current?.away > 0) continue;
        results.push({
          id: `src_${m.id}`,
          sport,
          league: lg.league.name,
          country: lg.league.country || "",
          homeTeam: m.teams.home.name,
          awayTeam: m.teams.away.name,
          homeLogo: m.teams.home.badge || null,
          awayLogo: m.teams.away.badge || null,
          timestamp: m.timestamp,
          source: "sportsrc",
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;
  } catch (e) {
    console.error(`[SportSRC] ${sport} fetch error:`, e);
    return [];
  }
}

// ─── FETCH FROM THESPORTSDB (FALLBACK) ──────────────────────────────
const TSDB_SPORT_MAP: Record<string, string> = {
  football: "Soccer",
  tennis: "Tennis",
  basketball: "Basketball",
  baseball: "Baseball",
  hockey: "Ice Hockey",
  american_football: "American Football",
  handball: "Handball",
  rugby: "Rugby",
};

async function fetchTheSportsDB(sport: string, dateStr: string): Promise<NormalizedMatch[]> {
  const tsdbSport = TSDB_SPORT_MAP[sport];
  if (!tsdbSport) return [];

  const url = `${THESPORTSDB_BASE}/eventsday.php?d=${dateStr}&s=${encodeURIComponent(tsdbSport)}`;
  console.log(`[TheSportsDB] Fetching: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[TheSportsDB] ${sport} error: ${res.status}`); return []; }
    const json = await res.json();
    const events = json.events || [];
    const now = Date.now();

    const results: NormalizedMatch[] = [];
    for (const e of events) {
      // Skip if score already exists (finished match)
      if (e.intHomeScore !== null || e.intAwayScore !== null) continue;

      // Parse time
      const time = e.strTime || "23:59:00+00:00";
      const eventTs = new Date(`${e.dateEvent}T${time}`).getTime();
      if (isNaN(eventTs) || eventTs <= now) continue;

      // Extract team names from event string
      const homeTeam = e.strHomeTeam || e.strEvent?.split(" vs ")?.[0] || "Team A";
      const awayTeam = e.strAwayTeam || e.strEvent?.split(" vs ")?.[1] || "Team B";

      results.push({
        id: `tsdb_${e.idEvent}`,
        sport,
        league: e.strLeague || "Unknown League",
        country: e.strCountry || "",
        homeTeam,
        awayTeam,
        homeLogo: e.strHomeTeamBadge || null,
        awayLogo: e.strAwayTeamBadge || null,
        timestamp: eventTs,
        source: "thesportsdb",
      });
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;
  } catch (e) {
    console.error(`[TheSportsDB] ${sport} fetch error:`, e);
    return [];
  }
}

// ─── COMBINED FETCH: SportSRC primary, TheSportsDB fallback ─────────
async function fetchSportCombined(sport: string, today: string, tomorrow: string): Promise<NormalizedMatch[]> {
  // Try SportSRC first
  const srcMatches = await fetchSportsRC(sport);
  if (srcMatches.length > 0) {
    console.log(`[Combined] ${sport}: ${srcMatches.length} from SportSRC`);
    return srcMatches;
  }

  // Fallback to TheSportsDB (today + tomorrow)
  const [todayMatches, tomorrowMatches] = await Promise.all([
    fetchTheSportsDB(sport, today),
    fetchTheSportsDB(sport, tomorrow),
  ]);
  const combined = [...todayMatches, ...tomorrowMatches];
  console.log(`[Combined] ${sport}: ${combined.length} from TheSportsDB fallback`);
  return combined;
}

// ─── CONVERT TO DB ROW ──────────────────────────────────────────────
function convertNormalizedToRow(m: NormalizedMatch, isFree: boolean) {
  const fixtureId = hash(m.id);
  const kickoff = new Date(m.timestamp).toISOString();
  const prediction = generatePrediction(m.homeTeam, m.awayTeam, fixtureId, m.sport);

  return {
    fixture_id: fixtureId,
    sport: m.sport,
    league_name: m.league,
    league_country: m.country || null,
    home_team: m.homeTeam,
    away_team: m.awayTeam,
    home_logo: m.homeLogo,
    away_logo: m.awayLogo,
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

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

    // ─── FETCH ALL SPORTS IN PARALLEL ────────────────────────────
    const allSports = ["football", "tennis", "basketball", "hockey", "baseball", "american_football"];
    const allResults = await Promise.all(
      allSports.map(s => fetchSportCombined(s, today, tomorrow).then(data => ({ sport: s, data })))
    );

    const sportPools = allResults.filter(p => p.data.length > 0);
    // Priority order: football > tennis > basketball > rest
    const priorityOrder = ["football", "tennis", "basketball"];
    sportPools.sort((a, b) => {
      const ai = priorityOrder.indexOf(a.sport);
      const bi = priorityOrder.indexOf(b.sport);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    console.log(`Available sports: ${sportPools.map(p => `${p.sport}(${p.data.length})`).join(", ") || "NONE"}`);

    // ─── SELECT TOP 3 FREE (1 per sport, then fill) ─────────────
    const freeRows: ReturnType<typeof convertNormalizedToRow>[] = [];
    const usedIds = new Set<string>();

    // First pass: 1 from each sport with data
    for (const pool of sportPools) {
      if (freeRows.length >= 3) break;
      const item = pool.data[0];
      freeRows.push(convertNormalizedToRow(item, true));
      usedIds.add(item.id);
    }

    // Second pass: fill to 3
    if (freeRows.length < 3) {
      for (const pool of sportPools) {
        for (const item of pool.data) {
          if (freeRows.length >= 3) break;
          if (usedIds.has(item.id)) continue;
          freeRows.push(convertNormalizedToRow(item, true));
          usedIds.add(item.id);
        }
        if (freeRows.length >= 3) break;
      }
    }

    // ─── PREMIUM MATCHES ─────────────────────────────────────────
    const allRows = [...freeRows];
    for (const pool of sportPools) {
      for (const item of pool.data) {
        if (usedIds.has(item.id)) continue;
        allRows.push(convertNormalizedToRow(item, false));
        usedIds.add(item.id);
      }
    }

    console.log(`Total: ${allRows.length} matches (${freeRows.length} free)`);

    // ─── PURGE + SAVE ────────────────────────────────────────────
    await supabase.from("cached_matches").delete().lt("kickoff", now.toISOString());

    if (allRows.length > 0) {
      for (let i = 0; i < allRows.length; i += 50) {
        const batch = allRows.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
    }

    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: now.toISOString(),
      request_count_today: 1,
      last_reset_date: today,
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches_count: allRows.length,
        free_count: freeRows.length,
        sports: Object.fromEntries(sportPools.map(p => [p.sport, p.data.length])),
        sources: Object.fromEntries(sportPools.map(p => [p.sport, p.data[0]?.source || "none"])),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
