import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;
export type MatchWithFlags = CachedMatch & { is_top_pick?: boolean };

const CACHE_KEY = "pronosia_matches_cache_v3";
const CACHE_TS_KEY = "pronosia_matches_ts_v3";
const CACHE_MAX_AGE = 15 * 60_000;

const SPORT_DURATIONS: Record<string, number> = {
  football: 120,
  tennis: 180,
  basketball: 150,
  hockey: 150,
  baseball: 210,
  nfl: 210,
  mma: 180,
  f1: 150,
  afl: 150,
  rugby: 120,
};

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

const FALLBACK_MATCHES: MatchWithFlags[] = [
  {
    id: "fallback-1",
    fixture_id: 990001,
    sport: "football",
    league_name: "International Friendlies",
    league_country: null,
    home_team: "Türkiye",
    away_team: "Romania",
    home_logo: null,
    away_logo: null,
    kickoff: new Date(Date.now() + 45 * 60_000).toISOString(),
    status: "NS",
    home_score: null,
    away_score: null,
    pred_home_win: 52,
    pred_draw: 24,
    pred_away_win: 24,
    pred_score_home: 2,
    pred_score_away: 1,
    pred_over_under: 2.5,
    pred_over_prob: 56,
    pred_btts_prob: 49,
    pred_confidence: "MODÉRÉ",
    pred_value_bet: false,
    pred_analysis: null,
    is_free: true,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ai_score: 78,
    is_top_pick: false,
  },
  {
    id: "fallback-2",
    fixture_id: 990002,
    sport: "tennis",
    league_name: "Miami Open",
    league_country: "ATP",
    home_team: "Frances Tiafoe",
    away_team: "Jannik Sinner",
    home_logo: null,
    away_logo: null,
    kickoff: new Date(Date.now() + 70 * 60_000).toISOString(),
    status: "NS",
    home_score: null,
    away_score: null,
    pred_home_win: 18,
    pred_draw: 0,
    pred_away_win: 82,
    pred_score_home: 0,
    pred_score_away: 2,
    pred_over_under: 21.5,
    pred_over_prob: 41,
    pred_btts_prob: 0,
    pred_confidence: "SAFE",
    pred_value_bet: false,
    pred_analysis: null,
    is_free: true,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ai_score: 91,
    is_top_pick: false,
  },
  {
    id: "fallback-3",
    fixture_id: 990003,
    sport: "baseball",
    league_name: "MLB",
    league_country: null,
    home_team: "Milwaukee Brewers",
    away_team: "Chicago White Sox",
    home_logo: null,
    away_logo: null,
    kickoff: new Date(Date.now() + 110 * 60_000).toISOString(),
    status: "NS",
    home_score: null,
    away_score: null,
    pred_home_win: 61,
    pred_draw: 0,
    pred_away_win: 39,
    pred_score_home: 5,
    pred_score_away: 3,
    pred_over_under: 8.5,
    pred_over_prob: 54,
    pred_btts_prob: 0,
    pred_confidence: "MODÉRÉ",
    pred_value_bet: false,
    pred_analysis: null,
    is_free: false,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ai_score: 74,
    is_top_pick: false,
  },
];

function isFinishedByAPI(status: string): boolean {
  return FINISHED_STATUSES.includes((status || "").toUpperCase());
}

function getSportDuration(sport: string): number {
  return (SPORT_DURATIONS[sport?.toLowerCase()] || 120) * 60 * 1000;
}

function filterActiveMatches(matches: MatchWithFlags[]): MatchWithFlags[] {
  const now = Date.now();
  return matches.filter((m) => {
    const kickoff = new Date(m.kickoff).getTime();
    const duration = getSportDuration(m.sport);
    if (Number.isNaN(kickoff)) return false;
    // Hide matches with a finished status immediately
    if (isFinishedByAPI(m.status)) return false;
    // Hide matches that have final scores
    if (m.home_score !== null && m.away_score !== null) return false;
    // Hide matches past their expected duration (no API status update yet)
    if (now > kickoff + duration) return false;
    // Hide matches too far in the future
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
  return matches.filter((m) => {
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
        ...m,
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

function normalizeMatches(matches: MatchWithFlags[]): MatchWithFlags[] {
  let result = deduplicateMatches(matches);
  result = deduplicateByTeams(result);
  result = filterActiveMatches(result);
  result.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  return result;
}

function loadFromLocalStorage(): MatchWithFlags[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!ts || Date.now() - Number(ts) > CACHE_MAX_AGE) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchWithFlags[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return normalizeMatches(parsed);
  } catch {
    return null;
  }
}

function saveToLocalStorage(matches: MatchWithFlags[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

function getFallbackMatches(): MatchWithFlags[] {
  return normalizeMatches(FALLBACK_MATCHES.map((match, index) => ({
    ...match,
    id: `fallback-${index + 1}`,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })));
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function getResolvedFixtureIds(): Promise<Set<number>> {
  const { data, error } = await supabase
    .from("match_results")
    .select("fixture_id")
    .not("result", "is", null)
    .order("kickoff", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[useMatches] Impossible de charger les matchs résolus", error);
    return new Set<number>();
  }

  return new Set((data ?? []).map((row) => Number(row.fixture_id)).filter(Number.isFinite));
}

function removeResolvedMatches(matches: MatchWithFlags[], resolvedFixtureIds: Set<number>): MatchWithFlags[] {
  if (resolvedFixtureIds.size === 0) return matches;
  return matches.filter((match) => !resolvedFixtureIds.has(Number(match.fixture_id)));
}

export function useMatches() {
  const initialMatches = loadFromLocalStorage();
  const hasCache = initialMatches !== null && initialMatches.length > 0;
  const cacheRef = useRef<MatchWithFlags[]>(hasCache ? initialMatches : []);

  return useQuery({
    queryKey: ["cached-matches"],
    ...(hasCache ? { initialData: initialMatches } : {}),
    queryFn: async () => {
      try {
        const [matchesResponse, resolvedFixtureIds] = await Promise.all([
          supabase.functions.invoke("get-matches", {
            headers: await getAuthHeaders(),
          }),
          getResolvedFixtureIds(),
        ]);

        const { data, error } = matchesResponse;
        if (error) throw error;

        const matches = Array.isArray(data) ? (data as MatchWithFlags[]) : [];
        if (matches.length === 0) {
          console.warn("[useMatches] API vide, conservation du cache courant");
          return removeResolvedMatches(cacheRef.current, resolvedFixtureIds);
        }

        let result = normalizeMatches(removeResolvedMatches(matches, resolvedFixtureIds));
        result = mergeMatches(removeResolvedMatches(cacheRef.current, resolvedFixtureIds), result);
        result = normalizeMatches(removeResolvedMatches(result, resolvedFixtureIds));

        cacheRef.current = result;
        saveToLocalStorage(result);
        console.log(`[useMatches] ${matches.length} raw → ${result.length} affichés`);
        return result;
      } catch (error) {
        console.warn("[useMatches] Fetch failed, conservation du cache courant", error);
        return cacheRef.current;
      }
    },
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
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
          apikey: anonKey,
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
