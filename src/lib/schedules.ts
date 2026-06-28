// Moms on Call style daily schedules, selected by the baby's age.
// Times are 24h "HH:MM" for the *earliest* start (used for ordering and the
// "where am I now" calc); `timeLabel` is what we show, which may be a range.

export type ScheduleActivityType = 'feed' | 'meal' | 'play' | 'nap' | 'bath' | 'bedtime';

export interface ScheduleBlock {
  time: string;       // "06:00" — earliest start, for ordering / current-block math
  timeLabel: string;  // "6–7:00 AM"
  title: string;      // "Feed", "Nap", "Breakfast"…
  type: ScheduleActivityType;
  detail: string;
}

export interface DaySchedule {
  id: string;
  name: string;
  minDays: number;    // inclusive lower age bound, in days
  maxDays: number;    // inclusive upper age bound, in days
  blocks: ScheduleBlock[];
  notes: string;      // daily-intake guidance footer
}

export const SCHEDULES: DaySchedule[] = [
  {
    id: 'wk2-4',
    name: '2–4 Week Schedule',
    minDays: 0,
    maxDays: 27,
    notes: 'If hungry, fit in 1–2 additional feedings. Babe should eat 7–8 times a day, 3–4 oz/feeding for 21–36 oz/day.',
    blocks: [
      { time: '00:00', timeLabel: '12–2:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, diaper, crib. The goal is to make it to 6 AM.' },
      { time: '06:00', timeLabel: '6–7:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, then back to crib for sleep.' },
      { time: '09:00', timeLabel: '9:00 AM', title: 'Feed', type: 'feed', detail: 'Feed.' },
      { time: '09:30', timeLabel: '9:30 AM', title: 'Play', type: 'play', detail: 'Playtime for the next 10–30 minutes.' },
      { time: '10:00', timeLabel: '10:00 AM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 2 hours as possible).' },
      { time: '12:00', timeLabel: '12:00 PM', title: 'Feed', type: 'feed', detail: 'Feed, even if you need to wake.' },
      { time: '12:30', timeLabel: '12:30 PM', title: 'Play', type: 'play', detail: 'Playtime for the next 10–30 minutes.' },
      { time: '13:00', timeLabel: '1:00 PM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 2 hours as possible).' },
      { time: '15:00', timeLabel: '3:00 PM', title: 'Feed', type: 'feed', detail: 'Feed, even if you have to wake — might be fussy.' },
      { time: '15:30', timeLabel: '3:30 PM', title: 'Play', type: 'play', detail: 'Playtime for the next 10–30 minutes.' },
      { time: '16:00', timeLabel: '4:00 PM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 2 hours as possible).' },
      { time: '18:00', timeLabel: '6:00 PM', title: 'Supper Feed', type: 'feed', detail: 'Supper feed — try not to feed again until 9 PM.' },
      { time: '18:30', timeLabel: '6:30 PM', title: 'Play', type: 'play', detail: 'Playtime, babe will be fussy — tummy time, etc.' },
      { time: '19:00', timeLabel: '7:00 PM', title: 'Nap', type: 'nap', detail: 'Nap, babe may sleep for 1–1½ hours.' },
      { time: '20:30', timeLabel: '8:30 PM', title: 'Bath', type: 'bath', detail: 'Bath time routine.' },
      { time: '21:00', timeLabel: '9:00 PM', title: 'Bedtime Feed', type: 'feed', detail: 'Bedtime feeding — babe will drink more!' },
      { time: '21:30', timeLabel: '9:30 PM', title: 'Bedtime', type: 'bedtime', detail: 'Swaddle, crib, white noise, dark room.' },
    ],
  },
  {
    id: 'wk4-8',
    name: '4–8 Week Schedule',
    minDays: 28,
    maxDays: 55,
    notes: 'Babe should drink 6–7 times a day, 4–6 oz/feeding for 24–42 oz/day.',
    blocks: [
      { time: '02:00', timeLabel: '2–3:00 AM', title: 'Feed', type: 'feed', detail: 'Feed (potentially).' },
      { time: '06:00', timeLabel: '6:00 AM', title: 'Feed', type: 'feed', detail: 'Feed (4–6 oz) at 6 AM if awake, or as late as 7 AM.' },
      { time: '09:00', timeLabel: '9:00 AM', title: 'Feed', type: 'feed', detail: 'Feed (4–6 oz) regardless of whether baby ate at 6 or 7 AM.' },
      { time: '09:30', timeLabel: '9:30 AM', title: 'Play', type: 'play', detail: 'Play time, reading, talking, soft music, etc.' },
      { time: '10:00', timeLabel: '10:00 AM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 2 hours as possible).' },
      { time: '12:00', timeLabel: '12:00 PM', title: 'Feed', type: 'feed', detail: 'Feed (4–6 oz).' },
      { time: '12:30', timeLabel: '12:30 PM', title: 'Play', type: 'play', detail: 'Play time, reading, talking, soft music, etc.' },
      { time: '13:00', timeLabel: '1:00 PM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 2 hours as possible).' },
      { time: '15:00', timeLabel: '3:00 PM', title: 'Feed', type: 'feed', detail: 'Feed (4–6 oz). Baby may be fussier in the evening.' },
      { time: '15:30', timeLabel: '3:30 PM', title: 'Play', type: 'play', detail: 'Play time, reading, talking, soft music, etc.' },
      { time: '16:00', timeLabel: '4:00 PM', title: 'Nap', type: 'nap', detail: 'Nap (may be closer to 1.5 hours).' },
      { time: '17:30', timeLabel: '5:30 PM', title: 'Supper Feed', type: 'feed', detail: 'Supper feed — feeding baby no matter what.' },
      { time: '18:00', timeLabel: '6:00 PM', title: 'Play', type: 'play', detail: 'Bouncy seat, activity mat, tummy time, swing, etc.' },
      { time: '18:30', timeLabel: '6:30 PM', title: 'Nap', type: 'nap', detail: 'May sleep for 45 min to 1.5 hours.' },
      { time: '20:00', timeLabel: '8:00 PM', title: 'Bath', type: 'bath', detail: 'Bathtime routine.' },
      { time: '20:30', timeLabel: '8:30 PM', title: 'Bedtime Feed', type: 'feed', detail: 'Bedtime feed.' },
      { time: '21:00', timeLabel: '9:00 PM', title: 'Bedtime', type: 'bedtime', detail: 'Swaddle, sound machine, dark room.' },
    ],
  },
  {
    id: 'wk8-16',
    name: '8–16 Week Schedule',
    minDays: 56,
    maxDays: 111,
    notes: 'Babe should eat 5–7 times a day, 5–6 oz/feeding for 25–42 oz/day.',
    blocks: [
      { time: '07:00', timeLabel: '7:00 AM', title: 'Feed', type: 'feed', detail: 'Bottle, then awake and playful until the first nap.' },
      { time: '08:30', timeLabel: '8:30 AM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 1½ hours as possible).' },
      { time: '10:00', timeLabel: '10:00 AM', title: 'Feed', type: 'feed', detail: 'Bottle, then awake and playful until nap.' },
      { time: '11:30', timeLabel: '11:30 AM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 1½ hours as possible).' },
      { time: '13:00', timeLabel: '1:00 PM', title: 'Feed', type: 'feed', detail: 'Bottle, then awake and playful until nap.' },
      { time: '14:30', timeLabel: '2:30 PM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 1½ hours as possible).' },
      { time: '16:00', timeLabel: '4:00 PM', title: 'Supper Feed', type: 'feed', detail: "Supper feed — don't feed again until 7:00 PM." },
      { time: '17:30', timeLabel: '5:30 PM', title: 'Nap', type: 'nap', detail: 'Nap, 45 minutes to 1 hr — in a swing or bouncy.' },
      { time: '18:30', timeLabel: '6:30 PM', title: 'Bath', type: 'bath', detail: 'Bath time routine.' },
      { time: '19:00', timeLabel: '7:00 PM', title: 'Bedtime Feed', type: 'feed', detail: 'Bedtime feeding.' },
      { time: '19:30', timeLabel: '7:30 PM', title: 'Bedtime', type: 'bedtime', detail: 'Swaddle, crib, white noise, dark room.' },
    ],
  },
  {
    id: 'wk16-24',
    name: '16–24 Week Schedule',
    minDays: 112,
    maxDays: 181,
    notes: 'Babe should drink 4–5 times a day, 6–8 oz/feeding for 24–40 oz/day.',
    blocks: [
      { time: '06:30', timeLabel: '6:30–7:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until breakfast.' },
      { time: '08:00', timeLabel: '8:00 AM', title: 'Breakfast', type: 'meal', detail: '½ jar of fruit / 1–2 tbsp of cereal.' },
      { time: '09:00', timeLabel: '9:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until nap.' },
      { time: '09:30', timeLabel: '9:30–10:00 AM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 1½ hours as possible).' },
      { time: '11:00', timeLabel: '11:00–11:30 AM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until lunch.' },
      { time: '12:00', timeLabel: '12:00 PM', title: 'Lunch', type: 'meal', detail: '2–4oz veggies / 2–4oz fruit / 1–2 tbsp cereal.' },
      { time: '12:30', timeLabel: '12:30–1:00 PM', title: 'Nap', type: 'nap', detail: 'Nap (as close to 1½ hours as possible).' },
      { time: '14:00', timeLabel: '2:00–2:30 PM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until snack.' },
      { time: '16:00', timeLabel: '4:00 PM', title: 'Snack', type: 'meal', detail: '2–4oz veggies / 2–4oz fruit.' },
      { time: '17:00', timeLabel: '5:00 PM', title: 'Catnap', type: 'nap', detail: 'Catnap depending on tiredness (20–40 minutes).' },
      { time: '18:00', timeLabel: '6:00 PM', title: 'Play', type: 'play', detail: 'Tummy time, play time, reading…' },
      { time: '18:30', timeLabel: '6:30 PM', title: 'Bath', type: 'bath', detail: 'Bath time routine.' },
      { time: '19:00', timeLabel: '7:00 PM', title: 'Bedtime Feed', type: 'feed', detail: 'Bedtime feeding.' },
      { time: '19:30', timeLabel: '7:30–8:00 PM', title: 'Bedtime', type: 'bedtime', detail: 'Crib, white noise, dark room.' },
    ],
  },
  {
    id: 'mo6-8',
    name: '6–8 Month Schedule',
    minDays: 182,
    maxDays: 100000,
    notes: 'Baby should drink 6–8 oz/feeding for a total of 30–40 oz/day.',
    blocks: [
      { time: '06:00', timeLabel: '6:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until breakfast.' },
      { time: '07:30', timeLabel: '7:30 AM', title: 'Breakfast', type: 'meal', detail: '½ jar of fruit / 2–3 tbsp of cereal.' },
      { time: '08:00', timeLabel: '8:00 AM', title: 'Morning Nap', type: 'nap', detail: 'Morning nap (should last 1–2 hours).' },
      { time: '10:00', timeLabel: '10:00 AM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until lunch.' },
      { time: '11:30', timeLabel: '11:30 AM', title: 'Lunch', type: 'meal', detail: '2–4oz veggies / 2–4oz fruit / 2–3 tbsp cereal.' },
      { time: '12:00', timeLabel: '12:00 PM', title: 'Mid-day Nap', type: 'nap', detail: 'Mid-day nap (should last 1½–2 hours).' },
      { time: '14:00', timeLabel: '2:00 PM', title: 'Feed', type: 'feed', detail: 'Feed, then awake and playful until snack.' },
      { time: '15:00', timeLabel: '3:00 PM', title: 'Play', type: 'play', detail: 'Tummy time, practicing sitting up, standing, etc.' },
      { time: '16:00', timeLabel: '4:00 PM', title: 'Feed', type: 'feed', detail: 'Feed, then catnap (should last less than an hour).' },
      { time: '17:30', timeLabel: '5:30 PM', title: 'Dinner', type: 'meal', detail: '2–4oz veggies / 2–4oz fruit.' },
      { time: '18:00', timeLabel: '6:00 PM', title: 'Bath', type: 'bath', detail: 'Bath time routine.' },
      { time: '18:30', timeLabel: '6:30 PM', title: 'Bedtime Feed', type: 'feed', detail: 'Feed, then quiet time, books, songs.' },
      { time: '19:00', timeLabel: '7:00 PM', title: 'Bedtime', type: 'bedtime', detail: 'Crib, white noise, dark room.' },
    ],
  },
];

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Whole days since birth, or null if no/invalid DOB. */
export function ageInDays(dob: string | null | undefined, now = new Date()): number | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (isNaN(birth.getTime())) return null;
  return Math.floor((now.getTime() - birth.getTime()) / 86400000);
}

export function formatAge(days: number): string {
  if (days < 0) return 'not born yet';
  const w = Math.floor(days / 7);
  const d = days % 7;
  if (w < 1) return `${d}d`;
  return `${w}wk ${d}d`;
}

export function getScheduleForAge(days: number): DaySchedule {
  const match = SCHEDULES.find(s => days >= s.minDays && days <= s.maxDays);
  if (match) return match;
  return days < SCHEDULES[0].minDays ? SCHEDULES[0] : SCHEDULES[SCHEDULES.length - 1];
}

/** The block you're in right now and the one coming up next (wraps overnight). */
export function getCurrentAndNext(schedule: DaySchedule, now = new Date()): { current: ScheduleBlock; next: ScheduleBlock } {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...schedule.blocks].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  let current: ScheduleBlock | null = null;
  let next: ScheduleBlock | null = null;
  for (const b of sorted) {
    if (timeToMinutes(b.time) <= nowMin) current = b;
    else if (!next) next = b;
  }
  if (!current) current = sorted[sorted.length - 1]; // before the first block → carry over the overnight/bedtime block
  if (!next) next = sorted[0];                        // after the last block → wrap to tomorrow's first
  return { current, next };
}
