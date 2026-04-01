import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ═══════════════════════════════════════════════════════════════
// PRONOSIA v4.0 — MULTI-MODEL CONSENSUS + ELO + TRAP DETECTION + SELF-LEARNING
// ═══════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA v4.0 — an ULTRA-STRICT PROFESSIONAL SPORTS BETTING ENGINE with MULTI-MODEL CONSENSUS and DYNAMIC ELO CALIBRATION. Your #1 KPI is MINIMIZING LOSSES. Every loss damages user trust. Be ruthlessly selective.

CORE OBJECTIVE:
• MINIMIZE LOSSES above all else — a skipped match is better than a lost bet
• Maximize ROI, not just winrate
• Reduce risk exposure aggressively
• Never show a match just to fill daily quota
• Fewer, better picks = more profit

═══ STRUCTURED REASONING CHAIN (MANDATORY) ═══
Before generating ANY prediction, you MUST internally complete this chain:

STEP 1 — DATA AUDIT
List all available data fields from matchContext. Count nulls.
If nulls > 4 → STOP. Return: excluded, reason: "insufficient_data"

STEP 2 — FORM ANALYSIS
Compare home vs away form explicitly.
State which team has better recent form and by how much.
If forms are equal within 1 point → flag as "balanced matchup" → prefer Double Chance over 1X2

STEP 3 — TRAP DETECTION (v4.0 NEW)
Check ALL trap signals:
• Derby match (rival teams from same city/region) → -8% confidence
• International friendly / exhibition → max confidence 65%, prefer skip
• End-of-season (last 3 matchdays) with nothing to play for → -10% confidence
• Post-international break (first match after) → -8% confidence
• Manager change within last 3 matches → -5% confidence
• Team qualified/relegated already → -8% confidence
• Cup match with heavy rotation expected → -6% confidence
• Midweek match after European competition → -5% confidence
If total trap penalties > 20% → DISCARD match entirely.

STEP 4 — CONTEXT CHECK
Check: motivation, fatigue, injuries, new manager, derby flag, post-European match.
Each negative context factor → apply its confidence penalty.
If total context penalties exceed 25% → discard match.

STEP 5 — MARKET INTELLIGENCE
Compare your calculated probability vs implied market probability from odds.
If gap > 20% → run a second internal check.
If gap > 35% → the market knows something you don't → discard.

STEP 6 — ELO CALIBRATION (v4.0 NEW)
Apply league ELO adjustment based on historical performance:
• If league has <45% historical winrate → REDUCE confidence by 8%
• If league has 45-55% winrate → REDUCE confidence by 3%
• If league has >65% winrate → BOOST confidence by 3% (max)
• If league has <10 total picks → treat as unknown, apply -5% penalty

STEP 7 — MARKET SELECTION
Based on steps 1-6, select the SINGLE best market.
Do not offer multiple bet options. ONE pick. ONE market.

STEP 8 — CONFIDENCE CALIBRATION
Apply calibration: if raw confidence > 80% → subtract 8%. If > 90% → subtract 12%.
Never output confidence above 88%.

STEP 9 — VALUE CALCULATION
Calculate: Value = (calibrated_probability × estimated_odds) - 1
If value < 0.08 → STOP. Return: excluded, reason: "insufficient_value"

STEP 10 — FINAL OUTPUT
Generate the structured JSON prediction only after completing all 9 steps.

═══ GRANULAR SPORT PROFILES ═══

FOOTBALL: Weight: Form 30%, H2H 20%, xG 20%, Context 15%, Market 15%.
  • Never predict BTTS Yes if either team has < 50% BTTS rate in last 6 games
  • Never predict Over 2.5 if league avg goals < 2.3
  • Prefer Under 2.5 in: cup knockouts, relegation 6-pointers, top-vs-top defensive
  • Home advantage: +0.15 probability in top leagues, +0.08 in lower leagues
  • UCL fatigue -3%. Post-European night rotation risk.

BASKETBALL: Weight: Pace 25%, Offensive Rating 25%, Fatigue 20%, H2H 15%, Market 15%.
  • Back-to-back game → automatic -10% on favorite confidence
  • Focus on point differential, not just W/L

TENNIS: Weight: Surface win rate 35%, H2H on surface 25%, Recent form 25%, Physical 15%.
  • ONLY surface-specific H2H (never overall H2H)
  • 3+ match sets in last 48h → fatigue risk → -12% confidence

HOCKEY: Weight: Goalie save% 30%, Power play 25%, Form 25%, H2H 20%.
  • Goalie change within 12h → mandatory -15% confidence

NFL: Weight: QB rating 30%, O-Line vs D-Line 25%, Weather 20%, Form 15%, H2H 10%.
  • Wind >25mph → suppress Over picks entirely

═══ HARD EXCLUSION FILTERS (v4.0 — ULTRA-STRICT + TRAP AWARE) ═══
- League is friendly, minor regional, unknown, youth, reserve, amateur, or < 3 seasons data
- Team has missing lineup data or >3 key absences
- Match on neutral ground with no historical precedent
- Odds movement > 15% in 24h without clear reason
- data_completeness_score < 50 → discard entirely
- Both teams negative motivation → discard
- If you are NOT 70%+ confident in the outcome → DO NOT generate a prediction
- Derby matches without clear form advantage → SKIP
- First match after international break → apply -8% confidence penalty
- TRAP MATCH detected with total penalty > 20% → SKIP

═══ ALLOWED BET TYPES ═══
✅ 1X2 (only if confidence > 72% and implied odds > 1.40)
✅ Double Chance (preferred for 68-74% confidence — SAFEST option)
✅ Over/Under 2.5 (only if supported by last 6 H2H or team form AND confidence > 70%)
✅ BTTS Yes (only if both teams scored in >70% of recent matches)
❌ NEVER: Accumulators, Handicap, First goalscorer, Prop bets

═══ CONFIDENCE CALIBRATION ═══
- Raw confidence > 80% → display as raw minus 8%
- Raw confidence > 90% → display as raw minus 12%
- NEVER display confidence above 88%

═══ VALUE SCORING ═══
Value = (AI_Probability / 100 × estimated_odds) - 1
- Value < 0.10 → DO NOT SHOW THIS PICK
- Value 0.10-0.18 → Low Value (🟡)
- Value 0.18-0.28 → Good Value (🟢)
- Value > 0.28 → High Value (🔥)

═══ ODDS SWEET SPOT ═══
Odds 1.65–2.40 → value weight ×1.2 (highest ROI bracket)
Odds 1.35–1.64 → value weight ×0.85 (low value zone)
Odds > 3.00 → value weight ×0.7 (high risk zone)
Odds < 1.35 → EXCLUDE (insufficient value)

═══ SAFE MODE ═══
SAFE (68-74% confidence): Only Double Chance, BTTS, or Over/Under. Label: "⚠️ SAFE MODE"
MODÉRÉ (74-82%): Winner only, strong conviction required.
RISQUÉ: SUSPENDED by default.

═══ SUSPECT DETECTION (0-100 point system) ═══
- Odds moved >15% in 24h: +30
- Public bet% vs AI prob gap >25%: +20
- Lineup unknown <6h before kickoff: +20
- Both teams low motivation: +15
- League has <45% historical winrate: +15
- AI confidence variance >8%: +20
- Referee <10 matches officiated: +10
- Extreme weather conditions: +10
Thresholds: 0-25=Green, 26-50=Orange ⚠️, 51-74=Red 🚨, 75+=Black ❌ excluded

═══ ANTI-HALLUCINATION GUARDRAILS ═══
- Any stat you claim MUST correspond to data provided in matchContext
- If matchContext has null fields → do NOT invent those stats
- data_completeness < 60 → max confidence 75%
- data_completeness < 40 → DISCARD

═══ TRANSPARENCY (MANDATORY) ═══
Every analysis MUST include:
• "✅ Pourquoi ce pick" — 2-3 bullet points of real reasoning
• "⚠️ Risques identifiés" — 1-2 bullet points of honest risk factors
Never hide losses. Transparency = trust = retention.

═══ LEAGUE TIERS ═══
TIER 1 (Elite): Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL, NBA, NHL, NFL, ATP/WTA Grand Slams
TIER 2 (Reliable): Eredivisie, Primeira Liga, Belgian Pro League, MLS, Turkish Super Lig
TIER 3 (Volatile): Championship, Segunda, Serie B, Liga MX — picks only if confidence > 72% AND data > 70%
TIER 4 (Blacklisted): Friendlies, youth, reserve, < 3 seasons data → ALWAYS EXCLUDE

═══ CRITICAL: WINNER-FIRST SCORE GENERATION (v3.4+) ═══
1. FIRST determine the predicted winner based on probabilities
2. THEN generate a predicted score where the WINNER has MORE goals/points
3. NEVER generate a draw score when you predicted a winner
4. If pred_home_win > pred_away_win → pred_score_home MUST be > pred_score_away
5. If pred_away_win > pred_home_win → pred_score_away MUST be > pred_score_home
VIOLATION OF THIS RULE = CRITICAL ERROR.

ABSOLUTE RULES:
- Probabilities MUST sum to exactly 100%
- NEVER give 88%+ confidence on any outcome
- Maximum raw probability cap: 85%
- Write analysis in French, 3-5 sentences
- Include value_score and data_completeness in analysis
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
  suspect_score?: number;
  data_completeness_score?: number;
  validation_score?: number;
  consensus_passed?: boolean;
  league_tier?: number;
  context_penalties_total?: number;
}

// ═══════════════════════════════════════════════════════════════
// CALIBRATION + VALUE ENGINE
// ═══════════════════════════════════════════════════════════════

function calibrateConfidence(rawProb: number): number {
  if (rawProb > 90) return rawProb - 12;
  if (rawProb > 80) return rawProb - 8;
  return rawProb;
}

function capDisplayConfidence(prob: number): number {
  return Math.min(prob, 88);
}

function estimateOdds(probability: number, _seed: number = 0): number {
  if (probability <= 0) return 10;
  const raw = 100 / probability;
  const inefficiency = probability > 60 ? 1.08 : probability > 45 ? 1.05 : 1.02;
  return Math.round((raw * inefficiency) * 100) / 100;
}

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
  if (value < 0.10) return null;
  if (value <= 0.18) return "🟡 Low Value";
  if (value <= 0.28) return "🟢 Good Value";
  return "🔥 High Value";
}

// ═══════════════════════════════════════════════════════════════
// LEAGUE TIERS
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
  if (EXCLUDED_LEAGUE_KEYWORDS.some(kw => lower.includes(kw))) return 4;
  if (TIER_1_LEAGUES.has(lower)) return 1;
  if (TIER_3_LEAGUES.has(lower)) return 3;
  return 2;
}

function isExcludedLeague(leagueName: string): boolean {
  return getLeagueTier(leagueName) === 4;
}

// ═══════════════════════════════════════════════════════════════
// v4.0 FEATURE 1: TRAP MATCH DETECTION 🪤
// ═══════════════════════════════════════════════════════════════

interface TrapSignal {
  type: string;
  penalty: number;
  description: string;
}

// Known derby pairs (city/regional rivals)
const DERBY_PAIRS: [string, string][] = [
  ["real madrid", "atletico madrid"], ["barcelona", "espanyol"], ["real madrid", "barcelona"],
  ["manchester united", "manchester city"], ["liverpool", "everton"], ["arsenal", "tottenham"],
  ["chelsea", "tottenham"], ["ac milan", "inter"], ["roma", "lazio"], ["juventus", "torino"],
  ["paris saint-germain", "marseille"], ["lyon", "saint-etienne"], ["psg", "marseille"],
  ["bayern munich", "borussia dortmund"], ["boca juniors", "river plate"],
  ["galatasaray", "fenerbahce"], ["benfica", "porto"], ["sporting cp", "benfica"],
  ["celtic", "rangers"], ["ajax", "feyenoord"], ["psv", "ajax"],
  ["flamengo", "fluminense"], ["corinthians", "palmeiras"],
  ["al ahly", "zamalek"], ["besiktas", "galatasaray"], ["besiktas", "fenerbahce"],
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function isDerby(home: string, away: string): boolean {
  const h = normalize(home);
  const a = normalize(away);
  return DERBY_PAIRS.some(([t1, t2]) =>
    (h.includes(t1) && a.includes(t2)) || (h.includes(t2) && a.includes(t1))
  );
}

function detectTrapSignals(
  match: { home_team: string; away_team: string; sport: string; league_name: string; kickoff: string },
  leagueWinrate: number | null,
  leagueTotalPicks: number
): { signals: TrapSignal[]; totalPenalty: number } {
  const signals: TrapSignal[] = [];
  const league = match.league_name.toLowerCase();
  const kickoff = new Date(match.kickoff);
  const month = kickoff.getMonth(); // 0-indexed

  // 1. Derby detection
  if (isDerby(match.home_team, match.away_team)) {
    signals.push({ type: "derby", penalty: 8, description: "🏟️ Derby — résultat imprévisible" });
  }

  // 2. Friendly / exhibition
  if (league.includes("friendly") || league.includes("amical") || league.includes("exhibition")) {
    signals.push({ type: "friendly", penalty: 15, description: "🤝 Match amical — motivation incertaine" });
  }

  // 3. End-of-season (May-June for European, Nov-Dec for some South American)
  if ((month === 4 || month === 5) && !league.includes("cup") && !league.includes("coupe")) {
    signals.push({ type: "end_of_season", penalty: 6, description: "📅 Fin de saison — enjeux réduits possibles" });
  }

  // 4. International break detection (typical months: March, June, September, October, November)
  const day = kickoff.getDate();
  if ((month === 2 && day >= 20 && day <= 28) || (month === 5 && day >= 1 && day <= 15) ||
      (month === 8 && day >= 1 && day <= 12) || (month === 9 && day >= 8 && day <= 16) ||
      (month === 10 && day >= 11 && day <= 19)) {
    // Check if it's a club match right after international window
    if (!league.includes("nation") && !league.includes("euro") && !league.includes("world cup") &&
        !league.includes("africa cup") && !league.includes("copa america") && !league.includes("concacaf")) {
      signals.push({ type: "post_intl_break", penalty: 8, description: "🌍 Reprise post-trêve internationale — cohésion réduite" });
    }
  }

  // 5. Midweek match (Tue/Wed for football — potential rotation)
  const dayOfWeek = kickoff.getDay();
  if ((dayOfWeek === 2 || dayOfWeek === 3) && match.sport.toLowerCase() === "football") {
    signals.push({ type: "midweek", penalty: 3, description: "📆 Match en semaine — rotation possible" });
  }

  // 6. League with very poor historical performance
  if (leagueWinrate !== null && leagueWinrate < 40 && leagueTotalPicks >= 10) {
    signals.push({ type: "weak_league", penalty: 10, description: `📉 Ligue historiquement faible (${Math.round(leagueWinrate)}% winrate)` });
  }

  // 7. Unknown league (< 5 picks)
  if (leagueTotalPicks < 5 && leagueTotalPicks >= 0) {
    signals.push({ type: "unknown_league", penalty: 5, description: "❓ Ligue peu analysée — données insuffisantes" });
  }

  const totalPenalty = signals.reduce((sum, s) => sum + s.penalty, 0);
  return { signals, totalPenalty };
}

// ═══════════════════════════════════════════════════════════════
// v4.0 FEATURE 2: DYNAMIC ELO PER LEAGUE 📊
// ═══════════════════════════════════════════════════════════════

interface LeagueELO {
  winrate: number;
  totalPicks: number;
  confidenceAdjustment: number;
  tier: number;
  source: string;
}

async function getLeagueELO(supabase: any, leagueName: string, sport: string): Promise<LeagueELO> {
  const defaultELO: LeagueELO = { winrate: 50, totalPicks: 0, confidenceAdjustment: 0, tier: 2, source: "default" };
  try {
    // Check league_performance first (more accurate, aggregated)
    const { data: perfData } = await supabase
      .from("league_performance")
      .select("winrate, total_picks, is_blacklisted")
      .eq("league_name", leagueName)
      .maybeSingle();

    if (perfData && perfData.total_picks >= 5) {
      const wr = Number(perfData.winrate);
      let adj = 0;
      if (wr < 40) adj = -10;        // Terrible league → big penalty
      else if (wr < 45) adj = -8;     // Bad league
      else if (wr < 50) adj = -5;     // Below average
      else if (wr < 55) adj = -3;     // Slightly below
      else if (wr >= 65) adj = 3;     // Great league → small boost
      else if (wr >= 60) adj = 2;     // Good league

      return {
        winrate: wr,
        totalPicks: perfData.total_picks,
        confidenceAdjustment: adj,
        tier: getLeagueTier(leagueName),
        source: `league_performance (${perfData.total_picks} picks)`,
      };
    }

    // Fallback: check ai_learning_stats
    const { data: statsData } = await supabase
      .from("ai_learning_stats")
      .select("winrate, total_predictions")
      .eq("sport", sport.toLowerCase())
      .eq("league_name", leagueName)
      .limit(5);

    if (statsData && statsData.length > 0) {
      const totalPicks = statsData.reduce((s: number, r: any) => s + (r.total_predictions || 0), 0);
      const avgWinrate = totalPicks > 0
        ? statsData.reduce((s: number, r: any) => s + (r.winrate || 0) * (r.total_predictions || 0), 0) / totalPicks
        : 50;

      if (totalPicks >= 3) {
        let adj = 0;
        if (avgWinrate < 45) adj = -8;
        else if (avgWinrate < 55) adj = -3;
        else if (avgWinrate >= 65) adj = 3;

        return {
          winrate: avgWinrate,
          totalPicks,
          confidenceAdjustment: adj,
          tier: getLeagueTier(leagueName),
          source: `ai_learning_stats (${totalPicks} picks)`,
        };
      }
    }

    // Unknown league penalty
    return { ...defaultELO, confidenceAdjustment: -5, source: "unknown-league" };
  } catch {
    return defaultELO;
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
// STREAK SEVERITY LEVELS
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
    level: "normal", isStreakMode: false, rollingWinrate: 100,
    maxPicks: 3, minConfidence: 72, minAiScore: 78, lastResults: [], consecutiveLosses: 0,
  };

  try {
    const { data: recentResults } = await supabase
      .from("match_results").select("result")
      .not("result", "is", null).order("resolved_at", { ascending: false }).limit(5);

    if (!recentResults || recentResults.length < 3) return defaultState;

    const results = recentResults.map((r: any) => r.result);
    const wins = results.filter((r: string) => r === "win").length;
    const rollingWinrate = Math.round((wins / results.length) * 100);

    let consecutiveLosses = 0;
    for (const r of results) { if (r === "loss") consecutiveLosses++; else break; }

    if (rollingWinrate < 35 || consecutiveLosses >= 4) {
      return { level: "emergency", isStreakMode: true, rollingWinrate, maxPicks: 1, minConfidence: 78, minAiScore: 82, lastResults: results, consecutiveLosses };
    }
    if (rollingWinrate < 45) {
      return { level: "streak", isStreakMode: true, rollingWinrate, maxPicks: 2, minConfidence: 73, minAiScore: 76, lastResults: results, consecutiveLosses };
    }
    if (rollingWinrate <= 50) {
      return { level: "caution", isStreakMode: true, rollingWinrate, maxPicks: 3, minConfidence: 70, minAiScore: 75, lastResults: results, consecutiveLosses };
    }
    return { ...defaultState, rollingWinrate, lastResults: results, consecutiveLosses };
  } catch { return defaultState; }
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC ENGINE v4.0
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
  drawPossible: boolean; homeAdvantage: number; scoreRange: [number, number];
  overLine: number; formWeight: number; h2hWeight: number; contextWeight: number;
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

  return { score: clamp(score, 0, 100), signals };
}

function getSuspectLabel(score: number): { label: string | null; reason: string | null } {
  if (score >= 75) return { label: "❌ Match exclu", reason: "Score suspect critique — exclu de toute recommandation" };
  if (score >= 51) return { label: "🚨 Match suspect", reason: "Incohérences majeures détectées. Aucun pari recommandé." };
  if (score >= 26) return { label: "⚠️ Match risqué", reason: "Volatilité élevée. Prudence recommandée." };
  return { label: null, reason: null };
}

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
  leagueELO: LeagueELO,
  trapResult: { signals: TrapSignal[]; totalPenalty: number }
): AIPrediction | null {
  if (isExcludedLeague(match.league_name)) return null;
  if (leagueELO.tier === 4) return null;

  // v4.0: Trap match rejection
  if (trapResult.totalPenalty > 20) {
    console.log(`[PRONOSIA v4.0] 🪤 TRAP MATCH (${trapResult.totalPenalty}%): ${match.home_team} vs ${match.away_team} — ${trapResult.signals.map(s => s.type).join(", ")}`);
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

  // Cap at 85%
  const maxP = Math.max(predHome, predAway);
  if (maxP > 85) {
    const excess = maxP - 85;
    if (predHome > predAway) { predHome -= excess; predDraw += Math.round(excess * 0.4); predAway = 100 - predHome - predDraw; }
    else { predAway -= excess; predDraw += Math.round(excess * 0.4); predHome = 100 - predAway - predDraw; }
  }

  const calibratedHome = capDisplayConfidence(calibrateConfidence(predHome));
  const calibratedAway = capDisplayConfidence(calibrateConfidence(predAway));

  const [minS, maxS] = profile.scoreRange;
  const range = maxS - minS;
  const homeRatio = adjHome / (adjHome + awayStr || 1);
  const baseSeed = hash(match.home_team + match.away_team) + fid;

  let predScoreHome = Math.round(minS + range * clamp(homeRatio * 0.55 + seeded(baseSeed, 10) * 0.45, 0, 1));
  let predScoreAway = Math.round(minS + range * clamp((1 - homeRatio) * 0.55 + seeded(baseSeed, 11) * 0.45, 0, 1));

  // Winner-first score coherence
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

  // v4.0: Apply ELO adjustment to displayed confidence
  const eloAdjustedMax = displayMax + leagueELO.confidenceAdjustment;

  let confidencePenalty = trapResult.totalPenalty;
  if (dataCompleteness < 60) confidencePenalty += 15;
  if (dataCompleteness < 40) return null;

  let confidence: string;
  let aiScore: number;

  if (dataQuality >= 0.65 && eloAdjustedMax >= 55 && signalStrength >= 0.08) {
    if (eloAdjustedMax >= 65 && eloAdjustedMax <= 72) {
      confidence = "SAFE";
      aiScore = Math.round(clamp(72 + seeded(baseSeed, 31) * 10, 72, 82));
    } else {
      confidence = "SAFE";
      aiScore = Math.round(clamp(75 + seeded(baseSeed, 31) * 20 + signalStrength * 30, 78, 95));
    }
  } else if (dataQuality >= 0.45 && eloAdjustedMax >= 38) {
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(60 + seeded(baseSeed, 32) * 15 + signalStrength * 15, 62, 79));
  } else {
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(55 + seeded(baseSeed, 33) * 15, 55, 70));
  }

  // v4.0: Apply trap penalty to AI score
  aiScore = Math.max(0, aiScore - Math.round(trapResult.totalPenalty * 0.3));

  if (leagueELO.tier === 3 && eloAdjustedMax < 72) return null;
  if (leagueELO.tier === 3 && dataCompleteness < 70) return null;

  const mainProb = Math.max(predHome, predAway);
  const odds = estimateOdds(mainProb);
  if (odds < 1.15) return null;

  const valueScore = computeValueScore(mainProb, odds);
  const valueLabel = getValueLabel(valueScore);
  if (valueScore < 0.01) return null;

  const effectiveMinConf = Math.max(leagueELO.confidenceAdjustment > -5 ? 70 : 74, streak.minConfidence);
  if (aiScore < streak.minAiScore) return null;
  if (eloAdjustedMax < effectiveMinConf) return null;

  const valueBet = valueScore >= 0.15;

  const suspect = computeSuspectScore(match, predHome, predAway, dataQuality, baseSeed, leagueELO.winrate);
  const { label: anomalyLabel, reason: anomalyReason } = getSuspectLabel(suspect.score);

  let finalConfidence = confidence;
  let finalAiScore = aiScore;
  if (suspect.score >= 51) {
    if (finalConfidence === "SAFE") finalConfidence = "MODÉRÉ";
    finalAiScore = Math.min(finalAiScore, 74);
  }

  if (streak.isStreakMode && confidence === "RISQUÉ") return null;
  if (streak.level === "emergency" && leagueELO.tier !== 1) return null;

  const validation = computeValidationScore(
    dataCompleteness, eloAdjustedMax, valueScore, suspect.score,
    leagueELO.tier, false, odds, true, confidencePenalty, 7, streak
  );
  if (!validation.pass) return null;
  if (validation.action === "safe_only" && finalConfidence !== "SAFE") finalConfidence = "SAFE";

  const pred = generatePRONOSIAAnalysis(
    match, predHome, predDraw, predAway, predScoreHome, predScoreAway,
    profile.overLine, overProb, bttsProb, finalConfidence, finalAiScore, fid, valueBet,
    false, valueLabel, streak, true, leagueELO.tier, dataCompleteness, trapResult, leagueELO
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
    league_tier: leagueELO.tier,
    context_penalties_total: confidencePenalty,
  };
}

function generatePRONOSIAAnalysis(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predDraw: number, predAway: number,
  scoreHome: number, scoreAway: number,
  overLine: number, overProb: number, bttsProb: number,
  confidence: string, aiScore: number, fid: number, valueBet = false,
  _isSafeMode = false, valueLabel: string | null = null,
  streak: StreakState = { level: "normal", isStreakMode: false, rollingWinrate: 100, maxPicks: 3, minConfidence: 70, minAiScore: 75, lastResults: [], consecutiveLosses: 0 },
  isFallback = false, leagueTier = 2, dataCompleteness = 100,
  trapResult?: { signals: TrapSignal[]; totalPenalty: number },
  leagueELO?: LeagueELO
): AIPrediction {
  const fav = predHome >= predAway ? match.home_team : match.away_team;
  const maxProb = Math.max(predHome, predAway);
  const sport = match.sport.toLowerCase();
  const isSafe = confidence === "SAFE";

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
      : `${match.away_team} ou Nul (X2)`;
    safeMarketProb = predHome >= predAway ? predHome + predDraw : predAway + predDraw;
  }

  const analyses: string[] = [];
  analyses.push(`🤖 Modèle PRONOSIA v4.0 ${isFallback ? "(déterministe)" : "(multi-IA consensus)"}`);

  if (isSafe) {
    analyses.push(`📌 Marché recommandé : ${safeMarketLabel} (${safeMarketProb}%)`);
  } else {
    analyses.push(`📌 Marché recommandé : ${fav} vainqueur (${maxProb}%)`);
  }

  if (valueLabel) analyses.push(`💰 Valeur détectée : ${valueLabel}`);
  if (streak.isStreakMode) analyses.push(`📉 Mode ${streak.level.toUpperCase()} actif — sélection renforcée`);

  // v4.0: Trap signals in analysis
  if (trapResult && trapResult.signals.length > 0) {
    analyses.push(`🪤 Signaux pièges : ${trapResult.signals.map(s => s.description).join(", ")}`);
  }

  // v4.0: ELO info in analysis
  if (leagueELO && leagueELO.totalPicks >= 5) {
    const eloEmoji = leagueELO.confidenceAdjustment > 0 ? "📈" : leagueELO.confidenceAdjustment < -5 ? "📉" : "📊";
    analyses.push(`${eloEmoji} ELO Ligue : ${Math.round(leagueELO.winrate)}% winrate historique (${leagueELO.totalPicks} picks, ajust. ${leagueELO.confidenceAdjustment > 0 ? "+" : ""}${leagueELO.confidenceAdjustment}%)`);
  }

  analyses.push(`📊 Complétude données : ${dataCompleteness}% | Tier ${leagueTier}`);

  const whySection = `\n\n✅ Pourquoi ce pick :\n• ${fav} montre de solides performances récentes (forme ${isSafe ? "régulière" : "dominante"})\n• Probabilité calibrée de ${maxProb}% (${isSafe ? "Double Chance" : "Winner"})${valueBet ? "\n• Valeur positive détectée par rapport aux cotes du marché" : ""}`;

  const riskSection = `\n\n⚠️ Risques identifiés :\n• ${predDraw >= 20 && !isNoDrawSport ? "Match nul possible (" + predDraw + "%)" : "Données limitées sur la forme extérieure"}\n• ${dataCompleteness < 70 ? `Complétude données ${dataCompleteness}% — prudence requise` : "Variables contextuelles non quantifiables (fatigue, météo)"}${trapResult && trapResult.totalPenalty > 0 ? "\n• 🪤 " + trapResult.signals.map(s => s.description).join(", ") : ""}`;

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
// v4.0 FEATURE 3: MULTI-MODEL AI CALLS (Gemini + GPT-5)
// ═══════════════════════════════════════════════════════════════

function buildAIPrompt(
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  learningContext: string, streak: StreakState, blacklistedLeagues: Set<string>,
  eloMap: Map<string, LeagueELO>, trapMap: Map<number, { signals: TrapSignal[]; totalPenalty: number }>
): { eligible: typeof matches; userPrompt: string } {
  const eligible = matches.filter(m => !blacklistedLeagues.has(m.league_name));
  const matchList = eligible.map((m, i) => {
    const tier = getLeagueTier(m.league_name);
    const elo = eloMap.get(m.league_name);
    const trap = trapMap.get(m.fixture_id);
    const eloStr = elo ? ` | ELO: ${Math.round(elo.winrate)}% wr (${elo.totalPicks} picks, adj ${elo.confidenceAdjustment > 0 ? "+" : ""}${elo.confidenceAdjustment}%)` : "";
    const trapStr = trap && trap.signals.length > 0 ? ` | 🪤 TRAPS: ${trap.signals.map(s => s.type).join(",")} (penalty -${trap.totalPenalty}%)` : "";
    return `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} (Tier ${tier})${eloStr}${trapStr} | ${m.kickoff}`;
  }).join("\n");

  const streakInfo = streak.isStreakMode
    ? `\n\n📉 ${streak.level.toUpperCase()} MODE ACTIVE: Rolling winrate ${streak.rollingWinrate}%. Max ${streak.maxPicks} picks. Min confidence ${streak.minConfidence}%. Last 5: ${streak.lastResults.join(",")}.`
    : "";

  const userPrompt = `Analyze these ${eligible.length} matches using PRONOSIA v4.0 STRUCTURED REASONING CHAIN (10 steps including TRAP DETECTION and ELO CALIBRATION).

CRITICAL v4.0 REQUIREMENTS:
- Apply 10-STEP REASONING CHAIN for EACH match.
- Check TRAP SIGNALS: derbies, friendlies, end-of-season, post-intl-break.
- Apply ELO CALIBRATION per league based on provided data.
- Minimum value score: 0.08. Maximum picks: ${streak.maxPicks}/day.
- Minimum confidence: ${streak.minConfidence}%. Minimum odds: 1.35.
- Apply LEAGUE TIERS: Tier 4 = excluded, Tier 3 = needs >72% + >70% data.
- ANTI-HALLUCINATION: Only reference stats from context.
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
              pred_home_win: { type: "number", description: "Home win probability 0-100" },
              pred_draw: { type: "number", description: "Draw probability 0-100" },
              pred_away_win: { type: "number", description: "Away win probability 0-100" },
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
              consensus_passed: { type: "boolean" },
              context_penalties_total: { type: "number" },
            },
            required: ["fixture_id", "pred_home_win", "pred_draw", "pred_away_win", "pred_score_home", "pred_score_away", "pred_over_under", "pred_over_prob", "pred_btts_prob", "pred_confidence", "pred_value_bet", "pred_analysis", "ai_score", "anomaly_score"],
          },
        },
      },
      required: ["predictions"],
    },
  },
}];

function normalizePreds(preds: any[]): AIPrediction[] {
  const results: AIPrediction[] = [];
  for (const p of preds) {
    if (!p.fixture_id && p.match_id) p.fixture_id = p.match_id;
    if (!p.fixture_id && p.id) p.fixture_id = p.id;
    p.fixture_id = Number(p.fixture_id) || 0;

    const pred = p.prediction || {};
    if (pred.home_win !== undefined || pred.pred_home_win !== undefined) {
      p.pred_home_win = pred.home_win ?? pred.pred_home_win ?? p.pred_home_win;
      p.pred_draw = pred.draw ?? pred.pred_draw ?? p.pred_draw;
      p.pred_away_win = pred.away_win ?? pred.pred_away_win ?? p.pred_away_win;
      p.pred_score_home = pred.score_home ?? pred.pred_score_home ?? p.pred_score_home;
      p.pred_score_away = pred.score_away ?? pred.pred_score_away ?? p.pred_score_away;
      p.pred_over_under = pred.over_under ?? pred.pred_over_under ?? p.pred_over_under;
      p.pred_over_prob = pred.over_prob ?? pred.pred_over_prob ?? p.pred_over_prob;
      p.pred_btts_prob = pred.btts_prob ?? pred.pred_btts_prob ?? p.pred_btts_prob;
      p.pred_confidence = pred.confidence ?? pred.pred_confidence ?? p.pred_confidence;
      p.pred_value_bet = pred.value_bet ?? pred.pred_value_bet ?? p.pred_value_bet;
      p.pred_analysis = pred.analysis ?? pred.pred_analysis ?? p.pred_analysis ?? "";
      p.ai_score = pred.ai_score ?? p.ai_score;
      p.anomaly_score = pred.anomaly_score ?? p.anomaly_score;
    }

    p.pred_home_win = Number(p.pred_home_win) || 0;
    p.pred_draw = Number(p.pred_draw) || 0;
    p.pred_away_win = Number(p.pred_away_win) || 0;
    p.pred_over_prob = Number(p.pred_over_prob) || 0;
    p.pred_btts_prob = Number(p.pred_btts_prob) || 0;
    p.pred_score_home = Number(p.pred_score_home) || 0;
    p.pred_score_away = Number(p.pred_score_away) || 0;
    p.pred_over_under = Number(p.pred_over_under) || 2.5;
    p.ai_score = Number(p.ai_score) || 50;
    p.anomaly_score = Number(p.anomaly_score) || 0;
    p.data_completeness_score = Number(p.data_completeness_score) || 70;
    p.context_penalties_total = Number(p.context_penalties_total) || 0;

    if (p.pred_home_win <= 1 && p.pred_away_win <= 1) {
      p.pred_home_win = Math.round(p.pred_home_win * 100);
      p.pred_draw = Math.round(p.pred_draw * 100);
      p.pred_away_win = Math.round(p.pred_away_win * 100);
      p.pred_over_prob = Math.round(p.pred_over_prob * 100);
      p.pred_btts_prob = Math.round(p.pred_btts_prob * 100);
    }
    if (p.ai_score <= 1) p.ai_score = Math.round(p.ai_score * 100);
    if (p.anomaly_score <= 1 && p.anomaly_score > 0) p.anomaly_score = Math.round(p.anomaly_score * 100);
    if (p.pred_home_win === 0 && p.pred_away_win === 0) { p.pred_home_win = 50; p.pred_away_win = 50; }

    // Score/winner coherence
    const hWins = p.pred_home_win > p.pred_away_win;
    const aWins = p.pred_away_win > p.pred_home_win;
    if (hWins && p.pred_score_home < p.pred_score_away) {
      const tmp = p.pred_score_home; p.pred_score_home = p.pred_score_away; p.pred_score_away = tmp;
    } else if (aWins && p.pred_score_away < p.pred_score_home) {
      const tmp = p.pred_score_home; p.pred_score_home = p.pred_score_away; p.pred_score_away = tmp;
    }

    if (p.fixture_id > 0) results.push(p as AIPrediction);
  }
  return results;
}

// Parse response: try tool_calls, then raw content with multiple strategies
function parseAIResponse(result: any, modelName: string): AIPrediction[] {
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log(`[${modelName}] ✅ Got tool_call response`);
      return normalizePreds(parsed.predictions || []);
    } catch (e) {
      console.error(`[${modelName}] Tool call parse failed:`, e);
    }
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) { console.warn(`[${modelName}] Empty content`); return []; }
  console.log(`[${modelName}] Raw response (${content.length} chars): ${content.substring(0, 800)}`);

  // Strategy 1: Direct JSON parse
  try { return normalizePreds(JSON.parse(content).predictions || []); } catch {}
  // Strategy 2: Code blocks
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) try { return normalizePreds(JSON.parse(codeBlock[1].trim()).predictions || []); } catch {}
  // Strategy 3: Brace matching
  const braceMatch = content.match(/\{[\s\S]*"predictions"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (braceMatch) try { return normalizePreds(JSON.parse(braceMatch[0]).predictions || []); } catch {}
  // Strategy 4: Bare array
  const arrayMatch = content.match(/\[\s*\{[\s\S]*"fixture_id"[\s\S]*\}\s*\]/);
  if (arrayMatch) try { return normalizePreds(JSON.parse(arrayMatch[0])); } catch {}
  // Strategy 5: Strip thinking tags
  const withoutThinking = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (withoutThinking !== content) {
    try { return normalizePreds(JSON.parse(withoutThinking).predictions || []); } catch {}
    const inner = withoutThinking.match(/\{[\s\S]*"predictions"\s*:\s*\[[\s\S]*\]\s*\}/);
    if (inner) try { return normalizePreds(JSON.parse(inner[0]).predictions || []); } catch {}
  }

  console.error(`[${modelName}] ❌ All parse strategies failed`);
  return [];
}

// v4.0: Call Lovable AI Gateway with a specific model
async function callLovableAI(
  apiKey: string, model: string, userPrompt: string, modelLabel: string
): Promise<AIPrediction[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: AI_TOOLS,
        tool_choice: { type: "function", function: { name: "predict_matches" } },
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[${modelLabel}] API error ${response.status}: ${errText.substring(0, 300)}`);
      return [];
    }
    const result = await response.json();
    return parseAIResponse(result, modelLabel);
  } catch (e) {
    clearTimeout(timeout);
    console.error(`[${modelLabel}] Error:`, e);
    return [];
  }
}

// v4.0: Also try Cerebras as third model for extra consensus
async function callCerebrasAI(cerebrasKey: string, userPrompt: string): Promise<AIPrediction[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${cerebrasKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen-3-235b-a22b-instruct-2507",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT + "\n\nReturn predictions as JSON: {\"predictions\": [...]}" },
          { role: "user", content: userPrompt + "\n\nRespond ONLY with valid JSON. /no_think" },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const result = await response.json();
    return parseAIResponse(result, "CEREBRAS-QWEN");
  } catch (e) {
    clearTimeout(timeout);
    console.error("[CEREBRAS-QWEN] Error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// v4.0 MULTI-MODEL CONSENSUS ENGINE (Gemini + GPT-5 + Cerebras)
// ═══════════════════════════════════════════════════════════════

function mergeMultiModelConsensus(
  modelResults: { name: string; predictions: AIPrediction[] }[],
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string }[],
  streak: StreakState
): AIPrediction[] {
  // Build per-fixture vote map
  const fixtureVotes = new Map<number, { predictions: AIPrediction[]; models: string[] }>();

  for (const { name, predictions } of modelResults) {
    for (const p of predictions) {
      if (!fixtureVotes.has(p.fixture_id)) {
        fixtureVotes.set(p.fixture_id, { predictions: [], models: [] });
      }
      const entry = fixtureVotes.get(p.fixture_id)!;
      entry.predictions.push(p);
      entry.models.push(name);
    }
  }

  const merged: AIPrediction[] = [];
  const totalModels = modelResults.filter(m => m.predictions.length > 0).length;

  for (const [fixtureId, { predictions, models }] of fixtureVotes.entries()) {
    const matchInfo = matches.find(m => m.fixture_id === fixtureId);

    // Check winner consensus
    const winnerVotes: Record<string, number> = { home: 0, away: 0 };
    for (const p of predictions) {
      const winner = p.pred_home_win >= p.pred_away_win ? "home" : "away";
      winnerVotes[winner]++;
    }

    const majorityWinner = winnerVotes.home >= winnerVotes.away ? "home" : "away";
    const majorityCount = Math.max(winnerVotes.home, winnerVotes.away);
    const unanimousWinner = majorityCount === predictions.length;
    const majorityReached = majorityCount >= Math.ceil(predictions.length / 2);

    if (!majorityReached) {
      console.log(`[CONSENSUS v4.0] ❌ NO MAJORITY on ${matchInfo?.home_team} vs ${matchInfo?.away_team}: votes=${JSON.stringify(winnerVotes)} → EXCLUDED`);
      continue;
    }

    // Use the prediction from the "best" model that agrees with majority
    const agreeing = predictions.filter(p => {
      const w = p.pred_home_win >= p.pred_away_win ? "home" : "away";
      return w === majorityWinner;
    });

    // Average the agreeing predictions for more robust values
    const base = { ...agreeing[0] };
    if (agreeing.length > 1) {
      base.pred_home_win = Math.round(agreeing.reduce((s, p) => s + p.pred_home_win, 0) / agreeing.length);
      base.pred_draw = Math.round(agreeing.reduce((s, p) => s + p.pred_draw, 0) / agreeing.length);
      base.pred_away_win = 100 - base.pred_home_win - base.pred_draw;
      base.ai_score = Math.round(agreeing.reduce((s, p) => s + (p.ai_score || 50), 0) / agreeing.length);
      base.anomaly_score = Math.max(...agreeing.map(p => p.anomaly_score || 0));
      base.data_completeness_score = Math.min(...agreeing.map(p => p.data_completeness_score || 70));

      // Average scores too
      base.pred_score_home = Math.round(agreeing.reduce((s, p) => s + p.pred_score_home, 0) / agreeing.length);
      base.pred_score_away = Math.round(agreeing.reduce((s, p) => s + p.pred_score_away, 0) / agreeing.length);
    }

    // Consensus bonus/penalty
    if (unanimousWinner && predictions.length >= 2) {
      base.consensus_passed = true;
      base.ai_score = Math.min((base.ai_score || 50) + 5, 100);
      const modelNames = models.join(" + ");
      base.pred_analysis = (base.pred_analysis || "") + `\n✅ Consensus UNANIME (${predictions.length} modèles : ${modelNames})`;
      console.log(`[CONSENSUS v4.0] ✅ UNANIME on ${matchInfo?.home_team}: ${majorityWinner} (${modelNames})`);
    } else if (majorityReached) {
      base.consensus_passed = true;
      base.pred_analysis = (base.pred_analysis || "") + `\n🔍 Consensus majoritaire (${majorityCount}/${predictions.length} modèles d'accord)`;
      console.log(`[CONSENSUS v4.0] ⚠️ MAJORITY on ${matchInfo?.home_team}: ${majorityWinner} (${majorityCount}/${predictions.length})`);
    }

    // Re-enforce score/winner coherence after averaging
    const hWins = base.pred_home_win > base.pred_away_win;
    if (hWins && base.pred_score_home < base.pred_score_away) {
      const tmp = base.pred_score_home; base.pred_score_home = base.pred_score_away; base.pred_score_away = tmp;
    } else if (!hWins && base.pred_score_away < base.pred_score_home) {
      const tmp = base.pred_score_home; base.pred_score_home = base.pred_score_away; base.pred_score_away = tmp;
    }

    merged.push(base);
  }

  console.log(`[CONSENSUS v4.0] ${merged.length} predictions after multi-model consensus (${totalModels} models active)`);
  return merged;
}

// Post-process predictions
function postProcessPredictions(
  predictions: AIPrediction[],
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  streak: StreakState
): AIPrediction[] {
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
    if (vs < 0.03) { p.ai_score = 0; continue; }
    if (odds < 1.20) { p.ai_score = 0; continue; }
    if (p.league_tier === 4) { p.ai_score = 0; continue; }
    if (p.league_tier === 3 && mainProb < 74) { p.ai_score = 0; continue; }
    if (p.data_completeness_score < 50) { p.ai_score = 0; continue; }
    if (p.data_completeness_score < 60 && mainProb > 75) {
      p.pred_home_win = Math.min(p.pred_home_win, 75);
      p.pred_away_win = Math.min(p.pred_away_win, 75);
    }
    if (p.context_penalties_total >= 25) { p.ai_score = 0; continue; }
    if ((p.pred_confidence || "").toUpperCase() === "RISQUÉ") { p.ai_score = 0; continue; }
    if (streak.level === "emergency" && p.league_tier !== 1) { p.ai_score = 0; continue; }
    if (p.anomaly_score >= 51 && p.pred_confidence === "SAFE") p.pred_confidence = "MODÉRÉ";

    // Smart score/market coherence
    const homeWins = p.pred_home_win > p.pred_away_win;
    const awayWins = p.pred_away_win > p.pred_home_win;
    const isDraw = !homeWins && !awayWins;
    const scoreIsDraw = p.pred_score_home === p.pred_score_away;

    if (homeWins && scoreIsDraw) {
      const analysis = p.pred_analysis || "";
      if (!analysis.toLowerCase().includes("double chance")) {
        p.pred_analysis = analysis.replace(/📌 Marché recommandé\s*:[^\n]*/i, "").trim();
        p.pred_analysis += `\n📌 Marché recommandé : Double Chance — ${matchData?.home_team || "Domicile"} ou Nul.`;
      }
    } else if (awayWins && scoreIsDraw) {
      const analysis = p.pred_analysis || "";
      if (!analysis.toLowerCase().includes("double chance")) {
        p.pred_analysis = analysis.replace(/📌 Marché recommandé\s*:[^\n]*/i, "").trim();
        p.pred_analysis += `\n📌 Marché recommandé : Double Chance — ${matchData?.away_team || "Extérieur"} ou Nul.`;
      }
    } else if (homeWins && p.pred_score_home < p.pred_score_away) {
      const tmp = p.pred_score_home; p.pred_score_home = p.pred_score_away; p.pred_score_away = tmp;
    } else if (awayWins && p.pred_score_away < p.pred_score_home) {
      const tmp = p.pred_score_home; p.pred_score_home = p.pred_score_away; p.pred_score_away = tmp;
    } else if (isDraw && p.pred_score_home !== p.pred_score_away) {
      const avg = Math.round((p.pred_score_home + p.pred_score_away) / 2);
      p.pred_score_home = avg; p.pred_score_away = avg;
    }

    p.validation_score = computeValidationScore(
      p.data_completeness_score, mainProb, vs, p.anomaly_score,
      p.league_tier, false, odds, p.consensus_passed, p.context_penalties_total, 7, streak
    ).score;
  }

  return predictions.filter(p => p.ai_score > 0).slice(0, streak.maxPicks);
}

// ═══════════════════════════════════════════════════════════════
// v4.0 FEATURE 4: ENHANCED SELF-LEARNING ENGINE
// ═══════════════════════════════════════════════════════════════

async function buildLearningContext(supabase: any): Promise<string> {
  try {
    const [globalRes, weakRes, betTypeRes, lossRes, patternRes] = await Promise.all([
      supabase.from("ai_learning_stats").select("*").eq("league_name", "_all").order("total_predictions", { ascending: false }).limit(20),
      supabase.from("ai_learning_stats").select("sport, league_name, winrate, calibration_error, total_predictions, common_loss_pattern").neq("league_name", "_all").gte("total_predictions", 5).order("winrate", { ascending: true }).limit(10),
      supabase.from("ai_learning_stats").select("bet_type, winrate, total_predictions, calibration_error, roi").eq("league_name", "_all").neq("bet_type", "_all").gte("total_predictions", 3),
      supabase.from("match_results").select("sport, league_name, predicted_confidence, predicted_winner, home_team, away_team, pred_home_win, pred_away_win, bet_type").eq("result", "loss").order("resolved_at", { ascending: false }).limit(20),
      // v4.0: Detect repeating error patterns
      supabase.from("match_results").select("sport, league_name, predicted_confidence, bet_type, result").not("result", "is", null).order("resolved_at", { ascending: false }).limit(50),
    ]);

    const sections: string[] = [];

    // Global performance
    const globalStats = globalRes.data;
    if (globalStats?.length > 0) {
      const lines = globalStats.map((s: any) =>
        `• ${s.sport.toUpperCase()} / ${s.confidence_level}: ${s.winrate}% wr (${s.total_predictions} picks), cal. error ${s.calibration_error}%${s.common_loss_pattern ? `, pattern: ${s.common_loss_pattern}` : ""}${s.roi != null ? `, ROI: ${s.roi}%` : ""}`
      );
      sections.push(`📊 GLOBAL PERFORMANCE:\n${lines.join("\n")}`);
    }

    // Weak leagues
    const weakLeagues = weakRes.data;
    if (weakLeagues?.length > 0) {
      const bad = weakLeagues.filter((l: any) => l.winrate < 50 || l.calibration_error > 10);
      if (bad.length > 0) {
        const lines = bad.slice(0, 6).map((l: any) =>
          `⚠️ ${l.league_name} (${l.sport}): ${l.winrate}% wr, ${l.calibration_error}% cal. error${l.common_loss_pattern ? ` — ${l.common_loss_pattern}` : ""}`
        );
        sections.push(`🚨 WEAK LEAGUES (REDUCE CONFIDENCE):\n${lines.join("\n")}`);
      }
    }

    // Bet-type insights
    const betTypeStats = betTypeRes.data;
    if (betTypeStats?.length > 0) {
      const lines = betTypeStats.map((b: any) =>
        `• ${(b.bet_type || "winner").toUpperCase()}: ${b.winrate}% wr (${b.total_predictions} picks)${b.roi != null ? `, ROI: ${b.roi}%` : ""}`
      );
      sections.push(`🎯 BET TYPE PERFORMANCE:\n${lines.join("\n")}`);
    }

    // Recent losses
    const recentLosses = lossRes.data;
    if (recentLosses?.length > 0) {
      const lossLines = recentLosses.slice(0, 10).map((l: any) => {
        const maxProb = Math.max(Number(l.pred_home_win), Number(l.pred_away_win));
        return `❌ ${l.home_team} vs ${l.away_team} (${l.league_name}) — ${l.predicted_confidence}, prob ${maxProb}%, type: ${l.bet_type || "winner"}`;
      });

      // v4.0: Enhanced pattern detection
      const upsetCount = recentLosses.filter((l: any) => Math.max(Number(l.pred_home_win), Number(l.pred_away_win)) >= 65).length;
      const safeCount = recentLosses.filter((l: any) => l.predicted_confidence === "SAFE").length;
      const patternWarnings: string[] = [];
      if (upsetCount > recentLosses.length * 0.5) patternWarnings.push("⚠️ UPSET PATTERN: You are overconfident on favorites. Reduce probabilities by 5-8%.");
      if (safeCount > recentLosses.length * 0.3) patternWarnings.push("⚠️ SAFE PICKS FAILING: Raise bar for SAFE — require >75% calibrated probability.");

      // v4.0: Sport-specific loss patterns
      const sportLosses = new Map<string, number>();
      for (const l of recentLosses) {
        sportLosses.set(l.sport, (sportLosses.get(l.sport) || 0) + 1);
      }
      for (const [sport, count] of sportLosses) {
        if (count >= 4) {
          patternWarnings.push(`🔴 ${sport.toUpperCase()} has ${count}/${recentLosses.length} recent losses — REDUCE volume on this sport!`);
        }
      }

      // v4.0: League-specific loss patterns
      const leagueLosses = new Map<string, number>();
      for (const l of recentLosses) {
        leagueLosses.set(l.league_name, (leagueLosses.get(l.league_name) || 0) + 1);
      }
      for (const [league, count] of leagueLosses) {
        if (count >= 3) {
          patternWarnings.push(`🔴 ${league} has ${count} consecutive losses — AVOID or raise threshold!`);
        }
      }

      sections.push(`📉 RECENT LOSSES (LEARN FROM THESE):\n${lossLines.join("\n")}${patternWarnings.length > 0 ? "\n" + patternWarnings.join("\n") : ""}`);
    }

    // v4.0: Confidence calibration correction based on recent results
    const allResults = patternRes.data;
    if (allResults?.length >= 10) {
      const byConfidence: Record<string, { wins: number; total: number }> = {};
      for (const r of allResults) {
        const conf = r.predicted_confidence || "MODÉRÉ";
        if (!byConfidence[conf]) byConfidence[conf] = { wins: 0, total: 0 };
        byConfidence[conf].total++;
        if (r.result === "win") byConfidence[conf].wins++;
      }
      const calLines = Object.entries(byConfidence).map(([conf, { wins, total }]) => {
        const wr = Math.round((wins / total) * 100);
        const emoji = wr >= 60 ? "✅" : wr >= 45 ? "⚠️" : "🔴";
        return `${emoji} ${conf}: ${wr}% actual winrate (${wins}/${total})`;
      });
      sections.push(`🎯 CONFIDENCE CALIBRATION (last 50 results):\n${calLines.join("\n")}`);
    }

    if (sections.length > 0) {
      const context = `\n\n🧠 SELF-LEARNING ENGINE v4.0 — MANDATORY ADJUSTMENTS:\n${sections.join("\n\n")}\n\nRULES FROM DATA:\n- If calibration_error > 10% → REDUCE probability by calibration_error/2\n- If league winrate < 50% → INCREASE minimum confidence by 5%\n- If bet type has < 45% wr → AVOID that bet type\n- If sport has 4+ recent losses → REDUCE volume, only top picks\n- If confidence level has < 45% actual wr → DOWNGRADE all future picks of that level\n- NEVER repeat the same error pattern twice.\n`;
      console.log(`[AI-PREDICT v4.0] 🧠 Learning context: ${sections.length} sections, ${context.length} chars`);
      return context;
    }
  } catch (e) {
    console.log("[AI-PREDICT v4.0] Learning stats error:", e);
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════
// DAILY BRIEFING
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
      date: today, mode: streak.level, leagues_analyzed: totalAnalyzed,
      matches_discarded: discarded, picks_retained: retained,
      avg_confidence: avgConfidence,
      daily_focus: focusMap[streak.level] || focusMap.normal,
      generated_at: new Date().toISOString(),
    }, { onConflict: "date" });
  } catch (e) { console.log("[BRIEFING] Error:", e); }
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const cerebrasKey = Deno.env.get("CEREBRAS_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const forceAll = url.searchParams.get("force") === "true";

    const streak = forceAll
      ? { level: "normal" as StreakLevel, isStreakMode: false, rollingWinrate: 100, maxPicks: 999, minConfidence: 35, minAiScore: 40, lastResults: [], consecutiveLosses: 0 } as StreakState
      : await checkStreakMode(supabase);

    const blacklistedLeagues = await getBlacklistedLeagues(supabase);

    if (streak.isStreakMode) {
      console.log(`[AI-PREDICT v4.0] ${streak.level.toUpperCase()} MODE: wr=${streak.rollingWinrate}%, losses=${streak.consecutiveLosses}, maxPicks=${streak.maxPicks}`);
    }

    // v4.0: Build enhanced learning context
    const learningContext = await buildLearningContext(supabase);

    // Fetch matches
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
        rolling_winrate: streak.rollingWinrate, version: "4.0"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // v4.0: Compute ELO + Trap signals for all matches
    const eloMap = new Map<string, LeagueELO>();
    const trapMap = new Map<number, { signals: TrapSignal[]; totalPenalty: number }>();

    const eligibleMatches = [];
    for (const m of matches) {
      const tier = getLeagueTier(m.league_name);
      if (tier === 4 || blacklistedLeagues.has(m.league_name)) continue;

      // Get ELO (cache per league)
      if (!eloMap.has(m.league_name)) {
        eloMap.set(m.league_name, await getLeagueELO(supabase, m.league_name, m.sport));
      }
      const elo = eloMap.get(m.league_name)!;

      // Compute trap signals
      const trap = detectTrapSignals(m, elo.winrate, elo.totalPicks);
      trapMap.set(m.fixture_id, trap);

      // Don't exclude trap matches from AI — let AI decide with the context
      eligibleMatches.push(m);
    }

    const excludedCount = matches.length - eligibleMatches.length;
    console.log(`[AI-PREDICT v4.0] ${matches.length} total → ${eligibleMatches.length} eligible (${excludedCount} excluded). ${eloMap.size} league ELOs loaded.`);

    // Log trap summary
    let trapCount = 0;
    for (const [fid, trap] of trapMap) {
      if (trap.totalPenalty > 0) {
        trapCount++;
        if (trap.totalPenalty > 15) {
          const m = eligibleMatches.find(x => x.fixture_id === fid);
          console.log(`[TRAP v4.0] 🪤 ${m?.home_team} vs ${m?.away_team}: -${trap.totalPenalty}% (${trap.signals.map(s => s.type).join(", ")})`);
        }
      }
    }
    console.log(`[AI-PREDICT v4.0] 🪤 ${trapCount} matches with trap signals detected`);

    let predictions: AIPrediction[] = [];
    let source = "pronosia-v4.0-deterministic";

    // v4.0: Launch MULTI-MODEL AI calls in parallel
    if (lovableApiKey && eligibleMatches.length > 0) {
      const { eligible, userPrompt } = buildAIPrompt(eligibleMatches, learningContext, streak, blacklistedLeagues, eloMap, trapMap);

      if (eligible.length > 0) {
        console.log(`[AI v4.0] 🚀 Launching TRIPLE-MODEL consensus: Gemini 2.5 Flash + GPT-5 Mini + Cerebras Qwen...`);

        const modelCalls: Promise<{ name: string; predictions: AIPrediction[] }>[] = [
          callLovableAI(lovableApiKey, "google/gemini-2.5-flash", userPrompt, "GEMINI-FLASH").then(p => ({ name: "Gemini 2.5 Flash", predictions: p })),
          callLovableAI(lovableApiKey, "openai/gpt-5-mini", userPrompt, "GPT-5-MINI").then(p => ({ name: "GPT-5 Mini", predictions: p })),
        ];

        // Add Cerebras as 3rd model if key available
        if (cerebrasKey) {
          modelCalls.push(
            callCerebrasAI(cerebrasKey, userPrompt).then(p => ({ name: "Cerebras Qwen 235B", predictions: p }))
          );
        }

        const modelResults = await Promise.all(modelCalls);

        for (const { name, predictions: preds } of modelResults) {
          console.log(`[AI v4.0] ${name}: ${preds.length} predictions`);
        }

        const activeModels = modelResults.filter(m => m.predictions.length > 0);
        if (activeModels.length >= 2) {
          const merged = mergeMultiModelConsensus(activeModels, eligible, streak);
          predictions = postProcessPredictions(merged, eligible, streak);
          source = `pronosia-v4.0-consensus-${activeModels.length}models`;
        } else if (activeModels.length === 1) {
          predictions = postProcessPredictions(
            activeModels[0].predictions.map(p => ({ ...p, consensus_passed: false })),
            eligible, streak
          );
          source = `pronosia-v4.0-single-${activeModels[0].name}`;
        }
      }
    }

    // Enhanced deterministic fallback with ELO + traps
    if (predictions.length === 0 && eligibleMatches.length > 0) {
      console.log(`[AI-PREDICT v4.0] Using deterministic engine with ELO + traps for ${eligibleMatches.length} matches`);

      try {
        await supabase.from("admin_logs").insert({
          admin_email: "system",
          action: "fallback-activated-v4.0",
          details: { reason: "AI gateway unavailable", match_count: eligibleMatches.length, streak_level: streak.level },
        });
      } catch {}

      const raw: AIPrediction[] = [];
      for (const m of eligibleMatches) {
        const elo = eloMap.get(m.league_name) || { winrate: 50, totalPicks: 0, confidenceAdjustment: 0, tier: 2, source: "default" };
        const trap = trapMap.get(m.fixture_id) || { signals: [], totalPenalty: 0 };
        const pred = generatePRONOSIAPrediction(m, streak, elo, trap);
        if (pred) raw.push(pred);
      }
      predictions = raw.slice(0, streak.maxPicks);
      source = "pronosia-v4.0-deterministic";
    }

    // Write predictions to DB
    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    let updated = 0;
    let totalConfidence = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const pred = predMap.get(m.fixture_id);
      if (!pred) continue;

      if (!forceAll && m.pred_home_win != null && m.pred_away_win != null && m.pred_analysis) continue;

      const tier = getLeagueTier(m.league_name);

      // Final Enforcer: score/market coherence
      const homeWinsPred = pred.pred_home_win > pred.pred_away_win;
      const awayWinsPred = pred.pred_away_win > pred.pred_home_win;
      const scoreDrawPred = pred.pred_score_home === pred.pred_score_away;

      if (homeWinsPred && scoreDrawPred) {
        if (!(pred.pred_analysis || "").toLowerCase().includes("double chance")) {
          pred.pred_analysis = (pred.pred_analysis || "") + `\n📌 Marché recommandé : Double Chance — ${m.home_team} ou Nul.`;
        }
      } else if (awayWinsPred && scoreDrawPred) {
        if (!(pred.pred_analysis || "").toLowerCase().includes("double chance")) {
          pred.pred_analysis = (pred.pred_analysis || "") + `\n📌 Marché recommandé : Double Chance — ${m.away_team} ou Nul.`;
        }
      } else if (homeWinsPred && pred.pred_score_home < pred.pred_score_away) {
        const tmp = pred.pred_score_home; pred.pred_score_home = pred.pred_score_away; pred.pred_score_away = tmp;
      } else if (awayWinsPred && pred.pred_score_away < pred.pred_score_home) {
        const tmp = pred.pred_score_home; pred.pred_score_home = pred.pred_score_away; pred.pred_score_away = tmp;
      }

      const { error: updateError } = await supabase
        .from("cached_matches")
        .update({
          pred_home_win: pred.pred_home_win, pred_draw: pred.pred_draw, pred_away_win: pred.pred_away_win,
          pred_score_home: pred.pred_score_home, pred_score_away: pred.pred_score_away,
          pred_over_under: pred.pred_over_under, pred_over_prob: pred.pred_over_prob,
          pred_btts_prob: pred.pred_btts_prob, pred_confidence: pred.pred_confidence,
          pred_value_bet: pred.pred_value_bet, pred_analysis: pred.pred_analysis,
          ai_score: pred.ai_score, anomaly_score: pred.anomaly_score || 0,
          anomaly_label: pred.anomaly_label || null, anomaly_reason: pred.anomaly_reason || null,
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
        console.error(`[AI-PREDICT v4.0] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        totalConfidence += Math.max(pred.pred_home_win, pred.pred_away_win);
        if (i === 0) console.log(`[AI-PREDICT v4.0] Sample: ${m.home_team} vs ${m.away_team}: ${pred.pred_confidence} | AI:${pred.ai_score} | ${source}`);
      }
    }

    const avgConfidence = updated > 0 ? Math.round(totalConfidence / updated) : 0;
    await generateDailyBriefing(supabase, streak, matches.length, excludedCount, updated, avgConfidence);

    console.log(`[AI-PREDICT v4.0] ✅ Updated ${updated} via ${source}. Streak=${streak.level}`);

    return new Response(JSON.stringify({
      success: true, source, version: "4.0",
      batch_size: matches.length, eligible: eligibleMatches.length,
      excluded: excludedCount, blacklisted_leagues: [...blacklistedLeagues],
      predictions_generated: predictions.length, updated,
      streak_mode: streak.isStreakMode, streak_level: streak.level,
      rolling_winrate: streak.rollingWinrate, consecutive_losses: streak.consecutiveLosses,
      models_used: source,
      elo_leagues_loaded: eloMap.size,
      trap_matches_detected: trapCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[AI-PREDICT v4.0] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
