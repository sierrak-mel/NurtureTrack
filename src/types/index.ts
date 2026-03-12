export type Side = 'left' | 'right' | 'both';
export type DiaperType = 'pee' | 'poop' | 'both';
export type ColorNote = 'normal' | 'unusual' | 'bloody';
export type SleepType = 'nap' | 'night';

export interface FeedingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  side: Side;
  notes: string;
}

export interface DiaperChange {
  id: string;
  timestamp: string;
  type: DiaperType;
  colorNote: ColorNote | null;
  notes: string;
}

export interface SleepSession {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  sleepType: SleepType;
  notes: string;
}

export interface BabyProfile {
  name: string;
  dateOfBirth: string;
  defaultStartSide: Side;
}
