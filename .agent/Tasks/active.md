## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from Implementation/ to completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-02-14 UTC


## Active Tasks

### Fix Job Template Section Field Usage

**Issue**: The `section` field ('First Jobs' vs 'Second Jobs') in the `jobs` table is stored but never used functionally.

**Current Behavior**:
- ✅ UI toggle works and saves to database
- ❌ No filtering: All jobs appear in all dropdowns regardless of section
- ❌ No visual indication: Jobs Library doesn't show which section jobs belong to
- ❌ No validation: System allows mixing first/second job templates without enforcement

**Required Fixes**:
1. **Filter job dropdowns by section**:
   - Staff Whiteboard primary assignment dropdown should only show `section = 'First Jobs'`
   - Clarify if Second Job Board should use templates or remain free-text only

2. **Display section in Jobs Library UI**:
   - Add badge/label showing "FIRST" or "SECOND" on JobCard components
   - Pass `section` prop to JobCard component
   - Consider adding filter/grouping by section

3. **Make section required in TypeScript**:
   - Change `section?: string` to `section: 'First Jobs' | 'Second Jobs'` in types

4. **Add validation**:
   - Prevent assigning "Second Job" templates to primary assignment slots
   - Consider preventing duplicate job titles across sections

**Priority**: Medium (functional but not critical for current manual workflow; becomes important for future AI automation)

**Related Files**:
- `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` (line 56-60)
- `turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx` (line 88-91)
- `turfsheet-app/src/pages/JobsPage.tsx` (line 128-139)
- `turfsheet-app/src/types/index.ts` (line 11)

**Investigation**: See Explore agent report (2026-02-14) for full analysis

---

## Recently Completed ✅

See `completed/2026-02/` for completed tasks including:
- ✅ Fix Font Awesome Integrity Hash Issue — Updated to v6.7.2 with correct SHA-512 hash (2026-02-14)
- ✅ Whiteboard Frontend Realignment — All 7 components updated for new schema (2026-02-11)
- ✅ Whiteboard Backend Realignment — Schema restructured for real workflow (2026-02-11)
- ✅ Whiteboard Dashboard Redesign — Two-panel layout (2026-02-11)
- ✅ Fix Staff & Jobs Creation — Sequence permissions (2026-02-11)
- ✅ Make Site Actionable: Add Staff & Jobs (2026-02-05)
- ✅ Staff Whiteboard Dashboard (2026-02-05)
- ✅ Fix Supabase API Key Configuration (2026-02-04)
- ✅ Database Setup - Jobs & Staff Tables (2026-02-04)

---

## Archived/On Hold

See [planned.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/Tasks/planned.md) for upcoming work.

1. Create a site style guide. (Completed)
2. Create a site on whitepine-tech.com for TurfSheet. (On Hold)
3. Move implemented plans from Implemented/ to completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)
