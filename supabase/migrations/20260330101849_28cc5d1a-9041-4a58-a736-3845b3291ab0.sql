
-- Add v3.1 fields to cached_matches
ALTER TABLE public.cached_matches
  ADD COLUMN IF NOT EXISTS suspect_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_completeness_score INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS validation_score INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS streak_mode_level TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS consensus_passed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS league_tier INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS context_penalties_total INTEGER DEFAULT 0;

-- League tiers table
CREATE TABLE IF NOT EXISTS public.league_tiers (
  league_name TEXT PRIMARY KEY,
  tier INTEGER NOT NULL DEFAULT 2,
  sport TEXT NOT NULL DEFAULT 'football',
  historical_winrate NUMERIC DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.league_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read league tiers" ON public.league_tiers FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage league tiers" ON public.league_tiers FOR ALL TO service_role USING (true);

-- Daily briefings table
CREATE TABLE IF NOT EXISTS public.daily_briefings (
  date DATE PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'normal',
  leagues_analyzed INTEGER DEFAULT 0,
  matches_discarded INTEGER DEFAULT 0,
  picks_retained INTEGER DEFAULT 0,
  avg_confidence NUMERIC DEFAULT 0,
  daily_focus TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily briefings" ON public.daily_briefings FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage daily briefings" ON public.daily_briefings FOR ALL TO service_role USING (true);

-- Seed league tiers with Tier 1 and Tier 4
INSERT INTO public.league_tiers (league_name, tier, sport) VALUES
  ('Premier League', 1, 'football'),
  ('La Liga', 1, 'football'),
  ('Bundesliga', 1, 'football'),
  ('Serie A', 1, 'football'),
  ('Ligue 1', 1, 'football'),
  ('Champions League', 1, 'football'),
  ('UEFA Champions League', 1, 'football'),
  ('Europa League', 1, 'football'),
  ('UEFA Europa League', 1, 'football'),
  ('NBA', 1, 'basketball'),
  ('NHL', 1, 'hockey'),
  ('NFL', 1, 'nfl'),
  ('ATP', 1, 'tennis'),
  ('WTA', 1, 'tennis'),
  ('Eredivisie', 2, 'football'),
  ('Primeira Liga', 2, 'football'),
  ('Belgian Pro League', 2, 'football'),
  ('MLS', 2, 'football'),
  ('Turkish Super Lig', 2, 'football'),
  ('Championship', 3, 'football'),
  ('Segunda Division', 3, 'football'),
  ('Serie B', 3, 'football'),
  ('Liga MX', 3, 'football'),
  ('Brazilian Serie A', 3, 'football')
ON CONFLICT (league_name) DO NOTHING;
