import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Milk, Utensils, Smile, Moon, Bath, BedDouble, CalendarClock } from 'lucide-react';
import {
  ageInDays, formatAge, getScheduleForAge, getCurrentAndNext, timeToMinutes,
  type ScheduleActivityType, type ScheduleBlock,
} from '@/lib/schedules';

const TYPE_META: Record<ScheduleActivityType, { color: string; bg: string; border: string; Icon: typeof Milk; label: string }> = {
  feed:    { color: 'text-onesie-purple', bg: 'bg-onesie-purple/10', border: 'border-onesie-purple', Icon: Milk,     label: 'Feed' },
  meal:    { color: 'text-onesie-amber',  bg: 'bg-onesie-amber/10',  border: 'border-onesie-amber',  Icon: Utensils, label: 'Meal' },
  play:    { color: 'text-onesie-pink',   bg: 'bg-onesie-pink/10',   border: 'border-onesie-pink',   Icon: Smile,    label: 'Play' },
  nap:     { color: 'text-onesie-blue',   bg: 'bg-onesie-blue/10',   border: 'border-onesie-blue',   Icon: Moon,     label: 'Nap' },
  bath:    { color: 'text-onesie-teal',   bg: 'bg-onesie-teal/10',   border: 'border-onesie-teal',   Icon: Bath,     label: 'Bath' },
  bedtime: { color: 'text-onesie-charcoal', bg: 'bg-onesie-charcoal/10', border: 'border-onesie-charcoal', Icon: BedDouble, label: 'Bedtime' },
};

export default function Schedule() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  // Re-tick every minute so the "now" position stays current.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const days = ageInDays(profile?.dateOfBirth, now);

  if (days === null) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4 pt-6">
          <h1 className="text-2xl font-quicksand font-bold text-foreground mb-4">Schedule</h1>
          <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
            <CalendarClock className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-nunito text-foreground mb-1 font-semibold">Add your baby's birthday</p>
            <p className="text-sm text-muted-foreground font-nunito mb-4">
              We use it to show the right daily schedule for {profile?.name || 'your baby'}'s age.
            </p>
            <button onClick={() => navigate('/settings')} className="bg-primary text-primary-foreground rounded-xl px-5 py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity">
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const schedule = getScheduleForAge(days);
  const { current, next } = getCurrentAndNext(schedule, now);
  const sorted = [...schedule.blocks].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const currentMin = timeToMinutes(current.time);

  const currentMeta = TYPE_META[current.type];
  const nextMeta = TYPE_META[next.type];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-quicksand font-bold text-foreground">Schedule</h1>
          <span className="text-sm font-nunito text-muted-foreground">{formatAge(days)} old</span>
        </div>

        {/* Which schedule + right now / next up */}
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-nunito text-muted-foreground">{schedule.name}</p>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${currentMeta.bg}`}>
              <currentMeta.Icon className={`w-5 h-5 ${currentMeta.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-nunito text-muted-foreground">Right now</p>
              <p className="font-quicksand font-bold text-lg text-foreground leading-tight">{current.title}</p>
              <p className="text-xs text-muted-foreground font-nunito truncate">{current.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <nextMeta.Icon className={`w-4 h-4 shrink-0 ${nextMeta.color}`} />
            <p className="text-sm font-nunito text-foreground">
              Next: <span className="font-semibold">{next.title}</span>
              <span className="text-muted-foreground"> · {next.timeLabel}</span>
            </p>
          </div>
        </div>

        {/* Full day timeline */}
        <div className="space-y-2">
          {sorted.map((block, i) => {
            const meta = TYPE_META[block.type];
            const blockMin = timeToMinutes(block.time);
            const isCurrent = block === current;
            const isPast = blockMin < currentMin;
            return (
              <ScheduleRow key={`${block.time}-${i}`} block={block} meta={meta} isCurrent={isCurrent} isPast={isPast} nowLabel={format(now, 'h:mm a')} />
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground/80 font-nunito leading-relaxed">{schedule.notes}</p>
        <p className="text-[11px] text-muted-foreground/60 font-nunito text-center">
          Schedules based on the Moms on Call method · auto-selected from {profile?.name || 'baby'}'s age.
        </p>
      </div>
    </div>
  );
}

function ScheduleRow({ block, meta, isCurrent, isPast, nowLabel }: {
  block: ScheduleBlock;
  meta: typeof TYPE_META[ScheduleActivityType];
  isCurrent: boolean;
  isPast: boolean;
  nowLabel: string;
}) {
  return (
    <div className={`relative bg-card rounded-xl p-4 flex items-center gap-3 border-l-4 transition-opacity ${meta.border} ${
      isCurrent ? 'ring-2 ring-primary shadow-sm' : ''
    } ${isPast ? 'opacity-50' : ''}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
        <meta.Icon className={`w-4 h-4 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-nunito font-semibold text-sm text-foreground">{block.title}</p>
          {isCurrent && (
            <span className="text-[10px] font-nunito font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              Now · {nowLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-nunito">{block.detail}</p>
      </div>
      <span className="text-xs font-nunito font-semibold text-muted-foreground shrink-0 text-right">{block.timeLabel}</span>
    </div>
  );
}
