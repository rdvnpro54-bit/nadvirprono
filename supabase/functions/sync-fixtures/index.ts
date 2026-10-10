import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const API = "https://v3.football.api-sports.io";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b, null, 2), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type ApiRes = { body: any; errors: unknown; results: number; remaining: number | null; limit: number | null };

async function apiGet(path: string, key: string, tries = 3): Promise<ApiRes> {
  let last = "";
  for (let i = 0; i < tries; i++) {
    const r = await fetch(API + path, { headers: { "x-apisports-key": key } });
    if (r.ok) {
      const body = await r.json();
      const n = (h: string) => (r.headers.get(h) ? Number(r.headers.get(h)) : null);
      return {
        body,
        errors: body?.errors ?? null,
        results: body?.results ?? 0,
        remaining: n("x-ratelimit-requests-remaining"),
        limit: n("x-ratelimit-requests-limit"),
      };
    }
    last = `HTTP ${r.status}`;
    await new Promise((res) => setTimeout(res, 500 * 2 ** i));
  }
  throw new Error(`API-Football ${path}: ${last}`);
}

const hasErrors = (e: unknown) => e && (Array.isArray(e) ? e.length > 0 : Object.keys(e as object).length > 0);
const parisDate = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + offsetDays * 86400000));

// Football season = year it started (Aug–Jul).
function currentSeason() {
  const now = new Date();
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const key = Deno.env.get("API_FOOTBALL_KEY");
  if (!key) return json({ ok: false, error: "API_FOOTBALL_KEY manquante" }, 500);
  const url = new URL(req.url);
  const season = currentSeason();

  if (url.searchParams.get("mode") === "diag") {
    const today = parisDate();
    const out: Record<string, unknown> = { season, today };
    const pick = (r: ApiRes) => ({ results: r.results, errors: r.errors, remaining: r.remaining, limit: r.limit });
    const st = await apiGet("/status", key);
    out.status = { ...pick(st), response: st.body?.response };
    const a = await apiGet(`/fixtures?league=61&season=${season}&date=${today}&timezone=Europe/Paris`, key);
    out.fixtures_l1_today = pick(a);
    const b = await apiGet(`/fixtures?league=61&season=${season}&timezone=Europe/Paris`, key);
    out.fixtures_l1_season = { ...pick(b), sample: b.body?.response?.slice(0, 2)?.map((f: any) => `${f.fixture.date} ${f.teams.home.name}-${f.teams.away.name}`) };
    const l = await apiGet(`/leagues?id=61`, key);
    out.league_61 = { ...pick(l), name: l.body?.response?.[0]?.league?.name, seasons_current: l.body?.response?.[0]?.seasons?.find((s: any) => s.current)?.year };
    await sb.from("sync_logs").insert({
      job: "diag", source: "api-football", fin: new Date().toISOString(),
      statut: [st, a, b, l].some((r) => hasErrors(r.errors)) ? "error" : "ok",
      erreur: JSON.stringify({ status: st.errors, today: a.errors, season: b.errors, league: l.errors }),
      nb_lignes: b.results, credits_api_restants: l.remaining,
    });
    return json(out);
  }

  const { data: log } = await sb.from("sync_logs").insert({ job: "sync-fixtures", source: "api-football" }).select("id").single();
  let rows = 0, remaining: number | null = null;
  const apiErrors: unknown[] = [];
  try {
    const { data: leagues } = await sb.from("leagues").select("api_league_id, saison_courante").eq("actif", true);
    for (const lg of leagues ?? []) {
      const s = lg.saison_courante ?? season;
      const res = await apiGet(`/fixtures?league=${lg.api_league_id}&season=${s}&from=${parisDate()}&to=${parisDate(7)}&timezone=Europe/Paris`, key);
      remaining = res.remaining ?? remaining;
      if (hasErrors(res.errors)) { apiErrors.push({ league: lg.api_league_id, errors: res.errors }); continue; }
      const upserts = (res.body?.response ?? []).map((f: any) => ({
        fixture_id: f.fixture.id, sport: "football",
        league_name: f.league.name, league_country: f.league.country,
        home_team: f.teams.home.name, away_team: f.teams.away.name,
        home_logo: f.teams.home.logo, away_logo: f.teams.away.logo,
        kickoff: f.fixture.date, status: f.fixture.status.short,
        home_score: f.goals.home, away_score: f.goals.away,
        fetched_at: new Date().toISOString(),
      }));
      if (upserts.length) {
        const { error } = await sb.from("cached_matches").upsert(upserts, { onConflict: "fixture_id,sport" });
        if (error) throw error;
        rows += upserts.length;
      }
    }
    await sb.from("sync_logs").update({
      fin: new Date().toISOString(), statut: apiErrors.length ? "partial" : "ok", nb_lignes: rows,
      credits_api_restants: remaining, erreur: apiErrors.length ? JSON.stringify(apiErrors) : null,
    }).eq("id", log!.id);
    return json({ ok: true, rows, remaining, apiErrors });
  } catch (e) {
    await sb.from("sync_logs").update({ fin: new Date().toISOString(), statut: "error", erreur: String(e), nb_lignes: rows }).eq("id", log!.id);
    return json({ ok: false, error: String(e) }, 500);
  }
});
