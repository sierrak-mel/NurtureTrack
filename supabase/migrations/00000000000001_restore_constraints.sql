-- OPTIONAL cleanup. Restores constraints that were present in the original
-- migrations but disappeared from production over time.
--
-- IMPORTANT: this file preserves the existing ON DELETE NO ACTION ("delete
-- blocked when children exist") behavior on all foreign keys. It does NOT
-- introduce any cascading deletes. So running this is purely additive:
-- no new way for data to disappear.
--
-- Each section is idempotent and safe to run more than once. The DO blocks
-- skip cleanly if existing data would violate a new constraint.

-- ============================================================
-- 1. Restore FK from caregivers.user_id -> auth.users(id)
-- ============================================================
-- Without this, deleting a Supabase auth user leaves an orphan caregivers row.
-- WITH this (ON DELETE NO ACTION), deleting a user is blocked until you
-- remove their caregiver row first — matches the "deletion blocked" pattern.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.user_id)
  ) THEN
    RAISE NOTICE 'Skipping caregivers.user_id FK: orphan caregiver rows exist (user_id no longer matches an auth.users row). Clean those up first, then re-run.';
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregivers_user_id_fkey'
      AND conrelid = 'public.caregivers'::regclass
  ) THEN
    RAISE NOTICE 'caregivers_user_id_fkey already exists; skipping.';
  ELSE
    ALTER TABLE public.caregivers
      ADD CONSTRAINT caregivers_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
        -- No ON DELETE clause => default NO ACTION (blocks delete).
  END IF;
END $$;

-- ============================================================
-- 2. Restore UNIQUE(family_id, user_id) on caregivers
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
    RAISE NOTICE 'Skipping caregivers UNIQUE constraint: duplicate (family_id, user_id) rows exist. Clean those up first.';
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregivers_family_id_user_id_key'
      AND conrelid = 'public.caregivers'::regclass
  ) THEN
    RAISE NOTICE 'caregivers_family_id_user_id_key already exists; skipping.';
  ELSE
    ALTER TABLE public.caregivers
      ADD CONSTRAINT caregivers_family_id_user_id_key UNIQUE (family_id, user_id);
  END IF;
END $$;

-- ============================================================
-- 3. Restore updated_at trigger on baby_profiles
-- ============================================================
-- Auto-refreshes baby_profiles.updated_at whenever a row is modified.
-- Without this, the column has a default but never changes after creation.

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
