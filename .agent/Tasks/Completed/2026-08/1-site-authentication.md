# Task 1 — Site Authentication ✅

**Completed**: 2026-08-08
**Branch**: `feature/site-auth`, `fix/sidebar-logout-clipped`, `fix/revoke-public-execute-match-memory-chunks`
**PRs**: #27 (auth gate), #28 (logout clipping + verify script), #29 (PUBLIC execute revoke)
**Source task**: `planned.md` Task 0

## What Was Done

TurfSheet was public to anyone with the URL — staff records, job assignments, and the pesticide
log (a regulated record) included. It is now behind a login, and the anon key that ships in every
client bundle can no longer read anything.

Deliberately **a lock, not an identity system**: three shared role accounts, no per-person
attribution, no self-signup. See *Accepted tradeoffs*.

## Key Changes

**Frontend** (no existing page changes)
- `contexts/AuthContext.tsx` — session + loading, mirroring `supabase-js` via `onAuthStateChange`;
  persistence and token refresh left to the library
- `pages/LoginPage.tsx` — email, password, error line
- `components/AuthGate.tsx` — wraps the app shell: checking → spinner, no session → login
- `pages/LogoutPage.tsx` + `/logout` route — wires up the Sidebar item that was a dead link
- `Sidebar.tsx` — Logout pinned outside the scroll area. It had been rendering all along but was
  clipped below ~880px viewports; only became visible as a bug once the link worked.

**Anonymous exemption** is the `pinToken`, **not** the `/maps` route — bare `/maps` still demands
login, or the pin *editor* would stay public. Checked before the session resolves so clubhouse
visitors see no login flash.

**Database** — `20260807200000_lock_down_anon_access.sql` + `20260808030000_revoke_public_execute_match_memory_chunks.sql`
- 24 tables (not the 22 in the design — see *Corrections*), 55 permissive policies replaced with
  `authenticated`-only, all `anon` table grants revoked
- `anon` keeps exactly two privileges: `USAGE` on the schema, and `EXECUTE` on
  `banbury_pin_set_by_token` (`SECURITY DEFINER`), which is what keeps the handout working
- Rollback: `supabase/rollback/20260807200000_lock_down_anon_access.down.sql`, deliberately
  outside `migrations/` so no migration run can re-open the database

## Corrections the live database forced on the design

The plan said to enumerate from the live DB rather than migration files. That paid off twice:

1. **24 tables, not 22.** The three `memory_*` tables are live — those migrations were applied
   even though the files are still untracked. Excluding them would have left the entire memory
   corpus readable. `blocked.md` describing them as "never-applied" is wrong.
2. **`second_job_assignments` does not exist.** Migration-file artifact.

## Verification

`scripts/verify-anon-lockdown.mjs` — hits PostgREST directly with the bundled anon key, which is
the only test that means anything here, since nobody attacking this has to touch the React app.

| | Before | After |
|---|---|---|
| Tables readable by anon | 18 of 24 | **0 of 24** (hard `401`) |
| `match_memory_chunks` via anon | HTTP 200 | `42501` denied |
| Pin handout RPC | works | works |
| `authenticated` policies + grants | — | all 24 tables |

Frontend verified with headless Chrome (`chrome:console` and `playwright:screenshot` both hang in
this environment — `google-chrome --headless --dump-dom` does not):

| URL | Rendered |
|---|---|
| `/turfsheet/` | login form, no sidebar |
| `/turfsheet/maps` (bare) | login form |
| `/turfsheet/maps?pinToken=<20 chars>` | app + map, anonymous |
| `/turfsheet/maps?pinToken=tooshor` | login form |

Chris confirmed real sign-in on production 2026-08-08 after the lockdown.

## Accepted tradeoffs

- **No attribution.** Shared accounts mean a bad edit cannot be traced to a person. This is the
  main reason to move to per-person accounts later.
- **A pre-existing fourth account** (`christopher@whitepineagency.com`) also has full access —
  `auth.users` is per-project, and every `authenticated` user is granted everything.
- **No password reset self-service** (needs SMTP; manual in Studio).
- **No role differentiation** between `admin` / `super` / `staff` — they exist so roles can split
  later without recreating anyone.

## Also resolved

**Production is not running untracked code.** The 2026-07-28 audit's claim of a deploy from
`/home/wpauser/src/turfsheet` does not hold: no such clone exists on the server, and the live
bundle matched `origin/main`. Verified before merging.

**`CLAUDE.md` had a stale Supabase ref** (`scktzhwtkscabtpkvhne`); corrected to
`klyzdnocgrvassppripi`.

## Plans (archived this note; source plan removed from Implementation/)
- `2026-08-07-site-authentication.md`

## Notes
- **Never `supabase db push`** on this project — history is out of sync. Both migrations were
  applied by hand via the Studio SQL editor.
- Lesson recorded: `Knowledge/lessons-learned/2026-08-08_supabase-public-execute-grant.md`
- Follow-ups tracked in `active.md`: OldTom's anon diagnostic, and publishing a real handout token
