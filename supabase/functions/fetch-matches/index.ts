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
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
// API-Football: try both RapidAPI and direct endpoints
const APIFOOTBALL_RAPID = "https://api-football-v1.p.rapidapi.com/v3";
const APIFOOTBALL_DIRECT = "https://v3.football.api-sports.com";
const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

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

function getSportDurationMs(sport: string): number {
  return (SPORT_DURATIONS_MINUTES[sport?.toLowerCase()] || 120) * 60 * 1000;
}

function getTodayParis(): { iso: string; compact: string; tomorrowCompact: string } {
  const now = new Date();
  const parisStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return { iso: parisStr, compact: parisStr.replace(/-/g, ""), tomorrowCompact: tomorrowStr.replace(/-/g, "") };
}

// ═══════════════════════════════════════════════════════════════════════
// AI PREDICTION ENGINE — SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA — an elite sports prediction intelligence with the analytical depth of a professional quant trader. Produce calibrated, high-value predictions by thinking in probabilities, not opinions.

MANDATORY PROTOCOL for every prediction:
1. CONTEXT AUDIT: Match format, competitive context, key player availability
2. BASE RATE: Historical win rate for this exact context, surface-specific, recent H2H weighted 3x
3. FACTOR ANALYSIS: Form (±2-8%), Fatigue (±1-5%), Key players (±3-15%), Tactical matchup (±1-6%), Motivation (±1-4%), Market signals
4. SYNTHESIS: Combine base rate + adjustments. Flag value_bet only when edge > 4%

SPORT-SPECIFIC:
FOOTBALL: xG > goals > shots. Home +5-8%. UCL fatigue -3%. Draws are predictable.
NBA: B2B = -4%. Altitude -3%. Net rating > W/L. Regress 3pt to mean.
TENNIS: Surface ELO only. Serve dominance on fast surfaces. No cross-surface H2H.
NHL: Goalie = highest impact. PDO > 1.020 = regression. Corsi% best indicator.
NFL: Sharp lines. Wind >15mph = run/unders. QB EPA/play trumps all.

CONFIDENCE: SAFE (≥55% max prob, ≥8/10 signals), MODÉRÉ (35-55%, 4-7/10), RISQUÉ (<35% max prob, ≤3/10)
Probabilities MUST sum to 100%. Analysis in French (2-3 sentences). Never invent data.
For no-draw sports (tennis/basketball): pred_draw = 0.`;

// ─── AI-POWERED PREDICTION (batch all matches in one call) ──────────
interface AIPrediction {
  fixture_id: number;
  pred_home_win: number;
  pred_draw: number;
  pred_away_win: number;
  pred_score_home: number;
  pred_score_away: number;
  pred_over_under: number;
  pred_over_prob: number;
  pred_btts_prob: number;
  pred_confidence: string;
  pred_value_bet: boolean;
  pred_analysis: string;
}

async function generateAIPredictions(
  matches: { fixtureId: number; homeTeam: string; awayTeam: string; sport: string; league: string; kickoff: string }[]
): Promise<Map<number, AIPrediction>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || matches.length === 0) return new Map();

  // Build the user prompt with all matches
  const matchList = matches.map((m, i) =>
    `${i + 1}. [ID:${m.fixtureId}] ${m.homeTeam} vs ${m.awayTeam} | ${m.sport.toUpperCase()} | ${m.league} | ${m.kickoff}`
  ).join("\n");

  const userPrompt = `Analyze these ${matches.length} matches and provide predictions for each.

MATCHES:
${matchList}

For EACH match, you MUST call the "predict_matches" function with your predictions. Each prediction needs:
- fixture_id: the ID provided
- pred_home_win: home win probability (0-100, integer)
- pred_draw: draw probability (0-100, integer, 0 for sports without draws like tennis/basketball/MMA/baseball)
- pred_away_win: away win probability (0-100, integer)
- All three probabilities MUST sum to exactly 100
- pred_score_home: predicted home score (integer)
- pred_score_away: predicted away score (integer)
- pred_over_under: over/under line (e.g. 2.5 for football)
- pred_over_prob: probability of over (0-100)
- pred_btts_prob: probability both teams score (0-100, 0 for non-applicable sports)
- pred_confidence: "SAFE", "MODÉRÉ", or "RISQUÉ"
- pred_value_bet: true if you identify value
- pred_analysis: 2-3 sentence analysis in French explaining key factors

Be rigorous and realistic. Do NOT inflate confidence. Use all 11 analysis dimensions.`;

  try {
    console.log(`[AI] Requesting predictions for ${matches.length} matches...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_matches",
            description: "Submit predictions for all analyzed matches",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      fixture_id: { type: "number" },
                      pred_home_win: { type: "number" },
                      pred_draw: { type: "number" },
                      pred_away_win: { type: "number" },
                      pred_score_home: { type: "number" },
                      pred_score_away: { type: "number" },
                      pred_over_under: { type: "number" },
                      pred_over_prob: { type: "number" },
                      pred_btts_prob: { type: "number" },
                      pred_confidence: { type: "string", enum: ["SAFE", "MODÉRÉ", "RISQUÉ"] },
                      pred_value_bet: { type: "boolean" },
                      pred_analysis: { type: "string" },
                    },
                    required: ["fixture_id", "pred_home_win", "pred_draw", "pred_away_win", "pred_score_home", "pred_score_away", "pred_over_under", "pred_over_prob", "pred_btts_prob", "pred_confidence", "pred_value_bet", "pred_analysis"],
                  },
                },
              },
              required: ["predictions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "predict_matches" } },
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI] Gateway error ${response.status}: ${errText}`);
      return new Map();
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("[AI] No tool call in response");
      return new Map();
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const predictions = parsed.predictions as AIPrediction[];
    
    const map = new Map<number, AIPrediction>();
    for (const p of predictions) {
      // Validate probabilities sum to 100
      const total = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(total - 100) > 2) {
        // Normalize
        p.pred_home_win = Math.round((p.pred_home_win / total) * 100);
        p.pred_draw = Math.round((p.pred_draw / total) * 100);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }
      map.set(p.fixture_id, p);
    }
    
    console.log(`[AI] Successfully generated ${map.size}/${matches.length} predictions`);
    return map;
  } catch (e) {
    console.error("[AI] Prediction error:", e);
    return new Map();
  }
}

// ─── FALLBACK DETERMINISTIC PREDICTION ENGINE ────────────────────────
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

function generateFallbackPrediction(homeTeam: string, awayTeam: string, fixtureId: number, sport: string) {
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
  const analysis = `Analyse basée sur le modèle statistique. ${fav} présente un avantage face à ${underdog}. Confiance : ${confidence}.`;

  return {
    pred_home_win: predHome, pred_draw: predDraw, pred_away_win: predAway,
    pred_score_home: predScoreHome, pred_score_away: predScoreAway,
    pred_over_under: sport === "football" ? 2.5 : overLine, pred_over_prob: overProb,
    pred_btts_prob: bttsProb, pred_confidence: confidence, pred_value_bet: valueBet, pred_analysis: analysis,
  };
}

function computePredictionAiScore(prediction: Pick<AIPrediction, "pred_home_win" | "pred_draw" | "pred_away_win" | "pred_confidence">): number {
  const maxProb = Math.max(
    Number(prediction.pred_home_win || 0),
    Number(prediction.pred_draw || 0),
    Number(prediction.pred_away_win || 0),
  );
  const confidence = String(prediction.pred_confidence || "").toUpperCase();

  if (confidence === "SAFE") return Math.min(95, Math.max(78, maxProb + 12));
  if (confidence === "MODÉRÉ" || confidence === "MODERE") return Math.min(79, Math.max(63, maxProb + 5));
  return Math.min(61, Math.max(45, maxProb + 3));
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

// ─── FETCH SOFASCORE (TENNIS / BASKETBALL) ─────────────────────────
const SOFASCORE_BASE = "https://api.sofascore.com/api/v1/sport";

async function fetchSofaScore(sport: string, dateISO: string): Promise<NormalizedMatch[]> {
  const sportPath = sport === "tennis" ? "tennis" : "basketball";
  const url = `${SOFASCORE_BASE}/${sportPath}/scheduled-events/${dateISO}`;
  console.log(`[API: SofaScore] ${sport.toUpperCase()} - ${dateISO} - fetching`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Cache-Control": "no-cache",
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
      if (count >= 50) break;
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

// ─── FETCH TENNIS FROM THESPORTSDB (FREE FALLBACK) ─────────────────
async function fetchTennisFromTheSportsDB(dateISO: string): Promise<NormalizedMatch[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${dateISO}&s=Tennis`;
  console.log(`[API: TheSportsDB] TENNIS - ${dateISO} - fetching`);
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[TheSportsDB] Tennis error: ${res.status}`); return []; }
    const json = await res.json();
    const events = json.events || [];
    const now = Date.now();
    const results: NormalizedMatch[] = [];
    for (const e of events) {
      if (e.strStatus === "Match Finished" || e.strStatus === "FT") continue;
      const dateStr = `${e.dateEvent}T${e.strTime || "12:00:00"}+00:00`;
      const ts = new Date(dateStr).getTime();
      if (!ts || isNaN(ts) || ts <= now) continue;
      const leagueName = e.strLeague || "ATP/WTA";
      if (leagueName.toLowerCase().includes("doubles")) continue;
      results.push({
        id: `tsdb_${e.idEvent}`, sport: "tennis",
        league: leagueName, country: e.strCountry || "",
        homeTeam: e.strHomeTeam || "Player A", awayTeam: e.strAwayTeam || "Player B",
        homeLogo: e.strHomeTeamBadge || null, awayLogo: e.strAwayTeamBadge || null,
        timestamp: ts, source: "thesportsdb",
      });
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`[API: TheSportsDB] TENNIS - ${results.length} upcoming`);
    return results;
  } catch (e) { console.error(`[TheSportsDB] Tennis error:`, e); return []; }
}

// ─── ESPN LEAGUES CONFIG ────────────────────────────────────────────
const ESPN_LEAGUES: Record<string, { path: string; label: string }[]> = {
  football: [
    { path: "soccer/eng.1", label: "Premier League" },
    { path: "soccer/esp.1", label: "La Liga" },
    { path: "soccer/ger.1", label: "Bundesliga" },
    { path: "soccer/ita.1", label: "Serie A" },
    { path: "soccer/fra.1", label: "Ligue 1" },
    { path: "soccer/uefa.champions", label: "Champions League" },
    { path: "soccer/uefa.europa", label: "Europa League" },
    { path: "soccer/uefa.europa.conf", label: "Conference League" },
    { path: "soccer/por.1", label: "Liga Portugal" },
    { path: "soccer/ned.1", label: "Eredivisie" },
    { path: "soccer/tur.1", label: "Süper Lig" },
    { path: "soccer/bel.1", label: "Pro League" },
    { path: "soccer/rou.1", label: "Liga 1 Romania" },
    { path: "soccer/sco.1", label: "Scottish Premiership" },
    { path: "soccer/bra.1", label: "Brasileirão" },
    { path: "soccer/arg.1", label: "Liga Argentina" },
    { path: "soccer/mex.1", label: "Liga MX" },
    { path: "soccer/usa.1", label: "MLS" },
    { path: "soccer/gre.1", label: "Super League Greece" },
    { path: "soccer/sui.1", label: "Super League Suisse" },
    { path: "soccer/aus.1", label: "A-League" },
    { path: "soccer/jpn.1", label: "J1 League" },
    { path: "soccer/chn.1", label: "Chinese Super League" },
    { path: "soccer/kor.1", label: "K League 1" },
    { path: "soccer/ind.1", label: "Indian Super League" },
    { path: "soccer/col.1", label: "Liga BetPlay" },
    { path: "soccer/chi.1", label: "Primera División Chile" },
    { path: "soccer/den.1", label: "Superliga Denmark" },
    { path: "soccer/nor.1", label: "Eliteserien" },
    { path: "soccer/swe.1", label: "Allsvenskan" },
    { path: "soccer/pol.1", label: "Ekstraklasa" },
    { path: "soccer/cze.1", label: "Czech First League" },
    { path: "soccer/aut.1", label: "Austrian Bundesliga" },
    { path: "soccer/srp.1", label: "Serbian SuperLiga" },
    { path: "soccer/ukr.1", label: "Ukrainian Premier League" },
    { path: "soccer/rus.1", label: "Russian Premier League" },
    { path: "soccer/isl.1", label: "Úrvalsdeild Iceland" },
    { path: "soccer/cro.1", label: "Croatian First Football League" },
    { path: "soccer/per.1", label: "Liga 1 Peru" },
    { path: "soccer/ecu.1", label: "LigaPro Ecuador" },
    { path: "soccer/par.1", label: "Division Profesional Paraguay" },
    { path: "soccer/uru.1", label: "Primera División Uruguay" },
    { path: "soccer/ven.1", label: "Primera División Venezuela" },
    { path: "soccer/egy.1", label: "Egyptian Premier League" },
    { path: "soccer/rsa.1", label: "South African Premier Division" },
    { path: "soccer/sau.1", label: "Saudi Pro League" },
    { path: "soccer/conmebol.libertadores", label: "Copa Libertadores" },
    { path: "soccer/conmebol.sudamericana", label: "Copa Sudamericana" },
    { path: "soccer/concacaf.champions", label: "CONCACAF Champions Cup" },
    { path: "soccer/fifa.friendly", label: "International Friendlies" },
    { path: "soccer/fifa.world", label: "FIFA World Cup 2026" },
    { path: "soccer/fifa.worldq.uefa", label: "WC Qualifiers UEFA" },
    { path: "soccer/fifa.worldq.conmebol", label: "WC Qualifiers CONMEBOL" },
    { path: "soccer/fifa.worldq.concacaf", label: "WC Qualifiers CONCACAF" },
    { path: "soccer/fifa.worldq.afc", label: "WC Qualifiers AFC" },
    { path: "soccer/fifa.worldq.caf", label: "WC Qualifiers CAF" },
    { path: "soccer/fifa.worldq.ofc", label: "WC Qualifiers OFC" },
    { path: "soccer/eng.2", label: "Championship" },
    { path: "soccer/esp.2", label: "La Liga 2" },
    { path: "soccer/fra.2", label: "Ligue 2" },
    { path: "soccer/ger.2", label: "2. Bundesliga" },
    { path: "soccer/ita.2", label: "Serie B" },
  ],
  tennis: [
    { path: "tennis/atp", label: "ATP Tour" },
    { path: "tennis/wta", label: "WTA Tour" },
  ],
  rugby: [
    { path: "rugby/270557", label: "Top 14" },
    { path: "rugby/242041", label: "Premiership" },
    { path: "rugby/244293", label: "URC" },
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
        const state = evt.status?.type?.state;
        // Include upcoming ("pre") AND live ("in") matches — never exclude
        if (state !== "pre" && state !== "in") continue;
        const eventDate = evt.date ? new Date(evt.date).getTime() : 0;
        if (!eventDate) continue;
        // For upcoming: must be in the future. For live: always include.
        if (state === "pre" && eventDate <= now) continue;
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
  console.log(`[API: ESPN] ${sport.toUpperCase()} - ${all.length} upcoming+live total`);
  return all;
}

// ─── FETCH ESPN WITH EXTENDED DATE RANGE (for sparse sports) ────────
async function fetchESPNExtended(sport: string, compact: string, tomorrowCompact: string): Promise<NormalizedMatch[]> {
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
    if (allMatches.length >= 30) break;
  }

  return allMatches;
}

// ─── API-FOOTBALL (RapidAPI) — ENRICHMENT: lineups, odds, stats, H2H ─
interface APIFootballFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { name: string; country: string };
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
}

function getAPIFootballHeaders(): Record<string, string> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY") || "";
  // Always use RapidAPI headers — direct api-sports.com has TLS issues with Deno
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" };
}

async function fetchAPIFootballFixtures(dateISO: string): Promise<APIFootballFixture[]> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) { console.log("[API-Football] No API key configured"); return []; }
  try {
    console.log(`[API-Football] Using RapidAPI endpoint for ${dateISO}`);
    const res = await fetch(`${APIFOOTBALL_RAPID}/fixtures?date=${dateISO}&status=NS`, {
      headers: getAPIFootballHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[API-Football] Fixtures error ${res.status}: ${body.slice(0, 300)}`);
      return [];
    }
    const json = await res.json();
    console.log(`[API-Football] Found ${json.response?.length || 0} fixtures for ${dateISO}`);
    return json.response || [];
  } catch (e) { console.error("[API-Football] Fixtures error:", e); return []; }
}

async function fetchAPIFootballLineups(fixtureId: number): Promise<{ home: any[]; away: any[] } | null> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${APIFOOTBALL_RAPID}/fixtures/lineups?fixture=${fixtureId}`, {
      headers: getAPIFootballHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.response || [];
    if (data.length < 2) return null;
    return {
      home: (data[0].startXI || []).map((p: any) => ({ name: p.player?.name, number: p.player?.number, pos: p.player?.pos })),
      away: (data[1].startXI || []).map((p: any) => ({ name: p.player?.name, number: p.player?.number, pos: p.player?.pos })),
    };
  } catch { return null; }
}

async function fetchAPIFootballOdds(fixtureId: number): Promise<any | null> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${APIFOOTBALL_RAPID}/odds?fixture=${fixtureId}`, {
      headers: getAPIFootballHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const bookmakers = json.response?.[0]?.bookmakers || [];
    if (bookmakers.length === 0) return null;
    const bk = bookmakers[0];
    const result: Record<string, any> = { bookmaker: bk.name };
    for (const bet of (bk.bets || [])) {
      const key = bet.name?.toLowerCase().replace(/\s+/g, "_") || "unknown";
      result[key] = (bet.values || []).map((v: any) => ({ value: v.value, odd: v.odd }));
    }
    return result;
  } catch { return null; }
}

async function fetchAPIFootballH2H(homeId: number, awayId: number): Promise<any[] | null> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${APIFOOTBALL_RAPID}/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`, {
      headers: getAPIFootballHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.response || []).map((f: any) => ({
      date: f.fixture?.date, home: f.teams?.home?.name, away: f.teams?.away?.name,
      homeGoals: f.goals?.home, awayGoals: f.goals?.away,
    }));
  } catch { return null; }
}

async function fetchAPIFootballStats(fixtureId: number): Promise<any | null> {
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${APIFOOTBALL_RAPID}/fixtures/statistics?fixture=${fixtureId}`, {
      headers: getAPIFootballHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const teams = json.response || [];
    if (teams.length < 2) return null;
    const extract = (team: any) => {
      const stats: Record<string, any> = { team: team.team?.name };
      for (const s of (team.statistics || [])) { stats[s.type?.toLowerCase().replace(/\s+/g, "_") || ""] = s.value; }
      return stats;
    };
    return { home: extract(teams[0]), away: extract(teams[1]) };
  } catch { return null; }
}

// ─── SPORTMONKS — ENRICHMENT: leagues-first approach ────────────────
async function fetchSportMonksAvailableLeagueIds(): Promise<number[]> {
  const apiKey = Deno.env.get("SPORTMONKS_API_KEY");
  if (!apiKey) return [];
  try {
    const res = await fetch(`${SPORTMONKS_BASE}/leagues?api_token=${apiKey}&per_page=50`);
    if (!res.ok) return [];
    const json = await res.json();
    const ids = (json.data || []).map((l: any) => l.id);
    console.log(`[SportMonks] Available leagues: ${ids.length} — IDs: ${ids.join(",")}`);
    return ids;
  } catch { return []; }
}

async function fetchSportMonksFixtures(dateISO: string): Promise<any[]> {
  const apiKey = Deno.env.get("SPORTMONKS_API_KEY");
  if (!apiKey) { console.log("[SportMonks] No API key configured"); return []; }

  // Step 1: Get available league IDs
  const leagueIds = await fetchSportMonksAvailableLeagueIds();
  if (leagueIds.length === 0) {
    console.log("[SportMonks] No accessible leagues, skipping");
    return [];
  }

  // Step 2: Try fetching fixtures for each accessible league
  const allFixtures: any[] = [];
  for (const leagueId of leagueIds) {
    try {
      const url = `${SPORTMONKS_BASE}/fixtures/date/${dateISO}?api_token=${apiKey}&include=participants;scores;lineups;statistics&filters=fixtureLeagues:${leagueId}&per_page=50`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const fixtures = json.data || [];
      if (fixtures.length > 0) {
        console.log(`[SportMonks] League ${leagueId}: ${fixtures.length} fixtures`);
        allFixtures.push(...fixtures);
      }
    } catch { /* skip league */ }
  }

  // Step 3: If league-based fetch returned nothing, try the season standings for team stats
  if (allFixtures.length === 0) {
    // Fallback: try date-based (may work on some plans)
    try {
      const url = `${SPORTMONKS_BASE}/fixtures/date/${dateISO}?api_token=${apiKey}&include=participants;scores;lineups;statistics&per_page=50`;
      console.log(`[SportMonks] Fallback date-based fetch for ${dateISO}`);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.message) console.error(`[SportMonks] API message: ${json.message}`);
        const fixtures = json.data || [];
        console.log(`[SportMonks] Found ${fixtures.length} fixtures (date-based)`);
        allFixtures.push(...fixtures);
      }
    } catch { /* skip */ }
  }

  console.log(`[SportMonks] Total fixtures: ${allFixtures.length}`);
  return allFixtures;
}

function parseSportMonksEnrichment(fixture: any): {
  lineups: { home: any[]; away: any[] } | null;
  odds: any | null;
  stats: any | null;
} {
  const lineups = fixture.lineups && fixture.lineups.length > 0
    ? {
        home: fixture.lineups.filter((l: any) => l.team_id === fixture.participants?.[0]?.id)
          .map((l: any) => ({ name: l.player_name || l.common_name, number: l.jersey_number, pos: l.position_name })),
        away: fixture.lineups.filter((l: any) => l.team_id === fixture.participants?.[1]?.id)
          .map((l: any) => ({ name: l.player_name || l.common_name, number: l.jersey_number, pos: l.position_name })),
      }
    : null;

  const odds = fixture.odds && fixture.odds.length > 0
    ? fixture.odds.slice(0, 5).map((o: any) => ({
        market: o.market_description || o.name,
        label: o.label, value: o.value, probability: o.probability,
      }))
    : null;

  const stats = fixture.statistics && fixture.statistics.length > 0
    ? fixture.statistics.reduce((acc: any, s: any) => {
        const key = (s.type?.name || s.type_id || "unknown").toString().toLowerCase().replace(/\s+/g, "_");
        if (!acc[key]) acc[key] = {};
        const side = s.participant_id === fixture.participants?.[0]?.id ? "home" : "away";
        acc[key][side] = s.data?.value ?? s.value ?? null;
        return acc;
      }, {})
    : null;

  return { lineups, odds, stats };
}

// ─── SOFASCORE RAPIDAPI — ENRICHMENT: events, lineups, stats, odds ──
const SOFASCORE_RAPID_BASE = "https://sportapi7.p.rapidapi.com/api/v1";

function getSofaScoreRapidHeaders(): Record<string, string> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY") || "";
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "sportapi7.p.rapidapi.com", "Content-Type": "application/json" };
}

async function fetchSofaScoreRapidEvents(dateISO: string, sport: string): Promise<any[]> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) { console.log("[SofaScore-Rapid] No API key"); return []; }
  const sportPath = sport === "football" ? "football" : sport === "basketball" ? "basketball" : sport === "tennis" ? "tennis" : sport;
  try {
    const res = await fetch(`${SOFASCORE_RAPID_BASE}/sport/${sportPath}/scheduled-events/${dateISO}`, {
      headers: getSofaScoreRapidHeaders(),
    });
    if (!res.ok) { console.error(`[SofaScore-Rapid] ${sport} events error: ${res.status}`); return []; }
    const json = await res.json();
    const events = json.events || [];
    console.log(`[SofaScore-Rapid] ${sport} — ${events.length} events for ${dateISO}`);
    return events;
  } catch (e) { console.error(`[SofaScore-Rapid] ${sport} error:`, e); return []; }
}

async function fetchSofaScoreRapidLineups(eventId: number): Promise<{ home: any[]; away: any[] } | null> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${SOFASCORE_RAPID_BASE}/event/${eventId}/lineups`, {
      headers: getSofaScoreRapidHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const extract = (team: any) => (team?.players || []).flatMap((row: any) =>
      (row.players || [row]).map((p: any) => ({
        name: p.player?.name || p.name, number: p.shirtNumber || p.jerseyNumber,
        pos: p.position || p.player?.position, rating: p.statistics?.rating,
      }))
    );
    return { home: extract(json.home), away: extract(json.away) };
  } catch { return null; }
}

async function fetchSofaScoreRapidStats(eventId: number): Promise<any | null> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${SOFASCORE_RAPID_BASE}/event/${eventId}/statistics`, {
      headers: getSofaScoreRapidHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result: Record<string, any> = {};
    for (const period of (json.statistics || [])) {
      for (const group of (period.groups || [])) {
        for (const item of (group.statisticsItems || [])) {
          const key = (item.name || "").toLowerCase().replace(/\s+/g, "_");
          result[key] = { home: item.home, away: item.away };
        }
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch { return null; }
}

async function fetchSofaScoreRapidOdds(eventId: number): Promise<any | null> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${SOFASCORE_RAPID_BASE}/event/${eventId}/odds/1/all`, {
      headers: getSofaScoreRapidHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const markets = json.markets || [];
    if (markets.length === 0) return null;
    return markets.slice(0, 10).map((m: any) => ({
      market: m.marketName || m.sourceId, choices: (m.choices || []).map((c: any) => ({
        name: c.name, odds: c.fractionalValue || c.sourceId, change: c.change,
      })),
    }));
  } catch { return null; }
}

async function fetchSofaScoreRapidH2H(eventId: number): Promise<any[] | null> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(`${SOFASCORE_RAPID_BASE}/event/${eventId}/h2h/events`, {
      headers: getSofaScoreRapidHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const events = json.events || [];
    return events.slice(0, 5).map((e: any) => ({
      date: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null,
      home: e.homeTeam?.name, away: e.awayTeam?.name,
      homeGoals: e.homeScore?.current, awayGoals: e.awayScore?.current,
    }));
  } catch { return null; }
}

// ─── TANK01 MLB — ENRICHMENT: live scores, top performers ───────────
const TANK01_MLB_BASE = "https://tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com";

function getTank01Headers(): Record<string, string> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY") || "";
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com", "Content-Type": "application/json" };
}

async function fetchTank01MLBScores(dateCompact: string): Promise<Map<string, any>> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return new Map();
  try {
    const res = await fetch(`${TANK01_MLB_BASE}/getMLBScoresOnly?gameDate=${dateCompact}&topPerformers=true`, {
      headers: getTank01Headers(),
    });
    if (!res.ok) { console.error(`[Tank01-MLB] error: ${res.status}`); return new Map(); }
    const json = await res.json();
    const body = json.body || json;
    const games = Array.isArray(body) ? body : [];
    console.log(`[Tank01-MLB] Found ${games.length} MLB games for ${dateCompact}`);
    const map = new Map<string, any>();
    for (const g of games) {
      const home = (g.home || g.homeTeam || "").toLowerCase().trim();
      const away = (g.away || g.awayTeam || "").toLowerCase().trim();
      if (home && away) {
        map.set(`${home}_${away}`, {
          homeScore: g.homeResult ?? g.homeScore ?? null,
          awayScore: g.awayResult ?? g.awayScore ?? null,
          status: g.gameStatus || g.statusType || null,
          topPerformers: g.topPerformers || null,
          innings: g.lineScore || null,
          venue: g.venue || null,
          weather: g.weather || null,
        });
      }
    }
    return map;
  } catch (e) { console.error("[Tank01-MLB] error:", e); return new Map(); }
}

// ─── ALLSPORTSAPI2 — ENRICHMENT: standings, team stats ──────────────
const ALLSPORTS_BASE = "https://allsportsapi2.p.rapidapi.com/api";

function getAllSportsHeaders(): Record<string, string> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY") || "";
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "allsportsapi2.p.rapidapi.com", "Content-Type": "application/json" };
}

// Tournament IDs for major leagues
const ALLSPORTS_TOURNAMENTS: Record<string, { tournamentId: number; seasonId: number }> = {
  "premier league": { tournamentId: 17, seasonId: 76986 },
  "la liga": { tournamentId: 8, seasonId: 76851 },
  "bundesliga": { tournamentId: 35, seasonId: 76910 },
  "serie a": { tournamentId: 23, seasonId: 76834 },
  "ligue 1": { tournamentId: 34, seasonId: 76900 },
};

async function fetchAllSportsStandings(tournamentId: number, seasonId: number): Promise<Map<string, any>> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return new Map();
  try {
    const res = await fetch(`${ALLSPORTS_BASE}/tournament/${tournamentId}/season/${seasonId}/standings/total`, {
      headers: getAllSportsHeaders(),
    });
    if (!res.ok) { console.error(`[AllSports] standings error: ${res.status}`); return new Map(); }
    const json = await res.json();
    const standings = json.standings?.[0]?.rows || [];
    const map = new Map<string, any>();
    for (const row of standings) {
      const teamName = (row.team?.name || "").toLowerCase().trim();
      if (teamName) {
        map.set(teamName, {
          position: row.position,
          matches: row.matches,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goalsFor: row.scoresFor,
          goalsAgainst: row.scoresAgainst,
          points: row.points,
        });
      }
    }
    console.log(`[AllSports] Standings for tournament ${tournamentId}: ${map.size} teams`);
    return map;
  } catch (e) { console.error("[AllSports] standings error:", e); return new Map(); }
}

// ─── NBA FREE DATA API — ENRICHMENT: team logos, metadata ───────────
const NBA_FREE_BASE = "https://nba-api-free-data.p.rapidapi.com";

function getNBAFreeHeaders(): Record<string, string> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY") || "";
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "nba-api-free-data.p.rapidapi.com", "Content-Type": "application/json" };
}

async function fetchNBATeams(): Promise<Map<string, { id: string; name: string; abbrev: string; logo: string; logoDark: string }>> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return new Map();
  const divisions = ["atlantic", "central", "southeast", "northwest", "pacific", "southwest"];
  const map = new Map<string, any>();
  try {
    const results = await Promise.all(
      divisions.map(div =>
        fetch(`${NBA_FREE_BASE}/nba-${div}-team-list`, { headers: getNBAFreeHeaders() })
          .then(r => r.ok ? r.json() : { response: { teamList: [] } })
          .catch(() => ({ response: { teamList: [] } }))
      )
    );
    for (const json of results) {
      for (const t of (json.response?.teamList || [])) {
        const key = (t.name || "").toLowerCase().trim();
        if (key) {
          map.set(key, { id: t.id, name: t.name, abbrev: t.abbrev, logo: t.logo, logoDark: t.logoDark });
          // Also map short name for fuzzy matching
          const shortKey = (t.shortName || "").toLowerCase().trim();
          if (shortKey) map.set(shortKey, map.get(key));
        }
      }
    }
    console.log(`[NBA-Free] Loaded ${map.size} NBA teams across ${divisions.length} divisions`);
  } catch (e) { console.error("[NBA-Free] error:", e); }
  return map;
}

// ─── NHL API5 — ENRICHMENT: rosters and player stats ────────────────
const NHL_API5_BASE = "https://nhl-api5.p.rapidapi.com";

function getNHLAPI5Headers(): Record<string, string> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY") || "";
  return { "x-rapidapi-key": apiKey, "x-rapidapi-host": "nhl-api5.p.rapidapi.com", "Content-Type": "application/json" };
}

async function fetchNHLSchedule(dateISO: string): Promise<Map<string, any>> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey) return new Map();
  try {
    const [year, month, day] = dateISO.split("-");
    const res = await fetch(`${NHL_API5_BASE}/nhlschedule?year=${year}&month=${month}&day=${day}`, {
      headers: getNHLAPI5Headers(),
    });
    if (!res.ok) { console.error(`[NHL-API5] schedule error: ${res.status}`); return new Map(); }
    const json = await res.json();
    // Response format: { "20260330": { games: [...], calendar: [...] } }
    const dateKey = `${year}${month}${day}`;
    const dayData = json[dateKey] || json;
    const gamesList = dayData.games || [];
    console.log(`[NHL-API5] Found ${gamesList.length} NHL games for ${dateISO}`);
    const map = new Map<string, any>();
    for (const g of gamesList) {
      // ESPN-like structure: competitions[0].competitors
      const comp = g.competitions?.[0];
      if (!comp) continue;
      const competitors = comp.competitors || [];
      const homeComp = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
      const awayComp = competitors.find((c: any) => c.homeAway === "away") || competitors[1];
      if (!homeComp || !awayComp) continue;
      const home = (homeComp.team?.displayName || "").toLowerCase().trim();
      const away = (awayComp.team?.displayName || "").toLowerCase().trim();
      if (home && away) {
        map.set(`${home}_${away}`, {
          homeId: parseInt(homeComp.team?.id) || null,
          awayId: parseInt(awayComp.team?.id) || null,
          venue: comp.venue?.fullName || null,
          homeScore: homeComp.score != null ? parseInt(homeComp.score) : null,
          awayScore: awayComp.score != null ? parseInt(awayComp.score) : null,
          status: g.status?.type?.state || null,
          broadcast: comp.broadcast || null,
        });
      }
    }
    return map;
  } catch (e) { console.error("[NHL-API5] error:", e); return new Map(); }
}

async function fetchNHLRoster(teamId: number): Promise<any[] | null> {
  const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
  if (!apiKey || !teamId) return null;
  try {
    const res = await fetch(`${NHL_API5_BASE}/players/id?teamId=${teamId}`, {
      headers: getNHLAPI5Headers(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const players = json.body || json;
    const roster = Array.isArray(players) ? players : [];
    return roster.slice(0, 25).map((p: any) => ({
      name: p.longName || p.playerName || p.name,
      number: p.jerseyNum || p.jerseyNumber,
      pos: p.pos || p.position,
      team: p.team || null,
    }));
  } catch { return null; }
}

// ─── ENRICHMENT ORCHESTRATOR ─────────────────────────────────────────
async function enrichMatchesWithAPIs(
  rows: any[], dateISO: string
): Promise<void> {
  console.log(`[ENRICH] Starting enrichment for ${rows.length} matches...`);
  const dateCompact = dateISO.replace(/-/g, "");

  // 1. Fetch all enrichment data sources in parallel
  const allSportsStandingsPromises: Promise<Map<string, any>>[] = [];
  for (const [, cfg] of Object.entries(ALLSPORTS_TOURNAMENTS)) {
    allSportsStandingsPromises.push(fetchAllSportsStandings(cfg.tournamentId, cfg.seasonId));
  }

  const [apiFootballFixtures, sportMonksFixtures, sofaFootball, sofaBasketball, sofaTennis, mlbData, nhlData, nbaTeams, ...allSportsResults] = await Promise.all([
    fetchAPIFootballFixtures(dateISO),
    fetchSportMonksFixtures(dateISO),
    fetchSofaScoreRapidEvents(dateISO, "football"),
    fetchSofaScoreRapidEvents(dateISO, "basketball"),
    fetchSofaScoreRapidEvents(dateISO, "tennis"),
    fetchTank01MLBScores(dateCompact),
    fetchNHLSchedule(dateISO),
    fetchNBATeams(),
    ...allSportsStandingsPromises,
  ]);

  // Merge all AllSports standings into one map
  const allSportsStandings = new Map<string, any>();
  for (const standingsMap of allSportsResults) {
    for (const [k, v] of standingsMap) allSportsStandings.set(k, v);
  }
  console.log(`[AllSports] Total standings: ${allSportsStandings.size} teams`);

  // Build lookup maps
  const apiFootballMap = new Map<string, APIFootballFixture>();
  for (const f of apiFootballFixtures) {
    const key = `${f.teams.home.name.toLowerCase().trim()}_${f.teams.away.name.toLowerCase().trim()}`;
    apiFootballMap.set(key, f);
  }

  const sportMonksMap = new Map<string, any>();
  for (const f of sportMonksFixtures) {
    const parts = f.participants || [];
    if (parts.length >= 2) {
      const key = `${(parts[0].name || "").toLowerCase().trim()}_${(parts[1].name || "").toLowerCase().trim()}`;
      sportMonksMap.set(key, f);
    }
  }

  // SofaScore RapidAPI map (all sports)
  const sofaRapidMap = new Map<string, any>();
  for (const evt of [...sofaFootball, ...sofaBasketball, ...sofaTennis]) {
    const home = (evt.homeTeam?.name || evt.homeTeam?.shortName || "").toLowerCase().trim();
    const away = (evt.awayTeam?.name || evt.awayTeam?.shortName || "").toLowerCase().trim();
    if (home && away) sofaRapidMap.set(`${home}_${away}`, evt);
  }

  console.log(`[ENRICH] Sources: API-Football=${apiFootballFixtures.length}, SportMonks=${sportMonksFixtures.length}, SofaScore-Rapid=${sofaRapidMap.size}`);

  // 2. Enrich all matches
  let apiFootballCalls = 0;
  let sofaRapidCalls = 0;
  const MAX_APIFOOTBALL_ENRICHMENTS = 20;
  const MAX_SOFA_RAPID_ENRICHMENTS = 50; // increased for better coverage

  for (const row of rows) {
    const key = `${row.home_team.toLowerCase().trim()}_${row.away_team.toLowerCase().trim()}`;
    const sources: string[] = [...(row.data_sources || [])];

    // A) SportMonks (football only, included data from accessible leagues)
    if (row.sport === "football") {
      const smFixture = sportMonksMap.get(key);
      if (smFixture) {
        const { lineups, odds, stats } = parseSportMonksEnrichment(smFixture);
        if (lineups) { row.home_lineup = lineups.home; row.away_lineup = lineups.away; }
        if (odds) { row.odds = odds; row.odds_updated_at = new Date().toISOString(); }
        if (stats) row.match_stats = stats;
        if (!sources.includes("sportmonks")) sources.push("sportmonks");
      }
    }

    // B) API-Football (football only, extra API calls)
    if (row.sport === "football") {
      const afFixture = apiFootballMap.get(key);
      if (afFixture && apiFootballCalls < MAX_APIFOOTBALL_ENRICHMENTS) {
        const afId = afFixture.fixture.id;
        const needLineups = !row.home_lineup;
        const needOdds = !row.odds;
        const [lineups, odds, h2h] = await Promise.all([
          needLineups ? fetchAPIFootballLineups(afId) : Promise.resolve(null),
          needOdds ? fetchAPIFootballOdds(afId) : Promise.resolve(null),
          fetchAPIFootballH2H(afFixture.teams.home.id, afFixture.teams.away.id),
        ]);
        apiFootballCalls += (needLineups ? 1 : 0) + (needOdds ? 1 : 0) + 1;
        if (lineups && !row.home_lineup) { row.home_lineup = lineups.home; row.away_lineup = lineups.away; }
        if (odds && !row.odds) { row.odds = odds; row.odds_updated_at = new Date().toISOString(); }
        if (h2h) row.h2h_data = h2h;
        if (!sources.includes("api-football")) sources.push("api-football");
      }
    }

    // C) SofaScore RapidAPI (ALL sports — lineups, stats, odds, H2H)
    const sofaEvt = sofaRapidMap.get(key);
    if (sofaEvt && sofaRapidCalls < MAX_SOFA_RAPID_ENRICHMENTS) {
      const evtId = sofaEvt.id;
      const needLineups = !row.home_lineup;
      const needStats = !row.match_stats;
      const needOdds = !row.odds;
      const needH2H = !row.h2h_data;

      const [lineups, stats, odds, h2h] = await Promise.all([
        needLineups ? fetchSofaScoreRapidLineups(evtId) : Promise.resolve(null),
        needStats ? fetchSofaScoreRapidStats(evtId) : Promise.resolve(null),
        needOdds ? fetchSofaScoreRapidOdds(evtId) : Promise.resolve(null),
        needH2H ? fetchSofaScoreRapidH2H(evtId) : Promise.resolve(null),
      ]);
      sofaRapidCalls += (needLineups ? 1 : 0) + (needStats ? 1 : 0) + (needOdds ? 1 : 0) + (needH2H ? 1 : 0);

      if (lineups && !row.home_lineup) { row.home_lineup = lineups.home; row.away_lineup = lineups.away; }
      if (stats && !row.match_stats) row.match_stats = stats;
      if (odds && !row.odds) { row.odds = odds; row.odds_updated_at = new Date().toISOString(); }
      if (h2h && !row.h2h_data) row.h2h_data = h2h;
      if (!sources.includes("sofascore-rapid")) sources.push("sofascore-rapid");
    }

    // D) Tank01 MLB (baseball only — live scores, top performers, venue, weather)
    if (row.sport === "baseball") {
      const mlbKey = `${row.home_team.toLowerCase().trim()}_${row.away_team.toLowerCase().trim()}`;
      const mlbGame = mlbData.get(mlbKey);
      if (mlbGame) {
        if (mlbGame.topPerformers || mlbGame.innings || mlbGame.venue) {
          row.match_stats = {
            ...(row.match_stats || {}),
            topPerformers: mlbGame.topPerformers,
            innings: mlbGame.innings,
            venue: mlbGame.venue,
            weather: mlbGame.weather,
          };
        }
        if (mlbGame.homeScore != null) row.home_score = parseInt(mlbGame.homeScore) || null;
        if (mlbGame.awayScore != null) row.away_score = parseInt(mlbGame.awayScore) || null;
        if (!sources.includes("tank01-mlb")) sources.push("tank01-mlb");
      }
    }

    // E) NHL API5 (hockey only — rosters, venue, scores)
    if (row.sport === "hockey") {
      const nhlKey = `${row.home_team.toLowerCase().trim()}_${row.away_team.toLowerCase().trim()}`;
      const nhlGame = nhlData.get(nhlKey);
      if (nhlGame) {
        if (nhlGame.venue) {
          row.match_stats = { ...(row.match_stats || {}), venue: nhlGame.venue };
        }
        if (nhlGame.homeScore != null) row.home_score = parseInt(nhlGame.homeScore) || null;
        if (nhlGame.awayScore != null) row.away_score = parseInt(nhlGame.awayScore) || null;
        // Fetch rosters if we don't have lineups
        if (!row.home_lineup && nhlGame.homeId && nhlGame.awayId) {
          const [homeRoster, awayRoster] = await Promise.all([
            fetchNHLRoster(nhlGame.homeId),
            fetchNHLRoster(nhlGame.awayId),
          ]);
          if (homeRoster) row.home_lineup = homeRoster;
          if (awayRoster) row.away_lineup = awayRoster;
        }
        if (!sources.includes("nhl-api5")) sources.push("nhl-api5");
      }
    }

    // F) Tennis API (tennis only — player profiles: nationality, age)
    if (row.sport === "tennis") {
      const homePlayer = row.home_team;
      const awayPlayer = row.away_team;
      const lastName = (name: string) => name.split(" ").pop() || name;
      try {
        const apiKey = Deno.env.get("SOFASCORE_RAPIDAPI_KEY");
        if (apiKey && !row.match_stats?.players) {
          const [homeRes, awayRes] = await Promise.all([
            fetch(`https://tennis-api-atp-wta-itf.p.rapidapi.com/tennis/v2/search?search=${encodeURIComponent(lastName(homePlayer))}`, {
              headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": "tennis-api-atp-wta-itf.p.rapidapi.com", "Content-Type": "application/json" },
            }).catch(() => null),
            fetch(`https://tennis-api-atp-wta-itf.p.rapidapi.com/tennis/v2/search?search=${encodeURIComponent(lastName(awayPlayer))}`, {
              headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": "tennis-api-atp-wta-itf.p.rapidapi.com", "Content-Type": "application/json" },
            }).catch(() => null),
          ]);
          const findPlayer = async (res: Response | null, fullName: string) => {
            if (!res || !res.ok) return null;
            const json = await res.json();
            for (const cat of (json.data || [])) {
              for (const p of (cat.result || [])) {
                if (fullName.toLowerCase().includes(p.name?.split(" ").pop()?.toLowerCase())) {
                  const age = p.birthday ? Math.floor((Date.now() - new Date(p.birthday).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
                  return { name: p.name, country: p.countryAcr, age, category: cat.category };
                }
              }
            }
            return null;
          };
          const [homeProfile, awayProfile] = await Promise.all([
            findPlayer(homeRes, homePlayer),
            findPlayer(awayRes, awayPlayer),
          ]);
          if (homeProfile || awayProfile) {
            row.match_stats = { ...(row.match_stats || {}), players: { home: homeProfile, away: awayProfile } };
            if (!sources.includes("tennis-api")) sources.push("tennis-api");
          }
        }
      } catch { /* skip */ }
    }

    // G) AllSportsAPI2 — standings enrichment for football
    if (row.sport === "football") {
      const homeKey = row.home_team.toLowerCase().trim();
      const awayKey = row.away_team.toLowerCase().trim();
      const homeStanding = allSportsStandings.get(homeKey);
      const awayStanding = allSportsStandings.get(awayKey);
      if (homeStanding || awayStanding) {
        row.match_stats = {
          ...(row.match_stats || {}),
          standings: { home: homeStanding || null, away: awayStanding || null },
        };
        if (!sources.includes("allsportsapi2")) sources.push("allsportsapi2");
      }
    }

    row.data_sources = sources;

    // H) Determine ai_hidden: hide if no real data enrichment was found
    const hasRealData = sources.length > 1 || row.match_stats || row.h2h_data || row.odds || row.home_lineup;
    const hasAIAnalysis = row.pred_analysis && !row.pred_analysis.startsWith("🤖 Analyse basée sur le modèle statistique");
    if (!hasRealData && !hasAIAnalysis) {
      row.ai_hidden = true;
      row.ai_hidden_reason = "Données insuffisantes — aucune stat, cote, ou analyse IA disponible";
    } else {
      row.ai_hidden = false;
      row.ai_hidden_reason = null;
    }
  }

  console.log(`[ENRICH] Done. API-Football: ${apiFootballCalls}, SportMonks: ${sportMonksMap.size}, SofaScore-Rapid: ${sofaRapidCalls}, Tank01-MLB: ${mlbData.size}, NHL-API5: ${nhlData.size}, AllSports: ${allSportsStandings.size}`);
}

// ─── CONVERT TO DB ROW (with AI or fallback prediction) ─────────────
function toRow(m: NormalizedMatch, isFree: boolean, aiPrediction?: AIPrediction) {
  const fixtureId = hash(m.id);
  const prediction = aiPrediction || generateFallbackPrediction(m.homeTeam, m.awayTeam, fixtureId, m.sport);
  const normalizedAnalysis = prediction.pred_analysis?.startsWith("🤖")
    ? prediction.pred_analysis
    : `🤖 ${prediction.pred_analysis}`;

  return {
    fixture_id: fixtureId,
    sport: m.sport, league_name: m.league, league_country: m.country || null,
    home_team: m.homeTeam, away_team: m.awayTeam,
    home_logo: m.homeLogo, away_logo: m.awayLogo,
    kickoff: new Date(m.timestamp).toISOString(),
    status: "NS", home_score: null, away_score: null,
    is_free: isFree, fetched_at: new Date().toISOString(),
    ...prediction,
    pred_analysis: normalizedAnalysis,
    ai_score: computePredictionAiScore(prediction),
    home_lineup: null, away_lineup: null,
    odds: null, match_stats: null, h2h_data: null,
    odds_updated_at: null,
    data_sources: [m.source],
    ai_hidden: false,
    ai_hidden_reason: null,
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
      // Always fetch ESPN football with extended range for maximum coverage
      let sportsrcMatches = await fetchSportsRC(iso);
      const espnMatches = await fetchESPNExtended("football", compact, tomorrowCompact);
      
      // Merge SportSRC + ESPN, deduplicate
      const seen = new Set<string>();
      const merged: NormalizedMatch[] = [];
      for (const m of [...sportsrcMatches, ...espnMatches]) {
        const k = dedupKey(m);
        if (!seen.has(k)) { seen.add(k); merged.push(m); }
      }
      console.log(`[FOOTBALL] SportSRC: ${sportsrcMatches.length}, ESPN: ${espnMatches.length} → merged: ${merged.length}`);
      return merged;
    };

    const fetchTennis = async (): Promise<NormalizedMatch[]> => {
      // Try SofaScore first, then TheSportsDB, then ESPN
      const sofaMatches = await fetchSofaScore("tennis", iso);
      if (sofaMatches.length > 0) return sofaMatches;
      console.log(`[TENNIS] SofaScore unavailable → trying TheSportsDB`);
      const tsdbMatches = await fetchTennisFromTheSportsDB(iso);
      if (tsdbMatches.length > 0) return tsdbMatches;
      console.log(`[TENNIS] TheSportsDB unavailable → trying ESPN tennis`);
      const espnTennis = await fetchESPNExtended("tennis", compact, tomorrowCompact);
      if (espnTennis.length > 0) return espnTennis;
      console.log(`[TENNIS] No tennis matches found from any source`);
      return [];
    };

    const fetchBasketball = async (): Promise<NormalizedMatch[]> => {
      const espnMatches = await fetchESPNExtended("basketball", compact, tomorrowCompact);
      if (espnMatches.length > 0) return espnMatches;
      console.log(`[FALLBACK] ESPN basketball 0 → trying SofaScore`);
      return fetchSofaScore("basketball", iso);
    };

    const fetchHockey = async (): Promise<NormalizedMatch[]> => {
      return fetchESPNExtended("hockey", compact, tomorrowCompact);
    };

    const fetchBaseball = async (): Promise<NormalizedMatch[]> => {
      return fetchESPNExtended("baseball", compact, tomorrowCompact);
    };

    const fetchNFL = () => fetchESPNExtended("nfl", compact, tomorrowCompact);
    const fetchMMA = () => fetchESPNExtended("mma", compact, tomorrowCompact);
    const fetchF1 = () => fetchESPNExtended("f1", compact, tomorrowCompact);
    const fetchAFL = () => fetchESPNExtended("afl", compact, tomorrowCompact);
    const fetchRugby = () => fetchESPNExtended("rugby", compact, tomorrowCompact);

    const [
      footMatches, tennisMatches, basketMatches,
      hockeyMatches, baseballMatches,
      nflMatches, mmaMatches, f1Matches, aflMatches, rugbyMatches,
    ] = await Promise.all([
      fetchFootball(), fetchTennis(), fetchBasketball(),
      fetchHockey(), fetchBaseball(),
      fetchNFL(), fetchMMA(), fetchF1(), fetchAFL(), fetchRugby(),
    ]);

    const sportResults: Record<string, number> = {
      football: footMatches.length, tennis: tennisMatches.length, basketball: basketMatches.length,
      hockey: hockeyMatches.length, baseball: baseballMatches.length,
      nfl: nflMatches.length, mma: mmaMatches.length, f1: f1Matches.length, afl: aflMatches.length,
      rugby: rugbyMatches.length,
    };
    console.log(`[RESULTS] ${JSON.stringify(sportResults)}`);

    // ─── Combine + deduplicate ───────────────────────────────
    const allRaw = [
      ...footMatches, ...tennisMatches, ...basketMatches,
      ...hockeyMatches, ...baseballMatches,
      ...nflMatches, ...mmaMatches, ...f1Matches, ...aflMatches, ...rugbyMatches,
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

    // ─── Convert to rows (fallback predictions initially) ─────
    const rows = deduped.map(m => toRow(m, false));

    // ─── Enrich with API-Football + SportMonks ────────────────
    await enrichMatchesWithAPIs(rows, iso);

    console.log(`[PREDICTIONS] ${rows.length} matches with initial predictions + enrichment`);

    // ─── TOP 3 FREE: 1 per sport ─────────────────────────────
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
    const resolutionCutoff = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    const { data: pendingMatches } = await supabase
      .from("cached_matches")
      .select("fixture_id, sport, home_team, away_team, league_name, kickoff, pred_home_win, pred_away_win, pred_confidence, home_score, away_score, status")
      .lt("kickoff", resolutionCutoff);

    if (pendingMatches && pendingMatches.length > 0) {
      const now = Date.now();
      const matchesEligibleForResolution = pendingMatches.filter((m) => {
        const kickoffMs = new Date(m.kickoff).getTime();
        if (!Number.isFinite(kickoffMs)) return false;
        const status = String(m.status || "").toUpperCase();
        if (["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "FINISHED", "COMPLETED", "ENDED"].includes(status)) return true;
        return now >= kickoffMs + getSportDurationMs(m.sport || "football");
      });

      const matchesNeedingScores = matchesEligibleForResolution.filter(m => m.home_score == null || m.away_score == null);
      const matchesWithScores = matchesEligibleForResolution.filter(m => m.home_score != null && m.away_score != null);

      const finishedScores = new Map<string, { homeScore: number; awayScore: number }>();
      const datesToCheck = [compact, tomorrowCompact];
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      datesToCheck.push(yesterday.toISOString().slice(0, 10).replace(/-/g, ""));
      const twoDaysBack = new Date(Date.now() - 48 * 3600 * 1000);
      datesToCheck.push(twoDaysBack.toISOString().slice(0, 10).replace(/-/g, ""));
      const uniqueScoreDates = [...new Set(datesToCheck)];

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

    // ─── Upsert new matches (preserve locked predictions) ──────────────────────────────────
    if (rows.length > 0) {
      // Get existing matches with locked predictions
      const existingIds = rows.map(r => r.fixture_id);
      const { data: existingMatches } = await supabase
        .from("cached_matches")
        .select("fixture_id, pred_home_win, pred_away_win, pred_analysis")
        .in("fixture_id", existingIds);

      const existingMap = new Map<number, { fixture_id: number; pred_home_win: number | null; pred_away_win: number | null; pred_analysis: string | null }>();
      const lockedSet = new Set<number>();
      if (existingMatches) {
        for (const em of existingMatches) {
          existingMap.set(em.fixture_id, em);
          if (em.pred_home_win != null && em.pred_away_win != null && em.pred_analysis) {
            lockedSet.add(em.fixture_id);
          }
        }
      }

      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50).map(row => {
          if (lockedSet.has(row.fixture_id)) {
            const existing = existingMap.get(row.fixture_id);
            if (existing) {
              return {
                ...row,
                pred_home_win: existing.pred_home_win ?? row.pred_home_win,
                pred_away_win: existing.pred_away_win ?? row.pred_away_win,
                pred_analysis: existing.pred_analysis ?? row.pred_analysis,
              };
            }
          }
          return row;
        });
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
      console.log(`[FETCH] Upserted ${rows.length} matches, ${lockedSet.size} predictions preserved`);
    }

    // ─── Trigger AI prediction for new matches ───────────────
    // Fire-and-forget call to ai-predict for matches without AI analysis
    try {
      const aiPredictUrl = `${supabaseUrl}/functions/v1/ai-predict?batch=10&offset=0`;
      fetch(aiPredictUrl, {
        method: "GET",
        headers: { "apikey": supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }).catch(() => {}); // fire and forget
      console.log(`[AI] Triggered ai-predict for new matches`);
    } catch { /* ignore */ }

    // ─── Update metadata ─────────────────────────────────────
    const apiCallsThisCycle = Object.keys(ESPN_LEAGUES).length + 2;
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
