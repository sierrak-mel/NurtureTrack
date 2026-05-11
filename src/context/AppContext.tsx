import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Side, DiaperType, ColorNote, SleepType, ContentType, UnitPreference } from '@/types';
import type { FeedingSession, DiaperChange, SleepSession, PumpingSession, BottleFeed, BabyProfile } from '@/types';

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
  // Pumping
  pumpings: PumpingSession[];
  activePumping: PumpingSession | null;
  startPumping: (side: Side) => void;
  stopPumping: (volumeOz?: number | null, notes?: string) => void;
  deletePumping: (id: string) => void;
  addPastPumping: (p: Omit<PumpingSession, 'id'>) => void;
  updatePumping: (id: string, updates: Partial<PumpingSession>) => void;
  // Bottle
  bottleFeeds: BottleFeed[];
  logBottleFeed: (amountOz: number, contentType: ContentType, notes?: string, timestamp?: string) => void;
  deleteBottleFeed: (id: string) => void;
  addPastBottleFeed: (b: Omit<BottleFeed, 'id'>) => void;
  updateBottleFeed: (id: string, updates: Partial<BottleFeed>) => void;
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
  const [babyProfile, setBabyProfile] = useState<{ id: string; name: string; date_of_birth: string | null; default_start_side: Side; family_id: string; unit_preference: UnitPreference } | null>(null);
  const [feedings, setFeedings] = useState<FeedingSession[]>([]);
  const [diapers, setDiapers] = useState<DiaperChange[]>([]);
  const [sleeps, setSleeps] = useState<SleepSession[]>([]);
  const [pumpings, setPumpings] = useState<PumpingSession[]>([]);
  const [bottleFeeds, setBottleFeeds] = useState<BottleFeed[]>([]);

  const babyProfileId = babyProfile?.id || null;
  const familyId = caregiver?.family_id || null;

  const profile: BabyProfile | null = babyProfile ? {
    name: babyProfile.name,
    dateOfBirth: babyProfile.date_of_birth || '',
    defaultStartSide: babyProfile.default_start_side,
    unitPreference: babyProfile.unit_preference || 'oz',
  } : null;

  useEffect(() => {
    if (!user) {
      setCaregiver(null); setCaregivers([]); setBabyProfile(null);
      setFeedings([]); setDiapers([]); setSleeps([]); setPumpings([]); setBottleFeeds([]);
      setLoading(false); return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: cgRows } = await supabase.from('caregivers').select('*').eq('user_id', user.id).limit(1);
    let cg = cgRows?.[0] || null;
    if (!cg) {
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Caregiver';
      const { error: rpcError } = await supabase.rpc('create_user_family', {
        p_display_name: displayName,
        p_baby_name: 'Baby',
      });
      if (!rpcError) {
        const { data: newCg } = await supabase.from('caregivers').select('*').eq('user_id', user.id).maybeSingle();
        cg = newCg;
      }
      if (!cg) { setLoading(false); return; }
    }
    setCaregiver(cg as Caregiver);
    const { data: allCgs } = await supabase.from('caregivers').select('*').eq('family_id', cg.family_id);
    setCaregivers((allCgs || []) as Caregiver[]);
    const { data: bp } = await supabase.from('baby_profiles').select('*').eq('family_id', cg.family_id).maybeSingle();
    if (bp) {
      setBabyProfile({ id: bp.id, name: bp.name, date_of_birth: bp.date_of_birth, default_start_side: bp.default_start_side as Side, family_id: bp.family_id, unit_preference: (bp as any).unit_preference || 'oz' });
      await loadTrackerData(bp.id);
    }
    setLoading(false);
  };

  const loadTrackerData = async (bpId: string) => {
    const [feedRes, diapRes, sleepRes, pumpRes, bottleRes] = await Promise.all([
      supabase.from('feeding_sessions').select('*').eq('baby_profile_id', bpId).order('start_time', { ascending: false }),
      supabase.from('diaper_changes').select('*').eq('baby_profile_id', bpId).order('timestamp', { ascending: false }),
      supabase.from('sleep_sessions').select('*').eq('baby_profile_id', bpId).order('start_time', { ascending: false }),
      supabase.from('pumping_sessions' as any).select('*').eq('baby_profile_id', bpId).order('start_time', { ascending: false }),
      supabase.from('bottle_feeds' as any).select('*').eq('baby_profile_id', bpId).order('timestamp', { ascending: false }),
    ]);

    setFeedings((feedRes.data || []).map((f: any) => ({
      id: f.id, startTime: f.start_time, endTime: f.end_time, durationSeconds: f.duration_seconds,
      side: f.side as Side, notes: f.notes || '',
    })));
    setDiapers((diapRes.data || []).map((d: any) => ({
      id: d.id, timestamp: d.timestamp, type: d.type as DiaperType,
      colorNote: d.color_note as ColorNote | null, notes: d.notes || '',
    })));
    setSleeps((sleepRes.data || []).map((s: any) => ({
      id: s.id, startTime: s.start_time, endTime: s.end_time, durationSeconds: s.duration_seconds,
      sleepType: s.sleep_type as SleepType, notes: s.notes || '',
    })));
    setPumpings((pumpRes.data || []).map((p: any) => ({
      id: p.id, startTime: p.start_time, endTime: p.end_time, durationSeconds: p.duration_seconds,
      side: p.side as Side, volumeOz: p.volume_oz, notes: p.notes || '',
    })));
    setBottleFeeds((bottleRes.data || []).map((b: any) => ({
      id: b.id, timestamp: b.timestamp, amountOz: Number(b.amount_oz),
      contentType: b.content_type as ContentType, notes: b.notes || '',
    })));
  };

  const activeFeeding = feedings.find(f => !f.endTime) || null;
  const activeSleep = sleeps.find(s => !s.endTime) || null;
  const activePumping = pumpings.find(p => !p.endTime) || null;

  const setProfileFn = useCallback(async (p: BabyProfile) => {
    if (!babyProfileId) return;
    await supabase.from('baby_profiles').update({
      name: p.name, date_of_birth: p.dateOfBirth || null,
      default_start_side: p.defaultStartSide as any,
      unit_preference: p.unitPreference,
    } as any).eq('id', babyProfileId);
    setBabyProfile(prev => prev ? { ...prev, name: p.name, date_of_birth: p.dateOfBirth, default_start_side: p.defaultStartSide, unit_preference: p.unitPreference } : prev);
  }, [babyProfileId]);

  // ── Feeding CRUD ──
  const startFeeding = useCallback(async (side: Side) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await supabase.from('feeding_sessions').insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: new Date().toISOString(), side: side as any,
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

  // ── Diaper CRUD ──
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

  // ── Sleep CRUD ──
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

  // ── Pumping CRUD ──
  const startPumping = useCallback(async (side: Side) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await (supabase.from('pumping_sessions' as any) as any).insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: new Date().toISOString(), side,
    }).select().single();
    if (data) {
      setPumpings(prev => [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, side: data.side as Side, volumeOz: data.volume_oz, notes: data.notes || '' }, ...prev]);
    }
  }, [babyProfileId, caregiver]);

  const stopPumping = useCallback(async (volumeOz: number | null = null, notes = '') => {
    const active = pumpings.find(p => !p.endTime);
    if (!active) return;
    const now = new Date().toISOString();
    const dur = Math.floor((new Date(now).getTime() - new Date(active.startTime).getTime()) / 1000);
    const updates: any = { end_time: now, duration_seconds: dur, notes: notes || active.notes };
    if (volumeOz !== null) updates.volume_oz = volumeOz;
    await (supabase.from('pumping_sessions' as any) as any).update(updates).eq('id', active.id);
    setPumpings(prev => prev.map(p => p.id === active.id ? { ...p, endTime: now, durationSeconds: dur, volumeOz: volumeOz ?? p.volumeOz, notes: notes || p.notes } : p));
  }, [pumpings]);

  const deletePumping = useCallback(async (id: string) => {
    await (supabase.from('pumping_sessions' as any) as any).delete().eq('id', id);
    setPumpings(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPastPumping = useCallback(async (p: Omit<PumpingSession, 'id'>) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await (supabase.from('pumping_sessions' as any) as any).insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      start_time: p.startTime, end_time: p.endTime, duration_seconds: p.durationSeconds,
      side: p.side, volume_oz: p.volumeOz, notes: p.notes,
    }).select().single();
    if (data) {
      setPumpings(prev => {
        const all = [{ id: data.id, startTime: data.start_time, endTime: data.end_time, durationSeconds: data.duration_seconds, side: data.side as Side, volumeOz: data.volume_oz, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const updatePumping = useCallback(async (id: string, updates: Partial<PumpingSession>) => {
    const dbUpdates: any = {};
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.durationSeconds !== undefined) dbUpdates.duration_seconds = updates.durationSeconds;
    if (updates.side !== undefined) dbUpdates.side = updates.side;
    if (updates.volumeOz !== undefined) dbUpdates.volume_oz = updates.volumeOz;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await (supabase.from('pumping_sessions' as any) as any).update(dbUpdates).eq('id', id);
    setPumpings(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  // ── Bottle Feed CRUD ──
  const logBottleFeed = useCallback(async (amountOz: number, contentType: ContentType, notes = '', timestamp?: string) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await (supabase.from('bottle_feeds' as any) as any).insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      timestamp: timestamp || new Date().toISOString(), amount_oz: amountOz,
      content_type: contentType, notes,
    }).select().single();
    if (data) {
      setBottleFeeds(prev => {
        const all = [{ id: data.id, timestamp: data.timestamp, amountOz: Number(data.amount_oz), contentType: data.content_type as ContentType, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const deleteBottleFeed = useCallback(async (id: string) => {
    await (supabase.from('bottle_feeds' as any) as any).delete().eq('id', id);
    setBottleFeeds(prev => prev.filter(b => b.id !== id));
  }, []);

  const addPastBottleFeed = useCallback(async (b: Omit<BottleFeed, 'id'>) => {
    if (!babyProfileId || !caregiver) return;
    const { data } = await (supabase.from('bottle_feeds' as any) as any).insert({
      baby_profile_id: babyProfileId, caregiver_id: caregiver.id,
      timestamp: b.timestamp, amount_oz: b.amountOz,
      content_type: b.contentType, notes: b.notes,
    }).select().single();
    if (data) {
      setBottleFeeds(prev => {
        const all = [{ id: data.id, timestamp: data.timestamp, amountOz: Number(data.amount_oz), contentType: data.content_type as ContentType, notes: data.notes || '' }, ...prev];
        return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }
  }, [babyProfileId, caregiver]);

  const updateBottleFeed = useCallback(async (id: string, updates: Partial<BottleFeed>) => {
    const dbUpdates: any = {};
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.amountOz !== undefined) dbUpdates.amount_oz = updates.amountOz;
    if (updates.contentType !== undefined) dbUpdates.content_type = updates.contentType;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await (supabase.from('bottle_feeds' as any) as any).update(dbUpdates).eq('id', id);
    setBottleFeeds(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  return (
    <AppContext.Provider value={{
      profile, setProfile: setProfileFn,
      feedings, activeFeeding, startFeeding, stopFeeding, deleteFeeding, addPastFeeding, updateFeeding,
      diapers, logDiaper, deleteDiaper, addPastDiaper, updateDiaper,
      sleeps, activeSleep, startSleep, stopSleep, deleteSleep, addPastSleep, updateSleep,
      pumpings, activePumping, startPumping, stopPumping, deletePumping, addPastPumping, updatePumping,
      bottleFeeds, logBottleFeed, deleteBottleFeed, addPastBottleFeed, updateBottleFeed,
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
