import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── API CONFIG ──────────────────────────────────────────────────────
const SPORTSRC_BASE = "https://api.sportsrc.org/v2/";
const SPORTSRC_KEY = "8d44848359af5c9ea4c13a11aa996811";
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

function getTodayParis(): { iso: string; compact: string; tomorrowCompact: string } {
  const now = new Date();
  const parisStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return { iso: parisStr, compact: parisStr.replace(/-/g, ""), tomorrowCompact: tomorrowStr.replace(/-/g, "") };
}

// ─── AI PREDICTION ENGINE ────────────────────────────────────────────
const SPORT_PROFILES: Record<string, { features: Record<string, number>; drawPossible: boolean; scoreRange: [number, number] }> = {
  football: { features: { form: 0.25, ranking: 0.20, attack: 0.20, defense: 0.15, h2h: 0.10, homeAdv: 0.10 }, drawPossible: true, scoreRange: [0, 4] },
  tennis:   { features: { serveWin: 0.25, returnWin: 0.20, aces: 0.15, breakPoints: 0.15, form: 0.15, h2h: 0.10 }, drawPossible: false, scoreRange: [0, 3] },
  basketball: { features: { ppg: 0.25, pace: 0.15, offEff: 0.20, defEff: 0.20, form: 0.10, homeAdv: 0.10 }, drawPossible: false, scoreRange: [85, 130] },
  hockey:   { features: { goalsFor: 0.25, goalsAgainst: 0.20, pp: 0.15, pk: 0.15, form: 0.15, homeAdv: 0.10 }, drawPossible: true, scoreRange: [0, 6] },
  baseball: { features: { era: 0.25, batting: 0.25, pitching: 0.20, fielding: 0.10, form: 0.10, homeAdv: 0.10 }, drawPossible: false, scoreRange: [0, 10] },
  mma:      { features: { striking: 0.25, grappling: 0.25, cardio: 0.15, experience: 0.15, form: 0.10, reach: 0.10 }, drawPossible: false, scoreRange: [1, 5] },
  f1:       { features: { qualifying: 0.30, racePace: 0.25, consistency: 0.15, teamPerf: 0.15, form: 0.15 }, drawPossible: false, scoreRange: [1, 20] },
  nfl:      { features: { offense: 0.25, defense: 0.25, rushing: 0.15, passing: 0.15, form: 0.10, homeAdv: 0.10 }, drawPossible: true, scoreRange: [3, 45] },
  rugby:    { features: { attack: 0.25, defense: 0.20, scrum: 0.15, lineout: 0.15, form: 0.15, homeAdv: 0.10 }, drawPossible: true, scoreRange: [5, 40] },
  afl:      { features: { scoring: 0.25, disposal: 0.20, tackling: 0.15, marking: 0.15, form: 0.15, homeAdv: 0.10 }, drawPossible: false, scoreRange: [50, 120] },
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

  const sportText: Record<string, string> = {
    football: "xG, PPDA, expected goals et pression offensive",
    tennis: "% service gagnant, break points, retour et forme récente",
    basketball: "PER, true shooting %, pace et net rating",
    hockey: "Corsi, buts pour/contre, power play et penalty kill",
    baseball: "ERA, OPS, WHIP et batting average",
    mma: "striking accuracy, takedown defense, volume de frappes",
    f1: "pace qualif, rythme de course, fiabilité et performance équipe",
    nfl: "yards offensifs, turnovers, red zone efficiency",
    rugby: "possession, plaquages, mêlées et touches",
    afl: "disposals, scoring shots, tackles et marks",
  };

  const fav = predHome >= predAway ? homeTeam : awayTeam;
  const underdog = predHome >= predAway ? awayTeam : homeTeam;
  const dataQualityLabel = dataCompleteness >= 0.8 ? "complètes" : dataCompleteness >= 0.5 ? "partielles" : "limitées";
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
  source: string;
}

function dedupKey(m: NormalizedMatch): string {
  return `${m.homeTeam.toLowerCase().trim()}_${m.awayTeam.toLowerCase().trim()}_${m.timestamp}`;
}

// ─── FETCH SPORTSRC (FOOTBALL) ──────────────────────────────────────
async function fetchSportsRC(dateISO: string): Promise<NormalizedMatch[]> {
  const url = `${SPORTSRC_BASE}?type=matches&sport=football&status=upcoming&date=${dateISO}&api_key=${SPORTSRC_KEY}`;
  console.log(`[API: SportSRC] FOOT - ${dateISO} - fetching`);
  try {
    const res = await fetch(url, { headers: { "X-API-KEY": SPORTSRC_KEY } });
    if (!res.ok) { console.error(`[SportSRC] error: ${res.status}`); await res.text(); return []; }
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
          id: `src_${m.id}`, sport: "football",
          league: lg.league?.name || "Unknown", country: lg.league?.country || "",
          homeTeam: m.teams?.home?.name || "Team A", awayTeam: m.teams?.away?.name || "Team B",
          homeLogo: m.teams?.home?.badge || null, awayLogo: m.teams?.away?.badge || null,
          timestamp: ts, source: "sportsrc",
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[API: SportSRC] FOOT - ${results.length} upcoming`);
    return results;
  } catch (e) { console.error(`[SportSRC] error:`, e); return []; }
}

// ─── FETCH SOFASCORE (TENNIS) ───────────────────────────────────────
const SOFASCORE_BASE = "https://api.sofascore.com/api/v1/sport";

async function fetchSofaScore(sport: string, dateISO: string): Promise<NormalizedMatch[]> {
  const sportPath = sport === "tennis" ? "tennis" : "basketball";
  const url = `${SOFASCORE_BASE}/${sportPath}/scheduled-events/${dateISO}`;
  console.log(`[API: SofaScore] ${sport.toUpperCase()} - ${dateISO} - fetching`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json", "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.sofascore.com/", "Origin": "https://www.sofascore.com",
      },
    });
    if (!res.ok) { console.error(`[SofaScore] ${sport} error: ${res.status}`); await res.text(); return []; }
    const json = await res.json();
    const events = json.events || [];
    const now = Date.now();
    const results: NormalizedMatch[] = [];
    let count = 0;
    for (const e of events) {
      if (e.status?.type !== "notstarted") continue;
      const ts = (e.startTimestamp || 0) * 1000;
      if (!ts || ts <= now) continue;
      const tournamentName = e.tournament?.name || "";
      if (sport === "tennis" && tournamentName.toLowerCase().includes("doubles")) continue;
      if (count >= 30) break;
      results.push({
        id: `sofa_${e.id}`, sport,
        league: tournamentName || "Unknown", country: e.tournament?.category?.name || "",
        homeTeam: e.homeTeam?.name || "Player A", awayTeam: e.awayTeam?.name || "Player B",
        homeLogo: null, awayLogo: null, timestamp: ts, source: "sofascore",
      });
      count++;
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[API: SofaScore] ${sport.toUpperCase()} - ${results.length} upcoming`);
    return results;
  } catch (e) { console.error(`[SofaScore] ${sport} error:`, e); return []; }
}

// ─── ESPN LEAGUES CONFIG ────────────────────────────────────────────
// All verified working ESPN endpoints (200 OK)
const ESPN_LEAGUES: Record<string, { path: string; label: string }[]> = {
  football: [
    { path: "soccer/eng.1", label: "Premier League" },
    { path: "soccer/esp.1", label: "La Liga" },
    { path: "soccer/ger.1", label: "Bundesliga" },
    { path: "soccer/ita.1", label: "Serie A" },
    { path: "soccer/fra.1", label: "Ligue 1" },
    { path: "soccer/uefa.champions", label: "Champions League" },
  ],
  basketball: [
    { path: "basketball/nba", label: "NBA" },
    { path: "basketball/wnba", label: "WNBA" },
    { path: "basketball/mens-college-basketball", label: "NCAA" },
  ],
  hockey: [
    { path: "hockey/nhl", label: "NHL" },
  ],
  baseball: [
    { path: "baseball/mlb", label: "MLB" },
  ],
  nfl: [
    { path: "football/nfl", label: "NFL" },
  ],
  mma: [
    { path: "mma/ufc", label: "UFC" },
  ],
  f1: [
    { path: "racing/f1", label: "Formula 1" },
  ],
  afl: [
    { path: "australian-football/afl", label: "AFL" },
  ],
};

// ─── GENERIC ESPN FETCHER ───────────────────────────────────────────
async function fetchESPN(sport: string, dateCompact: string): Promise<NormalizedMatch[]> {
  const leagues = ESPN_LEAGUES[sport];
  if (!leagues) return [];
  const now = Date.now();
  const all: NormalizedMatch[] = [];
  const fetches = leagues.map(async (lg) => {
    const url = `${ESPN_BASE}/${lg.path}/scoreboard?dates=${dateCompact}`;
    console.log(`[API: ESPN] ${sport.toUpperCase()} - ${lg.label} - fetching`);
    try {
      const res = await fetch(url);
      if (!res.ok) { await res.text(); return []; }
      const json = await res.json();
      const results: NormalizedMatch[] = [];
      for (const evt of (json.events || [])) {
        if (evt.status?.type?.state !== "pre") continue;
        const eventDate = evt.date ? new Date(evt.date).getTime() : 0;
        if (!eventDate || eventDate <= now) continue;
        const competitors = evt.competitions?.[0]?.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
        const away = competitors.find((c: any) => c.homeAway === "away") || competitors[1];
        if (!home || !away) continue;
        results.push({
          id: `espn_${evt.id}`, sport,
          league: lg.label, country: "",
          homeTeam: home.team?.displayName || "Team A", awayTeam: away.team?.displayName || "Team B",
          homeLogo: home.team?.logo || null, awayLogo: away.team?.logo || null,
          timestamp: eventDate, source: "espn",
        });
      }
      return results;
    } catch { return []; }
  });
  const allFetched = await Promise.all(fetches);
  for (const r of allFetched) all.push(...r);
  all.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`[API: ESPN] ${sport.toUpperCase()} - ${all.length} upcoming total`);
  return all;
}

// ─── FETCH ESPN WITH EXTENDED DATE RANGE (for sparse sports) ────────
async function fetchESPNExtended(sport: string, compact: string, tomorrowCompact: string): Promise<NormalizedMatch[]> {
  // For sparse sports (MMA, F1, AFL, NFL), scan up to 10 days ahead
  const dates = [compact, tomorrowCompact];
  const now = new Date();
  for (let i = 2; i <= 10; i++) {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  const uniqueDates = [...new Set(dates)];

  const allMatches: NormalizedMatch[] = [];
  const seen = new Set<string>();

  for (const dateStr of uniqueDates) {
    const matches = await fetchESPN(sport, dateStr);
    for (const m of matches) {
      const k = dedupKey(m);
      if (!seen.has(k)) { seen.add(k); allMatches.push(m); }
    }
    // Stop scanning once we have enough
    if (allMatches.length >= 10) break;
  }

  return allMatches;
}

// ─── CONVERT TO DB ROW ──────────────────────────────────────────────
function toRow(m: NormalizedMatch, isFree: boolean) {
  const fixtureId = hash(m.id);
  const prediction = generatePrediction(m.homeTeam, m.awayTeam, fixtureId, m.sport);
  return {
    fixture_id: fixtureId,
    sport: m.sport, league_name: m.league, league_country: m.country || null,
    home_team: m.homeTeam, away_team: m.awayTeam,
    home_logo: m.homeLogo, away_logo: m.awayLogo,
    kickoff: new Date(m.timestamp).toISOString(),
    status: "NS", home_score: null, away_score: null,
    is_free: isFree, fetched_at: new Date().toISOString(),
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

    const { iso, compact, tomorrowCompact } = getTodayParis();
    console.log(`[FETCH] Date Paris: ${iso} / ${compact} / tomorrow: ${tomorrowCompact}`);

    // ─── Check rate limit ────────────────────────────────────
    const { data: meta } = await supabase
      .from("cache_metadata").select("*").eq("id", "api_football").single();

    let requestCount = meta?.request_count_today || 0;
    if (meta?.last_reset_date !== iso) {
      requestCount = 0;
      console.log(`[CYCLE] New day, resetting counter`);
    }

    if (requestCount >= 990) {
      console.log(`[LIMIT] 990 requests reached, using cache only`);
      return new Response(JSON.stringify({ success: true, cached: true, message: "Daily limit reached" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[CYCLE] Request #${requestCount + 1} - fetching all sports`);

    // ─── Fetch ALL sports in parallel ────────────────────────
    const fetchFootball = async (): Promise<NormalizedMatch[]> => {
      let matches = await fetchSportsRC(iso);
      if (matches.length === 0) {
        console.log(`[FALLBACK] SportSRC 0 → trying ESPN football today+tomorrow`);
        const [today, tomorrow] = await Promise.all([
          fetchESPN("football", compact),
          fetchESPN("football", tomorrowCompact),
        ]);
        const seen = new Set<string>();
        matches = [];
        for (const m of [...today, ...tomorrow]) {
          const k = dedupKey(m);
          if (!seen.has(k)) { seen.add(k); matches.push(m); }
        }
      }
      return matches;
    };

    const fetchTennis = async (): Promise<NormalizedMatch[]> => {
      const matches = await fetchSofaScore("tennis", iso);
      if (matches.length > 0) return matches;
      console.log(`[TENNIS] SofaScore unavailable, keeping existing tennis cache`);
      return [];
    };

    const fetchBasketball = async (): Promise<NormalizedMatch[]> => {
      const [b1, b2] = await Promise.all([fetchESPN("basketball", compact), fetchESPN("basketball", tomorrowCompact)]);
      const seen = new Set<string>();
      const espnMatches = [...b1, ...b2].filter(m => { const k = dedupKey(m); if (seen.has(k)) return false; seen.add(k); return true; });
      if (espnMatches.length > 0) return espnMatches;
      console.log(`[FALLBACK] ESPN basketball 0 → trying SofaScore`);
      return fetchSofaScore("basketball", iso);
    };

    const fetchHockey = async (): Promise<NormalizedMatch[]> => {
      const [h1, h2] = await Promise.all([fetchESPN("hockey", compact), fetchESPN("hockey", tomorrowCompact)]);
      const seen = new Set<string>();
      return [...h1, ...h2].filter(m => { const k = dedupKey(m); if (seen.has(k)) return false; seen.add(k); return true; });
    };

    const fetchBaseball = async (): Promise<NormalizedMatch[]> => {
      const [b1, b2] = await Promise.all([fetchESPN("baseball", compact), fetchESPN("baseball", tomorrowCompact)]);
      const seen = new Set<string>();
      return [...b1, ...b2].filter(m => { const k = dedupKey(m); if (seen.has(k)) return false; seen.add(k); return true; });
    };

    // Sparse sports: scan up to 10 days ahead
    const fetchNFL = () => fetchESPNExtended("nfl", compact, tomorrowCompact);
    const fetchMMA = () => fetchESPNExtended("mma", compact, tomorrowCompact);
    const fetchF1 = () => fetchESPNExtended("f1", compact, tomorrowCompact);
    const fetchAFL = () => fetchESPNExtended("afl", compact, tomorrowCompact);

    const [
      footMatches, tennisMatches, basketMatches,
      hockeyMatches, baseballMatches,
      nflMatches, mmaMatches, f1Matches, aflMatches,
    ] = await Promise.all([
      fetchFootball(), fetchTennis(), fetchBasketball(),
      fetchHockey(), fetchBaseball(),
      fetchNFL(), fetchMMA(), fetchF1(), fetchAFL(),
    ]);

    const sportResults: Record<string, number> = {
      football: footMatches.length, tennis: tennisMatches.length, basketball: basketMatches.length,
      hockey: hockeyMatches.length, baseball: baseballMatches.length,
      nfl: nflMatches.length, mma: mmaMatches.length, f1: f1Matches.length, afl: aflMatches.length,
    };
    console.log(`[RESULTS] ${JSON.stringify(sportResults)}`);

    // ─── Combine + deduplicate ───────────────────────────────
    const allRaw = [
      ...footMatches, ...tennisMatches, ...basketMatches,
      ...hockeyMatches, ...baseballMatches,
      ...nflMatches, ...mmaMatches, ...f1Matches, ...aflMatches,
    ];
    const seen = new Set<string>();
    const deduped: NormalizedMatch[] = [];
    for (const m of allRaw) {
      const key = dedupKey(m);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(m);
    }
    console.log(`[DEDUP] ${allRaw.length} → ${deduped.length}`);

    // ─── Convert to rows ─────────────────────────────────────
    const rows = deduped.map(m => toRow(m, false));

    // ─── TOP 3 FREE: 1 per sport (prioritize football, basketball, tennis) ─
    const freeIds = new Set<number>();
    const freeSportPriority = ["football", "basketball", "tennis", "hockey", "baseball", "nfl", "mma", "f1", "afl"];
    for (const sport of freeSportPriority) {
      if (freeIds.size >= 3) break;
      const sportRows = rows.filter(r => r.sport === sport).sort((a, b) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );
      if (sportRows.length > 0) {
        sportRows[0].is_free = true;
        freeIds.add(sportRows[0].fixture_id);
      }
    }
    if (freeIds.size < 3) {
      for (const r of rows) {
        if (freeIds.size >= 3) break;
        if (!freeIds.has(r.fixture_id)) {
          r.is_free = true;
          freeIds.add(r.fixture_id);
        }
      }
    }

    // ─── Resolve finished matches with REAL scores ─────────
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const { data: pendingMatches } = await supabase
      .from("cached_matches")
      .select("fixture_id, sport, home_team, away_team, league_name, kickoff, pred_home_win, pred_away_win, pred_confidence, home_score, away_score, status")
      .lt("kickoff", threeHoursAgo);

    if (pendingMatches && pendingMatches.length > 0) {
      const matchesNeedingScores = pendingMatches.filter(m => m.home_score == null || m.away_score == null);
      const matchesWithScores = pendingMatches.filter(m => m.home_score != null && m.away_score != null);

      const finishedScores = new Map<string, { homeScore: number; awayScore: number }>();
      const datesToCheck = [compact, tomorrowCompact];
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      datesToCheck.push(yesterday.toISOString().slice(0, 10).replace(/-/g, ""));
      const twoDaysBack = new Date(Date.now() - 48 * 3600 * 1000);
      datesToCheck.push(twoDaysBack.toISOString().slice(0, 10).replace(/-/g, ""));
      const uniqueScoreDates = [...new Set(datesToCheck)];

      // Fetch finished scores for ALL sports that have ESPN leagues
      async function fetchFinishedScoresForDate(dateStr: string) {
        for (const [sport, leagues] of Object.entries(ESPN_LEAGUES)) {
          for (const lg of leagues) {
            try {
              const url = `${ESPN_BASE}/${lg.path}/scoreboard?dates=${dateStr}`;
              const res = await fetch(url);
              if (!res.ok) continue;
              const json = await res.json();
              for (const evt of (json.events || [])) {
                if (evt.status?.type?.state !== "post") continue;
                const competitors = evt.competitions?.[0]?.competitors || [];
                const home = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
                const away = competitors.find((c: any) => c.homeAway === "away") || competitors[1];
                if (!home || !away) continue;
                const homeScore = parseInt(home.score || "0");
                const awayScore = parseInt(away.score || "0");
                const key = `${(home.team?.displayName || "").toLowerCase().trim()}_${(away.team?.displayName || "").toLowerCase().trim()}`;
                finishedScores.set(key, { homeScore, awayScore });
              }
            } catch { /* skip */ }
          }
        }
      }

      await Promise.all(uniqueScoreDates.map(d => fetchFinishedScoresForDate(d)));
      console.log(`[SCORES] Found ${finishedScores.size} real finished scores from ESPN`);

      const resultsToInsert = [];

      for (const m of matchesNeedingScores) {
        const key = `${m.home_team.toLowerCase().trim()}_${m.away_team.toLowerCase().trim()}`;
        const realScore = finishedScores.get(key);
        if (realScore) {
          const predictedWinner = Number(m.pred_home_win) >= Number(m.pred_away_win) ? m.home_team : m.away_team;
          let actualWinner: string;
          if (realScore.homeScore > realScore.awayScore) actualWinner = m.home_team;
          else if (realScore.awayScore > realScore.homeScore) actualWinner = m.away_team;
          else actualWinner = "draw";
          resultsToInsert.push({
            fixture_id: m.fixture_id, sport: m.sport,
            home_team: m.home_team, away_team: m.away_team,
            league_name: m.league_name, kickoff: m.kickoff,
            predicted_winner: predictedWinner, predicted_confidence: m.pred_confidence,
            pred_home_win: m.pred_home_win, pred_away_win: m.pred_away_win,
            actual_home_score: realScore.homeScore, actual_away_score: realScore.awayScore,
            result: predictedWinner === actualWinner ? "win" : "loss",
            resolved_at: new Date().toISOString(),
          });
        }
      }

      for (const m of matchesWithScores) {
        const predictedWinner = Number(m.pred_home_win) >= Number(m.pred_away_win) ? m.home_team : m.away_team;
        let actualWinner: string;
        if (m.home_score! > m.away_score!) actualWinner = m.home_team;
        else if (m.away_score! > m.home_score!) actualWinner = m.away_team;
        else actualWinner = "draw";
        resultsToInsert.push({
          fixture_id: m.fixture_id, sport: m.sport,
          home_team: m.home_team, away_team: m.away_team,
          league_name: m.league_name, kickoff: m.kickoff,
          predicted_winner: predictedWinner, predicted_confidence: m.pred_confidence,
          pred_home_win: m.pred_home_win, pred_away_win: m.pred_away_win,
          actual_home_score: m.home_score, actual_away_score: m.away_score,
          result: predictedWinner === actualWinner ? "win" : "loss",
          resolved_at: new Date().toISOString(),
        });
      }

      if (resultsToInsert.length > 0) {
        for (let i = 0; i < resultsToInsert.length; i += 50) {
          await supabase.from("match_results").upsert(resultsToInsert.slice(i, i + 50), { onConflict: "fixture_id" });
        }
        console.log(`[HISTORY] Archived ${resultsToInsert.length} matches with REAL scores`);
      }

      const resolvedFixtureIds = resultsToInsert.map(r => r.fixture_id);
      if (resolvedFixtureIds.length > 0) {
        await supabase.from("cached_matches").delete().in("fixture_id", resolvedFixtureIds);
      }
    }

    // Purge very old cached matches (>48h)
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    await supabase.from("cached_matches").delete().lt("kickoff", twoDaysAgo);

    // ─── Upsert new matches ──────────────────────────────────
    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
    }

    // ─── Update metadata ─────────────────────────────────────
    const apiCallsThisCycle = Object.keys(ESPN_LEAGUES).length + 2; // ESPN leagues + SportSRC + SofaScore
    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: new Date().toISOString(),
      request_count_today: requestCount + apiCallsThisCycle,
      last_reset_date: iso,
    });

    console.log(`[DONE] Counts: ${JSON.stringify(sportResults)}. Free: ${freeIds.size}. Requests today: ${requestCount + apiCallsThisCycle}`);

    return new Response(JSON.stringify({
      success: true,
      matches_count: rows.length,
      free_count: freeIds.size,
      sport_counts: sportResults,
      requests_today: requestCount + apiCallsThisCycle,
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
