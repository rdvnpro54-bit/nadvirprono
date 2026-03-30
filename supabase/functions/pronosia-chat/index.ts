import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
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

    // Check premium
    const { data: sub } = await supabase.from("subscriptions").select("is_premium, plan, expires_at").eq("user_id", user.id).single();
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!role;
    const isPremium = isAdmin || (sub?.is_premium && (!sub.expires_at || new Date(sub.expires_at) > new Date()));

    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Premium required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent matches + results for context (deterministic data)
    const { data: recentMatches } = await supabase
      .from("cached_matches")
      .select("fixture_id, home_team, away_team, league_name, sport, kickoff, pred_home_win, pred_draw, pred_away_win, pred_confidence, pred_analysis, pred_score_home, pred_score_away, pred_btts_prob, pred_over_prob, ai_score, status, home_score, away_score, anomaly_label, streak_mode_level")
      .order("kickoff", { ascending: false })
      .limit(50);

    const { data: recentResults } = await supabase
      .from("match_results")
      .select("fixture_id, home_team, away_team, league_name, predicted_winner, predicted_confidence, result, actual_home_score, actual_away_score, bet_type, sport, kickoff")
      .order("kickoff", { ascending: false })
      .limit(100);

    // Build deterministic match context
    const matchContext = (recentMatches || []).map(m => {
      const maxProb = Math.max(m.pred_home_win, m.pred_draw, m.pred_away_win);
      const winner = m.pred_home_win === maxProb ? m.home_team : m.pred_away_win === maxProb ? m.away_team : "Nul";
      return `• ${m.home_team} vs ${m.away_team} (${m.league_name}, ${m.sport}) - Kickoff: ${m.kickoff} - Prédiction: ${winner} (${m.pred_confidence}, score IA: ${m.ai_score}/100) - Probas: Dom ${m.pred_home_win}% / Nul ${m.pred_draw}% / Ext ${m.pred_away_win}% - Score prédit: ${m.pred_score_home}-${m.pred_score_away} - BTTS: ${m.pred_btts_prob}% - Over 2.5: ${m.pred_over_prob}% - Analyse: ${m.pred_analysis || "N/A"} - Statut: ${m.status}${m.home_score != null ? ` (Score réel: ${m.home_score}-${m.away_score})` : ""}`;
    }).join("\n");

    const resultsContext = (recentResults || []).map(r =>
      `• ${r.home_team} vs ${r.away_team} (${r.league_name}) - Prédiction: ${r.predicted_winner} (${r.predicted_confidence}, type: ${r.bet_type || "winner"}) - Résultat: ${r.result || "en attente"}${r.actual_home_score != null ? ` (${r.actual_home_score}-${r.actual_away_score})` : ""}`
    ).join("\n");

    // Learning stats for context
    const { data: learningStats } = await supabase
      .from("ai_learning_stats")
      .select("sport, confidence_level, winrate, total_predictions, calibration_error, bet_type, roi")
      .eq("league_name", "_all")
      .eq("odds_bracket", "_all");

    const statsContext = (learningStats || []).filter(s => s.total_predictions >= 5).map(s =>
      `${s.sport}/${s.confidence_level}${s.bet_type !== "_all" ? `/${s.bet_type}` : ""}: ${s.winrate}% winrate (${s.total_predictions} picks, calibration: ${s.calibration_error > 0 ? "+" : ""}${s.calibration_error}%, ROI: ${s.roi || 0}%)`
    ).join("\n");

    const systemPrompt = `Tu es Pronosia AI, l'assistant intelligent de la plateforme Pronosia - un service de pronostics sportifs propulsé par l'intelligence artificielle.

RÈGLES ABSOLUES:
1. Tu es STRICTEMENT COHÉRENT dans tes réponses. Pour un même match, tu donnes TOUJOURS la même analyse et la même conclusion, quel que soit l'utilisateur qui pose la question.
2. Tu te bases UNIQUEMENT sur les données factuelles des prédictions stockées ci-dessous. Tu ne modifies JAMAIS une prédiction existante.
3. Quand on te demande pourquoi un match a telle prédiction, tu expliques les facteurs objectifs (probabilités, score IA, analyse technique) sans jamais changer le verdict.
4. Tu ne fais PAS de nouvelles prédictions. Tu expliques et commentes celles qui existent déjà dans le système.
5. Tu parles en français, de manière professionnelle mais accessible.
6. Si on te pose une question sur un match que tu n'as pas dans tes données, dis-le clairement.
7. Tu ne donnes AUCUNE garantie de résultat. Tu rappelles que ce sont des analyses statistiques.

DONNÉES DES MATCHS ACTUELS:
${matchContext || "Aucun match disponible actuellement."}

HISTORIQUE DES RÉSULTATS RÉCENTS:
${resultsContext || "Aucun résultat disponible."}

STATISTIQUES DE PERFORMANCE:
${statsContext || "Pas assez de données."}

Réponds de manière concise et structurée. Utilise des emojis pertinents pour rendre la lecture agréable.`;

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
          ...messages.slice(-20), // Keep last 20 messages for context
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporairement indisponible." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("pronosia-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
