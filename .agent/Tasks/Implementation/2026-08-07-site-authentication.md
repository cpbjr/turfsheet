# Site Authentication — Design

Date: 2026-08-07
Branch: `feature/site-auth`
Source task: `planned.md` Task 0
Status: frontend gate implemented and verified locally; RLS migration written, **not applied**

## Goal

TurfSheet is currently public to anyone with the URL. Close the front door.

This is explicitly **a lock, not an identity system**. There is no per-person accounting, no
audit trail of who changed what, and no self-service signup. Those are deliberate omissions —
see *Out of Scope*.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth provider | Supabase Auth (email + password) | Already the backend; `@supabase/supabase-js` present |
| Account model | Three shared role accounts: `admin`, `super`, `staff` | Goal is "not publicly available", not per-user identity |
| Account creation | By hand in Supabase Studio | No mail server exists; nothing to configure or break |
| Passwords | Four-word passphrases, set by Chris | Guessable patterns undermine the point; pesticide log is a regulated record |
| Forced password change | **No** | Incompatible with shared accounts — first login would lock out account-mates |
| Email confirmation | Off | Addresses are `@banbury.local`; unconfirmed accounts cannot log in |
| Permissions | All three accounts identical for now | Ships fastest; accounts exist so roles can split later without recreating anyone |
| RLS scope | All 22 live tables, one migration | A table left out is a table still open — partial coverage is false comfort |

Rejected: magic links and invite emails (both make mail delivery a hard dependency on a system
that has none); Telegram-based signup (Darryl doesn't use Telegram, and focus moved to management).

## Architecture — two layers

**Layer 1 — route gate.** Controls what the UI shows. Cosmetic only.

**Layer 2 — RLS.** The actual lock. The anon key ships inside the client bundle every visitor
downloads, so anyone can extract it and query PostgREST directly with `curl`, never touching the
React app. Without Layer 2 the gate is a screen door.

## Part 1 — Database

### Current state (verified from migrations, 2026-08-07)

- RLS is **already enabled** on all 22 live tables — the plumbing exists.
- ~69 permissive policies grant `anon` full access, plus table-level
  `GRANT SELECT, INSERT, UPDATE, DELETE ... TO anon` nearly everywhere.
- Net effect: the lock is installed and propped open.

So this is a **rewrite, not a build**.

### The live tables — 24, not 22 (enumerated 2026-08-07)

The list below came from `pg_tables` on the live database, and it corrects the migration-file
guess above in two ways:

`banbury_pin_sets`, `calendar_events`, `chemical_products`, `course_features`,
`daily_assignments`, `daily_board`, `default_schedule`, `equipment`, `jobs`,
`maintenance_issues`, `maintenance_reporters`, **`memory_chunks`**, **`memory_documents`**,
**`memory_events`**, `pesticide_applications`, `project_sections`, `projects`,
`scheduled_job_queue`, `second_job_board`, `spray_mix_templates`, `staff`,
`staff_schedules`, `staff_skills`, `staff_time_off`

1. **The three `memory_*` tables are live and must be included.** The six untracked Blue/Orange
   migrations were in fact applied to the database — only the files are untracked. Excluding
   them would leave the whole memory corpus readable by anyone with the bundled anon key. A
   baseline check on 2026-08-07 confirmed `memory_chunks` and `memory_documents` return rows
   to `anon` today.
2. **`second_job_assignments` does not exist.** It was in the migration-file list only.

RLS is enabled on all 24. 55 permissive policies (not ~69) grant `anon`/`PUBLIC` access, plus
table-level grants on all 24.

Baseline before lockdown: **18 of 24 tables return data to the anon key**, including
`pesticide_applications` and `staff`. The other 6 are empty, so they read as empty rather than
denied — that is not evidence of a lock.

### A second anon hole, not in the original design

`turfsheet.match_memory_chunks(...)` is `SECURITY DEFINER` **and granted to `anon`**. It runs a
vector search over `memory_chunks` with the owner's rights, so revoking table grants does not
close it. Nothing in `turfsheet-app` calls it; `service_role` keeps `EXECUTE`. The migration
revokes `anon`'s.

Confirmed with OldTom 2026-08-08: day-to-day work (spray log GETs/POSTs/PATCHes, imports,
patches) uses `SUPABASE_SERVICE_KEY`. `service_role` has `bypassrls = true` and grants on all 24
tables, and the migration never revokes from it, so none of that is affected.

### After lockdown, an anon-key query no longer shows "what the browser sees"

OldTom uses the anon key for one diagnostic: hitting a table with the anon JWT to reproduce what
the live SPA sees, and comparing that against the service-key result. **That equivalence dies at
step 4.** Today the SPA queries as `anon`; afterwards a signed-in browser sends a user JWT and
queries as `authenticated`. The anon key will return empty for every table by design.

Left unchanged, the check inverts silently — it reports 0 rows and reads as missing data, which
is the same shape as the "Print shows 0 apps but DB has rows" bug it exists to catch.

To reproduce the browser's view after step 4, mint a user token; `apikey` stays the anon key and
only `Authorization` changes, which is exactly what `supabase-js` sends:

```bash
TOKEN=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"admin@banbury.local","password":"<passphrase>"}' | jq -r .access_token)

curl -s "$SUPABASE_URL/rest/v1/pesticide_applications?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Profile: turfsheet"
```

A bare anon-key query is still worth running — but from step 4 on it answers "is the site
locked?", not "what does the browser see?"

### Per-table pattern

```sql
DROP POLICY IF EXISTS "<existing_anon_policy_name>" ON turfsheet.<table>;

CREATE POLICY "<table>_authenticated_all" ON turfsheet.<table>
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

REVOKE ALL ON turfsheet.<table> FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.<table> TO authenticated;
```

Policy names must be read from `pg_policies` first — they are not uniform across migrations.

### The one deliberate exception

`turfsheet.banbury_pin_set_by_token(TEXT)` is `SECURITY DEFINER` and granted to `anon`
(`supabase/migrations/20260728140000_create_banbury_pin_sets.sql:54-69`). It reads the table with
the owner's rights, so it **keeps working after the table is locked**.

`anon` keeps `EXECUTE` on this function and nothing else.

Verified: `courseGeometry.ts` makes zero Supabase calls — hole geometry is bundled in the JS. The
anonymous handout path therefore needs exactly this one privilege and no table reads at all.

## Part 2 — Frontend

Base path is `/turfsheet` (`src/main.tsx:9`).

1. **Auth context** — provider near the root holding `session` and `loading`. Calls
   `supabase.auth.getSession()` on mount, subscribes to `onAuthStateChange`. Session persistence
   and token refresh are handled by `supabase-js`; do not reimplement.

2. **Login page** — email, password, submit, error line. Nothing more.

3. **Gate** — wrapper inside `App.tsx` (routes at `App.tsx:34-89`) around the app shell.
   Three states: checking → spinner; no session → login; session → app as it exists today.
   No existing page changes.

4. **Anonymous exemption** — `/maps` with a `pinToken` query param renders without a session.
   Checked **before** the gate resolves, so clubhouse visitors never see a login flash.
   The exemption is the **token, not the route** — bare `/maps` still requires login, otherwise
   the pin editor stays public and nothing has been fixed.
   Token is read at `src/pages/MapsPage.tsx:110`.

5. **Logout** — `Sidebar.tsx:34` already renders a Logout item pointing at `/logout`, which is a
   dead link today. Add the route; call `supabase.auth.signOut()`.

## Part 3 — Rollout

**Order is load-bearing.** Reversing steps 3 and 4 takes production down.

1. Create three accounts in Supabase Studio (`admin@banbury.local`, `super@banbury.local`,
   `staff@banbury.local`) with email confirmation off. Passwords set by hand.
2. Merge the frontend gate. Merging to `main` auto-deploys via GitHub Actions.
3. On production: confirm all three accounts log in, and that a `?pinToken=` link still resolves
   in a signed-out browser.
4. **Only then** apply `supabase/migrations/20260807200000_lock_down_anon_access.sql` by pasting
   it into the Supabase Studio SQL editor. It is wrapped in `BEGIN`/`COMMIT`, so a mistake in
   any statement aborts the whole thing. Then re-run `scripts/verify-anon-lockdown.mjs`.

Step 4 before step 3 blanks every page for everyone — the app would still be querying as `anon`
while `anon` has just lost its grants. The frontend gate is harmless alone; the RLS change is the
irreversible half.

### Migration mechanics

- **Never `npx supabase db push`** on this project. History is out of sync; a push has already
  cost this repo 12 tables once. Use `db query --linked -f` or Supabase Studio.
- **Never `git add .`** — the six untracked memory/pgvector migrations follow this branch and
  must not ride along. Stage explicit paths.
- **Passwords never enter the repo** — not in a migration, not in a doc, not in a commit.
  This repo already has one committed connection string needing rotation
  (`.agent/Tasks/completed/2026-02/`); do not add a second.

## Verification

### Database — `scripts/verify-anon-lockdown.mjs`

The test that matters is not clicking around — it is PostgREST hit directly with the anon key.
The script does this for all 24 tables plus the RPC:

```bash
node scripts/verify-anon-lockdown.mjs --token <a valid pinToken>
```

Against production, lift the key from the deployed bundle:
`SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/verify-anon-lockdown.mjs`

- Run before applying the migration → 18 of 24 OPEN (baseline captured 2026-08-07).
- Run after → 0 OPEN, and the pin handout RPC still `WORKS`. Exit code 0.

### Frontend — verified locally 2026-08-07

`chrome:console` and `playwright:screenshot` both hang in this environment. Headless Chrome
directly does work and was used instead:

```bash
google-chrome --headless --no-sandbox --disable-gpu --virtual-time-budget=8000 \
  --user-data-dir=/tmp/prof --dump-dom "http://localhost:5179/turfsheet/"
```

| URL | Rendered | Result |
|---|---|---|
| `/turfsheet/` | login form, no sidebar | pass |
| `/turfsheet/maps` (bare) | login form | pass — the pin editor is not public |
| `/turfsheet/maps?pinToken=<20 chars>` | app + map, no login | pass |
| `/turfsheet/maps?pinToken=tooshor` | login form | pass — short tokens are not an exemption |

**Not verified: a successful login.** No accounts exist yet (rollout step 1 is Chris's). All
three accounts logging in is still an open check for step 3.

## Risks

- **Production may be running untracked code.** The 2026-07-28 audit found a deploy from
  `/home/wpauser/src/turfsheet`, a clone not on this machine and not on `origin/main`. Confirm
  before merging or the gate may be silently overwritten.
- **A missed table stays wide open.** Hence enumerating from the live DB and curl-verifying each.
- **Shared accounts mean no attribution.** A bad edit cannot be traced to a person. Accepted for
  now; this is the main reason to move to per-person accounts later.

## Rollback

`supabase/rollback/20260807200000_lock_down_anon_access.down.sql` restores the exact policies and
grants that were live on 2026-08-07. It lives outside `supabase/migrations/` on purpose — a
migration run must never pick it up, since applying it re-opens the whole database.

## Out of scope (deliberate)

- Per-person accounts and a `staff` ↔ `auth.users` link (`staff` has no email column today)
- Role differentiation between `admin` / `super` / `staff`
- Password reset self-service (requires SMTP; manual reset in Studio for now)
- Audit logging / attribution
- OldTom's authentication path — still open, see `planned.md` Task 0
