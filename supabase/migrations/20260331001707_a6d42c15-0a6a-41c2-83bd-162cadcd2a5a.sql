-- Fix: when home is predicted winner but score says otherwise
UPDATE cached_matches
SET 
  pred_score_home = GREATEST(pred_score_home, pred_score_away) + CASE WHEN pred_score_home = pred_score_away THEN 1 ELSE 0 END,
  pred_score_away = LEAST(pred_score_home, pred_score_away)
WHERE pred_home_win > pred_away_win 
  AND pred_score_home <= pred_score_away
  AND pred_confidence != 'LOCKED'
  AND ai_score > 0
  AND pred_home_win > 0
  AND status = 'NS';

-- Fix: when away is predicted winner but score says otherwise  
UPDATE cached_matches
SET
  pred_score_away = GREATEST(pred_score_home, pred_score_away) + CASE WHEN pred_score_home = pred_score_away THEN 1 ELSE 0 END,
  pred_score_home = LEAST(pred_score_home, pred_score_away)
WHERE pred_away_win > pred_home_win
  AND pred_score_away <= pred_score_home
  AND pred_confidence != 'LOCKED'
  AND ai_score > 0
  AND pred_home_win > 0
  AND status = 'NS';

-- Fix: when draw is predicted but scores differ
UPDATE cached_matches
SET
  pred_score_home = ROUND((pred_score_home + pred_score_away) / 2.0),
  pred_score_away = ROUND((pred_score_home + pred_score_away) / 2.0)
WHERE pred_home_win = pred_away_win
  AND pred_score_home != pred_score_away
  AND pred_confidence != 'LOCKED'
  AND ai_score > 0
  AND pred_home_win > 0
  AND status = 'NS';