import { describe, it, expect } from 'vitest';
import {
  HISTORY_WINDOW_OPTIONS,
  HISTORY_WINDOW_DEFAULT_DAYS,
} from '@/lib/historyWindow';

// Analytics renders a 30-day view. If the history window could be set shorter
// than that, those charts would silently show partial data rather than empty
// or an error — so the floor is a real contract, not a preference.
const ANALYTICS_MAX_DAYS = 30;

describe('history window options', () => {
  it('never offers a window shorter than the Analytics range', () => {
    const finite = HISTORY_WINDOW_OPTIONS.map(o => o.days).filter((d): d is number => d !== null);
    expect(finite.length).toBeGreaterThan(0);
    expect(Math.min(...finite)).toBeGreaterThanOrEqual(ANALYTICS_MAX_DAYS);
  });

  it('offers an all-time escape hatch', () => {
    expect(HISTORY_WINDOW_OPTIONS.some(o => o.days === null)).toBe(true);
  });

  it('has a default that is one of the offered options', () => {
    expect(HISTORY_WINDOW_OPTIONS.map(o => o.days)).toContain(HISTORY_WINDOW_DEFAULT_DAYS);
  });
});
