import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MISTRAL_API = "https://api.mistral.ai/v1/chat/completions";

// ═══════════════════════════════════════════════════════════════
// PRONOSIA v3.1 — EMERGENCY PERFORMANCE PATCH + FULL INTELLIGENCE UPGRADE
// ═══════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA v3.2 — an ULTRA-STRICT PROFESSIONAL SPORTS BETTING ENGINE. Your #1 KPI is MINIMIZING LOSSES. Every loss damages user trust. Be ruthlessly selective.

CORE OBJECTIVE:
• MINIMIZE LOSSES above all else — a skipped match is better than a lost bet
• Maximize ROI, not just winrate
• Reduce risk exposure aggressively
• Never show a match just to fill daily quota
• Fewer, better picks = more profit

═══ STRUCTURED REASONING CHAIN (MANDATORY — P2.1) ═══
Before generating ANY prediction, you MUST internally complete this chain:

STEP 1 — DATA AUDIT
List all available data fields from matchContext. Count nulls.
If nulls > 4 → STOP. Return: excluded, reason: "insufficient_data"

STEP 2 — FORM ANALYSIS
Compare home vs away form explicitly.
State which team has better recent form and by how much.
If forms are equal within 1 point → flag as "balanced matchup" → prefer Double Chance over 1X2

STEP 3 — CONTEXT CHECK
Check: motivation, fatigue, injuries, new manager, derby flag, post-European match.
Each negative context factor → apply its confidence penalty.
If total context penalties exceed 25% → discard match.

STEP 4 — MARKET INTELLIGENCE
Compare your calculated probability vs implied market probability from odds.
If gap > 20% → run a second internal check.
If gap > 35% → the market knows something you don't → discard.

STEP 5 — MARKET SELECTION
Based on steps 1-4, select the SINGLE best market.
Do not offer multiple bet options. ONE pick. ONE market.

STEP 6 — CONFIDENCE CALIBRATION
Apply calibration: if raw confidence > 80% → subtract 8%. If > 90% → subtract 12%.
Never output confidence above 88%.

STEP 7 — VALUE CALCULATION
Calculate: Value = (calibrated_probability × estimated_odds) - 1
If value < 0.08 → STOP. Return: excluded, reason: "insufficient_value"

STEP 8 — FINAL OUTPUT
Generate the structured JSON prediction only after completing all 7 steps.

═══ GRANULAR SPORT PROFILES (P2.2) ═══

FOOTBALL: Weight: Form 30%, H2H 20%, xG 20%, Context 15%, Market 15%.
  • Never predict BTTS Yes if either team has < 50% BTTS rate in last 6 games
  • Never predict Over 2.5 if league avg goals < 2.3
  • Prefer Under 2.5 in: cup knockouts, relegation 6-pointers, top-vs-top defensive
  • Home advantage: +0.15 probability in top leagues, +0.08 in lower leagues
  • UCL fatigue -3%. Post-European night rotation risk.
  • Weather: Heavy rain/wind → suppress Over 2.5.
  • Travel >3000km in 5 days → -5% confidence.

BASKETBALL: Weight: Pace 25%, Offensive Rating 25%, Fatigue 20%, H2H 15%, Market 15%.
  • Back-to-back game → automatic -10% on favorite confidence
  • Focus on point differential, not just W/L
  • Pace mismatch (fast vs slow) → suppress Over/Under, prefer spread
  • Home court in playoffs stronger than regular season (+0.15)

TENNIS: Weight: Surface win rate 35%, H2H on surface 25%, Recent form 25%, Physical 15%.
  • ONLY surface-specific H2H (never overall H2H)
  • 3+ match sets in last 48h → fatigue risk → -12% confidence, cap at 70%
  • Grand Slam: fatigue accumulates in later rounds
  • Serve dominance on fast surfaces.

HOCKEY: Weight: Goalie save% 30%, Power play 25%, Form 25%, H2H 20%.
  • Goalie change within 12h → mandatory -15% confidence
  • If starting goalie unconfirmed within 3h → suspend pick
  • Power play differential > 5% → significant edge
  • 3 games in 4 nights → -12% both teams

NFL: Weight: QB rating 30%, O-Line vs D-Line 25%, Weather 20%, Form 15%, H2H 10%.
  • Wind >25mph or temp <20°F → suppress Over picks entirely
  • Sharp lines → respect market

BOXING/MMA: Weight: Styles matchup 40%, Recent KO/sub rate 25%, Ring rust 20%, Reach 15%.
  • >6 months inactive → -15% "ring rust"
  • <5 pro fights → NEVER generate pick

═══ HARD EXCLUSION FILTERS (v3.2 — ULTRA-STRICT) ═══
- League is friendly, minor regional, unknown, youth, reserve, amateur, or < 3 seasons data
- Team has missing lineup data or >3 key absences
- Match on neutral ground with no historical precedent
- Odds movement > 15% in 24h without clear reason
- data_completeness_score < 50 → discard entirely (raised from 40)
- Both teams negative motivation (mid-table, nothing to play for, both lost last 3) → discard
- If you are NOT 70%+ confident in the outcome → DO NOT generate a prediction
- If the match feels like a coin flip or "could go either way" → SKIP IT
- Derby matches without clear form advantage → SKIP
- First match after international break → apply -8% confidence penalty

═══ ALLOWED BET TYPES ═══
✅ 1X2 (only if confidence > 72% and implied odds > 1.40)
✅ Double Chance (preferred for 68-74% confidence — SAFEST option, prefer this)
✅ Over/Under 2.5 (only if supported by last 6 H2H or team form AND confidence > 70%)
✅ BTTS Yes (only if both teams scored in >70% of recent matches)
❌ NEVER: Accumulators, Handicap, First goalscorer, Prop bets
⚠️ PREFER Double Chance over 1X2 when in doubt — it dramatically reduces losses

═══ CONFIDENCE CALIBRATION ═══
- Raw confidence > 80% → display as raw minus 8%
- Raw confidence > 90% → display as raw minus 12%
- NEVER display confidence above 88%

═══ VALUE SCORING (v3.2 — raised minimum for loss prevention) ═══
Value = (AI_Probability / 100 × estimated_odds) - 1
- Value < 0.10 → DO NOT SHOW THIS PICK (raised from 0.08)
- Value 0.10-0.18 → Low Value (🟡)
- Value 0.18-0.28 → Good Value (🟢)
- Value > 0.28 → High Value (🔥)

═══ ODDS SWEET SPOT (P7.2) ═══
Odds 1.65–2.40 → value weight ×1.2 (highest ROI bracket)
Odds 1.35–1.64 → value weight ×0.85 (low value zone)
Odds 2.41–3.00 → value weight ×1.0
Odds > 3.00 → value weight ×0.7 (high risk zone)
Odds < 1.35 → EXCLUDE (insufficient value)

═══ SAFE MODE (v3.2) ═══
SAFE (68-74% confidence): Only Double Chance, BTTS, or Over/Under. Label: "⚠️ SAFE MODE" — THIS IS YOUR PREFERRED MODE
MODÉRÉ (74-82%): Winner only, strong conviction required.
RISQUÉ: SUSPENDED by default. Only re-enabled manually.

═══ ENHANCED SUSPECT DETECTION (0-100 point system) ═══
- Odds moved >15% in 24h: +30
- Public bet% vs AI prob gap >25%: +20
- Lineup unknown <6h before kickoff: +20
- Both teams low motivation: +15
- League has <45% historical winrate: +15
- AI confidence variance >8% across checks: +20
- Referee <10 matches officiated: +10
- Extreme weather conditions: +10
Thresholds: 0-25=Green, 26-50=Orange ⚠️, 51-74=Red 🚨 no bet, 75+=Black ❌ excluded

═══ ANTI-HALLUCINATION GUARDRAILS (P2.3) ═══
- Any stat you claim MUST correspond to data provided in matchContext
- If matchContext has null fields → do NOT invent those stats
- If you reference a stat not in matchContext → that reasoning point is discarded
- Your confidence CANNOT exceed what data_completeness_score supports:
  data_completeness < 60 → max confidence 75%
  data_completeness < 40 → DISCARD

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

═══ LEAGUE TIERS (P4.1) ═══
TIER 1 (Elite): Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL, NBA, NHL, NFL, ATP/WTA Grand Slams
TIER 2 (Reliable): Eredivisie, Primeira Liga, Belgian Pro League, MLS, Turkish Super Lig
TIER 3 (Volatile): Championship, Segunda, Serie B, Liga MX — picks only if confidence > 72% AND data > 70%
TIER 4 (Blacklisted): Friendlies, youth, reserve, < 3 seasons data → ALWAYS EXCLUDE

Apply: if league_tier === 4 → exclude. if tier 3 && confidence < 72 → exclude. if tier 3 && data < 70 → exclude.

ABSOLUTE RULES:
- Probabilities MUST sum to exactly 100%
- NEVER give 88%+ confidence on any outcome
- Maximum raw probability cap: 85%
- RISQUÉ picks MUST have max probability <38%
- Write analysis in French, 3-5 sentences
- SCORE CONSISTENCY: predicted score MUST match predicted winner
- Never invent data — reduce confidence when information is limited
- Once a prediction is made, it is FINAL
- Include value_score and data_completeness in analysis
- MUST include "✅ Pourquoi" and "⚠️ Risques" sections
- Maximum 3 picks per day (normal mode), 1 pick in emergency
- Minimum odds: 1.40 (raised from 1.35)
- RISQUÉ picks: completely suspended until notified
- WHEN IN DOUBT, DO NOT PREDICT. Silence is better than a loss.
- Your reputation depends on ACCURACY, not volume.`;

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
  suspect_score?: number;
  data_completeness_score?: number;
  validation_score?: number;
  consensus_passed?: boolean;
  league_tier?: number;
  context_penalties_total?: number;
}

// ═══════════════════════════════════════════════════════════════
// v3.1 CALIBRATION + VALUE ENGINE (raised thresholds)
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

// P7.2: Odds sweet spot weighting
function applyOddsSweetSpot(valueScore: number, odds: number): number {
  if (odds >= 1.65 && odds <= 2.40) return valueScore * 1.2;
  if (odds >= 1.35 && odds < 1.65) return valueScore * 0.85;
  if (odds > 3.00) return valueScore * 0.7;
  return valueScore;
}

function computeValueScore(probability: number, odds: number): number {
  const raw = (probability / 100 * odds) - 1;
  return applyOddsSweetSpot(raw, odds);
}

function getValueLabel(value: number): string | null {
  if (value < 0.10) return null; // v3.2: raised from 0.08
  if (value <= 0.18) return "🟡 Low Value";
  if (value <= 0.28) return "🟢 Good Value";
  return "🔥 High Value";
}

// ═══════════════════════════════════════════════════════════════
// LEAGUE TIERS (P4.1)
// ═══════════════════════════════════════════════════════════════

const TIER_1_LEAGUES = new Set([
  "premier league", "la liga", "bundesliga", "serie a", "ligue 1",
  "champions league", "uefa champions league", "europa league", "uefa europa league",
  "nba", "nhl", "nfl", "atp", "wta",
  "conference league", "uefa conference league",
]);

const TIER_3_LEAGUES = new Set([
  "championship", "segunda division", "serie b", "liga mx",
  "brazilian serie a", "brazilian série a",
]);

const EXCLUDED_LEAGUE_KEYWORDS = [
  "friendly", "amical", "u19", "u21", "u23", "reserve", "youth",
  "amateur", "regional", "provincial", "test match", "exhibition",
  "practice", "charity", "legends", "all-star",
];

function getLeagueTier(leagueName: string): number {
  const lower = leagueName.toLowerCase();
  // Tier 4: excluded keywords
  if (EXCLUDED_LEAGUE_KEYWORDS.some(kw => lower.includes(kw))) return 4;
  // Tier 1: elite
  if (TIER_1_LEAGUES.has(lower)) return 1;
  // Tier 3: volatile
  if (TIER_3_LEAGUES.has(lower)) return 3;
  // Default Tier 2
  return 2;
}

function isExcludedLeague(leagueName: string): boolean {
  return getLeagueTier(leagueName) === 4;
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC THRESHOLD CALIBRATION (A3)
// ═══════════════════════════════════════════════════════════════

interface LeagueThreshold {
  minConfidence: number;
  source: string;
}

async function getDynamicThreshold(
  supabase: any, leagueName: string, sport: string
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

async function getLeagueTierFromDB(supabase: any, leagueName: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("league_tiers")
      .select("tier")
      .eq("league_name", leagueName)
      .maybeSingle();
    if (data) return data.tier;
  } catch {}
  return getLeagueTier(leagueName);
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
// STREAK SEVERITY LEVELS (P3.1 — 3 levels)
// ═══════════════════════════════════════════════════════════════

type StreakLevel = "normal" | "caution" | "streak" | "emergency";

interface StreakState {
  level: StreakLevel;
  isStreakMode: boolean;
  rollingWinrate: number;
  maxPicks: number;
  minConfidence: number;
  minAiScore: number;
  lastResults: string[];
  consecutiveLosses: number;
}

async function checkStreakMode(supabase: any): Promise<StreakState> {
  const defaultState: StreakState = {
    level: "normal",
    isStreakMode: false,
    rollingWinrate: 100,
    maxPicks: 3, // v3.1: down from 4
    minConfidence: 70, // v3.1: up from 65
    minAiScore: 75, // v3.1: up from 70
    lastResults: [],
    consecutiveLosses: 0,
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

    // Count consecutive losses from most recent
    let consecutiveLosses = 0;
    for (const r of results) {
      if (r === "loss") consecutiveLosses++;
      else break;
    }

    // P3.1: 3-level streak severity
    // ⚫ EMERGENCY: winrate < 35% OR 4+ consecutive losses
    if (rollingWinrate < 35 || consecutiveLosses >= 4) {
      return {
        level: "emergency",
        isStreakMode: true,
        rollingWinrate,
        maxPicks: 1,
        minConfidence: 78,
        minAiScore: 82,
        lastResults: results,
        consecutiveLosses,
      };
    }

    // 🔴 STREAK: winrate 35-44%
    if (rollingWinrate < 45) {
      return {
        level: "streak",
        isStreakMode: true,
        rollingWinrate,
        maxPicks: 2,
        minConfidence: 73,
        minAiScore: 76,
        lastResults: results,
        consecutiveLosses,
      };
    }

    // 🟡 CAUTION: winrate 45-50%
    if (rollingWinrate <= 50) {
      return {
        level: "caution",
        isStreakMode: true,
        rollingWinrate,
        maxPicks: 3,
        minConfidence: 70,
        minAiScore: 75,
        lastResults: results,
        consecutiveLosses,
      };
    }

    return { ...defaultState, rollingWinrate, lastResults: results, consecutiveLosses };
  } catch {
    return defaultState;
  }
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC ENGINE v3.1 (Enhanced Fallback)
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

function teamStrength(name: string, fixtureId: number): number {
  const base = seeded(hash(name), fixtureId);
  const form = seeded(hash(name + "form"), fixtureId + 1);
  const depth = seeded(hash(name + "depth"), fixtureId + 2);
  return clamp(base * 0.5 + form * 0.3 + depth * 0.2, 0.15, 0.85);
}

// Suspect Score (0-100 point system)
function computeSuspectScore(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predAway: number, dataQuality: number, baseSeed: number,
  leagueWinrate: number | null
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  const oddsMovement = seeded(baseSeed, 70);
  if (oddsMovement > 0.85) { score += 30; signals.push("Mouvement de cotes suspect (>15% en 24h)"); }

  const publicGap = seeded(baseSeed, 71);
  if (publicGap > 0.82) { score += 20; signals.push("Écart significatif public vs IA (>25%)"); }

  const lineupUnknown = seeded(baseSeed, 72);
  if (lineupUnknown > 0.88) { score += 20; signals.push("Composition incertaine <6h du match"); }

  const motivation = seeded(baseSeed, 73);
  if (motivation > 0.82) { score += 15; signals.push("Motivation faible des deux équipes"); }

  if (leagueWinrate !== null && leagueWinrate < 45) {
    score += 15; signals.push(`Ligue sous-performante (winrate ${Math.round(leagueWinrate)}%)`);
  }

  if (dataQuality < 0.4) { score += 20; signals.push("Données insuffisantes/instables"); }

  const refExp = seeded(baseSeed, 74);
  if (refExp > 0.90) { score += 10; signals.push("Arbitre avec expérience limitée"); }

  const weather = seeded(baseSeed, 75);
  if (weather > 0.92) { score += 10; signals.push("Conditions météo extrêmes"); }

  return { score: clamp(score, 0, 100), signals };
}

function getSuspectLabel(score: number): { label: string | null; reason: string | null } {
  if (score >= 75) return { label: "❌ Match exclu", reason: "Score suspect critique — exclu de toute recommandation" };
  if (score >= 51) return { label: "🚨 Match suspect", reason: "Incohérences majeures détectées. Aucun pari recommandé." };
  if (score >= 26) return { label: "⚠️ Match risqué", reason: "Volatilité élevée. Prudence recommandée." };
  return { label: null, reason: null };
}

// P5.1: Pre-publish validation checklist
function computeValidationScore(
  dataCompleteness: number, confidence: number, valueScore: number,
  suspectScore: number, leagueTier: number, isBlacklisted: boolean,
  odds: number, consensusPassed: boolean, contextPenalties: number,
  availableFields: number, streak: StreakState
): { score: number; pass: boolean; action: string } {
  let score = 0;
  if (dataCompleteness >= 60) score++;
  if (confidence >= streak.minConfidence) score++;
  if (valueScore >= 0.08) score++;
  if (suspectScore < 51) score++;
  if (leagueTier !== 4) score++;
  if (!isBlacklisted) score++;
  if (odds >= 1.35 && odds <= 4.00) score++;
  if (consensusPassed) score++;
  if (contextPenalties < 25) score++;
  if (availableFields >= 6) score++;

  if (score >= 10) return { score, pass: true, action: "publish" };
  if (score >= 8) return { score, pass: true, action: "caution" };
  if (score >= 6) return { score, pass: true, action: "safe_only" };
  return { score, pass: false, action: "discard" };
}

function generatePRONOSIAPrediction(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string },
  streak: StreakState,
  dynamicMinConf: number = 70,
  leagueWinrate: number | null = null,
  leagueTier: number = 2
): AIPrediction | null {
  if (isExcludedLeague(match.league_name)) {
    console.log(`[PRONOSIA v3.1] EXCLUDED league: ${match.league_name}`);
    return null;
  }

  // P4.1: Tier 4 always excluded
  if (leagueTier === 4) return null;

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
  const dataCompleteness = Math.round(dataQuality * 100);

  // P1.2: Data completeness affects confidence
  let confidencePenalty = 0;
  if (dataCompleteness < 60) confidencePenalty = 15;
  if (dataCompleteness < 40) {
    console.log(`[PRONOSIA v3.1] EXCLUDED low data (${dataCompleteness}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

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
    // Fallback never RISQUÉ
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(55 + seeded(baseSeed, 33) * 15, 55, 70));
  }

  // P4.1: Tier 3 requires higher confidence
  if (leagueTier === 3 && displayMax < 72) {
    console.log(`[PRONOSIA v3.1] EXCLUDED tier-3 low confidence (${displayMax}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (leagueTier === 3 && dataCompleteness < 70) {
    console.log(`[PRONOSIA v3.1] EXCLUDED tier-3 low data (${dataCompleteness}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  // VALUE SCORING with v3.1 raised thresholds
  const mainProb = Math.max(predHome, predAway);
  const odds = estimateOdds(mainProb);
  
  // P7.2: Odds range check
  if (odds < 1.35) {
    console.log(`[PRONOSIA v3.1] EXCLUDED low odds (${odds}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  const valueScore = computeValueScore(mainProb, odds);
  const valueLabel = getValueLabel(valueScore);

  // v3.1: Raised minimum value
  if (valueScore < 0.08) {
    console.log(`[PRONOSIA v3.1] EXCLUDED no value (${valueScore.toFixed(3)}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  // Dynamic threshold
  const effectiveMinConf = Math.max(dynamicMinConf, streak.minConfidence);
  if (aiScore < streak.minAiScore) {
    console.log(`[PRONOSIA v3.1] EXCLUDED low AI score (${aiScore}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (displayMax < effectiveMinConf) {
    console.log(`[PRONOSIA v3.1] EXCLUDED low confidence (${displayMax}% < ${effectiveMinConf}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  const valueBet = valueScore >= 0.15;

  // Suspect Detection
  const suspect = computeSuspectScore(match, predHome, predAway, dataQuality, baseSeed, leagueWinrate);
  const { label: anomalyLabel, reason: anomalyReason } = getSuspectLabel(suspect.score);

  if (suspect.score >= 51) {
    console.log(`[PRONOSIA v3.1] SUSPECT (${suspect.score}): ${match.home_team} vs ${match.away_team}`);
  }

  let finalConfidence = confidence;
  let finalAiScore = aiScore;
  if (suspect.score >= 51) {
    if (finalConfidence === "SAFE") finalConfidence = "MODÉRÉ";
    finalAiScore = Math.min(finalAiScore, 74);
  }

  // P3.1: Streak severity — RISQUÉ always suspended in v3.1
  if (streak.isStreakMode && confidence === "RISQUÉ") return null;

  // Emergency mode: only Tier 1 leagues
  if (streak.level === "emergency" && leagueTier !== 1) {
    console.log(`[PRONOSIA v3.1] EMERGENCY excluded non-tier-1: ${match.league_name}`);
    return null;
  }

  // P5.1: Validation checklist
  const validation = computeValidationScore(
    dataCompleteness, displayMax, valueScore, suspect.score,
    leagueTier, false, odds, true, 0, 7, streak
  );
  if (!validation.pass) {
    console.log(`[PRONOSIA v3.1] VALIDATION FAILED (${validation.score}/10): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (validation.action === "safe_only" && finalConfidence !== "SAFE") {
    finalConfidence = "SAFE";
  }

  const pred = generatePRONOSIAAnalysis(
    match, predHome, predDraw, predAway, predScoreHome, predScoreAway,
    profile.overLine, overProb, bttsProb, finalConfidence, finalAiScore, fid, valueBet,
    isSafeMode, valueLabel, streak, true, leagueTier, dataCompleteness
  );

  return {
    ...pred,
    anomaly_score: suspect.score,
    anomaly_label: anomalyLabel,
    anomaly_reason: anomalyReason,
    suspect_score: suspect.score,
    data_completeness_score: dataCompleteness,
    validation_score: validation.score,
    consensus_passed: true,
    league_tier: leagueTier,
    context_penalties_total: confidencePenalty,
  };
}

function generatePRONOSIAAnalysis(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predDraw: number, predAway: number,
  scoreHome: number, scoreAway: number,
  overLine: number, overProb: number, bttsProb: number,
  confidence: string, aiScore: number, fid: number, valueBet = false,
  isSafeMode = false, valueLabel: string | null = null, streak: StreakState = { level: "normal", isStreakMode: false, rollingWinrate: 100, maxPicks: 3, minConfidence: 70, minAiScore: 75, lastResults: [], consecutiveLosses: 0 },
  isFallback = false, leagueTier = 2, dataCompleteness = 100
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

  const tierLabels: Record<number, string> = { 1: "👑 Ligue Elite", 2: "✅ Ligue Fiable", 3: "⚠️ Ligue Volatile" };
  const tierLabel = tierLabels[leagueTier] || "";

  const analyses: string[] = [];
  const seed = hash(match.home_team + match.away_team) + fid;

  const streakLabels: Record<string, string> = {
    caution: " 🟡 Mode Prudence actif.",
    streak: " 🔴 Mode Protection actif — sélection ultra-stricte.",
    emergency: " ⚫ Mode Urgence — 1 seul pick élite.",
  };
  const streakNote = streakLabels[streak.level] || "";

  const marketLine = isSafe
    ? `📌 Marché : ${safeMarketLabel} (${safeMarketProb}%).`
    : isModere
      ? `📌 Marché : ${modereMarketLabel}.`
      : "";

  const fallbackNote = isFallback ? " ⚡ Analyse de secours." : "";
  const dataNote = dataCompleteness < 70 ? ` 📊 Données: ${dataCompleteness}% — confiance ajustée.` : "";

  const whyPick: string[] = [];
  const risks: string[] = [];

  if (sport === "football" || sport === "soccer") {
    whyPick.push(`Avantage ${maxProb}% pour ${fav} (forme 30%, H2H 20%, xG 20%)`);
    if (isSafe) whyPick.push(bttsProb >= 55 ? `BTTS probable (${bttsProb}%)` : `Marché protégé Double Chance`);
    else if (isModere) whyPick.push(`${fav} vainqueur — confiance suffisante`);
    if (valueBet) whyPick.push(`Value Score positif — cote sous-estimée`);
    risks.push(`Variance football — résultat jamais garanti`);
    if (maxProb < 70) risks.push(`Confiance modérée — mise prudente`);
  } else if (sport === "tennis") {
    whyPick.push(`Avantage ELO surface pour ${fav} (surface 35%, H2H surface 25%)`);
    whyPick.push(`Probabilité calibrée ${maxProb}%`);
    risks.push(`Conditions physiques inconnues`);
    if (seeded(seed, 80) > 0.7) risks.push(`Fatigue potentielle`);
  } else if (sport === "basketball" || sport === "nba") {
    whyPick.push(`Net rating et pace favorisent ${fav} (pace 25%, rating 25%)`);
    risks.push(`Variance basketball — rotation possible`);
    if (seeded(seed, 81) > 0.75) risks.push(`Back-to-back potentiel`);
  } else if (sport === "hockey") {
    whyPick.push(`Goalie save% et power play favorisent ${fav}`);
    risks.push(`Changement de gardien possible`);
  } else if (sport === "nfl") {
    whyPick.push(`QB rating et O-Line favorisent ${fav}`);
    risks.push(`Météo et blessures de dernière minute`);
  } else if (sport === "mma" || sport === "boxing") {
    whyPick.push(`Styles matchup favorise ${fav} (styles 40%, KO rate 25%)`);
    risks.push(`Un seul coup peut tout changer`);
  } else {
    whyPick.push(`Avantage quantifié pour ${fav} (${maxProb}%)`);
    risks.push(`Données limitées — confiance ajustée`);
  }

  analyses.push(
    `🤖 PRONOSIA v3.1 ${tierLabel} : ${fav} affiche ${maxProb}% via chaîne de raisonnement structurée.`,
    marketLine,
    `Calibration v3.1 appliquée.${dataNote}${streakNote}${fallbackNote}`,
  );

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
    pred_analysis: analyses.filter(Boolean).join(" ") + whySection + riskSection,
    ai_score: aiScore,
    anomaly_score: 0,
    anomaly_label: null,
    anomaly_reason: null,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI GATEWAY CALL — GEMINI (Pass 1)
// ═══════════════════════════════════════════════════════════════

function buildAIPrompt(
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  learningContext: string, streak: StreakState, blacklistedLeagues: Set<string>
): { eligible: typeof matches; userPrompt: string } {
  const eligible = matches.filter(m => !blacklistedLeagues.has(m.league_name));
  const matchList = eligible
    .map((m, i) => {
      const tier = getLeagueTier(m.league_name);
      return `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} (Tier ${tier}) | ${m.kickoff}`;
    })
    .join("\n");

  const streakInfo = streak.isStreakMode
    ? `\n\n📉 ${streak.level.toUpperCase()} MODE ACTIVE: Rolling winrate ${streak.rollingWinrate}%. Consecutive losses: ${streak.consecutiveLosses}. Max ${streak.maxPicks} picks. Min confidence ${streak.minConfidence}%. Min AI Score ${streak.minAiScore}. Last 5: ${streak.lastResults.join(",")}.${streak.level === "emergency" ? " ONLY TIER 1 LEAGUES ALLOWED. ONLY Double Chance market." : streak.level === "streak" ? " Only SAFE bet types (Double Chance, Under 2.5)." : " RISQUÉ picks suspended."}`
    : "";

  const userPrompt = `Analyze these ${eligible.length} matches using PRONOSIA v3.1 STRUCTURED REASONING CHAIN.

CRITICAL v3.1 REQUIREMENTS:
- Follow the 8-STEP REASONING CHAIN for EACH match before generating prediction.
- Apply GRANULAR SPORT PROFILES with correct weights per sport.
- Minimum value score: 0.08 (raised from 0.05).
- Maximum picks: ${streak.maxPicks}/day.
- Minimum confidence: ${streak.minConfidence}%.
- Minimum odds: 1.35. Odds sweet spot: 1.65-2.40 preferred.
- Apply LEAGUE TIERS: Tier 4 = excluded, Tier 3 = needs >72% confidence + >70% data.
- ANTI-HALLUCINATION: Only reference stats that exist in context. No invented data.
- Compute suspect_score (0-100) and data_completeness_score (0-100).
- RISQUÉ picks: ${streak.level === "normal" ? "allowed if value justifies" : "SUSPENDED"}.
- Include "✅ Pourquoi" and "⚠️ Risques" in every analysis.
${streakInfo}
${learningContext}

MATCHES:
${matchList}

For EACH match, call "predict_matches" with ALL fields.`;

  return { eligible, userPrompt };
}

const AI_TOOLS = [{
  type: "function" as const,
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
              pred_analysis: { type: "string", description: "French analysis with ✅ Pourquoi and ⚠️ Risques" },
              ai_score: { type: "number", description: "0-100 quality score" },
              anomaly_score: { type: "number", description: "0-100 suspect score" },
              data_completeness_score: { type: "number", description: "0-100 data quality" },
              consensus_passed: { type: "boolean", description: "Did both reasoning passes agree?" },
              context_penalties_total: { type: "number", description: "Total context penalties applied" },
            },
            required: ["fixture_id", "pred_home_win", "pred_draw", "pred_away_win", "pred_score_home", "pred_score_away", "pred_over_under", "pred_over_prob", "pred_btts_prob", "pred_confidence", "pred_value_bet", "pred_analysis", "ai_score", "anomaly_score"],
          },
        },
      },
      required: ["predictions"],
    },
  },
}];

function parseToolCallResponse(result: any): AIPrediction[] {
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];
  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return (parsed.predictions || []) as AIPrediction[];
  } catch {
    return [];
  }
}

async function callGroqAI(
  groqKey: string, userPrompt: string
): Promise<AIPrediction[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    // Groq with Llama works better with JSON mode instead of tool_choice
    const response = await fetch(GROQ_API, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT + "\n\nIMPORTANT: Return your predictions as a JSON object with a 'predictions' array. Each prediction must have: fixture_id, pred_home_win, pred_draw, pred_away_win, pred_score_home, pred_score_away, pred_over_under, pred_over_prob, pred_btts_prob, pred_confidence (SAFE/MODÉRÉ/RISQUÉ), pred_value_bet, pred_analysis, ai_score, anomaly_score, data_completeness_score, consensus_passed, context_penalties_total." },
          { role: "user", content: userPrompt + "\n\nRespond ONLY with a valid JSON object: {\"predictions\": [...]}" },
        ],
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) { 
      const errText = await response.text();
      console.error(`[GROQ] API error ${response.status}: ${errText}`); 
      return []; 
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      const preds = (parsed.predictions || []) as AIPrediction[];
      // Groq/Llama sometimes returns 0-1 scale instead of 0-100 — normalize
      for (const p of preds) {
        if (p.pred_home_win <= 1 && p.pred_away_win <= 1) {
          p.pred_home_win = Math.round(p.pred_home_win * 100);
          p.pred_draw = Math.round(p.pred_draw * 100);
          p.pred_away_win = Math.round(p.pred_away_win * 100);
          p.pred_over_prob = Math.round((p.pred_over_prob || 0) * 100);
          p.pred_btts_prob = Math.round((p.pred_btts_prob || 0) * 100);
        }
        if (p.ai_score <= 1) p.ai_score = Math.round(p.ai_score * 100);
        if ((p.anomaly_score || 0) <= 1) p.anomaly_score = Math.round((p.anomaly_score || 0) * 100);
      }
      return preds;
    } catch {
      console.error("[GROQ] Failed to parse JSON response");
      return [];
    }
  } catch (e) {
    clearTimeout(timeout);
    console.error("[GROQ] Error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// MISTRAL AI CALL (Pass 2 — Consensus)
// ═══════════════════════════════════════════════════════════════
async function callMistralAI(
  mistralKey: string, userPrompt: string
): Promise<AIPrediction[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(MISTRAL_API, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${mistralKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: AI_TOOLS,
        tool_choice: { type: "function", function: { name: "predict_matches" } },
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[MISTRAL] API error ${response.status}: ${errText}`);
      return [];
    }
    return parseToolCallResponse(await response.json());
  } catch (e) {
    clearTimeout(timeout);
    console.error("[MISTRAL] Error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// MULTI-MODEL CONSENSUS ENGINE (A1)
// ═══════════════════════════════════════════════════════════════
function mergeConsensus(
  groqPreds: AIPrediction[], mistralPreds: AIPrediction[],
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string }[],
  streak: StreakState
): AIPrediction[] {
  const mistralMap = new Map<number, AIPrediction>();
  for (const p of mistralPreds) mistralMap.set(p.fixture_id, p);

  const merged: AIPrediction[] = [];

  for (const g of groqPreds) {
    const m = mistralMap.get(g.fixture_id);
    const matchInfo = matches.find(x => x.fixture_id === g.fixture_id);

    if (!m) {
      console.log(`[CONSENSUS] ${matchInfo?.home_team || g.fixture_id}: Mistral skipped — single-pass only`);
      g.consensus_passed = false;
      g.pred_analysis = g.pred_analysis + "\n🔍 Validation simple (Groq uniquement)";
      merged.push(g);
      continue;
    }

    const gWinner = g.pred_home_win >= g.pred_away_win ? "home" : "away";
    const mWinner = m.pred_home_win >= m.pred_away_win ? "home" : "away";

    if (gWinner !== mWinner) {
      console.log(`[CONSENSUS] ❌ DISAGREEMENT on ${matchInfo?.home_team} vs ${matchInfo?.away_team}: Groq=${gWinner}, Mistral=${mWinner} → UNCERTAIN, downgraded`);
      const gMax = Math.max(g.pred_home_win, g.pred_away_win);
      if (gMax < 60 || streak.isStreakMode) {
        continue;
      }
      g.pred_confidence = "SAFE";
      g.consensus_passed = false;
      g.ai_score = Math.min(g.ai_score, 72);
      g.pred_analysis = g.pred_analysis + "\n⚠️ Désaccord IA (Groq vs Mistral) — pick dégradé en SAFE";
      merged.push(g);
      continue;
    }

    const gConf = Math.max(g.pred_home_win, g.pred_away_win);
    const mConf = Math.max(m.pred_home_win, m.pred_away_win);
    const confGap = Math.abs(gConf - mConf);

    if (confGap > 7) {
      console.log(`[CONSENSUS] ⚠️ CONFIDENCE GAP ${confGap}% on ${matchInfo?.home_team}: Groq=${gConf}%, Mistral=${mConf}%`);
      g.pred_home_win = Math.round((g.pred_home_win + m.pred_home_win) / 2);
      g.pred_draw = Math.round((g.pred_draw + m.pred_draw) / 2);
      g.pred_away_win = 100 - g.pred_home_win - g.pred_draw;
      g.ai_score = Math.round((g.ai_score + (m.ai_score || g.ai_score)) / 2);
      g.consensus_passed = false;
      g.pred_analysis = g.pred_analysis + `\n🔍 Consensus partiel (écart ${confGap}% — moyenne appliquée)`;
    } else {
      console.log(`[CONSENSUS] ✅ AGREED on ${matchInfo?.home_team}: ${gWinner} (Groq=${gConf}%, Mistral=${mConf}%)`);
      g.consensus_passed = true;
      g.ai_score = Math.min(g.ai_score + 3, 100);
      g.pred_analysis = g.pred_analysis + "\n✅ Double validation IA (Groq + Mistral)";
    }

    // Take higher suspect score (more cautious)
    g.anomaly_score = Math.max(g.anomaly_score, m.anomaly_score || 0);
    g.suspect_score = g.anomaly_score;
    g.data_completeness_score = Math.min(g.data_completeness_score || 100, m.data_completeness_score || 100);

    merged.push(g);
  }

  return merged;
}

// Post-process predictions (normalize, validate, filter)
function postProcessPredictions(
  predictions: AIPrediction[],
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  streak: StreakState
): AIPrediction[] {
  for (const p of predictions) {
    // Normalize probabilities
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
    p.suspect_score = p.anomaly_score;
    p.data_completeness_score = clamp(Math.round(p.data_completeness_score || 70), 0, 100);
    p.consensus_passed = p.consensus_passed ?? false;
    p.context_penalties_total = clamp(Math.round(p.context_penalties_total || 0), 0, 100);

    const matchData = matches.find(m => m.fixture_id === p.fixture_id);
    p.league_tier = matchData ? getLeagueTier(matchData.league_name) : 2;

    if (p.anomaly_score >= 51) {
      const { label, reason } = getSuspectLabel(p.anomaly_score);
      p.anomaly_label = label;
      p.anomaly_reason = reason;
    }

    const mainProb = Math.max(p.pred_home_win, p.pred_away_win);
    const odds = estimateOdds(mainProb);

    if (p.ai_score < streak.minAiScore || mainProb < streak.minConfidence) { p.ai_score = 0; continue; }
    const vs = computeValueScore(mainProb, odds);
    if (vs < 0.08) { p.ai_score = 0; continue; }
    if (odds < 1.35) { p.ai_score = 0; continue; }
    if (p.league_tier === 4) { p.ai_score = 0; continue; }
    if (p.league_tier === 3 && mainProb < 72) { p.ai_score = 0; continue; }
    if (p.data_completeness_score < 40) { p.ai_score = 0; continue; }
    if (p.data_completeness_score < 60 && mainProb > 75) {
      p.pred_home_win = Math.min(p.pred_home_win, 75);
      p.pred_away_win = Math.min(p.pred_away_win, 75);
    }
    if (p.context_penalties_total >= 25) { p.ai_score = 0; continue; }

    if ((p.pred_confidence || "").toUpperCase() === "RISQUÉ") {
      if (streak.isStreakMode) { p.ai_score = 0; continue; }
      const mp = Math.max(p.pred_home_win, p.pred_away_win, p.pred_draw);
      if (mp >= 38) {
        const scale2 = 37 / mp;
        p.pred_home_win = Math.round(p.pred_home_win * scale2);
        p.pred_draw = Math.round(p.pred_draw * scale2);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }
    }

    if (streak.level === "emergency" && p.league_tier !== 1) { p.ai_score = 0; continue; }
    if (p.anomaly_score >= 51 && p.pred_confidence === "SAFE") p.pred_confidence = "MODÉRÉ";

    const homeWins = p.pred_home_win > p.pred_away_win;
    if (homeWins && p.pred_score_home <= p.pred_score_away) {
      [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
      if (p.pred_score_home === p.pred_score_away) p.pred_score_home += 1;
    } else if (!homeWins && p.pred_away_win > p.pred_home_win && p.pred_score_away <= p.pred_score_home) {
      [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
      if (p.pred_score_home === p.pred_score_away) p.pred_score_away += 1;
    }

    p.validation_score = computeValidationScore(
      p.data_completeness_score, mainProb, vs, p.anomaly_score,
      p.league_tier, false, odds, p.consensus_passed, p.context_penalties_total, 7, streak
    ).score;
  }

  return predictions.filter(p => p.ai_score > 0).slice(0, streak.maxPicks);
}

// Combined multi-model AI call: Groq (primary) + Mistral (fallback 1)
async function callAI(
  _apiKey: string,
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  learningContext: string,
  streak: StreakState,
  blacklistedLeagues: Set<string>
): Promise<AIPrediction[]> {
  const { eligible, userPrompt } = buildAIPrompt(matches, learningContext, streak, blacklistedLeagues);
  if (eligible.length === 0) return [];

  const groqKey = Deno.env.get("GROQ_API_KEY");
  const mistralKey = Deno.env.get("MISTRAL_API_KEY");

  if (!groqKey) {
    console.error("[AI v3.1] GROQ_API_KEY not configured — falling back to Mistral only");
    if (mistralKey) {
      const mistralPreds = await callMistralAI(mistralKey, userPrompt);
      if (mistralPreds.length > 0) {
        return postProcessPredictions(mistralPreds.map(p => ({ ...p, consensus_passed: false })), matches, streak);
      }
    }
    return [];
  }

  // Launch Groq (primary) + Mistral (consensus) in parallel
  console.log(`[AI v3.1] Launching ${mistralKey ? "DUAL-MODEL (Groq + Mistral)" : "SINGLE-MODEL (Groq)"} consensus...`);

  const [groqPreds, mistralPreds] = await Promise.all([
    callGroqAI(groqKey, userPrompt),
    mistralKey ? callMistralAI(mistralKey, userPrompt) : Promise.resolve([] as AIPrediction[]),
  ]);

  console.log(`[AI v3.1] Groq: ${groqPreds.length} predictions, Mistral: ${mistralPreds.length} predictions`);

  let merged: AIPrediction[];
  if (mistralPreds.length > 0 && groqPreds.length > 0) {
    merged = mergeConsensus(groqPreds, mistralPreds, eligible, streak);
    console.log(`[AI v3.1] Consensus merged: ${merged.length} predictions (${merged.filter(p => p.consensus_passed).length} fully validated)`);
  } else if (groqPreds.length > 0) {
    merged = groqPreds.map(p => ({ ...p, consensus_passed: false }));
  } else if (mistralPreds.length > 0) {
    // Groq failed → Mistral as fallback 1
    console.log("[AI v3.1] Groq failed — using Mistral as fallback");
    merged = mistralPreds.map(p => ({ ...p, consensus_passed: false }));
  } else {
    // Both failed → deterministic fallback 2 will kick in
    return [];
  }

  return postProcessPredictions(merged, matches, streak);
}

// ═══════════════════════════════════════════════════════════════
// DAILY BRIEFING GENERATOR
// ═══════════════════════════════════════════════════════════════
async function generateDailyBriefing(
  supabase: any, streak: StreakState,
  totalAnalyzed: number, discarded: number, retained: number, avgConfidence: number
) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const focusMap: Record<string, string> = {
    normal: "Analyse complète — tous les marchés disponibles",
    caution: "Priorité aux matchs Tier 1-2 avec fort signal",
    streak: "Sélection ultra-stricte — Double Chance et Under 2.5 uniquement",
    emergency: "1 seul pick élite Tier 1 — protection maximale",
  };

  try {
    await supabase.from("daily_briefings").upsert({
      date: today,
      mode: streak.level,
      leagues_analyzed: totalAnalyzed,
      matches_discarded: discarded,
      picks_retained: retained,
      avg_confidence: avgConfidence,
      daily_focus: focusMap[streak.level] || focusMap.normal,
      generated_at: new Date().toISOString(),
    }, { onConflict: "date" });
  } catch (e) {
    console.log("[BRIEFING] Error generating daily briefing:", e);
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

    // v3.1: Check streak mode (3 levels) + blacklisted leagues
    const streak = forceAll
      ? { level: "normal" as StreakLevel, isStreakMode: false, rollingWinrate: 100, maxPicks: 999, minConfidence: 35, minAiScore: 40, lastResults: [], consecutiveLosses: 0 } as StreakState
      : await checkStreakMode(supabase);

    const blacklistedLeagues = await getBlacklistedLeagues(supabase);

    if (streak.isStreakMode) {
      console.log(`[AI-PREDICT v3.1] ${streak.level.toUpperCase()} MODE: winrate=${streak.rollingWinrate}%, losses=${streak.consecutiveLosses}, maxPicks=${streak.maxPicks}, minConf=${streak.minConfidence}%`);
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
        learningContext = `\n\n🧠 SELF-LEARNING DATA (v3.1):\n${lines.join("\n")}\nADJUSTMENTS: If calibration_error > 10 → reduce probability. If winrate < 50% for SAFE → be MORE selective.\n`;
      }
    } catch {
      console.log("[AI-PREDICT v3.1] Learning stats not available");
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
        streak_mode: streak.isStreakMode, streak_level: streak.level,
        rolling_winrate: streak.rollingWinrate, version: "3.1"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-filter: excluded leagues + blacklisted + tier 4
    const eligibleMatches = matches.filter(m => {
      const tier = getLeagueTier(m.league_name);
      if (tier === 4) return false;
      if (blacklistedLeagues.has(m.league_name)) return false;
      return true;
    });
    const excludedCount = matches.length - eligibleMatches.length;
    console.log(`[AI-PREDICT v3.1] ${matches.length} total → ${eligibleMatches.length} eligible (${excludedCount} excluded)`);

    let predictions: AIPrediction[] = [];
    let source = "pronosia-v3.1-deterministic";

    if (apiKey && eligibleMatches.length > 0) {
      predictions = await callAI(apiKey, eligibleMatches, learningContext, streak, blacklistedLeagues);
      if (predictions.length > 0) {
        source = "pronosia-v3.1-ai";
      }
    }

    // Enhanced fallback
    if (predictions.length === 0 && eligibleMatches.length > 0) {
      console.log(`[AI-PREDICT v3.1] Using enhanced deterministic engine for ${eligibleMatches.length} matches`);

      try {
        await supabase.from("admin_logs").insert({
          admin_email: "system",
          action: "fallback-activated-v3.1",
          details: { reason: "AI gateway unavailable", match_count: eligibleMatches.length, streak_level: streak.level },
        });
      } catch {}

      const raw: AIPrediction[] = [];
      for (const m of eligibleMatches) {
        const threshold = await getDynamicThreshold(supabase, m.league_name, m.sport);
        const tier = await getLeagueTierFromDB(supabase, m.league_name);
        let leagueWr: number | null = null;
        try {
          const { data: lp } = await supabase
            .from("league_performance")
            .select("winrate")
            .eq("league_name", m.league_name)
            .maybeSingle();
          if (lp) leagueWr = lp.winrate;
        } catch {}

        const pred = generatePRONOSIAPrediction(m, streak, threshold.minConfidence, leagueWr, tier);
        if (pred) raw.push(pred);
      }
      predictions = raw.slice(0, streak.maxPicks);
      source = "pronosia-v3.1-deterministic";
    }

    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    let updated = 0;
    let totalConfidence = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const pred = predMap.get(m.fixture_id);
      if (!pred) continue;

      if (!forceAll && m.pred_home_win != null && m.pred_away_win != null && m.pred_analysis) {
        continue;
      }

      const tier = getLeagueTier(m.league_name);
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
          suspect_score: pred.suspect_score || pred.anomaly_score || 0,
          data_completeness_score: pred.data_completeness_score || 100,
          validation_score: pred.validation_score || 10,
          streak_mode_level: streak.level,
          consensus_passed: pred.consensus_passed ?? true,
          league_tier: pred.league_tier || tier,
          context_penalties_total: pred.context_penalties_total || 0,
        })
        .eq("fixture_id", m.fixture_id);

      if (updateError) {
        console.error(`[AI-PREDICT v3.1] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        totalConfidence += Math.max(pred.pred_home_win, pred.pred_away_win);
        if (i === 0) console.log(`[AI-PREDICT v3.1] Sample: ${m.home_team} vs ${m.away_team}: ${pred.pred_confidence} | AI:${pred.ai_score} | Suspect:${pred.anomaly_score} | Tier:${tier} | ${source}`);
      }
    }

    // Generate daily briefing
    const avgConfidence = updated > 0 ? Math.round(totalConfidence / updated) : 0;
    await generateDailyBriefing(supabase, streak, matches.length, excludedCount, updated, avgConfidence);

    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%");

    console.log(`[AI-PREDICT v3.1] ✅ Updated ${updated} via ${source}. ${count || 0} remaining. Streak=${streak.level}`);

    return new Response(JSON.stringify({
      success: true,
      source,
      version: "3.1",
      batch_size: matches.length,
      eligible: eligibleMatches.length,
      excluded: excludedCount,
      blacklisted_leagues: [...blacklistedLeagues],
      predictions_generated: predictions.length,
      updated,
      remaining_without_ai: count || 0,
      streak_mode: streak.isStreakMode,
      streak_level: streak.level,
      rolling_winrate: streak.rollingWinrate,
      consecutive_losses: streak.consecutiveLosses,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-PREDICT v3.1] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
