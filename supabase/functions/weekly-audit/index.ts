import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Fetch last 7 days of resolved results
    const { data: results, error } = await supabase
      .from("match_results")
      .select("*")
      .not("result", "is", null)
      .gte("kickoff", weekStart.toISOString())
      .lte("kickoff", weekEnd.toISOString());

    if (error) throw error;

    const allResults = results || [];
    const wins = allResults.filter((r: any) => r.result === "win").length;
    const losses = allResults.filter((r: any) => r.result === "loss").length;
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

    // Calculate ROI (assuming flat 10€ stakes, avg odds 1.85)
    const avgOdds = 1.85;
    const revenue = wins * 10 * avgOdds;
    const cost = total * 10;
    const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;

    // Aggregate by sport/league
    const leagueStats: Record<string, { wins: number; losses: number; total: number }> = {};
    const sportStats: Record<string, { wins: number; losses: number; total: number }> = {};
    const betTypeStats: Record<string, { wins: number; losses: number }> = {};

    for (const r of allResults) {
      const league = r.league_name || "Unknown";
      const sport = r.sport || "football";
      const conf = r.predicted_confidence || "MODÉRÉ";

      if (!leagueStats[league]) leagueStats[league] = { wins: 0, losses: 0, total: 0 };
      leagueStats[league].total++;
      if (r.result === "win") leagueStats[league].wins++;
      else leagueStats[league].losses++;

      if (!sportStats[sport]) sportStats[sport] = { wins: 0, losses: 0, total: 0 };
      sportStats[sport].total++;
      if (r.result === "win") sportStats[sport].wins++;
      else sportStats[sport].losses++;

      if (!betTypeStats[conf]) betTypeStats[conf] = { wins: 0, losses: 0 };
      if (r.result === "win") betTypeStats[conf].wins++;
      else betTypeStats[conf].losses++;
    }

    // Find best/worst leagues
    let bestLeague = null;
    let worstLeague = null;
    let bestWinrate = -1;
    let worstWinrate = 101;

    for (const [league, stats] of Object.entries(leagueStats)) {
      if (stats.total < 2) continue;
      const wr = Math.round((stats.wins / stats.total) * 100);
      if (wr > bestWinrate) { bestWinrate = wr; bestLeague = league; }
      if (wr < worstWinrate) { worstWinrate = wr; worstLeague = league; }
    }

    // Find best bet type
    let bestBetType = null;
    let bestBetWinrate = -1;
    for (const [bt, stats] of Object.entries(betTypeStats)) {
      const t = stats.wins + stats.losses;
      if (t < 2) continue;
      const wr = Math.round((stats.wins / t) * 100);
      if (wr > bestBetWinrate) { bestBetWinrate = wr; bestBetType = bt; }
    }

    // B3: Auto-blacklist leagues with winrate < 40% over recent history
    const { data: leaguePerf } = await supabase
      .from("league_performance")
      .select("*");

    const existingPerf = new Map((leaguePerf || []).map((lp: any) => [lp.league_name, lp]));

    // Update league_performance
    for (const [league, stats] of Object.entries(leagueStats)) {
      const existing = existingPerf.get(league);
      const totalPicks = (existing?.total_picks || 0) + stats.total;
      const totalWins = (existing?.wins || 0) + stats.wins;
      const totalLosses = (existing?.losses || 0) + stats.losses;
      const wr = totalPicks > 0 ? Math.round((totalWins / totalPicks) * 100) : 0;
      const leagueRoi = totalPicks > 0 ? Math.round(((totalWins * 10 * avgOdds - totalPicks * 10) / (totalPicks * 10)) * 100) : 0;

      const thisWeekWinrate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 50;
      const consecutiveBad = thisWeekWinrate < 40
        ? (existing?.consecutive_bad_weeks || 0) + 1
        : 0;

      // Auto-blacklist if 3+ consecutive bad weeks
      const shouldBlacklist = consecutiveBad >= 3 && totalPicks >= 6;
      const blacklistExpiry = new Date();
      blacklistExpiry.setDate(blacklistExpiry.getDate() + 14);

      const sport = allResults.find((r: any) => r.league_name === league)?.sport || "football";

      await supabase
        .from("league_performance")
        .upsert({
          sport,
          league_name: league,
          total_picks: totalPicks,
          wins: totalWins,
          losses: totalLosses,
          winrate: wr,
          roi: leagueRoi,
          is_blacklisted: shouldBlacklist || (existing?.is_blacklisted && existing?.blacklist_expires_at && new Date(existing.blacklist_expires_at) > new Date()),
          blacklisted_at: shouldBlacklist ? new Date().toISOString() : existing?.blacklisted_at,
          blacklist_expires_at: shouldBlacklist ? blacklistExpiry.toISOString() : existing?.blacklist_expires_at,
          blacklist_reason: shouldBlacklist ? `Winrate <40% pendant ${consecutiveBad} semaines consécutives` : existing?.blacklist_reason,
          consecutive_bad_weeks: consecutiveBad,
          updated_at: new Date().toISOString(),
        }, { onConflict: "sport,league_name" });
    }

    // Save weekly report
    const reportData = {
      by_league: leagueStats,
      by_sport: sportStats,
      by_bet_type: betTypeStats,
      best_league_winrate: bestWinrate,
      worst_league_winrate: worstWinrate,
    };

    await supabase.from("weekly_reports").insert({
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      total_picks: total,
      wins,
      losses,
      winrate,
      roi,
      best_league: bestLeague,
      worst_league: worstLeague,
      best_bet_type: bestBetType,
      report_data: reportData,
    });

    // Update ai_learning_stats with new data
    try {
      const { data: learnerResult } = await supabase.functions.invoke("prediction-learner");
      console.log("[WEEKLY-AUDIT] Prediction learner result:", learnerResult);
    } catch (e) {
      console.log("[WEEKLY-AUDIT] Could not run prediction-learner:", e);
    }

    // Log audit
    await supabase.from("admin_logs").insert({
      admin_email: "system-audit",
      action: "weekly-audit",
      details: {
        week: `${weekStart.toISOString().split("T")[0]} → ${weekEnd.toISOString().split("T")[0]}`,
        total, wins, losses, winrate, roi,
        best_league: bestLeague, worst_league: worstLeague,
        leagues_blacklisted: Object.entries(leagueStats)
          .filter(([_, s]) => s.total >= 6 && Math.round((s.wins / s.total) * 100) < 40)
          .map(([l]) => l),
      },
    });

    console.log(`[WEEKLY-AUDIT] ✅ Report: ${total} picks, ${winrate}% winrate, ROI ${roi}%, best=${bestLeague}, worst=${worstLeague}`);

    return new Response(JSON.stringify({
      success: true,
      week: `${weekStart.toISOString().split("T")[0]} → ${weekEnd.toISOString().split("T")[0]}`,
      total_picks: total,
      wins,
      losses,
      winrate,
      roi,
      best_league: bestLeague,
      worst_league: worstLeague,
      best_bet_type: bestBetType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[WEEKLY-AUDIT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
