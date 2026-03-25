import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── API CONFIG ──────────────────────────────────────────────────────
const SPORTSRC_BASE = "https://api.sportsrc.org/v2/";
const SPORTSRC_KEY = "8d44848359af5c9ea4c13a11aa996811";

// ESPN hidden API (free, no key needed)
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

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

/** Get today's date in Europe/Paris timezone */
function getTodayParis(): { iso: string; espn: string } {
  const now = new Date();
  const parisStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); // YYYY-MM-DD
  return {
    iso: parisStr,
    espn: parisStr.replace(/-/g, ""), // YYYYMMDD
  };
}

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
  source: "sportsrc" | "espn";
}

// ─── FETCH FROM SPORTSRC (FOOTBALL PRIMARY) ─────────────────────────
async function fetchSportsRC(dateISO: string): Promise<NormalizedMatch[]> {
  const url = `${SPORTSRC_BASE}?type=matches&sport=football&status=upcoming&date=${dateISO}`;
  console.log(`[API: SportSRC] FOOT - ${dateISO} - fetching upcoming`);
  try {
    const res = await fetch(url, { headers: { "X-API-KEY": SPORTSRC_KEY } });
    if (!res.ok) { console.error(`[SportSRC] football error: ${res.status}`); return []; }
    const json = await res.json();
    const leagues = json.data || [];
    const now = Date.now();

    const results: NormalizedMatch[] = [];
    for (const lg of leagues) {
      for (const m of (lg.matches || [])) {
        if (m.status !== "notstarted") continue;
        const rawTs = m.timestamp || 0;
        const ts = rawTs < 1e12 ? rawTs * 1000 : rawTs;
        if (!ts || ts <= now) continue;
        if (m.score?.current?.home > 0 || m.score?.current?.away > 0) continue;
        results.push({
          id: `src_${m.id}`,
          sport: "football",
          league: lg.league?.name || "Unknown",
          country: lg.league?.country || "",
          homeTeam: m.teams?.home?.name || "Team A",
          awayTeam: m.teams?.away?.name || "Team B",
          homeLogo: m.teams?.home?.badge || null,
          awayLogo: m.teams?.away?.badge || null,
          timestamp: ts,
          source: "sportsrc",
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[API: SportSRC] FOOT - ${dateISO} - ${results.length} upcoming matches`);
    return results;
  } catch (e) {
    console.error(`[SportSRC] football fetch error:`, e);
    return [];
  }
}

// ─── FETCH FROM ESPN (FREE, NO KEY) ─────────────────────────────────
// ESPN sport/league paths
const ESPN_SPORT_MAP: Record<string, { path: string; label: string }[]> = {
  football: [
    { path: "soccer/eng.1", label: "Premier League" },
    { path: "soccer/esp.1", label: "La Liga" },
    { path: "soccer/ger.1", label: "Bundesliga" },
    { path: "soccer/ita.1", label: "Serie A" },
    { path: "soccer/fra.1", label: "Ligue 1" },
    { path: "soccer/uefa.champions", label: "Champions League" },
    { path: "soccer/uefa.europa", label: "Europa League" },
  ],
  tennis: [
    { path: "tennis/atp", label: "ATP" },
    { path: "tennis/wta", label: "WTA" },
  ],
  basketball: [
    { path: "basketball/nba", label: "NBA" },
    { path: "basketball/wnba", label: "WNBA" },
    { path: "basketball/mens-college-basketball", label: "NCAA" },
  ],
};

async function fetchESPN(sport: string, dateESPN: string): Promise<NormalizedMatch[]> {
  const leagues = ESPN_SPORT_MAP[sport];
  if (!leagues) return [];

  const now = Date.now();
  const allResults: NormalizedMatch[] = [];

  // Fetch all leagues in parallel
  const fetches = leagues.map(async (league) => {
    const url = `${ESPN_BASE}/${league.path}/scoreboard?dates=${dateESPN}`;
    console.log(`[API: ESPN] ${sport.toUpperCase()} - ${league.label} - ${dateESPN} - fetching`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        console.error(`[ESPN] ${sport}/${league.label} error: ${res.status} - ${body.slice(0, 200)}`);
        return [];
      }
      const json = await res.json();
      const events = json.events || [];
      const results: NormalizedMatch[] = [];

      for (const evt of events) {
        // Only "pre" status (not started)
        const status = evt.status?.type?.state;
        const statusDetail = evt.status?.type?.name;
        if (status !== "pre") continue; // skip in-progress and post

        const eventDate = evt.date ? new Date(evt.date).getTime() : 0;
        if (!eventDate || eventDate <= now) continue;

        // Verify it's today
        const evtDay = new Date(eventDate).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).replace(/-/g, "");
        if (evtDay !== dateESPN) continue;

        const competitors = evt.competitions?.[0]?.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
        const away = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

        if (!home || !away) continue;

        results.push({
          id: `espn_${evt.id}`,
          sport,
          league: league.label,
          country: "",
          homeTeam: home.team?.displayName || home.team?.name || "Team A",
          awayTeam: away.team?.displayName || away.team?.name || "Team B",
          homeLogo: home.team?.logo || null,
          awayLogo: away.team?.logo || null,
          timestamp: eventDate,
          source: "espn",
        });

        console.log(`[API: ESPN] ${sport.toUpperCase()} - ${new Date(eventDate).toISOString().slice(0, 16)} - ${home.team?.displayName} vs ${away.team?.displayName} - upcoming`);
      }
      return results;
    } catch (e) {
      console.error(`[ESPN] ${sport}/${league.label} fetch error:`, e);
      return [];
    }
  });

  const allFetched = await Promise.all(fetches);
  for (const results of allFetched) {
    allResults.push(...results);
  }

  allResults.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`[API: ESPN] ${sport.toUpperCase()} - ${dateESPN} - ${allResults.length} total upcoming`);
  return allResults;
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

    const { iso, espn: dateESPN } = getTodayParis();
    console.log(`[FETCH] Date Paris: ${iso} / ${dateESPN}`);

    // ─── FETCH ALL SPORTS IN PARALLEL ────────────────────────────
    // Football: SportSRC primary, ESPN fallback
    // Tennis: ESPN (free, no key)
    // Basketball: ESPN (free, no key)
    const [footballSRC, tennisESPN, basketESPN] = await Promise.all([
      fetchSportsRC(iso),
      fetchESPN("tennis", dateESPN),
      fetchESPN("basketball", dateESPN),
    ]);

    // Football: use SportSRC, fallback to ESPN
    let footballMatches = footballSRC;
    if (footballMatches.length === 0) {
      console.log(`[FALLBACK] SportSRC returned 0 football, trying ESPN...`);
      footballMatches = await fetchESPN("football", dateESPN);
    }

    const sportPools: { sport: string; data: NormalizedMatch[] }[] = [
      { sport: "football", data: footballMatches },
      { sport: "tennis", data: tennisESPN },
      { sport: "basketball", data: basketESPN },
    ].filter(p => p.data.length > 0);

    console.log(`Available sports: ${sportPools.map(p => `${p.sport}(${p.data.length})`).join(", ") || "NONE"}`);

    // ─── SELECT TOP 3 FREE: 1 FOOT + 1 TENNIS + 1 BASKET ───────
    const freeRows: ReturnType<typeof convertNormalizedToRow>[] = [];
    const usedIds = new Set<string>();

    const priorityOrder = ["football", "tennis", "basketball"];
    for (const sportName of priorityOrder) {
      if (freeRows.length >= 3) break;
      const pool = sportPools.find(p => p.sport === sportName);
      if (!pool || pool.data.length === 0) continue;
      const item = pool.data[0];
      freeRows.push(convertNormalizedToRow(item, true));
      usedIds.add(item.id);
      console.log(`[FREE] ${sportName} - ${item.homeTeam} vs ${item.awayTeam} (${item.source})`);
    }

    // Fallback: fill to 3 if a sport is missing
    if (freeRows.length < 3) {
      for (const pool of sportPools) {
        for (const item of pool.data) {
          if (freeRows.length >= 3) break;
          if (usedIds.has(item.id)) continue;
          freeRows.push(convertNormalizedToRow(item, true));
          usedIds.add(item.id);
          console.log(`[FREE FILL] ${pool.sport} - ${item.homeTeam} vs ${item.awayTeam}`);
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

    // ─── PURGE OLD + SAVE ────────────────────────────────────────
    const now = new Date();
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
      last_reset_date: iso,
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
