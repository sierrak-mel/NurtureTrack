import { useApp } from '@/context/AppContext';
import { useTimer, formatTimer, formatTimeAgo } from '@/hooks/useTimer';
import { Baby, Milk } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Side, ContentType } from '@/types';
import { format } from 'date-fns';

function toLocalDatetime(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}
function fromLocalDatetime(local: string) {
  return new Date(local).toISOString();
}

export function FeedingCard() {
  const { feedings, activeFeeding, startFeeding, stopFeeding, profile, logBottleFeed, bottleFeeds } = useApp();
  const elapsed = useTimer(activeFeeding?.startTime || null);
  const [selectedSide, setSelectedSide] = useState<Side>('left');
  const [bottleOpen, setBottleOpen] = useState(false);

  const lastCompleted = feedings.find(f => f.endTime);
  const nextSide: Side = lastCompleted
    ? (lastCompleted.side === 'left' ? 'right' : lastCompleted.side === 'right' ? 'left' : 'left')
    : (profile?.defaultStartSide || 'left');

  const nextSideLabel = nextSide === 'left' ? 'Left Breast' : 'Right Breast';

  // Auto-select next side
  const effectiveSide = selectedSide || nextSide;

  const handleStart = () => {
    startFeeding(effectiveSide);
  };

  // Today's feed count (breastfeeding + bottle)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayFeedCount = feedings.filter(f => f.endTime && new Date(f.startTime) >= today).length
    + bottleFeeds.filter(b => new Date(b.timestamp) >= today).length;

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
        {todayFeedCount > 0 && (
          <span className="ml-auto text-xs font-nunito text-muted-foreground">{todayFeedCount} today</span>
        )}
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

      {/* Which Side Next Indicator */}
      <div className="mb-3">
        {lastCompleted ? (
          <div className="bg-nurture-purple text-primary-foreground rounded-full px-4 py-1.5 text-sm font-semibold font-nunito text-center">
            Next: {nextSideLabel}
          </div>
        ) : (
          <div className="bg-secondary text-secondary-foreground rounded-full px-4 py-1.5 text-xs font-nunito text-center">
            Start on whichever side feels fuller
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {(['left', 'right', 'both'] as Side[]).map(s => (
          <button
            key={s}
            onClick={() => setSelectedSide(s)}
            className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold font-nunito min-h-[40px] transition-colors ${
              effectiveSide === s
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
      <button
        onClick={() => setBottleOpen(true)}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-xl py-2.5 font-semibold font-nunito text-sm min-h-[40px] hover:bg-secondary/80 transition-colors"
      >
        <Milk className="w-4 h-4" /> + Log Bottle Feed
      </button>

      <BottleFeedDialog open={bottleOpen} onClose={() => setBottleOpen(false)} />
    </div>
  );
}

function BottleFeedDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logBottleFeed, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [amount, setAmount] = useState('');
  const [contentType, setContentType] = useState<ContentType>('breast_milk');
  const [timestamp, setTimestamp] = useState(now);
  const [notes, setNotes] = useState('');

  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;

  const save = () => {
    const amtOz = toOz(parseFloat(amount) || 0);
    if (amtOz <= 0) return;
    logBottleFeed(amtOz, contentType, notes, fromLocalDatetime(timestamp));
    setAmount(''); setNotes(''); setContentType('breast_milk'); setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    onClose();
  };

  const contentTypes: { value: ContentType; label: string }[] = [
    { value: 'breast_milk', label: '🤱 Breast Milk' },
    { value: 'formula', label: '🍼 Formula' },
    { value: 'mixed', label: '🥛 Mixed' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Log Bottle Feed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-nunito text-muted-foreground">Amount ({unit})</label>
            <Input type="number" min="0" step="0.1" placeholder={`0.0 ${unit}`} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-nunito text-muted-foreground mb-2 block">Content</label>
            <div className="flex gap-2">
              {contentTypes.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={`flex-1 px-2 py-2 rounded-full text-xs font-semibold font-nunito min-h-[40px] transition-colors ${
                    contentType === ct.value
                      ? 'bg-nurture-purple text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-nunito text-muted-foreground">Time</label>
            <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-nunito text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-purple hover:bg-nurture-purple/90 text-white font-nunito">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
