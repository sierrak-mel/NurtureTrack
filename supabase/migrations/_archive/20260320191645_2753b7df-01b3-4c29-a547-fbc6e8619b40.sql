
-- Weight logs table
CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight_oz numeric NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view weight logs" ON public.weight_logs
  FOR SELECT USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can create weight logs" ON public.weight_logs
  FOR INSERT TO authenticated WITH CHECK (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can update weight logs" ON public.weight_logs
  FOR UPDATE USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can delete weight logs" ON public.weight_logs
  FOR DELETE USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

-- Height logs table
CREATE TABLE public.height_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  height_inches numeric NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.height_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view height logs" ON public.height_logs
  FOR SELECT USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can create height logs" ON public.height_logs
  FOR INSERT TO authenticated WITH CHECK (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can update height logs" ON public.height_logs
  FOR UPDATE USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can delete height logs" ON public.height_logs
  FOR DELETE USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));
