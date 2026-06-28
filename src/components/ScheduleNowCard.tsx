import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Milk, Utensils, Smile, Moon, Bath, BedDouble } from 'lucide-react';
import { ageInDays, getScheduleForAge, getCurrentAndNext, type ScheduleActivityType } from '@/lib/schedules';

const ICONS: Record<ScheduleActivityType, { Icon: typeof Milk; color: string; bg: string }> = {
  feed:    { Icon: Milk,      color: 'text-onesie-purple',   bg: 'bg-onesie-purple/10' },
  meal:    { Icon: Utensils,  color: 'text-onesie-amber',    bg: 'bg-onesie-amber/10' },
  play:    { Icon: Smile,     color: 'text-onesie-pink',     bg: 'bg-onesie-pink/10' },
  nap:     { Icon: Moon,      color: 'text-onesie-blue',     bg: 'bg-onesie-blue/10' },
  bath:    { Icon: Bath,      color: 'text-onesie-teal',     bg: 'bg-onesie-teal/10' },
  bedtime: { Icon: BedDouble, color: 'text-onesie-charcoal', bg: 'bg-onesie-charcoal/10' },
};

export function ScheduleNowCard() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const days = ageInDays(profile?.dateOfBirth, now);
  if (days === null) return null; // no birthday set → nothing to show

  const schedule = getScheduleForAge(days);
  const { current, next } = getCurrentAndNext(schedule, now);
  const meta = ICONS[current.type];

  return (
    <button
      onClick={() => navigate('/schedule')}
      className="w-full bg-card rounded-2xl p-4 shadow-sm border-l-4 border-primary flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
        <meta.Icon className={`w-5 h-5 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-nunito text-muted-foreground">Right now on schedule</p>
        <p className="font-quicksand font-bold text-foreground leading-tight">{current.title}</p>
        <p className="text-xs text-muted-foreground font-nunito truncate">
          Next: {next.title} · {next.timeLabel}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}
