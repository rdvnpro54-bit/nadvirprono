CREATE TABLE public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_league_id integer NOT NULL UNIQUE,
  nom text NOT NULL,
  pays text NOT NULL,
  sport text NOT NULL DEFAULT 'football',
  priorite integer NOT NULL DEFAULT 100,
  actif boolean NOT NULL DEFAULT false,
  saison_courante integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leagues TO anon, authenticated;
GRANT ALL ON public.leagues TO service_role;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);

CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  source text NOT NULL,
  debut timestamptz NOT NULL DEFAULT now(),
  fin timestamptz,
  statut text NOT NULL DEFAULT 'running',
  nb_lignes integer NOT NULL DEFAULT 0,
  erreur text,
  credits_api_restants integer
);
CREATE INDEX sync_logs_job_debut ON public.sync_logs(job, debut DESC);
GRANT SELECT ON public.sync_logs TO anon, authenticated;
GRANT ALL ON public.sync_logs TO service_role;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sync logs" ON public.sync_logs FOR SELECT USING (true);

CREATE TABLE public.pronosia_config (
  cle text PRIMARY KEY,
  valeur jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pronosia_config TO anon, authenticated;
GRANT ALL ON public.pronosia_config TO service_role;
ALTER TABLE public.pronosia_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read config" ON public.pronosia_config FOR SELECT USING (true);

INSERT INTO public.pronosia_config(cle, valeur) VALUES
 ('poids_marche', '0.5'), ('seuil_value_edge', '0.05'), ('seuil_safe_proba', '0.75'),
 ('seuil_elite_confiance', '80'), ('seuil_elite_completude', '0.8'), ('proba_max', '0.9'),
 ('retard_donnees_min', '15');

INSERT INTO public.leagues(api_league_id, nom, pays, priorite, actif) VALUES
 (61,'Ligue 1','France',1,true),(62,'Ligue 2','France',2,true),(63,'National','France',3,true),
 (66,'Coupe de France','France',4,true),(526,'Trophée des Champions','France',5,true),
 (2,'Ligue des Champions','Europe',10,true),(3,'Ligue Europa','Europe',11,true),(848,'Ligue Conférence','Europe',12,true),
 (39,'Premier League','Angleterre',20,true),(140,'LaLiga','Espagne',21,true),(135,'Serie A','Italie',22,true),(78,'Bundesliga','Allemagne',23,true);

CREATE UNIQUE INDEX IF NOT EXISTS cached_matches_fixture_sport_uniq ON public.cached_matches(fixture_id, sport);