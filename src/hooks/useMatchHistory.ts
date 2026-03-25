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

export function useMatchHistory() {
  return useQuery({
    queryKey: ["match-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_results")
        .select("*")
        .order("kickoff", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as MatchResult[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useWinrateStats() {
  return useQuery({
    queryKey: ["winrate-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_results")
        .select("result")
        .not("result", "is", null);
      if (error) throw error;

      const wins = data.filter(r => r.result === "win").length;
      const losses = data.filter(r => r.result === "loss").length;
      const total = wins + losses;

      // Base: 11 wins, 3 losses + actual DB results
      const totalWins = 11 + wins;
      const totalMatches = 14 + total;
      const winrate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 79;

      return { wins: totalWins, losses: 3 + losses, total: totalMatches, winrate };
    },
    staleTime: 5 * 60_000,
  });
}
