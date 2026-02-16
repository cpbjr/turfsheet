# Demo Day Fixes - Implementation Plan

**Date:** 2026-02-16
**Assignee:** Execution Agent
**Priority:** CRITICAL - Demo Tomorrow

---

## Context

Tomorrow is demo day for TurfSheet. The application has several UI/UX issues that make it look unpolished:

1. **Hard-coded values** - Workday hours show "05:30 AM-2:30 PM" instead of using user settings
2. **Unnecessary UI elements** - Calendar navigation in header, "Banbury Golf Course" text, mini calendar widget
3. **Missing functionality** - Staff duty tracking shows placeholder instead of actual working staff
4. **Layout issues** - Weather should be in header, not right panel

The settings infrastructure already exists and works correctly. Most fixes involve connecting existing components to the settings system and simplifying the UI.

---

## User Requirements (Exact)

From user message:

### Dashboard
1. ✅ Workday is not being calculated from preferences page
2. ✅ Staff assigned to work this day should be in "Staff on Duty"
3. ⏭️ Automation (copy from yesterday) - FUTURE, not for demo
4. ✅ In whiteboard view: remove "Add a job" (functionality picked up in assign job)
5. ✅ Change "Staff on Duty" to "Working Today", add ability to remove staff
   - Staff not working should be grayed out, not able to assign jobs
6. ✅ Date in header is the actual date, no need for selector. Move weather to header. That card becomes "Announcements"
7. ✅ Remove "Banbury Golf Course", remove calendar

### Other
1. ✅ Calendar page placeholder (route exists but no component)

---

## Critical Files Reference

### Components to Modify
```
/home/cpbjr/WhitePineTech/Projects/TurfSheet/worktree/demo-prep-01/turfsheet-app/src/
├── components/
│   ├── DateSelector.tsx              # Fix workday display, remove navigation
│   ├── layout/
│   │   ├── Header.tsx                # Add weather widget
│   │   └── RightPanel.tsx            # Remove course name, calendar; add announcements
│   └── whiteboard/
│       ├── StaffWhiteboardView.tsx   # Remove "Add a Job" button
│       └── StaffRow.tsx              # Add graying for non-working staff
└── pages/
    └── CalendarPage.tsx              # CREATE NEW - placeholder page
```

### Existing Infrastructure (DO NOT MODIFY)
```
/home/cpbjr/WhitePineTech/Projects/TurfSheet/worktree/demo-prep-01/turfsheet-app/src/
├── contexts/SettingsContext.tsx      # Settings provider - already works
├── types/settings.ts                 # Settings types - workdayStartTime, workdayEndTime
├── services/weather.ts               # Weather API service - already works
└── components/WeatherDisplay.tsx     # Weather component - may need compact mode
```

### Database Tables (Already Created)
- `turfsheet.staff_schedules` - Staff work schedules by day of week
- `turfsheet.default_schedule` - Global default schedule (M-F 7:30a-2:30p)
- Migration: `supabase/migrations/20260214213817_create_default_schedule.sql`

---

## Implementation Tasks

### Task 1: Fix Workday Display in DateSelector ⚙️

**File:** `src/components/DateSelector.tsx`

**Current Issue:**
Line 51: Hard-coded `Workday: 05:30 AM-2:30 PM`

**Changes Required:**

1. Import `useSettings` hook:
```tsx
import { useSettings } from '../contexts/SettingsContext';
```

2. Add time conversion helper function:
```tsx
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

3. Get settings in component:
```tsx
const { settings } = useSettings();
```

4. Replace line 51:
```tsx
// OLD:
Workday: 05:30 AM-2:30 PM

// NEW:
Workday: {formatTime12Hour(settings.workdayStartTime)}-{formatTime12Hour(settings.workdayEndTime)}
```

**Verification:**
- Go to Settings page
- Change workday hours (e.g., 6:00 AM - 3:00 PM)
- Return to dashboard
- Verify DateSelector shows new times immediately

---

### Task 2: Simplify DateSelector - Remove Navigation 🗓️

**File:** `src/components/DateSelector.tsx`

**User Requirement:** "Date in header is the actual date. No need for selector."

**Changes Required:**

Remove all interactive elements. Keep only static display of today's date + workday hours.

**New Implementation:**
```tsx
import { format } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';

export function DateSelector() {
  const { settings } = useSettings();
  const today = new Date();

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="flex items-center gap-3 bg-dashboard-bg px-4 py-1.5 border border-border-color">
      <span className="font-heading font-bold text-sm text-text-primary tracking-tight">
        {format(today, 'EEE MMM d, yyyy')}
      </span>
      <span className="ml-2 text-turf-green font-heading font-black text-xs whitespace-nowrap tracking-widest bg-turf-green/10 px-4 py-1 uppercase border-l border-turf-green/20">
        Workday: {formatTime12Hour(settings.workdayStartTime)}-{formatTime12Hour(settings.workdayEndTime)}
      </span>
    </div>
  );
}
```

**What was removed:**
- `useState` for currentDate and showCalendar
- Prev/next navigation buttons
- Calendar icon and date picker popup
- All click handlers

**Note:** Whiteboard view (StaffWhiteboardView) has its own date navigation for viewing different days. Header always shows "today" for reference.

---

### Task 3: Move Weather to Header 🌤️

**Files:** `src/components/layout/Header.tsx`, `src/components/WeatherDisplay.tsx`

**User Requirement:** "Move weather information up to the header"

**Option A: Create Compact Weather Component (Recommended)**

Create new `CompactWeather.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { fetchWeather } from '../services/weather';

export function CompactWeather() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetchWeather().then(setWeather).catch(console.error);
  }, []);

  if (!weather) return null;

  const temp = Math.round((weather.main.temp - 273.15) * 9/5 + 32); // Kelvin to F
  const isRain = weather.weather[0]?.main?.toLowerCase().includes('rain');

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="text-lg">{isRain ? '🌧️' : '☀️'}</span>
      <span className="font-heading font-bold text-text-primary">{temp}°F</span>
    </div>
  );
}
```

**Header.tsx Changes:**

Add after DateSelector (around line 51):
```tsx
import { CompactWeather } from '../CompactWeather';

// In JSX, after <DateSelector />:
<CompactWeather />
```

**Option B: Reuse WeatherDisplay with `compact` prop**

If time is short, add inline weather in Header using existing service.

---

### Task 4: Update RightPanel - Remove Elements & Add Announcements 📢

**File:** `src/components/layout/RightPanel.tsx`

**Changes Required:**

1. **Remove lines 9-14** (Location & Weather section):
```tsx
// DELETE THIS ENTIRE BLOCK:
<div className="p-10 space-y-8 border-b border-dashboard-bg bg-panel-white">
  <div className="flex flex-col">
    <h2 className="text-[1.3rem] font-heading font-black text-text-primary tracking-tighter leading-tight uppercase">Banbury Golf Course</h2>
  </div>
  <WeatherDisplay />
</div>
```

2. **Remove lines 16-19** (Mini Calendar section):
```tsx
// DELETE THIS ENTIRE BLOCK:
<div className="p-10 border-b border-dashboard-bg bg-panel-white">
  <MiniCalendar />
</div>
```

3. **Add Announcements section** (replace what was removed):
```tsx
{/* Announcements Section */}
<div className="p-10 space-y-6 border-b border-dashboard-bg bg-panel-white">
  <h4 className="text-[0.75rem] font-heading font-black text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5">
    Announcements
  </h4>
  <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
    <p className="text-text-secondary text-[0.75rem] font-sans">
      No announcements at this time
    </p>
  </div>
</div>
```

**Imports to remove:**
```tsx
// Remove these if not used elsewhere:
import WeatherDisplay from '../WeatherDisplay';
import MiniCalendar from '../MiniCalendar';
```

---

### Task 5: Implement Working Today Section 👥

**File:** `src/components/layout/RightPanel.tsx`

**Current Issue:** Shows placeholder "No staff assigned to today's rotation"

**Changes Required:**

1. **Add imports:**
```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Staff } from '../../types';
```

2. **Add state and data fetching:**
```tsx
export default function RightPanel() {
  const [workingStaff, setWorkingStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkingStaff();
  }, []);

  async function fetchWorkingStaff() {
    try {
      setLoading(true);

      // Get current day of week
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      // Result: 'monday', 'tuesday', etc.

      // Fetch all staff schedules with staff details
      const { data, error } = await supabase
        .from('staff_schedules')
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            role,
            rank
          )
        `);

      if (error) throw error;

      // Filter staff working today based on day column (e.g., monday_on)
      const working = data
        ?.filter(schedule => schedule[`${dayOfWeek}_on`] === true)
        .map(schedule => schedule.staff)
        .sort((a, b) => a.rank - b.rank) || [];

      setWorkingStaff(working);
    } catch (error) {
      console.error('Error fetching working staff:', error);
      setWorkingStaff([]);
    } finally {
      setLoading(false);
    }
  }
}
```

3. **Update UI section** (replace lines 20-36):
```tsx
<div className="p-10 flex flex-col bg-white">
  <h4 className="text-[0.75rem] font-heading font-black mb-10 text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5">
    Working Today
  </h4>

  {loading ? (
    <div className="text-center text-text-secondary text-sm">Loading...</div>
  ) : workingStaff.length > 0 ? (
    <div className="space-y-3 mb-8">
      {workingStaff.map(staff => (
        <div
          key={staff.id}
          className="flex items-center justify-between p-3 bg-panel-white border border-border-color shadow-sm"
        >
          <span className="text-sm font-sans font-medium text-text-primary">
            {staff.name}
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            {staff.role}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm mb-8">
      <p className="text-text-secondary text-[0.75rem] font-sans font-bold uppercase tracking-[0.1em]">
        No staff scheduled for today
      </p>
    </div>
  )}

  <button className="mt-auto bg-turf-green text-white px-6 py-5 font-heading font-black text-[0.85rem] uppercase tracking-[0.25em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
    Manage Schedule
  </button>
</div>
```

**Note:** "Add Staff" button changed to "Manage Schedule" (future functionality)

---

### Task 6: Gray Out Non-Working Staff in Whiteboard 🎨

**Files:** `src/components/whiteboard/StaffWhiteboardView.tsx`, `src/components/whiteboard/StaffRow.tsx`

**User Requirement:** "Staff not working should be grayed out... not able to assign a job"

**StaffWhiteboardView.tsx Changes:**

1. **Add working staff fetch:**
```tsx
const [workingStaffIds, setWorkingStaffIds] = useState<Set<number>>(new Set());

// Add to fetchStaticData or create separate effect:
useEffect(() => {
  fetchWorkingStaffIds();
}, []);

async function fetchWorkingStaffIds() {
  try {
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });

    const { data, error } = await supabase
      .from('staff_schedules')
      .select('staff_id, ${dayOfWeek}_on');

    if (error) throw error;

    const working = new Set(
      data?.filter(s => s[`${dayOfWeek}_on`]).map(s => s.staff_id) || []
    );

    setWorkingStaffIds(working);
  } catch (error) {
    console.error('Error fetching working staff:', error);
  }
}
```

2. **Pass to StaffRow component:**
```tsx
<StaffRow
  staff={staff}
  isWorking={workingStaffIds.has(staff.id)}
  // ... other props
/>
```

**StaffRow.tsx Changes:**

1. **Add prop:**
```tsx
interface StaffRowProps {
  // ... existing props
  isWorking: boolean;
}

export default function StaffRow({ staff, isWorking, ...otherProps }: StaffRowProps) {
```

2. **Apply conditional styling:**
```tsx
<div className={`staff-row-container ${!isWorking ? 'opacity-40 pointer-events-none' : ''}`}>
  {/* Existing row content */}
</div>
```

**Visual effect:** Non-working staff appear faded and cannot be clicked for job assignment.

---

### Task 7: Remove "Add a Job" from Whiteboard ➖

**File:** `src/components/whiteboard/StaffWhiteboardView.tsx`

**User Requirement:** "Remove 'add a job', that functionality is picked up in assign job"

**Search for and remove:**
- Any standalone "+ Add a Job" button in the whiteboard view
- Modal trigger for creating jobs outside of the assignment flow
- The "Add New Job" functionality exists in JobAssignmentCell dropdown, so this is just removing duplicate UI

**Likely location:** Check the main whiteboard layout for action buttons.

**Note:** JobAssignmentCell already has "+ Add New Job" option in the dropdown, so job creation is still accessible.

---

### Task 8: Create Calendar Page Placeholder 📅

**File:** `src/pages/CalendarPage.tsx` (CREATE NEW)

**Current Issue:** Route `/calendar` exists in navigation but has no component

**Create new file:**
```tsx
export default function CalendarPage() {
  return (
    <div className="p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary uppercase tracking-tight">
          Calendar
        </h1>
        <p className="text-sm text-text-secondary mt-2 font-sans">
          Comprehensive calendar view for staff schedules and tasks
        </p>
      </div>

      <div className="bg-white border border-border-color p-16 text-center shadow-sm">
        <div className="w-20 h-20 bg-turf-green/5 flex items-center justify-center mb-6 border border-turf-green/10 mx-auto">
          <i className="fa-solid fa-calendar-days text-4xl text-turf-green/30"></i>
        </div>
        <p className="text-text-secondary text-sm font-sans mb-2">
          Full calendar view coming soon
        </p>
        <p className="text-text-secondary text-xs font-sans">
          This will display staff schedules, job assignments, and project timelines in a monthly calendar format.
        </p>
      </div>
    </div>
  );
}
```

**Update routing in `src/App.tsx`:**
```tsx
// Add import:
import CalendarPage from './pages/CalendarPage';

// Add route (around line where other routes are):
<Route path="/calendar" element={<CalendarPage />} />
```

---

## Database Queries for Verification

Use MCP-as-code tools to verify data:

### Check staff schedules exist:
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT s.name, ss.monday_on, ss.tuesday_on, ss.wednesday_on FROM turfsheet.staff_schedules ss JOIN turfsheet.staff s ON ss.staff_id = s.id LIMIT 5"}'
```

### Check default schedule:
```bash
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT * FROM turfsheet.default_schedule LIMIT 1"}'
```

### Verify working staff for today:
```bash
# For Monday:
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT s.name, s.role FROM turfsheet.staff_schedules ss JOIN turfsheet.staff s ON ss.staff_id = s.id WHERE ss.monday_on = true ORDER BY s.rank"}'
```

---

## Testing Checklist

### Visual Verification
```bash
cd /home/cpbjr/WhitePineTech/Projects/TurfSheet/worktree/demo-prep-01/turfsheet-app
npm run dev
```

**Dashboard Page:**
- [ ] DateSelector shows today's date (static, no navigation)
- [ ] DateSelector shows workday hours from settings (not "05:30 AM-2:30 PM")
- [ ] Header has compact weather widget (temp + icon)
- [ ] RightPanel has "Announcements" card (not weather/location)
- [ ] RightPanel has "Working Today" section with actual staff names
- [ ] RightPanel does NOT have mini calendar
- [ ] RightPanel does NOT have "Banbury Golf Course" text
- [ ] Whiteboard staff rows: non-working staff are grayed out
- [ ] Whiteboard staff rows: cannot assign jobs to non-working staff
- [ ] Whiteboard does NOT have duplicate "Add a Job" button

**Settings Integration:**
- [ ] Go to Settings page
- [ ] Change workday hours (e.g., 6:00 AM - 3:00 PM)
- [ ] Return to dashboard
- [ ] Verify DateSelector immediately shows new times

**Navigation:**
- [ ] Click "Calendar" in sidebar
- [ ] Verify placeholder page loads (no error)
- [ ] Verify all other nav items still work

**Staff Duty Logic:**
- [ ] Check which day of week it is
- [ ] Verify "Working Today" shows only staff with that day enabled in schedule
- [ ] If no staff working, shows "No staff scheduled for today"

---

## Out of Scope (Future Work)

These items were mentioned but are NOT for demo day:

1. ❌ **Copy from yesterday automation** - User said "need to begin to think about automation"
2. ❌ **AI job assignment** - User said "ultimately AI is processing... super confirms"
3. ❌ **Remove staff functionality** - User mentioned "add a remove staff" but UI isn't designed for this yet
4. ❌ **Full calendar implementation** - Just need placeholder for now

---

## Execution Order

**Recommended sequence:**

1. Task 1 & 2 - DateSelector fixes (settings integration + simplification)
2. Task 3 - Compact weather in header
3. Task 4 - RightPanel cleanup (remove elements, add announcements)
4. Task 5 - Working Today implementation
5. Task 6 - Gray out non-working staff
6. Task 7 - Remove duplicate "Add a Job"
7. Task 8 - Calendar page placeholder

**Why this order:**
- DateSelector changes are isolated and testable immediately
- Header/RightPanel changes are visual and easy to verify
- Staff duty logic builds on database queries (test queries first)
- Calendar page is completely independent

---

## Success Criteria

Demo-ready when:
- ✅ No hard-coded values visible (workday times pull from settings)
- ✅ Clean, uncluttered UI (removed unnecessary elements)
- ✅ Working staff accurately displayed based on schedules
- ✅ No broken navigation links (calendar placeholder exists)
- ✅ Weather visible but compact
- ✅ Settings changes immediately reflected in UI

---

## Rollback Plan

If issues occur, changes are isolated to these files:
- DateSelector.tsx
- Header.tsx
- RightPanel.tsx
- StaffWhiteboardView.tsx
- StaffRow.tsx
- CalendarPage.tsx (new)

Git reset individual files if needed:
```bash
git checkout HEAD -- src/components/DateSelector.tsx
```

---

**Estimated Time:** 2-3 hours for all tasks
**Risk Level:** Low (mostly UI changes, existing infrastructure works)
**Dependencies:** None (all tasks independent except Task 6 depends on Task 5 pattern)
