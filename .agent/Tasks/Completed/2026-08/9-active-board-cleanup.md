# Active board cleanup

**Completed:** 2026-08-20
**Why:** `Tasks/active.md` still listed shipped work, an index of `Completed/`, and tooling notes that are not TurfSheet app tasks.

## Moved off active

These are done, already recorded, or not work in this repo.

| Item | Where it lives now |
|------|-------------------|
| Idaho pesticide compliance stage | `Completed/2026-08/8-idaho-pesticide-compliance.md` (PR #39) |
| Site auth, event model, pin listener, pin mobile, nudge card, skip button, eslint | `Completed/2026-08/1` through `7` |
| Chemicals page clean-up (code) | `Completed/2026-07/1-chemicals-page-clean-up.md` |
| Banbury map merge, pin sheet redesign | `Completed/2026-07/` |
| Production untracked-code check | Resolved 2026-08-08. Deploys from this repo via GitHub Actions. |
| Recently Completed index on `active.md` | Removed. Read `Completed/` instead. |
| Archived: site style guide | Done. Not a live task. |
| Archived: TurfSheet on whitepine-tech.com | Done. Not a live task. |

## Documented, not a TurfSheet code task

Left as standing warnings on `active.md` only, not as open work.

- `npx tsc --noEmit` is a no-op. Use `tsc -b` or `npm run build`.
- Do not `git add .` (paused migrations under `supabase/migrations/`).
- Do not `npx supabase db push`.
- Claude `chrome:console` / extension is dead here. UI is hand-tested.
- MCP `supabase:sql` `Unknown project: turfsheet`. Use Management API for SQL.
- OldTom anon-key check now means "is the site locked?" not "what does the browser see?" Recipe stays in `Completed/2026-08/1-site-authentication.md`. Changing OldTom is not this repo.

## Still live (kept on `active.md`)

Chemical inventory v1, REI label walk, applicator license data, pin handout token, pre-split snapshot drop, maps re-test / localhost key, credential scrub.
