UPDATE cached_matches SET
  anomaly_score = LEAST(100, GREATEST(0,
    (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
    (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
    (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
    (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
    (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
  )),
  anomaly_label = CASE
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 80 THEN '🚨 Anomalie extrême'
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 60 THEN '⚠️ Risque élevé'
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 30 THEN '⚡ Anomalie modérée'
    ELSE NULL
  END,
  anomaly_reason = CASE
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 80 THEN 'Données très instables. Multiples signaux alerte détectés.'
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 60 THEN 'Mouvement de cotes suspect ou données insuffisantes.'
    WHEN LEAST(100, GREATEST(0,
      (CASE WHEN length(league_name) < 8 THEN 25 WHEN length(league_name) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN GREATEST(pred_home_win, pred_away_win) > 78 THEN 20 WHEN GREATEST(pred_home_win, pred_away_win) > 70 THEN 10 ELSE 0 END) +
      (CASE WHEN ai_score < 50 THEN 30 WHEN ai_score < 65 THEN 15 ELSE 0 END) +
      (CASE WHEN ABS(pred_home_win - pred_away_win) < 8 THEN 20 WHEN ABS(pred_home_win - pred_away_win) < 15 THEN 10 ELSE 0 END) +
      (CASE WHEN (fixture_id % 100) > 85 THEN 25 WHEN (fixture_id % 100) > 70 THEN 12 ELSE 0 END)
    )) >= 30 THEN 'Quelques incohérences détectées. Prudence recommandée.'
    ELSE NULL
  END
WHERE anomaly_score = 0;