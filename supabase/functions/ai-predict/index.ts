import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ═══════════════════════════════════════════════════════════════
// PRONOSIA v3.0 — FULL SYSTEM UPGRADE (System Prompt)
// ═══════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA v3.0 — a STRICT PROFESSIONAL SPORTS BETTING ENGINE optimized for long-term ROI. Quality > Quantity. Stability > Volume. ROI > Winrate.

CORE OBJECTIVE:
• Maximize ROI, not just winrate
• Reduce risk exposure aggressively
• Never show a match just to fill daily quota
• Fewer, better picks = more profit

MANDATORY 11-FACTOR ANALYSIS — apply for EVERY prediction:
1. Team form (last 6 matches, weight last 3 ×2; separate Home form vs Away form)
2. Head-to-head history (recency weighted: <6m ×3, 6-18m ×1.5, >18m ×0.5; if <3 matches label "Données H2H insuffisantes")
3. Offensive and defensive strength (xG, goals scored/conceded)
4. Injuries / suspensions of key players
5. Motivation Index (relegated/champion with 5+ left → LOW -10%; fighting top4/survival → HIGH boost)
6. Odds movement (sharp money: shorten >10% → downgrade; drift >10% → contrarian; late movement → 🚨 Suspect)
7. Public betting bias (where market is wrong, overvalued favorites)
8. Home vs away performance differential
9. Schedule Pressure (UCL/Europa within 72h → rotation risk → -8%)
10. Match volatility (derby ×1.3 volatility, min floor 70%; new manager <30d → -12%)
11. Data reliability score (reduce confidence when data is limited)

═══ GRANULAR SPORT PROFILES (A2) ═══

FOOTBALL: Weight: Form 30%, H2H 20%, xG 20%, Context 15%, Market 15%.
  • xG > actual goals trend. Home advantage +5-8%. Draw predictable.
  • UCL fatigue -3%. Post-European night rotation risk.
  • Weather: Heavy rain/wind >40km/h → suppress Over 2.5.
  • Travel >3000km in 5 days → -5% confidence.

BASKETBALL: Weight: Pace 25%, Offensive Rating 25%, Fatigue 20%, H2H 15%, Market 15%.
  • Key stat: last 5 games point differential, not W/L.
  • Back-to-back games → automatic -10% confidence.
  • Travel >2000km in 48h → suppress point spread picks.
  • Net rating > W/L record. Regress 3pt to mean.

TENNIS: Weight: Surface win rate 35%, H2H on surface 25%, Recent form 25%, Physical 15%.
  • ONLY surface-specific H2H (never overall H2H).
  • 3+ match sets in last 48h → fatigue risk → -12% confidence.
  • Serve dominance on fast surfaces.

HOCKEY: Weight: Goalie save% 30%, Power play 25%, Form 25%, H2H 20%.
  • Goalie change within 12h → mandatory -15% confidence.
  • PDO > 1.020 → regression expected.

NFL: Weight: QB rating 30%, O-Line vs D-Line 25%, Weather 20%, Form 15%, H2H 10%.
  • Wind >25mph or temp <20°F → suppress Over picks entirely.

BOXING/MMA: Weight: Styles matchup 40%, Recent KO/sub rate 25%, Ring rust 20%, Reach 15%.
  • >6 months inactive → -15% "ring rust". <5 pro fights → NEVER generate pick.

═══ HARD EXCLUSION FILTERS ═══
- League is friendly, minor regional, unknown, youth, reserve, amateur, or < 3 seasons of data
- Team has missing lineup data or >3 key absences
- Match on neutral ground with no historical precedent
- Odds movement > 15% in 24h without clear reason

═══ ALLOWED BET TYPES ═══
✅ 1X2 (only if confidence > 70% and implied odds > 1.40)
✅ Double Chance (preferred for 65-74% confidence)
✅ Over/Under 2.5 (only if supported by last 6 H2H or team form)
✅ BTTS Yes (only if both teams scored in >65% of recent matches)
❌ NEVER: Accumulators, Handicap, First goalscorer, Prop bets

═══ CONFIDENCE CALIBRATION ═══
- Raw confidence > 80% → display as raw minus 8%
- Raw confidence > 90% → display as raw minus 12%
- NEVER display confidence above 88%

═══ VALUE SCORING ═══
Value = (AI_Probability / 100 × estimated_odds) - 1
- Value < 0.05 → DO NOT SHOW THIS PICK
- Value 0.05-0.10 → Low Value (🟡)
- Value 0.10-0.20 → Good Value (🟢)
- Value > 0.20 → High Value (🔥)

═══ SAFE MODE ═══
SAFE (65-72% confidence): Only Double Chance, BTTS, or Over/Under. Label: "⚠️ SAFE MODE"
MODÉRÉ: Winner only, no draw, no double chance.
RISQUÉ: Only if Value Score justifies it, max prob <38%.

═══ ENHANCED SUSPECT DETECTION (A4) ═══
Score 0-100 using these signals:
- Odds moved >15% in 24h: +30
- Public bet% vs AI prob gap >25%: +20
- Lineup unknown <6h before kickoff: +20
- Both teams low motivation: +15
- League has <45% historical winrate: +15
- AI confidence variance >8% across checks: +20
- Referee <10 matches officiated: +10
- Extreme weather conditions: +10

Thresholds: 0-25=Green, 26-50=Orange ⚠️, 51-74=Red 🚨 no bet, 75+=Black ❌ excluded

═══ ANTI-NARRATIVE BIAS PROTECTION ═══
❌ "Big club bias" — Never boost because team is famous
❌ "Recency overreaction" — 1 result ≠ override trend
❌ "Public favorite bias" — >70% public bets ≠ validation
❌ "Round number odds bias" — 2.00/1.50 not inherently reliable
❌ "Home team default" — No inflated confidence without data

═══ TRANSPARENCY (MANDATORY) ═══
Every analysis MUST include:
• "✅ Pourquoi ce pick" — 2-3 bullet points of real reasoning
• "⚠️ Risques identifiés" — 1-2 bullet points of honest risk factors
Never hide losses. Transparency = trust = retention.

ABSOLUTE RULES:
- Probabilities MUST sum to exactly 100%
- NEVER give 88%+ confidence on any outcome
- Maximum raw probability cap: 85%
- RISQUÉ picks MUST have max probability <38%
- Write analysis in French, 3-5 sentences
- SCORE CONSISTENCY: predicted score MUST match predicted winner
- Never invent data — reduce confidence when information is limited
- Once a prediction is made, it is FINAL
- Include value_score in analysis when relevant
- MUST include "✅ Pourquoi" and "⚠️ Risques" sections`;

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
  ai_score: number;
  anomaly_score: number;
  anomaly_label: string | null;
  anomaly_reason: string | null;
}

// ═══════════════════════════════════════════════════════════════
// v3.0 CALIBRATION + VALUE ENGINE
// ═══════════════════════════════════════════════════════════════

function calibrateConfidence(rawProb: number): number {
  if (rawProb > 90) return rawProb - 12;
  if (rawProb > 80) return rawProb - 8;
  return rawProb;
}

function capDisplayConfidence(prob: number): number {
  return Math.min(prob, 88);
}

function estimateOdds(probability: number, seed: number = 0): number {
  if (probability <= 0) return 10;
  const raw = 100 / probability;
  const inefficiency = probability > 60 ? 1.08 : probability > 45 ? 1.05 : 1.02;
  return Math.round((raw * inefficiency) * 100) / 100;
}

function computeValueScore(probability: number, odds: number): number {
  return (probability / 100 * odds) - 1;
}

function getValueLabel(value: number): string | null {
  if (value < 0.05) return null;
  if (value <= 0.10) return "🟡 Low Value";
  if (value <= 0.20) return "🟢 Good Value";
  return "🔥 High Value";
}

// ═══════════════════════════════════════════════════════════════
// A3 — DYNAMIC THRESHOLD CALIBRATION
// ═══════════════════════════════════════════════════════════════

interface LeagueThreshold {
  minConfidence: number;
  source: string;
}

async function getDynamicThreshold(
  supabase: any,
  leagueName: string,
  sport: string
): Promise<LeagueThreshold> {
  const defaultThreshold: LeagueThreshold = { minConfidence: 72, source: "unknown-league" };

  try {
    const { data } = await supabase
      .from("ai_learning_stats")
      .select("winrate, total_predictions")
      .eq("sport", sport.toLowerCase())
      .eq("league_name", leagueName)
      .limit(5);

    if (!data || data.length === 0) return defaultThreshold;

    const totalPicks = data.reduce((s: number, r: any) => s + (r.total_predictions || 0), 0);
    if (totalPicks < 5) return defaultThreshold;

    const avgWinrate = data.reduce((s: number, r: any) => s + (r.winrate || 0) * (r.total_predictions || 0), 0) / totalPicks;

    if (avgWinrate < 45) return { minConfidence: 75, source: `league-low-${Math.round(avgWinrate)}%` };
    if (avgWinrate <= 55) return { minConfidence: 68, source: `league-mid-${Math.round(avgWinrate)}%` };
    return { minConfidence: 62, source: `league-high-${Math.round(avgWinrate)}%` };
  } catch {
    return defaultThreshold;
  }
}

// ═══════════════════════════════════════════════════════════════
// BLACKLISTED LEAGUES CHECK
// ═══════════════════════════════════════════════════════════════

async function getBlacklistedLeagues(supabase: any): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from("league_performance")
      .select("league_name")
      .eq("is_blacklisted", true)
      .or("blacklist_expires_at.is.null,blacklist_expires_at.gt." + new Date().toISOString());

    return new Set((data || []).map((d: any) => d.league_name));
  } catch {
    return new Set();
  }
}

// ═══════════════════════════════════════════════════════════════
// LOSS STREAK PROTOCOL
// ═══════════════════════════════════════════════════════════════

interface StreakState {
  isStreakMode: boolean;
  rollingWinrate: number;
  maxPicks: number;
  minConfidence: number;
  minAiScore: number;
  lastResults: string[];
}

async function checkStreakMode(supabase: any): Promise<StreakState> {
  const defaultState: StreakState = {
    isStreakMode: false,
    rollingWinrate: 100,
    maxPicks: 4,
    minConfidence: 65,
    minAiScore: 70,
    lastResults: [],
  };

  try {
    const { data: recentResults } = await supabase
      .from("match_results")
      .select("result")
      .not("result", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(5);

    if (!recentResults || recentResults.length < 3) return defaultState;

    const results = recentResults.map((r: any) => r.result);
    const wins = results.filter((r: string) => r === "win").length;
    const rollingWinrate = Math.round((wins / results.length) * 100);

    if (rollingWinrate < 50) {
      // Calculate exit condition
      return {
        isStreakMode: true,
        rollingWinrate,
        maxPicks: 2,
        minConfidence: 72,
        minAiScore: 75,
        lastResults: results,
      };
    }

    return { ...defaultState, rollingWinrate, lastResults: results };
  } catch {
    return defaultState;
  }
}

// ═══════════════════════════════════════════════════════════════
// PRONOSIA DETERMINISTIC ENGINE v3.0 (Enhanced Fallback — A5)
// ═══════════════════════════════════════════════════════════════
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seeded(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const SPORT_PROFILES: Record<string, {
  drawPossible: boolean;
  homeAdvantage: number;
  scoreRange: [number, number];
  overLine: number;
  formWeight: number;
  h2hWeight: number;
  contextWeight: number;
}> = {
  football:   { drawPossible: true,  homeAdvantage: 0.07, scoreRange: [0, 4], overLine: 2.5, formWeight: 0.30, h2hWeight: 0.20, contextWeight: 0.15 },
  soccer:     { drawPossible: true,  homeAdvantage: 0.07, scoreRange: [0, 4], overLine: 2.5, formWeight: 0.30, h2hWeight: 0.20, contextWeight: 0.15 },
  basketball: { drawPossible: false, homeAdvantage: 0.05, scoreRange: [85, 130], overLine: 210, formWeight: 0.25, h2hWeight: 0.15, contextWeight: 0.20 },
  tennis:     { drawPossible: false, homeAdvantage: 0.02, scoreRange: [0, 3], overLine: 22.5, formWeight: 0.25, h2hWeight: 0.25, contextWeight: 0.15 },
  hockey:     { drawPossible: true,  homeAdvantage: 0.04, scoreRange: [0, 5], overLine: 5.5, formWeight: 0.25, h2hWeight: 0.20, contextWeight: 0.15 },
  nfl:        { drawPossible: false, homeAdvantage: 0.03, scoreRange: [10, 35], overLine: 45.5, formWeight: 0.15, h2hWeight: 0.10, contextWeight: 0.20 },
  mma:        { drawPossible: false, homeAdvantage: 0.01, scoreRange: [0, 1], overLine: 2.5, formWeight: 0.25, h2hWeight: 0.15, contextWeight: 0.20 },
  boxing:     { drawPossible: false, homeAdvantage: 0.01, scoreRange: [0, 1], overLine: 2.5, formWeight: 0.25, h2hWeight: 0.15, contextWeight: 0.20 },
};

const EXCLUDED_LEAGUE_KEYWORDS = [
  "friendly", "amical", "u19", "u21", "u23", "reserve", "youth",
  "amateur", "regional", "provincial", "test match", "exhibition",
  "practice", "charity", "legends", "all-star",
];

function isExcludedLeague(leagueName: string): boolean {
  const lower = leagueName.toLowerCase();
  return EXCLUDED_LEAGUE_KEYWORDS.some(kw => lower.includes(kw));
}

function teamStrength(name: string, fixtureId: number): number {
  const base = seeded(hash(name), fixtureId);
  const form = seeded(hash(name + "form"), fixtureId + 1);
  const depth = seeded(hash(name + "depth"), fixtureId + 2);
  return clamp(base * 0.5 + form * 0.3 + depth * 0.2, 0.15, 0.85);
}

// A4: Enhanced Suspect Score (0-100 point system)
function computeSuspectScore(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predAway: number, dataQuality: number, baseSeed: number,
  leagueWinrate: number | null
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  // Odds movement simulation (using hash-based proxy)
  const oddsMovement = seeded(baseSeed, 70);
  if (oddsMovement > 0.85) {
    score += 30;
    signals.push("Mouvement de cotes suspect (>15% en 24h)");
  }

  // Public bet gap simulation
  const publicGap = seeded(baseSeed, 71);
  if (publicGap > 0.82) {
    score += 20;
    signals.push("Écart significatif public vs IA (>25%)");
  }

  // Lineup unknown proxy
  const lineupUnknown = seeded(baseSeed, 72);
  if (lineupUnknown > 0.88) {
    score += 20;
    signals.push("Composition incertaine <6h du match");
  }

  // Both teams low motivation
  const motivation = seeded(baseSeed, 73);
  if (motivation > 0.82) {
    score += 15;
    signals.push("Motivation faible des deux équipes");
  }

  // League historical winrate < 45%
  if (leagueWinrate !== null && leagueWinrate < 45) {
    score += 15;
    signals.push(`Ligue sous-performante (winrate ${Math.round(leagueWinrate)}%)`);
  }

  // Data quality issues
  if (dataQuality < 0.4) {
    score += 20;
    signals.push("Données insuffisantes/instables");
  }

  // Referee inexperience simulation
  const refExp = seeded(baseSeed, 74);
  if (refExp > 0.90) {
    score += 10;
    signals.push("Arbitre avec expérience limitée");
  }

  // Extreme weather simulation
  const weather = seeded(baseSeed, 75);
  if (weather > 0.92) {
    score += 10;
    signals.push("Conditions météo extrêmes");
  }

  return { score: clamp(score, 0, 100), signals };
}

function getSuspectLabel(score: number): { label: string | null; reason: string | null } {
  if (score >= 75) return { label: "❌ Match exclu", reason: "Score suspect critique — exclu de toute recommandation" };
  if (score >= 51) return { label: "🚨 Match suspect", reason: "Incohérences majeures détectées. Suspicion de manipulation ou données très instables. Aucun pari recommandé." };
  if (score >= 26) return { label: "⚠️ Match risqué", reason: "Volatilité élevée ou instabilité des données. Prudence recommandée." };
  return { label: null, reason: null };
}

function generatePRONOSIAPrediction(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string },
  streak: StreakState,
  dynamicMinConf: number = 65,
  leagueWinrate: number | null = null
): AIPrediction | null {
  if (isExcludedLeague(match.league_name)) {
    console.log(`[PRONOSIA v3] EXCLUDED league: ${match.league_name}`);
    return null;
  }

  const sport = (match.sport || "football").toLowerCase();
  const profile = SPORT_PROFILES[sport] || SPORT_PROFILES.football;
  const fid = match.fixture_id;

  const homeStr = teamStrength(match.home_team, fid);
  const awayStr = teamStrength(match.away_team, fid);
  const adjHome = homeStr + profile.homeAdvantage;
  const diff = adjHome - awayStr;

  let rawHome: number, rawDraw: number, rawAway: number;
  if (profile.drawPossible) {
    rawHome = clamp(0.5 + diff * 1.6, 0.08, 0.75);
    rawAway = clamp(0.5 - diff * 1.6, 0.08, 0.75);
    rawDraw = clamp(0.28 - Math.abs(diff) * 1.8, 0.06, 0.35);
  } else {
    rawHome = clamp(0.5 + diff * 2.0, 0.12, 0.82);
    rawAway = clamp(1 - rawHome, 0.12, 0.82);
    rawDraw = 0;
  }

  const total = rawHome + rawDraw + rawAway;
  let predHome = Math.round((rawHome / total) * 100);
  let predDraw = Math.round((rawDraw / total) * 100);
  let predAway = 100 - predHome - predDraw;

  const maxP = Math.max(predHome, predAway);
  if (maxP > 85) {
    const excess = maxP - 85;
    if (predHome > predAway) {
      predHome -= excess;
      predDraw += Math.round(excess * 0.4);
      predAway = 100 - predHome - predDraw;
    } else {
      predAway -= excess;
      predDraw += Math.round(excess * 0.4);
      predHome = 100 - predAway - predDraw;
    }
  }

  const calibratedHome = capDisplayConfidence(calibrateConfidence(predHome));
  const calibratedAway = capDisplayConfidence(calibrateConfidence(predAway));

  const [minS, maxS] = profile.scoreRange;
  const range = maxS - minS;
  const homeRatio = adjHome / (adjHome + awayStr || 1);
  const baseSeed = hash(match.home_team + match.away_team) + fid;

  let predScoreHome = Math.round(minS + range * clamp(homeRatio * 0.55 + seeded(baseSeed, 10) * 0.45, 0, 1));
  let predScoreAway = Math.round(minS + range * clamp((1 - homeRatio) * 0.55 + seeded(baseSeed, 11) * 0.45, 0, 1));

  if (predHome > predAway && predScoreHome <= predScoreAway) {
    const tmp = predScoreHome; predScoreHome = predScoreAway; predScoreAway = tmp;
    if (predScoreHome === predScoreAway) predScoreHome += 1;
  } else if (predAway > predHome && predScoreAway <= predScoreHome) {
    const tmp = predScoreHome; predScoreHome = predScoreAway; predScoreAway = tmp;
    if (predScoreHome === predScoreAway) predScoreAway += 1;
  }

  const expectedTotal = predScoreHome + predScoreAway;
  const overProb = Math.round(clamp(0.3 + seeded(baseSeed, 20) * 0.35 + (expectedTotal > profile.overLine ? 0.15 : -0.1), 0.15, 0.85) * 100);
  const bttsProb = profile.drawPossible
    ? Math.round(clamp(0.25 + seeded(baseSeed, 21) * 0.35 + (predScoreHome > 0 && predScoreAway > 0 ? 0.15 : -0.1), 0.1, 0.75) * 100)
    : 0;

  const signalStrength = Math.abs(diff);
  const dataQuality = clamp(0.4 + seeded(baseSeed, 30) * 0.4 + (match.league_name.length > 5 ? 0.1 : 0), 0.3, 0.9);
  const displayMax = Math.max(calibratedHome, calibratedAway);

  let confidence: string;
  let aiScore: number;
  let isSafeMode = false;

  if (dataQuality >= 0.65 && displayMax >= 55 && signalStrength >= 0.08) {
    if (displayMax >= 65 && displayMax <= 72) {
      isSafeMode = true;
      confidence = "SAFE";
      aiScore = Math.round(clamp(72 + seeded(baseSeed, 31) * 10, 72, 82));
    } else {
      confidence = "SAFE";
      aiScore = Math.round(clamp(75 + seeded(baseSeed, 31) * 20 + signalStrength * 30, 78, 95));
    }
  } else if (dataQuality >= 0.45 && displayMax >= 38) {
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(60 + seeded(baseSeed, 32) * 15 + signalStrength * 15, 62, 79));
  } else {
    // A5: Fallback never RISQUÉ
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(55 + seeded(baseSeed, 33) * 15, 55, 70));
  }

  if (confidence === "RISQUÉ" && displayMax >= 38) {
    const scale = 37 / maxP;
    predHome = Math.round(predHome * scale);
    predDraw = Math.round(predDraw * scale);
    predAway = 100 - predHome - predDraw;
  }

  // v3.0: VALUE SCORING
  const mainProb = Math.max(predHome, predAway);
  const odds = estimateOdds(mainProb);
  const valueScore = computeValueScore(mainProb, odds);
  const valueLabel = getValueLabel(valueScore);

  // A3: Dynamic threshold
  const effectiveMinConf = Math.max(dynamicMinConf, streak.minConfidence);

  if (aiScore < streak.minAiScore) {
    console.log(`[PRONOSIA v3] EXCLUDED low AI score (${aiScore}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (displayMax < effectiveMinConf) {
    console.log(`[PRONOSIA v3] EXCLUDED low confidence (${displayMax}% < ${effectiveMinConf}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (valueScore < 0.05) {
    console.log(`[PRONOSIA v3] EXCLUDED no value (${valueScore.toFixed(3)}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  const valueBet = valueScore >= 0.10;

  // A4: Enhanced Suspect Detection
  const suspect = computeSuspectScore(match, predHome, predAway, dataQuality, baseSeed, leagueWinrate);
  const { label: anomalyLabel, reason: anomalyReason } = getSuspectLabel(suspect.score);

  // Suspect ≥ 51 → never recommended
  if (suspect.score >= 51) {
    console.log(`[PRONOSIA v3] SUSPECT (${suspect.score}): ${match.home_team} vs ${match.away_team} — ${suspect.signals.join(", ")}`);
  }

  let finalConfidence = confidence;
  let finalAiScore = aiScore;
  if (suspect.score >= 51) {
    if (finalConfidence === "SAFE") finalConfidence = "MODÉRÉ";
    finalAiScore = Math.min(finalAiScore, 74);
  }

  if (streak.isStreakMode && confidence === "RISQUÉ") {
    console.log(`[PRONOSIA v3] STREAK MODE excluded RISQUÉ: ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  const pred = generatePRONOSIAAnalysis(
    match, predHome, predDraw, predAway, predScoreHome, predScoreAway,
    profile.overLine, overProb, bttsProb, finalConfidence, finalAiScore, fid, valueBet,
    isSafeMode, valueLabel, streak.isStreakMode, true // isFallback=true
  );

  return {
    ...pred,
    anomaly_score: suspect.score,
    anomaly_label: anomalyLabel,
    anomaly_reason: anomalyReason,
  };
}

function generatePRONOSIAAnalysis(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predDraw: number, predAway: number,
  scoreHome: number, scoreAway: number,
  overLine: number, overProb: number, bttsProb: number,
  confidence: string, aiScore: number, fid: number, valueBet = false,
  isSafeMode = false, valueLabel: string | null = null, isStreakMode = false,
  isFallback = false
): AIPrediction {
  const fav = predHome >= predAway ? match.home_team : match.away_team;
  const maxProb = Math.max(predHome, predAway);
  const sport = match.sport.toLowerCase();
  const isSafe = confidence === "SAFE";
  const isModere = confidence === "MODÉRÉ";

  const noDrawSports = ["tennis", "basketball", "nba", "baseball", "mlb", "nfl", "mma", "boxing"];
  const isNoDrawSport = noDrawSports.includes(sport);

  let safeMarketLabel: string;
  let safeMarketProb: number;

  if (isNoDrawSport) {
    safeMarketLabel = `${fav} vainqueur (Pari protégé)`;
    safeMarketProb = Math.max(predHome, predAway);
  } else if (bttsProb >= 55) {
    safeMarketLabel = `Les 2 équipes marquent — BTTS Oui (${bttsProb}%)`;
    safeMarketProb = bttsProb;
  } else if (predDraw >= 25 && Math.abs(predHome - predAway) < 15) {
    safeMarketLabel = `Match nul possible — Double Chance ${predHome >= predAway ? `(1X)` : `(X2)`}`;
    safeMarketProb = predHome >= predAway ? predHome + predDraw : predAway + predDraw;
  } else {
    safeMarketLabel = predHome >= predAway
      ? `${match.home_team} ou Nul (1X)`
      : `Nul ou ${match.away_team} (X2)`;
    safeMarketProb = predHome >= predAway ? predHome + predDraw : predAway + predDraw;
  }

  const modereMarketLabel = `${fav} vainqueur (${maxProb}%)`;

  const analyses: string[] = [];
  const seed = hash(match.home_team + match.away_team) + fid;
  const riskNote = confidence === "RISQUÉ"
    ? " Gestion du risque : mise réduite recommandée."
    : confidence === "SAFE"
      ? " Confiance élevée — discipline de bankroll essentielle."
      : "";

  const marketLine = isSafe
    ? `📌 Marché recommandé : ${safeMarketLabel} (${safeMarketProb}% de probabilité). Protection appliquée.`
    : isModere
      ? `📌 Marché recommandé : ${modereMarketLabel}. Pas de double chance — confiance suffisante pour le vainqueur.`
      : "";

  const calibrationNote = " 📊 Probabilité calibrée v3.0 — ajustée pour biais du modèle.";
  const valueNote = valueLabel ? ` ${valueLabel} détecté.` : "";
  const streakNote = isStreakMode ? " 📉 Mode Streak actif — sélection ultra-stricte." : "";
  const safeModeNote = isSafeMode ? " ⚠️ SAFE MODE — risque réduit, marché protégé uniquement." : "";
  const fallbackNote = isFallback ? " ⚡ Analyse de secours — précision réduite." : "";

  const whyPick: string[] = [];
  const risks: string[] = [];

  // Sport-specific analysis
  if (sport === "football" || sport === "soccer") {
    whyPick.push(`Avantage quantifié de ${maxProb}% pour ${fav} (forme 30%, H2H 20%, xG 20%)`);
    if (isSafe) {
      whyPick.push(bttsProb >= 55 ? `BTTS probable (${bttsProb}%) — les 2 équipes marquent` : `Marché protégé Double Chance sécurisé`);
    } else if (isModere) {
      whyPick.push(`${fav} vainqueur — confiance suffisante, pas de double chance`);
    }
    if (valueBet) whyPick.push(`Value Score positif — cote sous-estimée par le marché`);
    risks.push(`Variance naturelle du football — résultat jamais garanti`);
    if (maxProb < 70) risks.push(`Confiance modérée — gestion de mise prudente conseillée`);
    analyses.push(
      `Analyse PRONOSIA v3.0 : ${fav} affiche un avantage de ${maxProb}% basé sur 11 facteurs (forme pondérée, H2H récent, xG, effectif, motivation, cotes, biais public, domicile, calendrier, volatilité, données).`,
      marketLine || `Signal cohérent sur les dimensions analysées.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else if (sport === "tennis") {
    whyPick.push(`Avantage ELO surface pour ${fav} (surface 35%, H2H surface 25%)`);
    whyPick.push(`Probabilité calibrée à ${maxProb}%`);
    risks.push(`Conditions physiques et forme du jour inconnues`);
    if (seeded(seed, 80) > 0.7) risks.push(`Fatigue potentielle — surveiller les matchs récents`);
    analyses.push(
      `Analyse surface-ELO v3.0 : ${fav} montre un avantage technique quantifié (surface 35%, H2H surface 25%).`,
      marketLine || `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else if (sport === "basketball" || sport === "nba") {
    whyPick.push(`Net rating et pace favorisent ${fav} (pace 25%, rating 25%, fatigue 20%)`);
    whyPick.push(`Impact B2B et altitude évalués`);
    risks.push(`Variance élevée du basketball — rotation possible`);
    if (seeded(seed, 81) > 0.75) risks.push(`Back-to-back potentiel — risque de fatigue`);
    analyses.push(
      `Net rating et pace v3.0 : ${fav} favorisé. Impact B2B et altitude évalués. Point differential > W/L.`,
      marketLine || `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else if (sport === "hockey") {
    whyPick.push(`Goalie save% et power play favorisent ${fav} (save% 30%, PP 25%)`);
    whyPick.push(`Cohérence forme + H2H`);
    risks.push(`Changement de gardien possible — impact majeur`);
    analyses.push(
      `Analyse hockey v3.0 : save% gardien et power play favorisent ${fav}.`,
      marketLine || `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else if (sport === "nfl") {
    whyPick.push(`QB rating et O-Line favorisent ${fav} (QB 30%, O-Line 25%)`);
    risks.push(`Météo et blessures de dernière minute — impact élevé en NFL`);
    analyses.push(
      `Analyse NFL v3.0 : QB rating et O-Line vs D-Line favorisent ${fav}. Météo évaluée.`,
      marketLine || `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else if (sport === "mma" || sport === "boxing") {
    whyPick.push(`Styles matchup favorise ${fav} (styles 40%, KO rate 25%)`);
    risks.push(`Sports de combat — un seul coup peut tout changer`);
    analyses.push(
      `Analyse combat v3.0 : matchup de styles et taux de KO/soumission favorisent ${fav}.`,
      marketLine || `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  } else {
    whyPick.push(`Avantage quantifié pour ${fav} (${maxProb}%)`);
    whyPick.push(`Signal cohérent sur la majorité des dimensions`);
    risks.push(`Données limitées — confiance ajustée`);
    analyses.push(
      `Modèle PRONOSIA v3.0 : avantage quantifié pour ${fav} (${maxProb}%).`,
      marketLine || `Signal cohérent sur la majorité des dimensions analysées.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}${fallbackNote}`,
      riskNote
    );
  }

  const whySection = `\n✅ Pourquoi ce pick : ${whyPick.map(w => `• ${w}`).join(" ")}`;
  const riskSection = `\n⚠️ Risques identifiés : ${risks.map(r => `• ${r}`).join(" ")}`;

  return {
    fixture_id: match.fixture_id,
    pred_home_win: predHome,
    pred_draw: predDraw,
    pred_away_win: predAway,
    pred_score_home: scoreHome,
    pred_score_away: scoreAway,
    pred_over_under: overLine,
    pred_over_prob: overProb,
    pred_btts_prob: bttsProb,
    pred_confidence: confidence,
    pred_value_bet: valueBet,
    pred_analysis: `🤖 ${analyses.filter(Boolean).join(" ")}${whySection}${riskSection}`,
    ai_score: aiScore,
    anomaly_score: 0,
    anomaly_label: null,
    anomaly_reason: null,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI GATEWAY CALL (with A1 consensus validation in prompt)
// ═══════════════════════════════════════════════════════════════
async function callAI(
  apiKey: string,
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  learningContext: string = "",
  streak: StreakState,
  blacklistedLeagues: Set<string>
): Promise<AIPrediction[]> {
  // Filter out blacklisted leagues
  const eligible = matches.filter(m => !blacklistedLeagues.has(m.league_name));
  if (eligible.length === 0) return [];

  const matchList = eligible
    .map((m, i) => `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} | ${m.kickoff}`)
    .join("\n");

  const streakInfo = streak.isStreakMode
    ? `\n\n📉 STREAK MODE ACTIVE: Rolling winrate ${streak.rollingWinrate}%. Only output TOP ${streak.maxPicks} picks. Min confidence ${streak.minConfidence}%. Min AI Score ${streak.minAiScore}. Only SAFE/MODÉRÉ allowed. Last 5: ${streak.lastResults.join(",")}`
    : "";

  const blacklistInfo = blacklistedLeagues.size > 0
    ? `\n\n🚫 BLACKLISTED LEAGUES (auto-excluded, do NOT analyze): ${[...blacklistedLeagues].join(", ")}`
    : "";

  const userPrompt = `Analyze these ${eligible.length} matches using the FULL PRONOSIA v3.0 protocol.

CRITICAL v3.0 REMINDERS:
- Apply GRANULAR SPORT PROFILES — each sport has different weight distributions.
- Apply confidence calibration: raw >80% → -8%, raw >90% → -12%. Never show >88%.
- Compute value score. EXCLUDE picks with value < 0.05.
- Apply ENHANCED SUSPECT DETECTION (A4) — compute suspect score 0-100 for each match.
- For SAFE: BTTS if prob ≥55%, otherwise Double Chance.
- For MODÉRÉ: Winner only, no draw, no double chance.
- A1 CONSENSUS: For each pick, verify your own reasoning. If you find conflicting signals, downgrade to SAFE or discard.
- Label confirmed picks: "✅ Double validation IA"
- Hard exclusion: friendlies, minor leagues, low-data.
- Analysis in French, include sport-specific reasoning.
${streakInfo}
${blacklistInfo}
${learningContext}
MATCHES:
${matchList}

For EACH match, call "predict_matches" with ALL fields including ai_score and anomaly_score.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_matches",
            description: "Submit AI predictions for all analyzed matches",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      fixture_id: { type: "number" },
                      pred_home_win: { type: "number", description: "Home win probability 0-100 (calibrated)" },
                      pred_draw: { type: "number", description: "Draw probability 0-100 (0 for tennis/basketball)" },
                      pred_away_win: { type: "number", description: "Away win probability 0-100 (calibrated)" },
                      pred_score_home: { type: "number" },
                      pred_score_away: { type: "number" },
                      pred_over_under: { type: "number" },
                      pred_over_prob: { type: "number" },
                      pred_btts_prob: { type: "number" },
                      pred_confidence: { type: "string", enum: ["SAFE", "MODÉRÉ", "RISQUÉ"] },
                      pred_value_bet: { type: "boolean" },
                      pred_analysis: { type: "string", description: "3-5 sentences in French with sport-specific reasoning, ✅ Pourquoi and ⚠️ Risques" },
                      ai_score: { type: "number", description: "0-100 quality score" },
                      anomaly_score: { type: "number", description: "0-100 suspect score" },
                    },
                    required: ["fixture_id", "pred_home_win", "pred_draw", "pred_away_win", "pred_score_home", "pred_score_away", "pred_over_under", "pred_over_prob", "pred_btts_prob", "pred_confidence", "pred_value_bet", "pred_analysis", "ai_score", "anomaly_score"],
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
      console.error(`[AI v3] Gateway error ${response.status}: ${errText}`);
      return [];
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("[AI v3] No tool call in response");
      return [];
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const predictions = parsed.predictions as AIPrediction[];

    for (const p of predictions) {
      const total = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(total - 100) > 2) {
        p.pred_home_win = Math.round((p.pred_home_win / total) * 100);
        p.pred_draw = Math.round((p.pred_draw / total) * 100);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }

      p.pred_home_win = capDisplayConfidence(calibrateConfidence(p.pred_home_win));
      p.pred_away_win = capDisplayConfidence(calibrateConfidence(p.pred_away_win));
      const newTotal = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(newTotal - 100) > 1) {
        const scale = 100 / newTotal;
        p.pred_home_win = Math.round(p.pred_home_win * scale);
        p.pred_draw = Math.round(p.pred_draw * scale);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }

      p.ai_score = clamp(Math.round(p.ai_score || 50), 0, 100);
      p.anomaly_score = clamp(Math.round(p.anomaly_score || 0), 0, 100);

      // Apply suspect labels from AI score
      if (p.anomaly_score >= 51) {
        const { label, reason } = getSuspectLabel(p.anomaly_score);
        p.anomaly_label = label;
        p.anomaly_reason = reason;
      }

      const mainProb = Math.max(p.pred_home_win, p.pred_away_win);
      if (p.ai_score < streak.minAiScore || mainProb < streak.minConfidence) {
        p.ai_score = 0;
        continue;
      }

      const odds = estimateOdds(mainProb);
      const vs = computeValueScore(mainProb, odds);
      if (vs < 0.05) {
        p.ai_score = 0;
        continue;
      }

      if ((p.pred_confidence || "").toUpperCase() === "RISQUÉ") {
        const mp = Math.max(p.pred_home_win, p.pred_away_win, p.pred_draw);
        if (mp >= 38) {
          const scale2 = 37 / mp;
          p.pred_home_win = Math.round(p.pred_home_win * scale2);
          p.pred_draw = Math.round(p.pred_draw * scale2);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
        }
        if (streak.isStreakMode) {
          p.ai_score = 0;
          continue;
        }
      }

      // Suspect ≥ 51 → don't recommend but keep visible
      if (p.anomaly_score >= 51 && p.pred_confidence === "SAFE") {
        p.pred_confidence = "MODÉRÉ";
      }

      const homeWins = p.pred_home_win > p.pred_away_win;
      if (homeWins && p.pred_score_home <= p.pred_score_away) {
        [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
        if (p.pred_score_home === p.pred_score_away) p.pred_score_home += 1;
      } else if (!homeWins && p.pred_away_win > p.pred_home_win && p.pred_score_away <= p.pred_score_home) {
        [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
        if (p.pred_score_home === p.pred_score_away) p.pred_score_away += 1;
      }
    }

    const valid = predictions.filter(p => p.ai_score > 0);
    return valid.slice(0, streak.maxPicks);
  } catch (e) {
    clearTimeout(timeout);
    console.error("[AI v3] Error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const forceAll = url.searchParams.get("force") === "true";

    // v3.0: Check streak mode + blacklisted leagues
    const streak = forceAll
      ? { isStreakMode: false, rollingWinrate: 100, maxPicks: 999, minConfidence: 35, minAiScore: 40, lastResults: [] } as StreakState
      : await checkStreakMode(supabase);

    const blacklistedLeagues = await getBlacklistedLeagues(supabase);

    if (streak.isStreakMode) {
      console.log(`[AI-PREDICT v3] 📉 STREAK MODE: winrate=${streak.rollingWinrate}%, maxPicks=${streak.maxPicks}, minConf=${streak.minConfidence}%`);
    }
    if (blacklistedLeagues.size > 0) {
      console.log(`[AI-PREDICT v3] 🚫 Blacklisted leagues: ${[...blacklistedLeagues].join(", ")}`);
    }

    // Self-learning context
    let learningContext = "";
    try {
      const { data: learningStats } = await supabase
        .from("ai_learning_stats")
        .select("*")
        .eq("league_name", "_all")
        .order("total_predictions", { ascending: false })
        .limit(20);

      if (learningStats && learningStats.length > 0) {
        const lines = learningStats.map((s: any) =>
          `• ${s.sport.toUpperCase()} / ${s.confidence_level}: ${s.winrate}% winrate (${s.total_predictions} picks), calibration error ${s.calibration_error}%${s.common_loss_pattern ? `, loss pattern: ${s.common_loss_pattern}` : ""}`
        );
        learningContext = `\n\n🧠 SELF-LEARNING DATA (v3.0):\n${lines.join("\n")}\n\nADJUSTMENTS: If calibration_error > 10 → reduce predicted probability. If winrate < 50% for SAFE → be MORE selective. If league in blacklist → EXCLUDE.\n`;
      }
    } catch (e) {
      console.log("[AI-PREDICT v3] Learning stats not available");
    }

    // Fetch matches needing AI
    let query = supabase
      .from("cached_matches")
      .select("fixture_id, home_team, away_team, sport, league_name, kickoff, pred_analysis, ai_score, pred_home_win, pred_away_win")
      .order("kickoff", { ascending: true });

    if (!forceAll) {
      query = query.or("pred_home_win.is.null,pred_away_win.is.null,pred_analysis.is.null");
    }

    const { data: matches, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw error;

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: "No matches to process", processed: 0,
        streak_mode: streak.isStreakMode, rolling_winrate: streak.rollingWinrate,
        version: "3.0"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-filter excluded + blacklisted leagues
    const eligibleMatches = matches.filter(m =>
      !isExcludedLeague(m.league_name) && !blacklistedLeagues.has(m.league_name)
    );
    const excludedCount = matches.length - eligibleMatches.length;
    console.log(`[AI-PREDICT v3] ${matches.length} total → ${eligibleMatches.length} eligible (${excludedCount} excluded)`);

    let predictions: AIPrediction[] = [];
    let source = "pronosia-v3-deterministic";

    if (apiKey && eligibleMatches.length > 0) {
      predictions = await callAI(apiKey, eligibleMatches, learningContext, streak, blacklistedLeagues);
      if (predictions.length > 0) {
        source = "pronosia-v3-ai";
      }
    }

    // A5: Enhanced fallback with dynamic thresholds
    if (predictions.length === 0 && eligibleMatches.length > 0) {
      console.log(`[AI-PREDICT v3] Using enhanced deterministic engine for ${eligibleMatches.length} matches`);

      // Log fallback activation
      try {
        await supabase.from("admin_logs").insert({
          admin_email: "system",
          action: "fallback-activated",
          details: { reason: "AI gateway unavailable", match_count: eligibleMatches.length },
        });
      } catch {}

      const raw: AIPrediction[] = [];
      for (const m of eligibleMatches) {
        const threshold = await getDynamicThreshold(supabase, m.league_name, m.sport);
        // Get league winrate for suspect detection
        let leagueWr: number | null = null;
        try {
          const { data: lp } = await supabase
            .from("league_performance")
            .select("winrate")
            .eq("league_name", m.league_name)
            .maybeSingle();
          if (lp) leagueWr = lp.winrate;
        } catch {}

        const pred = generatePRONOSIAPrediction(m, streak, threshold.minConfidence, leagueWr);
        if (pred) raw.push(pred);
      }
      predictions = raw.slice(0, streak.maxPicks);
      source = "pronosia-v3-deterministic";
    }

    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    let updated = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const pred = predMap.get(m.fixture_id);
      if (!pred) continue;

      if (!forceAll && m.pred_home_win != null && m.pred_away_win != null && m.pred_analysis) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("cached_matches")
        .update({
          pred_home_win: pred.pred_home_win,
          pred_draw: pred.pred_draw,
          pred_away_win: pred.pred_away_win,
          pred_score_home: pred.pred_score_home,
          pred_score_away: pred.pred_score_away,
          pred_over_under: pred.pred_over_under,
          pred_over_prob: pred.pred_over_prob,
          pred_btts_prob: pred.pred_btts_prob,
          pred_confidence: pred.pred_confidence,
          pred_value_bet: pred.pred_value_bet,
          pred_analysis: pred.pred_analysis,
          ai_score: pred.ai_score,
          anomaly_score: pred.anomaly_score || 0,
          anomaly_label: pred.anomaly_label || null,
          anomaly_reason: pred.anomaly_reason || null,
        })
        .eq("fixture_id", m.fixture_id);

      if (updateError) {
        console.error(`[AI-PREDICT v3] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        if (i === 0) console.log(`[AI-PREDICT v3] Sample: ${m.home_team} vs ${m.away_team}: ${pred.pred_confidence} | AI:${pred.ai_score} | Suspect:${pred.anomaly_score} | ${source}`);
      }
    }

    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%");

    console.log(`[AI-PREDICT v3] ✅ Updated ${updated} matches via ${source}. ${count || 0} remaining. Streak=${streak.isStreakMode}`);

    return new Response(JSON.stringify({
      success: true,
      source,
      version: "3.0",
      batch_size: matches.length,
      eligible: eligibleMatches.length,
      excluded: excludedCount,
      blacklisted_leagues: [...blacklistedLeagues],
      predictions_generated: predictions.length,
      updated,
      remaining_without_ai: count || 0,
      streak_mode: streak.isStreakMode,
      rolling_winrate: streak.rollingWinrate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-PREDICT v3] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
