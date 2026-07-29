## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from Implementation/ to completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-07-29

**Next up:** Site authentication — see `planned.md` Task 0. `/maps` is now the sole system of
record for tournament pin positions on a site with no auth gate.

## Active Tasks

### Chemicals Page — remaining items
Plan: `Implementation/2026-07-28-chemicals-clean-up.md`
Shipped portion recorded in `completed/2026-07/1-chemicals-page-clean-up.md`

- [ ] **Confirm REI hours against the physical labels**, then apply
      `supabase/migrations/20260728120100_set_product_rei_hours.sql` via Supabase Studio.
      Every `chemical_products` row is currently `rei_hours = 0`, which blanks the REI autofill.
      Proposed: 2,4-D Amine + Amine 4 = 48h, Chlorothalonil 720 SFT = 12h, Crossroad = 48h,
      Podium = 4h, Cutrine Plus Granular = 0h, fertilizers/surfactant = 0h.
      **Not applied — REI is a regulated figure and these are unverified proposals.**
- [ ] **Browser verification** of this session's changes (Recommended By in both the detail modal
      and the Print Log — separate code paths; the Other free-text round-trip on edit; wider modal).
      The `chrome:console` MCP tool times out in this environment, so none of it was clicked.
- [ ] **Check production for untracked code.** The 2026-07-28 external audit says a Recommended By
      fix was deployed from `/home/wpauser/src/turfsheet`, a clone not on this machine and not on
      `origin/main`. If that deploy happened, production is serving code with no commit behind it.
      Verify before merging this branch or it may be silently overwritten.
- [ ] Optionally update the 2026-07-28 Cutrine record (currently `granular` / blank equipment) to
      *Broadcast (By Hand)* / *By Hand* now that those options exist.

### Maps — tap-cycle double-advance (UNRESOLVED, two failed fixes)
Feature shipped and live at `/turfsheet/maps` — see `completed/2026-07/2-maps-banbury-course-map.md`.
Plan retained for its parity checklist: `Implementation/2026-07-28-maps-banbury-course-map.md`

- [ ] **Two quick taps advance two holes.** Reproduced by Chris on production. Should advance one.
      Only affects fast double-taps (adjusting a pin just placed); taps >350ms apart advancing
      twice is correct behaviour and matches the standalone.

      **Two fixes attempted, both failed:**
      1. `da43594`→`bf6bbc4` — ported the standalone's state-comparison guards
         (`s.order[s.index] !== hole`, `s.pins[hole] !== pin`). Still double-advanced.
      2. `5b0df2e` — single-timer model: pending advance held in `advanceTimerRef`, cancelled on
         every tap. **This should make two advances structurally impossible** and it still failed,
         which means the advance is NOT coming from the timer in `handleMapClick`, or the tested
         bundle wasn't the deployed one.

      **Ruled out by code reading:** `measurePin` returns a fresh object literal every call, so the
      identity guard was sound. `goRelative`/`jumpToHole`/`skipCurrent`/`PinPanel.onNext` are the
      only other advance paths and none are wired to map clicks. `CourseMap` registers exactly one
      map click listener, guarded by `pinMode`.

      **Next steps — get runtime evidence first, do not attempt a third blind fix:**
      - Confirm the browser is actually running the fixed bundle (hash `index-DkJIf2zA.js` or later).
        A cached `index.html` pointing at an old JS hash would explain everything. Hard-refresh.
      - Check whether `MapsPage` mounts twice (two components = two independent timer refs).
      - Instrument `handleMapClick` and the timer callback with `console.log` and read the real
        firing sequence.

      **Blocker:** no working browser automation in this environment (see follow-ups below), so all
      three attempts were verified by `tsc`/`eslint` only and tested by hand by Chris.

### Follow-ups surfaced this session (not started)
- [ ] **Browser automation is non-functional — fix before further UI debugging.** Both paths are
      dead: `npx tsx run.ts chrome:console|errors` hangs indefinitely and is killed by timeout, and
      the Chrome extension reports `Browser extension is not connected`. This is the root cause of
      the maps debugging above going three rounds without evidence. Fix: install the extension from
      https://claude.ai/chrome, log into claude.ai with the same account as Claude Code, restart
      Chrome.
- [ ] Google Maps key has no working localhost referrer entry. `http://localhost:*/*` is rejected by
      GCP as an invalid domain (no port wildcards); explicit `http://localhost:5179/*` and
      `:5180/*` were added but still returned `RefererNotAllowedMapError`. Possibly a new key was
      created while `turfsheet-app/.env.local` still holds the old one. Local `/maps` dev is blocked
      until resolved.
- [ ] `applicator_license` is blank on every record and is a real Idaho ISDA field. It is free text
      re-typed per application, so it never gets filled. Belongs on `staff`, autofilled from the
      selected operator.
- [ ] Correct the stale Supabase ref in `CLAUDE.md` (`scktzhwtkscabtpkvhne` → `klyzdnocgrvassppripi`).
- [ ] `.agent/Tasks/completed/2026-02/*.md` contain a committed Postgres connection string with
      password. Rotate and scrub.
- [ ] Register `turfsheet` in `Tools/mcp-servers/supabase/index.ts` (the hardcoded config `run.ts`
      actually reads) and fix the wrong password in `config.json`.

---

## Recently Completed ✅

- ✅ Banbury Course Map merged into `/maps` — full port from the standalone, pin data migrated into
  the TurfSheet DB, geometry parity proven (0 mismatches / 90 fields), `/banbury-map` retired to a
  302. One open defect: tap-cycle double-advance, above. (2026-07-29)
- ✅ Chemicals Page Clean-Up — method/equipment options + Other free text, Recommended By fix,
  wider modal, form correctness fixes (2026-07-28)

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
