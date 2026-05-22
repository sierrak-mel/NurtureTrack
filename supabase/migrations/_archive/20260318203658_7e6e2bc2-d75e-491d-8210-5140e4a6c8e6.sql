
-- Create content_type enum for bottle feeds
CREATE TYPE public.content_type AS ENUM ('breast_milk', 'formula', 'mixed');

-- Create pumping_sessions table
CREATE TABLE public.pumping_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  caregiver_id uuid REFERENCES public.caregivers(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_seconds integer,
  side public.feeding_side NOT NULL DEFAULT 'both',
  volume_oz numeric,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pumping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view pumping" ON public.pumping_sessions FOR SELECT TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can create pumping" ON public.pumping_sessions FOR INSERT TO authenticated
WITH CHECK (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can update pumping" ON public.pumping_sessions FOR UPDATE TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can delete pumping" ON public.pumping_sessions FOR DELETE TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

-- Create bottle_feeds table
CREATE TABLE public.bottle_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_profile_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  caregiver_id uuid REFERENCES public.caregivers(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  amount_oz numeric NOT NULL,
  content_type public.content_type NOT NULL DEFAULT 'breast_milk',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bottle_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view bottles" ON public.bottle_feeds FOR SELECT TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can create bottles" ON public.bottle_feeds FOR INSERT TO authenticated
WITH CHECK (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can update bottles" ON public.bottle_feeds FOR UPDATE TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Family members can delete bottles" ON public.bottle_feeds FOR DELETE TO public
USING (baby_profile_id IN (SELECT bp.id FROM baby_profiles bp WHERE bp.family_id IN (SELECT get_user_family_ids(auth.uid()))));

-- Add unit_preference column to baby_profiles (oz or ml)
ALTER TABLE public.baby_profiles ADD COLUMN unit_preference text NOT NULL DEFAULT 'oz';
