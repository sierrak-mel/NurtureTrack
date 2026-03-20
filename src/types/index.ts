export type Side = 'left' | 'right' | 'both';
export type DiaperType = 'pee' | 'poop' | 'both';
export type ColorNote = 'normal' | 'unusual' | 'bloody';
export type SleepType = 'nap' | 'night';
export type ContentType = 'breast_milk' | 'formula' | 'mixed';
export type UnitPreference = 'oz' | 'ml';
export type ThemeMode = 'light' | 'dark' | 'system';

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

export interface PumpingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  side: Side;
  volumeOz: number | null;
  notes: string;
}

export interface BottleFeed {
  id: string;
  timestamp: string;
  amountOz: number;
  contentType: ContentType;
  notes: string;
}

export interface BabyProfile {
  name: string;
  dateOfBirth: string;
  defaultStartSide: Side;
  unitPreference: UnitPreference;
}

export interface WeightLog {
  id: string;
  date: string;
  weightOz: number;
  notes: string;
}

export interface HeightLog {
  id: string;
  date: string;
  heightInches: number;
  notes: string;
}

export interface FeedingReminderSettings {
  enabled: boolean;
  daytimeStart: string; // "07:00"
  daytimeEnd: string;   // "21:00"
  daytimeThresholdHrs: number;
  nighttimeThresholdHrs: number;
}
