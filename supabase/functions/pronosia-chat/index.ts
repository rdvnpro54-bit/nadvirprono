import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PREMIUM_PLUS_PRODUCTS = [
  "prod_UEJp3TBa1RECPD", "prod_UEJqF0K4vVqUMF",
  "prod_UDq3Yi5NV5UBwi", "prod_UDq3gv6WVIiSIn",
  "manual_premium_plus",
];

// ── Types ──────────────────────────────────────────────────────
interface MatchData {
  fixture_id: number; home_team: string; away_team: string; league_name: string;
  sport: string; kickoff: string; pred_home_win: number; pred_draw: number;
  pred_away_win: number; pred_confidence: string; pred_analysis: string | null;
  pred_score_home: number; pred_score_away: number; pred_btts_prob: number;
  pred_over_prob: number; ai_score: number; status: string;
  home_score: number | null; away_score: number | null;
  anomaly_label: string | null; streak_mode_level: string | null;
}

interface ResultData {
  fixture_id: number; home_team: string; away_team: string; league_name: string;
  predicted_winner: string; predicted_confidence: string; result: string | null;
  actual_home_score: number | null; actual_away_score: number | null;
  bet_type: string | null; sport: string; kickoff: string;
}

interface StatsData {
  sport: string; confidence_level: string; winrate: number;
  total_predictions: number; calibration_error: number;
  bet_type: string | null; roi: number | null;
}

interface SportStat { sport: string; wins: number; losses: number; total: number; winrate: number; }

// ── Helpers ────────────────────────────────────────────────────
function getWinner(m: MatchData): string {
  const max = Math.max(m.pred_home_win, m.pred_draw, m.pred_away_win);
  return m.pred_home_win === max ? m.home_team : m.pred_away_win === max ? m.away_team : "Match nul";
}

function isToday(kickoff: string): boolean {
  const d = new Date(kickoff);
  const now = new Date();
  return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

function isTomorrow(kickoff: string): boolean {
  const d = new Date(kickoff);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toISOString().slice(0, 10) === tomorrow.toISOString().slice(0, 10);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

function computeSportStats(resolved: ResultData[]): SportStat[] {
  const map: Record<string, { wins: number; losses: number }> = {};
  for (const r of resolved) {
    if (!map[r.sport]) map[r.sport] = { wins: 0, losses: 0 };
    if (r.result === "win") map[r.sport].wins++;
    else map[r.sport].losses++;
  }
  return Object.entries(map).map(([sport, d]) => ({
    sport, wins: d.wins, losses: d.losses, total: d.wins + d.losses,
    winrate: Math.round((d.wins / (d.wins + d.losses)) * 100),
  })).sort((a, b) => b.total - a.total);
}

function getSportEmoji(sport: string): string {
  const map: Record<string, string> = { football: "⚽", basketball: "🏀", hockey: "🏒", baseball: "⚾", tennis: "🎾", mma: "🥊", afl: "🏈", rugby: "🏉" };
  return map[sport.toLowerCase()] || "🎯";
}

function confEmoji(c: string): string {
  return c === "SAFE" ? "🟢" : c === "MODÉRÉ" ? "🟡" : "🔴";
}

function fmtDate(kickoff: string): string {
  return new Date(kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtTime(kickoff: string): string {
  return new Date(kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}

// ── Team aliases (country names FR→EN) ─────────────────────────
const TEAM_ALIASES: Record<string, string[]> = {
  "turkey": ["turquie", "turkiye", "turc"], "germany": ["allemagne", "allemand"],
  "spain": ["espagne", "espagnol"], "france": ["france", "francais"],
  "italy": ["italie", "italien"], "portugal": ["portugal", "portugais"],
  "england": ["angleterre", "anglais"], "netherlands": ["pays bas", "hollande", "neerlandais"],
  "belgium": ["belgique", "belge"], "brazil": ["bresil", "bresilien"],
  "argentina": ["argentine", "argentin"], "croatia": ["croatie", "croate"],
  "serbia": ["serbie", "serbe"], "switzerland": ["suisse"],
  "poland": ["pologne", "polonais"], "sweden": ["suede", "suedois"],
  "denmark": ["danemark", "danois"], "norway": ["norvege", "norvegien"],
  "greece": ["grece", "grec"], "czech republic": ["republique tcheque", "tcheque", "tchequie"],
  "austria": ["autriche", "autrichien"], "scotland": ["ecosse", "ecossais"],
  "wales": ["pays de galles", "gallois"], "ireland": ["irlande", "irlandais"],
  "romania": ["roumanie", "roumain"], "ukraine": ["ukraine", "ukrainien"],
  "russia": ["russie", "russe"], "japan": ["japon", "japonais"],
  "south korea": ["coree du sud", "coreen"], "mexico": ["mexique", "mexicain"],
  "united states": ["etats unis", "usa", "americain"], "canada": ["canada", "canadien"],
  "australia": ["australie", "australien"], "morocco": ["maroc", "marocain"],
  "algeria": ["algerie", "algerien"], "tunisia": ["tunisie", "tunisien"],
  "egypt": ["egypte", "egyptien"], "senegal": ["senegal", "senegalais"],
  "cameroon": ["cameroun", "camerounais"], "ivory coast": ["cote divoire", "ivoirien"],
  "ghana": ["ghana", "ghaneen"], "nigeria": ["nigeria", "nigerian"],
  "colombia": ["colombie", "colombien"], "chile": ["chili", "chilien"],
  "uruguay": ["uruguay", "uruguayen"], "paraguay": ["paraguay", "paraguayen"],
  "peru": ["perou", "peruvien"], "ecuador": ["equateur", "equatorien"],
  "kosovo": ["kosovo", "kosovar"], "albania": ["albanie", "albanais"],
  "north macedonia": ["macedoine", "macedoine du nord"], "montenegro": ["montenegro"],
  "bosnia": ["bosnie", "bosnien", "bosnie herzegovine"],
  "slovenia": ["slovenie", "slovene"], "slovakia": ["slovaquie", "slovaque"],
  "hungary": ["hongrie", "hongrois"], "bulgaria": ["bulgarie", "bulgare"],
  "finland": ["finlande", "finlandais"], "iceland": ["islande", "islandais"],
  "georgia": ["georgie", "georgien"], "armenia": ["armenie", "armenien"],
  "belarus": ["bielorussie", "bielorusse"], "moldova": ["moldavie", "moldave"],
  "lithuania": ["lituanie", "lituanien"], "latvia": ["lettonie", "letton"],
  "estonia": ["estonie", "estonien"],
};

function findMatchInQuestion(q: string, matches: MatchData[]): MatchData | null {
  const nq = normalize(q);
  // Direct team name match
  for (const m of matches) {
    if (nq.includes(normalize(m.home_team)) || nq.includes(normalize(m.away_team))) return m;
  }
  // Alias match
  for (const m of matches) {
    const homeNorm = normalize(m.home_team);
    const awayNorm = normalize(m.away_team);
    for (const [eng, aliases] of Object.entries(TEAM_ALIASES)) {
      const engNorm = normalize(eng);
      if (homeNorm.includes(engNorm) || engNorm.includes(homeNorm)) {
        for (const alias of aliases) { if (nq.includes(alias)) return m; }
      }
      if (awayNorm.includes(engNorm) || engNorm.includes(awayNorm)) {
        for (const alias of aliases) { if (nq.includes(alias)) return m; }
      }
    }
  }
  // Word-level partial match (min 4 chars to avoid false positives)
  for (const m of matches) {
    const words = [...normalize(m.home_team).split(" "), ...normalize(m.away_team).split(" ")].filter(w => w.length >= 4);
    for (const w of words) { if (nq.includes(w)) return m; }
  }
  return null;
}

function findResultInQuestion(q: string, results: ResultData[]): ResultData | null {
  const nq = normalize(q);
  for (const r of results) {
    if (nq.includes(normalize(r.home_team)) || nq.includes(normalize(r.away_team))) return r;
  }
  for (const r of results) {
    for (const [eng, aliases] of Object.entries(TEAM_ALIASES)) {
      const engNorm = normalize(eng);
      const homeNorm = normalize(r.home_team);
      const awayNorm = normalize(r.away_team);
      if (homeNorm.includes(engNorm) || engNorm.includes(homeNorm) || awayNorm.includes(engNorm) || engNorm.includes(awayNorm)) {
        for (const alias of aliases) { if (nq.includes(alias)) return r; }
      }
    }
  }
  return null;
}

// ── Sports detection ───────────────────────────────────────────
const SPORTS_MAP: Record<string, string[]> = {
  football: ["football", "foot", "soccer", "ligue 1", "premier league", "liga", "serie a", "bundesliga", "champions league", "ligue des champions"],
  basketball: ["basketball", "basket", "nba", "euroleague"],
  hockey: ["hockey", "nhl", "lnh"],
  baseball: ["baseball", "mlb"],
  tennis: ["tennis", "atp", "wta", "roland garros", "wimbledon"],
  mma: ["mma", "ufc", "combat", "boxe"],
  afl: ["afl", "aussie rules"],
  rugby: ["rugby", "top 14", "six nations"],
};

function detectSport(q: string): string | null {
  for (const [sport, keywords] of Object.entries(SPORTS_MAP)) {
    for (const kw of keywords) { if (q.includes(kw)) return sport; }
  }
  return null;
}

// ── Intent detection (scoring-based) ──────────────────────────
type Intent = "greeting" | "specific_match" | "opinion_match" | "best_matches" | "safe_matches" | "sport_matches" | "sport_stats" | "global_stats" | "best_sport" | "worst_sport" | "tomorrow" | "today" | "explain" | "thanks" | "who_are_you" | "how_many" | "league_question" | "combo" | "unknown";

function detectIntent(q: string, hasMatchRef: boolean, hasSport: boolean): Intent {
  // Gratitude
  if (/^(merci|thanks|thx|cool|ok merci|parfait|genial|super|top|nickel)/.test(q)) return "thanks";
  // Greetings
  if (/^(salut|bonjour|hello|hey|coucou|yo|slt|bsr|bjr|wesh|hola)/.test(q)) return "greeting";
  // Identity
  if (q.includes("qui es tu") || q.includes("tu es qui") || q.includes("cest quoi pronosia") || q.includes("tu fais quoi") || q.includes("tu sers a quoi")) return "who_are_you";

  // Specific match with opinion request
  if (hasMatchRef && (q.includes("pense") || q.includes("avis") || q.includes("analyse") || q.includes("dis moi") || q.includes("parle") || q.includes("raconte"))) return "opinion_match";
  // Specific match (any mention)
  if (hasMatchRef) return "specific_match";

  // "Combien" questions
  if (q.includes("combien") && (q.includes("match") || q.includes("pick") || q.includes("analyse"))) return "how_many";

  // Tomorrow
  if (q.includes("demain")) return "tomorrow";
  // Today
  if (q.includes("aujourd") || q.includes("ce soir") || q.includes("cette nuit")) return "today";

  // Best/worst sport comparison
  if ((q.includes("meilleur") || q.includes("pire") || q.includes("top")) && (q.includes("sport") || q.includes("categorie"))) return "best_sport";
  if ((q.includes("moins") || q.includes("plus")) && (q.includes("defaite") || q.includes("defaut") || q.includes("perte") || q.includes("victoire") || q.includes("reussite") || q.includes("gagn"))) return "best_sport";
  if (q.includes("classement") && q.includes("sport")) return "best_sport";
  if (q.includes("quel sport") || q.includes("quelle categorie")) return "best_sport";

  // Sport-specific matches
  if (hasSport && (q.includes("match") || q.includes("prochain") || q.includes("pick") || q.includes("donne") || q.includes("montre") || q.includes("confiance"))) return "sport_matches";
  // Sport stats
  if (hasSport && (q.includes("stat") || q.includes("taux") || q.includes("reussite") || q.includes("performance") || q.includes("winrate") || q.includes("bilan") || q.includes("resultat"))) return "sport_stats";
  // Sport alone → show matches + mini stats
  if (hasSport) return "sport_matches";

  // Safe/secure
  if (q.includes("safe") || q.includes("securis") || q.includes("fiable") || q.includes("sur ") || q.includes("surete")) return "safe_matches";

  // Best picks
  if (q.includes("meilleur") || q.includes("top") || q.includes("best") || q.includes("recommand") || q.includes("quoi jouer") || q.includes("quoi parier") || q.includes("quoi miser")) return "best_matches";

  // Global stats
  if (q.includes("taux") || q.includes("winrate") || q.includes("reussite") || q.includes("performance") || q.includes("stat") || q.includes("bilan") || q.includes("global") || q.includes("globalite") || q.includes("en general") || q.includes("resume") || q.includes("complet") || q.includes("resultat")) return "global_stats";

  // Combo / parlay
  if (q.includes("combo") || q.includes("combi") || q.includes("parlay") || q.includes("accumul")) return "combo";

  // Explain
  if (q.includes("pourquoi") || q.includes("expliqu") || q.includes("comment") || q.includes("raison")) return "explain";

  // Show me / give me
  if (q.includes("donne") || q.includes("montre") || q.includes("affiche") || q.includes("liste") || q.includes("dis moi")) return "best_matches";

  return "unknown";
}

// ── Response generators ──────────────────────────────────────
function generateMatchResponse(m: MatchData, isPP: boolean): string {
  const winner = getWinner(m);
  const winProb = Math.max(m.pred_home_win, m.pred_away_win, m.pred_draw);
  const isLive = m.status !== "NS" && m.status !== "FT" && m.home_score != null;

  let r = `**${m.home_team} vs ${m.away_team}**\n`;
  r += `📋 ${m.league_name} • ${m.sport} • ${fmtDate(m.kickoff)}\n\n`;

  if (isLive) {
    r += `🔴 **EN DIRECT** — ${m.home_score} - ${m.away_score}\n\n`;
  } else if (m.status === "FT" && m.home_score != null) {
    r += `✅ **Terminé** — ${m.home_score} - ${m.away_score}\n\n`;
  }

  r += `🏆 **Prédiction : ${winner}** (${winProb}%)\n`;
  r += `${confEmoji(m.pred_confidence)} Confiance : **${m.pred_confidence}** — Score IA : **${m.ai_score}/100**\n\n`;

  r += `📊 Probabilités : ${m.home_team} ${m.pred_home_win}% · Nul ${m.pred_draw}% · ${m.away_team} ${m.pred_away_win}%\n`;

  if (isPP) {
    r += `🎯 Score prédit : **${m.pred_score_home} - ${m.pred_score_away}**\n`;
  }
  r += `📈 BTTS : ${m.pred_btts_prob}% · Over 2.5 : ${m.pred_over_prob}%\n`;

  if (m.pred_analysis) {
    r += `\n💡 ${m.pred_analysis}\n`;
  }

  // Add verdict
  r += `\n---\n`;
  if (m.ai_score >= 75) {
    r += `✅ **Verdict :** Pick solide, confiance élevée. Un des meilleurs matchs disponibles.\n`;
  } else if (m.ai_score >= 55) {
    r += `🟡 **Verdict :** Pick correct mais pas exceptionnel. À combiner ou jouer avec prudence.\n`;
  } else {
    r += `⚠️ **Verdict :** Pick risqué, données insuffisantes ou matchup incertain.\n`;
  }

  if (isPP && m.anomaly_label) r += `\n🚨 Anomalie : ${m.anomaly_label}\n`;

  r += `\n_Analyse basée sur notre modèle IA. Aucune garantie de résultat._`;
  return r;
}

function generateOpinionResponse(m: MatchData, isPP: boolean): string {
  const winner = getWinner(m);
  const winProb = Math.max(m.pred_home_win, m.pred_away_win, m.pred_draw);

  let r = `💭 **Mon analyse de ${m.home_team} vs ${m.away_team} :**\n\n`;

  if (m.ai_score >= 75) {
    r += `C'est un de mes **meilleurs picks** actuels. `;
  } else if (m.ai_score >= 55) {
    r += `C'est un match **correct** mais pas mon top pick. `;
  } else {
    r += `Honnêtement, c'est un match **difficile à lire**. `;
  }

  r += `Je vois **${winner}** à **${winProb}%** de probabilité.\n\n`;

  if (m.pred_confidence === "SAFE") {
    r += `🟢 J'ai classé ce match en **SAFE** — c'est mon niveau de confiance le plus élevé. Les données convergent clairement vers ${winner}.\n`;
  } else if (m.pred_confidence === "MODÉRÉ") {
    r += `🟡 Confiance **MODÉRÉE** — il y a des signaux positifs pour ${winner} mais quelques incertitudes subsistent.\n`;
  } else {
    r += `🔴 Confiance **RISQUÉE** — les données sont limitées ou contradictoires. Match à éviter sauf pour les parieurs audacieux.\n`;
  }

  r += `\n📊 **En chiffres :**\n`;
  r += `- ${m.home_team} : ${m.pred_home_win}% · Nul : ${m.pred_draw}% · ${m.away_team} : ${m.pred_away_win}%\n`;
  r += `- Score IA : **${m.ai_score}/100** · BTTS : ${m.pred_btts_prob}% · Over 2.5 : ${m.pred_over_prob}%\n`;

  if (isPP) {
    r += `- Score prédit : **${m.pred_score_home} - ${m.pred_score_away}**\n`;
  }

  if (m.pred_analysis) r += `\n💡 ${m.pred_analysis}\n`;

  r += `\n_Mon avis est basé sur les données de notre modèle IA, pas sur du feeling._`;
  return r;
}

function generateResultResponse(r: ResultData): string {
  let resp = `📋 **${r.home_team} vs ${r.away_team}**\n`;
  resp += `🏷️ ${r.league_name} • ${r.sport} • ${fmtDate(r.kickoff)}\n\n`;
  resp += `🏆 Prédiction : **${r.predicted_winner}** (${r.predicted_confidence}, ${r.bet_type || "winner"})\n`;
  if (r.result) {
    resp += r.result === "win"
      ? `✅ **Gagné !** Notre prédiction était correcte.\n`
      : `❌ **Perdu.** Notre prédiction n'était pas bonne sur ce match.\n`;
  }
  if (r.actual_home_score != null) resp += `⚽ Score final : **${r.actual_home_score} - ${r.actual_away_score}**\n`;
  return resp;
}

function generateBestMatchesResponse(matches: MatchData[], label: string = "Top matchs"): string {
  const upcoming = matches.filter(m => new Date(m.kickoff) > new Date() && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 6);

  if (upcoming.length === 0) return "📭 Aucun match avec prédiction disponible pour le moment.";

  let r = `🏆 **${label} :**\n\n`;
  for (const m of upcoming) {
    const winner = getWinner(m);
    r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${winner}\n`;
    r += `   ${m.pred_confidence} · IA ${m.ai_score}/100 · ${fmtDate(m.kickoff)}\n\n`;
  }
  r += `_Classé par score IA. Tape le nom d'un match pour plus de détails._`;
  return r;
}

function generateSafeMatchesResponse(matches: MatchData[]): string {
  const safe = matches.filter(m => m.pred_confidence === "SAFE" && m.ai_score > 0 && new Date(m.kickoff) > new Date())
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 6);

  if (safe.length === 0) {
    const best = matches.filter(m => m.ai_score >= 65 && new Date(m.kickoff) > new Date())
      .sort((a, b) => b.ai_score - a.ai_score).slice(0, 3);
    if (best.length === 0) return "🟢 Aucun match SAFE pour le moment. Reviens plus tard !";
    let r = "🟢 Pas de match SAFE actuellement, mais voici les **plus fiables** :\n\n";
    for (const m of best) {
      r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} (IA: ${m.ai_score}/100)\n`;
    }
    return r;
  }

  let r = "🟢 **Matchs les plus sûrs :**\n\n";
  for (const m of safe) {
    const winner = getWinner(m);
    r += `✅ **${m.home_team} vs ${m.away_team}** → ${winner}\n`;
    r += `   IA ${m.ai_score}/100 · ${m.pred_home_win}%/${m.pred_draw}%/${m.pred_away_win}% · ${fmtDate(m.kickoff)}\n\n`;
  }
  r += `_Les picks SAFE ont le meilleur taux de réussite historique._`;
  return r;
}

function generateStatsResponse(results: ResultData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const wins = resolved.filter(r => r.result === "win").length;
  const total = resolved.length;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

  let r = `📊 **Performance globale Pronosia AI**\n\n`;
  r += `🎯 **Winrate : ${wr}%** — ${wins} victoires sur ${total} picks\n\n`;

  const sportStats = computeSportStats(resolved);
  if (sportStats.length > 0) {
    r += `**Par sport :**\n`;
    for (const s of sportStats) {
      const bar = s.winrate >= 60 ? "🟢" : s.winrate >= 45 ? "🟡" : "🔴";
      r += `${bar} ${getSportEmoji(s.sport)} ${s.sport} : **${s.winrate}%** (${s.wins}W / ${s.losses}L)\n`;
    }
  }

  r += `\n**Par confiance :**\n`;
  for (const conf of ["SAFE", "MODÉRÉ", "RISQUÉ"]) {
    const cr = resolved.filter(r => r.predicted_confidence === conf);
    if (cr.length > 0) {
      const cw = cr.filter(r => r.result === "win").length;
      r += `${confEmoji(conf)} ${conf} : **${Math.round((cw / cr.length) * 100)}%** (${cw}/${cr.length})\n`;
    }
  }

  const last10 = resolved.slice(0, 10);
  const l10w = last10.filter(r => r.result === "win").length;
  r += `\n📈 Forme récente (10 derniers) : **${l10w}/10** (${l10w * 10}%)\n`;

  r += `\n_Stats basées sur l'historique complet._`;
  return r;
}

function generateSportDetailResponse(sportName: string, results: ResultData[], matches: MatchData[], isPP: boolean): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const sportResults = resolved.filter(r => normalize(r.sport).includes(normalize(sportName)));
  const sportMatches = matches.filter(m => normalize(m.sport).includes(normalize(sportName)) && new Date(m.kickoff) > new Date() && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 4);

  let r = `${getSportEmoji(sportName)} **${sportName.charAt(0).toUpperCase() + sportName.slice(1)}**\n\n`;

  // Stats
  if (sportResults.length > 0) {
    const wins = sportResults.filter(r => r.result === "win").length;
    const total = sportResults.length;
    r += `📊 Winrate : **${Math.round((wins / total) * 100)}%** (${wins}W / ${total - wins}L sur ${total})\n`;

    for (const conf of ["SAFE", "MODÉRÉ", "RISQUÉ"]) {
      const cr = sportResults.filter(r => r.predicted_confidence === conf);
      if (cr.length > 0) {
        const cw = cr.filter(r => r.result === "win").length;
        r += `${confEmoji(conf)} ${conf} : **${Math.round((cw / cr.length) * 100)}%** (${cw}/${cr.length})\n`;
      }
    }
  } else {
    r += `📊 Pas encore de résultats pour ce sport.\n`;
  }

  // Upcoming matches
  if (sportMatches.length > 0) {
    r += `\n**Prochains matchs :**\n`;
    for (const m of sportMatches) {
      r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} (IA: ${m.ai_score}) · ${fmtDate(m.kickoff)}\n`;
    }
  } else {
    r += `\n📭 Aucun match à venir pour le moment.\n`;
  }

  return r;
}

function generateBestSportResponse(results: ResultData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const sportStats = computeSportStats(resolved);
  const meaningful = sportStats.filter(s => s.total >= 3);

  if (meaningful.length === 0) return "📊 Pas assez de données pour comparer les sports (minimum 3 picks chacun).";

  const sorted = [...meaningful].sort((a, b) => b.winrate - a.winrate);

  let r = `📊 **Classement des sports :**\n\n`;
  sorted.forEach((s, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "▪️";
    const bar = s.winrate >= 60 ? "🟢" : s.winrate >= 45 ? "🟡" : "🔴";
    r += `${medal} ${getSportEmoji(s.sport)} **${s.sport}** — ${bar} **${s.winrate}%** (${s.wins}W/${s.losses}L sur ${s.total})\n`;
  });

  r += `\n💡 Pour voir les matchs d'un sport : tape son nom (ex: *"hockey"*)\n`;
  r += `_Seuls les sports avec ≥3 picks sont classés._`;
  return r;
}

function generateComboResponse(matches: MatchData[]): string {
  const safe = matches.filter(m => m.pred_confidence === "SAFE" && new Date(m.kickoff) > new Date() && m.ai_score >= 65)
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 3);

  if (safe.length < 2) {
    const best = matches.filter(m => m.ai_score >= 60 && new Date(m.kickoff) > new Date())
      .sort((a, b) => b.ai_score - a.ai_score).slice(0, 3);
    if (best.length < 2) return "🎯 Pas assez de matchs fiables pour construire un combo. Reviens quand il y aura plus de picks SAFE.";

    let r = "🎯 **Combo suggéré** (attention, pas de SAFE dispo) :\n\n";
    for (const m of best) {
      r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} (IA: ${m.ai_score})\n`;
    }
    r += `\n⚠️ _Combo risqué sans matchs SAFE. À jouer avec prudence._`;
    return r;
  }

  let r = "🎯 **Combo du jour** (basé sur les picks SAFE) :\n\n";
  for (const m of safe) {
    r += `✅ **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} (IA: ${m.ai_score}/100)\n`;
  }
  r += `\n_Combo basé sur les matchs les plus fiables. Aucune garantie de résultat._`;
  return r;
}

function generateTodayResponse(matches: MatchData[]): string {
  const todayM = matches.filter(m => isToday(m.kickoff) && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score);

  if (todayM.length === 0) return "📭 Aucun match analysé pour aujourd'hui. Les prochains picks arrivent bientôt !";

  let r = `📅 **${todayM.length} matchs analysés aujourd'hui :**\n\n`;
  for (const m of todayM.slice(0, 8)) {
    r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} · IA ${m.ai_score} · ${fmtTime(m.kickoff)}\n`;
  }
  if (todayM.length > 8) r += `\n_...et ${todayM.length - 8} autres matchs._\n`;
  r += `\n💡 Tape le nom d'une équipe pour l'analyse détaillée.`;
  return r;
}

function generateTomorrowResponse(matches: MatchData[]): string {
  const tmrw = matches.filter(m => isTomorrow(m.kickoff) && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score);

  if (tmrw.length === 0) return "📭 Pas encore de matchs analysés pour demain. Les prédictions sont générées quelques heures avant les matchs.";

  let r = `📅 **${tmrw.length} matchs prévus demain :**\n\n`;
  for (const m of tmrw.slice(0, 8)) {
    r += `${confEmoji(m.pred_confidence)} **${m.home_team} vs ${m.away_team}** → ${getWinner(m)} · IA ${m.ai_score} · ${fmtTime(m.kickoff)}\n`;
  }
  if (tmrw.length > 8) r += `\n_...et ${tmrw.length - 8} autres matchs._\n`;
  return r;
}

function generateHowManyResponse(matches: MatchData[], results: ResultData[]): string {
  const upcoming = matches.filter(m => new Date(m.kickoff) > new Date() && m.ai_score > 0);
  const todayM = matches.filter(m => isToday(m.kickoff) && m.ai_score > 0);
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");

  let r = `📊 **En chiffres :**\n\n`;
  r += `- 🔮 **${upcoming.length}** matchs à venir avec prédiction\n`;
  r += `- 📅 **${todayM.length}** matchs analysés aujourd'hui\n`;
  r += `- 📈 **${resolved.length}** prédictions résolues au total\n`;
  r += `- ✅ **${resolved.filter(r => r.result === "win").length}** victoires\n`;
  return r;
}

// ── Smart default: always give useful data ────────────────────
function generateSmartDefault(q: string, matches: MatchData[], results: ResultData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const wr = resolved.length > 0 ? Math.round((resolved.filter(r => r.result === "win").length / resolved.length) * 100) : 0;
  const upcoming = matches.filter(m => new Date(m.kickoff) > new Date() && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score);
  const topPick = upcoming[0];

  let r = `Je n'ai pas de réponse précise à cette question, mais voici ce que je peux te dire :\n\n`;
  r += `📊 **Winrate actuel : ${wr}%** sur ${resolved.length} picks\n`;

  if (topPick) {
    r += `🏆 **Meilleur pick dispo :** ${topPick.home_team} vs ${topPick.away_team} → ${getWinner(topPick)} (${topPick.pred_confidence}, IA: ${topPick.ai_score}/100)\n`;
  }

  r += `\n💬 Tu peux me demander :\n`;
  r += `• Le nom d'un match ou d'une équipe pour l'analyse\n`;
  r += `• *"meilleurs matchs"* ou *"matchs safe"*\n`;
  r += `• *"stats football"* ou le nom d'un sport\n`;
  r += `• *"combo du jour"* pour un parlay\n`;
  r += `• *"mes stats"* pour le bilan global\n`;
  return r;
}

// ── Main fallback router ──────────────────────────────────────
function generateFallbackResponse(
  userMsg: string,
  allMessages: Array<{ role: string; content: string }>,
  matches: MatchData[],
  results: ResultData[],
  stats: StatsData[],
  isPP: boolean
): string {
  const q = normalize(userMsg);

  // Try to find a specific match/result mentioned
  const matchRef = findMatchInQuestion(userMsg, matches);
  const resultRef = !matchRef ? findResultInQuestion(userMsg, results) : null;
  const hasMatchRef = !!(matchRef || resultRef);
  const detectedSport = detectSport(q);

  const intent = detectIntent(q, hasMatchRef, !!detectedSport);

  switch (intent) {
    case "greeting": {
      const resolved = results.filter(r => r.result === "win" || r.result === "loss");
      const wr = resolved.length > 0 ? Math.round((resolved.filter(r => r.result === "win").length / resolved.length) * 100) : 0;
      const upcoming = matches.filter(m => new Date(m.kickoff) > new Date() && m.ai_score > 0).length;
      return `👋 Salut ! Je suis **Pronosia AI**.\n\n📊 Winrate : **${wr}%** · ${upcoming} matchs analysés à venir\n\nDemande-moi n'importe quoi sur les matchs, les stats, ou un pronostic précis ! 🎯`;
    }

    case "thanks":
      return `🙏 Avec plaisir ! N'hésite pas si tu as d'autres questions sur les matchs.`;

    case "who_are_you":
      return `🤖 Je suis **Pronosia AI**, un assistant de pronostics sportifs.\n\nJe suis alimenté par un moteur d'intelligence artificielle qui analyse des centaines de matchs en temps réel. Je peux te donner :\n\n🏆 Les meilleurs picks du jour\n📊 Mes statistiques de performance\n⚽ L'analyse détaillée d'un match\n🟢 Les matchs les plus sûrs\n🎯 Un combo du jour\n\n_Mes analyses sont basées sur des données réelles et du machine learning._`;

    case "opinion_match":
      if (matchRef) return generateOpinionResponse(matchRef, isPP);
      if (resultRef) return generateResultResponse(resultRef);
      return generateSmartDefault(q, matches, results);

    case "specific_match":
      if (matchRef) return generateMatchResponse(matchRef, isPP);
      if (resultRef) return generateResultResponse(resultRef);
      return generateSmartDefault(q, matches, results);

    case "best_matches":
      return generateBestMatchesResponse(matches);

    case "safe_matches":
      return generateSafeMatchesResponse(matches);

    case "sport_matches":
      return detectedSport ? generateSportDetailResponse(detectedSport, results, matches, isPP) : generateBestMatchesResponse(matches);

    case "sport_stats":
      return detectedSport ? generateSportDetailResponse(detectedSport, results, matches, isPP) : generateStatsResponse(results);

    case "global_stats":
      return generateStatsResponse(results);

    case "best_sport":
    case "worst_sport":
      return generateBestSportResponse(results);

    case "today":
      return generateTodayResponse(matches);

    case "tomorrow":
      return generateTomorrowResponse(matches);

    case "combo":
      return generateComboResponse(matches);

    case "how_many":
      return generateHowManyResponse(matches, results);

    case "explain":
      return "🔍 Pour une explication détaillée, dis-moi le nom d'une équipe ou d'un match. Par exemple : *\"Analyse Germany vs Ghana\"*";

    default:
      return generateSmartDefault(q, matches, results);
  }
}

function makeFallbackSSE(text: string): string {
  const chunks: string[] = [];
  const words = text.split(" ");
  let current = "";
  for (const word of words) {
    current += (current ? " " : "") + word;
    if (current.length >= 15) {
      chunks.push(current);
      current = "";
    }
  }
  if (current) chunks.push(current);

  let sse = "";
  for (const chunk of chunks) {
    const data = JSON.stringify({ choices: [{ delta: { content: chunk + " " } }] });
    sse += `data: ${data}\n\n`;
  }
  sse += "data: [DONE]\n\n";
  return sse;
}

// ── Main handler ───────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }).auth.getUser();

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check premium + premium+ status
    const { data: sub } = await supabase.from("subscriptions").select("is_premium, plan, expires_at").eq("user_id", user.id).single();
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!role;
    const isPremium = isAdmin || (sub?.is_premium && (!sub.expires_at || new Date(sub.expires_at) > new Date()));

    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Premium required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect Premium+ tier
    const isPremiumPlus = isAdmin || (sub?.plan && (
      sub.plan.includes("premium_plus") || PREMIUM_PLUS_PRODUCTS.includes(sub.plan)
    ));

    // Also check Stripe for Premium+ product
    let isPremiumPlusStripe = false;
    if (!isPremiumPlus && user.email) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (customers.data.length > 0) {
            const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
            if (subs.data.length > 0) {
              const productId = subs.data[0].items.data[0].price.product;
              isPremiumPlusStripe = PREMIUM_PLUS_PRODUCTS.includes(productId as string);
            }
          }
        }
      } catch (e) {
        console.log("[PRONOSIA-CHAT] Stripe check error:", e);
      }
    }

    const canSeeScores = isPremiumPlus || isPremiumPlusStripe;
    console.log(`[PRONOSIA-CHAT] User ${user.email} - Premium+: ${canSeeScores}`);

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data
    const [matchesRes, resultsRes, statsRes] = await Promise.all([
      supabase.from("cached_matches")
        .select("fixture_id, home_team, away_team, league_name, sport, kickoff, pred_home_win, pred_draw, pred_away_win, pred_confidence, pred_analysis, pred_score_home, pred_score_away, pred_btts_prob, pred_over_prob, ai_score, status, home_score, away_score, anomaly_label, streak_mode_level")
        .order("kickoff", { ascending: false }).limit(200),
      supabase.from("match_results")
        .select("fixture_id, home_team, away_team, league_name, predicted_winner, predicted_confidence, result, actual_home_score, actual_away_score, bet_type, sport, kickoff")
        .order("kickoff", { ascending: false }).limit(200),
      supabase.from("ai_learning_stats")
        .select("sport, confidence_level, winrate, total_predictions, calibration_error, bet_type, roi")
        .eq("league_name", "_all").eq("odds_bracket", "_all"),
    ]);

    const recentMatches = (matchesRes.data || []) as MatchData[];
    const recentResults = (resultsRes.data || []) as ResultData[];
    const learningStats = (statsRes.data || []) as StatsData[];

    // Build context for AI
    const matchContext = recentMatches.slice(0, 50).map(m => {
      const winner = getWinner(m);
      let line = `• ${m.home_team} vs ${m.away_team} (${m.league_name}, ${m.sport}) - Kickoff: ${m.kickoff} - Prédiction: ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) - Probas: ${m.pred_home_win}%/${m.pred_draw}%/${m.pred_away_win}%`;
      if (canSeeScores) line += ` - Score prédit: ${m.pred_score_home}-${m.pred_score_away}`;
      line += ` - BTTS: ${m.pred_btts_prob}% - Over: ${m.pred_over_prob}% - Analyse: ${m.pred_analysis || "N/A"}`;
      if (m.home_score != null) line += ` (Réel: ${m.home_score}-${m.away_score})`;
      return line;
    }).join("\n");

    const resultsContext = recentResults.slice(0, 50).map(r =>
      `• ${r.home_team} vs ${r.away_team} (${r.league_name}) - Préd: ${r.predicted_winner} (${r.predicted_confidence}, ${r.bet_type || "winner"}) - ${r.result || "attente"}${r.actual_home_score != null ? ` (${r.actual_home_score}-${r.actual_away_score})` : ""}`
    ).join("\n");

    const statsContext = learningStats.filter(s => s.total_predictions >= 5).map(s =>
      `${s.sport}/${s.confidence_level}${s.bet_type !== "_all" ? `/${s.bet_type}` : ""}: ${s.winrate}% (${s.total_predictions} picks, ROI: ${s.roi || 0}%)`
    ).join("\n");

    const scoreRule = canSeeScores
      ? "Tu peux donner les scores prédits."
      : "Tu ne dois JAMAIS donner les scores prédits. Si on te demande le score, dis que c'est réservé aux abonnés Premium+.";

    const systemPrompt = `Tu es Pronosia AI, un assistant expert en pronostics sportifs. Tu es direct, confiant et professionnel.

PERSONNALITÉ :
- Tu parles comme un analyste sportif expert, pas comme un robot
- Tu es concis et percutant — pas de blabla inutile
- Tu utilises des emojis avec parcimonie pour structurer
- Tu donnes ton avis tranché quand on te le demande
- Tu reconnais honnêtement quand un pick est risqué

RÈGLES :
1. Tu te bases UNIQUEMENT sur les données ci-dessous. Tu ne modifies JAMAIS une prédiction.
2. Si un match n'est pas dans tes données, dis-le clairement sans inventer.
3. Tu ne fais pas de nouvelles prédictions. Tu expliques celles qui existent.
4. Pas de garantie de résultat.
5. ${scoreRule}
6. Quand on te demande un avis sur un match, donne une vraie analyse argumentée.
7. Tu parles en français.

MATCHS ACTUELS :
${matchContext || "Aucun match disponible."}

RÉSULTATS RÉCENTS :
${resultsContext || "Aucun résultat."}

STATS :
${statsContext || "Pas assez de données."}`;

    // Try AI gateway first
    let useAI = !!LOVABLE_API_KEY;

    if (useAI) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.slice(-20),
            ],
            stream: true,
          }),
        });

        if (response.ok) {
          return new Response(response.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }

        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`[PRONOSIA-CHAT] AI gateway returned ${response.status}, using fallback engine`);
      } catch (e) {
        console.log(`[PRONOSIA-CHAT] AI gateway error, using fallback:`, e);
      }
    }

    // ── Deterministic fallback ──
    console.log("[PRONOSIA-CHAT] Using deterministic fallback engine");
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
    const fallbackText = generateFallbackResponse(lastUserMsg, messages, recentMatches, recentResults, learningStats, canSeeScores);
    const sseBody = makeFallbackSSE(fallbackText);

    return new Response(sseBody, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("pronosia-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
