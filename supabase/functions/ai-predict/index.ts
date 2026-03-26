import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const AI_SYSTEM_PROMPT = `You are an elite AI sports analyst combining deep statistical modeling, predictive analytics, and contextual intelligence. Your sole purpose is to deliver the most accurate, data-driven match predictions possible.

MANDATORY ANALYSIS FRAMEWORK — For every match, you MUST evaluate ALL 11 dimensions:

1. RECENT FORM: Last 5-10 matches, win/loss/draw streaks, momentum trajectory, performance quality beyond raw results
2. HEAD-TO-HEAD: All-time and recent H2H record, psychological dominance, venue-specific H2H splits, historical scorelines
3. HOME/AWAY DYNAMICS: Home/away win rates, points per game, crowd influence, fortress mentality, away form under pressure
4. LOCATION & TRAVEL: Stadium, country/continent travel fatigue, altitude, pitch surface
5. ADVANCED STATS: xG for/against, shots on target, possession %, press intensity (PPDA), defensive solidity, set-piece threat
6. SQUAD STATUS: Injuries, suspensions, key player availability, likely XI vs rotated lineup, depth quality
7. MATCH CONTEXT: Competition stage, league position implications, cup priority, rivalry intensity
8. FATIGUE & CONGESTION: Days since last match, matches in last 30 days, rotation likelihood, player minutes load
9. EXTERNAL CONDITIONS: Weather, pitch condition, kick-off time effects
10. BETTING MARKET SIGNALS: Odds movement, sharp money, market consensus vs model, value identification
11. INTERNAL MODEL: Synthesize all dimensions into calibrated probabilities

CONFIDENCE MAPPING:
- SAFE: Clear statistical advantage, high data coherence, ≥7/10
- MODÉRÉ: Some uncertainty, mixed signals, 4-6/10
- RISQUÉ: High uncertainty, conflicting data, ≤3/10

AI SCORE (0-100): Measures prediction quality and reliability
- 80-100 = ELITE (exceptional data alignment, clear dominance)
- 65-79 = STRONG (good signals, moderate uncertainty)
- 0-64 = AVERAGE (limited data, high uncertainty)

RULES:
- Probabilities MUST sum to 100%
- Be conservative — never guarantee outcomes
- Flag uncertainty explicitly
- Write analysis in French
- Never invent data — state when information is limited
- For draw=0 sports (tennis, basketball, MMA, baseball): set pred_draw to 0`;

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

    // Normalize probabilities & clamp ai_score
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
          // Rebalance to keep max under 35 while summing to 100
          const scale = 34 / maxProb;
          p.pred_home_win = Math.round(p.pred_home_win * scale);
          p.pred_draw = Math.round(p.pred_draw * scale);
          p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
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
