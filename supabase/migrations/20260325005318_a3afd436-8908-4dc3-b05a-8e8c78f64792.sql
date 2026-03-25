-- Set 2 more free matches from today (next best ones)
WITH already_free AS (
  SELECT id FROM cached_matches WHERE is_free = true
),
candidates AS (
  SELECT id, pred_confidence, GREATEST(pred_home_win, pred_away_win) as best_prob
  FROM cached_matches
  WHERE kickoff >= '2026-03-25' AND id NOT IN (SELECT id FROM already_free)
  ORDER BY 
    CASE pred_confidence WHEN 'SAFE' THEN 1 WHEN 'MODÉRÉ' THEN 2 ELSE 3 END,
    GREATEST(pred_home_win, pred_away_win) DESC
  LIMIT 2
)
UPDATE cached_matches SET is_free = true
WHERE id IN (SELECT id FROM candidates);