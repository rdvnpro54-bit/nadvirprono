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

  // Finished: API says finished OR kickoff + duration + margin exceeded
  if (FINISHED_STATUSES.includes(statusUp)) return "finished";
  if (match.home_score !== null && match.away_score !== null) return "finished";

  const sport = (match.sport || "football").toLowerCase();
  const durationMs = (SPORT_DURATIONS[sport] || 120) * 60 * 1000;
  if (now > kickoff + durationMs) return "finished";

  // Live: time-based (currentTime >= startTime) — NEVER rely only on API
  if (now >= kickoff) return "live";

  return "upcoming";
}

export function isMatchLive(match: CachedMatch): boolean {
  return getMatchStatus(match) === "live";
}

// ─── TOP PICK DU JOUR (LOCKED PER DAY) ─────────────────────────
const TOP_PICK_KEY = "pronosia_top_pick";

interface StoredTopPick {
  matchId: string;
  date: string; // YYYY-MM-DD
}

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function selectBestMatch(matches: CachedMatch[]): CachedMatch | null {
  const eligible = matches.filter(m => {
    const status = getMatchStatus(m);
    return status === "upcoming" && m.pred_confidence !== "LOCKED";
  });
  if (eligible.length === 0) return null;

  return eligible.reduce((best, m) => {
    const confM = Math.max(Number(m.pred_home_win), Number(m.pred_away_win));
    const confB = Math.max(Number(best.pred_home_win), Number(best.pred_away_win));
    // Prefer SAFE > MODÉRÉ > RISQUÉ, then highest confidence
    const rankM = m.pred_confidence === "SAFE" ? 3 : m.pred_confidence === "MODÉRÉ" ? 2 : 1;
    const rankB = best.pred_confidence === "SAFE" ? 3 : best.pred_confidence === "MODÉRÉ" ? 2 : 1;
    if (rankM !== rankB) return rankM > rankB ? m : best;
    return confM > confB ? m : best;
  });
}

export function useTopPick(matches: CachedMatch[] | undefined): CachedMatch | null {
  return useMemo(() => {
    if (!matches || matches.length === 0) return null;
    const today = getTodayISO();

    // Check stored top pick
    try {
      const stored = localStorage.getItem(TOP_PICK_KEY);
      if (stored) {
        const parsed: StoredTopPick = JSON.parse(stored);
        if (parsed.date === today) {
          // Same day → use stored match ID (locked)
          const found = matches.find(m => m.id === parsed.matchId);
          if (found) return found;
          // Match no longer in cache (finished/removed), keep stored but return null
        }
      }
    } catch { /* ignore parse errors */ }

    // New day or no stored → select and save
    const best = selectBestMatch(matches);
    if (best) {
      try {
        localStorage.setItem(TOP_PICK_KEY, JSON.stringify({ matchId: best.id, date: today }));
      } catch { /* storage full */ }
    }
    return best;
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

    // Top pick
    const today = getTodayISO();
    let topPickId = "none";
    try {
      const stored = localStorage.getItem(TOP_PICK_KEY);
      if (stored) {
        const parsed: StoredTopPick = JSON.parse(stored);
        if (parsed.date === today) topPickId = parsed.matchId;
      }
    } catch { /* */ }

    console.log(`[PRONOSIA] ━━━ Match Lifecycle ━━━`);
    console.log(`[PRONOSIA] Cache: ${cached} matchs`);
    console.log(`[PRONOSIA] Live: ${live} | Upcoming: ${upcoming} | Finished: ${finished}`);
    console.log(`[PRONOSIA] Top Pick: ${topPickId} (${today})`);
  }, [matches]);
}
