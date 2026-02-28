## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from Implementation/ to completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-02-27

## Active Tasks

### Feature: Mowing Directions on Jobs
**Priority:** Medium
**Status:** Not started
**Date Added:** 2026-02-25

**Overview:** Add mowing-specific metadata fields to job templates and job cards, similar to competitor app (see `SiteExamples/Examples/IMG_4371.jpg` and `IMG_4372.jpg`).

**Fields to add to jobs:**
- **Mow Direction** — dropdown with values: `12-6`, `2-8`, `3-9`, `4-10` (clock positions; more to be added later)
- **Clean Up** — dropdown (e.g., "Clockwise", "Counter-Clockwise")
- **HOC** — height of cut, decimal number (e.g., 0.125")
- **Mow Pattern** — optional icon/enum (Contour, Push, Double Cut, Circle Cut, No Cleanup, etc.)

**Display:** Fields should show on job cards in Classic Dashboard and Whiteboard (where assigned).

**Reference:** `SiteExamples/Examples/IMG_4371.jpg` (form), `IMG_4372.jpg` (card display)

**Scope:**
- Add columns to `turfsheet.jobs` table (migration)
- Update TypeScript `Job` interface
- Update `JobForm.tsx` with new optional fields (only shown for mowing-type jobs, or always shown)
- Update job card display to show populated values

---

## Recently Completed ✅

See `completed/2026-02/` for completed tasks including:
- ✅ Whiteboard Misc Fixes + Announcements — Off staff display, manage schedule modal, announcements CRUD, UTC date fix, 3-column layout (2026-02-27)
- ✅ Pesticide Tracker Improvements — Date filtering, weather alerts, mix templates, print sheet, edit/delete, calc→log bridge (2026-02-26)
- ✅ Scheduled Jobs + Job Edit/Delete — Recurring schedules, auto-populate dashboard, full CRUD with confirm-delete (2026-02-25)
- ✅ Demo Day Fixes — UI improvements, working staff filtering, header weather widget (2026-02-16)
- ✅ Equipment Page Fixes — Card expansion, batch CSV upload, status color fix (2026-02-16)
- ✅ Demo Preparation Work — Equipment page, Settings enhancements, job section filtering (2026-02-16)
- ✅ Projects Page — Inline-editable project board with sections and detail modal (2026-02-11)
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
2. Create a site on whitepine-tech.com for TurfSheet. (Completed)
3. Move implemented plans from Implemented/ to completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)
