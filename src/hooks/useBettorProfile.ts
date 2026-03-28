import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAllResults } from "@/hooks/useResults";
import { useAuth } from "@/contexts/AuthContext";

export type BettorType = "safe" | "aggressive" | "balanced" | "analyst" | "unknown";

export interface BettorProfile {
  type: BettorType;
  label: string;
  emoji: string;
  description: string;
  color: string;
  stats: {
    avgConfidence: string;
    preferredSport: string;
    riskLevel: number; // 1-5
    favoriteCount: number;
  };
}

const PROFILES: Record<Exclude<BettorType, "unknown">, Omit<BettorProfile, "stats">> = {
  safe: {
    type: "safe",
    label: "Stratège Prudent",
    emoji: "🛡",
    description: "Tu privilégies la sécurité. Tu suis surtout les matchs SAFE avec des cotes fiables.",
    color: "text-primary",
  },
  aggressive: {
    type: "aggressive",
    label: "Joueur Audacieux",
    emoji: "⚡",
    description: "Tu n'as pas peur du risque. Tu vises les Value Bets et les cotes élevées.",
    color: "text-amber-400",
  },
  balanced: {
    type: "balanced",
    label: "Parieur Équilibré",
    emoji: "⚖️",
    description: "Tu mélanges sécurité et prise de risque. Une approche diversifiée et intelligente.",
    color: "text-emerald-400",
  },
  analyst: {
    type: "analyst",
    label: "Analyste Expert",
    emoji: "🧠",
    description: "Tu analyses chaque match en détail. Tu ne suis que les prédictions ELITE.",
    color: "text-secondary",
  },
};

export function useBettorProfile(): BettorProfile | null {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { data: results } = useAllResults();

  return useMemo(() => {
    if (!user) return null;

    const favCount = favorites?.length || 0;

    // Analyze results patterns
    const resolved = results?.filter(r => r.result === "win" || r.result === "loss") || [];
    if (resolved.length < 3 && favCount < 2) return null;

    // Count confidence levels
    const safeCount = resolved.filter(r => r.predicted_confidence === "SAFE").length;
    const eliteCount = resolved.filter(r => {
      const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
      return maxProb >= 70;
    }).length;
    const riskyCount = resolved.filter(r => {
      const maxProb = Math.max(r.pred_home_win, r.pred_away_win);
      return maxProb < 55;
    }).length;

    const total = resolved.length || 1;
    const safeRatio = safeCount / total;
    const riskyRatio = riskyCount / total;
    const eliteRatio = eliteCount / total;

    // Determine sport preference
    const sportCounts: Record<string, number> = {};
    for (const r of resolved) {
      sportCounts[r.sport] = (sportCounts[r.sport] || 0) + 1;
    }
    const preferredSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Football";

    // Determine avg confidence
    const avgProb = resolved.reduce((sum, r) => sum + Math.max(r.pred_home_win, r.pred_away_win), 0) / total;
    const avgConfidence = avgProb >= 70 ? "ELITE" : avgProb >= 55 ? "SAFE" : "RISKY";

    // Classify bettor type
    let type: Exclude<BettorType, "unknown">;
    let riskLevel: number;

    if (safeRatio > 0.6) {
      type = "safe";
      riskLevel = 1;
    } else if (riskyRatio > 0.35) {
      type = "aggressive";
      riskLevel = 4;
    } else if (eliteRatio > 0.5) {
      type = "analyst";
      riskLevel = 2;
    } else {
      type = "balanced";
      riskLevel = 3;
    }

    const profile = PROFILES[type];
    return {
      ...profile,
      stats: {
        avgConfidence,
        preferredSport,
        riskLevel,
        favoriteCount: favCount,
      },
    };
  }, [user, favorites, results]);
}
