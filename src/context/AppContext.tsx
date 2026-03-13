import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Side, DiaperType, ColorNote, SleepType } from '@/types';
import type { FeedingSession, DiaperChange, SleepSession, BabyProfile } from '@/types';

interface Caregiver {
  id: string;
  family_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'member';
  invite_email: string | null;
}

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
  caregiver: Caregiver | null;
  caregivers: Caregiver[];
  babyProfileId: string | null;
  familyId: string | null;
  loading: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [babyProfile, setBabyProfile] = useState<{ id: string; name: string; date_of_birth: string | null; default_start_side: Side; family_id: string } | null>(null);
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [diapers, setDiapers] = useState<DiaperChange[]>([]);
  const [sleeps, setSleeps] = useState<SleepSession[]>([]);

  const babyProfileId = babyProfile?.id || null;
  const familyId = caregiver?.family_id || null;

  const profile: BabyProfile | null = babyProfile ? {
    name: babyProfile.name,
    dateOfBirth: babyProfile.date_of_birth || '',
    defaultStartSide: babyProfile.default_start_side,
  } : null;

  // Load initial data
  useEffect(() => {
    if (!user) {
      setCaregiver(null);
      setCaregivers([]);
      setBabyProfile(null);
      setFeedings([]);
      setDiapers([]);
      setSleeps([]);
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Get caregiver record
    const { data: cg } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cg) { setLoading(false); return; }
    setCaregiver(cg as Caregiver);

    // Get all caregivers in family
    const { data: allCgs } = await supabase
      .from('caregivers')
      .select('*')
      .eq('family_id', cg.family_id);
    setCaregivers((allCgs || []) as Caregiver[]);

    // Get baby profile
    const { data: bp } = await supabase
      .from('baby_profiles')
      .select('*')
      .eq('family_id', cg.family_id)
      .maybeSingle();

    if (bp) {
      setBabyProfile({ id: bp.id, name: bp.name, date_of_birth: bp.date_of_birth, default_start_side: bp.default_start_side as Side, family_id: bp.family_id });
      await loadTrackerData(bp.id);
    }
    setLoading(false);
  };

  const loadTrackerData = async (bpId: string) => {
    const [feedRes, diapRes, sleepRes] = await Promise.all([
      supabase.from('feeding_sessions').select('*').eq('baby_profile_id', bpId).order('start_time', { ascending: false }),
      supabase.from('diaper_changes').select('*').eq('baby_profile_id', bpId).order('timestamp', { ascending: false }),
      supabase.from('sleep_sessions').select('*').eq('baby_profile_id', bpId).order('start_time', { ascending: false }),
    ]);

    setFeedings((feedRes.data || []).map(f => ({
      id: f.id, startTime: f.start_time, endTime: f.end_time, durationSeconds: f.duration_seconds,
      side: f.side as Side, notes: f.notes || '',
    })));
    setDiapers((diapRes.data || []).map(d => ({
      id: d.id, timestamp: d.timestamp, type: d.type as DiaperType,
      colorNote: d.color_note as ColorNote | null, notes: d.notes || '',
    })));
    setSleeps((sleepRes.data || []).map(s => ({
      id: s.id, startTime: s.start_time, endTime: s.end_time, durationSeconds: s.duration_seconds,
      sleepType: s.sleep_type as SleepType, notes: s.notes || '',
    })));
  };

  const activeFeeding = feedings.find(f => !f.endTime) || null;
  const activeSleep = sleeps.find(s => !s.endTime) || null;

  const setProfileFn = useCallback(async (p: BabyProfile) => {
    if (!babyProfileId) return;
    await supabase.from('baby_profiles').update({
      name: p.name,
      date_of_birth: p.dateOfBirth || null,
      default_start_side: p.defaultStartSide as any,
    }).eq('id', babyProfileId);
    setBabyProfile(prev => prev ? { ...prev, name: p.name, date_of_birth: p.dateOfBirth, default_start_side: p.defaultStartSide } : prev);
  }, [babyProfileId]);

  const startFeeding = useCallback(async (side: Side) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('feeding_sessions').insert({
      baby_profile_id: babyProfileId,
      caregiver_id: caregiver.id,
      start_time: new Date().toISOString(),
      side: side as any,
    }).select().single();
    if (data) {
      setFeedings(prev => [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, side: data.side as Side, notes: data.notes || '' }, ...prev]);
    }
  }, [babyProfileId, caregiver]);

  const stopFeeding = useCallback(async (notes = '') => {
    const active = feedings.find(f => !f.endTime);
    if (!active) return;
    const now = new Date().toISOString();
    const dur = Math.floor((new Date(now).getTime() - new Date(active.startTime).getTime()) / 1000);
    await supabase.from('feeding_sessions').update({ end_time: now, duration_seconds: dur, notes: notes || active.notes }).eq('id', active.id);
    setFeedings(prev => prev.map(f => f.id === active.id ? { ...f, endTime: now, durationSeconds: dur, notes: notes || f.notes } : f));
  }, [feedings]);

  const deleteFeeding = useCallback(async (id: string) => {
    await supabase.from('feeding_sessions').delete().eq('id', id);
    setFeedings(prev => prev.filter(f => f.id !== id));
  }, []);

  const addPastFeeding = useCallback(async (f: Omit<FeedingSession, 'id'>) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('feeding_sessions').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: f.startTime, end_time: f.endTime, duration_seconds: f.durationSeconds,
      side: f.side as any, notes: f.notes,
    }).select().single();
    if (data) {
      setFeedings(prev => {
        const all = [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, side: data.side as Side, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const updateFeeding = useCallback(async (id: string, updates: Partial<FeedingSession>) => {
    const dbUpdates: any = {};
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.durationSeconds !== undefined) dbUpdates.duration_seconds = updates.durationSeconds;
    if (updates.side !== undefined) dbUpdates.side = updates.side;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await supabase.from('feeding_sessions').update(dbUpdates).eq('id', id);
    setFeedings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const logDiaper = useCallback(async (type: DiaperType, colorNote: ColorNote | null = null, notes = '') => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('diaper_changes').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      timestamp: new Date().toISOString(), type: type as any, color_note: colorNote as any, notes,
    }).select().single();
    if (data) {
      setDiapers(prev => [{ id: data.id, timestamp: data.timestamp, type: data.type as DiaperType, colorNote: data.color_note as ColorNote | null, notes: data.notes || '' }, ...prev]);
    }
  }, [babyProfileId, caregiver]);

  const deleteDiaper = useCallback(async (id: string) => {
    await supabase.from('diaper_changes').delete().eq('id', id);
    setDiapers(prev => prev.filter(d => d.id !== id));
  }, []);

  const addPastDiaper = useCallback(async (d: Omit<DiaperChange, 'id'>) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('diaper_changes').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      timestamp: d.timestamp, type: d.type as any, color_note: d.colorNote as any, notes: d.notes,
    }).select().single();
    if (data) {
      setDiapers(prev => {
        const all = [{ id: data.id, timestamp: data.timestamp, type: data.type as DiaperType, colorNote: data.color_note as ColorNote | null, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const updateDiaper = useCallback(async (id: string, updates: Partial<DiaperChange>) => {
    const dbUpdates: any = {};
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.colorNote !== undefined) dbUpdates.color_note = updates.colorNote;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await supabase.from('diaper_changes').update(dbUpdates).eq('id', id);
    setDiapers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const startSleep = useCallback(async () => {
    if (!babyProfileId || !caregiver) return;
    const hour = new Date().getHours();
    const sleepType: SleepType = (hour >= 19 || hour < 6) ? 'night' : 'nap';
    const { data } = await supabase.from('sleep_sessions').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: new Date().toISOString(), sleep_type: sleepType as any,
    }).select().single();
    if (data) {
      setSleeps(prev => [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, sleepType: data.sleep_type as SleepType, notes: data.notes || '' }, ...prev]);
    }
  }, [babyProfileId, caregiver]);

  const stopSleep = useCallback(async (notes = '', sleepType?: SleepType) => {
    const active = sleeps.find(s => !s.endTime);
    if (!active) return;
    const now = new Date().toISOString();
    const dur = Math.floor((new Date(now).getTime() - new Date(active.startTime).getTime()) / 1000);
    const updates: any = { end_time: now, duration_seconds: dur, notes: notes || active.notes };
    if (sleepType) updates.sleep_type = sleepType;
    await supabase.from('sleep_sessions').update(updates).eq('id', active.id);
    setSleeps(prev => prev.map(s => s.id === active.id ? { ...s, endTime: now, durationSeconds: dur, notes: notes || s.notes, sleepType: sleepType || s.sleepType } : s));
  }, [sleeps]);

  const deleteSleep = useCallback(async (id: string) => {
    await supabase.from('sleep_sessions').delete().eq('id', id);
    setSleeps(prev => prev.filter(s => s.id !== id));
  }, []);

  const addPastSleep = useCallback(async (s: Omit<SleepSession, 'id'>) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('sleep_sessions').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: s.startTime, end_time: s.endTime, duration_seconds: s.durationSeconds,
      sleep_type: s.sleepType as any, notes: s.notes,
    }).select().single();
    if (data) {
      setSleeps(prev => {
        const all = [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, sleepType: data.sleep_type as SleepType, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const updateSleep = useCallback(async (id: string, updates: Partial<SleepSession>) => {
    const dbUpdates: any = {};
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.durationSeconds !== undefined) dbUpdates.duration_seconds = updates.durationSeconds;
    if (updates.sleepType !== undefined) dbUpdates.sleep_type = updates.sleepType;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await supabase.from('sleep_sessions').update(dbUpdates).eq('id', id);
    setSleeps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  return (
    <AppContext.Provider value={{
      profile, setProfile: setProfileFn,
      feedings, activeFeeding, startFeeding, stopFeeding, deleteFeeding, addPastFeeding, updateFeeding,
      diapers, logDiaper, deleteDiaper, addPastDiaper, updateDiaper,
      sleeps, activeSleep, startSleep, stopSleep, deleteSleep, addPastSleep, updateSleep,
      caregiver, caregivers, babyProfileId, familyId, loading,
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
