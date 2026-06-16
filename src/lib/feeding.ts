import type { FeedingSession, Side } from '@/types';

const THIRTY_MIN_MS = 30 * 60 * 1000;

const alternate = (s: Side): Side => (s === 'left' ? 'right' : s === 'right' ? 'left' : 'left');

/**
 * Recommend which side to start the next feed on.
 *
 * Default behavior alternates from the most recent completed feed.
 *
 * With switch-nursing enabled, a "top-off" is detected: if the last two
 * completed feeds were on opposite sides and started within 30 minutes of
 * each other, they count as one session. In that case we recommend the
 * most-recent (topped-off) side so the next full session starts there.
 *
 * `feedings` is expected sorted by start time, most-recent first (as the
 * app stores them).
 */
export function computeNextSide(
  feedings: FeedingSession[],
  opts: { defaultStartSide: Side; switchNursingEnabled: boolean },
): Side {
  const completed = feedings.filter(f => f.endTime);
  const last = completed[0];
  if (!last) return opts.defaultStartSide;

  if (opts.switchNursingEnabled) {
    const prev = completed[1];
    const bothSingle =
      (last.side === 'left' || last.side === 'right') &&
      prev &&
      (prev.side === 'left' || prev.side === 'right');
    if (bothSingle && last.side !== prev.side) {
      const gapMs = new Date(last.startTime).getTime() - new Date(prev.endTime!).getTime();
      if (gapMs <= THIRTY_MIN_MS) {
        return last.side; // topped off on this side → start here next time
      }
    }
  }

  return alternate(last.side);
}
