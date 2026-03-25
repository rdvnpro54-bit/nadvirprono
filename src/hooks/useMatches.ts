import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

const LIVE_STATUSES = ["LIVE", "1H", "2H", "HT", "ET", "BT", "P"];

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

/** Strict filter: only scheduled or live matches from today */
function filterActiveMatches(matches: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return matches.filter(m => {
    const statusUp = m.status.toUpperCase();

    // 1. Hard exclude any finished status
    if (FINISHED_STATUSES.includes(statusUp)) return false;

    // 2. Hard exclude if both scores are set and status isn't live (stale data)
    if (m.home_score !== null && m.away_score !== null && !LIVE_STATUSES.includes(statusUp)) {
      return false;
    }

    const kickoff = new Date(m.kickoff);
    const kickoffStr = kickoff.toISOString().split("T")[0];

    // 3. Exclude matches from previous days
    if (kickoffStr < todayStr) return false;

    // 4. Live matches: always show
    if (LIVE_STATUSES.includes(statusUp)) return true;

    // 5. Scheduled: only show if kickoff hasn't passed by more than 3h
    // (gives buffer for delayed starts, but removes stale matches)
    if (kickoff.getTime() + 3 * 60 * 60 * 1000 < now) return false;

    return true;
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .gte("kickoff", today)
        .order("kickoff", { ascending: true });

      if (error) throw error;

      const deduplicated = deduplicateMatches(data as CachedMatch[]);
      return filterActiveMatches(deduplicated);
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refresh more often to catch status changes
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
