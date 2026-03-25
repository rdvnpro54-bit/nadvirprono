import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

/** Only keep future, unfinished matches */
function filterActiveMatches(matches: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  return matches.filter(m => {
    const statusUp = m.status.toUpperCase();
    if (FINISHED_STATUSES.includes(statusUp)) return false;
    if (m.home_score !== null && m.away_score !== null) return false;
    const kickoff = new Date(m.kickoff).getTime();
    if (kickoff + 3 * 60 * 60 * 1000 < now) return false;
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

export function useMatches() {
  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .order("kickoff", { ascending: true });

      if (error) throw error;

      const deduplicated = deduplicateMatches(data as CachedMatch[]);
      return filterActiveMatches(deduplicated);
    },
    staleTime: 60_000,         // 1 min stale
    refetchInterval: 120_000,  // refresh every 2 min
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

export function useTriggerFetch() {
  return useQuery({
    queryKey: ["trigger-fetch"],
    queryFn: async () => {
      if (typeof document !== "undefined" && document.hidden) return null;
      const { data, error } = await supabase.functions.invoke("fetch-matches");
      if (error) throw error;
      return data;
    },
    staleTime: 55_000,        // ~1 min
    refetchInterval: 60_000,  // re-fetch API every 60s
  });
}
