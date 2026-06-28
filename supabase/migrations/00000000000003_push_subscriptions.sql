-- Stores web-push subscriptions so the server can send schedule notifications.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  baby_profile_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/New_York',
  schedule_notifications boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A user may manage only subscription rows tied to one of their own caregiver records.
-- (The Edge Function uses the service role, which bypasses RLS to send to everyone.)
CREATE POLICY "push_subscriptions: owner can read" ON public.push_subscriptions
  FOR SELECT USING (caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid()));

CREATE POLICY "push_subscriptions: owner can insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid()));

CREATE POLICY "push_subscriptions: owner can update" ON public.push_subscriptions
  FOR UPDATE USING (caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid()))
  WITH CHECK (caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid()));

CREATE POLICY "push_subscriptions: owner can delete" ON public.push_subscriptions
  FOR DELETE USING (caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid()));
