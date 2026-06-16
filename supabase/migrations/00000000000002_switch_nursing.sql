-- Add switch-nursing preference to baby profiles.
-- When enabled, the feeding recommendation accounts for "top-off" sessions:
-- if the last two completed feeds were on opposite sides within 30 minutes,
-- the next recommendation is the most-recent (topped-off) side rather than alternating.

ALTER TABLE public.baby_profiles
  ADD COLUMN IF NOT EXISTS switch_nursing_enabled boolean NOT NULL DEFAULT false;
