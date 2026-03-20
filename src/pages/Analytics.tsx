import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval, addDays, startOfWeek, differenceInMinutes } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FeedingSession, DiaperChange, SleepSession } from '@/types';

/* ── helpers ─────────────────────────────────────────────────────── */

const PURPLE = 'hsl(266,34%,47%)';
const TEAL = 'hsl(163,33%,47%)';
const BLUE = 'hsl(216,60%,68%)';
const PINK = 'hsl(330,50%,62%)';
const TEAL_LIGHT = 'hsl(163,33%,62%)';

function dayLabel(d: Date) { return format(d, 'EEE'); }
function shortDate(d: Date) { return format(d, 'MMM d'); }

function inRange(iso: string, start: Date, end: Date) {
  const d = new Date(iso);
  return isWithinInterval(d, { start, end });
}

/* ── sub-components ──────────────────────────────────────────────── */

function PeriodToggle({ days, setDays }: { days: 7 | 30; setDays: (d: 7 | 30) => void }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      <button onClick={() => setDays(7)} className={`px-3 py-1 rounded-md text-xs font-nunito transition-colors ${days === 7 ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>7 days</button>
      <button onClick={() => setDays(30)} className={`px-3 py-1 rounded-md text-xs font-nunito transition-colors ${days === 30 ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>30 days</button>
    </div>
  );
}

/* ── Feeding Charts ──────────────────────────────────────────────── */

function FeedingCharts({ feedings, days }: { feedings: FeedingSession[]; days: 7 | 30 }) {
  const now = new Date();
  const interval = { start: startOfDay(subDays(now, days - 1)), end: endOfDay(now) };
  const allDays = eachDayOfInterval(interval);

  const perDay = useMemo(() => allDays.map(d => {
    const dayFeeds = feedings.filter(f => f.endTime && inRange(f.startTime, startOfDay(d), endOfDay(d)));
    return { day: dayLabel(d), date: shortDate(d), count: dayFeeds.length, avgMin: dayFeeds.length ? Math.round(dayFeeds.reduce((s, f) => s + (f.durationSeconds || 0), 0) / dayFeeds.length / 60) : 0 };
  }), [feedings, days]);

  const sideCounts = useMemo(() => {
    const ranged = feedings.filter(f => f.endTime && inRange(f.startTime, interval.start, interval.end));
    let left = 0, right = 0, both = 0;
    ranged.forEach(f => { if (f.side === 'left') left++; else if (f.side === 'right') right++; else both++; });
    return [
      { name: 'Left', value: left, color: PURPLE },
      { name: 'Right', value: right, color: PINK },
      { name: 'Both', value: both, color: 'hsl(266,34%,70%)' },
    ].filter(s => s.value > 0);
  }, [feedings, days]);

  const avgGapHrs = useMemo(() => {
    const sorted = feedings.filter(f => f.endTime && inRange(f.startTime, interval.start, interval.end)).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    if (sorted.length < 2) return null;
    let totalMin = 0;
    for (let i = 1; i < sorted.length; i++) totalMin += differenceInMinutes(new Date(sorted[i].startTime), new Date(sorted[i - 1].startTime));
    return (totalMin / (sorted.length - 1) / 60).toFixed(1);
  }, [feedings, days]);

  const avgDurMin = useMemo(() => {
    const ranged = feedings.filter(f => f.endTime && f.durationSeconds && inRange(f.startTime, interval.start, interval.end));
    if (!ranged.length) return null;
    return Math.round(ranged.reduce((s, f) => s + (f.durationSeconds || 0), 0) / ranged.length / 60);
  }, [feedings, days]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground font-nunito">Avg Duration</p>
          <p className="text-2xl font-quicksand font-bold text-nurture-purple">{avgDurMin ?? '—'}<span className="text-sm font-normal"> min</span></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground font-nunito">Avg Gap</p>
          <p className="text-2xl font-quicksand font-bold text-nurture-purple">{avgGapHrs ?? '—'}<span className="text-sm font-normal"> hrs</span></p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-nunito font-semibold text-foreground mb-3">Feeds per day</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={perDay} barSize={days > 7 ? 8 : 20}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={days > 7 ? 'date' : 'day'} tick={{ fontSize: 11 }} interval={days > 7 ? 4 : 0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Bar dataKey="count" fill={PURPLE} radius={[6, 6, 0, 0]} name="Feeds" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {sideCounts.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-nunito font-semibold text-foreground mb-3">Side distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sideCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {sideCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

/* ── Diaper Charts ───────────────────────────────────────────────── */

function DiaperCharts({ diapers, days }: { diapers: DiaperChange[]; days: 7 | 30 }) {
  const now = new Date();
  const interval = { start: startOfDay(subDays(now, days - 1)), end: endOfDay(now) };
  const allDays = eachDayOfInterval(interval);

  const perDay = useMemo(() => allDays.map(d => {
    const dayD = diapers.filter(x => inRange(x.timestamp, startOfDay(d), endOfDay(d)));
    return {
      day: dayLabel(d), date: shortDate(d),
      pee: dayD.filter(x => x.type === 'pee' || x.type === 'both').length,
      poop: dayD.filter(x => x.type === 'poop' || x.type === 'both').length,
    };
  }), [diapers, days]);

  const totalInRange = diapers.filter(x => inRange(x.timestamp, interval.start, interval.end)).length;
  const avgPerDay = totalInRange ? (totalInRange / days).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <Card className="p-4 text-center">
        <p className="text-xs text-muted-foreground font-nunito">Daily avg changes</p>
        <p className="text-2xl font-quicksand font-bold text-nurture-teal">{avgPerDay}</p>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-nunito font-semibold text-foreground mb-3">Diapers per day</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={perDay} barSize={days > 7 ? 8 : 20}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={days > 7 ? 'date' : 'day'} tick={{ fontSize: 11 }} interval={days > 7 ? 4 : 0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Bar dataKey="pee" stackId="a" fill={TEAL_LIGHT} name="Pee" radius={[0, 0, 0, 0]} />
            <Bar dataKey="poop" stackId="a" fill={TEAL} name="Poop" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Sleep Charts ────────────────────────────────────────────────── */

function SleepCharts({ sleeps, days }: { sleeps: SleepSession[]; days: 7 | 30 }) {
  const now = new Date();
  const interval = { start: startOfDay(subDays(now, days - 1)), end: endOfDay(now) };
  const allDays = eachDayOfInterval(interval);

  const perDay = useMemo(() => allDays.map(d => {
    const daySleeps = sleeps.filter(s => s.endTime && inRange(s.startTime, startOfDay(d), endOfDay(d)));
    const totalHrs = daySleeps.reduce((s, x) => s + (x.durationSeconds || 0), 0) / 3600;
    const longest = daySleeps.reduce((m, x) => Math.max(m, x.durationSeconds || 0), 0) / 3600;
    const napHrs = daySleeps.filter(x => x.sleepType === 'nap').reduce((s, x) => s + (x.durationSeconds || 0), 0) / 3600;
    const nightHrs = daySleeps.filter(x => x.sleepType === 'night').reduce((s, x) => s + (x.durationSeconds || 0), 0) / 3600;
    return { day: dayLabel(d), date: shortDate(d), total: +totalHrs.toFixed(1), longest: +longest.toFixed(1), nap: +napHrs.toFixed(1), night: +nightHrs.toFixed(1) };
  }), [sleeps, days]);

  const avgNapMin = useMemo(() => {
    const naps = sleeps.filter(s => s.endTime && s.sleepType === 'nap' && s.durationSeconds && inRange(s.startTime, interval.start, interval.end));
    if (!naps.length) return null;
    return Math.round(naps.reduce((s, n) => s + (n.durationSeconds || 0), 0) / naps.length / 60);
  }, [sleeps, days]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground font-nunito">Avg Nap</p>
          <p className="text-2xl font-quicksand font-bold text-nurture-blue">{avgNapMin ?? '—'}<span className="text-sm font-normal"> min</span></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground font-nunito">Best Stretch</p>
          <p className="text-2xl font-quicksand font-bold text-nurture-blue">{perDay.length ? Math.max(...perDay.map(d => d.longest)).toFixed(1) : '—'}<span className="text-sm font-normal"> hrs</span></p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-nunito font-semibold text-foreground mb-3">Total sleep per day</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={perDay} barSize={days > 7 ? 8 : 20}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={days > 7 ? 'date' : 'day'} tick={{ fontSize: 11 }} interval={days > 7 ? 4 : 0} />
            <YAxis tick={{ fontSize: 11 }} width={28} unit="h" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Bar dataKey="nap" stackId="a" fill={BLUE} name="Nap" />
            <Bar dataKey="night" stackId="a" fill="hsl(216,60%,48%)" name="Night" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Weekly Calendar Timeline ────────────────────────────────────── */

const HOUR_H = 20; // px per hour

function WeeklyTimeline({ feedings, diapers, sleeps }: { feedings: FeedingSession[]; diapers: DiaperChange[]; sleeps: SleepSession[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const weekStart = startOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const label = `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d')}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="text-sm font-nunito font-semibold text-foreground">{label}</p>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1" style={{ minWidth: 560 }}>
          {/* hour labels column */}
          <div className="w-8 shrink-0 pt-6">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ height: HOUR_H }} className="text-[9px] text-muted-foreground font-nunito leading-none flex items-start">
                {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
              </div>
            ))}
          </div>

          {/* day columns */}
          {weekDays.map(day => {
            const ds = startOfDay(day);
            const de = endOfDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

            const dayFeeds = feedings.filter(f => f.endTime && inRange(f.startTime, ds, de));
            const dayDiapers = diapers.filter(d => inRange(d.timestamp, ds, de));
            const daySleeps = sleeps.filter(s => s.endTime && inRange(s.startTime, ds, de));

            return (
              <div key={day.toISOString()} className="flex-1 min-w-[64px]">
                <div className={`text-center text-[10px] font-nunito font-semibold mb-1 py-1 rounded-md ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE d')}
                </div>
                <div className="relative bg-muted/40 rounded-lg" style={{ height: HOUR_H * 24 }}>
                  {/* hour grid lines */}
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="absolute w-full border-t border-border/30" style={{ top: h * HOUR_H }} />
                  ))}

                  {/* sleep blocks */}
                  {daySleeps.map(s => {
                    const st = new Date(s.startTime);
                    const et = new Date(s.endTime!);
                    const topPx = (st.getHours() + st.getMinutes() / 60) * HOUR_H;
                    const hPx = Math.max(4, ((et.getTime() - st.getTime()) / 3600000) * HOUR_H);
                    return <div key={s.id} className="absolute left-0.5 right-0.5 rounded-sm opacity-60" style={{ top: topPx, height: hPx, backgroundColor: BLUE }} title={`Sleep ${format(st, 'HH:mm')}–${format(et, 'HH:mm')}`} />;
                  })}

                  {/* feeding blocks */}
                  {dayFeeds.map(f => {
                    const st = new Date(f.startTime);
                    const et = new Date(f.endTime!);
                    const topPx = (st.getHours() + st.getMinutes() / 60) * HOUR_H;
                    const hPx = Math.max(4, ((et.getTime() - st.getTime()) / 3600000) * HOUR_H);
                    return <div key={f.id} className="absolute left-1 right-1 rounded-sm opacity-70" style={{ top: topPx, height: hPx, backgroundColor: PURPLE }} title={`Feed ${f.side} ${format(st, 'HH:mm')}–${format(et, 'HH:mm')}`} />;
                  })}

                  {/* diaper dots */}
                  {dayDiapers.map(d => {
                    const t = new Date(d.timestamp);
                    const topPx = (t.getHours() + t.getMinutes() / 60) * HOUR_H;
                    return <div key={d.id} className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ top: topPx - 4, backgroundColor: TEAL }} title={`Diaper ${d.type} ${format(t, 'HH:mm')}`} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex justify-center gap-4 text-[10px] font-nunito text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: PURPLE }} /> Feed</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: TEAL }} /> Diaper</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: BLUE }} /> Sleep</span>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function Analytics() {
  const { feedings, diapers, sleeps } = useApp();
  const [days, setDays] = useState<7 | 30>(7);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-quicksand font-bold text-foreground">Analytics</h1>
          <Button variant="outline" size="sm" className="font-nunito text-xs gap-1.5" onClick={() => navigate('/growth')}>
            📈 Growth
          </Button>
        </div>

        {/* Weekly Timeline */}
        <Card className="p-4">
          <WeeklyTimeline feedings={feedings} diapers={diapers} sleeps={sleeps} />
        </Card>

        {/* Charts */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-quicksand font-semibold text-foreground">Stats</h2>
          <PeriodToggle days={days} setDays={setDays} />
        </div>

        <Tabs defaultValue="feeding" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="feeding" className="flex-1 text-xs font-nunito">🍼 Feeding</TabsTrigger>
            <TabsTrigger value="diaper" className="flex-1 text-xs font-nunito">🧷 Diaper</TabsTrigger>
            <TabsTrigger value="sleep" className="flex-1 text-xs font-nunito">😴 Sleep</TabsTrigger>
          </TabsList>
          <TabsContent value="feeding"><FeedingCharts feedings={feedings} days={days} /></TabsContent>
          <TabsContent value="diaper"><DiaperCharts diapers={diapers} days={days} /></TabsContent>
          <TabsContent value="sleep"><SleepCharts sleeps={sleeps} days={days} /></TabsContent>
        </Tabs>

        {feedings.length === 0 && diapers.length === 0 && sleeps.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground font-nunito">Start logging to see your analytics! 📊</p>
          </div>
        )}
      </div>
    </div>
  );
}
