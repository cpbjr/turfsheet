# TurfSheet Demo Preparation Plan

## Context

**Demo Tomorrow:** TurfSheet needs to be 90%+ production-ready for a demonstration. The application currently has three main areas requiring attention:

1. **Cleanup & Bug Fixes** — Site has minor bugs (duplicate home icons, typos, console errors) that need fixing before demo
2. **New Feature Pages** — Two critical pages need implementation: Equipment Management and Settings
3. **Active Task Completion** — Job Section Field usage needs proper filtering/validation

**Parallel Work Strategy:** Using git worktrees to enable simultaneous development:
- **Worktree 1** (`worktree/cleanup-debugging`): Code review findings + bug fixes
- **Worktree 2** (`worktree/add-new-pages`): Equipment page + Settings enhancements + Job section filtering

---

## Critical Findings from Code Review

### Code Health: 8.5/10 — Demo Ready with Minor Fixes

**HIGH Priority (Must Fix):**
1. **Duplicate Home Icons** — Sidebar has both Flag icon ("Home" → `/home`) and House icon ("Dashboard" → `/`). The `/home` route doesn't exist in routing. **Action**: Remove Flag icon entry from `Sidebar.tsx` line 12.

**MEDIUM Priority (Should Fix):**
2. **Typo**: "Priotity" → "Priority" in `JobsPage.tsx` line 98
3. **Unused Prop**: `onCreateJob` in `DashboardPage.tsx` (lines 4-5) — either remove or implement

**LOW Priority (Nice to Have):**
4. **Type Safety**: 9 files use `any` types — should be replaced with proper interfaces
5. **Hardcoded Dates**: `ScheduleForm.tsx` has hardcoded Feb 2026 dates instead of dynamic week calculation

---

## Equipment Page Requirements

### User Requirements
- **CRUD Interface**: Full create/edit/delete matching Jobs/Staff page patterns
- **Categories**: Mowers, Carts, Tools (expandable to other types)
- **Data Fields** (Basic MVP):
  - Name (e.g., "Toro Flex 21 #1")
  - Type/Category dropdown
  - Model/manufacturer
  - Description/notes
  - Status (Active/Maintenance/Retired)
- **Future Enhancements** (not in MVP):
  - Maintenance tracking (hour meter, service dates)
  - Assignment to jobs (equipment filtering: "Mowing Rough" shows only rough mowers, not greens mowers)
  - Staff assignment tracking

### Visual Design
- **Match Jobs Page layout**: Card-based grid, filters, modal for create/edit
- **Equipment Display** in sidebar already has "Inventory" icon (Package) — use `/equipment` route
- **Status Badges**: Active=green, Maintenance=orange, Retired=grey (following existing badge patterns)

### Implementation Pattern
**Reference Files:**
- Layout: `src/pages/JobsPage.tsx` (lines 62-155)
- CRUD: `src/pages/JobsPage.tsx` (lines 15-60)
- Components: `src/components/jobs/JobCard.tsx`, `src/components/jobs/JobForm.tsx`

---

## Settings Page Enhancements

### Current State
- **Already Exists**: `src/pages/Settings.tsx` with localStorage-backed context
- **Has**: Work hours configuration, Dashboard view selector

### Required Additions
- **Organization Profile**:
  - Course name
  - Location
  - Contact info
  - Timezone
- **User Preferences** (role-based):
  - Super/Assistant can change global settings
  - All users can set notification preferences
  - Alert configuration

### Implementation
Extend existing Settings page with new sections. Use `SettingsContext` pattern already established.

---

## Job Section Field Fix

### The Problem
The `section` field ('First Jobs' vs 'Second Jobs') in `jobs` table exists but is not used functionally:
- ✅ UI toggle works and saves to database
- ❌ NO filtering: All jobs appear in dropdowns regardless of section
- ❌ NO visual indication: Jobs Library doesn't show which section
- ❌ NO validation: System allows mixing first/second job templates

### Required Fixes (in priority order)

#### Fix 1: Update TypeScript Types (Breaking Change)
**File**: `turfsheet-app/src/types/index.ts` (line 11)

**Current**:
```typescript
export interface Job {
  // ...
  section?: string;  // Optional, no type restriction
}
```

**Change to**:
```typescript
export interface Job {
  // ...
  section: 'First Jobs' | 'Second Jobs';  // Required with type union
}
```

**Impact**: TypeScript will enforce section presence throughout codebase. This may cause compilation errors in files that don't handle section, which will need to be fixed.

#### Fix 2: Filter Job Dropdowns
**File**: `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` (lines 56-60)

**Current**:
```typescript
const { data: jobsList, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .order('title', { ascending: true });
```

**Change to**:
```typescript
const { data: jobsList, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('section', 'First Jobs')  // ← ADD THIS
    .order('title', { ascending: true });
```

**Result**: Only "First Jobs" appear in Staff Whiteboard primary assignment dropdown.

#### Fix 3: Add Section Badges to Jobs Library
**Files**: `turfsheet-app/src/components/jobs/JobCard.tsx` + `turfsheet-app/src/pages/JobsPage.tsx`

**JobCard.tsx changes**:
1. Add `section?: 'First Jobs' | 'Second Jobs'` to `JobCardProps` interface
2. Add parameter to component function
3. Render badge in card content area:
```typescript
{section && (
    <div className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
        section === 'Second Jobs'
            ? 'bg-accent-orange text-white'
            : 'bg-turf-green text-white'
    }`}>
        {section === 'First Jobs' ? 'FIRST' : 'SECOND'}
    </div>
)}
```

**JobsPage.tsx changes** (line 130-138):
```typescript
<JobCard
    key={job.id}
    // ... existing props
    section={job.section}  // ← ADD THIS
/>
```

#### Fix 4: Add Validation
**File**: `turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx` (around line 88)

Add validation in `handleSelectJob`:
```typescript
const handleSelectJob = async (jobId: string) => {
    const selectedJob = availableJobs.find(j => j.id === jobId);

    // Validate section
    if (selectedJob?.section === 'Second Jobs') {
        alert('Second Job templates cannot be assigned as primary jobs.');
        return;
    }

    // ... rest of existing code
}
```

---

## Database Changes

### New Equipment Table
**Migration**: `supabase/migrations/20260216_01_create_equipment.sql`

```sql
CREATE TABLE IF NOT EXISTS public.equipment (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Mowers', 'Carts', 'Tools', 'Other')),
  model TEXT,
  manufacturer TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Retired')),
  purchase_date DATE,
  purchase_cost DECIMAL(10, 2),
  maintenance_notes TEXT,
  last_serviced_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies (follow pattern from jobs/staff tables)
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.equipment
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.equipment
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.equipment
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.equipment
    FOR DELETE USING (true);
```

### Settings Storage
- **No database changes needed** — Settings page uses localStorage via existing `SettingsContext`
- Optional future enhancement: Sync to Supabase `user_preferences` table for multi-device support

---

## Implementation Steps

### Stream 1: Cleanup/Debugging (`worktree/cleanup-debugging`)

**Phase 1: Auto-Fix Safe Issues (5 minutes)**
1. Remove duplicate home icon from `Sidebar.tsx` line 12
2. Fix typo in `JobsPage.tsx` line 98: "Priotity" → "Priority"
3. Remove unused `onCreateJob` prop from `DashboardPage.tsx`

**Phase 2: Test All Pages (10 minutes)**
1. Navigate to each page and verify no console errors
2. Test CRUD operations on Jobs/Staff/Projects pages
3. Verify Whiteboard assignment workflows
4. Document any additional issues found

**Phase 3: Job Section Filtering (30 minutes)**
1. Update TypeScript types in `src/types/index.ts`
2. Fix compilation errors caused by type change
3. Add filter to StaffWhiteboardView query
4. Add validation to JobAssignmentCell
5. Test: Verify only First Jobs appear in dropdown

### Stream 2: New Pages (`worktree/add-new-pages`)

**Phase 1: Equipment Page (60 minutes)**

1. **Create type definition** (`src/types/index.ts`):
```typescript
export interface Equipment {
  id: string;
  name: string;
  category: 'Mowers' | 'Carts' | 'Tools' | 'Other';
  model?: string;
  manufacturer?: string;
  description?: string;
  status: 'Active' | 'Maintenance' | 'Retired';
  purchase_date?: string;
  purchase_cost?: number;
  maintenance_notes?: string;
  last_serviced_date?: string;
  created_at: string;
  updated_at: string;
}
```

2. **Create database migration**: `supabase/migrations/20260216_01_create_equipment.sql` (see above)

3. **Create components**:
   - `src/components/equipment/EquipmentCard.tsx` — Display in grid (copy JobCard pattern)
   - `src/components/equipment/EquipmentForm.tsx` — Create/edit modal (copy JobForm pattern)
   - `src/pages/EquipmentPage.tsx` — Main page (copy JobsPage pattern)

4. **Add routing**:
   - `src/App.tsx`: Add `<Route path="/equipment" element={<EquipmentPage />} />`
   - `src/components/layout/Sidebar.tsx`: Update Inventory icon to link to `/equipment`

5. **Test**:
   - Create new equipment
   - Edit existing equipment
   - Delete equipment
   - Filter by category
   - Status badges display correctly

**Phase 2: Job Section Badges (15 minutes)**
1. Update `JobCard.tsx` to accept and display section prop
2. Update `JobsPage.tsx` to pass section to cards
3. Test: Verify FIRST/SECOND badges appear on job cards

**Phase 3: Settings Page Enhancement (30 minutes)**
1. Add Organization Profile section:
   - Course name input
   - Location input
   - Contact info textarea
   - Timezone dropdown
2. Add User Preferences section:
   - Notification toggle switches
   - Alert frequency dropdown
   - Role-based permission checks (super/assistant vs regular users)
3. Extend `AppSettings` type in `src/types/settings.ts`
4. Test: Verify localStorage persistence

---

## Verification Steps

### Pre-Deployment Checklist

**Visual Testing:**
- [ ] No duplicate icons in sidebar
- [ ] All pages load without console errors
- [ ] Job cards show FIRST/SECOND badges
- [ ] Equipment page matches Jobs page styling
- [ ] Status badges use correct colors (Active=green, Maintenance=orange, Retired=grey)

**Functional Testing:**
- [ ] Staff Whiteboard dropdown shows only First Jobs
- [ ] Cannot assign Second Job to primary slot (validation works)
- [ ] Equipment CRUD operations work correctly
- [ ] Settings persist across page reloads (localStorage)
- [ ] Category filtering works on Equipment page

**Database Testing:**
- [ ] Run migration: `npx supabase db push`
- [ ] Verify equipment table exists with correct schema
- [ ] Test RLS policies allow read/write operations
- [ ] Verify no NULL section values in existing jobs (may need data migration)

**Cross-Browser Testing:**
- [ ] Test in Chrome DevTools console for errors
- [ ] Verify responsive layout on mobile viewport

---

## Critical Files Reference

### Files to Modify (Stream 1)
- `turfsheet-app/src/components/layout/Sidebar.tsx` (line 12)
- `turfsheet-app/src/pages/JobsPage.tsx` (line 98)
- `turfsheet-app/src/pages/DashboardPage.tsx` (lines 4-5)
- `turfsheet-app/src/types/index.ts` (line 11)
- `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` (lines 56-60)
- `turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx` (around line 88)
- `turfsheet-app/src/components/jobs/JobCard.tsx` (add section badge)
- `turfsheet-app/src/pages/JobsPage.tsx` (pass section prop)

### Files to Create (Stream 2)
- `supabase/migrations/20260216_01_create_equipment.sql`
- `turfsheet-app/src/components/equipment/EquipmentCard.tsx`
- `turfsheet-app/src/components/equipment/EquipmentForm.tsx`
- `turfsheet-app/src/pages/EquipmentPage.tsx`

### Files to Reference (Patterns)
- **Layout Pattern**: `turfsheet-app/src/pages/JobsPage.tsx` (lines 62-155)
- **CRUD Pattern**: `turfsheet-app/src/pages/JobsPage.tsx` (lines 15-60)
- **Form Pattern**: `turfsheet-app/src/components/jobs/JobForm.tsx`
- **Card Pattern**: `turfsheet-app/src/components/jobs/JobCard.tsx`
- **Settings Context**: `turfsheet-app/src/contexts/SettingsContext.tsx`

---

## Estimated Timeline

| Task | Worktree | Duration |
|------|----------|----------|
| Auto-fix bugs | cleanup-debugging | 5 min |
| Job section filtering | cleanup-debugging | 30 min |
| Page testing | cleanup-debugging | 10 min |
| Equipment page | add-new-pages | 60 min |
| Job section badges | add-new-pages | 15 min |
| Settings enhancements | add-new-pages | 30 min |
| **Total** | | **~2.5 hours** |

---

## Risk Mitigation

**TypeScript Breaking Change Risk:**
- Making `section` required will cause compilation errors in code that doesn't handle it
- **Mitigation**: Fix type errors as they appear, test thoroughly before merging

**Database Migration Risk:**
- Existing jobs may have NULL section values
- **Mitigation**: Check database before migration, add UPDATE statement if needed:
  ```sql
  UPDATE public.jobs SET section = 'First Jobs' WHERE section IS NULL;
  ALTER TABLE public.jobs ALTER COLUMN section SET NOT NULL;
  ```

**Merge Conflict Risk:**
- Two parallel worktrees may modify overlapping files
- **Mitigation**: Stream 1 focuses on existing code, Stream 2 creates new files (minimal overlap)

---

## Post-Demo Priorities

**Low-Priority Issues (defer to next sprint):**
- Replace `any` types with proper interfaces (9 locations)
- Fix hardcoded dates in ScheduleForm
- Implement missing routes (Calendar, Analytics, Maps, etc.) or hide from sidebar
- Add equipment-to-job filtering (Phase 2 feature)
- Add scrolling to ProjectDetailModal
- Refactor complex components (StaffPage, StaffWhiteboardView)

**Future Equipment Features:**
- Maintenance tracking with hour meters
- Equipment assignment to jobs (smart filtering)
- Staff cart assignment logic (Jose's cart follows him unless he's mowing)
