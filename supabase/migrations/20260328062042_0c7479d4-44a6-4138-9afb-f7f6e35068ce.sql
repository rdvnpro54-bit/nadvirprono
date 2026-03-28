
CREATE TABLE public.ai_learning_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  league_name text NOT NULL DEFAULT '_all',
  confidence_level text NOT NULL,
  total_predictions integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  winrate numeric NOT NULL DEFAULT 0,
  avg_predicted_prob numeric NOT NULL DEFAULT 0,
  avg_actual_winrate numeric NOT NULL DEFAULT 0,
  calibration_error numeric NOT NULL DEFAULT 0,
  common_loss_pattern text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sport, league_name, confidence_level)
);

ALTER TABLE public.ai_learning_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage learning stats"
  ON public.ai_learning_stats FOR ALL TO service_role USING (true);

CREATE POLICY "Anyone can read learning stats"
  ON public.ai_learning_stats FOR SELECT TO public USING (true);
