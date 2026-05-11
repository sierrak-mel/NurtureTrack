-- Atomic family-creation RPC. Replaces three separate client-side inserts so
-- the INSERT policies on families/caregivers/baby_profiles can be locked down.
CREATE OR REPLACE FUNCTION public.create_user_family(
  p_display_name text,
  p_baby_name text DEFAULT 'Baby'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.create_user_family(text, text) TO authenticated;

ALTER POLICY "caregivers: authenticated users can insert"
  ON public.caregivers
  WITH CHECK (false);

ALTER POLICY "families: authenticated users can insert"
  ON public.families
  WITH CHECK (false);

ALTER POLICY "baby_profiles: members can insert"
  ON public.baby_profiles
  WITH CHECK (family_id = ANY(get_user_family_ids(auth.uid())));

ALTER POLICY "family_invites: owners can insert"
  ON public.family_invites
  WITH CHECK (
    family_id = ANY(get_user_family_ids(auth.uid()))
    AND created_by = auth.uid()
  );
