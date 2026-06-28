-- Run this ONCE in the Supabase SQL Editor (project: ayegbhwjbakcmuxsmint) to
-- schedule the notification sender. It needs the pg_cron and pg_net extensions
-- (enable them first in Dashboard → Database → Extensions, or via the
-- CREATE EXTENSION lines below).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace REPLACE_WITH_CRON_SECRET with the same value you set as the
-- CRON_SECRET Edge Function secret. The publishable key below is public/safe
-- and authorizes the request to the function gateway; x-cron-secret is the
-- real check the function performs.
SELECT cron.schedule(
  'onesie-schedule-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ayegbhwjbakcmuxsmint.supabase.co/functions/v1/send-schedule-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_SGh1NtTqX25Pi7UrGfJDBA_EgjwYKUz',
      'Authorization', 'Bearer sb_publishable_SGh1NtTqX25Pi7UrGfJDBA_EgjwYKUz',
      'x-cron-secret', 'REPLACE_WITH_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To remove it later:  SELECT cron.unschedule('onesie-schedule-notifications');
