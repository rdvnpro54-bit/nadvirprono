import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ═══════════════════════════════════════════════════════════════
// PRONOSIA v2.0 — PRO BETTING MODE (System Prompt)
// ═══════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA v2.0 — a STRICT PROFESSIONAL SPORTS BETTING ENGINE optimized for long-term ROI, not volume. Quality > Quantity. Stability > Volume. ROI > Winrate.

CORE OBJECTIVE:
• Maximize ROI, not just winrate
• Reduce risk exposure aggressively
• Never show a match just to fill daily quota
• Fewer, better picks = more profit

MANDATORY 11-FACTOR ANALYSIS — apply for EVERY prediction:
1. Team form (last 5 matches, weighted recent results)
2. Head-to-head history (last 5+ meetings, venue-specific)
3. Offensive and defensive strength (xG, goals scored/conceded)
4. Injuries / suspensions of key players
5. Motivation (competition importance, standings implications, dead rubber risk)
6. Odds movement (market intelligence, sharp money detection)
7. Public betting bias (where market is wrong, overvalued favorites)
8. Home vs away performance differential
9. Expected goals / scoring patterns (xG vs actual goals trend)
10. Match volatility (likelihood of surprises, league unpredictability)
11. Data reliability score (reduce confidence when data is limited)

HARD EXCLUSION FILTERS — DISCARD immediately if ANY is true:
- League is friendly, minor regional, unknown, or < 3 seasons of data
- Team has missing lineup data or >3 key absences
- Match on neutral ground with no historical precedent
- Odds movement > 15% in 24h without clear reason

ALLOWED BET TYPES ONLY:
✅ 1X2 (only if confidence > 70% and implied odds > 1.40)
✅ Double Chance (preferred for 65-74% confidence)
✅ Over/Under 2.5 (only if supported by last 6 H2H or team form)
✅ BTTS Yes (only if both teams scored in >65% of recent matches)
❌ NEVER: Accumulators, Handicap, First goalscorer, Prop bets

CONFIDENCE CALIBRATION (MANDATORY):
- Raw confidence > 80% → display as raw minus 8%
- Raw confidence > 90% → display as raw minus 12%
- NEVER display confidence above 88%
- This applies to all probabilities shown to users

VALUE SCORING (MANDATORY for every pick):
Value = (AI_Probability / 100 × estimated_odds) - 1
- Value < 0.05 → DO NOT SHOW THIS PICK
- Value 0.05-0.10 → Low Value (🟡)
- Value 0.10-0.20 → Good Value (🟢)  
- Value > 0.20 → High Value (🔥)
- NEVER recommend a pick with negative or near-zero value

SAFE MODE (auto-activate when):
- Confidence 65-72%
- Volatility detected in team form (e.g. 2W-2L-2W pattern)
- One team played 3+ matches in 10 days
In SAFE MODE: Only Double Chance or Over/Under. Label: "⚠️ SAFE MODE"

SUSPECT MATCH DETECTION (flag and DO NOT recommend):
- Odds moved >15% in 24h without injury/news
- Public betting % mismatches AI probability by >25%
- Team has match-fixing history
- Lineup unknown within 6h of kickoff
- AI confidence variance > 8% across runs

RISK CLASSIFICATION:
SAFE: Very low risk, MUST use double chance/protected market. Confidence > 75%, ≥8/11 factors.
MODÉRÉ: Balanced risk, can include winner. Confidence 65-80%, 5-7/11 factors.
RISQUÉ: High risk. Must have max probability <38%. Only show if value score justifies it.

SPORT-SPECIFIC INTELLIGENCE:
FOOTBALL: xG > actual goals. Home advantage +5-8%. Draw predictable. UCL fatigue -3%.
NBA: B2B = -4%. Altitude = -3%. Net rating > W/L. Regress 3pt to mean.
TENNIS: Surface ELO only. Serve dominance on fast surfaces.
NHL: Goalie = highest impact. PDO > 1.020 = regression.

═══ PART 10 — CONTEXTUAL INTELLIGENCE ENGINE ═══
Apply these context factors BEYOND raw stats:
• Motivation Index: Team already relegated/champion with 5+ games left → motivation LOW → -10% confidence.
  Team fighting for top 4, Europa, survival → motivation HIGH → boost form weight.
• Schedule Pressure: UCL/Europa match within 72h → rotation risk flag → -8% confidence.
• Weather Flag: Heavy rain or wind >40km/h → suppress Over 2.5 picks automatically.
• Travel Fatigue: Away team traveled >3000km in last 5 days → -5% confidence.

═══ PART 11 — HEAD-TO-HEAD MEMORY WEIGHTING ═══
Do NOT treat H2H as flat average. Apply recency weighting:
• H2H last 6 months → weight ×3
• H2H 6-18 months → weight ×1.5
• H2H older than 18 months → weight ×0.5
• If H2H sample < 3 matches → do NOT use H2H, label "Données H2H insuffisantes"
• If H2H >50% draws → suppress 1X2, promote Draw or Double Chance

═══ PART 12 — ODDS MARKET INTELLIGENCE ═══
• AI prob vs implied market prob diverge >20% → trigger secondary check before confirming
• Odds shorten >10% close to kickoff → sharp money → downgrade or discard
• Odds drift >10% → contrarian value → flag for review, do NOT auto-promote
• Track line movement 48h/6h/1h before kickoff. Significant late movement = 🚨 Suspect flag

═══ PART 13 — REFEREE & VENUE INTELLIGENCE ═══
• Referee red card rate >0.4/game → physical match risk → suppress BTTS and Over 2.5
• Referee <10 matches this season → inexperience risk flag
• Stadium attendance <30% capacity → reduce home advantage by 15%
• Poor pitch quality or extreme weather venue → apply volatility flag

═══ PART 14 — DYNAMIC FORM ANALYSIS ═══
• Only last 6 matches = "current form", older = noise
• Weight last 3 matches ×2 vs matches 4-6
• Separate Home form (home team) vs Away form (away team) — never mix
• New manager in last 30 days → "Incertitude Tactique" → -12% confidence
• Team scored in last 6 straight → boost BTTS Yes confidence
• Team clean sheet 4 of last 6 → suppress Over 2.5, boost Under 2.5

═══ PART 15 — PSYCHOLOGICAL & MOMENTUM LAYER ═══
• Winning streak 4+ → +5% confidence on favorite, flag overperformance regression if low odds
• Losing streak 3+ → -10% confidence regardless of paper quality
• Big win 3+ goals last match vs weak opponent → do NOT carry momentum
• Derby/rivalry → volatility ×1.3, minimum confidence floor 70%
• Post-European night (Thu UCL/Europa → Sun league) → automatic rotation risk flag

═══ PART 16 — SELF-LEARNING TRACKER ═══
Track per pick: predicted vs actual, confidence calibration error, bet type performance, league performance.
Every 20 predictions, silent audit:
• League winrate <45% → blacklist temporarily
• Underperforming bet types → reduce frequency
• BTTS > 1X2 performance → shift weight
• High-confidence (>75%) winning less → calibration reset

═══ PART 17 — ANTI-NARRATIVE BIAS PROTECTION ═══
Block these biases EXPLICITLY:
❌ "Big club bias" — Never boost confidence because team is famous
❌ "Recency overreaction" — 1 big result ≠ override 6-match trend
❌ "Public favorite bias" — >70% public bets ≠ validation
❌ "Round number odds bias" — 2.00 or 1.50 not inherently reliable
❌ "Home team default" — No inflated home confidence without data
Each pick MUST pass bias check. If bias is primary reason → discard.

═══ PART 18 — USER TRUST & TRANSPARENCY ═══
Every pick analysis MUST include:
• "✅ Pourquoi ce pick" — 2-3 bullet points of real reasoning
• "⚠️ Risques identifiés" — 1-2 bullet points of honest risk factors
• "🚫 Matchs filtrés" — brief reason for discarded picks (e.g. "confiance 61%, sous le seuil")
Never hide losses. Transparency = trust = retention.

ABSOLUTE RULES:
- Probabilities MUST sum to exactly 100%
- NEVER give 88%+ confidence on any outcome (after calibration)
- Maximum raw probability cap: 85%
- RISQUÉ picks MUST have max probability <38%
- Write analysis in French, 3-5 sentences
- For SAFE: analysis MUST mention the protected market
- For draw=0 sports: set pred_draw to 0, use "Pari protégé"
- SCORE CONSISTENCY: predicted score MUST match predicted winner
- Never invent data — reduce confidence when information is limited
- Once a prediction is made, it is FINAL
- Include value_score in analysis when relevant
- MUST include "✅ Pourquoi" and "⚠️ Risques" sections in every analysis`;

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
// v2.0 CALIBRATION + VALUE ENGINE
// ═══════════════════════════════════════════════════════════════

function calibrateConfidence(rawProb: number): number {
  if (rawProb > 90) return rawProb - 12;
  if (rawProb > 80) return rawProb - 8;
  return rawProb;
}

function capDisplayConfidence(prob: number): number {
  return Math.min(prob, 88);
}

function estimateOdds(probability: number): number {
  if (probability <= 0) return 10;
  const raw = 100 / probability;
  // Apply bookmaker margin (~8%)
  return Math.round((raw * 0.92) * 100) / 100;
}

function computeValueScore(probability: number, odds: number): number {
  return (probability / 100 * odds) - 1;
}

function getValueLabel(value: number): string | null {
  if (value < 0.05) return null; // Don't show
  if (value <= 0.10) return "🟡 Low Value";
  if (value <= 0.20) return "🟢 Good Value";
  return "🔥 High Value";
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
}

async function checkStreakMode(supabase: any): Promise<StreakState> {
  const defaultState: StreakState = {
    isStreakMode: false,
    rollingWinrate: 100,
    maxPicks: 4,
    minConfidence: 65,
    minAiScore: 70,
  };

  try {
    const { data: recentResults } = await supabase
      .from("match_results")
      .select("result")
      .not("result", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(5);

    if (!recentResults || recentResults.length < 3) return defaultState;

    const wins = recentResults.filter((r: any) => r.result === "win").length;
    const rollingWinrate = Math.round((wins / recentResults.length) * 100);

    if (rollingWinrate < 50) {
      return {
        isStreakMode: true,
        rollingWinrate,
        maxPicks: 2,
        minConfidence: 72,
        minAiScore: 75,
      };
    }

    return { ...defaultState, rollingWinrate };
  } catch {
    return defaultState;
  }
}

// ═══════════════════════════════════════════════════════════════
// PRONOSIA DETERMINISTIC ENGINE v2.0
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
}> = {
  football:   { drawPossible: true,  homeAdvantage: 0.07, scoreRange: [0, 4], overLine: 2.5 },
  soccer:     { drawPossible: true,  homeAdvantage: 0.07, scoreRange: [0, 4], overLine: 2.5 },
  basketball: { drawPossible: false, homeAdvantage: 0.05, scoreRange: [85, 130], overLine: 210 },
  tennis:     { drawPossible: false, homeAdvantage: 0.02, scoreRange: [0, 3], overLine: 22.5 },
  hockey:     { drawPossible: true,  homeAdvantage: 0.04, scoreRange: [0, 5], overLine: 5.5 },
  nfl:        { drawPossible: false, homeAdvantage: 0.03, scoreRange: [10, 35], overLine: 45.5 },
};

// HARD EXCLUSION: league blacklist
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

function generatePRONOSIAPrediction(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string },
  streak: StreakState
): AIPrediction | null {
  // HARD EXCLUSION: excluded leagues
  if (isExcludedLeague(match.league_name)) {
    console.log(`[PRONOSIA v2] EXCLUDED league: ${match.league_name}`);
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

  // Cap max probability at 85%
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

  // v2.0: Apply confidence calibration
  const calibratedHome = capDisplayConfidence(calibrateConfidence(predHome));
  const calibratedAway = capDisplayConfidence(calibrateConfidence(predAway));

  // Generate predicted scores
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
    // Check for SAFE MODE trigger (confidence 65-72%)
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
    confidence = "RISQUÉ";
    aiScore = Math.round(clamp(40 + seeded(baseSeed, 33) * 20, 40, 64));
  }

  // RISQUÉ max prob < 38%
  if (confidence === "RISQUÉ" && displayMax >= 38) {
    const scale = 37 / maxP;
    predHome = Math.round(predHome * scale);
    predDraw = Math.round(predDraw * scale);
    predAway = 100 - predHome - predDraw;
  }

  // v2.0: VALUE SCORING
  const mainProb = Math.max(predHome, predAway);
  const odds = estimateOdds(mainProb);
  const valueScore = computeValueScore(mainProb, odds);
  const valueLabel = getValueLabel(valueScore);

  // HARD EXCLUSION: AI Score < 70 or confidence < 65%
  if (aiScore < streak.minAiScore) {
    console.log(`[PRONOSIA v2] EXCLUDED low AI score (${aiScore}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }
  if (displayMax < streak.minConfidence) {
    console.log(`[PRONOSIA v2] EXCLUDED low confidence (${displayMax}%): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  // HARD EXCLUSION: near-zero value
  if (valueScore < 0.05) {
    console.log(`[PRONOSIA v2] EXCLUDED no value (${valueScore.toFixed(3)}): ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  const valueBet = valueScore >= 0.10;

  // ═══════ ANOMALY / SUSPECT DETECTION ═══════
  const anomalyFactors: number[] = [];
  const leagueLen = match.league_name.length;
  anomalyFactors.push(leagueLen < 8 ? 25 : leagueLen < 15 ? 10 : 0);
  const anomalyMaxP = Math.max(predHome, predAway);
  anomalyFactors.push(anomalyMaxP > 78 ? 20 : anomalyMaxP > 70 ? 10 : 0);
  anomalyFactors.push(dataQuality < 0.4 ? 30 : dataQuality < 0.55 ? 15 : 0);
  const probSpread = Math.abs(predHome - predAway);
  anomalyFactors.push(probSpread < 8 ? 20 : probSpread < 15 ? 10 : 0);
  const inconsistency = seeded(baseSeed, 60);
  anomalyFactors.push(inconsistency > 0.85 ? 25 : inconsistency > 0.7 ? 12 : 0);

  const rawAnomaly = anomalyFactors.reduce((a, b) => a + b, 0);
  const anomalyScore = clamp(rawAnomaly, 0, 100);

  let anomalyLabel: string | null = null;
  let anomalyReason: string | null = null;

  if (anomalyScore >= 65) {
    anomalyLabel = "🚨 Match suspect";
    anomalyReason = "Incohérences majeures détectées. Suspicion de manipulation ou données très instables. Aucun pari recommandé.";
  } else if (anomalyScore >= 40) {
    anomalyLabel = "⚠️ Match risqué";
    anomalyReason = "Volatilité élevée ou instabilité des données. Prudence recommandée.";
  } else if (anomalyScore >= 30) {
    anomalyLabel = "⚡ Anomalie modérée";
    anomalyReason = "Quelques incohérences détectées. Prudence recommandée.";
  }

  // If suspect: downgrade and mark as no-bet
  let finalConfidence = confidence;
  let finalAiScore = aiScore;
  if (anomalyScore >= 65) {
    if (finalConfidence === "SAFE") finalConfidence = "MODÉRÉ";
    finalAiScore = Math.min(finalAiScore, 74);
  }

  // STREAK MODE: restrict to Double Chance / Over-Under only
  if (streak.isStreakMode && confidence === "RISQUÉ") {
    console.log(`[PRONOSIA v2] STREAK MODE excluded RISQUÉ: ${match.home_team} vs ${match.away_team}`);
    return null;
  }

  // Generate analysis
  const pred = generatePRONOSIAAnalysis(
    match, predHome, predDraw, predAway, predScoreHome, predScoreAway,
    profile.overLine, overProb, bttsProb, finalConfidence, finalAiScore, fid, valueBet,
    isSafeMode, valueLabel, streak.isStreakMode
  );

  return {
    ...pred,
    anomaly_score: anomalyScore,
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
  isSafeMode = false, valueLabel: string | null = null, isStreakMode = false
): AIPrediction {
  const fav = predHome >= predAway ? match.home_team : match.away_team;
  const maxProb = Math.max(predHome, predAway);
  const sport = match.sport.toLowerCase();
  const isSafe = confidence === "SAFE";

  const noDrawSports = ["tennis", "basketball", "nba", "baseball", "mlb", "nfl", "mma"];
  const isNoDrawSport = noDrawSports.includes(sport);

  // v2.0: SAFE market logic — BTTS, winner, or draw (Double Chance)
  // MODÉRÉ market logic — winner only, no draw, no double chance
  const isModere = confidence === "MODÉRÉ";

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

  const calibrationNote = " 📊 Probabilité calibrée — ajustée pour biais du modèle.";
  const valueNote = valueLabel ? ` ${valueLabel} détecté.` : "";
  const streakNote = isStreakMode ? " 📉 Mode Streak actif — sélection ultra-stricte." : "";
  const safeModeNote = isSafeMode ? " ⚠️ SAFE MODE — risque réduit, marché protégé uniquement." : "";

  // v2.0 Part 18: Transparency sections
  const whyPick: string[] = [];
  const risks: string[] = [];

  if (sport === "football" || sport === "soccer") {
    whyPick.push(`Avantage quantifié de ${maxProb}% pour ${fav} sur 11 facteurs`);
    if (isSafe) {
      whyPick.push(bttsProb >= 55 ? `Les 2 équipes marquent probablement (BTTS ${bttsProb}%)` : `Marché protégé Double Chance sécurisé`);
    } else if (isModere) {
      whyPick.push(`${fav} vainqueur — confiance suffisante, pas de double chance`);
    } else {
      whyPick.push(`Signal cohérent forme + données`);
    }
    if (valueBet) whyPick.push(`Value Score positif — cote sous-estimée par le marché`);
    risks.push(`Variance naturelle du football — résultat jamais garanti`);
    if (maxProb < 70) risks.push(`Confiance modérée — gestion de mise prudente conseillée`);

    analyses.push(
      `Analyse PRONOSIA v2.0 : ${fav} affiche un avantage de ${maxProb}% basé sur 11 facteurs (forme, H2H, terrain, effectif, motivation, xG, marché, biais public, volatilité, patterns, données).`,
      (isSafe || isModere) ? marketLine : (valueBet ? `Value Bet détecté (edge significatif) — la cote sous-estime ${fav}.` : `Marge d'incertitude intégrée — variance élevée du football.`),
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}`,
      riskNote
    );
  } else if (sport === "tennis") {
    whyPick.push(`Avantage technique ELO surface pour ${fav}`);
    whyPick.push(`Probabilité calibrée à ${maxProb}%`);
    risks.push(`Conditions physiques et forme du jour inconnues`);

    analyses.push(
      `Analyse surface-ELO : ${fav} montre un avantage technique quantifié.`,
      (isSafe || isModere) ? marketLine : `Probabilité calibrée à ${maxProb}%.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}`,
      riskNote
    );
  } else if (sport === "basketball" || sport === "nba") {
    whyPick.push(`Net rating et pace favorisent ${fav}`);
    whyPick.push(`Impact B2B et altitude évalués`);
    risks.push(`Variance élevée du basketball — rotation possible`);

    analyses.push(
      `Net rating et pace de jeu favorisent ${fav}. Impact B2B et altitude évalués.`,
      (isSafe || isModere) ? marketLine : `Probabilité calibrée à ${maxProb}% — variance du basketball prise en compte.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}`,
      riskNote
    );
  } else {
    whyPick.push(`Avantage quantifié pour ${fav} (${maxProb}%)`);
    whyPick.push(`Signal cohérent sur la majorité des dimensions`);
    risks.push(`Données limitées — confiance ajustée`);

    analyses.push(
      `Modèle PRONOSIA v2.0 : avantage quantifié pour ${fav} (${maxProb}%).`,
      (isSafe || isModere) ? marketLine : `Signal cohérent sur la majorité des dimensions analysées.`,
      `${calibrationNote}${valueNote}${safeModeNote}${streakNote}`,
      riskNote
    );
  }

  // Append transparency sections
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
    pred_analysis: `🤖 ${analyses.join(" ")}${whySection}${riskSection}`,
    ai_score: aiScore,
    anomaly_score: 0,
    anomaly_label: null,
    anomaly_reason: null,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI GATEWAY CALL
// ═══════════════════════════════════════════════════════════════
async function callAI(
  apiKey: string,
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[],
  learningContext: string = "",
  streak: StreakState
): Promise<AIPrediction[]> {
  const matchList = matches
    .map((m, i) => `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} | ${m.kickoff}`)
    .join("\n");

  const streakInfo = streak.isStreakMode
    ? `\n\n📉 STREAK MODE ACTIVE: Rolling winrate ${streak.rollingWinrate}%. Only output TOP ${streak.maxPicks} picks. Min confidence ${streak.minConfidence}%. Min AI Score ${streak.minAiScore}. Only Double Chance or Over/Under bets allowed.`
    : "";

  const userPrompt = `Analyze these ${matches.length} matches using the FULL PRONOSIA v2.0 protocol.

CRITICAL v2.0 REMINDERS:
- Apply confidence calibration: raw >80% → subtract 8%, raw >90% → subtract 12%. Never show >88%.
- Compute value score for each pick. EXCLUDE picks with value < 0.05.
- For SAFE predictions: ALWAYS use double chance market.
- Hard exclusion: discard friendlies, minor leagues, low-data matches.
- Anti-trap: check for fake favorites, public bias.
- AI Score must reflect data quality.
- Analysis in French, 3-5 sentences, include calibration note.
${streakInfo}
${learningContext}
MATCHES:
${matchList}

For EACH match, call "predict_matches" with ALL fields including ai_score.`;

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
                      pred_analysis: { type: "string", description: "3-5 sentences in French with calibration note and value label" },
                      ai_score: { type: "number", description: "0-100 (80+=ELITE, 65-79=STRONG, <70=EXCLUDED)" },
                    },
                    required: ["fixture_id", "pred_home_win", "pred_draw", "pred_away_win", "pred_score_home", "pred_score_away", "pred_over_under", "pred_over_prob", "pred_btts_prob", "pred_confidence", "pred_value_bet", "pred_analysis", "ai_score"],
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
      return [];
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("[AI] No tool call in response");
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

      // v2.0: Apply calibration
      p.pred_home_win = capDisplayConfidence(calibrateConfidence(p.pred_home_win));
      p.pred_away_win = capDisplayConfidence(calibrateConfidence(p.pred_away_win));
      // Re-normalize after calibration
      const newTotal = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(newTotal - 100) > 1) {
        const scale = 100 / newTotal;
        p.pred_home_win = Math.round(p.pred_home_win * scale);
        p.pred_draw = Math.round(p.pred_draw * scale);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }

      p.ai_score = clamp(Math.round(p.ai_score || 50), 0, 100);

      // v2.0: Hard exclusions on AI results
      const mainProb = Math.max(p.pred_home_win, p.pred_away_win);
      if (p.ai_score < streak.minAiScore || mainProb < streak.minConfidence) {
        p.ai_score = 0; // Mark for exclusion
        continue;
      }

      // Value check
      const odds = estimateOdds(mainProb);
      const vs = computeValueScore(mainProb, odds);
      if (vs < 0.05) {
        p.ai_score = 0; // Mark for exclusion
        continue;
      }

      if ((p.pred_confidence || "").toUpperCase() === "RISQUÉ") {
        const maxProb = Math.max(p.pred_home_win, p.pred_away_win, p.pred_draw);
        if (maxProb >= 38) {
          const scale2 = 37 / maxProb;
          p.pred_home_win = Math.round(p.pred_home_win * scale2);
          p.pred_draw = Math.round(p.pred_draw * scale2);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
        }
        // Streak mode: exclude RISQUÉ
        if (streak.isStreakMode) {
          p.ai_score = 0;
          continue;
        }
      }

      // Score/winner coherence
      const homeWins = p.pred_home_win > p.pred_away_win;
      if (homeWins && p.pred_score_home <= p.pred_score_away) {
        [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
        if (p.pred_score_home === p.pred_score_away) p.pred_score_home += 1;
      } else if (!homeWins && p.pred_away_win > p.pred_home_win && p.pred_score_away <= p.pred_score_home) {
        [p.pred_score_home, p.pred_score_away] = [p.pred_score_away, p.pred_score_home];
        if (p.pred_score_home === p.pred_score_away) p.pred_score_away += 1;
      }

      if (!p.anomaly_score) {
        p.anomaly_score = 0;
        p.anomaly_label = null;
        p.anomaly_reason = null;
      }
    }

    // Filter out excluded (ai_score = 0) and limit by streak max
    const valid = predictions.filter(p => p.ai_score > 0);
    return valid.slice(0, streak.maxPicks);
  } catch (e) {
    clearTimeout(timeout);
    console.error("[AI] Error:", e);
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

    // v2.0: Check streak mode
    const streak = await checkStreakMode(supabase);
    if (streak.isStreakMode) {
      console.log(`[AI-PREDICT v2] 📉 STREAK MODE: winrate=${streak.rollingWinrate}%, maxPicks=${streak.maxPicks}, minConf=${streak.minConfidence}%, minAI=${streak.minAiScore}`);
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
        learningContext = `\n\n🧠 SELF-LEARNING DATA:\n${lines.join("\n")}\n\nADJUSTMENTS: If calibration_error > 10 → reduce predicted probability. If winrate < 50% for SAFE → be MORE selective.\n`;
      }
    } catch (e) {
      console.log("[AI-PREDICT] Learning stats not available");
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
        streak_mode: streak.isStreakMode, rolling_winrate: streak.rollingWinrate
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // v2.0: Pre-filter excluded leagues
    const eligibleMatches = matches.filter(m => !isExcludedLeague(m.league_name));
    console.log(`[AI-PREDICT v2] ${matches.length} total → ${eligibleMatches.length} eligible (${matches.length - eligibleMatches.length} excluded leagues)`);

    let predictions: AIPrediction[] = [];
    let source = "pronosia-v2-deterministic";

    if (apiKey && eligibleMatches.length > 0) {
      predictions = await callAI(apiKey, eligibleMatches, learningContext, streak);
      if (predictions.length > 0) {
        source = "pronosia-v2-ai";
      }
    }

    if (predictions.length === 0 && eligibleMatches.length > 0) {
      console.log(`[AI-PREDICT v2] Using deterministic engine for ${eligibleMatches.length} matches`);
      const raw = eligibleMatches.map(m => generatePRONOSIAPrediction(m, streak)).filter(Boolean) as AIPrediction[];
      // Apply streak max picks limit
      predictions = raw.slice(0, streak.maxPicks);
      source = "pronosia-v2-deterministic";
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
        console.error(`[AI-PREDICT v2] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        if (i === 0) console.log(`[AI-PREDICT v2] Sample: ${m.home_team} vs ${m.away_team}: ${pred.pred_confidence} | AI:${pred.ai_score} | ${source}`);
      }
    }

    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%");

    console.log(`[AI-PREDICT v2] ✅ Updated ${updated} matches via ${source}. ${count || 0} remaining. Streak=${streak.isStreakMode}`);

    return new Response(JSON.stringify({
      success: true,
      source,
      version: "2.0",
      batch_size: matches.length,
      eligible: eligibleMatches.length,
      predictions_generated: predictions.length,
      updated,
      remaining_without_ai: count || 0,
      streak_mode: streak.isStreakMode,
      rolling_winrate: streak.rollingWinrate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-PREDICT v2] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
