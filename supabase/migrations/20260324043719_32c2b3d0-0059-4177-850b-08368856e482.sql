
-- Table to cache API-Football fixtures with AI predictions
CREATE TABLE public.cached_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL UNIQUE,
  sport TEXT NOT NULL DEFAULT 'football',
  league_name TEXT NOT NULL,
  league_country TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo TEXT,
  away_logo TEXT,
  kickoff TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'NS',
  home_score INTEGER,
  away_score INTEGER,
  pred_home_win NUMERIC NOT NULL DEFAULT 0,
  pred_draw NUMERIC NOT NULL DEFAULT 0,
  pred_away_win NUMERIC NOT NULL DEFAULT 0,
  pred_score_home INTEGER NOT NULL DEFAULT 0,
  pred_score_away INTEGER NOT NULL DEFAULT 0,
  pred_over_under NUMERIC NOT NULL DEFAULT 2.5,
  pred_over_prob NUMERIC NOT NULL DEFAULT 50,
  pred_btts_prob NUMERIC NOT NULL DEFAULT 50,
  pred_confidence TEXT NOT NULL DEFAULT 'MODÉRÉ',
  pred_value_bet BOOLEAN NOT NULL DEFAULT false,
  pred_analysis TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cached_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached matches"
  ON public.cached_matches FOR SELECT
  USING (true);

CREATE INDEX idx_cached_matches_kickoff ON public.cached_matches (kickoff);
CREATE INDEX idx_cached_matches_sport ON public.cached_matches (sport);

CREATE TABLE public.cache_metadata (
  id TEXT PRIMARY KEY DEFAULT 'api_football',
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  request_count_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.cache_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache metadata"
  ON public.cache_metadata FOR SELECT
  USING (true);

INSERT INTO public.cache_metadata (id, last_fetched_at, request_count_today, last_reset_date)
VALUES ('api_football', NULL, 0, CURRENT_DATE);
