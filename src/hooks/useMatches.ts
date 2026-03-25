import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

const FINISHED_STATUSES = ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "INT", "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED"];

/** Deduplicate by fixture_id, keeping the most recent entry */
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

/** Filter out finished matches and past non-live matches */
function filterActiveMatches(matches: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  const LIVE_TOLERANCE = 4 * 60 * 60 * 1000; // 4h for long matches

  return matches.filter(m => {
    // Exclude finished statuses
    if (FINISHED_STATUSES.includes(m.status.toUpperCase())) return false;

    const kickoff = new Date(m.kickoff).getTime();

    // Live matches: always show
    if (["LIVE", "1H", "2H", "HT", "ET", "BT", "P"].includes(m.status.toUpperCase())) {
      return true;
    }

    // Scheduled: only show if kickoff hasn't passed too long ago
    if (kickoff + LIVE_TOLERANCE < now) return false;

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
        .gte("kickoff", new Date().toISOString().split("T")[0])
        .order("kickoff", { ascending: true });

      if (error) throw error;

      const deduplicated = deduplicateMatches(data as CachedMatch[]);
      return filterActiveMatches(deduplicated);
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
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
      const { data, error } = await supabase.functions.invoke("fetch-matches");
      if (error) throw error;
      return data;
    },
    staleTime: 14 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}
