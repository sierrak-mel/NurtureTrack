import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { FeedingReminderSettings } from '@/types';
import { Bell } from 'lucide-react';

function getSettings(): FeedingReminderSettings | null {
  try {
    const stored = localStorage.getItem('onesie-feeding-reminder');
    if (!stored) return null;
    const s = JSON.parse(stored);
    return s.enabled ? s : null;
  } catch { return null; }
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function FeedingReminderBanner() {
  const { feedings, bottleFeeds } = useApp();
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const check = () => {
      const settings = getSettings();
      if (!settings) { setShow(false); return; }

      // Find most recent feed (breast or bottle)
      const lastBreast = feedings.find(f => f.endTime);
      const lastBottle = bottleFeeds[0];
      const times: number[] = [];
      if (lastBreast) times.push(new Date(lastBreast.endTime || lastBreast.startTime).getTime());
      if (lastBottle) times.push(new Date(lastBottle.timestamp).getTime());

      if (times.length === 0) { setShow(false); return; }
      const lastFeedTime = Math.max(...times);
      const now = new Date();
      const hoursSince = (now.getTime() - lastFeedTime) / 3600000;

      // Determine if daytime or nighttime
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const dayStart = timeToMinutes(settings.daytimeStart);
      const dayEnd = timeToMinutes(settings.daytimeEnd);
      const isDaytime = dayStart < dayEnd
        ? (nowMin >= dayStart && nowMin < dayEnd)
        : (nowMin >= dayStart || nowMin < dayEnd);

      const threshold = isDaytime ? settings.daytimeThresholdHrs : settings.nighttimeThresholdHrs;

      if (hoursSince >= threshold) {
        const hrs = Math.floor(hoursSince);
        const mins = Math.floor((hoursSince - hrs) * 60);
        setMsg(`${hrs}h ${mins}m since last feed (${isDaytime ? 'daytime' : 'nighttime'} threshold: ${threshold}h)`);
        setShow(true);
      } else {
        setShow(false);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [feedings, bottleFeeds]);

  if (!show) return null;

  return (
    <div className="bg-onesie-amber/15 border border-onesie-amber/30 rounded-xl mx-4 mt-2 p-3 flex items-start gap-3">
      <Bell className="w-5 h-5 text-onesie-amber shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-nunito font-semibold text-foreground">Feeding Reminder</p>
        <p className="text-xs text-muted-foreground font-nunito">{msg}</p>
      </div>
      <button onClick={() => setShow(false)} className="ml-auto text-xs text-muted-foreground font-nunito hover:text-foreground">✕</button>
    </div>
  );
}
