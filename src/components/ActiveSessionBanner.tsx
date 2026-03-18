import { useApp } from '@/context/AppContext';
import { useTimer, formatTimer } from '@/hooks/useTimer';
import { Baby, Moon, Milk } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ActiveSessionBanner() {
  const { activeFeeding, stopFeeding, activeSleep, stopSleep, activePumping, stopPumping } = useApp();
  const feedElapsed = useTimer(activeFeeding?.startTime || null);
  const sleepElapsed = useTimer(activeSleep?.startTime || null);
  const pumpElapsed = useTimer(activePumping?.startTime || null);

  const sessions = [
    activeFeeding && {
      type: 'Feeding',
      icon: Baby,
      elapsed: feedElapsed,
      color: 'bg-nurture-purple',
      onStop: () => stopFeeding(),
      longRunning: feedElapsed > 7200,
    },
    activePumping && {
      type: 'Pumping',
      icon: Milk,
      elapsed: pumpElapsed,
      color: 'bg-nurture-amber',
      onStop: () => stopPumping(),
      longRunning: pumpElapsed > 7200,
    },
    activeSleep && {
      type: 'Sleeping',
      icon: Moon,
      elapsed: sleepElapsed,
      color: 'bg-nurture-blue',
      onStop: () => stopSleep(),
      longRunning: sleepElapsed > 7200,
    },
  ].filter(Boolean) as Array<{
    type: string; icon: any; elapsed: number; color: string; onStop: () => void; longRunning: boolean;
  }>;

  return (
    <AnimatePresence>
      {sessions.map(s => (
        <motion.div
          key={s.type}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className={`${s.color} text-primary-foreground px-4 py-3 flex items-center justify-between gap-3 rounded-b-2xl`}
        >
          <div className="flex items-center gap-2">
            <s.icon className="w-5 h-5" />
            <span className="font-nunito font-semibold text-sm">{s.type}</span>
            <span className="font-quicksand font-bold text-lg tabular-nums animate-pulse-soft">
              {formatTimer(s.elapsed)}
            </span>
          </div>
          {s.longRunning && (
            <span className="text-xs opacity-80 font-nunito">Still going?</span>
          )}
          <button
            onClick={s.onStop}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground rounded-full px-4 py-1.5 text-sm font-semibold font-nunito min-h-[36px] transition-colors"
          >
            Stop
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
