

# NurtureTrack — Baby Care Tracking App

## Overview
A calm, warm, mobile-first baby care tracker for new mothers to log breastfeeding, diaper changes, and sleep sessions. Designed for one-handed use with large tap targets, soft colors, and a soothing UI.

## Phase 1: Foundation & Design System

### Custom Theme & Typography
- Import **Quicksand** (display/numbers) and **Nunito** (body/UI) from Google Fonts
- Set up the custom color palette: Purple (#6B4FA0), Teal (#4FA08B), Blue (#7BA7E1), Pink (#D4699E), warm off-white background (#FDFBF7), charcoal text (#2D2A32)
- Configure large rounded corners, generous spacing, and 48px+ button heights throughout

### Bottom Navigation Bar
- Fixed bottom nav with 4 tabs: **Home**, **History**, **Analytics**, **Settings**
- Icons + labels, thumb-reachable, with active state indicator

## Phase 2: Auth & Baby Profile (Supabase)

### Authentication
- Email + password signup/login with Supabase Auth
- Clean, warm login/signup screens matching the design system
- Password reset flow

### Baby Profile Creation (First Login)
- Onboarding flow: baby's name, date of birth, optional photo upload, default starting breast (Left/Right)
- Creates a `baby_profiles` table and `caregivers` table in Supabase
- Account owner role assigned automatically

### Database Schema
- `baby_profiles`: id, name, date_of_birth, photo_url, default_start_side, family_id
- `caregivers`: id, family_id, user_id, display_name, avatar_url, role (owner/member)
- `feeding_sessions`: id, baby_profile_id, caregiver_id, start_time, end_time, duration_seconds, side, notes
- `diaper_changes`: id, baby_profile_id, caregiver_id, timestamp, type, color_note, notes
- `sleep_sessions`: id, baby_profile_id, caregiver_id, start_time, end_time, duration_seconds, sleep_type, notes
- RLS policies so caregivers only access their family's data

## Phase 3: Home Dashboard

### Three Tracker Cards (Stacked Vertically)
1. **Feeding Card** (Purple) — Last feed time ago, side used, duration, "Start Feeding" button
2. **Diaper Card** (Teal) — Time since last change, type icon, today's counts, quick-log buttons (Pee/Poop/Both)
3. **Sleep Card** (Blue) — Current state (sleeping/awake) with live timer, last sleep duration, total 24h sleep, Start/End Nap toggle

### Active Session Banner
- Sticky top banner when any timer is running (feed or sleep)
- Shows live MM:SS timer, session type, and a large Stop button
- Gentle animation, non-jarring

### Empty States
- Warm, encouraging messages when no data exists (e.g., "No feeds logged yet — tap the button when you're ready!")

## Phase 4: Breastfeeding Tracker

### Start/Stop Timer Flow
- Tap "Start Feeding" → pre-selects opposite side from last feed
- Live running timer (MM:SS) with Quicksand font
- Side selector (Left/Right/Both) switchable mid-feed
- "Stop Feed" button saves session with all data

### Feed History
- Scrollable list showing time, side indicator, duration, notes, and caregiver name
- Each entry is editable and deletable
- "Add Past Entry" button for manual logging with date/time picker

## Phase 5: Diaper Tracker

### Quick-Log Buttons
- Three large buttons: **Pee** 💧, **Poop** 💩, **Both** — instant log at current time
- Optional expandable section for color/consistency (Normal/Unusual/Bloody) and free-text notes

### Diaper History
- Scrollable list with type icons, timestamps, notes
- Editable, deletable, manual entry option

## Phase 6: Sleep/Nap Tracker

### Start/End Toggle
- Large toggle button: "Start Nap" ↔ "End Nap"
- Live elapsed timer while baby sleeps
- Auto-classifies as Nap vs Night Sleep based on time of day (overridable)
- Optional notes on end

### Sleep History
- Scrollable list with sleep type badge, duration, time range
- Editable, deletable, manual entry option

## Key UX Details
- All timers persist across page refreshes (stored in Supabase with null end_time)
- Real-time data sync using Supabase subscriptions for multi-caregiver support
- Soft fade transitions for state changes
- Mobile-first layout optimized for one-handed thumb use
- Long-running timer banner (2+ hours) as gentle check-in reminder

