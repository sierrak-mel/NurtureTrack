import { useApp } from '@/context/AppContext';
import { useTimer, formatTimer, formatTimeAgo } from '@/hooks/useTimer';
import { Milk } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import type { Side } from '@/types';

export function PumpingCard() {
  const { pumpings, activePumping, startPumping, stopPumping, profile } = useApp();
  const elapsed = useTimer(activePumping?.startTime || null);
  const [selectedSide, setSelectedSide] = useState<Side>('both');
  const [volume, setVolume] = useState('');

  const unit = profile?.unitPreference || 'oz';
  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;
  const fromOz = (oz: number) => unit === 'ml' ? oz * 29.5735 : oz;

  const lastCompleted = pumpings.find(p => p.endTime);

  // Today's total volume
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTotal = pumpings
    .filter(p => p.endTime && p.volumeOz && new Date(p.endTime) >= today)
    .reduce((sum, p) => sum + (p.volumeOz || 0), 0);

  const handleStart = () => {
    startPumping(selectedSide);
    setVolume('');
  };

  const handleStop = () => {
    const vol = volume ? toOz(parseFloat(volume)) : null;
    stopPumping(vol);
    setVolume('');
  };

  if (activePumping) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-amber">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-nurture-amber/10 flex items-center justify-center">
            <Milk className="w-4 h-4 text-nurture-amber" />
          </div>
          <h2 className="font-quicksand font-bold text-lg text-foreground">Pumping</h2>
        </div>
        <div className="text-center py-4">
          <p className="font-quicksand text-4xl font-bold text-nurture-amber tabular-nums">
            {formatTimer(elapsed)}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {(['left', 'right', 'both'] as Side[]).map(s => (
              <button
                key={s}
                className={`px-4 py-2 rounded-full text-sm font-semibold font-nunito min-h-[40px] transition-colors ${
                  activePumping.side === s
                    ? 'bg-nurture-amber text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-sm font-nunito text-muted-foreground">Volume ({unit})</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder={`0.0 ${unit}`}
              value={volume}
              onChange={e => setVolume(e.target.value)}
              className="mt-1 text-center"
            />
          </div>
        </div>
        <button
          onClick={handleStop}
          className="w-full bg-nurture-amber text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] mt-3 hover:opacity-90 transition-opacity"
        >
          Stop Pumping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-amber">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-nurture-amber/10 flex items-center justify-center">
          <Milk className="w-4 h-4 text-nurture-amber" />
        </div>
        <h2 className="font-quicksand font-bold text-lg text-foreground">Pumping</h2>
      </div>
      {lastCompleted ? (
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground font-nunito">
            Last pump: <span className="font-semibold text-foreground">{formatTimeAgo(lastCompleted.endTime!)}</span>
          </p>
          <p className="text-sm text-muted-foreground font-nunito">
            {lastCompleted.side.charAt(0).toUpperCase() + lastCompleted.side.slice(1)} side
            · {Math.floor((lastCompleted.durationSeconds || 0) / 60)}m
            {lastCompleted.volumeOz ? ` · ${fromOz(lastCompleted.volumeOz).toFixed(1)} ${unit}` : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-nunito mb-4">
          No pumping sessions yet — tap Start when you're ready! 🍼
        </p>
      )}
      {todayTotal > 0 && (
        <div className="bg-nurture-amber/10 rounded-xl px-3 py-2 mb-3">
          <p className="text-sm font-nunito font-semibold text-nurture-amber">
            Today's total: {fromOz(todayTotal).toFixed(1)} {unit}
          </p>
        </div>
      )}
      <div className="flex gap-2 mb-3">
        {(['left', 'right', 'both'] as Side[]).map(s => (
          <button
            key={s}
            onClick={() => setSelectedSide(s)}
            className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold font-nunito min-h-[40px] transition-colors ${
              selectedSide === s
                ? 'bg-nurture-amber text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={handleStart}
        className="w-full bg-nurture-amber text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity"
      >
        Start Pumping
      </button>
    </div>
  );
}
