
-- League performance tracking and blacklist system
CREATE TABLE IF NOT EXISTS public.league_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL DEFAULT 'football',
  league_name text NOT NULL,
  total_picks integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  winrate numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0,
  is_blacklisted boolean NOT NULL DEFAULT false,
  blacklisted_at timestamp with time zone,
  blacklist_expires_at timestamp with time zone,
  blacklist_reason text,
  consecutive_bad_weeks integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sport, league_name)
);

ALTER TABLE public.league_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read league performance" ON public.league_performance
  FOR SELECT TO public USING (true);

CREATE POLICY "Service role can manage league performance" ON public.league_performance
  FOR ALL TO service_role USING (true);

-- Weekly audit reports
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_picks integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  winrate numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0,
  best_league text,
  worst_league text,
  best_bet_type text,
  streak_mode_effectiveness numeric,
  consensus_rate numeric,
  fallback_rate numeric,
  report_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly reports" ON public.weekly_reports
  FOR SELECT TO public USING (true);

CREATE POLICY "Service role can manage weekly reports" ON public.weekly_reports
  FOR ALL TO service_role USING (true);

-- Add new tracking columns to ai_learning_stats
ALTER TABLE public.ai_learning_stats
  ADD COLUMN IF NOT EXISTS bet_type text DEFAULT '_all',
  ADD COLUMN IF NOT EXISTS odds_bracket text DEFAULT '_all',
  ADD COLUMN IF NOT EXISTS day_of_week text DEFAULT '_all',
  ADD COLUMN IF NOT EXISTS consensus_passed boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS streak_mode_active boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS roi numeric DEFAULT 0;
