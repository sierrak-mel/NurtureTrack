export type Platform = 'ios' | 'android' | 'other';

/** Best-effort device detection for tailoring "add to home screen" steps. */
export function detectPlatform(): Platform {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  // iPadOS reports as Mac, so also treat touch-capable Macs as iOS.
  if (/iphone|ipad|ipod/i.test(ua) || (/Mac/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

/** True when the app is launched from the home screen (already installed). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as { standalone?: boolean }).standalone === true;
}
