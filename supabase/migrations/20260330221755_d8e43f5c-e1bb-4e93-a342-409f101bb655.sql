ALTER TABLE public.match_results ADD COLUMN IF NOT EXISTS bet_type text DEFAULT 'winner';

-- Backfill existing results: detect bet type from cached_matches pred_analysis
UPDATE public.match_results mr
SET bet_type = CASE
  WHEN LOWER(cm.pred_analysis) LIKE '%double chance%' OR LOWER(cm.pred_analysis) LIKE '%1x%' OR LOWER(cm.pred_analysis) LIKE '%x2%' OR LOWER(cm.pred_analysis) LIKE '%1n%' OR LOWER(cm.pred_analysis) LIKE '%n2%' THEN 'double_chance'
  WHEN LOWER(cm.pred_analysis) LIKE '%btts%' OR LOWER(cm.pred_analysis) LIKE '%les 2 équipes marquent%' OR LOWER(cm.pred_analysis) LIKE '%les deux équipes marquent%' THEN 'btts'
  WHEN LOWER(cm.pred_analysis) LIKE '%over 2.5%' OR LOWER(cm.pred_analysis) LIKE '%plus de 2.5%' THEN 'over'
  WHEN LOWER(cm.pred_analysis) LIKE '%under 2.5%' OR LOWER(cm.pred_analysis) LIKE '%moins de 2.5%' THEN 'under'
  WHEN LOWER(cm.pred_analysis) LIKE '%match nul%' OR LOWER(cm.pred_analysis) LIKE '%nul probable%' THEN 'draw'
  ELSE 'winner'
END
FROM public.cached_matches cm
WHERE cm.fixture_id = mr.fixture_id AND cm.pred_analysis IS NOT NULL;