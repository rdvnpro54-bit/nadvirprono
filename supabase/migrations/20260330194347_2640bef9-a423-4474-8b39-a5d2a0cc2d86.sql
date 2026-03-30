ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS ai_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.cached_matches ADD COLUMN IF NOT EXISTS ai_hidden_reason text DEFAULT NULL;