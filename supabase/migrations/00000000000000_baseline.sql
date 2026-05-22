-- Baseline schema snapshot taken from production on 2026-05-22.
-- Captures the actual prod state, including drift from earlier migrations.
-- See _archive/ for historical migrations, and 00000000000001_restore_constraints.sql
-- for the optional cleanup that re-adds dropped FKs / cascades / unique constraints.

-- ============================================================
-- 1. Enum types
-- ============================================================

CREATE TYPE public.caregiver_role AS ENUM ('owner', 'member');
CREATE TYPE public.color_note AS ENUM ('normal', 'unusual', 'bloody');
CREATE TYPE public.content_type AS ENUM ('breast_milk', 'formula', 'mixed');
CREATE TYPE public.diaper_type AS ENUM ('pee', 'poop', 'both');
CREATE TYPE public.feeding_side AS ENUM ('left', 'right', 'both');
CREATE TYPE public.sleep_type AS ENUM ('nap', 'night');

-- ============================================================
-- 2. Tables
-- ============================================================

CREATE TABLE public.families (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.baby_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name text NOT NULL,
  date_of_birth date,
  default_start_side feeding_side NOT NULL DEFAULT 'left'::feeding_side,
  unit_preference text NOT NULL DEFAULT 'oz'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.caregivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  role caregiver_role NOT NULL DEFAULT 'owner'::caregiver_role,
  invite_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.family_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  invite_code text NOT NULL DEFAULT substring((gen_random_uuid())::text, 1, 8),
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  used_by uuid,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.feeding_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  caregiver_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_seconds integer,
  side feeding_side NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.diaper_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  caregiver_id uuid,
  "timestamp" timestamp with time zone NOT NULL DEFAULT now(),
  type diaper_type NOT NULL,
  color_note color_note,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sleep_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  caregiver_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_seconds integer,
  sleep_type sleep_type NOT NULL DEFAULT 'nap'::sleep_type,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.pumping_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  caregiver_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_seconds integer,
  side feeding_side NOT NULL DEFAULT 'left'::feeding_side,
  volume_oz numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.bottle_feeds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  caregiver_id uuid,
  "timestamp" timestamp with time zone NOT NULL DEFAULT now(),
  amount_oz numeric NOT NULL,
  content_type content_type NOT NULL DEFAULT 'breast_milk'::content_type,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.weight_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  date date NOT NULL,
  weight_oz numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.height_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL,
  date date NOT NULL,
  height_inches numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.invite_claim_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invite_code_attempted text NOT NULL,
  result text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Constraints
-- ============================================================

ALTER TABLE public.families ADD CONSTRAINT families_pkey PRIMARY KEY (id);

ALTER TABLE public.baby_profiles ADD CONSTRAINT baby_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.baby_profiles ADD CONSTRAINT baby_profiles_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id);

ALTER TABLE public.caregivers ADD CONSTRAINT caregivers_pkey PRIMARY KEY (id);
ALTER TABLE public.caregivers ADD CONSTRAINT caregivers_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id);

ALTER TABLE public.family_invites ADD CONSTRAINT family_invites_pkey PRIMARY KEY (id);
ALTER TABLE public.family_invites ADD CONSTRAINT family_invites_invite_code_key UNIQUE (invite_code);
ALTER TABLE public.family_invites ADD CONSTRAINT family_invites_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id);

ALTER TABLE public.feeding_sessions ADD CONSTRAINT feeding_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.feeding_sessions ADD CONSTRAINT feeding_sessions_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);
ALTER TABLE public.feeding_sessions ADD CONSTRAINT feeding_sessions_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);

ALTER TABLE public.diaper_changes ADD CONSTRAINT diaper_changes_pkey PRIMARY KEY (id);
ALTER TABLE public.diaper_changes ADD CONSTRAINT diaper_changes_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);
ALTER TABLE public.diaper_changes ADD CONSTRAINT diaper_changes_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);

ALTER TABLE public.sleep_sessions ADD CONSTRAINT sleep_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.sleep_sessions ADD CONSTRAINT sleep_sessions_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);
ALTER TABLE public.sleep_sessions ADD CONSTRAINT sleep_sessions_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);

ALTER TABLE public.pumping_sessions ADD CONSTRAINT pumping_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.pumping_sessions ADD CONSTRAINT pumping_sessions_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);
ALTER TABLE public.pumping_sessions ADD CONSTRAINT pumping_sessions_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);

ALTER TABLE public.bottle_feeds ADD CONSTRAINT bottle_feeds_pkey PRIMARY KEY (id);
ALTER TABLE public.bottle_feeds ADD CONSTRAINT bottle_feeds_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);
ALTER TABLE public.bottle_feeds ADD CONSTRAINT bottle_feeds_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);

ALTER TABLE public.weight_logs ADD CONSTRAINT weight_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.weight_logs ADD CONSTRAINT weight_logs_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);

ALTER TABLE public.height_logs ADD CONSTRAINT height_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.height_logs ADD CONSTRAINT height_logs_baby_profile_id_fkey FOREIGN KEY (baby_profile_id) REFERENCES public.baby_profiles(id);

ALTER TABLE public.invite_claim_attempts ADD CONSTRAINT invite_claim_attempts_pkey PRIMARY KEY (id);

-- ============================================================
-- 4. Indexes (non-constraint)
-- ============================================================

CREATE INDEX idx_invite_attempts_user_time
  ON public.invite_claim_attempts USING btree (user_id, attempted_at DESC);

-- ============================================================
-- 5. Functions (must come before policies that reference them)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_family_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT array_agg(family_id) FROM caregivers WHERE user_id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_family(
  p_display_name text,
  p_baby_name text DEFAULT 'Baby'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_family_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM caregivers WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'user already belongs to a family';
  END IF;

  INSERT INTO families DEFAULT VALUES RETURNING id INTO v_family_id;

  INSERT INTO caregivers (family_id, user_id, display_name, role)
  VALUES (v_family_id, v_user_id, p_display_name, 'owner');

  INSERT INTO baby_profiles (family_id, name, default_start_side)
  VALUES (v_family_id, p_baby_name, 'left');

  RETURN v_family_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_invite(
  _invite_code text,
  _user_id uuid,
  _display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _invite record;
  _existing record;
  _recent_attempts integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT count(*) INTO _recent_attempts
  FROM public.invite_claim_attempts
  WHERE user_id = _user_id
    AND attempted_at > now() - interval '1 minute';

  IF _recent_attempts >= 10 THEN
    INSERT INTO public.invite_claim_attempts (user_id, invite_code_attempted, result)
    VALUES (_user_id, _invite_code, 'rate_limited');
    RETURN json_build_object('success', false, 'error', 'Too many attempts. Please wait a moment and try again.');
  END IF;

  SELECT * INTO _invite FROM public.family_invites
  WHERE invite_code = _invite_code AND status = 'pending' AND expires_at > now();

  IF _invite IS NULL THEN
    INSERT INTO public.invite_claim_attempts (user_id, invite_code_attempted, result)
    VALUES (_user_id, _invite_code, 'invalid');
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  SELECT * INTO _existing FROM public.caregivers
  WHERE user_id = _user_id AND family_id = _invite.family_id;

  IF _existing IS NOT NULL THEN
    INSERT INTO public.invite_claim_attempts (user_id, invite_code_attempted, result)
    VALUES (_user_id, _invite_code, 'already_member');
    RETURN json_build_object('success', false, 'error', 'You are already a member of this family');
  END IF;

  INSERT INTO public.caregivers (family_id, user_id, display_name, role)
  VALUES (_invite.family_id, _user_id, _display_name, 'member');

  UPDATE public.family_invites
  SET status = 'used', used_by = _user_id, used_at = now()
  WHERE id = _invite.id;

  INSERT INTO public.invite_claim_attempts (user_id, invite_code_attempted, result)
  VALUES (_user_id, _invite_code, 'success');

  RETURN json_build_object('success', true);
END;
$function$;

-- ============================================================
-- 6. Enable Row Level Security
-- ============================================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pumping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottle_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.height_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_claim_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS Policies
-- ============================================================

-- families
CREATE POLICY "families: authenticated users can insert" ON public.families
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "families: members can read" ON public.families
  FOR SELECT TO authenticated
  USING ((id = ANY (get_user_family_ids(auth.uid()))));

-- baby_profiles
CREATE POLICY "baby_profiles: members can insert" ON public.baby_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((family_id = ANY (get_user_family_ids(auth.uid()))));

CREATE POLICY "baby_profiles: members can read" ON public.baby_profiles
  FOR SELECT TO authenticated
  USING ((family_id = ANY (get_user_family_ids(auth.uid()))));

CREATE POLICY "baby_profiles: members can update" ON public.baby_profiles
  FOR UPDATE TO authenticated
  USING ((family_id = ANY (get_user_family_ids(auth.uid()))));

-- caregivers
CREATE POLICY "caregivers: authenticated users can insert" ON public.caregivers
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "caregivers: members can read" ON public.caregivers
  FOR SELECT TO authenticated
  USING ((family_id = ANY (get_user_family_ids(auth.uid()))));

CREATE POLICY "caregivers: owners can delete" ON public.caregivers
  FOR DELETE TO authenticated
  USING ((family_id = ANY (get_user_family_ids(auth.uid()))));

-- family_invites
CREATE POLICY "family_invites: members can read" ON public.family_invites
  FOR SELECT TO authenticated
  USING ((family_id = ANY (get_user_family_ids(auth.uid()))));

CREATE POLICY "family_invites: owners can insert" ON public.family_invites
  FOR INSERT TO authenticated
  WITH CHECK (((family_id = ANY (get_user_family_ids(auth.uid()))) AND (created_by = auth.uid())));

-- feeding_sessions
CREATE POLICY "feeding_sessions: members can all" ON public.feeding_sessions
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- diaper_changes
CREATE POLICY "diaper_changes: members can all" ON public.diaper_changes
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- sleep_sessions
CREATE POLICY "sleep_sessions: members can all" ON public.sleep_sessions
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- pumping_sessions
CREATE POLICY "pumping_sessions: members can all" ON public.pumping_sessions
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- bottle_feeds
CREATE POLICY "bottle_feeds: members can all" ON public.bottle_feeds
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- weight_logs
CREATE POLICY "weight_logs: members can all" ON public.weight_logs
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- height_logs
CREATE POLICY "height_logs: members can all" ON public.height_logs
  FOR ALL TO authenticated
  USING ((baby_profile_id IN (
    SELECT baby_profiles.id FROM baby_profiles
    WHERE (baby_profiles.family_id = ANY (get_user_family_ids(auth.uid())))
  )));

-- invite_claim_attempts has RLS enabled but no policies.
-- Intentional: it's only accessed via the SECURITY DEFINER claim_invite() function.
