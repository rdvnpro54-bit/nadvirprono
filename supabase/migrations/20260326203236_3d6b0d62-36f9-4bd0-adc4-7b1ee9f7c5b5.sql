-- Delete cached_matches that already have results in match_results
DELETE FROM public.cached_matches
WHERE fixture_id IN (
  SELECT fixture_id FROM public.match_results WHERE result IS NOT NULL
);

-- Also delete cached matches whose kickoff is past their sport duration
DELETE FROM public.cached_matches
WHERE (
  (sport = 'football' AND kickoff < now() - interval '120 minutes')
  OR (sport = 'tennis' AND kickoff < now() - interval '180 minutes')
  OR (sport = 'basketball' AND kickoff < now() - interval '150 minutes')
  OR (sport = 'hockey' AND kickoff < now() - interval '150 minutes')
  OR (sport = 'baseball' AND kickoff < now() - interval '210 minutes')
  OR (sport = 'nfl' AND kickoff < now() - interval '210 minutes')
  OR (sport = 'mma' AND kickoff < now() - interval '180 minutes')
  OR (sport = 'f1' AND kickoff < now() - interval '150 minutes')
  OR (sport = 'afl' AND kickoff < now() - interval '150 minutes')
  OR (sport = 'rugby' AND kickoff < now() - interval '120 minutes')
)
AND (
  status IN ('FT','AET','PEN','AWD','WO','CANC','ABD','PST','SUSP','ABANDONED','FINISHED','COMPLETED','ENDED')
  OR (home_score IS NOT NULL AND away_score IS NOT NULL)
  OR kickoff < now() - interval '4 hours'
);