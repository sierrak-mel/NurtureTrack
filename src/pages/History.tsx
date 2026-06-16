import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, Droplets, Moon, Trash2, Pencil, Plus, Milk, List } from 'lucide-react';
import { format } from 'date-fns';
import type { Side, DiaperType, ColorNote, SleepType, ContentType, FeedingSession, DiaperChange, SleepSession, PumpingSession, BottleFeed } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function toLocalDatetime(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

function fromLocalDatetime(local: string) {
  return new Date(local).toISOString();
}

const sideLabel: Record<Side, string> = { left: '🤱 Left', right: 'Right 🤱', both: 'Both' };
const diaperEmoji: Record<DiaperType, string> = { pee: '💧', poop: '💩', both: '💧💩' };
const contentLabel: Record<ContentType, string> = { breast_milk: '🤱 Breast Milk', formula: '🍼 Formula', mixed: '🥛 Mixed' };

/* ── Edit Feeding Dialog ── */
function EditFeedingDialog({ entry, open, onClose }: { entry: FeedingSession; open: boolean; onClose: () => void }) {
  const { updateFeeding } = useApp();
  const [startTime, setStartTime] = useState(toLocalDatetime(entry.startTime));
  const [endTime, setEndTime] = useState(entry.endTime ? toLocalDatetime(entry.endTime) : '');
  const [side, setSide] = useState<Side>(entry.side);
  const [notes, setNotes] = useState(entry.notes);
  const save = () => {
    const st = fromLocalDatetime(startTime);
    const et = endTime ? fromLocalDatetime(endTime) : null;
    const dur = et ? Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000) : null;
    updateFeeding(entry.id, { startTime: st, endTime: et, durationSeconds: dur, side, notes });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Edit Feeding</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-purple hover:bg-onesie-purple/90 text-white font-nunito">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Feeding Dialog ── */
function AddFeedingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastFeeding } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);
  const [side, setSide] = useState<Side>('left');
  const [notes, setNotes] = useState('');
  const save = () => {
    const st = fromLocalDatetime(startTime); const et = fromLocalDatetime(endTime);
    const dur = Math.max(0, Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000));
    addPastFeeding({ startTime: st, endTime: et, durationSeconds: dur, side, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Feeding</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-purple hover:bg-onesie-purple/90 text-white font-nunito">Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Diaper Dialog ── */
function EditDiaperDialog({ entry, open, onClose }: { entry: DiaperChange; open: boolean; onClose: () => void }) {
  const { updateDiaper } = useApp();
  const [timestamp, setTimestamp] = useState(toLocalDatetime(entry.timestamp));
  const [type, setType] = useState<DiaperType>(entry.type);
  const [colorNote, setColorNote] = useState<ColorNote | ''>(entry.colorNote || '');
  const [notes, setNotes] = useState(entry.notes);
  const save = () => { updateDiaper(entry.id, { timestamp: fromLocalDatetime(timestamp), type, colorNote: colorNote || null, notes }); onClose(); };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Edit Diaper Change</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Type</label>
          <Select value={type} onValueChange={v => setType(v as DiaperType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="pee">💧 Pee</SelectItem><SelectItem value="poop">💩 Poop</SelectItem><SelectItem value="both">💧💩 Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Color / Consistency</label>
          <Select value={colorNote || 'none'} onValueChange={v => setColorNote(v === 'none' ? '' : v as ColorNote)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="unusual">Unusual</SelectItem><SelectItem value="bloody">Bloody</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-teal hover:bg-onesie-teal/90 text-white font-nunito">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Diaper Dialog ── */
function AddDiaperDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastDiaper } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [timestamp, setTimestamp] = useState(now);
  const [type, setType] = useState<DiaperType>('pee');
  const [colorNote, setColorNote] = useState<ColorNote | ''>('');
  const [notes, setNotes] = useState('');
  const save = () => { addPastDiaper({ timestamp: fromLocalDatetime(timestamp), type, colorNote: colorNote || null, notes }); onClose(); };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Diaper Change</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Type</label>
          <Select value={type} onValueChange={v => setType(v as DiaperType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="pee">💧 Pee</SelectItem><SelectItem value="poop">💩 Poop</SelectItem><SelectItem value="both">💧💩 Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Color / Consistency</label>
          <Select value={colorNote || 'none'} onValueChange={v => setColorNote(v === 'none' ? '' : v as ColorNote)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="unusual">Unusual</SelectItem><SelectItem value="bloody">Bloody</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-teal hover:bg-onesie-teal/90 text-white font-nunito">Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Sleep Dialog ── */
function EditSleepDialog({ entry, open, onClose }: { entry: SleepSession; open: boolean; onClose: () => void }) {
  const { updateSleep } = useApp();
  const [startTime, setStartTime] = useState(toLocalDatetime(entry.startTime));
  const [endTime, setEndTime] = useState(entry.endTime ? toLocalDatetime(entry.endTime) : '');
  const [sleepType, setSleepType] = useState<SleepType>(entry.sleepType);
  const [notes, setNotes] = useState(entry.notes);
  const save = () => {
    const st = fromLocalDatetime(startTime); const et = endTime ? fromLocalDatetime(endTime) : null;
    const dur = et ? Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000) : null;
    updateSleep(entry.id, { startTime: st, endTime: et, durationSeconds: dur, sleepType, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Edit Sleep Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Sleep Type</label>
          <Select value={sleepType} onValueChange={v => setSleepType(v as SleepType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="nap">☀️ Nap</SelectItem><SelectItem value="night">🌙 Night Sleep</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-blue hover:bg-onesie-blue/90 text-white font-nunito">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Sleep Dialog ── */
function AddSleepDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastSleep } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [notes, setNotes] = useState('');
  const save = () => {
    const st = fromLocalDatetime(startTime); const et = fromLocalDatetime(endTime);
    const dur = Math.max(0, Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000));
    addPastSleep({ startTime: st, endTime: et, durationSeconds: dur, sleepType, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Sleep Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Sleep Type</label>
          <Select value={sleepType} onValueChange={v => setSleepType(v as SleepType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="nap">☀️ Nap</SelectItem><SelectItem value="night">🌙 Night Sleep</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-blue hover:bg-onesie-blue/90 text-white font-nunito">Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Pumping Dialog ── */
function EditPumpingDialog({ entry, open, onClose }: { entry: PumpingSession; open: boolean; onClose: () => void }) {
  const { updatePumping, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const fromOz = (oz: number) => unit === 'ml' ? oz * 29.5735 : oz;
  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;
  const [startTime, setStartTime] = useState(toLocalDatetime(entry.startTime));
  const [endTime, setEndTime] = useState(entry.endTime ? toLocalDatetime(entry.endTime) : '');
  const [side, setSide] = useState<Side>(entry.side);
  const [volume, setVolume] = useState(entry.volumeOz ? fromOz(entry.volumeOz).toFixed(1) : '');
  const [notes, setNotes] = useState(entry.notes);
  const save = () => {
    const st = fromLocalDatetime(startTime); const et = endTime ? fromLocalDatetime(endTime) : null;
    const dur = et ? Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000) : null;
    const vol = volume ? toOz(parseFloat(volume)) : null;
    updatePumping(entry.id, { startTime: st, endTime: et, durationSeconds: dur, side, volumeOz: vol, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Edit Pumping Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Volume ({unit})</label>
          <Input type="number" min="0" step="0.1" value={volume} onChange={e => setVolume(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-amber hover:bg-onesie-amber/90 text-white font-nunito">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Pumping Dialog ── */
function AddPumpingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastPumping, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);
  const [side, setSide] = useState<Side>('both');
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const save = () => {
    const st = fromLocalDatetime(startTime); const et = fromLocalDatetime(endTime);
    const dur = Math.max(0, Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000));
    const vol = volume ? toOz(parseFloat(volume)) : null;
    addPastPumping({ startTime: st, endTime: et, durationSeconds: dur, side, volumeOz: vol, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Pumping Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Volume ({unit})</label>
          <Input type="number" min="0" step="0.1" value={volume} onChange={e => setVolume(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-amber hover:bg-onesie-amber/90 text-white font-nunito">Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Bottle Feed Dialog ── */
function EditBottleDialog({ entry, open, onClose }: { entry: BottleFeed; open: boolean; onClose: () => void }) {
  const { updateBottleFeed, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const fromOz = (oz: number) => unit === 'ml' ? oz * 29.5735 : oz;
  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;
  const [timestamp, setTimestamp] = useState(toLocalDatetime(entry.timestamp));
  const [amount, setAmount] = useState(fromOz(entry.amountOz).toFixed(1));
  const [contentType, setContentType] = useState<ContentType>(entry.contentType);
  const [notes, setNotes] = useState(entry.notes);
  const save = () => {
    updateBottleFeed(entry.id, { timestamp: fromLocalDatetime(timestamp), amountOz: toOz(parseFloat(amount) || 0), contentType, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Edit Bottle Feed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Amount ({unit})</label>
          <Input type="number" min="0" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Content Type</label>
          <Select value={contentType} onValueChange={v => setContentType(v as ContentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="breast_milk">🤱 Breast Milk</SelectItem><SelectItem value="formula">🍼 Formula</SelectItem><SelectItem value="mixed">🥛 Mixed</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-purple hover:bg-onesie-purple/90 text-white font-nunito">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Bottle Feed Dialog ── */
function AddBottleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastBottleFeed, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const toOz = (val: number) => unit === 'ml' ? val / 29.5735 : val;
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [timestamp, setTimestamp] = useState(now);
  const [amount, setAmount] = useState('');
  const [contentType, setContentType] = useState<ContentType>('breast_milk');
  const [notes, setNotes] = useState('');
  const save = () => {
    const amtOz = toOz(parseFloat(amount) || 0);
    if (amtOz <= 0) return;
    addPastBottleFeed({ timestamp: fromLocalDatetime(timestamp), amountOz: amtOz, contentType, notes }); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Bottle Feed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Amount ({unit})</label>
          <Input type="number" min="0" step="0.1" placeholder={`0.0 ${unit}`} value={amount} onChange={e => setAmount(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Content Type</label>
          <Select value={contentType} onValueChange={v => setContentType(v as ContentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="breast_milk">🤱 Breast Milk</SelectItem><SelectItem value="formula">🍼 Formula</SelectItem><SelectItem value="mixed">🥛 Mixed</SelectItem></SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter><Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-onesie-purple hover:bg-onesie-purple/90 text-white font-nunito">Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main History Page ── */
export default function History() {
  const { feedings, deleteFeeding, diapers, deleteDiaper, sleeps, deleteSleep, pumpings, deletePumping, bottleFeeds, deleteBottleFeed, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const fromOz = (oz: number) => unit === 'ml' ? oz * 29.5735 : oz;

  const [editFeeding, setEditFeeding] = useState<FeedingSession | null>(null);
  const [editDiaper, setEditDiaper] = useState<DiaperChange | null>(null);
  const [editSleep, setEditSleep] = useState<SleepSession | null>(null);
  const [editPumping, setEditPumping] = useState<PumpingSession | null>(null);
  const [editBottle, setEditBottle] = useState<BottleFeed | null>(null);
  const [addFeedingOpen, setAddFeedingOpen] = useState(false);
  const [addDiaperOpen, setAddDiaperOpen] = useState(false);
  const [addSleepOpen, setAddSleepOpen] = useState(false);
  const [addPumpingOpen, setAddPumpingOpen] = useState(false);
  const [addBottleOpen, setAddBottleOpen] = useState(false);

  // Merge breastfeeding + bottle feeds for the feeding tab, sorted by time
  const allFeedingEntries: Array<{ type: 'breast'; data: FeedingSession } | { type: 'bottle'; data: BottleFeed }> = [
    ...feedings.filter(f => f.endTime).map(f => ({ type: 'breast' as const, data: f, time: new Date(f.startTime).getTime() })),
    ...bottleFeeds.map(b => ({ type: 'bottle' as const, data: b, time: new Date(b.timestamp).getTime() })),
  ].sort((a, b) => b.time - a.time);

  // Every activity merged chronologically for the "All" tab
  type AllEntry =
    | { kind: 'breast'; time: number; data: FeedingSession }
    | { kind: 'bottle'; time: number; data: BottleFeed }
    | { kind: 'pumping'; time: number; data: PumpingSession }
    | { kind: 'diaper'; time: number; data: DiaperChange }
    | { kind: 'sleep'; time: number; data: SleepSession };

  const allActivity: AllEntry[] = [
    ...feedings.filter(f => f.endTime).map(f => ({ kind: 'breast' as const, time: new Date(f.startTime).getTime(), data: f })),
    ...bottleFeeds.map(b => ({ kind: 'bottle' as const, time: new Date(b.timestamp).getTime(), data: b })),
    ...pumpings.filter(p => p.endTime).map(p => ({ kind: 'pumping' as const, time: new Date(p.startTime).getTime(), data: p })),
    ...diapers.map(d => ({ kind: 'diaper' as const, time: new Date(d.timestamp).getTime(), data: d })),
    ...sleeps.filter(s => s.endTime).map(s => ({ kind: 'sleep' as const, time: new Date(s.startTime).getTime(), data: s })),
  ].sort((a, b) => b.time - a.time);

  const renderAllEntry = (entry: AllEntry) => {
    switch (entry.kind) {
      case 'breast': {
        const f = entry.data;
        return (
          <div key={`f-${f.id}`} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-purple">
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(f.startTime)} 🤱 <span className="text-xs font-normal text-muted-foreground">Feed</span></p>
              <p className="text-xs text-muted-foreground font-nunito">{sideLabel[f.side]} · {formatDuration(f.durationSeconds || 0)}</p>
              {f.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{f.notes}"</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditFeeding(f)} className="text-muted-foreground hover:text-onesie-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deleteFeeding(f.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      }
      case 'bottle': {
        const b = entry.data;
        return (
          <div key={`b-${b.id}`} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-purple/60">
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(b.timestamp)} 🍼 <span className="text-xs font-normal text-muted-foreground">Bottle</span></p>
              <p className="text-xs text-muted-foreground font-nunito">{fromOz(b.amountOz).toFixed(1)} {unit} · {contentLabel[b.contentType]}</p>
              {b.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{b.notes}"</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditBottle(b)} className="text-muted-foreground hover:text-onesie-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deleteBottleFeed(b.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      }
      case 'pumping': {
        const p = entry.data;
        return (
          <div key={`p-${p.id}`} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-amber">
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(p.startTime)} 🍼 <span className="text-xs font-normal text-muted-foreground">Pump</span></p>
              <p className="text-xs text-muted-foreground font-nunito">{sideLabel[p.side]} · {formatDuration(p.durationSeconds || 0)}{p.volumeOz ? ` · ${fromOz(p.volumeOz).toFixed(1)} ${unit}` : ''}</p>
              {p.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{p.notes}"</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditPumping(p)} className="text-muted-foreground hover:text-onesie-amber p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deletePumping(p.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      }
      case 'diaper': {
        const d = entry.data;
        return (
          <div key={`d-${d.id}`} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-teal">
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(d.timestamp)} {diaperEmoji[d.type]} <span className="text-xs font-normal text-muted-foreground">Diaper</span></p>
              <p className="text-xs text-muted-foreground font-nunito capitalize">{d.type}{d.colorNote ? ` · ${d.colorNote}` : ''}</p>
              {d.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{d.notes}"</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditDiaper(d)} className="text-muted-foreground hover:text-onesie-teal p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deleteDiaper(d.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      }
      case 'sleep': {
        const s = entry.data;
        return (
          <div key={`s-${s.id}`} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-blue">
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(s.startTime)} {s.sleepType === 'night' ? '🌙' : '☀️'} <span className="text-xs font-normal text-muted-foreground">Sleep</span></p>
              <p className="text-xs text-muted-foreground font-nunito">{s.sleepType === 'night' ? 'Night' : 'Nap'} · {formatDuration(s.durationSeconds || 0)}</p>
              {s.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{s.notes}"</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditSleep(s)} className="text-muted-foreground hover:text-onesie-blue p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deleteSleep(s.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-quicksand font-bold text-foreground mb-4">History</h1>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all" className="font-nunito text-xs gap-1 px-1"><List className="w-3.5 h-3.5" /> All</TabsTrigger>
            <TabsTrigger value="feeding" className="font-nunito text-xs gap-1 px-1"><Baby className="w-3.5 h-3.5" /> Feed</TabsTrigger>
            <TabsTrigger value="pumping" className="font-nunito text-xs gap-1 px-1"><Milk className="w-3.5 h-3.5" /> Pump</TabsTrigger>
            <TabsTrigger value="diaper" className="font-nunito text-xs gap-1 px-1"><Droplets className="w-3.5 h-3.5" /> Diaper</TabsTrigger>
            <TabsTrigger value="sleep" className="font-nunito text-xs gap-1 px-1"><Moon className="w-3.5 h-3.5" /> Sleep</TabsTrigger>
          </TabsList>

          {/* ── All Activity Tab ── */}
          <TabsContent value="all">
            {allActivity.length === 0 ? (
              <EmptyState text="No activity logged yet" />
            ) : (
              <div className="space-y-2">
                {allActivity.map(renderAllEntry)}
              </div>
            )}
          </TabsContent>

          {/* ── Feeding Tab (breast + bottle) ── */}
          <TabsContent value="feeding">
            <div className="flex gap-2 mb-3">
              <Button onClick={() => setAddFeedingOpen(true)} variant="outline" className="flex-1 min-h-[48px] rounded-xl font-nunito gap-2 border-onesie-purple/30 text-onesie-purple">
                <Plus className="w-4 h-4" /> Breast Feed
              </Button>
              <Button onClick={() => setAddBottleOpen(true)} variant="outline" className="flex-1 min-h-[48px] rounded-xl font-nunito gap-2 border-onesie-purple/30 text-onesie-purple">
                <Plus className="w-4 h-4" /> Bottle Feed
              </Button>
            </div>
            {allFeedingEntries.length === 0 ? (
              <EmptyState text="No feeding entries yet" />
            ) : (
              <div className="space-y-2">
                {allFeedingEntries.map(entry => {
                  if (entry.type === 'breast') {
                    const f = entry.data as FeedingSession;
                    return (
                      <div key={f.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-purple">
                        <div className="flex-1 min-w-0">
                          <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(f.startTime)} 🤱</p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {sideLabel[f.side]} · {formatDuration(f.durationSeconds || 0)}
                          </p>
                          {f.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{f.notes}"</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditFeeding(f)} className="text-muted-foreground hover:text-onesie-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteFeeding(f.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  } else {
                    const b = entry.data as BottleFeed;
                    return (
                      <div key={b.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-purple/60">
                        <div className="flex-1 min-w-0">
                          <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(b.timestamp)} 🍼</p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {fromOz(b.amountOz).toFixed(1)} {unit} · {contentLabel[b.contentType]}
                          </p>
                          {b.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{b.notes}"</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditBottle(b)} className="text-muted-foreground hover:text-onesie-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteBottleFeed(b.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Pumping Tab ── */}
          <TabsContent value="pumping">
            <Button onClick={() => setAddPumpingOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-onesie-amber/30 text-onesie-amber">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {pumpings.filter(p => p.endTime).length === 0 ? (
              <EmptyState text="No pumping sessions yet" />
            ) : (
              <div className="space-y-2">
                {pumpings.filter(p => p.endTime).map(p => (
                  <div key={p.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-amber">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(p.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {sideLabel[p.side]} · {formatDuration(p.durationSeconds || 0)}
                        {p.volumeOz ? ` · ${fromOz(p.volumeOz).toFixed(1)} ${unit}` : ''}
                      </p>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{p.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditPumping(p)} className="text-muted-foreground hover:text-onesie-amber p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePumping(p.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Diaper Tab ── */}
          <TabsContent value="diaper">
            <Button onClick={() => setAddDiaperOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-onesie-teal/30 text-onesie-teal">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {diapers.length === 0 ? (
              <EmptyState text="No diaper changes yet" />
            ) : (
              <div className="space-y-2">
                {diapers.map(d => (
                  <div key={d.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-teal">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(d.timestamp)} {diaperEmoji[d.type]}</p>
                      <p className="text-xs text-muted-foreground font-nunito capitalize">{d.type}{d.colorNote ? ` · ${d.colorNote}` : ''}</p>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{d.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditDiaper(d)} className="text-muted-foreground hover:text-onesie-teal p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteDiaper(d.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Sleep Tab ── */}
          <TabsContent value="sleep">
            <Button onClick={() => setAddSleepOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-onesie-blue/30 text-onesie-blue">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {sleeps.filter(s => s.endTime).length === 0 ? (
              <EmptyState text="No sleep sessions yet" />
            ) : (
              <div className="space-y-2">
                {sleeps.filter(s => s.endTime).map(s => (
                  <div key={s.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-onesie-blue">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(s.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {s.sleepType === 'night' ? '🌙 Night' : '☀️ Nap'} · {formatDuration(s.durationSeconds || 0)}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{s.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditSleep(s)} className="text-muted-foreground hover:text-onesie-blue p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteSleep(s.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {editFeeding && <EditFeedingDialog entry={editFeeding} open={true} onClose={() => setEditFeeding(null)} />}
      {editDiaper && <EditDiaperDialog entry={editDiaper} open={true} onClose={() => setEditDiaper(null)} />}
      {editSleep && <EditSleepDialog entry={editSleep} open={true} onClose={() => setEditSleep(null)} />}
      {editPumping && <EditPumpingDialog entry={editPumping} open={true} onClose={() => setEditPumping(null)} />}
      {editBottle && <EditBottleDialog entry={editBottle} open={true} onClose={() => setEditBottle(null)} />}
      <AddFeedingDialog open={addFeedingOpen} onClose={() => setAddFeedingOpen(false)} />
      <AddDiaperDialog open={addDiaperOpen} onClose={() => setAddDiaperOpen(false)} />
      <AddSleepDialog open={addSleepOpen} onClose={() => setAddSleepOpen(false)} />
      <AddPumpingDialog open={addPumpingOpen} onClose={() => setAddPumpingOpen(false)} />
      <AddBottleDialog open={addBottleOpen} onClose={() => setAddBottleOpen(false)} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground font-nunito">{text}</p>
      <p className="text-sm text-muted-foreground/70 font-nunito mt-1">Entries will show up here 💛</p>
    </div>
  );
}
