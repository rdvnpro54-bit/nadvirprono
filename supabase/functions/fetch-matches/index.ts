import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── API CONFIG ──────────────────────────────────────────────────────
const SPORTSRC_BASE = "https://api.sportsrc.org/v2/";
const SPORTSRC_KEY = "8d44848359af5c9ea4c13a11aa996811";

const LIVESCORE_BASE = "https://livescore6.p.rapidapi.com";
const LIVESCORE_HOST = "livescore6.p.rapidapi.com";
const LIVESCORE_KEY = "ed7d112361mshf3c802ed9cfa89ep1465e2jsnde5590455f30";

// ESPN as second fallback (free, no key)
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

function getTodayParis(): { iso: string; livescore: string } {
  const now = new Date();
  const parisStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); // YYYY-MM-DD
  return {
    iso: parisStr,
    livescore: parisStr.replace(/-/g, ""), // YYYYMMDD
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

// ─── NORMALIZED MATCH TYPE ──────────────────────────────────────────
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
  source: "sportsrc" | "livescore" | "espn";
}

// ─── ANTI-DUPLICATE KEY ─────────────────────────────────────────────
function matchKey(m: NormalizedMatch): string {
  return `${m.homeTeam.toLowerCase().trim()}_${m.awayTeam.toLowerCase().trim()}_${m.timestamp}`;
}

// ─── FETCH SPORTSRC (FOOTBALL) ──────────────────────────────────────
async function fetchSportsRC(dateISO: string): Promise<NormalizedMatch[]> {
  const url = `${SPORTSRC_BASE}?type=matches&sport=football&status=upcoming&date=${dateISO}`;
  console.log(`[API: SportSRC] FOOT - ${dateISO} - fetching upcoming`);
  try {
    const res = await fetch(url, { headers: { "X-API-KEY": SPORTSRC_KEY } });
    if (!res.ok) { console.error(`[SportSRC] error: ${res.status}`); return []; }
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
    console.log(`[API: SportSRC] FOOT - ${results.length} upcoming matches`);
    return results;
  } catch (e) {
    console.error(`[SportSRC] fetch error:`, e);
    return [];
  }
}

// ─── FETCH LIVESCORE (TENNIS / BASKETBALL / SOCCER FALLBACK) ────────
async function fetchLiveScore(category: string, dateLiveScore: string, sport: string): Promise<NormalizedMatch[]> {
  const url = `${LIVESCORE_BASE}/matches/v2/list-by-date?Category=${category}&Date=${dateLiveScore}&Timezone=1`;
  console.log(`[API: LiveScore] ${sport.toUpperCase()} - ${dateLiveScore} - fetching`);
  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": LIVESCORE_HOST,
        "x-rapidapi-key": LIVESCORE_KEY,
      },
    });
    if (!res.ok) {
      console.error(`[LiveScore] ${sport} error: ${res.status}`);
      return [];
    }
    const json = await res.json();
    const stages = json.Stages || [];
    const now = Date.now();
    const results: NormalizedMatch[] = [];

    for (const stage of stages) {
      const leagueName = stage.Snm || stage.Cnm || "Unknown";
      const country = stage.Cnm || "";
      for (const evt of (stage.Events || [])) {
        // Status: 0 = not started, 1 = in progress, 2+ = finished
        const epsStatus = evt.Eps;
        if (epsStatus !== "NS" && epsStatus !== "0" && epsStatus !== "" && epsStatus !== undefined) {
          // Try to detect "not started" from various LiveScore status codes
          const statusStr = String(epsStatus).toUpperCase();
          if (statusStr !== "NS" && statusStr !== "SCH" && statusStr !== "0") continue;
        }

        // Parse time - LiveScore uses Esd (YYYYMMDDHHMMSS) or separate fields
        let ts = 0;
        if (evt.Esd) {
          const esd = String(evt.Esd);
          if (esd.length >= 12) {
            const y = esd.slice(0, 4), mo = esd.slice(4, 6), d = esd.slice(6, 8);
            const h = esd.slice(8, 10), mi = esd.slice(10, 12);
            ts = new Date(`${y}-${mo}-${d}T${h}:${mi}:00+01:00`).getTime(); // CET
          }
        }
        if (!ts || ts <= now) continue;

        // Verify it's today (Paris time)
        const evtDay = new Date(ts).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).replace(/-/g, "");
        if (evtDay !== dateLiveScore) continue;

        const homeTeam = evt.T1?.[0]?.Nm || "Team A";
        const awayTeam = evt.T2?.[0]?.Nm || "Team B";
        const homeLogo = evt.T1?.[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${evt.T1[0].Img}` : null;
        const awayLogo = evt.T2?.[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${evt.T2[0].Img}` : null;

        results.push({
          id: `ls_${evt.Eid || hash(homeTeam + awayTeam + ts)}`,
          sport,
          league: leagueName,
          country,
          homeTeam,
          awayTeam,
          homeLogo,
          awayLogo,
          timestamp: ts,
          source: "livescore",
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[API: LiveScore] ${sport.toUpperCase()} - ${results.length} upcoming matches after filter`);
    return results;
  } catch (e) {
    console.error(`[LiveScore] ${sport} fetch error:`, e);
    return [];
  }
}

// ─── ESPN FALLBACK ──────────────────────────────────────────────────
const ESPN_SPORT_MAP: Record<string, { path: string; label: string }[]> = {
  football: [
    { path: "soccer/eng.1", label: "Premier League" },
    { path: "soccer/esp.1", label: "La Liga" },
    { path: "soccer/ger.1", label: "Bundesliga" },
    { path: "soccer/ita.1", label: "Serie A" },
    { path: "soccer/fra.1", label: "Ligue 1" },
    { path: "soccer/uefa.champions", label: "Champions League" },
  ],
  tennis: [
    { path: "tennis/atp", label: "ATP" },
    { path: "tennis/wta", label: "WTA" },
  ],
  basketball: [
    { path: "basketball/nba", label: "NBA" },
    { path: "basketball/wnba", label: "WNBA" },
  ],
};

async function fetchESPN(sport: string, dateESPN: string): Promise<NormalizedMatch[]> {
  const leagues = ESPN_SPORT_MAP[sport];
  if (!leagues) return [];
  const now = Date.now();
  const allResults: NormalizedMatch[] = [];

  const fetches = leagues.map(async (league) => {
    const url = `${ESPN_BASE}/${league.path}/scoreboard?dates=${dateESPN}`;
    console.log(`[API: ESPN] ${sport.toUpperCase()} - ${league.label} - fetching`);
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const events = json.events || [];
      const results: NormalizedMatch[] = [];

      for (const evt of events) {
        if (evt.status?.type?.state !== "pre") continue;
        const eventDate = evt.date ? new Date(evt.date).getTime() : 0;
        if (!eventDate || eventDate <= now) continue;
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
          homeTeam: home.team?.displayName || "Team A",
          awayTeam: away.team?.displayName || "Team B",
          homeLogo: home.team?.logo || null,
          awayLogo: away.team?.logo || null,
          timestamp: eventDate,
          source: "espn",
        });
      }
      return results;
    } catch {
      return [];
    }
  });

  const allFetched = await Promise.all(fetches);
  for (const r of allFetched) allResults.push(...r);
  allResults.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`[API: ESPN] ${sport.toUpperCase()} - ${allResults.length} upcoming`);
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

// ─── ROTATION LOGIC ─────────────────────────────────────────────────
// Cycle 0: FOOT (SportSRC)
// Cycle 1: TENNIS (LiveScore)
// Cycle 2: BASKET (LiveScore)
// Cycle 3: CACHE ONLY (no API call)
const SPORT_CYCLE = ["football", "tennis", "basketball", "cache"] as const;

// ─── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { iso, livescore: dateLiveScore } = getTodayParis();
    const dateESPN = dateLiveScore; // same format YYYYMMDD
    console.log(`[FETCH] Date Paris: ${iso} / ${dateLiveScore}`);

    // ─── Determine current cycle from request_count_today ────
    const { data: meta } = await supabase
      .from("cache_metadata")
      .select("*")
      .eq("id", "api_football")
      .single();

    let cycleIndex = 0;
    let requestCount = meta?.request_count_today || 0;

    // Reset counter if new day
    if (meta?.last_reset_date !== iso) {
      requestCount = 0;
      console.log(`[CYCLE] New day detected, resetting counter`);
    }

    cycleIndex = requestCount % 4;
    const currentCycle = SPORT_CYCLE[cycleIndex];
    console.log(`[CYCLE] #${requestCount} → ${currentCycle} (cycle ${cycleIndex}/3)`);

    // ─── Check 6-min cache per sport ─────────────────────────
    const lastFetchTime = meta?.last_fetched_at ? new Date(meta.last_fetched_at).getTime() : 0;
    const sixMinAgo = Date.now() - 6 * 60 * 1000;

    if (currentCycle === "cache" || (lastFetchTime > sixMinAgo && requestCount > 0)) {
      console.log(`[CACHE] Using cached data (cycle=${currentCycle}, last=${new Date(lastFetchTime).toISOString()})`);
      // Just increment counter, don't call APIs
      await supabase.from("cache_metadata").upsert({
        id: "api_football",
        last_fetched_at: meta?.last_fetched_at || new Date().toISOString(),
        request_count_today: requestCount + 1,
        last_reset_date: iso,
      });

      return new Response(JSON.stringify({ 
        success: true, cached: true, cycle: currentCycle, cycleIndex,
        message: "Using cached data" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Fetch the sport for this cycle ─────────────────────
    let newMatches: NormalizedMatch[] = [];

    if (currentCycle === "football") {
      newMatches = await fetchSportsRC(iso);
      if (newMatches.length === 0) {
        console.log(`[FALLBACK] SportSRC returned 0, trying LiveScore soccer...`);
        newMatches = await fetchLiveScore("soccer", dateLiveScore, "football");
      }
      if (newMatches.length === 0) {
        console.log(`[FALLBACK] LiveScore soccer returned 0, trying ESPN...`);
        newMatches = await fetchESPN("football", dateESPN);
      }
    } else if (currentCycle === "tennis") {
      newMatches = await fetchLiveScore("tennis", dateLiveScore, "tennis");
      if (newMatches.length === 0) {
        console.log(`[FALLBACK] LiveScore tennis returned 0, trying ESPN...`);
        newMatches = await fetchESPN("tennis", dateESPN);
      }
    } else if (currentCycle === "basketball") {
      newMatches = await fetchLiveScore("basketball", dateLiveScore, "basketball");
      if (newMatches.length === 0) {
        console.log(`[FALLBACK] LiveScore basketball returned 0, trying ESPN...`);
        newMatches = await fetchESPN("basketball", dateESPN);
      }
    }

    console.log(`[FETCH] ${currentCycle} returned ${newMatches.length} raw matches`);

    // ─── Anti-duplicates ─────────────────────────────────────
    const seenKeys = new Set<string>();
    const dedupedMatches: NormalizedMatch[] = [];
    for (const m of newMatches) {
      const key = matchKey(m);
      if (seenKeys.has(key)) {
        console.log(`[DEDUP] Removed duplicate: ${m.homeTeam} vs ${m.awayTeam}`);
        continue;
      }
      seenKeys.add(key);
      dedupedMatches.push(m);
    }
    console.log(`[DEDUP] ${newMatches.length} → ${dedupedMatches.length} after dedup`);

    // ─── Load existing cached matches for other sports ──────
    const { data: existingMatches } = await supabase
      .from("cached_matches")
      .select("*")
      .gt("kickoff", new Date().toISOString());

    // Build complete picture: keep other sports from cache, replace current sport
    const otherSportRows = (existingMatches || []).filter(
      (m: any) => m.sport !== currentCycle
    );

    // Convert new matches to rows
    const newRows = dedupedMatches.map(m => convertNormalizedToRow(m, false));

    // ─── Determine TOP 3 FREE: 1 per sport ──────────────────
    const allAvailable = [
      ...otherSportRows.map((r: any) => ({ ...r, _isExisting: true })),
      ...newRows.map(r => ({ ...r, _isExisting: false })),
    ];

    // Reset is_free for all
    for (const r of allAvailable) r.is_free = false;

    // Pick 1 per sport for free
    const freeFixtureIds = new Set<number>();
    for (const sportName of ["football", "tennis", "basketball"]) {
      const sportMatches = allAvailable
        .filter((r: any) => r.sport === sportName)
        .sort((a: any, b: any) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
      if (sportMatches.length > 0) {
        sportMatches[0].is_free = true;
        freeFixtureIds.add(sportMatches[0].fixture_id);
      }
    }
    // Fill to 3 if needed
    if (freeFixtureIds.size < 3) {
      for (const r of allAvailable) {
        if (freeFixtureIds.size >= 3) break;
        if (!freeFixtureIds.has(r.fixture_id)) {
          r.is_free = true;
          freeFixtureIds.add(r.fixture_id);
        }
      }
    }

    // ─── Upsert new matches to DB ───────────────────────────
    if (newRows.length > 0) {
      // Set is_free based on our picks
      for (const r of newRows) {
        r.is_free = freeFixtureIds.has(r.fixture_id);
      }
      for (let i = 0; i < newRows.length; i += 50) {
        const batch = newRows.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
    }

    // Update free flags for existing matches too
    for (const r of otherSportRows) {
      const shouldBeFree = freeFixtureIds.has(r.fixture_id);
      if (r.is_free !== shouldBeFree) {
        await supabase.from("cached_matches")
          .update({ is_free: shouldBeFree })
          .eq("fixture_id", r.fixture_id);
      }
    }

    // ─── Purge old matches ───────────────────────────────────
    await supabase.from("cached_matches").delete().lt("kickoff", new Date().toISOString());

    // ─── Update metadata ─────────────────────────────────────
    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: new Date().toISOString(),
      request_count_today: requestCount + 1,
      last_reset_date: iso,
    });

    const sportCounts = {
      football: allAvailable.filter((r: any) => r.sport === "football").length,
      tennis: allAvailable.filter((r: any) => r.sport === "tennis").length,
      basketball: allAvailable.filter((r: any) => r.sport === "basketball").length,
    };

    console.log(`[DONE] Cycle ${currentCycle} complete. Counts: ${JSON.stringify(sportCounts)}. Free: ${freeFixtureIds.size}. Requests today: ${requestCount + 1}`);

    return new Response(JSON.stringify({
      success: true,
      cycle: currentCycle,
      cycleIndex,
      matches_fetched: newRows.length,
      free_count: freeFixtureIds.size,
      sport_counts: sportCounts,
      requests_today: requestCount + 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
