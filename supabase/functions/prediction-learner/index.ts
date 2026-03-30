import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResultRow {
  sport: string;
  league_name: string;
  predicted_confidence: string;
  predicted_winner: string;
  home_team: string;
  away_team: string;
  pred_home_win: number;
  pred_away_win: number;
  result: string;
  actual_home_score: number | null;
  actual_away_score: number | null;
  bet_type: string | null;
  kickoff: string;
}

interface StatsAccum {
  total: number;
  wins: number;
  losses: number;
  sumPredictedProb: number;
  sumProfit: number;
  lossPatterns: Map<string, number>;
}

const FIXED_STAKE = 10;

function estimateOdds(probability: number): number {
  if (probability <= 0) return 2.0;
  const raw = 100 / probability;
  return Math.round(Math.max(raw * 0.92, 1.1) * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data: results, error } = await supabase
      .from("match_results")
      .select("sport, league_name, predicted_confidence, predicted_winner, home_team, away_team, pred_home_win, pred_away_win, result, actual_home_score, actual_away_score, bet_type, kickoff")
      .not("result", "is", null);

    if (error) throw error;
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No results to learn from", stats: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statsMap = new Map<string, StatsAccum>();

    function getKey(sport: string, league: string, conf: string, betType: string): string {
      return `${sport}||${league}||${conf}||${betType}`;
    }

    function addResult(key: string, r: ResultRow) {
      if (!statsMap.has(key)) {
        statsMap.set(key, { total: 0, wins: 0, losses: 0, sumPredictedProb: 0, sumProfit: 0, lossPatterns: new Map() });
      }
      const s = statsMap.get(key)!;
      const maxProb = Math.max(Number(r.pred_home_win), Number(r.pred_away_win));
      s.total++;
      s.sumPredictedProb += maxProb;

      if (r.result === "win") {
        s.wins++;
        const odds = estimateOdds(maxProb);
        s.sumProfit += FIXED_STAKE * odds - FIXED_STAKE;
      } else if (r.result === "loss") {
        s.losses++;
        s.sumProfit -= FIXED_STAKE;
        // Detect loss patterns
        const wasFavorite = maxProb >= 60;
        const wasUpset = wasFavorite && r.result === "loss";
        const pattern = wasUpset ? "upset_favorite" : maxProb < 45 ? "low_confidence_loss" : "normal_loss";
        s.lossPatterns.set(pattern, (s.lossPatterns.get(pattern) || 0) + 1);
      }
    }

    for (const r of results as ResultRow[]) {
      if (r.result !== "win" && r.result !== "loss") continue;
      const sport = (r.sport || "football").toLowerCase();
      const conf = r.predicted_confidence || "MODÉRÉ";
      const betType = r.bet_type || "winner";

      // By sport + confidence (global)
      addResult(getKey(sport, "_all", conf, "_all"), r);

      // By sport + league + confidence (specific)
      if (r.league_name) {
        addResult(getKey(sport, r.league_name, conf, "_all"), r);
      }

      // By sport + bet_type (global)
      addResult(getKey(sport, "_all", "_all", betType), r);

      // By sport + league + bet_type
      if (r.league_name) {
        addResult(getKey(sport, r.league_name, "_all", betType), r);
      }
    }

    const rows: any[] = [];
    for (const [key, s] of statsMap) {
      const [sport, league, confidence, betType] = key.split("||");
      if (s.total < 3) continue;

      const winrate = Math.round((s.wins / s.total) * 100);
      const avgPredProb = Math.round(s.sumPredictedProb / s.total);
      const calibrationError = Math.abs(avgPredProb - winrate);
      const roi = s.total > 0 ? Math.round((s.sumProfit / (s.total * FIXED_STAKE)) * 100) : 0;

      let topPattern = null;
      let topCount = 0;
      for (const [p, c] of s.lossPatterns) {
        if (c > topCount) { topPattern = p; topCount = c; }
      }

      rows.push({
        sport,
        league_name: league,
        confidence_level: confidence === "_all" ? "ALL" : confidence,
        bet_type: betType === "_all" ? null : betType,
        total_predictions: s.total,
        wins: s.wins,
        losses: s.losses,
        winrate,
        avg_predicted_prob: avgPredProb,
        avg_actual_winrate: winrate,
        calibration_error: calibrationError,
        common_loss_pattern: topPattern,
        roi,
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("ai_learning_stats")
        .upsert(rows, { onConflict: "sport,league_name,confidence_level" });

      if (upsertError) {
        console.error("[LEARNER] Upsert error:", JSON.stringify(upsertError));
        throw upsertError;
      }
    }

    console.log(`[LEARNER] ✅ Computed ${rows.length} learning stat entries from ${results.length} results`);

    return new Response(JSON.stringify({
      success: true,
      results_analyzed: results.length,
      stats_computed: rows.length,
      sample: rows.slice(0, 5),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[LEARNER] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
