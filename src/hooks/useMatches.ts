import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

// ─── Sport durations (minutes) for LIVE window ──────────────────
const SPORT_DURATIONS: Record<string, number> = {
  football: 120,
  tennis: 180,
  basketball: 150,
};

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

function isFinishedByAPI(status: string): boolean {
  return FINISHED_STATUSES.includes(status.toUpperCase());
}

function getSportDuration(sport: string): number {
  return (SPORT_DURATIONS[sport?.toLowerCase()] || 120) * 60 * 1000;
}

/**
 * Filter matches: keep upcoming + live, drop truly finished.
 * Uses sport-specific durations instead of a fixed 3h window.
 */
function filterActiveMatches(matches: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  return matches.filter(m => {
    const kickoff = new Date(m.kickoff).getTime();
    const duration = getSportDuration(m.sport);

    // Already finished by API AND past duration → remove
    if (isFinishedByAPI(m.status) && now > kickoff + duration) return false;
    // Has final scores AND past duration → remove
    if (m.home_score !== null && m.away_score !== null && now > kickoff + duration) return false;
    // Too far past (duration + 30min buffer) → remove even without API confirmation
    if (now > kickoff + duration + 30 * 60 * 1000) return false;
    // Too far in the future
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

/**
 * Merge new API data with existing cached matches.
 * Rules:
 * 1. NEVER drop a match that was previously shown and is still in its LIVE window
 * 2. NEVER overwrite core prediction data (pred_*, ai_score) — only update status/scores
 * 3. Preserve team names and kickoff times from first seen version
 */
function mergeMatches(previous: CachedMatch[], incoming: CachedMatch[]): CachedMatch[] {
  const now = Date.now();
  const previousMap = new Map<string, CachedMatch>();
  for (const m of previous) previousMap.set(m.id, m);

  const merged = new Map<string, CachedMatch>();

  // Add all incoming, but preserve locked prediction fields from previous
  for (const m of incoming) {
    const prev = previousMap.get(m.id);
    if (prev) {
      // Lock core data: keep original predictions, only update mutable fields
      merged.set(m.id, {
        ...prev,
        // Only these fields can be updated:
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score,
        fetched_at: m.fetched_at,
        is_free: m.is_free,
      });
    } else {
      merged.set(m.id, m);
    }
  }

  // Preserve previous matches still in their LIVE window that API dropped
  for (const prev of previous) {
    if (merged.has(prev.id)) continue;

    const kickoff = new Date(prev.kickoff).getTime();
    const duration = getSportDuration(prev.sport);
    const isStillActive = now < kickoff + duration + 30 * 60 * 1000;

    if (isStillActive && !isFinishedByAPI(prev.status)) {
      merged.set(prev.id, prev);
    }
  }

  return Array.from(merged.values());
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export function useMatches() {
  const cacheRef = useRef<CachedMatch[]>([]);

  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-matches", {
        headers: await getAuthHeaders(),
      });

      if (error) {
        // On API error, return cached data instead of throwing
        if (cacheRef.current.length > 0) {
          console.warn("[useMatches] API error, returning cached data", error);
          return cacheRef.current;
        }
        throw error;
      }

      const matches = data as CachedMatch[];
      let result = deduplicateMatches(matches);
      result = deduplicateByTeams(result);

      // Merge with previous cache to prevent disappearing matches
      result = mergeMatches(cacheRef.current, result);
      result = filterActiveMatches(result);

      // Sort by kickoff
      result.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

      cacheRef.current = result;
      console.log(`[useMatches] ${matches?.length} raw → ${result.length} after merge+dedup+filter`);
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
