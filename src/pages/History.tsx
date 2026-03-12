import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Droplets, Moon, Trash2 } from 'lucide-react';
import type { Side, DiaperType } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const sideLabel: Record<Side, string> = { left: '🤱 Left', right: 'Right 🤱', both: 'Both' };
const diaperEmoji: Record<DiaperType, string> = { pee: '💧', poop: '💩', both: '💧💩' };

export default function History() {
  const { feedings, deleteFeeding, diapers, deleteDiaper, sleeps, deleteSleep } = useApp();

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

          <TabsContent value="feeding">
            {feedings.length === 0 ? (
              <EmptyState text="No feeding sessions yet" />
            ) : (
              <div className="space-y-2">
                {feedings.filter(f => f.endTime).map(f => (
                  <div key={f.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-purple">
                    <div>
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(f.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {sideLabel[f.side]} · {formatDuration(f.durationSeconds || 0)}
                      </p>
                      {f.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{f.notes}"</p>}
                    </div>
                    <button onClick={() => deleteFeeding(f.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="diaper">
            {diapers.length === 0 ? (
              <EmptyState text="No diaper changes yet" />
            ) : (
              <div className="space-y-2">
                {diapers.map(d => (
                  <div key={d.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-teal">
                    <div>
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(d.timestamp)} {diaperEmoji[d.type]}</p>
                      <p className="text-xs text-muted-foreground font-nunito capitalize">{d.type}{d.colorNote ? ` · ${d.colorNote}` : ''}</p>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{d.notes}"</p>}
                    </div>
                    <button onClick={() => deleteDiaper(d.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sleep">
            {sleeps.length === 0 ? (
              <EmptyState text="No sleep sessions yet" />
            ) : (
              <div className="space-y-2">
                {sleeps.filter(s => s.endTime).map(s => (
                  <div key={s.id} className="bg-card rounded-xl p-4 flex items-center justify-between border-l-4 border-nurture-blue">
                    <div>
                      <p className="font-nunito font-semibold text-sm text-foreground">{formatDate(s.startTime)}</p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {s.sleepType === 'night' ? '🌙 Night' : '☀️ Nap'} · {formatDuration(s.durationSeconds || 0)}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>}
                    </div>
                    <button onClick={() => deleteSleep(s.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
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
