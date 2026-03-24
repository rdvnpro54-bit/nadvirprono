
-- Drop overly permissive policies (service role bypasses RLS anyway)
DROP POLICY "Service role can manage cached matches" ON public.cached_matches;
DROP POLICY "Service role can manage cache metadata" ON public.cache_metadata;
