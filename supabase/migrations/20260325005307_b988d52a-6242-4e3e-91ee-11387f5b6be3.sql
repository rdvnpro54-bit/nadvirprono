-- Reset all free flags
UPDATE cached_matches SET is_free = false WHERE is_free = true;

-- Set 3 diverse matches from today as free (best confidence first)
WITH ranked AS (
  SELECT id, sport, pred_confidence,
    ROW_NUMBER() OVER (
      PARTITION BY sport 
      ORDER BY 
        CASE pred_confidence WHEN 'SAFE' THEN 1 WHEN 'MODÉRÉ' THEN 2 ELSE 3 END,
        GREATEST(pred_home_win, pred_away_win) DESC
    ) as rn
  FROM cached_matches
  WHERE kickoff >= '2026-03-25'
)
UPDATE cached_matches SET is_free = true
WHERE id IN (
  SELECT id FROM ranked WHERE rn = 1 ORDER BY 
    CASE pred_confidence WHEN 'SAFE' THEN 1 WHEN 'MODÉRÉ' THEN 2 ELSE 3 END
  LIMIT 3
);