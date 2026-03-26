-- Remove duplicate cron jobs (keep only one fetch + one resolve)
SELECT cron.unschedule(1);
SELECT cron.unschedule(2);

-- Create single fetch-matches job every 10 minutes
SELECT cron.schedule(
  'fetch-matches-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vgktesvijgzurtxtbbut.supabase.co/functions/v1/fetch-matches',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna3Rlc3Zpamd6dXJ0eHRiYnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTY4MDQsImV4cCI6MjA4OTg5MjgwNH0.igsadp5wBMLIHdAWQOiE6zGjPn9w3NxO7AiNfZ58jzM"}'::jsonb,
    body := '{"time": "cron-10min"}'::jsonb
  ) AS request_id;
  $$
);