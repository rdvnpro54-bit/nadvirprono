import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MatchResult {
  id: string;
  fixture_id: number;
  sport: string;
  home_team: string;
  away_team: string;
  league_name: string;
  kickoff: string;
  predicted_winner: string;
  predicted_confidence: string;
  pred_home_win: number;
  pred_away_win: number;
  actual_home_score: number | null;
  actual_away_score: number | null;
  result: string | null;
  resolved_at: string | null;
  created_at: string;
}

const FIXED_STAKE = 10; // 10€ per bet

/** Estimate odds from prediction probability */
function estimateOdds(probability: number): number {
  if (probability <= 0) return 2.0;
  const raw = 100 / probability;
  // Bookmaker margin ~8%
  return Math.round(Math.max(raw * 0.92, 1.1) * 100) / 100;
}

export interface ResultStats {
  wins: number;
  losses: number;
  total: number;
  winrate: number;
  totalStaked: number;
  totalReturns: number;
  profit: number;
  roi: number;
}

function computeStats(results: MatchResult[]): ResultStats {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const wins = resolved.filter(r => r.result === "win").length;
  const losses = resolved.filter(r => r.result === "loss").length;
  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

  let totalStaked = 0;
  let totalReturns = 0;

  for (const r of resolved) {
    totalStaked += FIXED_STAKE;
    if (r.result === "win") {
      const winProb = Math.max(r.pred_home_win, r.pred_away_win);
      const odds = estimateOdds(winProb);
      totalReturns += FIXED_STAKE * odds;
    }
  }

  const profit = Math.round((totalReturns - totalStaked) * 100) / 100;
  const roi = totalStaked > 0 ? Math.round((profit / totalStaked) * 100) : 0;

  return { wins, losses, total, winrate, totalStaked, totalReturns: Math.round(totalReturns * 100) / 100, profit, roi };
}

/** All results */
export function useAllResults() {
  return useQuery({
    queryKey: ["all-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_results")
        .select("*")
        .not("result", "is", null)
        .order("kickoff", { ascending: false });
      if (error) throw error;
      return data as MatchResult[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Computed stats split by category */
export function useResultStats() {
  const { data: results, ...rest } = useAllResults();

  const allStats = results ? computeStats(results) : null;
  const topPickStats = results
    ? computeStats(results.filter(r => r.predicted_confidence === "SAFE"))
    : null;
  const monthResults = results
    ? results.filter(r => {
        const d = new Date(r.kickoff);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
    : null;
  const monthStats = monthResults ? computeStats(monthResults) : null;

  return { allStats, topPickStats, monthStats, results, ...rest };
}

/** Weekly stats for homepage */
export function useWeeklyResultStats() {
  return useQuery({
    queryKey: ["weekly-result-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("match_results")
        .select("*")
        .not("result", "is", null)
        .gte("kickoff", sevenDaysAgo.toISOString())
        .order("kickoff", { ascending: false });
      if (error) throw error;

      const results = data as MatchResult[];
      return computeStats(results);
    },
    staleTime: 5 * 60_000,
  });
}
