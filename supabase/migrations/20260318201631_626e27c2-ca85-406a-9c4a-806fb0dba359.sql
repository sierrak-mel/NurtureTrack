
-- Create family_invites table
CREATE TABLE public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by uuid,
  used_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
);

-- RLS
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Family members can view their invites
CREATE POLICY "Family members can view invites"
ON public.family_invites FOR SELECT
TO public
USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

-- Authenticated family members can create invites
CREATE POLICY "Family members can create invites"
ON public.family_invites FOR INSERT
TO authenticated
WITH CHECK (family_id IN (SELECT get_user_family_ids(auth.uid())));

-- Anyone authenticated can read an invite by code (for joining)
CREATE POLICY "Anyone can read invite by code"
ON public.family_invites FOR SELECT
TO authenticated
USING (true);

-- Family owners can delete invites
CREATE POLICY "Family members can delete invites"
ON public.family_invites FOR DELETE
TO public
USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

-- Allow updating invite status (for claiming)
CREATE POLICY "Invite can be claimed"
ON public.family_invites FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to claim an invite code
CREATE OR REPLACE FUNCTION public.claim_invite(_invite_code text, _user_id uuid, _display_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite record;
  _existing record;
BEGIN
  -- Find the invite
  SELECT * INTO _invite FROM public.family_invites
  WHERE invite_code = _invite_code AND status = 'pending' AND expires_at > now();

  IF _invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Check if user is already in this family
  SELECT * INTO _existing FROM public.caregivers
  WHERE user_id = _user_id AND family_id = _invite.family_id;

  IF _existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are already a member of this family');
  END IF;

  -- Add user as caregiver
  INSERT INTO public.caregivers (family_id, user_id, display_name, role)
  VALUES (_invite.family_id, _user_id, _display_name, 'member');

  -- Mark invite as used
  UPDATE public.family_invites
  SET status = 'used', used_by = _user_id, used_at = now()
  WHERE id = _invite.id;

  RETURN json_build_object('success', true);
END;
$$;
