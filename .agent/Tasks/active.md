## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from
   Implementation/ to Completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-08-20

Shipped work lives in `Completed/`. Last board cleanup: `Completed/2026-08/9-active-board-cleanup.md`.
Idaho pesticide stage is done (`Completed/2026-08/8-idaho-pesticide-compliance.md`). Role-gated delete is `planned.md` Task 8.

**Standing warnings — not tasks:**
- `npx tsc --noEmit` is a no-op. Use `tsc -b` or `npm run build`.
- Do not run `git add .`. Untracked paused migrations sit in `supabase/migrations/`.
- Do not run `npx supabase db push`. Use Studio SQL or `db query --linked -f`.
- No working browser automation here. UI is hand-tested by Chris.
- MCP `supabase:sql` is broken (`Unknown project: turfsheet`). Use the Management API.

## Open Work

| Item | Blocking? | Gist |
|------|-----------|------|
| Chemical inventory v1 | No | Plan written. Not built. Awaits approve then Cody. |
| Chemicals REI hours | No | Every product is `rei_hours = 0`. Label walk first. |
| Applicator licenses | No | Column shipped. Numbers still blank. Print shows `--` on old rows. |
| Pin handout token | No | All `public_token` null. Anon path untested with real data. |
| Pesticide snapshot cleanup | No | Drop pre-split rollback table when the event model is permanent. |
| Maps tap-cycle | No | Re-test on `/pins` Setup Map. Do not fix `/maps`. |
| Google Maps key / localhost | Blocks local `/maps` | `RefererNotAllowedMapError`. |
| Credential scrub | Security | Postgres password committed in `Completed/2026-02/*.md`. Rotate and scrub. |

### Chemical inventory v1

Plan: `Implementation/2026-08-20-chemical-inventory.md`

Product story: vault `Bob/WPA-Work/projects/03-turfsheet-spray/darryl-inventory-summary-2026-08-12.md`.

v1: numeric spray amounts, `quantity_on_hand` + unit on `chemical_products`, `chemical_stock_moves`, subtract on save, show on-hand on the product list. No new inventory page. Receive, lots, OldTom PO are later.

- [ ] Christopher approves the plan and the four open questions (seed at 0, one unit per product, allow negative, keep moves table).
- [ ] Cody on `feature/chemical-inventory`.
- [ ] Ricky reviews. Bob reports. Christopher says ship.

Do not start code until approve.

### Chemicals leftovers

Plan (shipped code): `Completed/2026-07/1-chemicals-page-clean-up.md`
Leftover plan notes: `Implementation/2026-07-28-chemicals-clean-up.md`

- [ ] Confirm REI hours against physical labels, then apply `supabase/migrations/20260728120100_set_product_rei_hours.sql` via Studio. Proposed values are unverified. Do not invent them.
- [ ] Optional: update the 2026-07-28 Cutrine record from `granular` / blank equipment to Broadcast (By Hand) / By Hand.

### Applicator licenses (data)

Context: `Completed/2026-08/8-idaho-pesticide-compliance.md`

- [ ] Enter each applicator's license number under Staff → Edit → Applicator License #.
- Print reads the snapshot on the application row. Old rows stay `--` until those rows are updated.

### Pin handout token

Context: `Completed/2026-08/1-site-authentication.md`

- [ ] Publish a handout link from `/pins` (Delivery).
- [ ] `node scripts/verify-anon-lockdown.mjs --token <token>` should report `WORKS`.
- [ ] Load `/turfsheet/maps?pinToken=<token>` signed out and confirm greens render.

### Pesticide snapshot cleanup

Context: `Completed/2026-08/2-pesticide-event-model.md`

Keep `turfsheet.pesticide_applications_pre_split_20260810` until rollback of the A→B split is no longer needed. Dropping it is irreversible for full pre-split restore.

- [ ] Confirm no need to roll back.
- [ ] Drop the table via Studio SQL.
- [ ] Remove it from `TABLES` in `scripts/verify-anon-lockdown.mjs`.
- [ ] `node scripts/verify-anon-lockdown.mjs` exits 0.

### Maps

Feature live at `/turfsheet/maps`. Pin listener work: `Completed/2026-08/3-pin-map-click-listener.md`.
Parity checklist: `Implementation/2026-07-28-maps-banbury-course-map.md`.

- [ ] Re-test two-quick-taps on `/pins` → Setup → Map. `/maps` has `pinMode={false}` and no click listener. Do not attempt a third blind fix on `/maps`.
- [ ] Fix Google Maps key referrers for local Vite (`http://localhost:5179/*`, LAN/Tailscale if still needed). `.env.local` must match the key in GCP.

### Credential scrub

- [ ] Rotate the Postgres password that was committed in `Completed/2026-02/*.md`.
- [ ] Scrub those files. Do not copy the secret into new notes.

Upcoming (not active): see `planned.md`. Caddyfile is Task 0.1. Staff scheduling is parked.
