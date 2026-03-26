import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;
export type MatchWithFlags = CachedMatch & { is_top_pick?: boolean };

// ─── Constants ──────────────────
const CACHE_KEY = "pronosia_matches_cache";
const CACHE_TS_KEY = "pronosia_matches_ts";
const CACHE_MAX_AGE = 30 * 60_000; // 30 min max cache age

const SPORT_DURATIONS: Record<string, number> = {
  football: 120, tennis: 180, basketball: 150,
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

function filterActiveMatches(matches: MatchWithFlags[]): MatchWithFlags[] {
  const now = Date.now();
  return matches.filter(m => {
    const kickoff = new Date(m.kickoff).getTime();
    const duration = getSportDuration(m.sport);
    if (isFinishedByAPI(m.status) && now > kickoff + duration) return false;
    if (m.home_score !== null && m.away_score !== null && now > kickoff + duration) return false;
    if (now > kickoff + duration + 30 * 60 * 1000) return false;
    if (kickoff > now + 48 * 60 * 60 * 1000) return false;
    return true;
  });
}

function deduplicateMatches(matches: MatchWithFlags[]): MatchWithFlags[] {
  const map = new Map<number, MatchWithFlags>();
  for (const m of matches) {
    const existing = map.get(m.fixture_id);
    if (!existing || new Date(m.fetched_at) > new Date(existing.fetched_at)) {
      map.set(m.fixture_id, m);
    }
  }
  return Array.from(map.values());
}

function deduplicateByTeams(matches: MatchWithFlags[]): MatchWithFlags[] {
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = `${m.home_team.toLowerCase()}_${m.away_team.toLowerCase()}_${m.kickoff}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeMatches(previous: MatchWithFlags[], incoming: MatchWithFlags[]): MatchWithFlags[] {
  const now = Date.now();
  const previousMap = new Map<string, MatchWithFlags>();
  for (const m of previous) previousMap.set(m.id, m);

  const merged = new Map<string, MatchWithFlags>();

  for (const m of incoming) {
    const prev = previousMap.get(m.id);
    if (prev) {
      merged.set(m.id, {
        ...prev,
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score,
        fetched_at: m.fetched_at,
        is_free: m.is_free,
        is_top_pick: m.is_top_pick,
      });
    } else {
      merged.set(m.id, m);
    }
  }

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

// ─── localStorage cache helpers ──────────────────
function loadFromLocalStorage(): MatchWithFlags[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!ts || Date.now() - Number(ts) > CACHE_MAX_AGE) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchWithFlags[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage(matches: MatchWithFlags[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch { /* quota exceeded — ignore */ }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export function useMatches() {
  const cacheRef = useRef<MatchWithFlags[]>([]);
  const queryClient = useQueryClient();

  // LAYER 1: Seed query cache with localStorage data instantly
  useEffect(() => {
    const existing = queryClient.getQueryData<MatchWithFlags[]>(["cached-matches"]);
    if (existing && existing.length > 0) return; // already have data
    
    const cached = loadFromLocalStorage();
    if (cached && cached.length > 0) {
      const filtered = filterActiveMatches(cached);
      if (filtered.length > 0) {
        console.log(`[useMatches] INSTANT: ${filtered.length} matches from localStorage`);
        cacheRef.current = filtered;
        queryClient.setQueryData(["cached-matches"], filtered);
      }
    }
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      // LAYER 2: Background API fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        const { data, error } = await supabase.functions.invoke("get-matches", {
          headers: await getAuthHeaders(),
        });
        clearTimeout(timeout);

        if (error) {
          console.warn("[useMatches] API error, returning cached data", error);
          if (cacheRef.current.length > 0) return cacheRef.current;
          const local = loadFromLocalStorage();
          if (local && local.length > 0) return filterActiveMatches(local);
          throw error;
        }

        const matches = data as MatchWithFlags[];
        let result = deduplicateMatches(matches);
        result = deduplicateByTeams(result);
        result = mergeMatches(cacheRef.current, result);
        result = filterActiveMatches(result);
        result.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

        cacheRef.current = result;
        saveToLocalStorage(result);
        console.log(`[useMatches] API: ${matches?.length} raw → ${result.length} after merge+dedup+filter`);
        return result;
      } catch (err) {
        clearTimeout(timeout);
        // Fallback to any available cache
        if (cacheRef.current.length > 0) {
          console.warn("[useMatches] Fetch failed, using memory cache");
          return cacheRef.current;
        }
        const local = loadFromLocalStorage();
        if (local && local.length > 0) {
          console.warn("[useMatches] Fetch failed, using localStorage cache");
          return filterActiveMatches(local);
        }
        throw err;
      }
    },
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    retryDelay: 1000,
  });

  return query;
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
      return (await response.json()) as MatchWithFlags;
    },
    enabled: !!id,
  });
}

export function useTriggerFetch() {
  return useQuery({
    queryKey: ["trigger-fetch"],
    queryFn: async () => null,
    staleTime: Infinity,
    enabled: false,
  });
}
