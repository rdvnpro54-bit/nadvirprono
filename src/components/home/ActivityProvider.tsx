import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// ─── Time-based baseline (higher, more credible numbers) ───
function getHourBaseline(): { min: number; max: number } {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return { min: 400, max: 900 };
  if (hour >= 6 && hour < 12) return { min: 800, max: 2000 };
  if (hour >= 12 && hour < 18) return { min: 1500, max: 4000 };
  return { min: 3000, max: 8000 }; // 18h–23h (match time)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Global activity context (single source of truth) ──────
interface ActivityState {
  globalCount: number;
  getMatchCount: (fixtureId: number, sport: string) => number;
}

const ActivityContext = createContext<ActivityState>({
  globalCount: 1500,
  getMatchCount: () => 120,
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
        const maxDelta = Math.max(10, Math.round(range * 0.03));
        const delta = Math.round((Math.random() - 0.48) * maxDelta * 2);
        return Math.max(min, Math.min(max, prev + delta));
      });
    };

    const schedule = () => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        tick();
        timerId = schedule();
      }, delay);
    };

    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, []);

  // Per-match counts: 2-12% of global, minimum 45
  const getMatchCount = useCallback((fixtureId: number, sport: string) => {
    const sportMultiplier =
      sport === "football" ? 1.0 :
      sport === "nba" ? 0.8 :
      sport === "basketball" ? 0.8 :
      sport === "tennis" ? 0.6 :
      sport === "nfl" ? 0.7 :
      sport === "hockey" ? 0.5 :
      0.4;

    // Deterministic per-match seed
    const seed = (fixtureId * 2654435761) >>> 0;
    const matchFactor = 0.3 + ((seed % 100) / 100) * 0.7; // 0.3–1.0

    // 2% to 12% of global
    const pct = 0.02 + matchFactor * 0.10 * sportMultiplier;
    const base = Math.round(globalCount * pct);

    // Smooth transitions
    const prev = matchCountsRef.current.get(fixtureId) ?? base;
    const maxStep = Math.max(5, Math.round(base * 0.08));
    const diff = base - prev;
    const clamped = Math.abs(diff) > maxStep
      ? prev + Math.sign(diff) * maxStep
      : base;

    const final = Math.max(45, clamped);
    matchCountsRef.current.set(fixtureId, final);
    return final;
  }, [globalCount]);

  return (
    <ActivityContext.Provider value={{ globalCount, getMatchCount }}>
      {children}
    </ActivityContext.Provider>
  );
}
