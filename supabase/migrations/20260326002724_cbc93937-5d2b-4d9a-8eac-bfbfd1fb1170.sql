
-- Add unique constraint on fixture_id in match_results (prevents duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_results_fixture_id_key'
  ) THEN
    ALTER TABLE public.match_results ADD CONSTRAINT match_results_fixture_id_key UNIQUE (fixture_id);
  END IF;
END $$;

-- Add unique constraint on fixture_id in cached_matches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cached_matches_fixture_id_key'
  ) THEN
    ALTER TABLE public.cached_matches ADD CONSTRAINT cached_matches_fixture_id_key UNIQUE (fixture_id);
  END IF;
END $$;
