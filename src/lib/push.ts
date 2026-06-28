import { supabase } from '@/integrations/supabase/client';

// Public VAPID key — safe to ship in the client. The matching private key
// lives only as a Supabase Edge Function secret.
const VAPID_PUBLIC_KEY = 'BLezU22DklefycL98n-rsArFDpLM3HipIQeaRmi3CryftoourNrefh8Zerkxp7Z7mt800_jUsHAj9NC1RmeRUb0';

export function isPushSupported(): boolean {
  return typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && typeof window !== 'undefined'
    && 'PushManager' in window
    && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

/** Whether this device currently has an active push subscription + granted permission. */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/**
 * Ask for permission, subscribe to push, and store the subscription so the
 * server can send schedule notifications to this device.
 * Returns an error message string on failure, or null on success.
 */
export async function enablePush(opts: { caregiverId: string; babyProfileId: string }): Promise<string | null> {
  if (!isPushSupported()) return 'This device or browser does not support notifications.';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'Notifications permission was not granted.';

  try {
    const reg = await getRegistration();
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

    const { error } = await (supabase.from('push_subscriptions' as never) as never as {
      upsert: (v: unknown, o: unknown) => Promise<{ error: { message: string } | null }>;
    }).upsert({
      caregiver_id: opts.caregiverId,
      baby_profile_id: opts.babyProfileId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      timezone,
      schedule_notifications: true,
    }, { onConflict: 'endpoint' });

    if (error) return error.message;
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not enable notifications.';
  }
}

export interface NotificationPrefs {
  atStart: boolean;
  before: boolean;
  beforeMinutes: number;
}

async function currentEndpoint(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}

/** Read this device's reminder preferences (or null if not subscribed). */
export async function getPrefs(): Promise<NotificationPrefs | null> {
  const endpoint = await currentEndpoint();
  if (!endpoint) return null;
  const { data } = await (supabase.from('push_subscriptions' as never) as never as {
    select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { notify_at_start: boolean; notify_before: boolean; before_minutes: number } | null }> } };
  }).select('notify_at_start, notify_before, before_minutes').eq('endpoint', endpoint).maybeSingle();
  if (!data) return null;
  return { atStart: data.notify_at_start, before: data.notify_before, beforeMinutes: data.before_minutes };
}

/** Update this device's reminder preferences. */
export async function updatePrefs(prefs: NotificationPrefs): Promise<void> {
  const endpoint = await currentEndpoint();
  if (!endpoint) return;
  await (supabase.from('push_subscriptions' as never) as never as {
    update: (v: unknown) => { eq: (k: string, val: string) => Promise<unknown> };
  }).update({
    notify_at_start: prefs.atStart,
    notify_before: prefs.before,
    before_minutes: prefs.beforeMinutes,
  }).eq('endpoint', endpoint);
}

/** Unsubscribe this device and remove its stored subscription. */
export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await (supabase.from('push_subscriptions' as never) as never as {
        delete: () => { eq: (c: string, v: string) => Promise<unknown> };
      }).delete().eq('endpoint', endpoint);
    }
  } catch {
    /* ignore — best effort */
  }
}
