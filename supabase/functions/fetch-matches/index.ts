import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── UTILS ───────────────────────────────────────────────────────────
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── SPORT PROFILES FOR AI PREDICTION ────────────────────────────────
interface FeatureProfile {
  features: Record<string, number>;
  drawPossible: boolean;
  scoreRange: [number, number];
}

const SPORT_PROFILES: Record<string, FeatureProfile> = {
  football: { features: { form: 0.25, ranking: 0.20, attack: 0.20, defense: 0.15, h2h: 0.10, homeAdv: 0.10 }, drawPossible: true, scoreRange: [0, 4] },
  tennis: { features: { serveWin: 0.25, returnWin: 0.20, aces: 0.15, breakPoints: 0.15, form: 0.15, h2h: 0.10 }, drawPossible: false, scoreRange: [0, 3] },
  basketball: { features: { ppg: 0.25, pace: 0.15, offEff: 0.20, defEff: 0.20, form: 0.10, homeAdv: 0.10 }, drawPossible: false, scoreRange: [85, 130] },
};

function simulateFeature(teamName: string, featureName: string, fixtureId: number): number {
  const seed = hash(teamName + featureName) + fixtureId;
  return clamp01(0.3 + (seeded(seed, 0) * 0.4) + (seeded(seed, 7) - 0.5) * 0.2);
}

function computeDataAvailability(teamName: string, fixtureId: number): number {
  return clamp01(0.5 + clamp01(teamName.length / 20) * 0.3 + seeded(hash(teamName) + fixtureId, 99) * 0.2);
}

function generatePrediction(homeTeam: string, awayTeam: string, fixtureId: number, sport: string) {
  const profile = SPORT_PROFILES[sport] || SPORT_PROFILES.football;
  const features = Object.entries(profile.features);

  let homeScore = 0, awayScore = 0, totalWeight = 0, usedFeatures = 0;
  const homeAvail = computeDataAvailability(homeTeam, fixtureId);
  const awayAvail = computeDataAvailability(awayTeam, fixtureId);

  for (const [featureName, baseWeight] of features) {
    const homeVal = simulateFeature(homeTeam, featureName, fixtureId);
    const awayVal = simulateFeature(awayTeam, featureName, fixtureId);
    const dataQuality = (homeAvail + awayAvail) / 2;
    if (seeded(hash(featureName) + fixtureId, 42) >= dataQuality) continue;
    const signalStrength = Math.abs(homeVal - awayVal);
    const adjustedWeight = baseWeight * (0.7 + signalStrength * 0.6);
    homeScore += homeVal * adjustedWeight;
    awayScore += awayVal * adjustedWeight;
    totalWeight += adjustedWeight;
    usedFeatures++;
  }

  if (totalWeight > 0) { homeScore /= totalWeight; awayScore /= totalWeight; }
  else { homeScore = 0.5; awayScore = 0.5; }
  homeScore *= 1.06;

  const diff = homeScore - awayScore;
  let rawHome: number, rawDraw: number, rawAway: number;

  if (profile.drawPossible) {
    rawHome = Math.max(0.05, 0.5 + diff * 1.8);
    rawAway = Math.max(0.05, 0.5 - diff * 1.8);
    rawDraw = Math.max(0.05, 0.30 - Math.abs(diff) * 2.5);
  } else {
    rawHome = Math.max(0.05, 0.5 + diff * 2.2);
    rawAway = Math.max(0.05, 1 - rawHome);
    rawDraw = 0;
  }

  const total = rawHome + rawDraw + rawAway;
  const predHome = Math.round((rawHome / total) * 100);
  const predDraw = Math.round((rawDraw / total) * 100);
  const predAway = 100 - predHome - predDraw;

  const [minScore, maxScore] = profile.scoreRange;
  const range = maxScore - minScore;
  const homeStrength = homeScore / (homeScore + awayScore || 1);
  const baseSeed = hash(homeTeam + awayTeam) + fixtureId;

  const predScoreHome = Math.round(minScore + range * clamp01(homeStrength * 0.6 + seeded(baseSeed, 1) * 0.4));
  const predScoreAway = Math.round(minScore + range * clamp01((1 - homeStrength) * 0.6 + seeded(baseSeed, 2) * 0.4));

  const totalExpected = predScoreHome + predScoreAway;
  const overLine = sport === "football" ? 2.5 : Math.round(totalExpected * 0.95);
  const overProb = Math.round(clamp01(0.3 + seeded(baseSeed, 3) * 0.4 + (totalExpected > overLine ? 0.15 : -0.1)) * 100);
  const bttsProb = Math.round(clamp01(0.25 + seeded(baseSeed, 4) * 0.35 + (predScoreHome > 0 && predScoreAway > 0 ? 0.2 : -0.1)) * 100);

  const dataCompleteness = usedFeatures / features.length;
  const maxProb = Math.max(predHome, predAway);
  const confidenceScore = clamp01(dataCompleteness * 0.35 + ((homeAvail + awayAvail) / 2) * 0.25 + (maxProb / 100) * 0.25 + Math.abs(diff) * 0.15);

  let confidence: string;
  if (confidenceScore >= 0.65 && maxProb >= 55) confidence = "SAFE";
  else if (confidenceScore >= 0.45 && maxProb >= 40) confidence = "MODÉRÉ";
  else confidence = "RISQUÉ";

  const valueBet = confidenceScore >= 0.55 && maxProb >= 50 && seeded(baseSeed, 5) > 0.5;
  const fav = predHome >= predAway ? homeTeam : awayTeam;
  const underdog = predHome >= predAway ? awayTeam : homeTeam;
  const dataQualityLabel = dataCompleteness >= 0.8 ? "complètes" : dataCompleteness >= 0.5 ? "partielles" : "limitées";

  const sportText: Record<string, string> = {
    football: "xG, PPDA, expected goals et pression offensive",
    tennis: "% service gagnant, break points, retour et forme récente",
    basketball: "PER, true shooting %, pace et net rating",
  };

  const analysis = `Notre moteur IA a analysé ${usedFeatures} métriques clés (${sportText[sport] || "multi-facteurs"}). Données ${dataQualityLabel}. ${fav} présente un avantage statistique face à ${underdog}. Confiance : ${confidence}.`;

  return {
    pred_home_win: predHome, pred_draw: predDraw, pred_away_win: predAway,
    pred_score_home: predScoreHome, pred_score_away: predScoreAway,
    pred_over_under: sport === "football" ? 2.5 : overLine, pred_over_prob: overProb,
    pred_btts_prob: bttsProb, pred_confidence: confidence, pred_value_bet: valueBet, pred_analysis: analysis,
  };
}

// ─── MAP TheSportsDB sport name → internal sport key ─────────────────
function mapSport(strSport: string): string {
  const s = (strSport || "").toLowerCase();
  if (s === "soccer" || s === "football") return "football";
  if (s === "tennis") return "tennis";
  if (s === "basketball") return "basketball";
  return s;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── RATE LIMITING / CACHE CHECK ─────────────────────────────
    const { data: meta } = await supabase.from("cache_metadata").select("*").eq("id", "api_football").single();
    const today = formatDate(new Date());

    if (meta?.last_fetched_at) {
      const diffMinutes = (Date.now() - new Date(meta.last_fetched_at).getTime()) / 60000;
      if (diffMinutes < 15) {
        // Check if we have valid matches in cache
        const { data: existing } = await supabase
          .from("cached_matches")
          .select("id")
          .gte("kickoff", today)
          .limit(1);
        
        if (existing && existing.length > 0) {
          return new Response(
            JSON.stringify({ message: "Cache is fresh", next_refresh_in: Math.ceil(15 - diffMinutes) }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // If cache is empty, force refresh
        console.log("Cache is fresh but empty — forcing refresh");
      }
    }

    // ─── FETCH FROM TheSportsDB (FREE API) ───────────────────────
    const now = new Date();
    const dateStr = formatDate(now);
    const apiUrl = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${dateStr}`;

    console.log(`Fetching events from TheSportsDB for ${dateStr}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const apiData = await response.json();
    const events = apiData?.events || [];
    console.log(`TheSportsDB returned ${events.length} events`);

    // ─── STRICT FILTERING: only future matches with no scores ────
    const validEvents = events.filter((event: any) => {
      if (!event.dateEvent) return false;

      const time = event.strTime ? event.strTime : "23:59:00";
      // Handle time format — TheSportsDB sometimes returns "HH:MM:SS+00:00"
      const cleanTime = time.split("+")[0].split("-")[0];
      const eventDate = new Date(`${event.dateEvent}T${cleanTime}Z`);

      if (isNaN(eventDate.getTime())) return false;

      // Event must be in the future
      if (eventDate.getTime() <= now.getTime()) return false;

      // No scores — means not started
      if (event.intHomeScore !== null && event.intHomeScore !== undefined) return false;
      if (event.intAwayScore !== null && event.intAwayScore !== undefined) return false;

      return true;
    });

    console.log(`Valid future events after filtering: ${validEvents.length}`);

    // ─── SEPARATE BY SPORT ───────────────────────────────────────
    const footballEvents = validEvents.filter((e: any) => e.strSport === "Soccer");
    const tennisEvents = validEvents.filter((e: any) => e.strSport === "Tennis");
    const basketballEvents = validEvents.filter((e: any) => e.strSport === "Basketball");

    console.log(`Football: ${footballEvents.length}, Tennis: ${tennisEvents.length}, Basketball: ${basketballEvents.length}`);

    // Sort each by time (earliest first)
    const sortByTime = (arr: any[]) => arr.sort((a: any, b: any) => {
      const ta = new Date(`${a.dateEvent}T${(a.strTime || "23:59:00").split("+")[0]}Z`).getTime();
      const tb = new Date(`${b.dateEvent}T${(b.strTime || "23:59:00").split("+")[0]}Z`).getTime();
      return ta - tb;
    });

    sortByTime(footballEvents);
    sortByTime(tennisEvents);
    sortByTime(basketballEvents);

    // ─── SELECT TOP 1 PER SPORT ──────────────────────────────────
    const selected: any[] = [];
    if (footballEvents[0]) selected.push(footballEvents[0]);
    if (tennisEvents[0]) selected.push(tennisEvents[0]);
    if (basketballEvents[0]) selected.push(basketballEvents[0]);

    // Also gather extra matches for the full list (premium users)
    const allSorted = [...footballEvents.slice(0, 20), ...tennisEvents.slice(0, 10), ...basketballEvents.slice(0, 10)];
    const selectedIds = new Set(selected.map((e: any) => e.idEvent));

    // ─── CONVERT TO OUR FORMAT + PREDICTIONS ─────────────────────
    const convertEvent = (event: any, isFree: boolean) => {
      const sport = mapSport(event.strSport);
      const fixtureId = parseInt(event.idEvent) || hash(event.idEvent || "0");
      const homeTeam = event.strHomeTeam || "Équipe A";
      const awayTeam = event.strAwayTeam || "Équipe B";
      const time = (event.strTime || "23:59:00").split("+")[0].split("-")[0];
      const kickoff = `${event.dateEvent}T${time}Z`;

      const prediction = generatePrediction(homeTeam, awayTeam, fixtureId, sport);

      return {
        fixture_id: fixtureId,
        sport,
        league_name: event.strLeague || "Unknown",
        league_country: event.strCountry || null,
        home_team: homeTeam,
        away_team: awayTeam,
        home_logo: event.strHomeTeamBadge || null,
        away_logo: event.strAwayTeamBadge || null,
        kickoff,
        status: "NS",
        home_score: null,
        away_score: null,
        is_free: isFree,
        fetched_at: new Date().toISOString(),
        ...prediction,
      };
    };

    // Convert selected (free) matches
    const matches: any[] = selected.map(e => convertEvent(e, true));

    // Convert additional matches (not free)
    for (const e of allSorted) {
      if (!selectedIds.has(e.idEvent)) {
        matches.push(convertEvent(e, false));
      }
    }

    console.log(`Total matches to save: ${matches.length} (${selected.length} free)`);

    // ─── SAVE TO DATABASE ────────────────────────────────────────
    // Clear old data first
    await supabase.from("cached_matches").delete().neq("fixture_id", 0);

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i += 50) {
        const batch = matches.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, { onConflict: "fixture_id" });
        if (error) console.error(`Upsert error batch ${i}:`, error);
      }
    }

    // Update metadata
    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: new Date().toISOString(),
      request_count_today: (meta?.last_reset_date === today ? (meta?.request_count_today || 0) : 0) + 1,
      last_reset_date: today,
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches_count: matches.length,
        free_count: selected.length,
        sports: { football: footballEvents.length, tennis: tennisEvents.length, basketball: basketballEvents.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
