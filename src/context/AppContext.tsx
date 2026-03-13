import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { FeedingSession, DiaperChange, SleepSession, BabyProfile, Side, DiaperType, ColorNote, SleepType } from '@/types';

function genId() { return crypto.randomUUID(); }

interface AppState {
  profile: BabyProfile | null;
  setProfile: (p: BabyProfile) => void;
  feedings: FeedingSession[];
  activeFeeding: FeedingSession | null;
  startFeeding: (side: Side) => void;
  stopFeeding: (notes?: string) => void;
  deleteFeeding: (id: string) => void;
  addPastFeeding: (f: Omit<FeedingSession, 'id'>) => void;
  updateFeeding: (id: string, updates: Partial<FeedingSession>) => void;
  diapers: DiaperChange[];
  logDiaper: (type: DiaperType, colorNote?: ColorNote | null, notes?: string) => void;
  deleteDiaper: (id: string) => void;
  addPastDiaper: (d: Omit<DiaperChange, 'id'>) => void;
  updateDiaper: (id: string, updates: Partial<DiaperChange>) => void;
  sleeps: SleepSession[];
  activeSleep: SleepSession | null;
  startSleep: () => void;
  stopSleep: (notes?: string, sleepType?: SleepType) => void;
  deleteSleep: (id: string) => void;
  addPastSleep: (s: Omit<SleepSession, 'id'>) => void;
  updateSleep: (id: string, updates: Partial<SleepSession>) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useLocalStorage<BabyProfile | null>('nurture_profile', null);
  const [feedings, setFeedings] = useLocalStorage<FeedingSession[]>('nurture_feedings', []);
  const [diapers, setDiapers] = useLocalStorage<DiaperChange[]>('nurture_diapers', []);
  const [sleeps, setSleeps] = useLocalStorage<SleepSession[]>('nurture_sleeps', []);

  const activeFeeding = feedings.find(f => !f.endTime) || null;
  const activeSleep = sleeps.find(s => !s.endTime) || null;

  const startFeeding = useCallback((side: Side) => {
    const session: FeedingSession = {
      id: genId(), startTime: new Date().toISOString(), endTime: null,
      durationSeconds: null, side, notes: '',
    };
    setFeedings(prev => [session, ...prev]);
  }, [setFeedings]);

  const stopFeeding = useCallback((notes = '') => {
    const now = new Date().toISOString();
    setFeedings(prev => prev.map(f => {
      if (!f.endTime) {
        const dur = Math.floor((new Date(now).getTime() - new Date(f.startTime).getTime()) / 1000);
        return { ...f, endTime: now, durationSeconds: dur, notes: notes || f.notes };
      }
      return f;
    }));
  }, [setFeedings]);

  const deleteFeeding = useCallback((id: string) => {
    setFeedings(prev => prev.filter(f => f.id !== id));
  }, [setFeedings]);

  const addPastFeeding = useCallback((f: Omit<FeedingSession, 'id'>) => {
    setFeedings(prev => {
      const all = [{ ...f, id: genId() }, ...prev];
      return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });
  }, [setFeedings]);

  const logDiaper = useCallback((type: DiaperType, colorNote: ColorNote | null = null, notes = '') => {
    const entry: DiaperChange = { id: genId(), timestamp: new Date().toISOString(), type, colorNote, notes };
    setDiapers(prev => [entry, ...prev]);
  }, [setDiapers]);

  const deleteDiaper = useCallback((id: string) => {
    setDiapers(prev => prev.filter(d => d.id !== id));
  }, [setDiapers]);

  const addPastDiaper = useCallback((d: Omit<DiaperChange, 'id'>) => {
    setDiapers(prev => {
      const all = [{ ...d, id: genId() }, ...prev];
      return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [setDiapers]);

  const startSleep = useCallback(() => {
    const hour = new Date().getHours();
    const sleepType: SleepType = (hour >= 19 || hour < 6) ? 'night' : 'nap';
    const session: SleepSession = {
      id: genId(), startTime: new Date().toISOString(), endTime: null,
      durationSeconds: null, sleepType, notes: '',
    };
    setSleeps(prev => [session, ...prev]);
  }, [setSleeps]);

  const stopSleep = useCallback((notes = '', sleepType?: SleepType) => {
    const now = new Date().toISOString();
    setSleeps(prev => prev.map(s => {
      if (!s.endTime) {
        const dur = Math.floor((new Date(now).getTime() - new Date(s.startTime).getTime()) / 1000);
        return { ...s, endTime: now, durationSeconds: dur, notes: notes || s.notes, sleepType: sleepType || s.sleepType };
      }
      return s;
    }));
  }, [setSleeps]);

  const deleteSleep = useCallback((id: string) => {
    setSleeps(prev => prev.filter(s => s.id !== id));
  }, [setSleeps]);

  const addPastSleep = useCallback((s: Omit<SleepSession, 'id'>) => {
    setSleeps(prev => {
      const all = [{ ...s, id: genId() }, ...prev];
      return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });
  }, [setSleeps]);

  return (
    <AppContext.Provider value={{
      profile, setProfile,
      feedings, activeFeeding, startFeeding, stopFeeding, deleteFeeding, addPastFeeding,
      diapers, logDiaper, deleteDiaper, addPastDiaper,
      sleeps, activeSleep, startSleep, stopSleep, deleteSleep, addPastSleep,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
