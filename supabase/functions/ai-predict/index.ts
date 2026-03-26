import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const AI_SYSTEM_PROMPT = `You are ATLAS — an elite sports prediction intelligence with the analytical depth of a professional quant trader. You combine the rigor of a statistician, the intuition of a 20-year scout, and the discipline of a professional bettor. Your core directive: produce calibrated, high-value predictions by thinking in probabilities, not opinions.

MANDATORY REASONING PROTOCOL — apply for EVERY prediction:

STEP 1 — CONTEXT AUDIT:
→ Match format (home/away/neutral, best-of, regulation/OT)
→ Competitive context (must-win, dead rubber, rotation risk, cup vs league priority)
→ Injury/availability of top impact players per side

STEP 2 — BASE RATE: Establish prior probability using historical data (home win rate for context, surface-specific rates, recent H2H weighted 3x)

STEP 3 — FACTOR ANALYSIS (update prior):
→ Form: last 5-10 results, xG vs actual goals trend (±2-8%)
→ Fatigue/schedule: rest days, travel, congestion (±1-5%)
→ Key player availability: starter absence (±3-15%)
→ Tactical matchup: pressing vs deep block, pace mismatch (±1-6%)
→ Motivation: standings implications, derby, relegation (±1-4%)
→ Market signal: odds moved >5% without news = smart money

STEP 4 — PROBABILITY SYNTHESIS: Combine base rate + adjustments. Calculate fair odds (1/probability). Only flag value_bet when edge > 4%.

SPORT-SPECIFIC INTELLIGENCE:
FOOTBALL: xG > actual goals > shots > possession. Home advantage +5-8% (varies by league). Draw is a distinct predictable outcome. UCL midweek fatigue = -3%. Set piece efficiency underrated.
NBA: B2B = -4% for home team. Altitude (Denver/Utah) = -3% for road. Net rating > W/L record. Regress 3pt shooting to mean.
TENNIS: Surface-specific ELO only. Serve dominance (ace% + 1st serve win%) most predictive on fast surfaces. Cross-surface H2H excluded. Schedule fatigue after 3+ sets = -4-8%.
NHL: Goalie = highest-impact variable. PDO > 1.020 = regression due. Corsi% best leading indicator. 3-in-4 nights = backup goalie.
NFL: Line movement is extremely sharp. Wind >15mph = favor run/unders. Divisional games 3-6% tighter. QB efficiency (EPA/play) trumps all.

COGNITIVE BIAS PROHIBITION:
× Never overweight last 1-2 results (check xG trend)
× Never predict based on team prestige
× Ignore media narratives without statistical backing
× Markets overvalue favorites — find where market is wrong
× After forming hypothesis, actively seek contradicting data

CONFIDENCE MAPPING:
- SAFE: ≥8/10 signals aligned, high data quality, max probability ≥55%
- MODÉRÉ: 4-7/10 aligned, moderate uncertainty, max probability 35-55%
- RISQUÉ: High uncertainty, ≤3/10 aligned, max probability MUST be <35%

AI SCORE (0-100): 80-100=ELITE, 65-79=STRONG, <65=AVERAGE

CRITICAL RULES:
- Probabilities MUST sum to exactly 100%
- RISQUÉ picks MUST have max probability <35%
- Write analysis in French, 3-5 sentences, substantive
- For draw=0 sports (tennis, basketball): set pred_draw to 0
- Never invent data — state when information is limited
- Calibration over conviction: 70% probability means wrong 30% of the time`;

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

async function callAI(
  apiKey: string,
  matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[]
): Promise<AIPrediction[]> {
  const matchList = matches
    .map((m, i) => `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} | ${m.kickoff}`)
    .join("\n");

  const userPrompt = `Analyze these ${matches.length} matches using the FULL 11-dimension framework.

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
                      pred_draw: { type: "number", description: "Draw probability 0-100 (0 for tennis/basketball/MMA)" },
                      pred_away_win: { type: "number", description: "Away win probability 0-100" },
                      pred_score_home: { type: "number" },
                      pred_score_away: { type: "number" },
                      pred_over_under: { type: "number", description: "Over/under line (2.5 for football)" },
                      pred_over_prob: { type: "number", description: "Over probability 0-100" },
                      pred_btts_prob: { type: "number", description: "BTTS probability 0-100" },
                      pred_confidence: { type: "string", enum: ["SAFE", "MODÉRÉ", "RISQUÉ"] },
                      pred_value_bet: { type: "boolean" },
                      pred_analysis: { type: "string", description: "2-4 sentences in French covering key factors and uncertainty" },
                      ai_score: { type: "number", description: "AI quality score 0-100 (80+=ELITE, 65-79=STRONG, <65=AVERAGE)" },
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
      console.error("[AI] No tool call in response:", JSON.stringify(result).slice(0, 500));
      return [];
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const predictions = parsed.predictions as AIPrediction[];

    // Normalize probabilities & clamp ai_score & fix score/winner coherence
    for (const p of predictions) {
      const total = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(total - 100) > 2) {
        p.pred_home_win = Math.round((p.pred_home_win / total) * 100);
        p.pred_draw = Math.round((p.pred_draw / total) * 100);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
      }
      p.ai_score = Math.max(0, Math.min(100, Math.round(p.ai_score || 50)));

      // Enforce RISQUÉ credibility: max prob must be < 35%
      const conf = (p.pred_confidence || "").toUpperCase();
      if (conf === "RISQUÉ") {
        const maxProb = Math.max(p.pred_home_win, p.pred_away_win, p.pred_draw);
        if (maxProb >= 35) {
          const scale = 34 / maxProb;
          p.pred_home_win = Math.round(p.pred_home_win * scale);
          p.pred_draw = Math.round(p.pred_draw * scale);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
        }
      }

      // FIX: Ensure predicted score is coherent with predicted winner
      // If home_win > away_win, home score must be > away score (and vice versa)
      const homeWins = p.pred_home_win > p.pred_away_win;
      const scoreHomeHigher = p.pred_score_home > p.pred_score_away;
      if (homeWins && !scoreHomeHigher) {
        // Swap scores so home score > away score
        const tmp = p.pred_score_home;
        p.pred_score_home = p.pred_score_away;
        p.pred_score_away = tmp;
        // If still equal, bump winner score
        if (p.pred_score_home === p.pred_score_away) {
          p.pred_score_home += 1;
        }
      } else if (!homeWins && scoreHomeHigher && p.pred_away_win > p.pred_home_win) {
        // Away is predicted winner but home score is higher — swap
        const tmp = p.pred_score_home;
        p.pred_score_home = p.pred_score_away;
        p.pred_score_away = tmp;
        if (p.pred_score_home === p.pred_score_away) {
          p.pred_score_away += 1;
        }
      }
    }

    return predictions;
  } catch (e) {
    clearTimeout(timeout);
    console.error("[AI] Error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Fetch matches needing AI — prioritize those without AI analysis
    const { data: matches, error } = await supabase
      .from("cached_matches")
      .select("fixture_id, home_team, away_team, sport, league_name, kickoff, pred_analysis, ai_score")
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%")
      .order("kickoff", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    // If no unprocessed matches, check if force-all param is set
    const forceAll = url.searchParams.get("force") === "true";
    let toProcess = matches;

    if ((!matches || matches.length === 0) && forceAll) {
      const { data: allMatches, error: allErr } = await supabase
        .from("cached_matches")
        .select("fixture_id, home_team, away_team, sport, league_name, kickoff, pred_analysis, ai_score")
        .order("kickoff", { ascending: true })
        .range(offset, offset + batchSize - 1);
      if (allErr) throw allErr;
      toProcess = allMatches;
    }

    if (!toProcess || toProcess.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "All matches have AI predictions", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[AI-PREDICT] Processing batch of ${toProcess.length} matches (offset=${offset})`);

    const predictions = await callAI(apiKey, toProcess);
    console.log(`[AI-PREDICT] Got ${predictions.length}/${toProcess.length} AI predictions`);

    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    let updated = 0;
    for (let i = 0; i < toProcess.length; i++) {
      const m = toProcess[i];
      const pred = predMap.get(m.fixture_id) || predictions[i];
      if (!pred) continue;

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
          pred_analysis: `🤖 ${pred.pred_analysis}`,
          ai_score: pred.ai_score,
        })
        .eq("fixture_id", m.fixture_id);

      if (updateError) {
        console.error(`[AI-PREDICT] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        if (i === 0) console.log(`[AI-PREDICT] Sample: ${m.home_team} vs ${m.away_team}: confidence=${pred.pred_confidence}, aiScore=${pred.ai_score}`);
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .or("pred_analysis.is.null,ai_score.eq.0,pred_analysis.not.like.🤖%");

    console.log(`[AI-PREDICT] Updated ${updated} matches. ${count || 0} still need AI.`);

    return new Response(JSON.stringify({
      success: true,
      batch_size: toProcess.length,
      ai_generated: predictions.length,
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
