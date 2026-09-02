-- Disk IO remediation, 2026-09-02.
--
-- Triggered by a Supabase "depleting its Disk IO Budget" warning. Two root
-- causes, both of which turn small queries into large amounts of disk reads:
--
--   1. get_user_family_ids() was VOLATILE (the default for a function with no
--      volatility marker). Postgres cannot cache or inline a VOLATILE function,
--      so every RLS policy that calls it re-executed it *once per candidate
--      row* — and each execution scanned public.caregivers. Loading 2,000
--      feeding rows meant ~2,000 scans of caregivers plus ~2,000 evaluations of
--      the baby_profiles subquery. Marking it STABLE (and wrapping the calls in
--      a sub-select) collapses that to a single evaluation per query.
--
--   2. None of the tracker tables had an index on baby_profile_id, and
--      caregivers/baby_profiles had none on their lookup columns. Every read
--      was a sequential scan plus an on-disk sort.
--
-- Safe to re-run: every statement is idempotent. Policies are recreated with
-- identical semantics — no change to who can see or write what.

-- ============================================================
-- 1. Make the RLS helper STABLE (the big win)
-- ============================================================
-- STABLE = "same result for the same arguments within a single statement",
-- which is true here and lets the planner hoist the call into an InitPlan.
-- Also pins search_path, which a SECURITY DEFINER function should always do.

CREATE OR REPLACE FUNCTION public.get_user_family_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT array_agg(family_id) FROM caregivers WHERE user_id = _user_id;
$function$;

-- ============================================================
-- 2. Indexes for the RLS lookups themselves
-- ============================================================
-- get_user_family_ids() filters caregivers by user_id; every policy on the
-- tracker tables then filters baby_profiles by family_id. Both were seq scans.

CREATE INDEX IF NOT EXISTS idx_caregivers_user_id
  ON public.caregivers USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_caregivers_family_id
  ON public.caregivers USING btree (family_id);

CREATE INDEX IF NOT EXISTS idx_baby_profiles_family_id
  ON public.baby_profiles USING btree (family_id);

-- ============================================================
-- 3. Indexes for the app's actual read patterns
-- ============================================================
-- AppContext.loadTrackerData() runs, for each table:
--   select * where baby_profile_id = $1 order by <time> desc
-- These composite indexes serve both the filter and the sort, so the sort
-- disappears from the plan entirely.

CREATE INDEX IF NOT EXISTS idx_feeding_sessions_profile_start
  ON public.feeding_sessions USING btree (baby_profile_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_sessions_profile_start
  ON public.sleep_sessions USING btree (baby_profile_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_pumping_sessions_profile_start
  ON public.pumping_sessions USING btree (baby_profile_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_diaper_changes_profile_ts
  ON public.diaper_changes USING btree (baby_profile_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_bottle_feeds_profile_ts
  ON public.bottle_feeds USING btree (baby_profile_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_weight_logs_profile_date
  ON public.weight_logs USING btree (baby_profile_id, date);

CREATE INDEX IF NOT EXISTS idx_height_logs_profile_date
  ON public.height_logs USING btree (baby_profile_id, date);

-- Supporting indexes for the FK columns used by policies and cascades.
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_caregiver
  ON public.feeding_sessions USING btree (caregiver_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_caregiver
  ON public.sleep_sessions USING btree (caregiver_id);
CREATE INDEX IF NOT EXISTS idx_pumping_sessions_caregiver
  ON public.pumping_sessions USING btree (caregiver_id);
CREATE INDEX IF NOT EXISTS idx_diaper_changes_caregiver
  ON public.diaper_changes USING btree (caregiver_id);
CREATE INDEX IF NOT EXISTS idx_bottle_feeds_caregiver
  ON public.bottle_feeds USING btree (caregiver_id);

CREATE INDEX IF NOT EXISTS idx_family_invites_family_id
  ON public.family_invites USING btree (family_id);

-- push_subscriptions: the every-minute Edge Function reads
--   select ... where schedule_notifications = true  (+ join to baby_profiles)
-- 1,440 sequential scans a day, forever. Partial index keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_push_subs_schedule_on
  ON public.push_subscriptions USING btree (baby_profile_id)
  WHERE schedule_notifications;

CREATE INDEX IF NOT EXISTS idx_push_subs_caregiver
  ON public.push_subscriptions USING btree (caregiver_id);

-- ============================================================
-- 4. Recreate policies so auth.uid() / the helper evaluate once per query
-- ============================================================
-- Wrapping in (SELECT ...) turns the call into an InitPlan that runs a single
-- time, rather than being re-checked against every row. Semantics unchanged.

-- families
DROP POLICY IF EXISTS "families: members can read" ON public.families;
CREATE POLICY "families: members can read" ON public.families
  FOR SELECT TO authenticated
  USING (id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

-- baby_profiles
DROP POLICY IF EXISTS "baby_profiles: members can insert" ON public.baby_profiles;
CREATE POLICY "baby_profiles: members can insert" ON public.baby_profiles
  FOR INSERT TO authenticated
  WITH CHECK (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

DROP POLICY IF EXISTS "baby_profiles: members can read" ON public.baby_profiles;
CREATE POLICY "baby_profiles: members can read" ON public.baby_profiles
  FOR SELECT TO authenticated
  USING (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

DROP POLICY IF EXISTS "baby_profiles: members can update" ON public.baby_profiles;
CREATE POLICY "baby_profiles: members can update" ON public.baby_profiles
  FOR UPDATE TO authenticated
  USING (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

-- caregivers
DROP POLICY IF EXISTS "caregivers: members can read" ON public.caregivers;
CREATE POLICY "caregivers: members can read" ON public.caregivers
  FOR SELECT TO authenticated
  USING (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

DROP POLICY IF EXISTS "caregivers: owners can delete" ON public.caregivers;
CREATE POLICY "caregivers: owners can delete" ON public.caregivers
  FOR DELETE TO authenticated
  USING (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

-- family_invites
DROP POLICY IF EXISTS "family_invites: members can read" ON public.family_invites;
CREATE POLICY "family_invites: members can read" ON public.family_invites
  FOR SELECT TO authenticated
  USING (family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid())))));

DROP POLICY IF EXISTS "family_invites: owners can insert" ON public.family_invites;
CREATE POLICY "family_invites: owners can insert" ON public.family_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
    AND created_by = (SELECT auth.uid())
  );

-- Tracker tables: one FOR ALL policy each, identical shape.
DROP POLICY IF EXISTS "feeding_sessions: members can all" ON public.feeding_sessions;
CREATE POLICY "feeding_sessions: members can all" ON public.feeding_sessions
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "diaper_changes: members can all" ON public.diaper_changes;
CREATE POLICY "diaper_changes: members can all" ON public.diaper_changes
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "sleep_sessions: members can all" ON public.sleep_sessions;
CREATE POLICY "sleep_sessions: members can all" ON public.sleep_sessions
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "pumping_sessions: members can all" ON public.pumping_sessions;
CREATE POLICY "pumping_sessions: members can all" ON public.pumping_sessions
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "bottle_feeds: members can all" ON public.bottle_feeds;
CREATE POLICY "bottle_feeds: members can all" ON public.bottle_feeds
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "weight_logs: members can all" ON public.weight_logs;
CREATE POLICY "weight_logs: members can all" ON public.weight_logs
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

DROP POLICY IF EXISTS "height_logs: members can all" ON public.height_logs;
CREATE POLICY "height_logs: members can all" ON public.height_logs
  FOR ALL TO authenticated
  USING (baby_profile_id IN (
    SELECT id FROM public.baby_profiles
    WHERE family_id = ANY ((SELECT public.get_user_family_ids((SELECT auth.uid()))))
  ));

-- push_subscriptions
DROP POLICY IF EXISTS "push_subscriptions: owner can read" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: owner can read" ON public.push_subscriptions
  FOR SELECT USING (caregiver_id IN (
    SELECT id FROM public.caregivers WHERE user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "push_subscriptions: owner can insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: owner can insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (caregiver_id IN (
    SELECT id FROM public.caregivers WHERE user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "push_subscriptions: owner can update" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: owner can update" ON public.push_subscriptions
  FOR UPDATE USING (caregiver_id IN (
    SELECT id FROM public.caregivers WHERE user_id = (SELECT auth.uid())
  ))
  WITH CHECK (caregiver_id IN (
    SELECT id FROM public.caregivers WHERE user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "push_subscriptions: owner can delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: owner can delete" ON public.push_subscriptions
  FOR DELETE USING (caregiver_id IN (
    SELECT id FROM public.caregivers WHERE user_id = (SELECT auth.uid())
  ));

-- ============================================================
-- 5. Refresh planner statistics so the new indexes get used immediately
-- ============================================================

ANALYZE public.caregivers;
ANALYZE public.baby_profiles;
ANALYZE public.feeding_sessions;
ANALYZE public.diaper_changes;
ANALYZE public.sleep_sessions;
ANALYZE public.pumping_sessions;
ANALYZE public.bottle_feeds;
ANALYZE public.weight_logs;
ANALYZE public.height_logs;
ANALYZE public.push_subscriptions;
