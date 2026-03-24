
-- Allow service role to insert/update/delete cached_matches
CREATE POLICY "Service role can manage cached matches"
  ON public.cached_matches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow service role to manage cache_metadata  
CREATE POLICY "Service role can manage cache metadata"
  ON public.cache_metadata FOR ALL
  USING (true)
  WITH CHECK (true);
