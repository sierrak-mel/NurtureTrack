
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Invite can be claimed" ON public.family_invites;
DROP POLICY IF EXISTS "Anyone can read invite by code" ON public.family_invites;
