-- Run this ONCE in the Supabase SQL Editor (project: ayegbhwjbakcmuxsmint) to
-- schedule the notification sender.
--
-- NOTE (2026-09-02): the '* * * * *' schedule below was a significant source of
-- baseline Disk IO — 1,440 runs/day, each writing a cron.job_run_details row
-- and a pg_net request/response pair. supabase/ops/disk-io-housekeeping.sql
-- replaces it with '*/5 * * * *', which still covers every minute a schedule
-- block can fire on. Prefer that file for new setups.
--
-- Either way this needs the pg_cron and pg_net extensions (enable them first in
-- Dashboard → Database → Extensions, or via the CREATE EXTENSION lines below).

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
