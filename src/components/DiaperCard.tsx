import { useApp } from '@/context/AppContext';
import { formatTimeAgo } from '@/hooks/useTimer';
import { Droplets, CloudRain, Sparkles } from 'lucide-react';
import type { DiaperType } from '@/types';

const typeConfig: Record<DiaperType, { label: string; icon: typeof Droplets; emoji: string }> = {
  pee: { label: 'Pee', icon: Droplets, emoji: '💧' },
  poop: { label: 'Poop', icon: CloudRain, emoji: '💩' },
  both: { label: 'Both', icon: Sparkles, emoji: '✨' },
};

export function DiaperCard() {
  const { diapers, logDiaper } = useApp();

  const lastDiaper = diapers[0];
  const today = new Date().toDateString();
  const todayDiapers = diapers.filter(d => new Date(d.timestamp).toDateString() === today);
  const peeCount = todayDiapers.filter(d => d.type === 'pee' || d.type === 'both').length;
  const poopCount = todayDiapers.filter(d => d.type === 'poop' || d.type === 'both').length;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border-l-4 border-nurture-teal">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-nurture-teal/10 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-nurture-teal" />
        </div>
        <h2 className="font-quicksand font-bold text-lg text-foreground">Diaper</h2>
      </div>

      {lastDiaper ? (
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground font-nunito">
            Last change: <span className="font-semibold text-foreground">{formatTimeAgo(lastDiaper.timestamp)}</span>
            {' '}{typeConfig[lastDiaper.type].emoji}
          </p>
          <p className="text-sm text-muted-foreground font-nunito">
            Today: {peeCount} 💧 · {poopCount} 💩
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-nunito mb-4">
          No diaper changes logged yet — you've got this! 💪
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(typeConfig) as [DiaperType, typeof typeConfig.pee][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => logDiaper(type)}
            className="bg-nurture-teal text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity flex flex-col items-center gap-1"
          >
            <span className="text-lg">{cfg.emoji}</span>
            <span>{cfg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
