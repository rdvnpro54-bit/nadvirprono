
-- Favorites table for users to track matches
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id text NOT NULL,
  fixture_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, fixture_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can read own favorites"
  ON public.user_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON public.user_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Match history/results table for winrate tracking
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id integer NOT NULL UNIQUE,
  sport text NOT NULL DEFAULT 'football',
  home_team text NOT NULL,
  away_team text NOT NULL,
  league_name text NOT NULL,
  kickoff timestamp with time zone NOT NULL,
  predicted_winner text NOT NULL,
  predicted_confidence text NOT NULL DEFAULT 'MODÉRÉ',
  pred_home_win numeric NOT NULL DEFAULT 0,
  pred_away_win numeric NOT NULL DEFAULT 0,
  actual_home_score integer,
  actual_away_score integer,
  result text, -- 'win', 'loss', 'pending'
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read match results"
  ON public.match_results FOR SELECT
  TO public
  USING (true);
