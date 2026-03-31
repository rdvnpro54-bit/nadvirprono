-- Fix home wins but score says away wins
UPDATE cached_matches 
SET pred_score_home = CASE 
    WHEN pred_score_home = pred_score_away THEN pred_score_away + 1 
    ELSE GREATEST(pred_score_home, pred_score_away) 
  END,
  pred_score_away = LEAST(pred_score_home, pred_score_away)
WHERE pred_home_win > pred_away_win 
  AND pred_score_home <= pred_score_away;

-- Fix away wins but score says home wins  
UPDATE cached_matches 
SET pred_score_away = CASE 
    WHEN pred_score_home = pred_score_away THEN pred_score_home + 1 
    ELSE GREATEST(pred_score_home, pred_score_away) 
  END,
  pred_score_home = LEAST(pred_score_home, pred_score_away)
WHERE pred_away_win > pred_home_win 
  AND pred_score_away <= pred_score_home;