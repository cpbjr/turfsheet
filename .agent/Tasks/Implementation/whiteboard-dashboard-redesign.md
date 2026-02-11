# TurfSheet Whiteboard Dashboard Redesign

## Context

The current dashboard uses a 4-column grid (`Staff | Job 1 | Priority | Job 2`) which doesn't match the physical whiteboard workflow. The user wants a **two-panel design** that mirrors how superintendents actually manage daily assignments:

- **Left panel**: Staff names + first job assignments + assigned second jobs (chips showing where workers are)
- **Right panel**: A separate prioritized "Second Jobs" list that the super builds each morning, then assigns from as workers become available

Additionally, there are **3 critical bugs** preventing basic functionality:
1. Staff page won't load (sequence permission denied)
2. Jobs creation fails (duplicate key / sequence out of sync)
3. Daily assignments only grant to `authenticated`, not `anon` — causing fetch failures

## Branch

`feature/dashboard-whiteboard-redesign`

---

## Phase 1: Fix Database Bugs (1 migration)

### Migration 1: Fix ALL sequence permissions + anon grants
**File**: `supabase/migrations/20260211_01_fix_all_permissions.sql`

```sql
GRANT USAGE, SELECT ON SEQUENCE turfsheet.jobs_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.daily_assignments_id_seq TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO anon;
SELECT setval('turfsheet.jobs_id_seq', COALESCE((SELECT MAX(id) FROM turfsheet.jobs), 0) + 1, false);
SELECT setval('turfsheet.staff_id_seq', COALESCE((SELECT MAX(id) FROM turfsheet.staff), 0) + 1, false);
```

---

## Phase 2: New Database Tables (2 migrations)

### Migration 2: `second_job_board` table
**File**: `supabase/migrations/20260211_02_create_second_job_board.sql`

Tracks which second jobs are on the board for a given day with rank ordering and status.

### Migration 3: `second_job_assignments` table
**File**: `supabase/migrations/20260211_03_create_second_job_assignments.sql`

Links board jobs to staff members.

---

## Phase 3: Update TypeScript Types

**File**: `turfsheet-app/src/types/index.ts` — Add SecondJobBoard, SecondJobAssignment interfaces.

---

## Phase 4: Dashboard Redesign — Component Architecture

### Layout Change
Current: `[Staff | Job1 | Priority | Job2]` single grid
New: `[Left Panel: Staff + Jobs | Right Panel: Second Jobs Board]` flex layout

### New Components (6 files)
1. `SecondJobsBoardPanel.tsx` — Right panel with second jobs list
2. `SecondJobBoardItem.tsx` — Individual list item (pending/assigned states)
3. `SecondJobChip.tsx` — Pill chip next to staff name for assigned second jobs
4. `AssignStaffDropdown.tsx` — Staff picker dropdown
5. `AddSecondJobDropdown.tsx` — Job template picker for adding to board
6. `StaffRow.tsx` — Extracted staff row component

### Modified Components (2 files)
1. `StaffWhiteboardView.tsx` — Major refactor to two-panel layout
2. `types/index.ts` — New type interfaces

---

## Phase 5: Data Flow

| Action | Tables Affected | UI Update |
|--------|----------------|-----------|
| Add job to board | INSERT `second_job_board` | New item in right panel |
| Assign to staff | INSERT `second_job_assignments`, UPDATE status | Strikethrough right + chip left |
| Unassign | DELETE assignment, UPDATE status='pending' | Remove strikethrough + remove chip |
| Reorder | UPDATE ranks (swap) | Right panel reorders |
| Remove from board | DELETE board entry (cascades) | Remove from both panels |

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/20260211_01_fix_all_permissions.sql` | CREATE |
| `supabase/migrations/20260211_02_create_second_job_board.sql` | CREATE |
| `supabase/migrations/20260211_03_create_second_job_assignments.sql` | CREATE |
| `turfsheet-app/src/types/index.ts` | MODIFY |
| `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` | MODIFY |
| `turfsheet-app/src/components/whiteboard/SecondJobsBoardPanel.tsx` | CREATE |
| `turfsheet-app/src/components/whiteboard/SecondJobBoardItem.tsx` | CREATE |
| `turfsheet-app/src/components/whiteboard/SecondJobChip.tsx` | CREATE |
| `turfsheet-app/src/components/whiteboard/AssignStaffDropdown.tsx` | CREATE |
| `turfsheet-app/src/components/whiteboard/AddSecondJobDropdown.tsx` | CREATE |
| `turfsheet-app/src/components/whiteboard/StaffRow.tsx` | CREATE |

---

## Verification

1. `npx supabase db push` — all migrations apply
2. Staff page loads, can create staff
3. Jobs page — can create jobs without duplicate key error
4. Dashboard left panel — first jobs persist
5. Dashboard right panel — add/remove/reorder second jobs
6. Assignment flow — assign from right → chip on left + strikethrough on right
7. Multiple assignments — 2-3 second jobs per worker
8. Chrome console — no errors
