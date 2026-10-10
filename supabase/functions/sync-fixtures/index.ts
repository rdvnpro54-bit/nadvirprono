import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const API = "https://v3.football.api-sports.io";

async function apiGet(path: string, key: string, tries = 3): Promise<{ json: any; remaining: number | null }> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(API + path, { headers: { "x-apisports-key": key } });
    if (r.ok) {
      const rem = r.headers.get("x-ratelimit-requests-remaining");
      return { json: await r.json(), remaining: rem ? Number(rem) : null };
    }
    await new Promise((res) => setTimeout(res, 500 * 2 ** i));
  }
  throw new Error(`API-Football failed: ${path}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const key = Deno.env.get("API_FOOTBALL_KEY");
  const { data: log } = await sb.from("sync_logs").insert({ job: "sync-fixtures", source: "api-football" }).select("id").single();
  let rows = 0, remaining: number | null = null;
  try {
    if (!key) throw new Error("API_FOOTBALL_KEY manquante");
    const { data: leagues } = await sb.from("leagues").select("api_league_id").eq("actif", true);
    const active = new Set((leagues ?? []).map((l) => l.api_league_id));
    // One call per day (J..J+7), filtered on active leagues — cheapest on quota.
    for (let d = 0; d < 8; d++) {
      const date = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
      const res = await apiGet(`/fixtures?date=${date}&timezone=Europe/Paris`, key);
      remaining = res.remaining ?? remaining;
      const items = (res.json?.response ?? []).filter((f: any) => active.has(f.league?.id));
      const upserts = items.map((f: any) => ({
        fixture_id: f.fixture.id,
        sport: "football",
        league_name: f.league.name,
        league_country: f.league.country,
        home_team: f.teams.home.name,
        away_team: f.teams.away.name,
        home_logo: f.teams.home.logo,
        away_logo: f.teams.away.logo,
        kickoff: f.fixture.date,
        status: f.fixture.status.short,
        home_score: f.goals.home,
        away_score: f.goals.away,
        fetched_at: new Date().toISOString(),
      }));
      if (upserts.length) {
        const { error } = await sb.from("cached_matches").upsert(upserts, { onConflict: "fixture_id,sport" });
        if (error) throw error;
        rows += upserts.length;
      }
    }
    await sb.from("sync_logs").update({ fin: new Date().toISOString(), statut: "ok", nb_lignes: rows, credits_api_restants: remaining }).eq("id", log!.id);
    return new Response(JSON.stringify({ ok: true, rows, remaining }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    await sb.from("sync_logs").update({ fin: new Date().toISOString(), statut: "error", erreur: String(e), nb_lignes: rows }).eq("id", log!.id);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
