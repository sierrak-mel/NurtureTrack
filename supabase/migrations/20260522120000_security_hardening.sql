-- Rate-limit claim_invite and tighten TO public policies.

CREATE TABLE IF NOT EXISTS public.invite_claim_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invite_code_attempted text NOT NULL,
  result text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_attempts_user_time
  ON public.invite_claim_attempts (user_id, attempted_at DESC);

ALTER TABLE public.invite_claim_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_invite(
  _invite_code text,
  _user_id uuid,
  _display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
