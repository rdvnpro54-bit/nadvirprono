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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export function useMatches() {
  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-matches", {
        headers: await getAuthHeaders(),
      });

      if (error) throw error;

      const matches = data as CachedMatch[];
      let result = deduplicateMatches(matches);
      result = deduplicateByTeams(result);
      result = filterActiveMatches(result);

      console.log(`[useMatches] ${matches?.length} raw → ${result.length} after dedup+filter`);
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
      const { data, error } = await supabase.functions.invoke("get-matches", {
        headers: await getAuthHeaders(),
        body: null,
      });

      if (error) throw error;

      // The edge function supports ?id= but functions.invoke doesn't support query params easily
      // So we fetch all and filter client-side, or use a different approach
      // Let's call with the URL directly
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authHeaders = await getAuthHeaders();

      const response = await fetch(`${supabaseUrl}/functions/v1/get-matches?id=${id}`, {
        headers: {
          "apikey": anonKey,
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (!response.ok) throw new Error("Match not found");
      return (await response.json()) as CachedMatch;
    },
    enabled: !!id,
  });
}

// No more useTriggerFetch - pg_cron handles it autonomously
export function useTriggerFetch() {
  return useQuery({
    queryKey: ["trigger-fetch"],
    queryFn: async () => null,
    staleTime: Infinity,
    enabled: false,
  });
}
