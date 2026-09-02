-- Read-only. Run in the Supabase SQL Editor to confirm where Disk IO is going.
-- Nothing here modifies data. Run the blocks one at a time.

-- ------------------------------------------------------------
-- 1. Which statements actually read from disk?
-- ------------------------------------------------------------
-- shared_blks_read = blocks that missed the buffer cache and hit disk.
-- temp_blks_* = on-disk sorts, which is what an unindexed ORDER BY produces.
-- Expect the AppContext tracker selects near the top before the fix.
SELECT
  calls,
  round(total_exec_time::numeric, 1)              AS total_ms,
  shared_blks_read                                AS disk_block_reads,
  shared_blks_hit,
  temp_blks_read + temp_blks_written              AS temp_blocks,
  round(100.0 * shared_blks_hit
        / nullif(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct,
  left(regexp_replace(query, '\s+', ' ', 'g'), 160) AS query
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 25;

-- ------------------------------------------------------------
-- 2. Sequential scans per table
-- ------------------------------------------------------------
-- A high seq_scan with a high seq_tup_read on a table you always filter by
-- baby_profile_id is the signature of the missing indexes.
SELECT
  schemaname, relname,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  n_live_tup, n_dead_tup,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC
LIMIT 30;

-- ------------------------------------------------------------
-- 3. The every-minute cron/pg_net bookkeeping tables
-- ------------------------------------------------------------
-- pg_cron writes one row per run to cron.job_run_details and never prunes it.
-- pg_net writes a request + response row per http_post. At '* * * * *' that is
-- 1,440 runs/day of pure write IO whether or not anyone opens the app.
SELECT 'cron.job_run_details' AS tbl, count(*) AS rows,
       min(start_time) AS oldest, max(start_time) AS newest
FROM cron.job_run_details;

SELECT jobid, jobname, schedule, active FROM cron.job;

-- pg_net table names vary by extension version; ignore errors on missing ones.
SELECT 'net._http_response' AS tbl, count(*) FROM net._http_response;
SELECT 'net.http_request_queue' AS tbl, count(*) FROM net.http_request_queue;

-- ------------------------------------------------------------
-- 4. What is actually taking up space (incl. system schemas)
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema,
  c.relname AS name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid))       AS table_only
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'm')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 30;

-- ------------------------------------------------------------
-- 5. Verify the fix took effect
-- ------------------------------------------------------------
-- After running migration 00000000000005, this should report STABLE ('s').
-- 'v' = VOLATILE, which is the pre-fix state and the main problem.
SELECT proname, provolatile, prosecdef
FROM pg_proc
WHERE proname = 'get_user_family_ids';

-- And this plan should show Index Scan (not Seq Scan) with no Sort node.
-- Substitute a real baby_profile_id.
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM public.feeding_sessions
-- WHERE baby_profile_id = '00000000-0000-0000-0000-000000000000'
-- ORDER BY start_time DESC;

-- Optional: reset counters so you can measure a clean "after" window.
-- SELECT pg_stat_statements_reset();
-- SELECT pg_stat_reset();
