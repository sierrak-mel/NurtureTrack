# Archived migrations

Historical migration files preserved for reference. The active schema is captured in `../00000000000000_baseline.sql`, which is a snapshot of production as of 2026-05-22.

These files no longer apply cleanly on a fresh database because production drifted from them over time (policy renames, dropped cascades, etc.). Don't run them.

For any future schema change:

1. Make the change in the Supabase dashboard SQL Editor.
2. Capture it as a new file in `../` with a timestamp prefix (e.g. `20260601000000_add_thing.sql`).
3. Commit both the dashboard application (already done) and the file (for source-of-truth).
