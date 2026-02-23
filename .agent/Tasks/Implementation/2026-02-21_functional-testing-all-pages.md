# Functional Testing & Fixes: All 4 Pages

**Date:** 2026-02-21
**Goal:** Verify all pages work for season start. Fix obvious issues autonomously. Flag significant issues for user input.
**Scope:** Dashboard, Settings, Equipment, Projects - basic functionality only, no edge cases.

---

## Required Skills (Superpowers)

- **`superpowers:systematic-debugging`** - Use when chrome:errors or console inspection reveals unexpected errors. Follow the 4-phase framework (root cause → pattern analysis → hypothesis → fix) rather than guessing.
- **`superpowers:verification-before-completion`** - Use before claiming any phase is complete. Run the verification commands and confirm output before marking done.
- **`superpowers:executing-plans`** - This IS an implementation plan. Use this skill to execute in batches with review checkpoints between phases.

---

## Context

TurfSheet needs to be ready for the golf season. Four pages need functional verification: Dashboard/Whiteboard, Settings, Equipment, and Projects. The app is React + TypeScript + Vite + Supabase (`turfsheet` schema) + Tailwind CSS. Dev server runs on port 5179.

---

## Phase 0: Environment Setup

### Task 0.1: Start Dev Server
```bash
cd /home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app
npm run dev -- --port 5179
```
- Watch for TypeScript compilation errors or missing module errors
- If build fails, fix those FIRST before testing pages

### Task 0.2: Verify Database Connectivity
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT table_name FROM information_schema.tables WHERE table_schema = '\''turfsheet'\''"}'
```
**Expected tables:** staff, jobs, daily_assignments, second_job_board, daily_board, staff_schedules, default_schedule, projects, project_sections, equipment, staff_skills

### Task 0.3: Check Initial Page Load
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179"}'
npx tsx run.ts chrome:console '{"url":"http://localhost:5179"}'
```

---

## Phase 1: Dashboard/Whiteboard Page

**URL:** `http://localhost:5179/` (or `/whiteboard`)
**Main file:** `src/components/whiteboard/StaffWhiteboardView.tsx`
**Wrapper:** `src/pages/DashboardPage.tsx`

### Known Fix: `fetchWorkingStaffIds` Select Query (CRITICAL)

**File:** `src/components/whiteboard/StaffWhiteboardView.tsx`
**Issue:** Around line 83, `.select('staff_id')` only fetches `staff_id` but the code then tries to access `schedule[dayColumn]` (e.g., `monday_on`) which was never fetched.
**Fix:** Change `.select('staff_id')` to `.select('*')` so day columns are included in the response.

### Tests to Run

1. **Page loads** - Check chrome:errors at `http://localhost:5179/`
2. **Staff list appears** - Staff should be listed with names, ordered by rank
3. **Date navigation** - Previous/Today/Next buttons should change the date and reload assignments
4. **Assign a primary job** - Click "Assign Job" on a staff row, select a job. Verify it saves (check console for Supabase errors)
5. **Second Jobs Board** - Right panel should show second jobs for the date. Add a new one, verify it appears
6. **Working staff filter** - After the select fix, verify non-working staff are greyed out based on their schedule

### Verification
```bash
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/"}'
```

---

## Phase 2: Settings Page

**URL:** `http://localhost:5179/settings`
**Main file:** `src/pages/Settings.tsx`
**Context:** `src/contexts/SettingsContext.tsx`

### No Known Fixes Required

Settings page uses localStorage only (no Supabase). Should work cleanly.

### Tests to Run

1. **Page loads** - Check chrome:errors at `/settings`
2. **Organization fields** - Change org name, course name. Verify "Saved!" confirmation appears
3. **Work hours** - Change start/end time. Verify display updates
4. **Toggle switches** - Toggle each preference checkbox
5. **Dashboard view toggle** - Switch between Whiteboard and Classic radio buttons
6. **Persistence** - After changing settings, navigate away and back. Verify settings persist
7. **Reset to Defaults** - Click reset, confirm dialog, verify all fields return to defaults

### Verification
```bash
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/settings"}'
```

---

## Phase 3: Equipment Page

**URL:** `http://localhost:5179/equipment`
**Main file:** `src/pages/EquipmentPage.tsx`
**Components:** `src/components/equipment/EquipmentCard.tsx`, `EquipmentForm.tsx`, `EquipmentBatchUpload.tsx`

### No Blocking Fixes Required

Minor issues (list view toggle not wired, `any` type) are non-blocking for season start.

### Tests to Run

1. **Page loads** - Check chrome:errors at `/equipment`. Verify equipment grid renders
2. **Search** - Type in search box, verify filtering by name/manufacturer/model
3. **Category filter** - Select each category, verify grid updates
4. **Status filter** - Select each status, verify grid updates
5. **Add equipment** - Click "Add Equipment", fill form (name, category required), submit. Verify new card appears
6. **View detail** - Click an equipment card, verify detail modal opens with correct data
7. **Delete equipment** - In detail modal, click Delete, confirm browser dialog, verify removal
8. **Empty state** - If no equipment, verify the empty state message displays correctly

### Verification
```bash
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/equipment"}'
```

---

## Phase 4: Projects Page

**URL:** `http://localhost:5179/projects`
**Main file:** `src/pages/ProjectsPage.tsx`
**Components:** `src/components/projects/ProjectSection.tsx`, `ProjectListItem.tsx`, `ProjectDetailModal.tsx`

### Known Fix: Delete Confirmation (LOW priority)

**File:** `src/components/projects/ProjectDetailModal.tsx`
**Issue:** Around line 123, `handleDelete` calls `onDelete` directly without confirmation.
**Fix:** Add `if (!window.confirm('Are you sure you want to delete this project?')) return;` at the start of `handleDelete`.

### Tests to Run

1. **Page loads** - Check chrome:errors at `/projects`. Verify sections render
2. **Sections display** - Default sections ("Projects", "Irrigation") should appear
3. **Add section** - Click "Add Section", enter name, submit. Verify new section appears
4. **Add project** - Click "+ Add item..." in a section, type name, press Enter. Verify project appears
5. **Search** - Type in search box, verify filtering across title/description/notes
6. **Status filter** - Click All, Active, On Hold, Done buttons. Verify filtering
7. **Open detail modal** - Click a project, verify ProjectDetailModal opens with all fields
8. **Edit project** - Change title, description, status, priority in modal. Click Save. Verify changes persist
9. **Delete project** - After fix: click Delete, confirm dialog, verify removal

### Verification
```bash
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/projects"}'
```

---

## Phase 5: Cross-Page Navigation

### Tests to Run

1. **Sidebar links** - Click Dashboard, Equipment, Projects, Settings icons in sidebar. Verify each page loads
2. **Active state** - Verify the correct sidebar icon highlights on each page
3. **No console errors** - During navigation, check for route-change errors

---

## Phase 6: Final Verification

Run chrome:errors on all 4 pages to confirm zero errors:

```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/"}'
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/settings"}'
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/equipment"}'
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/projects"}'
```

---

## Summary of Code Changes

| # | Page | File | Change | Severity |
|---|------|------|--------|----------|
| 1 | Dashboard | `src/components/whiteboard/StaffWhiteboardView.tsx` ~line 83 | Change `.select('staff_id')` to `.select('*')` in `fetchWorkingStaffIds` | CRITICAL |
| 2 | Projects | `src/components/projects/ProjectDetailModal.tsx` ~line 123 | Add `window.confirm()` before delete | LOW |

**Autonomous fixes:** Apply both fixes above without asking user.
**Ask user:** Only for significant issues discovered during testing (e.g., missing database tables, broken Supabase queries, major UI rendering failures).

---

## Critical Files Reference

- `src/pages/DashboardPage.tsx` - Dashboard wrapper
- `src/components/whiteboard/StaffWhiteboardView.tsx` - Main whiteboard logic (FIX HERE)
- `src/pages/Settings.tsx` - Settings page
- `src/contexts/SettingsContext.tsx` - Settings state management
- `src/pages/EquipmentPage.tsx` - Equipment page
- `src/components/equipment/EquipmentCard.tsx` - Equipment card component
- `src/components/equipment/EquipmentForm.tsx` - Equipment add form
- `src/pages/ProjectsPage.tsx` - Projects page
- `src/components/projects/ProjectDetailModal.tsx` - Project detail modal (FIX HERE)
- `src/components/projects/ProjectSection.tsx` - Project section component
- `src/components/projects/ProjectListItem.tsx` - Project list item
- `src/lib/supabase.ts` - Supabase client (uses `turfsheet` schema)
- `src/types/index.ts` - All TypeScript interfaces

---

## Verification Tool Commands

```bash
# Chrome DevTools (preferred for error checking)
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts chrome:errors '{"url":"http://localhost:5179"}'
npx tsx run.ts chrome:console '{"url":"http://localhost:5179"}'

# Database queries
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT COUNT(*) FROM turfsheet.staff"}'
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT COUNT(*) FROM turfsheet.equipment"}'
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT COUNT(*) FROM turfsheet.projects"}'
```
