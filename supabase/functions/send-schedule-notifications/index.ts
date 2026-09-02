// Supabase Edge Function: send schedule notifications.
//
// Invoked by pg_cron (every 5 minutes — see supabase/ops/disk-io-housekeeping.sql;
// every schedule block sits on :00/:30 local, so a 5-minute cadence misses
// nothing). For every push subscription with
// schedule_notifications on, it works out the baby's current age + schedule,
// and if a schedule block starts at the current minute (in that device's
// timezone) it sends a web-push notification.
//
// Required secrets (set via the Supabase dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@email.com),
//   CRON_SECRET (any random string; pg_cron must send it in the x-cron-secret header)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Compact mirror of src/lib/schedules.ts (time + title only — keep in sync).
type Block = { time: string; title: string };
type Sched = { minDays: number; maxDays: number; name: string; blocks: Block[] };

const SCHEDULES: Sched[] = [
  { minDays: 0, maxDays: 27, name: '2–4 Week Schedule', blocks: [
    { time: '00:00', title: 'Feed' }, { time: '06:00', title: 'Feed' }, { time: '09:00', title: 'Feed' },
    { time: '09:30', title: 'Play' }, { time: '10:00', title: 'Nap' }, { time: '12:00', title: 'Feed' },
    { time: '12:30', title: 'Play' }, { time: '13:00', title: 'Nap' }, { time: '15:00', title: 'Feed' },
    { time: '15:30', title: 'Play' }, { time: '16:00', title: 'Nap' }, { time: '18:00', title: 'Supper Feed' },
    { time: '18:30', title: 'Play' }, { time: '19:00', title: 'Nap' }, { time: '20:30', title: 'Bath' },
    { time: '21:00', title: 'Bedtime Feed' }, { time: '21:30', title: 'Bedtime' },
  ] },
  { minDays: 28, maxDays: 55, name: '4–8 Week Schedule', blocks: [
    { time: '02:00', title: 'Feed' }, { time: '06:00', title: 'Feed' }, { time: '09:00', title: 'Feed' },
    { time: '09:30', title: 'Play' }, { time: '10:00', title: 'Nap' }, { time: '12:00', title: 'Feed' },
    { time: '12:30', title: 'Play' }, { time: '13:00', title: 'Nap' }, { time: '15:00', title: 'Feed' },
    { time: '15:30', title: 'Play' }, { time: '16:00', title: 'Nap' }, { time: '17:30', title: 'Supper Feed' },
    { time: '18:00', title: 'Play' }, { time: '18:30', title: 'Nap' }, { time: '20:00', title: 'Bath' },
    { time: '20:30', title: 'Bedtime Feed' }, { time: '21:00', title: 'Bedtime' },
  ] },
  { minDays: 56, maxDays: 111, name: '8–16 Week Schedule', blocks: [
    { time: '07:00', title: 'Feed' }, { time: '08:30', title: 'Nap' }, { time: '10:00', title: 'Feed' },
    { time: '11:30', title: 'Nap' }, { time: '13:00', title: 'Feed' }, { time: '14:30', title: 'Nap' },
    { time: '16:00', title: 'Supper Feed' }, { time: '17:30', title: 'Nap' }, { time: '18:30', title: 'Bath' },
    { time: '19:00', title: 'Bedtime Feed' }, { time: '19:30', title: 'Bedtime' },
  ] },
  { minDays: 112, maxDays: 181, name: '16–24 Week Schedule', blocks: [
    { time: '06:30', title: 'Feed' }, { time: '08:00', title: 'Breakfast' }, { time: '09:00', title: 'Feed' },
    { time: '09:30', title: 'Nap' }, { time: '11:00', title: 'Feed' }, { time: '12:00', title: 'Lunch' },
    { time: '12:30', title: 'Nap' }, { time: '14:00', title: 'Feed' }, { time: '16:00', title: 'Snack' },
    { time: '17:00', title: 'Catnap' }, { time: '18:00', title: 'Play' }, { time: '18:30', title: 'Bath' },
    { time: '19:00', title: 'Bedtime Feed' }, { time: '19:30', title: 'Bedtime' },
  ] },
  { minDays: 182, maxDays: 100000, name: '6–8 Month Schedule', blocks: [
    { time: '06:00', title: 'Feed' }, { time: '07:30', title: 'Breakfast' }, { time: '08:00', title: 'Morning Nap' },
    { time: '10:00', title: 'Feed' }, { time: '11:30', title: 'Lunch' }, { time: '12:00', title: 'Mid-day Nap' },
    { time: '14:00', title: 'Feed' }, { time: '15:00', title: 'Play' }, { time: '16:00', title: 'Feed' },
    { time: '17:30', title: 'Dinner' }, { time: '18:00', title: 'Bath' }, { time: '18:30', title: 'Bedtime Feed' },
    { time: '19:00', title: 'Bedtime' },
  ] },
];

function scheduleForAge(days: number): Sched {
  return SCHEDULES.find(s => days >= s.minDays && days <= s.maxDays)
    ?? (days < SCHEDULES[0].minDays ? SCHEDULES[0] : SCHEDULES[SCHEDULES.length - 1]);
}

// Current HH:MM and Y-M-D in a given IANA timezone.
function nowInZone(tz: string): { hhmm: string; ymd: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  let hour = get('hour');
  if (hour === '24') hour = '00';
  return { hhmm: `${hour}:${get('minute')}`, ymd: `${get('year')}-${get('month')}-${get('day')}` };
}

function ageDays(dob: string, todayYmd: string): number {
  const birth = Date.parse(`${dob}T00:00:00Z`);
  const today = Date.parse(`${todayYmd}T00:00:00Z`);
  return Math.floor((today - birth) / 86400000);
}

function hhmmToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@onesie.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, timezone, baby_profile_id, schedule_notifications, notify_at_start, notify_before, before_minutes, baby_profiles(name, date_of_birth)')
    .eq('schedule_notifications', true);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  for (const sub of subs ?? []) {
    const baby = (sub as { baby_profiles?: { name?: string; date_of_birth?: string } }).baby_profiles;
    if (!baby?.date_of_birth) continue;

    const tz = sub.timezone || 'America/New_York';
    const { hhmm, ymd } = nowInZone(tz);
    const days = ageDays(baby.date_of_birth, ymd);
    if (days < 0) continue;

    const schedule = scheduleForAge(days);
    const babyName = baby.name || 'Baby';
    const nowMin = hhmmToMin(hhmm);

    const atStart = sub.notify_at_start !== false; // default on
    const before = sub.notify_before === true;
    const beforeMin = sub.before_minutes ?? 10;

    const toSend: { title: string; body: string; tag: string }[] = [];

    if (atStart) {
      const b = schedule.blocks.find(x => x.time === hhmm);
      if (b) toSend.push({
        title: `⏰ ${b.title}`,
        body: `${babyName} · time for ${b.title.toLowerCase()} (${schedule.name})`,
        tag: `onesie-${b.time}`,
      });
    }

    if (before) {
      const targetTime = minToHHMM(nowMin + beforeMin);
      const b = schedule.blocks.find(x => x.time === targetTime);
      if (b) toSend.push({
        title: `🔔 ${b.title} in ${beforeMin} min`,
        body: `${babyName} · ${b.title} starts soon (${schedule.name})`,
        tag: `onesie-${b.time}-pre`,
      });
    }

    if (toSend.length === 0) continue;

    for (const n of toSend) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: n.title, body: n.body, url: '/schedule', tag: n.tag }),
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired — clean it up and stop trying this device.
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          break;
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, checked: subs?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
