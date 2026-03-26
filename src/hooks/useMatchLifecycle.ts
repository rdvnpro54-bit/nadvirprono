import { useMemo, useEffect } from "react";
import type { CachedMatch } from "@/hooks/useMatches";

// ─── SPORT DURATIONS (minutes) ───────────────────────────────────
const SPORT_DURATIONS: Record<string, number> = {
  football: 120, tennis: 180, basketball: 150,
  hockey: 150, baseball: 210, nfl: 210,
  mma: 180, f1: 150, afl: 150, rugby: 120,
};

const FINISHED_STATUSES = [
  "FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD",
  "PST", "SUSP", "ABANDONED", "FINISHED", "COMPLETED", "ENDED",
];

// ─── MATCH STATUS LOGIC ─────────────────────────────────────────
export type MatchStatus = "upcoming" | "live" | "finished";

export function getMatchStatus(match: CachedMatch): MatchStatus {
  const now = Date.now();
  const kickoff = new Date(match.kickoff).getTime();
  const statusUp = match.status.toUpperCase();

  if (FINISHED_STATUSES.includes(statusUp)) return "finished";
  if (match.home_score !== null && match.away_score !== null) return "finished";

  const sport = (match.sport || "football").toLowerCase();
  const durationMs = (SPORT_DURATIONS[sport] || 120) * 60 * 1000;
  if (now > kickoff + durationMs) return "finished";

  if (now >= kickoff) return "live";
  return "upcoming";
}

export function isMatchLive(match: CachedMatch): boolean {
  return getMatchStatus(match) === "live";
}

// ─── DETERMINISTIC DATE KEY ─────────────────────────────────────
function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

// ─── DETERMINISTIC DAILY SEED ───────────────────────────────────
// Same seed for all users on the same day → same selections
function getDailySeed(): number {
  const dateStr = getTodayISO();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─── TOP PICK DU JOUR (RISQUÉ — DETERMINISTIC) ─────────────────
export function useTopPick(matches: CachedMatch[] | undefined): CachedMatch | null {
  return useMemo(() => {
    if (!matches || matches.length === 0) return null;

    const eligible = matches.filter(m => {
      const status = getMatchStatus(m);
      return (status === "upcoming" || status === "live") && m.pred_confidence !== "LOCKED";
    });
    if (eligible.length === 0) return null;

    // FORCE RISQUÉ picks first, then MODÉRÉ, then SAFE
    const risque = eligible.filter(m => m.pred_confidence === "RISQUÉ");
    const modere = eligible.filter(m => m.pred_confidence === "MODÉRÉ");
    const safe = eligible.filter(m => m.pred_confidence === "SAFE");

    // Pick from risqué first, otherwise modéré, last resort safe
    const pool = risque.length > 0 ? risque : modere.length > 0 ? modere : safe;

    // Sort deterministically by ai_score desc, then fixture_id for tie-breaking
    const sorted = [...pool].sort((a, b) => {
      const scoreDiff = (b.ai_score || 0) - (a.ai_score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.fixture_id - b.fixture_id;
    });

    // Use daily seed for stable rotation among top candidates
    const seed = getDailySeed();
    const topCandidates = sorted.slice(0, Math.min(3, sorted.length));
    return topCandidates[seed % topCandidates.length];
  }, [matches]);
}

// ─── CONSOLE DIAGNOSTICS ────────────────────────────────────────
export function useMatchDiagnostics(matches: CachedMatch[] | undefined) {
  useEffect(() => {
    if (!matches) return;

    const cached = matches.length;
    const live = matches.filter(m => getMatchStatus(m) === "live").length;
    const upcoming = matches.filter(m => getMatchStatus(m) === "upcoming").length;
    const finished = matches.filter(m => getMatchStatus(m) === "finished").length;

    console.log(`[PRONOSIA] ━━━ Match Lifecycle ━━━`);
    console.log(`[PRONOSIA] Cache: ${cached} matchs`);
    console.log(`[PRONOSIA] Live: ${live} | Upcoming: ${upcoming} | Finished: ${finished}`);
  }, [matches]);
}
