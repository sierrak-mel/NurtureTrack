import { useApp } from '@/context/AppContext';
import { useTimer, formatTimer, formatTimeAgo } from '@/hooks/useTimer';
import { Moon, Sun } from 'lucide-react';

export function SleepCard() {
  const { sleeps, activeSleep, startSleep, stopSleep } = useApp();
  const elapsed = useTimer(activeSleep?.startTime || null);

  const lastCompleted = sleeps.find(s => s.endTime);

  // Total sleep last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const totalSleep24h = sleeps
    .filter(s => s.endTime && new Date(s.startTime).getTime() > oneDayAgo)
    .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalHours = Math.floor(totalSleep24h / 3600);
  const totalMins = Math.floor((totalSleep24h % 3600) / 60);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-blue">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-nurture-blue/10 flex items-center justify-center">
          <Moon className="w-4 h-4 text-nurture-blue" />
        </div>
        <h2 className="font-quicksand font-bold text-lg text-foreground">Sleep</h2>
      </div>

      {activeSleep ? (
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Moon className="w-5 h-5 text-nurture-blue" />
            <span className="text-sm font-nunito text-muted-foreground">Baby is sleeping</span>
          </div>
          <p className="font-quicksand text-4xl font-bold text-nurture-blue tabular-nums">
            {formatTimer(elapsed)}
          </p>
        </div>
      ) : (
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-nurture-pink" />
            <span className="text-sm font-nunito text-muted-foreground">Baby is awake</span>
          </div>
          {lastCompleted ? (
            <>
              <p className="text-sm text-muted-foreground font-nunito">
                Last sleep: <span className="font-semibold text-foreground">{formatTimeAgo(lastCompleted.endTime!)}</span>
                {' · '}{Math.floor((lastCompleted.durationSeconds || 0) / 60)}m
              </p>
              <p className="text-sm text-muted-foreground font-nunito">
                Last 24h: {totalHours}h {totalMins}m total sleep
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-nunito">
              No sleep sessions logged yet — sweet dreams ahead! 🌙
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => activeSleep ? stopSleep() : startSleep()}
        className="w-full bg-nurture-blue text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity mt-2"
      >
        {activeSleep ? 'End Nap' : 'Start Nap'}
      </button>
    </div>
  );
}
