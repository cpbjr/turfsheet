# Scheduled Jobs + Job Edit/Delete ✅

**Completed**: 2026-02-25

## What Was Done

Added scheduled job recurrence to the jobs library, auto-population on the Classic Dashboard, and full CRUD (edit + delete with confirmation) for job templates.

## Key Changes

- **DB migrations**: Added `is_scheduled` (bool) and `scheduled_days` (text[]) to `turfsheet.jobs`; created new `turfsheet.scheduled_job_queue` table with RLS, grants, and `UNIQUE(job_id, queue_date)` for idempotent daily auto-populate
- **Scheduled jobs UI**: `JobForm` now has a toggle + day-picker (Mon–Sun pills); days persist correctly via `value` attribute fix on radio inputs (also fixed "First Jobs not persisting" bug)
- **Classic Dashboard auto-populate**: On load, scheduled jobs matching today's day-of-week are upserted into the queue; "Scheduled Today" section appears above First Jobs with per-card ✕ dismiss (dismissed state persists across page reloads)
- **Job edit**: Pencil icon in job card header opens edit modal pre-filled with all job data including scheduling fields; "Save Changes" updates DB and refreshes list in-place
- **Job delete**: Delete button in edit modal with two-step confirmation (click → "Are you sure?" → "Yes, Delete"); cancel resets to single button without closing modal
- **TypeScript**: Added `DayOfWeek` type, `ScheduledJobQueue` and `ScheduledJobQueueWithJob` interfaces; `Job` interface updated with new fields

## Notes

- Whiteboard view excluded from scheduled jobs (Phase 1 scope decision — too complex for now)
- `scheduled_job_queue` uses `dismissed` flag instead of hard-delete to preserve daily audit trail
- Mowing directions (direction, clean-up, HOC, pattern) tracked as next feature in active.md
