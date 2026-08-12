# Idaho Pesticide Record-Keeping Compliance

Date: 2026-08-12
Branch: `feature/idaho-pesticide-compliance`
Review: `tmp/idaho-pesticide-recordkeeping-compliance.md`
Rule: IDAPA 02.03.03.101.01(a)-(o), 2-year retention. Authority: Idaho Code § 22-3421.
Enforcement: § 22-3420 (neglecting to keep records; false or misleading records).

## Decisions (confirmed by Chris 2026-08-12)

1. **Location format:** street address. Stored once at course level, printed in the log header.
   `area_applied` continues to satisfy (b) *property treated*; the course address satisfies
   (c) *location of the property treated*. Both are required and they are not the same element.
2. **Applicator license:** fix forward only. **Do not backfill history.** Existing blank rows stay
   blank — never rewrite an existing regulatory record.
3. **Immutability:** block hard deletes within retention + audit every edit.
4. **Apprentice (n):** build the fields, leave optional and unenforced. Not known to apply today.

## Success criteria

- [ ] Printed log carries a course address → verify: print log, header shows address
- [ ] New applications autofill license from operator → verify: create app, License # populated
- [ ] Historical rows unchanged → verify: row count with blank license identical before/after
- [ ] WPS captures contact name + date + time → verify: fields persist and print
- [ ] Hard delete blocked inside retention → verify: delete attempt fails at DB level
- [ ] Edits recorded in audit table → verify: edit an app, audit row appears
- [ ] Footer citation corrected → verify: string reads IDAPA 02.03.03.101 / § 22-3421
- [ ] `npx tsc -b` clean (NOT `tsc --noEmit` — no-op in this repo)
- [ ] `npm run lint` no new errors

## Step 1 — Course location (101.01(c)) — the blocking gap

`settings.location` exists but persists to **localStorage only** (`SettingsContext.tsx:12,25`) —
per-browser, lost on cache clear. Unusable as the source of a regulatory record. Needs a real table.

- Migration: `turfsheet.course_settings` — single-row table, street address + optional
  township/range/section and lat/long columns for later.
- Read it in `PesticidePage`, pass into both export paths, print in the log header.
- **Ships empty until Chris supplies Banbury's address.** Log header must degrade gracefully
  (omit the line rather than print a misleading blank).

## Step 2 — Applicator license (101.01(m))

- Migration: add `applicator_license` to `turfsheet.staff`.
- `PesticideForm`: on operator select, autofill `event.applicator_license` from staff.
- Keep the per-event column — it is the record of what was true at application time.
- **No backfill.** No UPDATE against existing `pesticide_applications` rows.

## Step 3 — WPS exchange (101.01(o))

Rule wants contact *name*, *date*, and *time* — currently a bare boolean + free text.
- Migration: `wps_contact_name`, `wps_contact_date`, `wps_contact_time`.
- Form: reveal the three fields when `worker_protection_exchange` is checked.
- Export: replace the ✓/✗ WPS column with contact + timestamp.

## Step 4 — Apprentice supervisor (101.01(n))

- Migration: `supervisor_name`, `supervisor_license` on the event. Optional, unenforced.
- Form: an optional "Supervising applicator (if apprentice)" pair.

## Step 5 — Retention & audit (101.01 / § 22-3420)

- Migration: `pesticide_application_audit` (row id, action, changed_by, changed_at, old/new JSONB).
- Trigger on UPDATE/DELETE of events and product lines.
- Block hard DELETE inside 2 years — a `BEFORE DELETE` trigger raising an exception is the
  simplest enforcement that cannot be bypassed from the client.
- **Consult before applying:** deletes are currently permitted from the UI. Confirm the UX
  before shipping a hard block.

## Step 6 — Correct the printed citation (§ 22-3420 posture)

`pesticideLogExport.ts:178` and `:226` print a compliance assertion on every page.
- Cite **IDAPA 02.03.03.101** and **Idaho Code § 22-3421** specifically.
- Do this **last**, once the gaps above are closed, so the claim is true when it ships.

## Out of scope

- `rei_hours = 0` — label/WPS (40 CFR 170) accuracy, **not** an IDAPA 101 element. Separate task.
- Customer name/address (101.01(a)) — a self-applying course has no external customer.
  Document the reasoning; revisit if Banbury ever applies for a third party.
- RUP 30-day copy (101.02) — no RUP flag exists on products; inapplicable while self-applying.

## Migration safety

**Never `npx supabase db push`** on this project (history hazard — see
`Completed/2026-07/1-chemicals-page-clean-up.md`). Use `db query --linked -f` or the Management
API. Stage explicit paths — six untracked pgvector migrations must not be swept in.
