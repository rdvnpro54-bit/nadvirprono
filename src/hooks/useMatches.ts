import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

function filterActiveMatches(matches: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  return matches.filter(m => {
    const statusUp = m.status.toUpperCase();
    if (FINISHED_STATUSES.includes(statusUp)) return false;
    if (m.home_score !== null && m.away_score !== null) return false;
    const kickoff = new Date(m.kickoff).getTime();
    // Allow matches up to 48h in the future (tomorrow's matches included)
    if (kickoff + 3 * 60 * 60 * 1000 < now) return false;
    if (kickoff > now + 48 * 60 * 60 * 1000) return false;
    return true;
  });
}

function deduplicateMatches(matches: CachedMatch[]): CachedMatch[] {
  const map = new Map<number, CachedMatch>();
  for (const m of matches) {
    const existing = map.get(m.fixture_id);
    if (!existing || new Date(m.fetched_at) > new Date(existing.fetched_at)) {
      map.set(m.fixture_id, m);
    }
  }
  return Array.from(map.values());
}

function deduplicateByTeams(matches: CachedMatch[]): CachedMatch[] {
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = `${m.home_team.toLowerCase()}_${m.away_team.toLowerCase()}_${m.kickoff}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .order("kickoff", { ascending: true });

      if (error) throw error;

      let result = deduplicateMatches(data as CachedMatch[]);
      result = deduplicateByTeams(result);
      result = filterActiveMatches(result);

      console.log(`[useMatches] ${data?.length} raw → ${result.length} after dedup+filter`);
      return result;
    },
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["cached-match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as CachedMatch;
    },
  });
}

// No more useTriggerFetch - pg_cron handles it autonomously every 5 min
// Frontend only reads from cached_matches, never triggers fetch-matches
export function useTriggerFetch() {
  return useQuery({
    queryKey: ["trigger-fetch"],
    queryFn: async () => null,
    staleTime: Infinity,
    enabled: false,
  });
}
