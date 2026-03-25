import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const AI_SYSTEM_PROMPT = `You are an elite AI sports analyst. Deliver accurate, data-driven match predictions.

ANALYSIS FRAMEWORK — For every match, evaluate:
1. RECENT FORM: Last 5-10 matches, streaks, momentum
2. HEAD-TO-HEAD: H2H record, psychological dominance
3. HOME/AWAY DYNAMICS: Win rates, crowd influence
4. ADVANCED STATS: xG, possession, defensive solidity
5. SQUAD STATUS: Injuries, key player availability
6. MATCH CONTEXT: Competition stage, stakes
7. FATIGUE: Fixture congestion, rotation
8. BETTING MARKET SIGNALS: Odds movement, value

CONFIDENCE: SAFE (clear advantage, ≥7/10), MODÉRÉ (some uncertainty, 4-6/10), RISQUÉ (high uncertainty, ≤3/10)

RULES: Probabilities must sum to 100%. Be conservative. Write analysis in French.`;

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

async function callAI(apiKey: string, matches: { fixture_id: number; home_team: string; away_team: string; sport: string; league_name: string; kickoff: string }[]): Promise<AIPrediction[]> {
  const matchList = matches.map((m, i) =>
    `${i + 1}. [ID:${m.fixture_id}] ${m.home_team} vs ${m.away_team} | ${m.sport.toUpperCase()} | ${m.league_name} | ${m.kickoff}`
  ).join("\n");

  const userPrompt = `Analyze these ${matches.length} matches and provide predictions.

MATCHES:
${matchList}

For EACH match, call "predict_matches" with:
- fixture_id: the ID provided
- pred_home_win, pred_draw, pred_away_win: probabilities summing to 100 (draw=0 for tennis/basketball/MMA/baseball)
- pred_score_home, pred_score_away: predicted scores (integers)
- pred_over_under: over/under line (2.5 for football)
- pred_over_prob: over probability (0-100)
- pred_btts_prob: both teams to score probability (0-100, 0 for non-applicable)
- pred_confidence: "SAFE", "MODÉRÉ", or "RISQUÉ"
- pred_value_bet: boolean
- pred_analysis: 2-3 sentences in French`;

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

    // Normalize probabilities
    for (const p of predictions) {
      const total = p.pred_home_win + p.pred_draw + p.pred_away_win;
      if (Math.abs(total - 100) > 2) {
        p.pred_home_win = Math.round((p.pred_home_win / total) * 100);
        p.pred_draw = Math.round((p.pred_draw / total) * 100);
        p.pred_away_win = 100 - p.pred_home_win - p.pred_draw;
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional batch param (process a subset)
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Fetch matches that need AI predictions
    const { data: matches, error } = await supabase
      .from("cached_matches")
      .select("fixture_id, home_team, away_team, sport, league_name, kickoff, pred_analysis")
      .order("kickoff", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No matches to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[AI-PREDICT] Processing batch of ${matches.length} matches (offset=${offset})`);

    // Call AI
    const predictions = await callAI(apiKey, matches);
    console.log(`[AI-PREDICT] Got ${predictions.length}/${matches.length} AI predictions`);

    // Map AI predictions by fixture_id, with fallback mapping by index
    const predMap = new Map<number, AIPrediction>();
    for (const p of predictions) predMap.set(p.fixture_id, p);

    // Update each match — try matching by fixture_id first, then by index
    let updated = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const pred = predMap.get(m.fixture_id) || predictions[i];
      if (!pred) continue;

      const updateData = {
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
      };

      const { error: updateError, count } = await supabase
        .from("cached_matches")
        .update(updateData)
        .eq("fixture_id", m.fixture_id);

      if (updateError) {
        console.error(`[AI-PREDICT] Update error for fixture ${m.fixture_id}:`, JSON.stringify(updateError));
      } else {
        updated++;
        if (i === 0) console.log(`[AI-PREDICT] Sample update for ${m.home_team} vs ${m.away_team}: confidence=${pred.pred_confidence}`);
      }
    }

    // Count total remaining
    const { count } = await supabase
      .from("cached_matches")
      .select("fixture_id", { count: "exact", head: true })
      .not("pred_analysis", "like", "🤖%");

    console.log(`[AI-PREDICT] Updated ${updated} matches. ${count || 0} still need AI.`);

    return new Response(JSON.stringify({
      success: true,
      batch_size: matches.length,
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
