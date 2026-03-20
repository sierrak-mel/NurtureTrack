import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Pencil, Trash2, TrendingUp, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import type { WeightLog, HeightLog } from '@/types';

const PURPLE = 'hsl(266,34%,47%)';
const TEAL = 'hsl(163,33%,47%)';

function ozToLbOz(oz: number) {
  const lb = Math.floor(oz / 16);
  const rem = (oz % 16).toFixed(1);
  return `${lb} lb ${rem} oz`;
}

function ozToKg(oz: number) {
  return (oz * 0.0283495).toFixed(2);
}

function inchesToCm(inches: number) {
  return (inches * 2.54).toFixed(1);
}

export default function GrowthPage() {
  const { babyProfileId, profile } = useApp();
  const unit = profile?.unitPreference || 'oz';
  const isMetric = unit === 'ml';

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [heightLogs, setHeightLogs] = useState<HeightLog[]>([]);
  const [addWeightOpen, setAddWeightOpen] = useState(false);
  const [addHeightOpen, setAddHeightOpen] = useState(false);
  const [editWeight, setEditWeight] = useState<WeightLog | null>(null);
  const [editHeight, setEditHeight] = useState<HeightLog | null>(null);

  const loadData = useCallback(async () => {
    if (!babyProfileId) return;
    const [wRes, hRes] = await Promise.all([
      (supabase.from('weight_logs' as any) as any).select('*').eq('baby_profile_id', babyProfileId).order('date', { ascending: true }),
      (supabase.from('height_logs' as any) as any).select('*').eq('baby_profile_id', babyProfileId).order('date', { ascending: true }),
    ]);
    setWeightLogs((wRes.data || []).map((w: any) => ({ id: w.id, date: w.date, weightOz: Number(w.weight_oz), notes: w.notes || '' })));
    setHeightLogs((hRes.data || []).map((h: any) => ({ id: h.id, date: h.date, heightInches: Number(h.height_inches), notes: h.notes || '' })));
  }, [babyProfileId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addWeight = async (date: string, weightOz: number, notes: string) => {
    if (!babyProfileId) return;
    await (supabase.from('weight_logs' as any) as any).insert({ baby_profile_id: babyProfileId, date, weight_oz: weightOz, notes });
    loadData();
  };

  const updateWeight = async (id: string, date: string, weightOz: number, notes: string) => {
    await (supabase.from('weight_logs' as any) as any).update({ date, weight_oz: weightOz, notes }).eq('id', id);
    loadData();
  };

  const deleteWeight = async (id: string) => {
    await (supabase.from('weight_logs' as any) as any).delete().eq('id', id);
    setWeightLogs(prev => prev.filter(w => w.id !== id));
  };

  const addHeight = async (date: string, heightInches: number, notes: string) => {
    if (!babyProfileId) return;
    await (supabase.from('height_logs' as any) as any).insert({ baby_profile_id: babyProfileId, date, height_inches: heightInches, notes });
    loadData();
  };

  const updateHeight = async (id: string, date: string, heightInches: number, notes: string) => {
    await (supabase.from('height_logs' as any) as any).update({ date, height_inches: heightInches, notes }).eq('id', id);
    loadData();
  };

  const deleteHeight = async (id: string) => {
    await (supabase.from('height_logs' as any) as any).delete().eq('id', id);
    setHeightLogs(prev => prev.filter(h => h.id !== id));
  };

  const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1] : null;
  const latestHeight = heightLogs.length ? heightLogs[heightLogs.length - 1] : null;

  const weightChartData = weightLogs.map(w => ({
    date: format(new Date(w.date + 'T00:00:00'), 'MMM d'),
    value: isMetric ? Number(ozToKg(w.weightOz)) : w.weightOz / 16,
  }));

  const heightChartData = heightLogs.map(h => ({
    date: format(new Date(h.date + 'T00:00:00'), 'MMM d'),
    value: isMetric ? Number(inchesToCm(h.heightInches)) : h.heightInches,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <h1 className="text-2xl font-quicksand font-bold text-foreground">Growth</h1>

        {/* Current stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-nurture-purple mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-nunito">Current Weight</p>
            <p className="text-lg font-quicksand font-bold text-nurture-purple">
              {latestWeight ? (isMetric ? `${ozToKg(latestWeight.weightOz)} kg` : ozToLbOz(latestWeight.weightOz)) : '—'}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <Ruler className="w-5 h-5 text-nurture-teal mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-nunito">Current Length</p>
            <p className="text-lg font-quicksand font-bold text-nurture-teal">
              {latestHeight ? (isMetric ? `${inchesToCm(latestHeight.heightInches)} cm` : `${latestHeight.heightInches}" `) : '—'}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="weight">
          <TabsList className="w-full">
            <TabsTrigger value="weight" className="flex-1 text-xs font-nunito">⚖️ Weight</TabsTrigger>
            <TabsTrigger value="height" className="flex-1 text-xs font-nunito">📏 Height / Length</TabsTrigger>
          </TabsList>

          {/* Weight Tab */}
          <TabsContent value="weight" className="space-y-4 mt-4">
            <Button onClick={() => setAddWeightOpen(true)} variant="outline" className="w-full min-h-[48px] rounded-xl font-nunito gap-2 border-nurture-purple/30 text-nurture-purple">
              <Plus className="w-4 h-4" /> Add Weight Entry
            </Button>

            {weightChartData.length >= 2 && (
              <Card className="p-4">
                <p className="text-sm font-nunito font-semibold text-foreground mb-3">Weight over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} unit={isMetric ? 'kg' : 'lb'} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke={PURPLE} strokeWidth={2} dot={{ r: 4, fill: PURPLE }} name={isMetric ? 'kg' : 'lb'} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {weightLogs.length === 0 ? (
              <div className="text-center py-8"><p className="text-muted-foreground font-nunito">No weight entries yet 📊</p></div>
            ) : (
              <div className="space-y-2">
                {[...weightLogs].reverse().map(w => (
                  <div key={w.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-purple">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{format(new Date(w.date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {isMetric ? `${ozToKg(w.weightOz)} kg` : ozToLbOz(w.weightOz)}
                      </p>
                      {w.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{w.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditWeight(w)} className="text-muted-foreground hover:text-nurture-purple p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteWeight(w.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Height Tab */}
          <TabsContent value="height" className="space-y-4 mt-4">
            <Button onClick={() => setAddHeightOpen(true)} variant="outline" className="w-full min-h-[48px] rounded-xl font-nunito gap-2 border-nurture-teal/30 text-nurture-teal">
              <Plus className="w-4 h-4" /> Add Height Entry
            </Button>

            {heightChartData.length >= 2 && (
              <Card className="p-4">
                <p className="text-sm font-nunito font-semibold text-foreground mb-3">Height over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={heightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} unit={isMetric ? 'cm' : 'in'} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2} dot={{ r: 4, fill: TEAL }} name={isMetric ? 'cm' : 'in'} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {heightLogs.length === 0 ? (
              <div className="text-center py-8"><p className="text-muted-foreground font-nunito">No height entries yet 📏</p></div>
            ) : (
              <div className="space-y-2">
                {[...heightLogs].reverse().map(h => (
                  <div key={h.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-teal">
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-semibold text-sm text-foreground">{format(new Date(h.date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {isMetric ? `${inchesToCm(h.heightInches)} cm` : `${h.heightInches} in`}
                      </p>
                      {h.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{h.notes}"</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditHeight(h)} className="text-muted-foreground hover:text-nurture-teal p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteHeight(h.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Weight Dialogs */}
      <WeightDialog open={addWeightOpen} onClose={() => setAddWeightOpen(false)} onSave={addWeight} isMetric={isMetric} />
      {editWeight && <WeightDialog open={true} onClose={() => setEditWeight(null)} onSave={(d, w, n) => updateWeight(editWeight.id, d, w, n)} initial={editWeight} isMetric={isMetric} />}
      <HeightDialog open={addHeightOpen} onClose={() => setAddHeightOpen(false)} onSave={addHeight} isMetric={isMetric} />
      {editHeight && <HeightDialog open={true} onClose={() => setEditHeight(null)} onSave={(d, h, n) => updateHeight(editHeight.id, d, h, n)} initial={editHeight} isMetric={isMetric} />}
    </div>
  );
}

function WeightDialog({ open, onClose, onSave, initial, isMetric }: {
  open: boolean; onClose: () => void;
  onSave: (date: string, weightOz: number, notes: string) => void;
  initial?: WeightLog; isMetric: boolean;
}) {
  const [date, setDate] = useState(initial?.date || format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState(() => {
    if (!initial) return '';
    return isMetric ? (initial.weightOz * 0.0283495).toFixed(2) : (initial.weightOz / 16).toFixed(2);
  });
  const [notes, setNotes] = useState(initial?.notes || '');

  const save = () => {
    const val = parseFloat(weight);
    if (isNaN(val) || val <= 0) return;
    const oz = isMetric ? val / 0.0283495 : val * 16;
    onSave(date, oz, notes);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">{initial ? 'Edit' : 'Add'} Weight</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Weight ({isMetric ? 'kg' : 'lb'})</label>
          <Input type="number" min="0" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder={isMetric ? '3.50' : '7.50'} />
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. pediatrician visit" />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-purple hover:bg-nurture-purple/90 text-white font-nunito">
            {initial ? 'Save' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HeightDialog({ open, onClose, onSave, initial, isMetric }: {
  open: boolean; onClose: () => void;
  onSave: (date: string, heightInches: number, notes: string) => void;
  initial?: HeightLog; isMetric: boolean;
}) {
  const [date, setDate] = useState(initial?.date || format(new Date(), 'yyyy-MM-dd'));
  const [height, setHeight] = useState(() => {
    if (!initial) return '';
    return isMetric ? (initial.heightInches * 2.54).toFixed(1) : initial.heightInches.toString();
  });
  const [notes, setNotes] = useState(initial?.notes || '');

  const save = () => {
    const val = parseFloat(height);
    if (isNaN(val) || val <= 0) return;
    const inches = isMetric ? val / 2.54 : val;
    onSave(date, inches, notes);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-quicksand">{initial ? 'Edit' : 'Add'} Height</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-nunito text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <label className="text-sm font-nunito text-muted-foreground">Height ({isMetric ? 'cm' : 'in'})</label>
          <Input type="number" min="0" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder={isMetric ? '50.0' : '19.5'} />
          <label className="text-sm font-nunito text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. pediatrician visit" />
        </div>
        <DialogFooter>
          <Button onClick={save} className="w-full min-h-[48px] rounded-xl bg-nurture-teal hover:bg-nurture-teal/90 text-white font-nunito">
            {initial ? 'Save' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
