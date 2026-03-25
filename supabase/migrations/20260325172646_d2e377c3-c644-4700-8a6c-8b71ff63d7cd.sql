-- Remove the old public read policy that exposes all prediction data
DROP POLICY IF EXISTS "Anyone can read cached matches" ON public.cached_matches;

-- Create a restricted policy: only service role (edge functions) can read
-- No public/anon access to the raw table
-- Authenticated users also cannot read directly (must go through edge function)
CREATE POLICY "Only service role can read cached matches"
ON public.cached_matches
FOR SELECT
TO service_role
USING (true);