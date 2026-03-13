import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, Droplets, Moon, Trash2, Pencil, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Side, DiaperType, ColorNote, SleepType, FeedingSession, DiaperChange, SleepSession } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function fromLocalDatetime(local: string) {
  return new Date(local).toISOString();
}

const sideLabel: Record<Side, string> = { left: '🤱 Left', right: 'Right 🤱', both: 'Both' };
const diaperEmoji: Record<DiaperType, string> = { pee: '💧', poop: '💩', both: '💧💩' };

/* ── Edit Feeding Dialog ──────────────────────────────────────── */

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
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Edit Feeding</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-purple hover:bg-nurture-purple/90 text-white font-nunito">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Feeding Dialog ──────────────────────────────────── */

function AddFeedingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastFeeding } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);
  const [side, setSide] = useState<Side>('left');
  const [notes, setNotes] = useState('');

  const save = () => {
    const st = fromLocalDatetime(startTime);
    const et = fromLocalDatetime(endTime);
    const dur = Math.max(0, Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000));
    addPastFeeding({ startTime: st, endTime: et, durationSeconds: dur, side, notes });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Feeding</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Side</label>
          <Select value={side} onValueChange={v => setSide(v as Side)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-purple hover:bg-nurture-purple/90 text-white font-nunito">Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Diaper Dialog ───────────────────────────────────────── */

function EditDiaperDialog({ entry, open, onClose }: { entry: DiaperChange; open: boolean; onClose: () => void }) {
  const { updateDiaper } = useApp();
  const [timestamp, setTimestamp] = useState(toLocalDatetime(entry.timestamp));
  const [type, setType] = useState<DiaperType>(entry.type);
  const [colorNote, setColorNote] = useState<ColorNote | ''>(entry.colorNote || '');
  const [notes, setNotes] = useState(entry.notes);

  const save = () => {
    updateDiaper(entry.id, { timestamp: fromLocalDatetime(timestamp), type, colorNote: colorNote || null, notes });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Edit Diaper Change</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Type</label>
          <Select value={type} onValueChange={v => setType(v as DiaperType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pee">💧 Pee</SelectItem>
              <SelectItem value="poop">💩 Poop</SelectItem>
              <SelectItem value="both">💧💩 Both</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Color / Consistency</label>
          <Select value={colorNote || 'none'} onValueChange={v => setColorNote(v === 'none' ? '' : v as ColorNote)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="unusual">Unusual</SelectItem>
              <SelectItem value="bloody">Bloody</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-teal hover:bg-nurture-teal/90 text-white font-nunito">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Diaper Dialog ───────────────────────────────────── */

function AddDiaperDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastDiaper } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [timestamp, setTimestamp] = useState(now);
  const [type, setType] = useState<DiaperType>('pee');
  const [colorNote, setColorNote] = useState<ColorNote | ''>('');
  const [notes, setNotes] = useState('');

  const save = () => {
    addPastDiaper({ timestamp: fromLocalDatetime(timestamp), type, colorNote: colorNote || null, notes });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Diaper Change</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Time</label>
          <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Type</label>
          <Select value={type} onValueChange={v => setType(v as DiaperType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pee">💧 Pee</SelectItem>
              <SelectItem value="poop">💩 Poop</SelectItem>
              <SelectItem value="both">💧💩 Both</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Color / Consistency</label>
          <Select value={colorNote || 'none'} onValueChange={v => setColorNote(v === 'none' ? '' : v as ColorNote)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="unusual">Unusual</SelectItem>
              <SelectItem value="bloody">Bloody</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-teal hover:bg-nurture-teal/90 text-white font-nunito">Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Sleep Dialog ────────────────────────────────────────── */

function EditSleepDialog({ entry, open, onClose }: { entry: SleepSession; open: boolean; onClose: () => void }) {
  const { updateSleep } = useApp();
  const [startTime, setStartTime] = useState(toLocalDatetime(entry.startTime));
  const [endTime, setEndTime] = useState(entry.endTime ? toLocalDatetime(entry.endTime) : '');
  const [sleepType, setSleepType] = useState<SleepType>(entry.sleepType);
  const [notes, setNotes] = useState(entry.notes);

  const save = () => {
    const st = fromLocalDatetime(startTime);
    const et = endTime ? fromLocalDatetime(endTime) : null;
    const dur = et ? Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000) : null;
    updateSleep(entry.id, { startTime: st, endTime: et, durationSeconds: dur, sleepType, notes });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Edit Sleep Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Sleep Type</label>
          <Select value={sleepType} onValueChange={v => setSleepType(v as SleepType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nap">☀️ Nap</SelectItem>
              <SelectItem value="night">🌙 Night Sleep</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-blue hover:bg-nurture-blue/90 text-white font-nunito">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Past Sleep Dialog ────────────────────────────────────── */

function AddSleepDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPastSleep } = useApp();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [startTime, setStartTime] = useState(now);
  const [endTime, setEndTime] = useState(now);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [notes, setNotes] = useState('');

  const save = () => {
    const st = fromLocalDatetime(startTime);
    const et = fromLocalDatetime(endTime);
    const dur = Math.max(0, Math.floor((new Date(et).getTime() - new Date(st).getTime()) / 1000));
    addPastSleep({ startTime: st, endTime: et, durationSeconds: dur, sleepType, notes });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">Add Past Sleep Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Start Time</label>
          <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">End Time</label>
          <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Sleep Type</label>
          <Select value={sleepType} onValueChange={v => setSleepType(v as SleepType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nap">☀️ Nap</SelectItem>
              <SelectItem value="night">🌙 Night Sleep</SelectItem>
            </SelectContent>
          </Select>
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-blue hover:bg-nurture-blue/90 text-white font-nunito">Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main History Page ────────────────────────────────────────── */

export default function History() {
  const { feedings, deleteFeeding, diapers, deleteDiaper, sleeps, deleteSleep } = useApp();

  const [editFeeding, setEditFeeding] = useState<FeedingSession | null>(null);
  const [editDiaper, setEditDiaper] = useState<DiaperChange | null>(null);
  const [editSleep, setEditSleep] = useState<SleepSession | null>(null);
  const [addFeedingOpen, setAddFeedingOpen] = useState(false);
  const [addDiaperOpen, setAddDiaperOpen] = useState(false);
  const [addSleepOpen, setAddSleepOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-quicksand font-bold text-foreground mb-4">History</h1>
        <Tabs defaultValue="feeding">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="feeding" className="font-nunito text-xs gap-1"><Baby className="w-3.5 h-3.5" /> Feeding</TabsTrigger>
            <TabsTrigger value="diaper" className="font-nunito text-xs gap-1"><Droplets className="w-3.5 h-3.5" /> Diaper</TabsTrigger>
            <TabsTrigger value="sleep" className="font-nunito text-xs gap-1"><Moon className="w-3.5 h-3.5" /> Sleep</TabsTrigger>
          </TabsList>

          {/* ── Feeding Tab ── */}
          <TabsContent value="feeding">
            <Button onClick={() => setAddFeedingOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-nurture-purple/30 text-nurture-purple">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {feedings.filter(f => f.endTime).length === 0 ? (
              <EmptyState text="No feeding sessions yet" />
            ) : (
              <div className="space-y-2">
                {feedings.filter(f => f.endTime).map(f => (
                  <div key={f.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-purple">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(f.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {sideLabel[f.side]} · {formatDuration(f.durationSeconds || 0)}
                      </p>
                      {f.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{f.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditFeeding(f)} className="text-muted-foreground hover:text-nurture-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteFeeding(f.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Diaper Tab ── */}
          <TabsContent value="diaper">
            <Button onClick={() => setAddDiaperOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-nurture-teal/30 text-nurture-teal">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {diapers.length === 0 ? (
              <EmptyState text="No diaper changes yet" />
            ) : (
              <div className="space-y-2">
                {diapers.map(d => (
                  <div key={d.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-teal">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(d.timestamp)} {diaperEmoji[d.type]}</p>
                      <p className="text-xs text-muted-foreground font-nunito capitalize">{d.type}{d.colorNote ? ` · ${d.colorNote}` : ''}</p>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{d.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditDiaper(d)} className="text-muted-foreground hover:text-nurture-teal p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDiaper(d.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Sleep Tab ── */}
          <TabsContent value="sleep">
            <Button onClick={() => setAddSleepOpen(true)} variant="outline" className="w-full mb-3 min-h-[48px] rounded-xl font-nunito gap-2 border-nurture-blue/30 text-nurture-blue">
              <Plus className="w-4 h-4" /> Add Past Entry
            </Button>
            {sleeps.filter(s => s.endTime).length === 0 ? (
              <EmptyState text="No sleep sessions yet" />
            ) : (
              <div className="space-y-2">
                {sleeps.filter(s => s.endTime).map(s => (
                  <div key={s.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-blue">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(s.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {s.sleepType === 'night' ? '🌙 Night' : '☀️ Nap'} · {formatDuration(s.durationSeconds || 0)}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{s.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditSleep(s)} className="text-muted-foreground hover:text-nurture-blue p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSleep(s.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
      <AddFeedingDialog open={addFeedingOpen} onClose={() => setAddFeedingOpen(false)} />
      <AddDiaperDialog open={addDiaperOpen} onClose={() => setAddDiaperOpen(false)} />
      <AddSleepDialog open={addSleepOpen} onClose={() => setAddSleepOpen(false)} />
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
