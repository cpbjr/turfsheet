# Whiteboard Frontend Realignment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update all frontend components to work with the realigned backend schema — one primary job per staff, free-text second jobs with grab-to-complete, priority letters on second jobs only, and daily board metadata.

**Architecture:** The backend schema was realigned in the `whiteboard-backend-realignment` plan. The TypeScript types are already updated. This plan updates 8 components that still reference old types, deleted columns, and dropped tables. Design polish is out of scope — this is about making the data flow work.

**Tech Stack:** React 19, TypeScript, Supabase JS client, Tailwind CSS

**Depends on:** `whiteboard-backend-realignment` (completed — all migrations applied)

---

## Components Requiring Changes

### Critical (will crash — broken queries/imports)

| # | Component | File | Key Problems |
|---|-----------|------|--------------|
| 1 | **StaffWhiteboardView** | `src/components/whiteboard/StaffWhiteboardView.tsx` | Imports `SecondJobBoardFull`; queries deleted `second_job_assignments` table; uses `rank` column; builds `job1`/`job2` from `job_order` |
| 2 | **SecondJobsBoardPanel** | `src/components/whiteboard/SecondJobsBoardPanel.tsx` | Same query issues; inserts `job_id` (removed); uses `rank`; manages deleted `second_job_assignments` table |
| 3 | **SecondJobBoardItem** | `src/components/whiteboard/SecondJobBoardItem.tsx` | Expects `SecondJobBoardFull` with nested `assignments[]`; accesses `boardItem.job.title` (FK removed) |

### High (will error — wrong column/type references)

| # | Component | File | Key Problems |
|---|-----------|------|--------------|
| 4 | **StaffRow** | `src/components/whiteboard/StaffRow.tsx` | Accesses `row.job1` and `row.job2` (now `row.primaryJob`) |
| 5 | **JobAssignmentCell** | `src/components/whiteboard/JobAssignmentCell.tsx` | Imports `JobOrder`; inserts `job_order` column; wrong upsert conflict target |
| 6 | **PriorityCell** | `src/components/whiteboard/PriorityCell.tsx` | Updates `priority` on `daily_assignments` (column removed); needs architectural relocation to second jobs |

### Medium (functional change needed)

| # | Component | File | Key Problems |
|---|-----------|------|--------------|
| 7 | **AddSecondJobDropdown** | `src/components/whiteboard/AddSecondJobDropdown.tsx` | Selects from job template library; should be free-text input |

### Low / Compatible (minor or no changes)

| Component | File | Status |
|-----------|------|--------|
| **SecondJobChip** | `src/components/whiteboard/SecondJobChip.tsx` | Compatible — display-only, just show `description` instead of `job.title` |
| **AssignStaffDropdown** | `src/components/whiteboard/AssignStaffDropdown.tsx` | Compatible — still assigns staff to items |
| **DashboardPage** | `src/pages/DashboardPage.tsx` | Compatible — wraps StaffWhiteboardView; enhance later with daily board metadata |
| **JobForm** | `src/components/jobs/JobForm.tsx` | Compatible — `jobs` table unchanged |

---

## Task 1: Fix StaffWhiteboardView — Main Data Loading

The central component. Fix all queries, imports, and data transformation.

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx`

**Changes:**

1. **Fix imports** — Replace `SecondJobBoardFull` with `SecondJobBoardItemWithStaff`; remove `DailyAssignmentWithDetails` usage for `job2`

2. **Fix state type** — `secondJobAssignments` state should be `SecondJobBoardItemWithStaff[]`

3. **Fix daily_assignments query** — Remove `job_order` from WHERE/filtering logic:
   ```typescript
   // OLD: finds job1 and job2 by job_order
   const job1 = assignments.find(a => a.staff_id === staff.id && a.job_order === 1);
   const job2 = assignments.find(a => a.staff_id === staff.id && a.job_order === 2);

   // NEW: find single primary job per staff
   const primaryJob = assignments.find(a => a.staff_id === staff.id);
   return { staff, primaryJob };
   ```

4. **Fix second_job_board query** — Remove joins to deleted table/FK:
   ```typescript
   // OLD:
   .select(`*, job:job_id(*), assignments:second_job_assignments(*, staff:staff_id(*))`)
   .order('rank', { ascending: true })

   // NEW:
   .select(`*, staff:grabbed_by(*)`)
   .order('sort_order', { ascending: true })
   ```

5. **Fix getSecondJobChipsForStaff** — Instead of looping through nested assignments, filter board items where `grabbed_by === staffId`:
   ```typescript
   const getSecondJobChipsForStaff = (staffId: string) => {
     return secondJobAssignments
       .filter(item => String(item.grabbed_by) === String(staffId))
       .map(item => ({
         id: String(item.id),
         jobTitle: item.description,
         boardItemId: String(item.id),
       }));
   };
   ```

6. **Fix handleUnassignSecondJob** — Instead of deleting from `second_job_assignments`, update the board item:
   ```typescript
   // OLD: delete from second_job_assignments, then check remaining
   // NEW: set grabbed_by = null, grabbed_at = null on second_job_board
   await supabase
     .from('second_job_board')
     .update({ grabbed_by: null, grabbed_at: null })
     .eq('id', boardItemId);
   ```

7. **Fix grid header** — Change from 3 columns (Staff Name | Job 1 | Job 2) to 2 columns (Staff Name | Primary Job), plus second job chips below staff name

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx
git commit -m "fix: update StaffWhiteboardView for new schema"
```

---

## Task 2: Fix SecondJobsBoardPanel — Free Text + Grab

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/SecondJobsBoardPanel.tsx`

**Changes:**

1. **Fix imports and state type** — Use `SecondJobBoardItemWithStaff[]`

2. **Fix query** — Same as Task 1 (no joins to deleted table):
   ```typescript
   .select(`*, staff:grabbed_by(*)`)
   .order('sort_order', { ascending: true })
   ```

3. **Fix handleAddToBoard** — Insert `description` instead of `job_id`:
   ```typescript
   // OLD: insert({ job_id, board_date, rank })
   // NEW: insert({ description, board_date, sort_order })
   ```

4. **Fix handleAssignStaff (grab)** — Update board item directly instead of inserting into deleted table:
   ```typescript
   // OLD: insert into second_job_assignments + update status
   // NEW: update second_job_board set grabbed_by, grabbed_at
   await supabase
     .from('second_job_board')
     .update({ grabbed_by: staffId, grabbed_at: new Date().toISOString() })
     .eq('id', boardItemId);
   ```

5. **Fix handleUnassignStaff** — Same pattern, null out grabbed_by/grabbed_at

6. **Fix handleMoveUp/handleMoveDown** — Replace `rank` with `sort_order`

7. **Remove existingJobIds filter** — No longer filtering by job template IDs

8. **Update AddSecondJobDropdown props** — Pass text input handler instead of job list

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/SecondJobsBoardPanel.tsx
git commit -m "fix: update SecondJobsBoardPanel for free-text and grab semantics"
```

---

## Task 3: Fix SecondJobBoardItem — Flat Structure

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/SecondJobBoardItem.tsx`

**Changes:**

1. **Fix type** — Accept `SecondJobBoardItemWithStaff` instead of `SecondJobBoardFull`

2. **Fix title display** — Use `boardItem.description` instead of `boardItem.job.title`

3. **Fix assignment display** — Instead of looping `boardItem.assignments`, check `boardItem.staff` (single grab):
   ```typescript
   // OLD: boardItem.assignments.length > 0, loop through assignments
   // NEW: boardItem.grabbed_by !== null, show boardItem.staff?.name
   ```

4. **Fix strikethrough logic** — Apply when `grabbed_by` is set

5. **Add priority letter display** — Show `boardItem.priority` if set (A-Z badge)

6. **Fix assign staff dropdown** — Hide when already grabbed; show when `grabbed_by` is null

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/SecondJobBoardItem.tsx
git commit -m "fix: update SecondJobBoardItem for flat grab structure"
```

---

## Task 4: Fix StaffRow — Single Primary Job

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/StaffRow.tsx`

**Changes:**

1. **Fix grid** — Change from 3-column (`[2fr_3fr_3fr]`) to 2-column layout

2. **Fix job references** — Replace `row.job1`/`row.job2` with `row.primaryJob`:
   ```typescript
   // OLD: two JobAssignmentCell components for job1 and job2
   // NEW: one JobAssignmentCell for primaryJob
   <JobAssignmentCell
     staffId={String(row.staff.id)}
     date={dateString}
     currentAssignment={row.primaryJob}
     availableJobs={availableJobs}
     onUpdate={onUpdate}
     onCreateJob={onCreateJob}
   />
   ```

3. **Keep second job chips** — Still displayed under staff name (these come from the board)

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/StaffRow.tsx
git commit -m "fix: update StaffRow for single primary job"
```

---

## Task 5: Fix JobAssignmentCell — Remove job_order

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx`

**Changes:**

1. **Remove `JobOrder` import** — Type deleted

2. **Remove `jobOrder` prop** — No longer needed

3. **Fix upsert** — Remove `job_order` from insert data and conflict target:
   ```typescript
   // OLD: insert({ staff_id, job_id, assignment_date, job_order })
   //       onConflict: 'staff_id,assignment_date,job_order'
   // NEW: insert({ staff_id, job_id, assignment_date })
   //       onConflict: 'staff_id,assignment_date'
   ```

4. **Fix delete** — Remove `job_order` from WHERE clause:
   ```typescript
   // OLD: .eq('job_order', jobOrder)
   // NEW: just match staff_id + assignment_date
   ```

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/JobAssignmentCell.tsx
git commit -m "fix: remove job_order from JobAssignmentCell"
```

---

## Task 6: Remove or Repurpose PriorityCell

Priority letters belong on second jobs, not primary assignments. The `priority` column was removed from `daily_assignments`.

**Files:**
- Modify or Delete: `turfsheet-app/src/components/whiteboard/PriorityCell.tsx`
- Modify: `turfsheet-app/src/components/whiteboard/SecondJobBoardItem.tsx` (if adding priority editing there)

**Changes:**

**Option A (recommended):** Delete `PriorityCell.tsx` entirely. Add inline priority letter editing to `SecondJobBoardItem` instead (a small clickable badge that opens a letter picker). This keeps priority management where it belongs — on the second jobs board.

**Option B:** Keep `PriorityCell` but rewire it to update `second_job_board.priority` instead of `daily_assignments.priority`.

**Step: Commit**
```bash
git add -A turfsheet-app/src/components/whiteboard/
git commit -m "fix: move priority editing to second jobs board"
```

---

## Task 7: Replace AddSecondJobDropdown with Free Text Input

The super types second jobs like notes, not selects from a dropdown. Replace the template-based dropdown with a simple text input.

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/AddSecondJobDropdown.tsx`

**Changes:**

1. **Replace component internals** — Instead of rendering a list of `availableJobs`, render a text input with an "Add" button

2. **Update props** — Remove `availableJobs` and `existingJobIds`; accept `onAdd: (description: string) => void`

3. **UX goal** — Should feel like typing into a notepad. Press Enter or click Add to submit. Auto-focus for rapid entry. Support multi-line paste (one job per line) for batch entry.

4. **Rename component** — Consider renaming to `AddSecondJobInput` to reflect the change (optional)

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/AddSecondJobDropdown.tsx
git commit -m "feat: replace job dropdown with free-text input for second jobs"
```

---

## Task 8: Update StaffWhiteboardView Grid Header

The left panel header currently shows 3 columns. Update to match the single primary job layout.

**Files:**
- Modify: `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` (header section)

**Changes:**

1. **Fix grid header** — Change from `grid-cols-[2fr_3fr_3fr]` with "Staff Name | Job 1 | Job 2" to `grid-cols-[2fr_3fr]` with "Staff Name | Primary Job"

2. **Ensure StaffRow grid matches** — Both header and row grids must use the same column template

**Step: Commit**
```bash
git add turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx
git commit -m "fix: update whiteboard grid to single primary job column"
```

---

## Task 9: Verify Everything Compiles and Renders

**Step 1:** Run TypeScript compiler
```bash
cd turfsheet-app && npx tsc --noEmit
```
Expected: Zero errors.

**Step 2:** Start dev server
```bash
npm run dev
```
Expected: Starts without build errors.

**Step 3:** Check browser console for runtime errors
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers && npx tsx run.ts chrome:console '{"url":"http://localhost:5173"}'
```
Expected: No Supabase query errors, no React rendering errors.

**Step 4:** Commit any remaining fixes.

---

## Future Enhancements (NOT in this plan)

1. **Daily board metadata display** — Show sunrise time and announcements at top of dashboard (query `daily_board` table)
2. **Carryover logic** — Button to carry forward ungrabbed second jobs from yesterday
3. **Priority letter picker** — Nice inline UI for the super to assign A-Z letters to second jobs
4. **Multi-line paste for second jobs** — Paste a list, each line becomes a board item
5. **Staff grab from phone** — Mobile-friendly grab button on second jobs list
