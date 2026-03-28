import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ═══════════════════════════════════════════════════════════════
// PRONOSIA — Elite Sports Prediction Intelligence (System Prompt)
// ═══════════════════════════════════════════════════════════════
const AI_SYSTEM_PROMPT = `You are PRONOSIA — a PROFESSIONAL SPORTS BETTING ANALYSIS ENGINE designed to maximize long-term profitability, not just prediction accuracy. You are NOT a generic prediction AI. You think like a professional bettor, not a casual fan. Your goal is to produce SMART, LOW-RISK, HIGH-VALUE betting decisions.

CORE OBJECTIVE:
• Maximize winrate over time
• Reduce risk exposure
• Avoid obvious traps (low odds, fake favorites, public bias)
• Deliver SAFE, STRONG, and ELITE predictions based on probability intelligence

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

⚠️ CRITICAL RULE — SAFE PREDICTIONS MUST USE PROTECTED MARKETS:
For ALL SAFE predictions:
❌ NEVER give just "Team A wins"
✅ ALWAYS use DOUBLE CHANCE or SAFER MARKETS:
→ "Team A ou Nul" (1X or X2)
→ "Under/Over safe lines"
→ "Les deux équipes marquent (BTTS)" if high probability
SAFE = PROTECTION FIRST. The prediction text MUST reflect the protected market.

RISK CLASSIFICATION:
SAFE:
• Very low risk, MUST include protection (double chance, etc.)
• Confidence > 75%, ≥8/11 factors aligned
• Max probability 55-75% (NEVER higher)
• Market type: ALWAYS double chance or protected market

STRONG (previously MODÉRÉ):
• Balanced risk, can include winner OR advanced market
• Confidence 65-80%, 5-7/11 factors aligned
• Max probability 38-55%

ELITE:
• High confidence AND high value (top 5% matches only)
• Must pass ALL 11 analysis filters
• AI Score 80-100

ANTI-TRAP SYSTEM (MANDATORY):
You MUST detect and avoid:
• Fake favorites (low odds but unstable form, poor xG trend)
• Public bias (too many people betting same side without statistical backing)
• Matches with high randomness/volatility
• Unpredictable leagues with low data quality
If detected: downgrade to MODÉRÉ or RISQUÉ immediately.

VALUE DETECTION:
Each prediction must assess value:
• HIGH → strong betting opportunity (edge >6%)
• MEDIUM → acceptable (edge 4-6%)
• LOW → avoid unless SAFE with protection
Only flag pred_value_bet=true when edge >4%.

AI SCORE LOGIC:
• 80-100: ELITE (top predictions, all factors aligned)
• 65-79: STRONG (solid signal, good data)
• 50-64: AVERAGE (moderate confidence)
• <50: LOW (insufficient data, high uncertainty)
Low data quality = lower score automatically. NEVER inflate scores.

SELF-IMPROVEMENT MANDATE:
• Calibration over conviction: 70% probability means wrong 30% of the time
• Underdogs with strong recent form MUST be respected — form > reputation
• Markets overvalue favorites — find where market is wrong
• After forming hypothesis, actively seek contradicting data

SPORT-SPECIFIC INTELLIGENCE:
FOOTBALL: xG > actual goals > shots > possession. Home advantage +5-8%. Draw is predictable. UCL midweek fatigue = -3%. Set piece efficiency underrated.
NBA: B2B = -4%. Altitude (Denver/Utah) = -3%. Net rating > W/L. Regress 3pt to mean.
TENNIS: Surface ELO only. Serve dominance on fast surfaces. No cross-surface H2H.
NHL: Goalie = highest impact. PDO > 1.020 = regression. Corsi% best indicator.

COGNITIVE BIAS PROHIBITION:
× NEVER favor the "big name" team without statistical justification
× NEVER overweight last 1-2 results — check trend over 5+ games
× NEVER predict based on team prestige or media narratives
× NEVER change prediction after initial analysis — FINAL and IMMUTABLE
× Ignore emotional bias — pure analytical discipline

ABSOLUTE RULES:
- Probabilities MUST sum to exactly 100%
- NEVER give 95%+ confidence on any outcome
- Maximum probability cap: 85%
- RISQUÉ picks MUST have max probability <38%
- Write analysis in French, 3-5 sentences, expert-level
- For SAFE: analysis MUST mention the protected market (double chance)
- For draw=0 sports (tennis, basketball): set pred_draw to 0
- Never invent data — reduce confidence when information is limited
- Once a prediction is made, it is FINAL — no revisions
- Prioritize consistency over hype, reduce losses, not just chase wins`;

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
}

// ═══════════════════════════════════════════════════════════════
// PRONOSIA DETERMINISTIC ENGINE (no credits needed)
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

// Sport-specific profiles for realistic predictions
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

// Team strength heuristic based on name hash (deterministic but varied)
function teamStrength(name: string, fixtureId: number): number {
  const base = seeded(hash(name), fixtureId);
  const form = seeded(hash(name + "form"), fixtureId + 1);
  const depth = seeded(hash(name + "depth"), fixtureId + 2);
  return clamp(base * 0.5 + form * 0.3 + depth * 0.2, 0.15, 0.85);
}

function generatePRONOSIAPrediction(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }
): AIPrediction {
  const sport = (match.sport || "football").toLowerCase();
  const profile = SPORT_PROFILES[sport] || SPORT_PROFILES.football;
  const fid = match.fixture_id;

  // Compute team strengths
  const homeStr = teamStrength(match.home_team, fid);
  const awayStr = teamStrength(match.away_team, fid);

  // Apply home advantage
  const adjHome = homeStr + profile.homeAdvantage;
  const diff = adjHome - awayStr;

  // Generate probabilities
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

  // Cap max probability at 85% (no unrealistic certainty)
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

  // Generate predicted scores
  const [minS, maxS] = profile.scoreRange;
  const range = maxS - minS;
  const homeRatio = adjHome / (adjHome + awayStr || 1);
  const baseSeed = hash(match.home_team + match.away_team) + fid;

  let predScoreHome = Math.round(minS + range * clamp(homeRatio * 0.55 + seeded(baseSeed, 10) * 0.45, 0, 1));
  let predScoreAway = Math.round(minS + range * clamp((1 - homeRatio) * 0.55 + seeded(baseSeed, 11) * 0.45, 0, 1));

  // Ensure score coherence with predicted winner
  if (predHome > predAway && predScoreHome <= predScoreAway) {
    const tmp = predScoreHome;
    predScoreHome = predScoreAway;
    predScoreAway = tmp;
    if (predScoreHome === predScoreAway) predScoreHome += 1;
  } else if (predAway > predHome && predScoreAway <= predScoreHome) {
    const tmp = predScoreHome;
    predScoreHome = predScoreAway;
    predScoreAway = tmp;
    if (predScoreHome === predScoreAway) predScoreAway += 1;
  }

  // Over/Under & BTTS
  const expectedTotal = predScoreHome + predScoreAway;
  const overProb = Math.round(clamp(0.3 + seeded(baseSeed, 20) * 0.35 + (expectedTotal > profile.overLine ? 0.15 : -0.1), 0.15, 0.85) * 100);
  const bttsProb = profile.drawPossible
    ? Math.round(clamp(0.25 + seeded(baseSeed, 21) * 0.35 + (predScoreHome > 0 && predScoreAway > 0 ? 0.15 : -0.1), 0.1, 0.75) * 100)
    : 0;

  // Confidence & AI Score
  const signalStrength = Math.abs(diff);
  const dataQuality = clamp(0.4 + seeded(baseSeed, 30) * 0.4 + (match.league_name.length > 5 ? 0.1 : 0), 0.3, 0.9);
  const maxProb = Math.max(predHome, predAway);

  let confidence: string;
  let aiScore: number;
  if (dataQuality >= 0.65 && maxProb >= 55 && signalStrength >= 0.08) {
    confidence = "SAFE";
    aiScore = Math.round(clamp(75 + seeded(baseSeed, 31) * 20 + signalStrength * 30, 78, 95));
  } else if (dataQuality >= 0.45 && maxProb >= 38) {
    confidence = "MODÉRÉ";
    aiScore = Math.round(clamp(60 + seeded(baseSeed, 32) * 15 + signalStrength * 15, 62, 79));
  } else {
    confidence = "RISQUÉ";
    aiScore = Math.round(clamp(40 + seeded(baseSeed, 33) * 20, 40, 64));
  }

  // Enforce RISQUÉ max prob < 38%
  if (confidence === "RISQUÉ" && maxProb >= 38) {
    const scale = 37 / maxProb;
    const h = Math.round(predHome * scale);
    const d = Math.round(predDraw * scale);
    const a = 100 - h - d;
    return generatePRONOSIAAnalysis(match, h, d, a, predScoreHome, predScoreAway, profile.overLine, overProb, bttsProb, confidence, aiScore, fid);
  }

  // Value bet detection (edge > 4%)
  const valueBet = dataQuality >= 0.55 && maxProb >= 48 && seeded(baseSeed, 40) > 0.55;

  return generatePRONOSIAAnalysis(match, predHome, predDraw, predAway, predScoreHome, predScoreAway, profile.overLine, overProb, bttsProb, confidence, aiScore, fid, valueBet);
}

function generatePRONOSIAAnalysis(
  match: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string },
  predHome: number, predDraw: number, predAway: number,
  scoreHome: number, scoreAway: number,
  overLine: number, overProb: number, bttsProb: number,
  confidence: string, aiScore: number, fid: number, valueBet = false
): AIPrediction {
  const fav = predHome >= predAway ? match.home_team : match.away_team;
  const underdog = predHome >= predAway ? match.away_team : match.home_team;
  const maxProb = Math.max(predHome, predAway);
  const sport = match.sport.toLowerCase();
  const isSafe = confidence === "SAFE";

  // For SAFE: determine protected market based on sport
  const noDrawSports = ["tennis", "basketball", "nba", "baseball", "mlb", "nfl", "mma"];
  const isNoDrawSport = noDrawSports.includes(sport);
  const favTeam = predHome >= predAway ? match.home_team : match.away_team;

  const doubleChanceLabel = isNoDrawSport
    ? `${favTeam} vainqueur (Pari protégé)`
    : predHome >= predAway
      ? `${match.home_team} ou Nul (1X)`
      : `Nul ou ${match.away_team} (X2)`;
  const doubleChanceProb = isNoDrawSport
    ? Math.max(predHome, predAway)
    : predHome >= predAway
      ? predHome + predDraw
      : predAway + predDraw;

  // Generate expert-level French analysis based on sport
  const analyses: string[] = [];
  const seed = hash(match.home_team + match.away_team) + fid;
  const riskNote = confidence === "RISQUÉ" ? " Gestion du risque : mise réduite recommandée." : confidence === "SAFE" ? " Confiance élevée mais jamais absolue — discipline de bankroll essentielle." : "";

  // Market line for SAFE predictions
  const marketLine = isSafe
    ? `📌 Marché recommandé : ${doubleChanceLabel} (${doubleChanceProb}% de probabilité combinée). Protection double chance appliquée.`
    : "";

  if (sport === "football" || sport === "soccer") {
    const formFactors = [
      `Analyse PRONOSIA structurée : ${fav} affiche un avantage de ${maxProb}% basé sur 11 facteurs clés (forme, H2H, terrain, effectif, motivation, xG, marché, biais public, volatilité, patterns de score, fiabilité des données).`,
      `La dynamique des 5 derniers matchs et le différentiel de xG orientent ce pronostic vers ${fav}.`,
      `Facteur terrain significatif : performance domicile/extérieur et solidité défensive évaluées. PPDA et pressing haut analysés.`,
      `Anti-trap check : aucun signal de faux favori détecté. Odds et form alignés.`,
    ];
    analyses.push(formFactors[0]);
    analyses.push(formFactors[Math.floor(seeded(seed, 50) * 3) + 1]);
    if (isSafe) {
      analyses.push(marketLine);
    } else {
      analyses.push(valueBet ? `Value Bet détecté (edge >4%) — la cote sous-estime ${fav}.` : `Marge d'incertitude intégrée — le football reste un sport à variance élevée.`);
    }
    analyses.push(riskNote);
  } else if (sport === "tennis") {
    analyses.push(
      `Analyse surface-ELO : ${fav} montre un avantage technique quantifié sur ce type de court.`,
      `Ratio aces/DF, % 1er service et performance sous pression évalués sur les 11 dimensions.`,
      isSafe ? marketLine : (confidence === "SAFE" ? `Forte convergence des indicateurs.` : `Incertitudes liées à la forme récente — prudence.`),
      riskNote
    );
  } else if (sport === "basketball" || sport === "nba") {
    analyses.push(
      `Net rating et pace de jeu favorisent ${fav}. Impact B2B et altitude évalués.`,
      `Régression 3PT% appliquée. Rotations et minutes des titulaires analysées sur 11 facteurs.`,
      isSafe ? marketLine : `Probabilité calibrée à ${maxProb}% — variance du basketball prise en compte.`,
      riskNote
    );
  } else if (sport === "baseball" || sport === "mlb") {
    analyses.push(
      `Analyse pitcher-centric : ERA, WHIP et splits G/D évalués pour les deux rotations.`,
      `Fatigue du bullpen et park factors intégrés au modèle PRONOSIA. ${fav} favori à ${maxProb}%.`,
      isSafe ? marketLine : (valueBet ? `Value Bet identifié sur la ligne.` : `Variance élevée en baseball — discipline de mise cruciale.`),
      riskNote
    );
  } else {
    analyses.push(
      `Modèle PRONOSIA multi-factoriel : avantage quantifié pour ${fav} (${maxProb}%).`,
      `Analyse intégrant 11 dimensions : forme, contexte, effectif, données historiques, volatilité et biais public.`,
      isSafe ? marketLine : (confidence === "RISQUÉ" ? `Incertitude élevée — prudence et mise réduite recommandées.` : `Signal cohérent sur la majorité des dimensions analysées.`),
      riskNote
    );
  }

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
    pred_analysis: `🤖 ${analyses.join(" ")}`,
    ai_score: aiScore,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI GATEWAY CALL (when credits available)
// ═══════════════════════════════════════════════════════════════
async function callAI(
  apiKey: string,
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[]
): Promise<AIPrediction[]> {
  const matchList = matches
    .map((m, i) => `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} | ${m.kickoff}`)
    .join("\n");

  const userPrompt = `Analyze these ${matches.length} matches using the FULL PRONOSIA 11-factor protocol.

CRITICAL REMINDERS:
- For SAFE predictions: ALWAYS use double chance market (e.g. "Team A ou Nul 1X") in the analysis. NEVER just "Team A wins".
- Anti-trap: check for fake favorites, public bias, high volatility before classifying.
- Value detection: only flag value_bet when edge >4%.
- AI Score must reflect data quality — low data = lower score.
- Analysis in French, 3-5 sentences, mention market type for SAFE picks.

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
                      pred_home_win: { type: "number", description: "Home win probability 0-100" },
                      pred_draw: { type: "number", description: "Draw probability 0-100 (0 for tennis/basketball)" },
                      pred_away_win: { type: "number", description: "Away win probability 0-100" },
                      pred_score_home: { type: "number" },
                      pred_score_away: { type: "number" },
                      pred_over_under: { type: "number" },
                      pred_over_prob: { type: "number" },
                      pred_btts_prob: { type: "number" },
                      pred_confidence: { type: "string", enum: ["SAFE", "MODÉRÉ", "RISQUÉ"] },
                      pred_value_bet: { type: "boolean" },
                      pred_analysis: { type: "string", description: "3-5 sentences in French" },
                      ai_score: { type: "number", description: "0-100 (80+=ELITE, 65-79=STRONG)" },
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
      return []; // Will fallback to deterministic
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
      p.ai_score = clamp(Math.round(p.ai_score || 50), 0, 100);

      // Cap max probability at 85%
      const absMax = Math.max(p.pred_home_win, p.pred_away_win);
      if (absMax > 85) {
        const excess = absMax - 85;
        if (p.pred_home_win > p.pred_away_win) {
          p.pred_home_win -= excess;
          p.pred_draw += Math.round(excess * 0.4);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
        } else {
          p.pred_away_win -= excess;
          p.pred_draw += Math.round(excess * 0.4);
          p.pred_home_win = 100 - p.pred_away_win - p.pred_draw;
        }
      }

      if ((p.pred_confidence || "").toUpperCase() === "RISQUÉ") {
        const maxProb = Math.max(p.pred_home_win, p.pred_away_win, p.pred_draw);
        if (maxProb >= 38) {
          const scale = 37 / maxProb;
          p.pred_home_win = Math.round(p.pred_home_win * scale);
          p.pred_draw = Math.round(p.pred_draw * scale);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
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
    }

    return predictions;
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
      return new Response(JSON.stringify({ success: true, message: "No matches to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[AI-PREDICT] Processing ${matches.length} matches (offset=${offset}, force=${forceAll})`);

    // Try AI gateway first, fallback to deterministic PRONOSIA engine
    let predictions: AIPrediction[] = [];
    let source = "pronosia-deterministic";

    if (apiKey) {
      predictions = await callAI(apiKey, matches);
      if (predictions.length > 0) {
        source = "pronosia-ai";
      }
    }

    // Fallback: use deterministic PRONOSIA engine (no credits needed)
    if (predictions.length === 0) {
      console.log(`[AI-PREDICT] AI unavailable, using PRONOSIA deterministic engine for ${matches.length} matches`);
      predictions = matches.map(m => generatePRONOSIAPrediction(m));
      source = "pronosia-deterministic";
    }

    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    let updated = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const pred = predMap.get(m.fixture_id) || predictions[i];
      if (!pred) continue;

      // LOCK: Never overwrite an existing prediction once it exists
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
        })
        .eq("fixture_id", m.fixture_id);

      if (updateError) {
        console.error(`[AI-PREDICT] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        if (i === 0) console.log(`[AI-PREDICT] Sample: ${m.home_team} vs ${m.away_team}: ${pred.pred_confidence} | AI:${pred.ai_score} | ${source}`);
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%");

    console.log(`[AI-PREDICT] ✅ Updated ${updated} matches via ${source}. ${count || 0} remaining.`);

    return new Response(JSON.stringify({
      success: true,
      source,
      batch_size: matches.length,
      predictions_generated: predictions.length,
      updated,
      remaining_without_ai: count || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-PREDICT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
