-- Per-device notification preferences for schedule reminders.
--   notify_at_start  → ping when a block begins
--   notify_before    → ping N minutes before a block begins
--   before_minutes   → N (5 / 10 / 15)

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS notify_at_start boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_before boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS before_minutes integer NOT NULL DEFAULT 10;
