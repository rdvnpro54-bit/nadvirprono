ALTER TABLE public.cached_matches
ADD COLUMN IF NOT EXISTS anomaly_score integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS anomaly_label text,
ADD COLUMN IF NOT EXISTS anomaly_reason text;