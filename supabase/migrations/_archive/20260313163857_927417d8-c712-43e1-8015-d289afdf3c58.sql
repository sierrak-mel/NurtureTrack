
-- Create enum for caregiver roles
CREATE TYPE public.caregiver_role AS ENUM ('owner', 'member');

-- Create enum for feeding side
CREATE TYPE public.feeding_side AS ENUM ('left', 'right', 'both');

-- Create enum for diaper type
CREATE TYPE public.diaper_type AS ENUM ('pee', 'poop', 'both');

-- Create enum for color note
CREATE TYPE public.color_note AS ENUM ('normal', 'unusual', 'bloody');

-- Create enum for sleep type
CREATE TYPE public.sleep_type AS ENUM ('nap', 'night');

-- Create families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create baby_profiles table
CREATE TABLE public.baby_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  default_start_side feeding_side NOT NULL DEFAULT 'left',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create caregivers table (links users to families)
CREATE TABLE public.caregivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role caregiver_role NOT NULL DEFAULT 'member',
  invite_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Create feeding_sessions table
CREATE TABLE public.feeding_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_profile_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  side feeding_side NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diaper_changes table
CREATE TABLE public.diaper_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_profile_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type diaper_type NOT NULL,
  color_note color_note,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sleep_sessions table
CREATE TABLE public.sleep_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_profile_id UUID NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  sleep_type sleep_type NOT NULL DEFAULT 'nap',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function: get family IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_family_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.caregivers WHERE user_id = _user_id
$$;

-- Families: users can see their own families
CREATE POLICY "Users can view their families" ON public.families
  FOR SELECT USING (id IN (SELECT public.get_user_family_ids(auth.uid())));

CREATE POLICY "Authenticated users can create families" ON public.families
  FOR INSERT TO authenticated WITH CHECK (true);

-- Baby profiles: family members can CRUD
CREATE POLICY "Family members can view baby profiles" ON public.baby_profiles
  FOR SELECT USING (family_id IN (SELECT public.get_user_family_ids(auth.uid())));

CREATE POLICY "Family members can create baby profiles" ON public.baby_profiles
  FOR INSERT TO authenticated WITH CHECK (family_id IN (SELECT public.get_user_family_ids(auth.uid())));

CREATE POLICY "Family members can update baby profiles" ON public.baby_profiles
  FOR UPDATE USING (family_id IN (SELECT public.get_user_family_ids(auth.uid())));

-- Caregivers: family members can view, owners can manage
CREATE POLICY "Family members can view caregivers" ON public.caregivers
  FOR SELECT USING (family_id IN (SELECT public.get_user_family_ids(auth.uid())));

CREATE POLICY "Authenticated users can insert themselves as caregiver" ON public.caregivers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own caregiver record" ON public.caregivers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Owners can delete caregivers" ON public.caregivers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.caregivers c
      WHERE c.family_id = caregivers.family_id
        AND c.user_id = auth.uid()
        AND c.role = 'owner'
    )
  );

-- Feeding sessions: family members can CRUD
CREATE POLICY "Family members can view feedings" ON public.feeding_sessions
  FOR SELECT USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can create feedings" ON public.feeding_sessions
  FOR INSERT TO authenticated WITH CHECK (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can update feedings" ON public.feeding_sessions
  FOR UPDATE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can delete feedings" ON public.feeding_sessions
  FOR DELETE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

-- Diaper changes: family members can CRUD
CREATE POLICY "Family members can view diapers" ON public.diaper_changes
  FOR SELECT USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can create diapers" ON public.diaper_changes
  FOR INSERT TO authenticated WITH CHECK (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can update diapers" ON public.diaper_changes
  FOR UPDATE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can delete diapers" ON public.diaper_changes
  FOR DELETE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

-- Sleep sessions: family members can CRUD
CREATE POLICY "Family members can view sleeps" ON public.sleep_sessions
  FOR SELECT USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can create sleeps" ON public.sleep_sessions
  FOR INSERT TO authenticated WITH CHECK (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can update sleeps" ON public.sleep_sessions
  FOR UPDATE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

CREATE POLICY "Family members can delete sleeps" ON public.sleep_sessions
  FOR DELETE USING (baby_profile_id IN (
    SELECT bp.id FROM public.baby_profiles bp WHERE bp.family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  ));

-- Trigger for updated_at on baby_profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_baby_profiles_updated_at
  BEFORE UPDATE ON public.baby_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
