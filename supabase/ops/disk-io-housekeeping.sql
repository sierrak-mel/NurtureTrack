-- Run ONCE in the Supabase SQL Editor, after migration 00000000000005.
-- This addresses the *baseline* IO burn: the every-minute cron job, which
-- costs write IO 24/7 whether or not anybody is using the app.

-- ============================================================
-- 1. Drop the notification cron from every minute to every 5 minutes
-- ============================================================
-- Why this is safe — every schedule block in send-schedule-notifications
-- (and in src/lib/schedules.ts) lands on :00 or :30 local time, and
-- before_minutes is only ever 5, 10 or 15. The finest real IANA UTC offset in
-- use today is 15 minutes (e.g. Asia/Kathmandu at +05:45), so local :00/:30
-- always falls on a UTC minute divisible by 5, and so does that minute less
-- 5/10/15. A 5-minute cadence therefore still hits every minute the function
-- could possibly fire on, in every timezone.
--
--   before: 1,440 runs/day    after: 288 runs/day    (80% less)
--
-- Each skipped run is one less cron.job_run_details insert, one less pg_net
-- request + response row, and one less scan of push_subscriptions.
--
-- Replace REPLACE_WITH_CRON_SECRET with the CRON_SECRET Edge Function secret
-- (same value as in cron.sql).
SELECT cron.schedule(
  'onesie-schedule-notifications',   -- same name => replaces the existing job
  '*/5 * * * *',
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

-- Confirm:
SELECT jobid, jobname, schedule, active FROM cron.job;

-- ============================================================
-- 2. Reclaim the cron run-history table
-- ============================================================
-- pg_cron logs every run to cron.job_run_details and never cleans up. At one
-- run a minute that is ~525,000 rows a year of pure churn.
DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days';
VACUUM (ANALYZE) cron.job_run_details;

-- Keep it that way, nightly at 03:10 UTC.
SELECT cron.schedule(
  'prune-cron-history',
  '10 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days'$$
);

-- ============================================================
-- 3. Reclaim the pg_net response table
-- ============================================================
-- Newer pg_net versions expire these on their own; older ones do not.
-- Safe either way. (Errors here just mean your pg_net version names things
-- differently — skip the block if so.)
DELETE FROM net._http_response WHERE created < now() - interval '1 day';
VACUUM (ANALYZE) net._http_response;

SELECT cron.schedule(
  'prune-net-responses',
  '20 3 * * *',
  $$DELETE FROM net._http_response WHERE created < now() - interval '1 day'$$
);

-- ============================================================
-- 4. Reclaim space from the tables that were being seq-scanned
-- ============================================================
-- Repeated full scans plus updates leave dead tuples behind. This compacts
-- them so the new indexes work against a tight heap. VACUUM FULL takes an
-- exclusive lock; these tables are tiny, so it is seconds, but do it when
-- nobody is using the app. Plain VACUUM (no FULL) is the no-lock alternative.
VACUUM (ANALYZE) public.feeding_sessions;
VACUUM (ANALYZE) public.diaper_changes;
VACUUM (ANALYZE) public.sleep_sessions;
VACUUM (ANALYZE) public.pumping_sessions;
VACUUM (ANALYZE) public.bottle_feeds;
VACUUM (ANALYZE) public.caregivers;
VACUUM (ANALYZE) public.baby_profiles;
VACUUM (ANALYZE) public.push_subscriptions;
VACUUM (ANALYZE) public.invite_claim_attempts;

-- ============================================================
-- To undo anything here
-- ============================================================
-- SELECT cron.unschedule('prune-cron-history');
-- SELECT cron.unschedule('prune-net-responses');
-- ...and re-run supabase/functions/send-schedule-notifications/cron.sql to
-- restore the every-minute schedule.
