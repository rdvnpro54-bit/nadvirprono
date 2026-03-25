import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// ─── Time-based baseline ───────────────────────────────────────
function getHourBaseline(): { min: number; max: number } {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 8) return { min: 200, max: 400 };
  if (hour >= 8 && hour < 18) return { min: 300, max: 600 };
  return { min: 400, max: 900 }; // 18h–23h
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Global activity context (single source of truth) ──────────
interface ActivityState {
  globalCount: number;
  getMatchCount: (fixtureId: number, sport: string) => number;
}

const ActivityContext = createContext<ActivityState>({
  globalCount: 150,
  getMatchCount: () => 80,
});

export function useGlobalActivity() {
  return useContext(ActivityContext);
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { min, max } = getHourBaseline();
  const [globalCount, setGlobalCount] = useState(() =>
    Math.round(lerp(min, max, 0.5))
  );
  const matchCountsRef = useRef<Map<number, number>>(new Map());

  // Smooth global count updates every 8-15s
  useEffect(() => {
    const tick = () => {
      setGlobalCount(prev => {
        const { min, max } = getHourBaseline();
        const range = max - min;
        // Small delta: ±2-5% of range
        const maxDelta = Math.max(5, Math.round(range * 0.04));
        const delta = Math.round((Math.random() - 0.48) * maxDelta * 2);
        return Math.max(min, Math.min(max, prev + delta));
      });
    };

    const schedule = () => {
      const delay = 8000 + Math.random() * 7000; // 8-15s
      return setTimeout(() => {
        tick();
        timerId = schedule();
      }, delay);
    };

    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, []);

  // Per-match counts derived from global
  const getMatchCount = useCallback((fixtureId: number, sport: string) => {
    const sportMultiplier =
      sport === "football" ? 1.0 :
      sport === "nba" ? 0.7 :
      sport === "tennis" ? 0.5 :
      sport === "nfl" ? 0.6 :
      sport === "hockey" ? 0.4 :
      0.35;

    // Deterministic per-match seed for consistency
    const seed = (fixtureId * 2654435761) >>> 0;
    const matchFactor = 0.3 + ((seed % 100) / 100) * 0.7; // 0.3–1.0

    const base = Math.round(globalCount * 0.08 * sportMultiplier * matchFactor);

    // Get or init stored count for smooth transitions
    const prev = matchCountsRef.current.get(fixtureId) ?? base;
    const maxStep = Math.max(3, Math.round(base * 0.1));
    const diff = base - prev;
    const clamped = Math.abs(diff) > maxStep
      ? prev + Math.sign(diff) * maxStep
      : base;

    const final = Math.max(5, clamped);
    matchCountsRef.current.set(fixtureId, final);
    return final;
  }, [globalCount]);

  return (
    <ActivityContext.Provider value={{ globalCount, getMatchCount }}>
      {children}
    </ActivityContext.Provider>
  );
}
