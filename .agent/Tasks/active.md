## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from Implementation/ to completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-02-11 17:15 UTC


## Active Tasks

### 1. Whiteboard Frontend Realignment
**Status:** Ready to implement
**Priority:** Critical (app will not render with current components)
**Plan:** [Implementation/whiteboard-frontend-realignment.md](Implementation/whiteboard-frontend-realignment.md)
**Depends on:** Backend realignment (completed — all migrations applied)

**Description:** Update 8 frontend components to work with the realigned backend schema. The backend now uses one primary job per staff (not two), free-text second jobs (not template FK), grab-to-complete semantics (not separate assignments table), and priority letters on second jobs only.

**Components to update (by severity):**

**Critical — broken queries/imports:**
- `StaffWhiteboardView.tsx` — queries deleted table, wrong imports, wrong column refs
- `SecondJobsBoardPanel.tsx` — same query issues, inserts deleted columns
- `SecondJobBoardItem.tsx` — expects nested structure that no longer exists

**High — wrong column/type references:**
- `StaffRow.tsx` — accesses `row.job1`/`row.job2` (now `row.primaryJob`)
- `JobAssignmentCell.tsx` — uses deleted `JobOrder` type, inserts `job_order`
- `PriorityCell.tsx` — updates deleted `priority` column on wrong table

**Medium — functional change:**
- `AddSecondJobDropdown.tsx` — needs to become free-text input, not template selector

**Compatible (no changes needed):**
- `SecondJobChip.tsx`, `AssignStaffDropdown.tsx`, `DashboardPage.tsx`, `JobForm.tsx`

---

### 2. Fix Font Awesome Integrity Hash Issue
**Status:** Pending
**Priority:** Medium (Dev warning, non-blocking)
**Description:** Font Awesome CSS has integrity hash mismatch.

**Error:**
```
None of the "sha512" hashes in the integrity attribute match the content of the subresource at
"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
```

**Next Steps:**
1. Update Font Awesome CDN integrity hash or remove SRI check
2. Verify latest Font Awesome version and hash
3. Test that icons display correctly

---

## Recently Completed ✅

See `completed/2026-02/` for completed tasks including:
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

1. Create a site style guide. (Archived)
2. Create a site on whitepine-tech.com for TurfSheet. (On Hold)
3. Move implemented plans from Implemented/ to completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)
