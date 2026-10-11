import { useMemo, useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Flame, TrendingUp, ShieldCheck, Radio, CalendarX2, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches, type MatchWithFlags } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";

type Filter = "all" | "live" | "value" | "safe" | "top";
const LIVE = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INPLAY"];

const FILTERS: { id: Filter; label: string; icon: typeof Flame }[] = [
  { id: "all", label: "Tous", icon: Flame },
  { id: "live", label: "En direct", icon: Radio },
  { id: "value", label: "Value Bet", icon: TrendingUp },
  { id: "safe", label: "Confiance haute", icon: ShieldCheck },
  { id: "top", label: "Top IA", icon: Flame },
];

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(iso));

function dayLabel(key: string) {
  const today = dayKey(new Date().toISOString());
  const tomorrow = dayKey(new Date(Date.now() + 86400000).toISOString());
  if (key === today) return "Aujourd'hui";
  if (key === tomorrow) return "Demain";
  return new Date(key + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function marketLabel(m: MatchWithFlags) {
  if (m.pred_label) return m.pred_label;
  const map: Record<string, string> = {
    "1": `Victoire ${m.home_team}`, "2": `Victoire ${m.away_team}`, X: "Match nul",
    "1X": `${m.home_team} ou nul`, X2: `${m.away_team} ou nul`, "12": "Pas de nul", NO_BET: "Pas de pari conseillé",
  };
  return map[m.pred_market] ?? "Pas de pari conseillé";
}

export const isLive = (m: MatchWithFlags) => LIVE.includes(m.status);

function Team({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {logo ? (
        <img src={logo} alt="" loading="lazy" className="h-5 w-5 shrink-0 object-contain" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full bg-muted text-[9px] font-bold grid place-items-center text-muted-foreground">
          {name.slice(0, 1)}
        </div>
      )}
      <span className="truncate text-sm font-medium">{name}</span>
    </div>
  );
}

const MatchRow = memo(function MatchRow({ m }: { m: MatchWithFlags }) {
  const live = isLive(m);
  const time = new Date(m.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const best = Math.max(Number(m.pred_home_win), Number(m.pred_draw), Number(m.pred_away_win));
  return (
    <Link
      to={`/match/${m.id}`}
      className="group block rounded-2xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 shrink-0 text-center">
          {live ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> LIVE
            </span>
          ) : (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{time}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <Team name={m.home_team} logo={m.home_logo} />
          <Team name={m.away_team} logo={m.away_logo} />
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{live ? "Score" : "Prédit"}</div>
          <div className="font-display text-lg font-bold tabular-nums leading-tight">
            {live ? `${m.home_score ?? 0}-${m.away_score ?? 0}` : `${m.pred_score_home}-${m.pred_score_away}`}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-border/50 pt-2">
        <span className="truncate rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {marketLabel(m)}
        </span>
        {m.pred_value_bet && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">VALUE</span>
        )}
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{Math.round(best)}%</span>
      </div>
    </Link>
  );
});

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-10" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-4 w-1/2" /></div>
            <Skeleton className="h-7 w-10" />
          </div>
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export default function Matches() {
  const { data, isLoading, refetch, isFetching } = useMatches();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [day, setDay] = useState<string | null>(null);

  const visible = useMemo(() => (data ?? []).filter((m) => !m.ai_hidden), [data]);
  const days = useMemo(() => Array.from(new Set(visible.map((m) => dayKey(m.kickoff)))).sort(), [visible]);
  const activeDay = day && days.includes(day) ? day : days[0];

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return visible.filter((m) => {
      if (s) return `${m.home_team} ${m.away_team} ${m.league_name}`.toLowerCase().includes(s);
      if (dayKey(m.kickoff) !== activeDay) return false;
      if (filter === "live") return isLive(m);
      if (filter === "value") return m.pred_value_bet;
      if (filter === "safe") return m.pred_confidence === "SAFE" || m.pred_confidence === "ÉLEVÉ";
      if (filter === "top") return (m.ai_score ?? 0) >= 80;
      return true;
    });
  }, [visible, q, filter, activeDay]);

  const byLeague = useMemo(() => {
    const g = new Map<string, MatchWithFlags[]>();
    for (const m of list) g.set(m.league_name, [...(g.get(m.league_name) ?? []), m]);
    return Array.from(g.entries());
  }, [list]);

  return (
    <div className="min-h-screen pb-28 md:pb-10">
      <Navbar />
      <main className="container max-w-3xl pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Pronostics</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Chargement…" : `${visible.length} matchs analysés par l'IA`}
            </p>
          </div>
          <button onClick={() => refetch()} aria-label="Actualiser" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Équipe, ligue…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-base outline-none focus:border-primary"
          />
        </div>

        {days.length > 0 && !q && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {days.map((d) => (
              <button key={d} onClick={() => setDay(d)}
                className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors capitalize",
                  d === activeDay ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}>
                {dayLabel(d)}
              </button>
            ))}
          </div>
        )}

        {!q && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setFilter(id)}
                className={cn("flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                <Icon className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <SkeletonList />
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <CalendarX2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Aucun match disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun match réel n'a pu être chargé pour l'instant. Nous n'affichons jamais de matchs inventés.
              </p>
            </div>
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun match pour ce filtre.</p>
          ) : (
            <div className="space-y-5">
              {byLeague.map(([league, ms], gi) => (
                <motion.section key={league} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(gi * 0.03, 0.3) }}>
                  <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{league}</h2>
                  <div className="space-y-2">{ms.map((m) => <MatchRow key={m.id} m={m} />)}</div>
                </motion.section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
