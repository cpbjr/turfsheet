# Implementation Plan: Staff Whiteboard Dashboard

## Overview

Transform the TurfSheet dashboard from a job portfolio view to a staff-centric "whiteboard" view that displays daily job assignments in a table format. The whiteboard shows each staff member with their Job 1 (first task), Job 2 (second task), and Job 2 priority.

## User Requirements Summary

- **Staff-centric layout**: Staff names on left (constant list from database)
- **Job assignments**: Job 1 (completed first) and Job 2 (completed after Job 1)
- **Priority system**: Applies to Job 2 only (any letter A-Z, single character)
- **Assignment workflow**: Super enters assignments in morning, adds priority later
- **Simple interactions**: Dropdown menus to assign jobs, easy add/delete
- **Job creation**: Can add new jobs from dropdown menu or Jobs page
- **Default view**: Make whiteboard the default (replace portfolio view for now)

## Critical Files to Modify

1. **`supabase/migrations/20260205_01_create_daily_assignments.sql`** - New database table
2. **`turfsheet-app/src/types/index.ts`** - TypeScript types for assignments
3. **`turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx`** - Main whiteboard component (NEW)
4. **`turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx`** - Job dropdown cell (NEW)
5. **`turfsheet-app/src/components/whiteboard/PriorityCell.tsx`** - Priority input cell (NEW)
6. **`turfsheet-app/src/pages/DashboardPage.tsx`** - Replace portfolio with whiteboard

---

## Implementation Steps

### Step 1: Create Database Schema

**File**: `supabase/migrations/20260205_01_create_daily_assignments.sql`

Create migration for `daily_assignments` table with:
- `staff_id` → references `turfsheet.staff(id)` with CASCADE delete
- `job_id` → references `turfsheet.jobs(id)` with RESTRICT delete
- `assignment_date` → DATE (default CURRENT_DATE)
- `job_order` → INTEGER (1 or 2 only, enforced with CHECK)
- `priority` → TEXT (single letter A-Z, nullable, CHECK constraint for single char)
- `notes` → TEXT (optional)
- **UNIQUE constraint**: `(staff_id, assignment_date, job_order)` - prevents duplicate assignments
- Indexes on `assignment_date`, `staff_id`, and composite `(staff_id, assignment_date)`

**Apply migration**:
```bash
cd /home/cpbjr/WhitePineTech/Projects/TurfSheet
npx supabase db push
```

---

### Step 2: Add TypeScript Types

**File**: `turfsheet-app/src/types/index.ts`

Add after existing Staff and Job interfaces:

```typescript
// Daily Assignment types
export type JobOrder = 1 | 2;
export type Priority = string; // Single letter A-Z (validated in DB)

export interface DailyAssignment {
  id: string;
  staff_id: string;
  job_id: string;
  assignment_date: string; // ISO date (YYYY-MM-DD)
  job_order: JobOrder;
  priority?: Priority; // Single uppercase letter A-Z
  notes?: string;
  created_at: string;
  updated_at: string;
}

// For display with joined job details
export interface DailyAssignmentWithDetails extends DailyAssignment {
  job: Job;
}

// Whiteboard row (one per staff member)
export interface WhiteboardRow {
  staff: Staff;
  job1?: DailyAssignmentWithDetails;
  job2?: DailyAssignmentWithDetails;
}
```

---

### Step 3: Create JobAssignmentCell Component

**File**: `turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx`

**Purpose**: Dropdown to select/assign jobs, with "Add New Job" option and delete button

**Props**:
- `staffId: string`
- `date: string` (ISO format)
- `jobOrder: JobOrder` (1 or 2)
- `currentAssignment?: DailyAssignmentWithDetails`
- `availableJobs: Job[]`
- `onUpdate: () => void` (callback to refresh data)
- `onCreateJob: () => void` (callback to open job creation modal)

**UI States**:
1. **Empty**: Dashed border button with "+" icon and "Assign Job" text
2. **Assigned**: White box with job title and X delete button (hover to show)
3. **Editing**: Dropdown select showing:
   - List of available jobs (alphabetically sorted)
   - Separator line
   - "➕ Add New Job" option at bottom (triggers job creation modal)

**CRUD Operations** (use Supabase):
- **Create/Update**: Use `upsert` with `onConflict: 'staff_id,assignment_date,job_order'`
- **Delete**: `delete().eq('id', assignmentId)`

**Styling** (match StaffPage patterns):
- Empty: `border-2 border-dashed border-border-color hover:border-turf-green`
- Assigned: `bg-panel-white border border-border-color px-4 py-2`
- Dropdown: `bg-panel-white border focus:border-turf-green`

---

### Step 4: Create PriorityCell Component

**File**: `turfsheet-app/src/components/whiteboard/PriorityCell.tsx`

**Purpose**: Input field to enter single letter priority for Job 2 (A-Z)

**Props**:
- `assignment?: DailyAssignmentWithDetails` (Job 2 assignment)
- `onUpdate: () => void`

**Logic**:
- If no Job 2 assignment exists, show disabled/grayed state
- If Job 2 exists, show input field or priority badge (click to edit)
- Input accepts single letter (A-Z), auto-uppercase, max 1 character

**Priority Badge/Input Styles**:
- Badge: `bg-turf-green text-white px-3 py-1 rounded-full text-xs font-heading font-black uppercase`
- Input: `bg-panel-white border border-border-color w-12 text-center uppercase focus:border-turf-green`
- Validation: Must be single letter A-Z only

**Update Operation**:
```typescript
await supabase
  .from('daily_assignments')
  .update({ priority })
  .eq('id', assignmentId);
```

---

### Step 5: Create StaffWhiteboardView Component

**File**: `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx`

**Purpose**: Main whiteboard table with data fetching and layout

**Props**:
- `selectedDate: Date`
- `onDateChange: (date: Date) => void`

**Layout Structure** (follow StaffPage.tsx pattern at lines 98-106):

```tsx
{/* Header row - turf-green background */}
<div className="grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-3 bg-turf-green border-x border-t border-turf-green/20 shadow-sm">
  <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
    Staff Name
  </span>
  <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
    Job 1
  </span>
  <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
    Priority
  </span>
  <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
    Job 2
  </span>
</div>

{/* Body rows - alternating backgrounds */}
<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
  {rows.map((row, idx) => (
    <div
      key={row.staff.id}
      className={`grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-4 border-x border-b border-border-color ${
        idx % 2 === 0 ? 'bg-panel-white' : 'bg-dashboard-bg/30'
      }`}
    >
      <div className="font-heading font-bold text-text-primary">
        {row.staff.name}
      </div>
      <JobAssignmentCell /* Job 1 */ />
      <PriorityCell /* for Job 2 */ />
      <JobAssignmentCell /* Job 2 */ />
    </div>
  ))}
</div>
```

**Data Fetching** (3 queries):

```typescript
useEffect(() => {
  const fetchData = async () => {
    const dateString = selectedDate.toISOString().split('T')[0];

    // 1. Fetch all staff (reuse pattern from StaffPage.tsx lines 21-24)
    const { data: staffList } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. Fetch all jobs for dropdowns
    const { data: jobsList } = await supabase
      .from('jobs')
      .select('*')
      .order('title', { ascending: true });

    // 3. Fetch assignments for date with job details (JOIN)
    const { data: assignments } = await supabase
      .from('daily_assignments')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('assignment_date', dateString);

    // 4. Transform to WhiteboardRow[]
    const rows = staffList.map(staff => {
      const job1 = assignments?.find(
        a => a.staff_id === staff.id && a.job_order === 1
      );
      const job2 = assignments?.find(
        a => a.staff_id === staff.id && a.job_order === 2
      );
      return { staff, job1, job2 };
    });

    setWhiteboardRows(rows);
    setAvailableJobs(jobsList);
  };

  fetchData();
}, [selectedDate]);
```

**Add Date Navigator** (top of component):
- Previous/Today/Next buttons
- Format: "Monday, Feb 5, 2026"
- Simple button styling matching turf-green theme

---

### Step 5.5: Add Job Creation from Whiteboard

**Integration Point**: When user selects "Add New Job" from dropdown

**Approach**: Reuse existing job creation pattern from Jobs page

**Implementation**:
1. Add state for job creation modal in `StaffWhiteboardView`
2. Pass `onCreateJob` callback to `JobAssignmentCell` components
3. When "Add New Job" selected from dropdown:
   - Open modal with job creation form
   - On save, create job in database
   - Refresh jobs list
   - Auto-select newly created job for the cell

**Modal Form Fields** (match Jobs page pattern):
- Title (required)
- Description (optional)
- Crew needed (number, default 1)
- Section (auto-set based on job_order: "First Jobs" or "Second Jobs")

**Note**: Jobs created from whiteboard will also appear in Jobs page library.

---

### Step 6: Replace DashboardPage Content

**File**: `turfsheet-app/src/pages/DashboardPage.tsx`

**Changes**:

1. **Import** new component:
```typescript
import { useState } from 'react';
import StaffWhiteboardView from '../components/whiteboard/StaffWhiteboardView';
```

2. **Add state** for selected date:
```typescript
const [selectedDate, setSelectedDate] = useState(new Date());
```

3. **Replace entire JSX** (comment out old code):
```typescript
return (
  <div className="flex flex-col h-full">
    <StaffWhiteboardView
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  </div>
);

/* COMMENTED OUT - Original Portfolio View
  <div className="flex flex-col space-y-24">
    ... (all existing code from lines 20-73) ...
  </div>
*/
```

**Preserve** old imports in comments for easy reactivation later.

---

## Verification Steps

After implementation, test:

### Database Tests (MCP-as-code)
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers

# Check schema created
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '\''turfsheet'\'' AND table_name = '\''daily_assignments'\''"}'

# Insert test assignment
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"INSERT INTO turfsheet.daily_assignments (staff_id, job_id, assignment_date, job_order) VALUES (1, 1, CURRENT_DATE, 1) RETURNING *"}'

# Verify unique constraint (should fail)
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"INSERT INTO turfsheet.daily_assignments (staff_id, job_id, assignment_date, job_order) VALUES (1, 1, CURRENT_DATE, 1)"}'
```

### Frontend Tests (manual)
1. **View whiteboard**: Should show all staff in rows
2. **Assign Job 1**: Click empty cell, select job from dropdown, verify save
3. **Assign Job 2**: Same as Job 1 for second column
4. **Create job from dropdown**: Select "Add New Job", fill form, verify created and assigned
5. **Set priority**: Assign Job 2, then enter letter in priority column
6. **Delete assignment**: Hover over assigned job, click X, verify removed
7. **Date navigation**: Click Previous/Next, verify assignments change
8. **Empty state**: Select date with no assignments, verify empty cells

### Visual Verification (CRITICAL - Follow Style Guide EXACTLY)
- **Header**: Turf-green background (`bg-turf-green`), white text, uppercase labels
- **Layout**: Border-based separation (NO heavy shadows)
- **Row backgrounds**: Alternating `bg-panel-white` and `bg-dashboard-bg/30`
- **Typography**:
  - Labels: `font-heading font-black uppercase tracking-[0.2em]`
  - Data: `font-sans text-text-primary`
- **Borders**: Use `border-border-color` (#E0E4E8)
- **Focus states**: `focus:border-turf-green` on all inputs/selects
- **Hover effects**: Subtle lift with turf-green accent (NOT dramatic transforms)
- **Priority input**: Single character input, turf-green badge when filled
- **Spacing**: Match StaffPage grid (`grid-cols-[2fr_3fr_1fr_3fr]`)
- **Scrollbar**: Use `custom-scrollbar` class for overflow areas

---

## Design Consistency Checklist (MANDATORY)

**CRITICAL**: Follow `.agent/System/style-guide.md` AND StaffPage.tsx patterns EXACTLY (lines 98-156)

**Header Pattern** (Line 98-106):
```tsx
className="grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-3 bg-turf-green border-x border-t border-turf-green/20 shadow-sm"
```
- Background: `bg-turf-green`
- Text: `text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]`

**Body Row Pattern** (Line 122-132):
```tsx
className={`grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-4 border-x border-b border-border-color ${
  idx % 2 === 0 ? 'bg-panel-white' : 'bg-dashboard-bg/30'
}`}
```

**Input Styling** (Line 50):
```tsx
className="bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans"
```

**Button Styling** (Line 64-66):
```tsx
className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]"
```

**Colors** (from `.agent/System/style-guide.md`):
- `turf-green`: #73A657 (primary brand)
- `turf-green-dark`: #5D8A46 (hover states)
- `turf-green-light`: #E8F0E4 (background tints)
- `panel-white`: #FFFFFF (card backgrounds)
- `dashboard-bg`: #F4F6F8 (page background)
- `text-primary`: #2C3E50 (headings, data)
- `text-secondary`: #7F8C8D (labels)
- `text-muted`: #BDC3C7 (placeholders)
- `border-color`: #E0E4E8 (all borders)
- `accent-orange`: #F39C12 (warnings, highlights)

**Typography** (from style guide):
- **Headings**: Outfit (font-heading), Bold (700), uppercase
- **Labels**: Outfit (font-heading), font-black, uppercase, tracking-[0.2em]
- **Body/Data**: Inter (font-sans), Regular (400), sentence case

**Spacing** (from style guide):
- Border radius: 4px (standard)
- Padding: 12px for card bodies
- Shadows: Use shadow-sm (0 1px 3px rgba(0,0,0,0.12))

---

## Future Enhancements (Not in Scope)

These features are mentioned for context but should NOT be implemented now:

- View toggle between whiteboard and portfolio
- Drag-and-drop job assignment
- Real-time collaboration (Supabase subscriptions)
- Staff "grab" workflow (self-assignment)
- Skills-based filtering
- Week view (7 days at once)
- Print/export functionality

**Current focus**: Simple dropdown-based assignment with add/delete only.

---

## Notes

- **Style Guide**: Follow `.agent/System/style-guide.md` for ALL styling decisions
- **Database**: Use Supabase CLI for migrations (`npx supabase db push`)
- **Queries**: Use MCP-as-code for testing (`npx tsx run.ts supabase:sql`)
- **Styling**: Match StaffPage.tsx patterns EXACTLY (turf-green headers, border-based)
- **Priority**: Any single letter A-Z (not limited to E, C, B, X)
- **Priority**: Only applies to Job 2 (nullable field, disabled if no Job 2)
- **Job creation**: Available from dropdown AND Jobs page
- **Date format**: Use ISO strings (YYYY-MM-DD) for all date operations
- **Error handling**: Show toast notifications, log errors to console
- **Reference files**:
  - `.agent/System/style-guide.md` - Design tokens and component standards
  - `turfsheet-app/src/pages/StaffPage.tsx` - Table layout patterns
  - `turfsheet-app/tailwind.config.js` - Tailwind configuration
