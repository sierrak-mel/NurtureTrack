
-- Tighten families INSERT policy - restrict to authenticated users only (the WITH CHECK true is intentional since family_id linkage is controlled by caregivers table)
-- Drop and recreate with a more specific check
DROP POLICY "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create families" ON public.families
  FOR INSERT TO authenticated WITH CHECK (
    -- Only allow if no existing family for this user (one family per user for now)
    NOT EXISTS (SELECT 1 FROM public.caregivers WHERE user_id = auth.uid())
  );
