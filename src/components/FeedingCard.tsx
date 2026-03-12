import { useApp } from '@/context/AppContext';
import { useTimer, formatTimer, formatTimeAgo } from '@/hooks/useTimer';
import { Baby } from 'lucide-react';
import { useState } from 'react';
import type { Side } from '@/types';

export function FeedingCard() {
  const { feedings, activeFeeding, startFeeding, stopFeeding, profile } = useApp();
  const elapsed = useTimer(activeFeeding?.startTime || null);
  const [selectedSide, setSelectedSide] = useState<Side>('left');

  const lastCompleted = feedings.find(f => f.endTime);
  const nextSide: Side = lastCompleted
    ? (lastCompleted.side === 'left' ? 'right' : 'left')
    : (profile?.defaultStartSide || 'left');

  const handleStart = () => {
    startFeeding(selectedSide || nextSide);
  };

  if (activeFeeding) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-purple">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-nurture-purple/10 flex items-center justify-center">
            <Baby className="w-4 h-4 text-nurture-purple" />
          </div>
          <h2 className="font-quicksand font-bold text-lg text-foreground">Feeding</h2>
        </div>
        <div className="text-center py-4">
          <p className="font-quicksand text-4xl font-bold text-nurture-purple tabular-nums">
            {formatTimer(elapsed)}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {(['left', 'right', 'both'] as Side[]).map(s => (
              <button
                key={s}
                onClick={() => {
                  // Update the active feeding's side in context would need more work,
                  // for now just visual
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold font-nunito min-h-[40px] transition-colors ${
                  activeFeeding.side === s
                    ? 'bg-nurture-purple text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => stopFeeding()}
          className="w-full bg-nurture-purple text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] mt-3 hover:opacity-90 transition-opacity"
        >
          Stop Feed
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-purple">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-nurture-purple/10 flex items-center justify-center">
          <Baby className="w-4 h-4 text-nurture-purple" />
        </div>
        <h2 className="font-quicksand font-bold text-lg text-foreground">Feeding</h2>
      </div>
      {lastCompleted ? (
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground font-nunito">
            Last feed: <span className="font-semibold text-foreground">{formatTimeAgo(lastCompleted.endTime!)}</span>
          </p>
          <p className="text-sm text-muted-foreground font-nunito">
            {lastCompleted.side.charAt(0).toUpperCase() + lastCompleted.side.slice(1)} side · {Math.floor((lastCompleted.durationSeconds || 0) / 60)}m {(lastCompleted.durationSeconds || 0) % 60}s
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-nunito mb-4">
          No feeds logged yet — tap the button when you're ready! 🍼
        </p>
      )}
      <div className="flex gap-2 mb-3">
        {(['left', 'right', 'both'] as Side[]).map(s => (
          <button
            key={s}
            onClick={() => setSelectedSide(s)}
            className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold font-nunito min-h-[40px] transition-colors ${
              (selectedSide || nextSide) === s
                ? 'bg-nurture-purple text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={handleStart}
        className="w-full bg-nurture-purple text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity"
      >
        Start Feeding
      </button>
    </div>
  );
}
