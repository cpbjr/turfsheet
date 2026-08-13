## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from
   Implementation/ to Completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-08-12

**Awaiting merge:** Idaho pesticide record-keeping compliance — branch
`feature/idaho-pesticide-compliance`, 4 commits, migrations already applied to the database.
Record: `Completed/2026-08/8-idaho-pesticide-compliance.md`. One data step remains: enter each
applicator's license under Staff → Edit, or element (m) prints `--`.

Everything else below is queued. Shipped work lives in `Completed/`.

## Open Work

**At a glance:**

| Item | Blocking? | Gist |
|---|---|---|
| Browser automation dead | **Yes — blocks UI work** | No `chrome:console`, no extension. Every UI fix must be hand-tested by Chris. Root cause of three failed maps fixes. |
| Google Maps key / localhost | Blocks local `/maps` | `RefererNotAllowedMapError`; `.env.local` may hold a superseded key. |
| MCP `supabase:sql` broken | Workaround exists | `Unknown project: turfsheet` + bad passwords. Use the Management API (details below). |
| Credential scrub | **Security** | A Postgres connection string with password is committed in `Completed/2026-02/*.md`. Rotate and scrub. |
| Maps tap-cycle double-advance | No | **Re-scope before touching** — filed against `/maps`, which can't place pins at all. |
| Pesticide snapshot cleanup | No | Drop the pre-split rollback table once the event model is settled. |
| Pin handout token | No | No `public_token` published yet, so the anon path is untested with real data. |
| Chemicals REI hours | No | Every product is `rei_hours = 0`; proposed values unverified against physical labels. |
| OldTom anon-key diagnostic | No | Inverted silently since the auth lockdown — reports "no rows" instead of erroring. |
| Applicator licenses unentered | No | Column + autofill shipped; the numbers themselves still need typing in per staff member. |
| `StaffSchedule` type wrong | No | Declares nested `WeeklySchedule`; table is flat `<day>_on`. Two local `ScheduleRow` workarounds in place. |

**Standing warnings — not tasks, but read before you work:**
- **`npx tsc --noEmit` is a no-op here** — use `tsc -b` / `npm run build`. Details below.
- **Do not run `git add .`** — six untracked pgvector/memory migrations sit in
  `supabase/migrations/` from paused work and will be swept onto `main`. Stage explicit paths.
  See `blocked.md`.
- **Do not run `npx supabase db push`** — unsafe on this project's migration history. Use
  `db query --linked -f`, or the Management API below.

### Pesticide event model — Task 9 snapshot cleanup
Context: `Completed/2026-08/2-pesticide-event-model.md`

Migration A left a full pre-split copy for rollback:
`turfsheet.pesticide_applications_pre_split_20260810` (service_role only; listed in
`scripts/verify-anon-lockdown.mjs`). Product data now lives only on children after Migration B.
The snapshot is optional baggage once you no longer need a full reverse of the split.

- [ ] Confirm no need to roll back the A→B split (prod edit/save already OK after B).
- [ ] Drop snapshot via Studio SQL:

      ```sql
      DROP TABLE IF EXISTS turfsheet.pesticide_applications_pre_split_20260810;
      ```

- [ ] Remove `'pesticide_applications_pre_split_20260810'` from `TABLES` in
      `scripts/verify-anon-lockdown.mjs`.
- [ ] `node scripts/verify-anon-lockdown.mjs` → exit 0; table no longer listed.

Not urgent — keep the snapshot until you are sure the event model is permanent. Dropping it is
irreversible for full pre-split restore (children remain source of truth either way).

### OldTom — anon-key diagnostic no longer means what it used to
Context: `Completed/2026-08/1-site-authentication.md`

OldTom queries a table with the **anon** key to reproduce what the live SPA sees, and diffs that
against the service-key result. That was valid while the SPA queried as `anon`. Since the
2026-08-08 lockdown it queries as `authenticated`, and the anon key returns `401` on every table.

Left as-is the check inverts silently: it reports no rows and reads as missing data — the same
shape as the "Print shows 0 apps but DB has rows" bug it exists to catch. It will not error.

- [ ] Tell OldTom to mint a user token for the "what does the browser see?" check:

      ```bash
      TOKEN=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
        -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
        -d '{"email":"admin@banbury.local","password":"<passphrase>"}' | jq -r .access_token)

      curl -s "$SUPABASE_URL/rest/v1/pesticide_applications?select=*" \
        -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOKEN" \
        -H "Accept-Profile: turfsheet"
      ```

      `apikey` stays the anon key; only `Authorization` changes. That is exactly what
      `supabase-js` sends, so it reproduces the browser faithfully.

- [ ] Confirm nothing else in OldTom's toolkit reads with the anon key. Day-to-day work
      (spray log GETs/POSTs/PATCHes, imports) uses `SUPABASE_SERVICE_KEY` and is unaffected —
      `service_role` has `bypassrls` and full grants.

A bare anon-key query is still worth keeping. From now on it answers "is the site locked?",
not "what does the browser see?"

### Pin handout — no published token exists
Context: `Completed/2026-08/1-site-authentication.md`

All 4 rows in `banbury_pin_sets` have `public_token = NULL`, so no clubhouse handout link exists
and the anonymous `?pinToken=` path is currently unused in production. It is verified working
structurally, but never with real data.

- [ ] Publish a handout link from `/pins` (Delivery), then:
      `node scripts/verify-anon-lockdown.mjs --token <token>`
      Expect `WORKS` rather than today's `REACHABLE`. That is the difference between "anon can
      execute the RPC" and "anon actually gets the pin set back" — the second is what a golfer
      scanning the QR code depends on.
- [ ] Load `/turfsheet/maps?pinToken=<token>` in a signed-out private window and confirm the
      green diagrams render.

Not urgent — nothing depends on the handout path until a tournament sheet is published. Worth
doing before one is needed rather than during.

### Chemicals Page — remaining items
Plan: `Implementation/2026-07-28-chemicals-clean-up.md`
Shipped portion recorded in `Completed/2026-07/1-chemicals-page-clean-up.md`

- [ ] **Confirm REI hours against the physical labels**, then apply
      `supabase/migrations/20260728120100_set_product_rei_hours.sql` via Supabase Studio.
      Every `chemical_products` row is currently `rei_hours = 0`, which blanks the REI autofill.
      Proposed: 2,4-D Amine + Amine 4 = 48h, Chlorothalonil 720 SFT = 12h, Crossroad = 48h,
      Podium = 4h, Cutrine Plus Granular = 0h, fertilizers/surfactant = 0h.
      **Not applied — REI is a regulated figure and these are unverified proposals.**
- [ ] **Browser verification** of this session's changes (Recommended By in both the detail modal
      and the Print Log — separate code paths; the Other free-text round-trip on edit; wider modal).
      The `chrome:console` MCP tool times out in this environment, so none of it was clicked.
- [x] **Check production for untracked code.** ✅ Resolved 2026-08-08 — production deploys from
      this repo via GitHub Actions. No `/home/*/src/turfsheet` clone exists on the server; the
      live bundle `index-Gsin37ex.js` is dated Jul 31 23:54 and contains the `Pin Sheets` strings
      from `a39ab0e` (2026-07-31), the last `main` commit touching `turfsheet-app/`.
- [ ] Optionally update the 2026-07-28 Cutrine record (currently `granular` / blank equipment) to
      *Broadcast (By Hand)* / *By Hand* now that those options exist.

### Maps — tap-cycle double-advance (UNRESOLVED, two failed fixes)
Feature shipped and live at `/turfsheet/maps` — see `Completed/2026-07/2-maps-banbury-course-map.md`.
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

      **⚠️ RE-SCOPE THIS BEFORE ANY FURTHER WORK (2026-08-08).** This defect was reported against
      `/maps`, but `/maps` has had `pinMode={false}` hardcoded since `a39ab0e`
      (`MapsPage.tsx:210`) and registers **no map-click listener at all** — so there is nothing
      there to double-advance. The report predates the pin-sheets restructure and is very likely
      unreproducible as written, which may explain why two fixes "failed": they were tested against
      a page that could no longer place pins.

      Separately, the listener the fixes targeted was never attached in Setup Map mode either, until
      `Completed/2026-08/3-pin-map-click-listener.md`. **Re-test in `/pins` → Setup → Map mode
      against the now-working listener before spending more time here** — the bug may be gone, or it
      may finally be observable.

### ⚠️ `npx tsc --noEmit` is a no-op in this repo — use `tsc -b` (2026-08-08)
Context: `Completed/2026-08/7-eslint-cleanup.md`

The root `tsconfig.json` is `"files": []` plus project references, so **`npx tsc --noEmit`
compiles nothing and always exits 0.** It has been cited as verification in past handoffs and
completion records; those claims were vacuous. Found when `npm run build` caught a `TS2322`
that `tsc --noEmit` had just reported clean.

**Use `npx tsc -b`, or `npm run build` (which runs `tsc -b && vite build`).**

**Nothing to fix in code — this is a standing warning, not a task.** Kept here so the next
agent does not repeat the mistake.

### `StaffSchedule` type does not match the database (2026-08-08)
Context: `Completed/2026-08/7-eslint-cleanup.md`

`types/index.ts:169` declares `StaffSchedule extends WeeklySchedule` — nested `monday:
DaySchedule` objects. The actual `staff_schedules` table has **flat** `monday_on` /
`monday_start` / `monday_end` columns, as `StaffPage.handleSaveSchedule` shows when it builds
its upsert.

This is why `ManageScheduleModal` and `StaffWhiteboardView` were reading the table through
`any`. Both now use a local `ScheduleRow` with a comment, rather than reuse a wrong type.

- [ ] Decide whether to correct `StaffSchedule` to the real column shape (and drop the two
      local `ScheduleRow` declarations), or keep `WeeklySchedule` for some other purpose and
      add a separate `StaffScheduleRow` to `types/index.ts`. Check for other consumers first —
      `RightPanel.tsx` also casts a `dayColumn` through `keyof StaffSchedule`.

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
- [ ] **Enter each applicator's license number** under Staff → Edit → Applicator License #. The
      column and the autofill shipped 2026-08-12 (`Completed/2026-08/8-idaho-pesticide-compliance.md`),
      but the numbers themselves are still blank, so IDAPA element (m) prints `--` on the log.
- [ ] `.agent/Tasks/Completed/2026-02/*.md` contain a committed Postgres connection string with
      password. Rotate and scrub.
- [ ] Register `turfsheet` in `Tools/mcp-servers/supabase/index.ts` (the hardcoded config `run.ts`
      actually reads) and fix the wrong password in `config.json`. Still broken — `supabase:sql`
      returns `Unknown project: turfsheet`, and both the direct and pooler passwords in
      `config.json` fail auth. Direct psql is also out: `db.<ref>.supabase.co` resolves IPv6-only
      and this machine has no IPv6 route.
      **Workaround that does work** — the Supabase Management API runs arbitrary SQL:
      `POST https://api.supabase.com/v1/projects/klyzdnocgrvassppripi/database/query`
      with `Authorization: Bearer <sbp_ token>` and `{"query": "..."}`. Used for all schema
      introspection during the site-auth work. Note it 403s on a Python `urllib` User-Agent;
      send a curl-like one.

---

## Recently Completed ✅

Each item below has a full record in `Completed/` — read that rather than relying on this index.

**`Completed/2026-08/`**
1. Site Authentication — site is behind a login; RLS rewritten on all 24 tables (2026-08-08)
2. Pesticide Event Model — event + product-line schema; PR #30. Snapshot cleanup still open, above (2026-08-07)
3. Pin map-click listener — pin placement by map works again; root cause `a39ab0e`, not auth (2026-08-08)
4. Pin Map Mobile Usability — tap dead zones removed; map frame fills the phone screen (2026-08-08)
5. Nudge card `set-state-in-effect` — extracted `NudgeByYards`; PR #33 (2026-08-08)
6. Skip button removed from Pin Sheets Setup — PR #35 (2026-08-08)
7. eslint cleanup — all 45 errors fixed, 0 remaining; PR #36 (2026-08-08)
8. Idaho pesticide record-keeping compliance — all 15 IDAPA elements captured, 2-year retention
   enforced in the database, edits audited (2026-08-12)

**`Completed/2026-07/`**
1. Chemicals Page Clean-Up — method/equipment options + Other free text, Recommended By fix (2026-07-28)
2. Banbury Course Map merged into `/maps` — geometry parity proven, `/banbury-map` retired to a 302 (2026-07-29)
3. Pin Sheet Redesign

Also shipped, no separate record: **Staff list polish** (2026-08-07) — Name column first, sort by
role ladder then name; Maintenance defaults to Open issues.

See `Completed/2026-02/` for completed tasks including:
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
3. Move implemented plans from Implementation/ to Completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)

**Note (2026-08-12):** item 3 is still real — `Implementation/` holds 12 plans, most of them for
work that shipped long ago. Worth a sweep: delete the plans whose work is recorded in `Completed/`,
and keep only those still backing open items (`2026-07-28-chemicals-clean-up.md`,
`2026-07-28-maps-banbury-course-map.md`, `implementation-blue-orange-schedules.md`).
