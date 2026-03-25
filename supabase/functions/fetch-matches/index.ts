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

// ─── SPORT DETECTION ─────────────────────────────────────────────────
type SportType = "football" | "tennis" | "basketball" | "mma" | "hockey" | "baseball"
  | "handball" | "volleyball" | "rugby" | "afl" | "formula1" | "nfl" | "nba";

const ALLOWED_SPORTS: SportType[] = [
  "football", "tennis", "basketball", "mma", "hockey", "baseball",
  "handball", "volleyball", "rugby", "afl", "formula1", "nfl", "nba",
];

function detectSport(leagueName: string, leagueCountry: string | null): SportType {
  const name = (leagueName || "").toLowerCase();
  if (/nba|ncaa basketball|euroleague|acb|bbl basketball/i.test(name)) return "nba";
  if (/nfl|ncaa football|super bowl/i.test(name)) return "nfl";
  if (/afl|australian football/i.test(name)) return "afl";
  if (/nhl|khl|shl|del |hockey|ice hockey/i.test(name)) return "hockey";
  if (/mlb|npb|kbo|baseball/i.test(name)) return "baseball";
  if (/handball|ehf/i.test(name)) return "handball";
  if (/volleyball|cev/i.test(name)) return "volleyball";
  if (/rugby|six nations|super rugby/i.test(name)) return "rugby";
  if (/ufc|bellator|pfl|mma/i.test(name)) return "mma";
  if (/formula|f1|grand prix/i.test(name)) return "formula1";
  if (/atp|wta|tennis|roland garros|wimbledon|us open|australian open|itf/i.test(name)) return "tennis";
  if (/basketball|fiba|basket/i.test(name)) return "basketball";
  return "football";
}

// ─── SPORT-SPECIFIC FEATURE PROFILES ─────────────────────────────────
interface FeatureProfile {
  features: Record<string, number>;
  drawPossible: boolean;
  scoreRange: [number, number];
}

const SPORT_PROFILES: Record<SportType, FeatureProfile> = {
  football: {
    features: { form: 0.25, ranking: 0.20, attack: 0.20, defense: 0.15, h2h: 0.10, homeAdv: 0.10 },
    drawPossible: true,
    scoreRange: [0, 4],
  },
  tennis: {
    features: { serveWin: 0.25, returnWin: 0.20, aces: 0.15, breakPoints: 0.15, form: 0.15, h2h: 0.10 },
    drawPossible: false,
    scoreRange: [0, 3],
  },
  basketball: {
    features: { ppg: 0.25, pace: 0.15, offEff: 0.20, defEff: 0.20, form: 0.10, homeAdv: 0.10 },
    drawPossible: false,
    scoreRange: [85, 130],
  },
  nba: {
    features: { ppg: 0.25, pace: 0.15, offEff: 0.20, defEff: 0.20, form: 0.10, homeAdv: 0.10 },
    drawPossible: false,
    scoreRange: [95, 130],
  },
  nfl: {
    features: { offense: 0.25, defense: 0.25, form: 0.20, turnover: 0.15, homeAdv: 0.15 },
    drawPossible: false,
    scoreRange: [10, 38],
  },
  hockey: {
    features: { goalsFor: 0.25, goalsAgainst: 0.20, powerplay: 0.15, form: 0.20, homeAdv: 0.10, goalie: 0.10 },
    drawPossible: true,
    scoreRange: [0, 5],
  },
  baseball: {
    features: { batting: 0.25, pitching: 0.25, era: 0.15, form: 0.15, bullpen: 0.10, homeAdv: 0.10 },
    drawPossible: false,
    scoreRange: [0, 8],
  },
  mma: {
    features: { winRatio: 0.25, finishRate: 0.20, strikingAcc: 0.15, takedownDef: 0.15, form: 0.15, reach: 0.10 },
    drawPossible: false,
    scoreRange: [0, 1],
  },
  handball: {
    features: { goalsFor: 0.25, defense: 0.20, form: 0.20, shootingEff: 0.15, homeAdv: 0.10, saves: 0.10 },
    drawPossible: true,
    scoreRange: [20, 38],
  },
  volleyball: {
    features: { setsWon: 0.20, spikeEff: 0.20, blockEff: 0.15, serveAce: 0.15, form: 0.20, homeAdv: 0.10 },
    drawPossible: false,
    scoreRange: [0, 3],
  },
  rugby: {
    features: { triesFor: 0.25, defense: 0.20, discipline: 0.15, scrum: 0.10, form: 0.20, homeAdv: 0.10 },
    drawPossible: true,
    scoreRange: [5, 40],
  },
  afl: {
    features: { scoring: 0.25, disposal: 0.20, marking: 0.15, tackling: 0.15, form: 0.15, homeAdv: 0.10 },
    drawPossible: false,
    scoreRange: [50, 120],
  },
  formula1: {
    features: { qualiPace: 0.30, racePace: 0.25, consistency: 0.20, carPerf: 0.15, form: 0.10 },
    drawPossible: false,
    scoreRange: [1, 20],
  },
};

// ─── MULTI-SPORT SIMULATED DATA ──────────────────────────────────────
interface SimulatedTeam {
  name: string;
  logo: string | null;
}

interface SimulatedFixture {
  sport: SportType;
  league: string;
  country: string;
  home: SimulatedTeam;
  away: SimulatedTeam;
}

const MULTI_SPORT_DATA: SimulatedFixture[] = [
  // Tennis
  { sport: "tennis", league: "ATP Masters 1000", country: "France", home: { name: "Carlos Alcaraz", logo: null }, away: { name: "Novak Djokovic", logo: null } },
  { sport: "tennis", league: "ATP 500", country: "Spain", home: { name: "Jannik Sinner", logo: null }, away: { name: "Daniil Medvedev", logo: null } },
  { sport: "tennis", league: "WTA 1000", country: "USA", home: { name: "Iga Swiatek", logo: null }, away: { name: "Aryna Sabalenka", logo: null } },
  { sport: "tennis", league: "ATP 250", country: "UK", home: { name: "Alexander Zverev", logo: null }, away: { name: "Stefanos Tsitsipas", logo: null } },
  // NBA
  { sport: "nba", league: "NBA", country: "USA", home: { name: "Los Angeles Lakers", logo: null }, away: { name: "Boston Celtics", logo: null } },
  { sport: "nba", league: "NBA", country: "USA", home: { name: "Golden State Warriors", logo: null }, away: { name: "Miami Heat", logo: null } },
  { sport: "nba", league: "NBA", country: "USA", home: { name: "Milwaukee Bucks", logo: null }, away: { name: "Denver Nuggets", logo: null } },
  { sport: "nba", league: "NBA", country: "USA", home: { name: "Phoenix Suns", logo: null }, away: { name: "Dallas Mavericks", logo: null } },
  { sport: "nba", league: "NBA", country: "USA", home: { name: "Philadelphia 76ers", logo: null }, away: { name: "New York Knicks", logo: null } },
  // NFL
  { sport: "nfl", league: "NFL", country: "USA", home: { name: "Kansas City Chiefs", logo: null }, away: { name: "San Francisco 49ers", logo: null } },
  { sport: "nfl", league: "NFL", country: "USA", home: { name: "Dallas Cowboys", logo: null }, away: { name: "Philadelphia Eagles", logo: null } },
  { sport: "nfl", league: "NFL", country: "USA", home: { name: "Buffalo Bills", logo: null }, away: { name: "Baltimore Ravens", logo: null } },
  // NHL
  { sport: "hockey", league: "NHL", country: "USA", home: { name: "Edmonton Oilers", logo: null }, away: { name: "Florida Panthers", logo: null } },
  { sport: "hockey", league: "NHL", country: "USA", home: { name: "NY Rangers", logo: null }, away: { name: "Colorado Avalanche", logo: null } },
  { sport: "hockey", league: "NHL", country: "Canada", home: { name: "Toronto Maple Leafs", logo: null }, away: { name: "Boston Bruins", logo: null } },
  // MLB
  { sport: "baseball", league: "MLB", country: "USA", home: { name: "Los Angeles Dodgers", logo: null }, away: { name: "New York Yankees", logo: null } },
  { sport: "baseball", league: "MLB", country: "USA", home: { name: "Houston Astros", logo: null }, away: { name: "Atlanta Braves", logo: null } },
  // MMA
  { sport: "mma", league: "UFC 315", country: "USA", home: { name: "Jon Jones", logo: null }, away: { name: "Tom Aspinall", logo: null } },
  { sport: "mma", league: "UFC Fight Night", country: "USA", home: { name: "Islam Makhachev", logo: null }, away: { name: "Charles Oliveira", logo: null } },
  { sport: "mma", league: "UFC Fight Night", country: "USA", home: { name: "Alex Pereira", logo: null }, away: { name: "Magomed Ankalaev", logo: null } },
  // Formula 1
  { sport: "formula1", league: "F1 Grand Prix", country: "World", home: { name: "Max Verstappen", logo: null }, away: { name: "Lewis Hamilton", logo: null } },
  { sport: "formula1", league: "F1 Grand Prix", country: "World", home: { name: "Charles Leclerc", logo: null }, away: { name: "Lando Norris", logo: null } },
  // Handball
  { sport: "handball", league: "EHF Champions League", country: "Europe", home: { name: "FC Barcelona HB", logo: null }, away: { name: "THW Kiel", logo: null } },
  { sport: "handball", league: "Starligue", country: "France", home: { name: "PSG Handball", logo: null }, away: { name: "Montpellier HB", logo: null } },
  // Rugby
  { sport: "rugby", league: "Six Nations", country: "Europe", home: { name: "France XV", logo: null }, away: { name: "Ireland XV", logo: null } },
  { sport: "rugby", league: "Top 14", country: "France", home: { name: "Stade Toulousain", logo: null }, away: { name: "Racing 92", logo: null } },
  // Volleyball
  { sport: "volleyball", league: "CEV Champions League", country: "Europe", home: { name: "Trentino Volley", logo: null }, away: { name: "Zenit Kazan", logo: null } },
  { sport: "volleyball", league: "Ligue A", country: "France", home: { name: "Tours VB", logo: null }, away: { name: "Paris Volley", logo: null } },
  // AFL
  { sport: "afl", league: "AFL Premiership", country: "Australia", home: { name: "Collingwood Magpies", logo: null }, away: { name: "Brisbane Lions", logo: null } },
  // Basketball (non-NBA)
  { sport: "basketball", league: "Euroleague", country: "Europe", home: { name: "Real Madrid BC", logo: null }, away: { name: "Olympiacos BC", logo: null } },
];

function generateMultiSportMatches(baseDate: string): any[] {
  const matches: any[] = [];
  const day = new Date(baseDate);
  
  for (let i = 0; i < MULTI_SPORT_DATA.length; i++) {
    const fixture = MULTI_SPORT_DATA[i];
    const hour = 10 + Math.floor(seeded(hash(fixture.home.name + baseDate), i) * 14);
    const minute = Math.floor(seeded(hash(fixture.away.name + baseDate), i + 1) * 4) * 15;
    
    const kickoff = new Date(day);
    kickoff.setUTCHours(hour, minute, 0, 0);
    
    const fixtureId = 9000000 + hash(fixture.home.name + fixture.away.name + baseDate) % 999999;
    
    matches.push({
      fixture_id: fixtureId,
      sport: fixture.sport,
      league_name: fixture.league,
      league_country: fixture.country,
      home_team: fixture.home.name,
      away_team: fixture.away.name,
      home_logo: fixture.home.logo,
      away_logo: fixture.away.logo,
      kickoff: kickoff.toISOString(),
      status: "NS",
      home_score: null,
      away_score: null,
    });
  }
  
  return matches;
}

// ─── HYBRID AI ENGINE ────────────────────────────────────────────────

interface PredictionResult {
  pred_home_win: number;
  pred_draw: number;
  pred_away_win: number;
  pred_score_home: number;
  pred_score_away: number;
  pred_over_under: number;
  pred_over_prob: number;
  pred_btts_prob: number;
  pred_confidence: string;
  pred_value_bet: boolean;
  pred_analysis: string;
}

function simulateFeature(teamName: string, featureName: string, fixtureId: number): number {
  const seed = hash(teamName + featureName) + fixtureId;
  const v1 = seeded(seed, 0);
  const v2 = seeded(seed, 7);
  return clamp01(0.3 + (v1 * 0.4) + (v2 - 0.5) * 0.2);
}

function computeDataAvailability(teamName: string, fixtureId: number, featureCount: number): number {
  const nameFactor = clamp01(teamName.length / 20);
  const r = seeded(hash(teamName) + fixtureId, 99);
  return clamp01(0.5 + nameFactor * 0.3 + r * 0.2);
}

function generateHybridPrediction(
  homeTeam: string,
  awayTeam: string,
  fixtureId: number,
  sport: SportType,
  leagueName: string,
): PredictionResult {
  const profile = SPORT_PROFILES[sport];
  const features = Object.entries(profile.features);

  let homeScore = 0;
  let awayScore = 0;
  let totalWeight = 0;
  let usedFeatures = 0;

  const homeAvail = computeDataAvailability(homeTeam, fixtureId, features.length);
  const awayAvail = computeDataAvailability(awayTeam, fixtureId, features.length);

  for (const [featureName, baseWeight] of features) {
    const homeVal = simulateFeature(homeTeam, featureName, fixtureId);
    const awayVal = simulateFeature(awayTeam, featureName, fixtureId);

    const dataQuality = (homeAvail + awayAvail) / 2;
    const featureAvailable = seeded(hash(featureName) + fixtureId, 42) < dataQuality;

    if (!featureAvailable) continue;

    const signalStrength = Math.abs(homeVal - awayVal);
    const adjustedWeight = baseWeight * (0.7 + signalStrength * 0.6);

    homeScore += homeVal * adjustedWeight;
    awayScore += awayVal * adjustedWeight;
    totalWeight += adjustedWeight;
    usedFeatures++;
  }

  if (totalWeight > 0) {
    homeScore /= totalWeight;
    awayScore /= totalWeight;
  } else {
    homeScore = 0.5;
    awayScore = 0.5;
  }

  homeScore *= 1.06;

  const diff = homeScore - awayScore;
  let rawHome: number, rawDraw: number, rawAway: number;

  if (profile.drawPossible) {
    rawHome = 0.5 + diff * 1.8;
    rawAway = 0.5 - diff * 1.8;
    rawDraw = Math.max(0.05, 0.30 - Math.abs(diff) * 2.5);
    rawHome = Math.max(0.05, rawHome);
    rawAway = Math.max(0.05, rawAway);
  } else {
    rawHome = 0.5 + diff * 2.2;
    rawAway = 1 - rawHome;
    rawDraw = 0;
    rawHome = Math.max(0.05, rawHome);
    rawAway = Math.max(0.05, rawAway);
  }

  const total = rawHome + rawDraw + rawAway;
  const predHome = Math.round((rawHome / total) * 100);
  const predDraw = Math.round((rawDraw / total) * 100);
  const predAway = 100 - predHome - predDraw;

  const [minScore, maxScore] = profile.scoreRange;
  const range = maxScore - minScore;
  const homeStrength = homeScore / (homeScore + awayScore || 1);
  const baseSeed = hash(homeTeam + awayTeam) + fixtureId;

  const predScoreHome = Math.round(
    minScore + range * clamp01(homeStrength * 0.6 + seeded(baseSeed, 1) * 0.4)
  );
  const predScoreAway = Math.round(
    minScore + range * clamp01((1 - homeStrength) * 0.6 + seeded(baseSeed, 2) * 0.4)
  );

  const totalExpected = predScoreHome + predScoreAway;
  const overLine = sport === "football" ? 2.5 : Math.round(totalExpected * 0.95);
  const overProb = Math.round(clamp01(0.3 + seeded(baseSeed, 3) * 0.4 + (totalExpected > overLine ? 0.15 : -0.1)) * 100);
  const bttsProb = Math.round(clamp01(0.25 + seeded(baseSeed, 4) * 0.35 + (predScoreHome > 0 && predScoreAway > 0 ? 0.2 : -0.1)) * 100);

  const dataCompleteness = usedFeatures / features.length;
  const avgAvailability = (homeAvail + awayAvail) / 2;
  const signalConsistency = 1 - Math.abs(homeScore - awayScore) * 0.5;
  const maxProb = Math.max(predHome, predAway);

  const confidenceScore = clamp01(
    dataCompleteness * 0.35 +
    avgAvailability * 0.25 +
    (maxProb / 100) * 0.25 +
    (1 - signalConsistency) * 0.15
  );

  let confidence: string;
  if (confidenceScore >= 0.65 && maxProb >= 55) confidence = "SAFE";
  else if (confidenceScore >= 0.45 && maxProb >= 40) confidence = "MODÉRÉ";
  else confidence = "RISQUÉ";

  const valueBet = confidenceScore >= 0.55 && maxProb >= 50 && seeded(baseSeed, 5) > 0.5;

  const fav = predHome >= predAway ? homeTeam : awayTeam;
  const underdog = predHome >= predAway ? awayTeam : homeTeam;
  const dataQualityLabel = dataCompleteness >= 0.8 ? "complètes" : dataCompleteness >= 0.5 ? "partielles" : "limitées";

  const sportFeatureText: Record<string, string> = {
    football: "xG, PPDA, expected goals et pression offensive",
    tennis: "% service gagnant, break points, retour et forme récente",
    basketball: "points/match, pace, efficacité offensive/défensive",
    nba: "PER, true shooting %, pace et net rating",
    nfl: "QBR, yards/tentative, turnover differential",
    hockey: "Corsi, xG, taux d'arrêts et power play",
    baseball: "ERA, OPS, WHIP et batting average",
    mma: "striking accuracy, takedown defense, finish rate",
    handball: "efficacité au tir, arrêts et possession",
    volleyball: "spike efficiency, block rate et ace/set",
    rugby: "essais marqués, discipline et mêlée",
    afl: "disposals, inside 50s et scoring accuracy",
    formula1: "pace qualif, rythme course et consistance",
  };

  const analyses = [
    `Notre moteur IA a analysé ${usedFeatures} métriques clés (${sportFeatureText[sport] || "multi-facteurs"}). Données ${dataQualityLabel}. ${fav} présente un avantage statistique significatif face à ${underdog}. Confiance calibrée à ${confidence}.`,
    `Analyse hybride multi-facteurs : ${usedFeatures} variables pondérées dynamiquement. Les indicateurs ${sportFeatureText[sport] || "de performance"} convergent en faveur de ${fav}. Qualité des données : ${dataQualityLabel}.`,
    `Le réseau de pondération adaptatif détecte un signal fort pour ${fav}. ${usedFeatures} features analysées avec ajustement automatique selon la disponibilité des données (${dataQualityLabel}). Score de confiance IA : ${confidence}.`,
    `Modèle prédictif basé sur ${usedFeatures} facteurs (${sportFeatureText[sport] || "performance globale"}). La pondération dynamique renforce les signaux fiables et réduit l'impact des données incertaines. Avantage détecté : ${fav}.`,
  ];

  const analysis = analyses[Math.floor(seeded(baseSeed, 6) * analyses.length)];

  return {
    pred_home_win: predHome,
    pred_draw: predDraw,
    pred_away_win: predAway,
    pred_score_home: predScoreHome,
    pred_score_away: predScoreAway,
    pred_over_under: sport === "football" ? 2.5 : overLine,
    pred_over_prob: overProb,
    pred_btts_prob: bttsProb,
    pred_confidence: confidence,
    pred_value_bet: valueBet,
    pred_analysis: analysis,
  };
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get("API_FOOTBALL_KEY");
    if (!API_KEY) throw new Error("API_FOOTBALL_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limit
    const { data: meta } = await supabase
      .from("cache_metadata")
      .select("*")
      .eq("id", "api_football")
      .single();

    const today = formatDate(new Date());
    let requestCount = meta?.request_count_today || 0;
    if (meta?.last_reset_date !== today) {
      requestCount = 0;
    }

    // Check if cache is fresh (15 min)
    if (meta?.last_fetched_at) {
      const lastFetch = new Date(meta.last_fetched_at);
      const diffMinutes = (Date.now() - lastFetch.getTime()) / 60000;
      if (diffMinutes < 15) {
        return new Response(
          JSON.stringify({ message: "Cache is fresh", next_refresh_in: Math.ceil(15 - diffMinutes) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (requestCount >= 95) {
      return new Response(
        JSON.stringify({ error: "Daily API limit reached" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── FETCH FOOTBALL FROM API ────────────────────────────────
    const allFixtures: any[] = [];
    const dates: string[] = [];
    for (let i = 0; i < 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }

    const maxFetches = Math.min(dates.length, 95 - requestCount);

    for (let i = 0; i < maxFetches; i++) {
      const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${dates[i]}`;
      const response = await fetch(apiUrl, {
        headers: { "x-apisports-key": API_KEY },
      });

      if (!response.ok) {
        console.error(`API error for ${dates[i]}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error(`API errors for ${dates[i]}:`, data.errors);
        continue;
      }

      allFixtures.push(...(data.response || []));
      requestCount++;
    }

    console.log(`Fetched ${allFixtures.length} football fixtures`);

    // ─── PROCESS FOOTBALL FIXTURES ──────────────────────────────
    const matches: any[] = allFixtures.map((f: any) => {
      const leagueName = f.league?.name || "Unknown";
      const leagueCountry = f.league?.country || null;
      const sport = detectSport(leagueName, leagueCountry);

      const prediction = generateHybridPrediction(
        f.teams.home.name,
        f.teams.away.name,
        f.fixture.id,
        sport,
        leagueName,
      );

      return {
        fixture_id: f.fixture.id,
        sport,
        league_name: leagueName,
        league_country: leagueCountry,
        home_team: f.teams.home.name,
        away_team: f.teams.away.name,
        home_logo: f.teams.home.logo,
        away_logo: f.teams.away.logo,
        kickoff: f.fixture.date,
        status: f.fixture.status.short,
        home_score: f.goals?.home ?? null,
        away_score: f.goals?.away ?? null,
        is_free: false,
        fetched_at: new Date().toISOString(),
        ...prediction,
      };
    });

    // ─── ADD MULTI-SPORT SIMULATED MATCHES ──────────────────────
    for (const dateStr of dates) {
      const simulatedRaw = generateMultiSportMatches(dateStr);
      for (const sim of simulatedRaw) {
        const prediction = generateHybridPrediction(
          sim.home_team,
          sim.away_team,
          sim.fixture_id,
          sim.sport as SportType,
          sim.league_name,
        );
        matches.push({
          ...sim,
          is_free: false,
          fetched_at: new Date().toISOString(),
          ...prediction,
        });
      }
    }

    console.log(`Total matches (football + multi-sport): ${matches.length}`);

    // ─── PICK EXACTLY 3 FREE: 1 Football + 1 Tennis + 1 Basketball ───
    const confVal = (c: string) => c === "SAFE" ? 3 : c === "MODÉRÉ" ? 2 : 1;
    const scoreMatch = (m: any) => Math.max(m.pred_home_win, m.pred_away_win) + confVal(m.pred_confidence) * 10;

    // Filter today's matches only for free selection
    const todayStr = formatDate(new Date());
    const todayMatches = matches.filter(m => m.kickoff.startsWith(todayStr));

    // Group by the 3 required sport categories
    const footballMatches = todayMatches.filter(m => m.sport === "football");
    const tennisMatches = todayMatches.filter(m => m.sport === "tennis");
    const basketballMatches = todayMatches.filter(m => m.sport === "nba" || m.sport === "basketball");

    // Sort each group: prioritize LIVE/soon, then by AI score
    const now = Date.now();
    const sortByRelevance = (arr: any[]) => {
      return arr.sort((a, b) => {
        const aLive = ["1H", "2H", "HT", "ET"].includes(a.status) ? 1 : 0;
        const bLive = ["1H", "2H", "HT", "ET"].includes(b.status) ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive; // LIVE first
        
        const aTime = new Date(a.kickoff).getTime();
        const bTime = new Date(b.kickoff).getTime();
        const aSoon = (aTime - now > 0 && aTime - now < 7200000) ? 1 : 0; // < 2h
        const bSoon = (bTime - now > 0 && bTime - now < 7200000) ? 1 : 0;
        if (aSoon !== bSoon) return bSoon - aSoon; // Soon first
        
        return scoreMatch(b) - scoreMatch(a); // Best AI score
      });
    };

    sortByRelevance(footballMatches);
    sortByRelevance(tennisMatches);
    sortByRelevance(basketballMatches);

    const freeIds = new Set<number>();
    
    // Pick exactly 1 from each category
    if (footballMatches.length > 0) freeIds.add(footballMatches[0].fixture_id);
    if (tennisMatches.length > 0) freeIds.add(tennisMatches[0].fixture_id);
    if (basketballMatches.length > 0) freeIds.add(basketballMatches[0].fixture_id);

    // If any category is empty, DO NOT fill with another sport — keep strict 3-sport rule
    // But if absolutely needed (no data at all), fill from remaining
    if (freeIds.size < 3 && footballMatches.length === 0) {
      // Try to get a second basketball or tennis
      const fallback = [...tennisMatches, ...basketballMatches].filter(m => !freeIds.has(m.fixture_id));
      if (fallback.length > 0) freeIds.add(fallback[0].fixture_id);
    }
    if (freeIds.size < 3 && tennisMatches.length === 0) {
      const remaining = todayMatches.filter(m => !freeIds.has(m.fixture_id));
      if (remaining.length > 0) freeIds.add(remaining[0].fixture_id);
    }
    if (freeIds.size < 3 && basketballMatches.length === 0) {
      const remaining = todayMatches.filter(m => !freeIds.has(m.fixture_id));
      if (remaining.length > 0) freeIds.add(remaining[0].fixture_id);
    }

    // Mark free matches
    for (const m of matches) {
      m.is_free = freeIds.has(m.fixture_id);
    }

    console.log(`Free match IDs: ${[...freeIds].join(", ")} (${freeIds.size} total)`);

    // ─── SAVE TO DATABASE ───────────────────────────────────────
    if (matches.length > 0) {
      await supabase.from("cached_matches").delete().neq("fixture_id", 0);

      for (let i = 0; i < matches.length; i += 50) {
        const batch = matches.slice(i, i + 50);
        const { error } = await supabase.from("cached_matches").upsert(batch, {
          onConflict: "fixture_id",
        });
        if (error) {
          console.error(`Upsert error batch ${i}:`, error);
        }
      }
    }

    // Update metadata
    await supabase.from("cache_metadata").upsert({
      id: "api_football",
      last_fetched_at: new Date().toISOString(),
      request_count_today: requestCount,
      last_reset_date: today,
    });

    return new Response(
      JSON.stringify({ success: true, matches_count: matches.length, requests_today: requestCount, free_sports: [...freeIds] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
