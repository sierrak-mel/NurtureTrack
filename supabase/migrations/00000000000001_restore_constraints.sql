-- OPTIONAL cleanup. Re-adds constraints that were present in the original
-- migrations but got dropped from production over time. Each block is safe
-- to run independently; review and run whatever you want.
--
-- Before running ANY block, check there is no data that would violate the
-- constraint (e.g. orphaned rows). The bundled DO blocks abort if violations
-- exist, so you can run the file and read the NOTICEs.

-- ============================================================
-- 1. Restore ON DELETE CASCADE on family/baby/caregiver FKs
-- ============================================================
-- Currently a DELETE on families fails if any child rows exist. The original
-- design cascaded all child data when a family was deleted.

ALTER TABLE public.baby_profiles
  DROP CONSTRAINT IF EXISTS baby_profiles_family_id_fkey,
  ADD CONSTRAINT baby_profiles_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.caregivers
  DROP CONSTRAINT IF EXISTS caregivers_family_id_fkey,
  ADD CONSTRAINT caregivers_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.family_invites
  DROP CONSTRAINT IF EXISTS family_invites_family_id_fkey,
  ADD CONSTRAINT family_invites_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.feeding_sessions
  DROP CONSTRAINT IF EXISTS feeding_sessions_baby_profile_id_fkey,
  ADD CONSTRAINT feeding_sessions_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.diaper_changes
  DROP CONSTRAINT IF EXISTS diaper_changes_baby_profile_id_fkey,
  ADD CONSTRAINT diaper_changes_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sleep_sessions
  DROP CONSTRAINT IF EXISTS sleep_sessions_baby_profile_id_fkey,
  ADD CONSTRAINT sleep_sessions_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.pumping_sessions
  DROP CONSTRAINT IF EXISTS pumping_sessions_baby_profile_id_fkey,
  ADD CONSTRAINT pumping_sessions_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bottle_feeds
  DROP CONSTRAINT IF EXISTS bottle_feeds_baby_profile_id_fkey,
  ADD CONSTRAINT bottle_feeds_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.weight_logs
  DROP CONSTRAINT IF EXISTS weight_logs_baby_profile_id_fkey,
  ADD CONSTRAINT weight_logs_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.height_logs
  DROP CONSTRAINT IF EXISTS height_logs_baby_profile_id_fkey,
  ADD CONSTRAINT height_logs_baby_profile_id_fkey
    FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 2. Restore FK from caregivers.user_id -> auth.users(id)
-- ============================================================
-- Without this, deleting an auth user leaves their caregiver row behind.
-- This will fail if any caregivers.user_id no longer matches an auth.users row.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.user_id)
  ) THEN
    RAISE NOTICE 'Skipping caregivers.user_id FK: orphan rows exist. Clean them up first.';
  ELSE
    ALTER TABLE public.caregivers
      ADD CONSTRAINT caregivers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3. Restore UNIQUE(family_id, user_id) on caregivers
-- ============================================================
-- Prevents the same user from appearing twice in the same family.

DO $$
BEGIN
  IF EXISTS (
    SELECT family_id, user_id, count(*)
    FROM public.caregivers
    GROUP BY family_id, user_id
    HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'Skipping caregivers UNIQUE constraint: duplicate (family_id, user_id) rows exist.';
  ELSE
    ALTER TABLE public.caregivers
      ADD CONSTRAINT caregivers_family_id_user_id_key UNIQUE (family_id, user_id);
  END IF;
END $$;

-- ============================================================
-- 4. Restore updated_at trigger on baby_profiles
-- ============================================================
-- Auto-refreshes baby_profiles.updated_at when any row is modified.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_baby_profiles_updated_at ON public.baby_profiles;
CREATE TRIGGER update_baby_profiles_updated_at
  BEFORE UPDATE ON public.baby_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
