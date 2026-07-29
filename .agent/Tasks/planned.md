# Planned Tasks

## Task 0 - Site Authentication ⬅️ NEXT UP

TurfSheet has **no auth gate at all** — every page is public to anyone with the URL.

This became urgent on 2026-07-29 when `/banbury-map` was retired and `/turfsheet/maps` became the
sole system of record for tournament pin positions. Anyone who finds the URL can create, edit,
delete, or publish share tokens for pin sheets. The same exposure applies to staff records, job
assignments, and the pesticide log (a regulated record).

- [ ] Choose the auth model — Supabase Auth is the obvious fit (already the backend, `@supabase/supabase-js` is present)
- [ ] Decide the identity source: email/password, magic link, or SSO
- [ ] Add login route + session handling; gate the app shell
- [ ] **Preserve public handout access** — `/maps?pinToken=…` must stay reachable *without* login.
      Printed QR codes in the clubhouse depend on it, and `/banbury-map` now 302s into it.
      This is the one route that must remain anonymous.
- [ ] Add RLS policies on `turfsheet.*` — the anon key is in the client bundle, so route-level
      gating alone is cosmetic. Tables are currently readable/writable by anyone holding it.
- [ ] Map roles to existing expectations: staff view-only (staff must not put work on the board),
      Darryl manages maintenance issues / second jobs, OldTom needs to write announcements
- [ ] Decide how OldTom (AI assistant) authenticates — service role, or its own account

**Note:** dropping the standalone's `accessCode` gate was defensible when `/maps` was a second copy
of a public app. It is not defensible now that it is the only copy.

## Task 0.1 - Get the gateway Caddyfile into version control

- [ ] `/home/deploy/gateway/Caddyfile` exists only on the production server. A host rebuild or a
      redeploy from source silently reverts routing, including the `/banbury-map` retirement —
      which would bring the retired app back and restart it writing to the old database.
- [ ] Decide where it lives (its own repo, or alongside the other WhitePineTech gateway config)
- See `System/deployment.md` → *Gateway / Caddy Routing*

## Task 1 - Settings Page
- [ ] Create Settings page/route
- [ ] Add "Workday Hours" configuration section
  - Default start time (currently hardcoded to 7:30 AM)
  - Default end time (currently hardcoded to 2:30 PM)
- [ ] Link default workday hours to default_schedule table
- [ ] Add "Update Default Schedule" feature to bulk-update the global default
- [ ] Add sidebar navigation item for Settings (gear icon)

**Note:** Default schedule system is implemented (database, types, UI). Settings page will allow users to modify the global default workday hours instead of hardcoding 7:30a-2:30p.

## Task 2 - Staff & Scheduling System
- [x] ~~Implement Staff list management~~ (DONE - StaffPage exists)
- [x] ~~Create schedule view for individuals~~ (DONE - ScheduleForm with Copy from Default)
- [ ] Define rotation logic (Blue/Orange 19-day cycle)
- [ ] Implement rotation schedule UI

## Task 3 - Communication Hub
- [ ] Implement team messaging
- [ ] Add task-specific comments

## Task 4 - Equipment Management
- [ ] Integration with Toro myTurf (Phase 2+)

## Task 5 - DB Refinement
- [ ] Jobs will need to be refined so fields match which type of jobs. Mowing jobs will need specialized fields: direction, HOC, cleanup, etc.

## Task 6 - Staff Time-Off Management
- [ ] Create TimeOffForm component (staff dropdown, date range, reason, notes)
- [ ] Add "Request Time Off" button to Calendar page
- [ ] Display time-off entries on calendar as gray events
- [ ] Add time-off management UI (approve/deny if needed)
- **Note:** Database table `turfsheet.staff_time_off` already exists (created 2026-02-24). UI implementation deferred.

## Task 7 - Irrigation Management
- [ ] Design irrigation logging features (zones, probe readings, watering cycles)
- [ ] Create database tables for irrigation data
- [ ] Build irrigation page UI (replace current placeholder)
- **Note:** Placeholder page exists at `/irrigation`. Full implementation planned for future phase.
