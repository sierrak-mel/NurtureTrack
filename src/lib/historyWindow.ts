// How much history the app pulls from Supabase on load.
//
// Reads used to be unbounded — `select *` across five tracker tables on every
// mount, growing forever — which was a meaningful part of a Supabase Disk IO
// budget warning. Reads are now scoped to a rolling window that the user can
// widen from the History page.
//
// The floor is 30 days on purpose: Analytics has a 30-day view, and a shorter
// window would silently render it with partial data.

export const HISTORY_WINDOW_KEY = 'onesie.historyWindowDays';
export const HISTORY_WINDOW_DEFAULT_DAYS = 90;

/** `days: null` means all time. */
export const HISTORY_WINDOW_OPTIONS: { days: number | null; label: string }[] = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 3 months' },
  { days: 365, label: 'Last year' },
  { days: null, label: 'All time' },
];
