
ALTER TABLE public.cached_matches
  ADD COLUMN IF NOT EXISTS pred_winner text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS pred_market text NOT NULL DEFAULT 'NO_BET',
  ADD COLUMN IF NOT EXISTS pred_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pred_engine_version text,
  ADD COLUMN IF NOT EXISTS pred_auto_healed boolean NOT NULL DEFAULT false;
