import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, TrendingUp, AlertTriangle, CalendarX2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatch } from "@/hooks/useMatches";
import { DetailTabs } from "@/components/match-detail/DetailTabs";
import { marketLabel, isLive } from "./Matches";
import { cn } from "@/lib/utils";

function Logo({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <img src={src} alt="" className="h-14 w-14 object-contain" />
  ) : (
    <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-lg font-bold text-muted-foreground">{name[0]}</div>
  );
}

function Bar({ label, value, tone = "bg-primary" }: { label: string; value: number; tone?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{v}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div className={cn("h-full rounded-full", tone)} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn("rounded-2xl border border-border/60 bg-card p-4", className)}>{children}</section>
);

export default function MatchDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { data: m, isLoading, error } = useMatch(id);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen pb-28 md:pb-10">
      <Navbar />
      <main className="container max-w-3xl pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <Link to="/matches" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Pronostics
        </Link>
        {children}
      </main>
    </div>
  );

  if (isLoading && !m)
    return shell(
      <div className="space-y-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );

  if (error || !m)
    return shell(
      <Card className="text-center">
        <CalendarX2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Match introuvable</p>
        <p className="text-xs text-muted-foreground">Ce match n'est plus disponible.</p>
      </Card>
    );

  const live = isLive(m);
  const kickoff = new Date(m.kickoff);
  const share = () => {
    const url = window.location.href;
    navigator.share ? navigator.share({ title: `${m.home_team} - ${m.away_team}`, url }) : navigator.clipboard.writeText(url);
  };
  const hasDraw = Number(m.pred_draw) > 0;

  return shell(
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate font-semibold uppercase tracking-wider">{m.league_name}</span>
            <button onClick={share} aria-label="Partager" className="rounded-full p-1.5 hover:bg-muted"><Share2 className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <Logo src={m.home_logo} name={m.home_team} />
              <span className="text-sm font-semibold leading-tight">{m.home_team}</span>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{live ? "En direct" : "Score prédit"}</div>
              <div className="font-display text-4xl font-bold tabular-nums">
                {live ? `${m.home_score ?? 0}-${m.away_score ?? 0}` : `${m.pred_score_home}-${m.pred_score_away}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {kickoff.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" })} ·{" "}
                {kickoff.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Logo src={m.away_logo} name={m.away_team} />
              <span className="text-sm font-semibold leading-tight">{m.away_team}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-primary/10 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Marché conseillé</div>
            <div className="mt-0.5 text-base font-bold">{marketLabel(m)}</div>
            <div className="text-xs text-muted-foreground">Confiance : {m.pred_confidence}</div>
          </div>
          {m.pred_value_bet && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-success">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">Value Bet — la cote du marché sous-estime ce pronostic</span>
            </div>
          )}
          {m.anomaly_label && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-xs">{m.anomaly_label}{m.anomaly_reason ? ` — ${m.anomaly_reason}` : ""}</span>
            </div>
          )}
        </Card>
      </motion.div>

      <Card>
        <h3 className="mb-3 text-sm font-bold">Probabilités</h3>
        <div className="space-y-3">
          <Bar label={m.home_team} value={Number(m.pred_home_win)} />
          {hasDraw && <Bar label="Match nul" value={Number(m.pred_draw)} tone="bg-muted-foreground" />}
          <Bar label={m.away_team} value={Number(m.pred_away_win)} tone="bg-secondary" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold">Marchés</h3>
        <div className="space-y-3">
          <Bar label={`Plus de ${m.pred_over_under}`} value={Number(m.pred_over_prob)} />
          <Bar label={`Moins de ${m.pred_over_under}`} value={100 - Number(m.pred_over_prob)} tone="bg-secondary" />
          {m.sport === "football" && <Bar label="Les deux équipes marquent" value={Number(m.pred_btts_prob)} tone="bg-success" />}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold">Statistiques IA</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Score IA" value={`${m.ai_score}/100`} />
          <Stat label="Données" value={`${m.data_completeness_score ?? 0}%`} />
          <Stat label="Validation" value={`${m.validation_score ?? 0}/10`} />
          <Stat label="Risque" value={`${m.anomaly_score}/100`} />
        </div>
      </Card>

      {m.pred_analysis && (
        <Card>
          <h3 className="mb-2 text-sm font-bold">Analyse</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{m.pred_analysis}</p>
        </Card>
      )}

      <DetailTabs match={m} predictionText={marketLabel(m)} confidence={0} keyFactors={[]} userCount={0} isLive={live} />
    </div>
  );
}
