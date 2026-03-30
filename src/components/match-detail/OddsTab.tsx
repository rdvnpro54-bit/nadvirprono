import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, RefreshCw, AlertCircle, DollarSign } from "lucide-react";
import type { CachedMatch } from "@/hooks/useMatches";
import type { Json } from "@/integrations/supabase/types";

interface OddsTabProps {
  match: CachedMatch;
  isLive: boolean;
}

interface OddsChoice {
  name?: string;
  value?: string;
  odd?: string | number;
  odds?: string | number;
  change?: number;
  probability?: number;
}

interface OddsMarket {
  market?: string;
  bookmaker?: string;
  choices?: OddsChoice[];
  label?: string;
  value?: string | number;
}

function parseOdds(raw: Json | null | undefined): OddsMarket[] {
  if (!raw) return [];
  // Handle different formats from APIs
  if (Array.isArray(raw)) return raw as OddsMarket[];
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    // API-Football format: { bookmaker: "...", match_winner: [...], ... }
    const markets: OddsMarket[] = [];
    const bookmaker = (obj.bookmaker as string) || "";
    for (const [key, val] of Object.entries(obj)) {
      if (key === "bookmaker") continue;
      if (Array.isArray(val)) {
        markets.push({
          market: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          bookmaker,
          choices: val as OddsChoice[],
        });
      }
    }
    return markets;
  }
  return [];
}

function formatOddsTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Aujourd'hui à ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Hier à ${time}`;
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${time}`;
}

function OddsChangeIndicator({ change }: { change?: number }) {
  if (!change || change === 0) return null;
  return change > 0 ? (
    <TrendingUp className="h-3 w-3 text-green-500" />
  ) : (
    <TrendingDown className="h-3 w-3 text-red-500" />
  );
}

function MarketCard({ market, index }: { market: OddsMarket; index: number }) {
  const choices = market.choices || [];
  const marketName = market.market || "Match Winner";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-3 py-2 bg-muted/30 border-b border-border/30 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wide">
          {marketName}
        </span>
        {market.bookmaker && (
          <span className="text-[9px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
            {market.bookmaker}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          {choices.length > 0 ? choices.slice(0, 3).map((c, i) => {
            const oddVal = c.odd || c.odds || c.value || "-";
            const label = c.name || c.value || (i === 0 ? "1" : i === 1 ? "X" : "2");
            return (
              <div
                key={i}
                className="flex flex-col items-center rounded-lg bg-muted/40 hover:bg-primary/5 transition-colors p-2 gap-0.5"
              >
                <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground tabular-nums">{oddVal}</span>
                  <OddsChangeIndicator change={c.change} />
                </div>
                {c.probability != null && (
                  <span className="text-[9px] text-muted-foreground">{Math.round(Number(c.probability))}%</span>
                )}
              </div>
            );
          }) : (
            <div className="col-span-3 text-center text-xs text-muted-foreground py-2">
              Données non disponibles
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const OddsTab = memo(function OddsTab({ match, isLive }: OddsTabProps) {
  const odds = useMemo(() => parseOdds(match.odds), [match.odds]);
  const oddsTime = formatOddsTime(match.odds_updated_at);
  const hasOdds = odds.length > 0;

  // Determine update context
  const updateLabel = useMemo(() => {
    if (!oddsTime) return null;
    if (isLive) return "Mi-temps";
    return "Pré-match";
  }, [oddsTime, isLive]);

  if (!hasOdds) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 text-center"
      >
        <DollarSign className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Cotes non disponibles
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Les cotes seront affichées dès qu'elles seront récupérées par nos APIs
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Update timestamp header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">
            Dernière MAJ : <span className="font-semibold text-foreground/80">{oddsTime || "Inconnue"}</span>
          </span>
        </div>
        {updateLabel && (
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
            isLive
              ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" /> {updateLabel}
              </span>
            ) : (
              updateLabel
            )}
          </span>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 rounded-lg bg-muted/30 border border-border/30 p-2">
        <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {isLive
            ? "Cotes mises à jour à la mi-temps. Les valeurs peuvent différer des cotes en direct."
            : "Cotes relevées avant le match. Elles peuvent évoluer jusqu'au coup d'envoi."}
        </p>
      </div>

      {/* Markets grid */}
      <div className="space-y-2">
        {odds.map((market, i) => (
          <MarketCard key={i} market={market} index={i} />
        ))}
      </div>

      {/* Sources badge */}
      {match.data_sources && (match.data_sources as string[]).length > 0 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <span className="text-[9px] text-muted-foreground/50">
            Sources : {(match.data_sources as string[]).join(" · ")}
          </span>
        </div>
      )}
    </motion.div>
  );
});
