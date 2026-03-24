// ==========================================
// NADVIR AI — Simulated Sports Data Engine
// ==========================================

export type Sport = "football" | "tennis" | "basketball";
export type Confidence = "SAFE" | "MODÉRÉ" | "RISQUÉ";
export type MatchResult = "W" | "D" | "L";

export interface TeamForm {
  last5: MatchResult[];
  goalsScored: number;
  goalsConceded: number;
}

export interface InjuredPlayer {
  name: string;
  reason: string;
}

export interface TeamInfo {
  name: string;
  logo?: string;
  rating: number;
  form: TeamForm;
  injured: InjuredPlayer[];
  leaguePosition: number;
  league: string;
}

export interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: [number, number];
  overUnder25: { over: number; under: number };
  btts: { yes: number; no: number };
  confidence: Confidence;
  confidenceScore: number;
  valueBet: boolean;
  valueBetType?: string;
  aiExplanation: string;
}

export interface Match {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  prediction: Prediction;
  kickoff: string;
  isFree: boolean;
}

// ===== FOOTBALL DATA =====
const footballTeams: Record<string, { teams: Omit<TeamInfo, "form" | "injured" | "leaguePosition">[]; league: string }> = {
  "Premier League": {
    league: "Premier League",
    teams: [
      { name: "Manchester City", rating: 92, league: "Premier League" },
      { name: "Arsenal", rating: 90, league: "Premier League" },
      { name: "Liverpool", rating: 89, league: "Premier League" },
      { name: "Chelsea", rating: 84, league: "Premier League" },
      { name: "Manchester United", rating: 82, league: "Premier League" },
      { name: "Tottenham", rating: 81, league: "Premier League" },
      { name: "Newcastle", rating: 83, league: "Premier League" },
      { name: "Aston Villa", rating: 80, league: "Premier League" },
      { name: "Brighton", rating: 78, league: "Premier League" },
      { name: "West Ham", rating: 76, league: "Premier League" },
    ],
  },
  "La Liga": {
    league: "La Liga",
    teams: [
      { name: "Real Madrid", rating: 93, league: "La Liga" },
      { name: "Barcelona", rating: 91, league: "La Liga" },
      { name: "Atlético Madrid", rating: 85, league: "La Liga" },
      { name: "Real Sociedad", rating: 80, league: "La Liga" },
      { name: "Villarreal", rating: 79, league: "La Liga" },
      { name: "Athletic Bilbao", rating: 78, league: "La Liga" },
      { name: "Betis", rating: 77, league: "La Liga" },
      { name: "Sevilla", rating: 76, league: "La Liga" },
    ],
  },
  "Serie A": {
    league: "Serie A",
    teams: [
      { name: "Inter Milan", rating: 89, league: "Serie A" },
      { name: "AC Milan", rating: 84, league: "Serie A" },
      { name: "Juventus", rating: 85, league: "Serie A" },
      { name: "Napoli", rating: 86, league: "Serie A" },
      { name: "AS Roma", rating: 80, league: "Serie A" },
      { name: "Lazio", rating: 79, league: "Serie A" },
      { name: "Atalanta", rating: 83, league: "Serie A" },
      { name: "Fiorentina", rating: 77, league: "Serie A" },
    ],
  },
  "Bundesliga": {
    league: "Bundesliga",
    teams: [
      { name: "Bayern Munich", rating: 91, league: "Bundesliga" },
      { name: "Borussia Dortmund", rating: 85, league: "Bundesliga" },
      { name: "RB Leipzig", rating: 83, league: "Bundesliga" },
      { name: "Bayer Leverkusen", rating: 87, league: "Bundesliga" },
      { name: "Eintracht Frankfurt", rating: 78, league: "Bundesliga" },
      { name: "Wolfsburg", rating: 76, league: "Bundesliga" },
    ],
  },
  "Ligue 1": {
    league: "Ligue 1",
    teams: [
      { name: "PSG", rating: 90, league: "Ligue 1" },
      { name: "Marseille", rating: 81, league: "Ligue 1" },
      { name: "Monaco", rating: 80, league: "Ligue 1" },
      { name: "Lyon", rating: 79, league: "Ligue 1" },
      { name: "Lille", rating: 78, league: "Ligue 1" },
      { name: "Nice", rating: 76, league: "Ligue 1" },
    ],
  },
};

// ===== TENNIS DATA =====
const tennisPlayers = [
  { name: "Novak Djokovic", rating: 95 },
  { name: "Carlos Alcaraz", rating: 93 },
  { name: "Jannik Sinner", rating: 92 },
  { name: "Daniil Medvedev", rating: 88 },
  { name: "Alexander Zverev", rating: 87 },
  { name: "Andrey Rublev", rating: 84 },
  { name: "Stefanos Tsitsipas", rating: 83 },
  { name: "Holger Rune", rating: 82 },
  { name: "Casper Ruud", rating: 81 },
  { name: "Taylor Fritz", rating: 80 },
  { name: "Iga Swiatek", rating: 94 },
  { name: "Aryna Sabalenka", rating: 92 },
  { name: "Coco Gauff", rating: 87 },
  { name: "Elena Rybakina", rating: 86 },
];

// ===== BASKETBALL DATA =====
const nbaTeams = [
  { name: "Boston Celtics", rating: 93, league: "NBA" },
  { name: "Denver Nuggets", rating: 90, league: "NBA" },
  { name: "Milwaukee Bucks", rating: 88, league: "NBA" },
  { name: "Philadelphia 76ers", rating: 86, league: "NBA" },
  { name: "Phoenix Suns", rating: 85, league: "NBA" },
  { name: "Golden State Warriors", rating: 84, league: "NBA" },
  { name: "LA Lakers", rating: 83, league: "NBA" },
  { name: "Miami Heat", rating: 82, league: "NBA" },
  { name: "Dallas Mavericks", rating: 84, league: "NBA" },
  { name: "Cleveland Cavaliers", rating: 81, league: "NBA" },
];

// ===== INJURY SIMULATION =====
const footballInjuries: Record<string, string[]> = {
  "Manchester City": ["Kevin De Bruyne", "John Stones", "Kyle Walker"],
  "Arsenal": ["Bukayo Saka", "Takehiro Tomiyasu", "Oleksandr Zinchenko"],
  "Liverpool": ["Diogo Jota", "Joel Matip", "Thiago"],
  "Real Madrid": ["Thibaut Courtois", "David Alaba", "Aurélien Tchouaméni"],
  "Barcelona": ["Ronald Araújo", "Frenkie de Jong", "Ansu Fati"],
  "Bayern Munich": ["Leroy Sané", "Lucas Hernández", "Kingsley Coman"],
  "PSG": ["Presnel Kimpembe", "Lucas Hernández", "Nuno Mendes"],
  "Inter Milan": ["Romelu Lukaku", "Robin Gosens", "Joaquín Correa"],
  "Juventus": ["Paul Pogba", "Federico Chiesa", "Ángel Di María"],
};

const injuryReasons = ["Blessure musculaire", "Entorse cheville", "Problème au genou", "Douleur au mollet", "Commotion", "Suspension", "Surcharge musculaire"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function getDaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generateForm(rand: () => number, rating: number): TeamForm {
  const results: MatchResult[] = [];
  let scored = 0, conceded = 0;
  for (let i = 0; i < 5; i++) {
    const r = rand();
    const winProb = (rating - 50) / 80;
    if (r < winProb) { results.push("W"); scored += Math.floor(rand() * 3) + 1; conceded += Math.floor(rand() * 2); }
    else if (r < winProb + 0.25) { results.push("D"); const g = Math.floor(rand() * 3); scored += g; conceded += g; }
    else { results.push("L"); scored += Math.floor(rand() * 2); conceded += Math.floor(rand() * 3) + 1; }
  }
  return { last5: results, goalsScored: scored, goalsConceded: conceded };
}

function generateInjuries(rand: () => number, teamName: string): InjuredPlayer[] {
  const pool = footballInjuries[teamName] || ["Joueur A", "Joueur B", "Joueur C"];
  const count = Math.floor(rand() * 3);
  return pool.slice(0, count).map(name => ({
    name,
    reason: injuryReasons[Math.floor(rand() * injuryReasons.length)],
  }));
}

function calculatePrediction(rand: () => number, home: TeamInfo, away: TeamInfo, sport: Sport): Prediction {
  const diff = home.rating - away.rating;
  const homeAdvantage = 5;
  const adjustedDiff = diff + homeAdvantage;

  let homeWin: number, draw: number, awayWin: number;

  if (sport === "tennis") {
    // No draw in tennis
    const p = 0.5 + adjustedDiff / 100;
    homeWin = Math.min(95, Math.max(5, Math.round((p + (rand() - 0.5) * 0.1) * 100)));
    awayWin = 100 - homeWin;
    draw = 0;
  } else {
    homeWin = Math.min(85, Math.max(10, Math.round((0.35 + adjustedDiff / 80 + (rand() - 0.5) * 0.08) * 100)));
    draw = Math.min(35, Math.max(15, Math.round((0.25 - Math.abs(adjustedDiff) / 200 + (rand() - 0.5) * 0.06) * 100)));
    awayWin = 100 - homeWin - draw;
    if (awayWin < 5) { awayWin = 5; homeWin = 100 - draw - awayWin; }
  }

  let homeGoals: number, awayGoals: number;
  if (sport === "basketball") {
    homeGoals = Math.round(105 + (home.rating - 80) * 1.2 + (rand() - 0.5) * 15);
    awayGoals = Math.round(102 + (away.rating - 80) * 1.2 + (rand() - 0.5) * 15);
  } else if (sport === "tennis") {
    homeGoals = homeWin > 55 ? 2 : Math.round(rand() * 2) + 1;
    awayGoals = awayWin > 55 ? 2 : Math.round(rand() * 2);
  } else {
    homeGoals = Math.max(0, Math.round(1.3 + (home.rating - 75) / 30 + (rand() - 0.5) * 1.2));
    awayGoals = Math.max(0, Math.round(1.0 + (away.rating - 75) / 30 + (rand() - 0.5) * 1.2));
  }

  const totalGoals = homeGoals + awayGoals;
  const overProb = sport === "football" ? Math.min(80, Math.max(25, Math.round(35 + totalGoals * 10 + (rand() - 0.5) * 15))) : 50;

  const bttsYes = sport === "football" ? Math.min(75, Math.max(25, Math.round(40 + (rand() - 0.5) * 30))) : 50;

  const maxProb = Math.max(homeWin, awayWin);
  let confidence: Confidence;
  let confidenceScore: number;
  if (maxProb >= 65) { confidence = "SAFE"; confidenceScore = Math.round(75 + rand() * 20); }
  else if (maxProb >= 45) { confidence = "MODÉRÉ"; confidenceScore = Math.round(55 + rand() * 20); }
  else { confidence = "RISQUÉ"; confidenceScore = Math.round(35 + rand() * 20); }

  const valueBet = rand() > 0.75;
  const valueBetType = valueBet ? (rand() > 0.5 ? "Over 2.5" : "BTTS Oui") : undefined;

  const explanations = generateExplanation(home, away, homeWin, awayWin, confidence, sport);

  return {
    homeWin, draw, awayWin,
    predictedScore: [homeGoals, awayGoals],
    overUnder25: { over: overProb, under: 100 - overProb },
    btts: { yes: bttsYes, no: 100 - bttsYes },
    confidence, confidenceScore, valueBet, valueBetType,
    aiExplanation: explanations,
  };
}

function generateExplanation(home: TeamInfo, away: TeamInfo, homeWin: number, awayWin: number, confidence: Confidence, sport: Sport): string {
  const homeWins = home.form.last5.filter(r => r === "W").length;
  const awayWins = away.form.last5.filter(r => r === "W").length;
  const favori = homeWin > awayWin ? home.name : away.name;
  const outsider = homeWin > awayWin ? away.name : home.name;

  if (sport === "tennis") {
    return `Notre modèle IA donne l'avantage à ${favori} dans ce duel. Avec un taux de victoire récent de ${Math.max(homeWins, awayWins)}/5, ${favori} affiche une forme supérieure. L'analyse des confrontations directes et de la surface de jeu confirme cette tendance. Niveau de confiance : ${confidence}.`;
  }

  if (sport === "basketball") {
    return `L'analyse IA prévoit une victoire de ${favori}. Les statistiques offensives récentes (${home.form.goalsScored} pts marqués sur les 5 derniers matchs pour ${home.name}) et la dynamique actuelle favorisent nettement ${favori}. Le rating global (${Math.max(home.rating, away.rating)}/100) confirme la supériorité sur le papier.`;
  }

  const injuredNote = home.injured.length > 0 ? ` Attention : ${home.name} est privé de ${home.injured.map(i => i.name).join(", ")}.` : "";

  return `L'IA Nadvir analyse ${home.name} (${homeWins}V en 5 matchs, ${home.leaguePosition}e au classement) face à ${away.name} (${awayWins}V en 5 matchs, ${away.leaguePosition}e). ${favori} présente un avantage statistique clair avec un rating de ${Math.max(home.rating, away.rating)}/100 contre ${Math.min(home.rating, away.rating)}/100 pour ${outsider}. L'efficacité offensive (${home.form.goalsScored} buts marqués) et la solidité défensive (${away.form.goalsConceded} encaissés) orientent notre modèle vers une victoire probable de ${favori}.${injuredNote} Confiance : ${confidence}.`;
}

function generateKickoff(rand: () => number, index: number): string {
  const hours = [14, 15, 16, 17, 18, 19, 20, 21];
  const h = hours[Math.floor(rand() * hours.length)];
  const m = rand() > 0.5 ? "00" : "30";
  const today = new Date();
  today.setHours(h, parseInt(m), 0, 0);
  return today.toISOString();
}

export function generateDailyMatches(): Match[] {
  const seed = getDaySeed();
  const rand = seededRandom(seed);
  const matches: Match[] = [];
  let matchId = 0;

  // Football: 2-3 matches per league
  Object.entries(footballTeams).forEach(([leagueName, { teams, league }]) => {
    const shuffled = [...teams].sort(() => rand() - 0.5);
    const numMatches = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < numMatches && i * 2 + 1 < shuffled.length; i++) {
      const homeBase = shuffled[i * 2];
      const awayBase = shuffled[i * 2 + 1];

      const sortedByRating = [...teams].sort((a, b) => b.rating - a.rating);
      const homeTeam: TeamInfo = {
        ...homeBase,
        form: generateForm(rand, homeBase.rating),
        injured: generateInjuries(rand, homeBase.name),
        leaguePosition: sortedByRating.findIndex(t => t.name === homeBase.name) + 1,
      };
      const awayTeam: TeamInfo = {
        ...awayBase,
        form: generateForm(rand, awayBase.rating),
        injured: generateInjuries(rand, awayBase.name),
        leaguePosition: sortedByRating.findIndex(t => t.name === awayBase.name) + 1,
      };

      matches.push({
        id: `football-${matchId++}`,
        sport: "football",
        league: leagueName,
        homeTeam, awayTeam,
        prediction: calculatePrediction(rand, homeTeam, awayTeam, "football"),
        kickoff: generateKickoff(rand, matchId),
        isFree: matchId === 1,
      });
    }
  });

  // Tennis: 4 matches
  const shuffledTennis = [...tennisPlayers].sort(() => rand() - 0.5);
  for (let i = 0; i < 4 && i * 2 + 1 < shuffledTennis.length; i++) {
    const p1 = shuffledTennis[i * 2];
    const p2 = shuffledTennis[i * 2 + 1];
    const tournament = ["ATP Masters 1000", "WTA 1000", "Grand Slam", "ATP 500"][Math.floor(rand() * 4)];
    
    const homeTeam: TeamInfo = {
      name: p1.name, rating: p1.rating, league: tournament,
      form: generateForm(rand, p1.rating),
      injured: [], leaguePosition: Math.floor(rand() * 20) + 1,
    };
    const awayTeam: TeamInfo = {
      name: p2.name, rating: p2.rating, league: tournament,
      form: generateForm(rand, p2.rating),
      injured: [], leaguePosition: Math.floor(rand() * 20) + 1,
    };

    matches.push({
      id: `tennis-${i}`,
      sport: "tennis",
      league: tournament,
      homeTeam, awayTeam,
      prediction: calculatePrediction(rand, homeTeam, awayTeam, "tennis"),
      kickoff: generateKickoff(rand, matchId + i),
      isFree: false,
    });
  }

  // Basketball: 4 matches
  const shuffledNba = [...nbaTeams].sort(() => rand() - 0.5);
  for (let i = 0; i < 4 && i * 2 + 1 < shuffledNba.length; i++) {
    const t1 = shuffledNba[i * 2];
    const t2 = shuffledNba[i * 2 + 1];

    const homeTeam: TeamInfo = {
      ...t1, form: generateForm(rand, t1.rating),
      injured: [], leaguePosition: Math.floor(rand() * 15) + 1,
    };
    const awayTeam: TeamInfo = {
      ...t2, form: generateForm(rand, t2.rating),
      injured: [], leaguePosition: Math.floor(rand() * 15) + 1,
    };

    matches.push({
      id: `nba-${i}`,
      sport: "basketball",
      league: "NBA",
      homeTeam, awayTeam,
      prediction: calculatePrediction(rand, homeTeam, awayTeam, "basketball"),
      kickoff: generateKickoff(rand, matchId + 4 + i),
      isFree: false,
    });
  }

  return matches;
}

// AI Performance stats (simulated)
export const aiPerformanceStats = {
  overallAccuracy: 78.4,
  footballAccuracy: 81.2,
  tennisAccuracy: 74.8,
  basketballAccuracy: 76.9,
  totalPredictions: 12847,
  streakWins: 7,
  monthlyROI: 14.2,
  safeAccuracy: 89.1,
  moderateAccuracy: 72.3,
  riskyAccuracy: 58.7,
  weeklyResults: [
    { day: "Lun", wins: 12, total: 15 },
    { day: "Mar", wins: 10, total: 14 },
    { day: "Mer", wins: 14, total: 17 },
    { day: "Jeu", wins: 11, total: 14 },
    { day: "Ven", wins: 13, total: 16 },
    { day: "Sam", wins: 18, total: 22 },
    { day: "Dim", wins: 16, total: 20 },
  ],
};
