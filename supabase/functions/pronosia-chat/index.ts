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

// ── Deterministic fallback engine ──────────────────────────────
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

function getWinner(m: MatchData): string {
  const max = Math.max(m.pred_home_win, m.pred_draw, m.pred_away_win);
  return m.pred_home_win === max ? m.home_team : m.pred_away_win === max ? m.away_team : "Match nul";
}

function isToday(kickoff: string): boolean {
  const d = new Date(kickoff);
  const now = new Date();
  return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

function findMatchInQuestion(q: string, matches: MatchData[]): MatchData | null {
  const nq = normalize(q);
  for (const m of matches) {
    if (nq.includes(normalize(m.home_team)) || nq.includes(normalize(m.away_team))) return m;
  }
  for (const m of matches) {
    const words = [...normalize(m.home_team).split(" "), ...normalize(m.away_team).split(" ")].filter(w => w.length >= 3);
    for (const w of words) {
      if (nq.includes(w)) return m;
    }
  }
  return null;
}

function generateMatchResponse(m: MatchData, isPremiumPlus: boolean): string {
  const winner = getWinner(m);
  const confEmoji = m.pred_confidence === "SAFE" ? "🟢" : m.pred_confidence === "MODÉRÉ" ? "🟡" : "🔴";
  const kickoffDate = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  
  let resp = `⚽ **${m.home_team} vs ${m.away_team}**\n`;
  resp += `📋 ${m.league_name} • ${m.sport} • ${kickoffDate}\n\n`;
  resp += `🏆 **Prédiction : ${winner}**\n`;
  resp += `${confEmoji} Confiance : **${m.pred_confidence}** (Score IA : ${m.ai_score}/100)\n\n`;
  resp += `📊 **Probabilités :**\n`;
  resp += `- 🏠 ${m.home_team} : ${m.pred_home_win}%\n`;
  resp += `- 🤝 Match nul : ${m.pred_draw}%\n`;
  resp += `- ✈️ ${m.away_team} : ${m.pred_away_win}%\n\n`;

  // Score prédit = Premium+ only
  if (isPremiumPlus) {
    resp += `🎯 Score prédit : **${m.pred_score_home} - ${m.pred_score_away}**\n`;
  } else {
    resp += `🎯 Score prédit : 🔒 *Réservé aux abonnés Premium+*\n`;
  }

  resp += `📈 BTTS : ${m.pred_btts_prob}% • Over 2.5 : ${m.pred_over_prob}%\n`;
  
  if (m.home_score != null) {
    resp += `\n✅ **Score réel : ${m.home_score} - ${m.away_score}**\n`;
  }
  if (isPremiumPlus && m.anomaly_label) {
    resp += `\n⚠️ ${m.anomaly_label}\n`;
  }
  if (m.pred_analysis) resp += `\n💡 **Analyse :** ${m.pred_analysis}\n`;
  
  resp += `\n_Ces données sont basées sur notre analyse IA. Aucune garantie de résultat._`;
  return resp;
}

function generateBestMatchesResponse(matches: MatchData[]): string {
  const todayMatches = matches.filter(m => isToday(m.kickoff) && m.pred_confidence !== "LOCKED" && m.ai_score > 0);
  const sorted = todayMatches.sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
  
  if (sorted.length === 0) {
    const upcoming = matches.filter(m => new Date(m.kickoff) > new Date() && m.pred_confidence !== "LOCKED" && m.ai_score > 0)
      .sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
    if (upcoming.length === 0) return "📭 Aucun match avec prédiction disponible pour le moment. Les analyses seront générées prochainement !";
    
    let resp = "🏆 **Meilleurs matchs à venir :**\n\n";
    for (const m of upcoming) {
      const winner = getWinner(m);
      const confEmoji = m.pred_confidence === "SAFE" ? "🟢" : m.pred_confidence === "MODÉRÉ" ? "🟡" : "🔴";
      const date = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      resp += `${confEmoji} **${m.home_team} vs ${m.away_team}** — ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) • ${date}\n`;
    }
    resp += `\n_Classement basé sur le score IA. Aucune garantie de résultat._`;
    return resp;
  }
  
  let resp = "🏆 **Top matchs du jour :**\n\n";
  for (const m of sorted) {
    const winner = getWinner(m);
    const confEmoji = m.pred_confidence === "SAFE" ? "🟢" : m.pred_confidence === "MODÉRÉ" ? "🟡" : "🔴";
    const time = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
    resp += `${confEmoji} **${m.home_team} vs ${m.away_team}** — ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) • ${time}\n`;
  }
  resp += `\n_Classement basé sur le score IA. Aucune garantie de résultat._`;
  return resp;
}

function generateStatsResponse(results: ResultData[], stats: StatsData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const wins = resolved.filter(r => r.result === "win").length;
  const total = resolved.length;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
  
  let resp = `📊 **Performance Pronosia AI :**\n\n`;
  resp += `🎯 Winrate global : **${winrate}%** (${wins}W / ${total - wins}L sur ${total} picks)\n\n`;
  
  const sportStats = computeSportStats(resolved);
  if (sportStats.length > 0) {
    resp += `**Par sport :**\n`;
    for (const s of sportStats) {
      resp += `- ${getSportEmoji(s.sport)} ${s.sport} : **${s.winrate}%** (${s.wins}/${s.total})\n`;
    }
  }
  
  resp += `\n**Par confiance :**\n`;
  for (const conf of ["SAFE", "MODÉRÉ", "RISQUÉ"]) {
    const cr = resolved.filter(r => r.predicted_confidence === conf);
    if (cr.length > 0) {
      const cw = cr.filter(r => r.result === "win").length;
      const emoji = conf === "SAFE" ? "🟢" : conf === "MODÉRÉ" ? "🟡" : "🔴";
      resp += `- ${emoji} ${conf} : **${Math.round((cw / cr.length) * 100)}%** (${cw}/${cr.length})\n`;
    }
  }
  
  const last10 = resolved.slice(0, 10);
  const last10W = last10.filter(r => r.result === "win").length;
  resp += `\n📈 Derniers 10 picks : **${last10W}/10** (${Math.round(last10W * 10)}%)\n`;
  
  resp += `\n_Statistiques basées sur l'historique complet des prédictions._`;
  return resp;
}

// ── Helper: compute per-sport stats ──
interface SportStat { sport: string; wins: number; losses: number; total: number; winrate: number; }

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

function generateSportDetailResponse(sportName: string, results: ResultData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const sportResults = resolved.filter(r => normalize(r.sport).includes(normalize(sportName)));
  
  if (sportResults.length === 0) {
    return `${getSportEmoji(sportName)} Aucune donnée disponible pour le **${sportName}** dans notre historique de prédictions.`;
  }
  
  const wins = sportResults.filter(r => r.result === "win").length;
  const total = sportResults.length;
  const winrate = Math.round((wins / total) * 100);
  
  let resp = `${getSportEmoji(sportName)} **Performance en ${sportName} :**\n\n`;
  resp += `🎯 Winrate : **${winrate}%** (${wins}W / ${total - wins}L sur ${total} picks)\n\n`;
  
  // Par confiance
  resp += `**Par confiance :**\n`;
  for (const conf of ["SAFE", "MODÉRÉ", "RISQUÉ"]) {
    const cr = sportResults.filter(r => r.predicted_confidence === conf);
    if (cr.length > 0) {
      const cw = cr.filter(r => r.result === "win").length;
      const emoji = conf === "SAFE" ? "🟢" : conf === "MODÉRÉ" ? "🟡" : "🔴";
      resp += `- ${emoji} ${conf} : **${Math.round((cw / cr.length) * 100)}%** (${cw}/${cr.length})\n`;
    }
  }
  
  // Par ligue
  const leagues: Record<string, { wins: number; total: number }> = {};
  for (const r of sportResults) {
    if (!leagues[r.league_name]) leagues[r.league_name] = { wins: 0, total: 0 };
    leagues[r.league_name].total++;
    if (r.result === "win") leagues[r.league_name].wins++;
  }
  const leagueEntries = Object.entries(leagues).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  if (leagueEntries.length > 0) {
    resp += `\n**Par ligue :**\n`;
    for (const [name, d] of leagueEntries) {
      resp += `- ${name} : **${Math.round((d.wins / d.total) * 100)}%** (${d.wins}/${d.total})\n`;
    }
  }
  
  resp += `\n_Statistiques basées sur l'historique complet._`;
  return resp;
}

function generateBestSportResponse(results: ResultData[]): string {
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const sportStats = computeSportStats(resolved);
  
  if (sportStats.length === 0) return "📊 Pas encore assez de données pour comparer les sports.";
  
  // Sort by winrate (min 3 picks to be meaningful)
  const meaningful = sportStats.filter(s => s.total >= 3);
  if (meaningful.length === 0) return "📊 Pas encore assez de données pour comparer les sports (minimum 3 picks par sport).";
  
  const best = [...meaningful].sort((a, b) => b.winrate - a.winrate);
  const worst = [...meaningful].sort((a, b) => a.winrate - b.winrate);
  
  let resp = `📊 **Classement par sport :**\n\n`;
  resp += `🏆 **Meilleur sport :** ${getSportEmoji(best[0].sport)} ${best[0].sport} — **${best[0].winrate}%** (${best[0].wins}/${best[0].total})\n`;
  if (worst[0].sport !== best[0].sport) {
    resp += `⚠️ **Sport le plus difficile :** ${getSportEmoji(worst[0].sport)} ${worst[0].sport} — **${worst[0].winrate}%** (${worst[0].wins}/${worst[0].total})\n`;
  }
  
  resp += `\n**Détail complet :**\n`;
  for (const s of best) {
    const bar = s.winrate >= 65 ? "🟢" : s.winrate >= 50 ? "🟡" : "🔴";
    resp += `${bar} ${getSportEmoji(s.sport)} ${s.sport} : **${s.winrate}%** (${s.wins}W/${s.losses}L sur ${s.total})\n`;
  }
  
  resp += `\n_Seuls les sports avec ≥3 picks sont classés._`;
  return resp;
}

function generateSafeMatchesResponse(matches: MatchData[]): string {
  const safe = matches.filter(m => m.pred_confidence === "SAFE" && m.ai_score > 0 && new Date(m.kickoff) > new Date())
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
  
  if (safe.length === 0) return "🟢 Aucun match classé **SAFE** disponible pour le moment. Les matchs SAFE sont les picks avec la confiance la plus élevée de notre IA.";
  
  let resp = "🟢 **Matchs les plus sûrs :**\n\n";
  for (const m of safe) {
    const winner = getWinner(m);
    const date = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    resp += `✅ **${m.home_team} vs ${m.away_team}** — ${winner} (IA: ${m.ai_score}/100) • ${date}\n`;
    resp += `   Probas: ${m.pred_home_win}% / ${m.pred_draw}% / ${m.pred_away_win}%\n\n`;
  }
  resp += `_Les picks SAFE ont historiquement le meilleur taux de réussite._`;
  return resp;
}

function generateSportMatchesResponse(sportName: string, matches: MatchData[], isPremiumPlus: boolean): string {
  const sportMatches = matches.filter(m => normalize(m.sport).includes(normalize(sportName)) && new Date(m.kickoff) > new Date() && m.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
  
  if (sportMatches.length === 0) {
    // Show stats instead if no upcoming matches
    return `${getSportEmoji(sportName)} Aucun match de **${sportName}** à venir pour le moment.\n\nVoici les stats historiques à la place :\n\n` + generateSportDetailResponse(sportName, []);
  }
  
  let resp = `${getSportEmoji(sportName)} **Meilleurs matchs de ${sportName} à venir :**\n\n`;
  for (const m of sportMatches) {
    const winner = getWinner(m);
    const confEmoji = m.pred_confidence === "SAFE" ? "🟢" : m.pred_confidence === "MODÉRÉ" ? "🟡" : "🔴";
    const date = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    resp += `${confEmoji} **${m.home_team} vs ${m.away_team}** — ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) • ${date}\n`;
  }
  resp += `\n_Classement basé sur le score IA. Aucune garantie de résultat._`;
  return resp;
}

// ── Main fallback router ──────────────────────────────────────
function generateFallbackResponse(userMsg: string, matches: MatchData[], results: ResultData[], stats: StatsData[], isPremiumPlus: boolean): string {
  const q = normalize(userMsg);
  
  // ── 1. Greetings ──
  if (/^(salut|bonjour|hello|hey|coucou|yo|slt|bsr|bjr)/.test(q)) {
    const resolved = results.filter(r => r.result === "win" || r.result === "loss");
    const wr = resolved.length > 0 ? Math.round((resolved.filter(r => r.result === "win").length / resolved.length) * 100) : 0;
    return `👋 Salut ! Je suis **Pronosia AI**, ton assistant pronostics.\n\n📊 Winrate global : **${wr}%** sur ${resolved.length} picks\n\n💡 Tu peux me demander :\n- 🏆 Les meilleurs matchs du jour\n- 📊 Mes stats par sport ou par confiance\n- ⚽ Le détail d'un match précis\n- 🟢 Les picks les plus sûrs\n\n_Je me base uniquement sur les données réelles de notre système IA._`;
  }
  
  // ── 2. Detect sport in the question ──
  const SPORTS_MAP: Record<string, string[]> = {
    football: ["football", "foot", "soccer", "ligue 1", "premier league", "liga", "serie a", "bundesliga"],
    basketball: ["basketball", "basket", "nba", "euroleague"],
    hockey: ["hockey", "nhl", "lnh"],
    baseball: ["baseball", "mlb"],
    tennis: ["tennis", "atp", "wta", "roland garros", "wimbledon"],
    mma: ["mma", "ufc", "combat", "boxe"],
    afl: ["afl", "aussie rules"],
    rugby: ["rugby", "top 14", "six nations"],
  };
  
  let detectedSport: string | null = null;
  for (const [sport, keywords] of Object.entries(SPORTS_MAP)) {
    for (const kw of keywords) {
      if (q.includes(kw)) { detectedSport = sport; break; }
    }
    if (detectedSport) break;
  }
  
  // ── 3. Specific match lookup (only if no broad question detected) ──
  const isBroadQuestion = q.includes("quel") || q.includes("meilleur") || q.includes("moins") || q.includes("plus") || 
    q.includes("donne") || q.includes("montre") || q.includes("liste") || q.includes("tous") ||
    q.includes("stat") || q.includes("taux") || q.includes("winrate") || q.includes("reussite") ||
    q.includes("defaite") || q.includes("defaut") || q.includes("perte") || q.includes("victoire") ||
    q.includes("confiance") || q.includes("safe") || q.includes("sport") || q.includes("categorie");
  
  if (!isBroadQuestion) {
    const match = findMatchInQuestion(userMsg, matches);
    if (match) return generateMatchResponse(match, isPremiumPlus);
    
    for (const r of results) {
      if (q.includes(normalize(r.home_team)) || q.includes(normalize(r.away_team))) {
        let resp = `📋 **${r.home_team} vs ${r.away_team}** (${r.league_name})\n\n`;
        resp += `🏆 Prédiction : **${r.predicted_winner}** (${r.predicted_confidence}, type: ${r.bet_type || "winner"})\n`;
        if (r.result) {
          const emoji = r.result === "win" ? "✅" : "❌";
          resp += `${emoji} Résultat : **${r.result.toUpperCase()}**\n`;
        }
        if (r.actual_home_score != null) resp += `⚽ Score final : ${r.actual_home_score} - ${r.actual_away_score}\n`;
        resp += `\n_Données issues de notre historique de prédictions._`;
        return resp;
      }
    }
  }
  
  // ── 4. "Best/worst sport" or "which category" questions ──
  const asksBestWorstSport = q.includes("quel sport") || q.includes("quelle categorie") || q.includes("quel categorie") || 
    q.includes("classement sport") ||
    (q.includes("categorie") && (q.includes("plus") || q.includes("moins") || q.includes("meilleur") || q.includes("pire"))) ||
    (q.includes("sport") && (q.includes("plus") || q.includes("moins") || q.includes("meilleur") || q.includes("pire") || q.includes("reussite") || q.includes("perte") || q.includes("gagn") || q.includes("defaite") || q.includes("defaut") || q.includes("victoire") || q.includes("perdu") || q.includes("perd"))) ||
    (q.includes("ou") && (q.includes("reussite") || q.includes("perte") || q.includes("defaite") || q.includes("victoire") || q.includes("gagn"))) ||
    (q.includes("moins") && (q.includes("defaite") || q.includes("defaut") || q.includes("perte") || q.includes("perdu"))) ||
    (q.includes("plus") && (q.includes("victoire") || q.includes("gagn") || q.includes("reussite")));
  
  if (asksBestWorstSport && !detectedSport) {
    return generateBestSportResponse(results);
  }
  
  // ── 5. Sport + "confiance"/"match"/"donne"/"montre" → show best matches for that sport ──
  if (detectedSport && (q.includes("confiance") || q.includes("donne") || q.includes("montre") || q.includes("match") || q.includes("prochain") || q.includes("aujourd") || q.includes("pick"))) {
    // Filter matches by this sport and show best ones
    const sportMatches = matches.filter(m => normalize(m.sport).includes(normalize(detectedSport!)));
    
    // If asking about "plus grande confiance" → filter to SAFE
    if (q.includes("grande confiance") || q.includes("plus confian") || q.includes("safe")) {
      const safeMatches = sportMatches.filter(m => m.pred_confidence === "SAFE" && new Date(m.kickoff) > new Date())
        .sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
      if (safeMatches.length > 0) {
        let resp = `${getSportEmoji(detectedSport)} **Matchs ${detectedSport} avec la plus grande confiance :**\n\n`;
        for (const m of safeMatches) {
          const winner = getWinner(m);
          const date = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          resp += `🟢 **${m.home_team} vs ${m.away_team}** — ${winner} (SAFE, IA: ${m.ai_score}/100) • ${date}\n`;
        }
        resp += `\n_Seuls les matchs classés SAFE sont affichés._`;
        return resp;
      }
      // No SAFE, show best available
      const bestAvail = sportMatches.filter(m => new Date(m.kickoff) > new Date() && m.ai_score > 0)
        .sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
      if (bestAvail.length > 0) {
        let resp = `${getSportEmoji(detectedSport)} Aucun match SAFE en **${detectedSport}** actuellement. Voici les meilleurs picks disponibles :\n\n`;
        for (const m of bestAvail) {
          const winner = getWinner(m);
          const confEmoji = m.pred_confidence === "SAFE" ? "🟢" : m.pred_confidence === "MODÉRÉ" ? "🟡" : "🔴";
          const date = new Date(m.kickoff).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          resp += `${confEmoji} **${m.home_team} vs ${m.away_team}** — ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) • ${date}\n`;
        }
        return resp;
      }
      return `${getSportEmoji(detectedSport)} Aucun match de **${detectedSport}** avec prédiction disponible pour le moment.`;
    }
    
    return generateSportMatchesResponse(detectedSport, matches, isPremiumPlus);
  }
  
  // ── 6. Sport + stats-like question ──
  if (detectedSport && (q.includes("stat") || q.includes("taux") || q.includes("reussite") || q.includes("performance") || q.includes("resultat") || q.includes("winrate") || q.includes("perte") || q.includes("gagn") || q.includes("defaite") || q.includes("defaut") || q.includes("victoire") || q.includes("bilan"))) {
    return generateSportDetailResponse(detectedSport, results);
  }
  
  // ── 7. Sport mentioned alone or with short question → show stats ──
  if (detectedSport) {
    return generateSportDetailResponse(detectedSport, results);
  }
  
  // ── 8. Best matches ──
  if (q.includes("meilleur") || q.includes("top") || q.includes("best") || q.includes("recommand")) {
    return generateBestMatchesResponse(matches);
  }
  
  // ── 9. Safe matches ──
  if (q.includes("safe") || q.includes("securis") || q.includes("fiable") || q.includes("confiance") || (q.includes("sur") && (q.includes("match") || q.includes("pick") || q.includes("pari")))) {
    return generateSafeMatchesResponse(matches);
  }
  
  // ── 10. Stats / performance / winrate ──
  if (q.includes("taux") || q.includes("winrate") || q.includes("reussite") || q.includes("performance") || q.includes("stat") || q.includes("resultat") || q.includes("bilan") || q.includes("global") || q.includes("globalite") || q.includes("en general") || q.includes("resume") || q.includes("complet")) {
    return generateStatsResponse(results, stats);
  }
  
  // ── 11. Explanations ──
  if (q.includes("pourquoi") || q.includes("expliqu") || q.includes("raison")) {
    return "🤔 Pour t'expliquer une prédiction, dis-moi le nom d'une équipe ou d'un match ! Par exemple : *\"Pourquoi Germany vs Ghana ?\"*";
  }
  
  // ── 12. "donne moi" / "montre moi" without sport → best matches ──
  if (q.includes("donne") || q.includes("montre") || q.includes("affiche") || q.includes("liste")) {
    if (q.includes("defaite") || q.includes("perte") || q.includes("perdu")) {
      return generateBestSportResponse(results);
    }
    return generateBestMatchesResponse(matches);
  }
  
  // ── 13. Default: try to be helpful ──
  const resolved = results.filter(r => r.result === "win" || r.result === "loss");
  const wr = resolved.length > 0 ? Math.round((resolved.filter(r => r.result === "win").length / resolved.length) * 100) : 0;
  const todayCount = matches.filter(m => isToday(m.kickoff) && m.ai_score > 0).length;
  const sportStats = computeSportStats(resolved);
  const bestSport = sportStats.filter(s => s.total >= 3).sort((a, b) => b.winrate - a.winrate)[0];
  
  let resp = `🤖 Je n'ai pas bien compris ta question. Voici un résumé rapide :\n\n`;
  resp += `📊 **${todayCount}** matchs analysés aujourd'hui • Winrate global : **${wr}%** sur ${resolved.length} picks\n`;
  if (bestSport) {
    resp += `🏆 Meilleur sport : ${getSportEmoji(bestSport.sport)} ${bestSport.sport} (**${bestSport.winrate}%**)\n`;
  }
  resp += `\n💡 **Essaie de me demander :**\n`;
  resp += `- 🏆 *\"Quels sont les meilleurs matchs ?\"*\n`;
  resp += `- 📊 *\"Quel est ton taux de réussite ?\"*\n`;
  resp += `- ⚽ *\"Stats football\"* ou *\"Stats tennis\"*\n`;
  resp += `- 🔍 *\"Dans quel sport tu es le meilleur ?\"*\n`;
  resp += `- 🟢 *\"Quels matchs sont les plus sûrs ?\"*\n`;
  resp += `\n_Je me base uniquement sur les données réelles de notre système IA._`;
  return resp;
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
        .order("kickoff", { ascending: false }).limit(50),
      supabase.from("match_results")
        .select("fixture_id, home_team, away_team, league_name, predicted_winner, predicted_confidence, result, actual_home_score, actual_away_score, bet_type, sport, kickoff")
        .order("kickoff", { ascending: false }).limit(100),
      supabase.from("ai_learning_stats")
        .select("sport, confidence_level, winrate, total_predictions, calibration_error, bet_type, roi")
        .eq("league_name", "_all").eq("odds_bracket", "_all"),
    ]);

    const recentMatches = (matchesRes.data || []) as MatchData[];
    const recentResults = (resultsRes.data || []) as ResultData[];
    const learningStats = (statsRes.data || []) as StatsData[];

    // Build context for AI - strip scores for non-Premium+ users
    const matchContext = recentMatches.map(m => {
      const winner = getWinner(m);
      let line = `• ${m.home_team} vs ${m.away_team} (${m.league_name}, ${m.sport}) - Kickoff: ${m.kickoff} - Prédiction: ${winner} (${m.pred_confidence}, IA: ${m.ai_score}/100) - Probas: ${m.pred_home_win}%/${m.pred_draw}%/${m.pred_away_win}%`;
      if (canSeeScores) {
        line += ` - Score prédit: ${m.pred_score_home}-${m.pred_score_away}`;
      }
      line += ` - BTTS: ${m.pred_btts_prob}% - Over: ${m.pred_over_prob}% - Analyse: ${m.pred_analysis || "N/A"}`;
      if (m.home_score != null) line += ` (Réel: ${m.home_score}-${m.away_score})`;
      return line;
    }).join("\n");

    const resultsContext = recentResults.map(r =>
      `• ${r.home_team} vs ${r.away_team} (${r.league_name}) - Préd: ${r.predicted_winner} (${r.predicted_confidence}, ${r.bet_type || "winner"}) - ${r.result || "attente"}${r.actual_home_score != null ? ` (${r.actual_home_score}-${r.actual_away_score})` : ""}`
    ).join("\n");

    const statsContext = learningStats.filter(s => s.total_predictions >= 5).map(s =>
      `${s.sport}/${s.confidence_level}${s.bet_type !== "_all" ? `/${s.bet_type}` : ""}: ${s.winrate}% (${s.total_predictions} picks, cal: ${s.calibration_error > 0 ? "+" : ""}${s.calibration_error}%, ROI: ${s.roi || 0}%)`
    ).join("\n");

    const scoreRule = canSeeScores
      ? "Tu peux donner les scores prédits."
      : "Tu ne dois JAMAIS donner les scores prédits (pred_score_home/pred_score_away). Si on te demande le score, dis que c'est réservé aux abonnés Premium+.";

    const anomalyRule = canSeeScores
      ? "Tu peux détailler les anomalies et matchs suspects."
      : "Ne donne PAS les détails des anomalies/matchs suspects. Indique que c'est réservé aux abonnés Premium+.";

    const systemPrompt = `Tu es Pronosia AI, l'assistant intelligent de la plateforme Pronosia - un service de pronostics sportifs propulsé par l'intelligence artificielle.

RÈGLES ABSOLUES:
1. Tu es STRICTEMENT COHÉRENT. Pour un même match, tu donnes TOUJOURS la même analyse, quel que soit l'utilisateur.
2. Tu te bases UNIQUEMENT sur les données factuelles ci-dessous. Tu ne modifies JAMAIS une prédiction existante.
3. Tu expliques les facteurs objectifs (probabilités, score IA, analyse) sans jamais changer le verdict.
4. Tu ne fais PAS de nouvelles prédictions. Tu expliques celles qui existent.
5. Tu parles en français, de manière professionnelle mais accessible.
6. Si un match n'est pas dans tes données, dis-le clairement.
7. Tu ne donnes AUCUNE garantie de résultat.
8. ${scoreRule}
9. ${anomalyRule}

MATCHS ACTUELS:
${matchContext || "Aucun match disponible."}

RÉSULTATS RÉCENTS:
${resultsContext || "Aucun résultat."}

PERFORMANCE:
${statsContext || "Pas assez de données."}

Réponds de manière concise avec des emojis pertinents.`;

    // Try AI gateway first, fallback to deterministic engine
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
    const fallbackText = generateFallbackResponse(lastUserMsg, recentMatches, recentResults, learningStats, canSeeScores);
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
