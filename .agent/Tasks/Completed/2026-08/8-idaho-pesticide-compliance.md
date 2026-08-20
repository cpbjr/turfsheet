# Task 8 - Idaho Pesticide Record-Keeping Compliance ✅

**Completed**: 2026-08-12
**Merged**: 2026-08-12 as PR #39 (`0abad6e`). Branch `feature/idaho-pesticide-compliance` trimmed.
**Stage closed**: 2026-08-19 — Christopher marked the compliance stage done. Follow-on delete-by-role is `planned.md` Task 8.
**Compliance review**: `tmp/idaho-pesticide-recordkeeping-compliance.md`

## What Was Done

Audited the pesticide application log against Idaho's actual record-keeping rule
(IDAPA 02.03.03.101.01, authority Idaho Code § 22-3421) and closed the gaps. The printed log
was asserting compliance in its footer while missing 5 of the 15 required elements; it now
captures all 15, and the records are protected from deletion inside the 2-year retention window.

## Key Changes

- **Five missing IDAPA elements now captured** — course location (c), WPS contact name/date/time
  (n), and supervising applicator name + license (o). Added as columns on
  `pesticide_applications` plus a `course_settings` singleton table for the property address.
- **Applicator license moved to `staff` and autofilled** — element (m) was free text re-typed per
  application, so it was blank on every record. It now lives on the staff member and fills in when
  they are selected as operator. Added the input to the staff form.
- **Records are protected for 2 years** — a `BEFORE DELETE` trigger refuses to delete any record
  dated within the retention window, and an audit table records every edit and delete. Neglecting
  to keep records and falsifying them are both prohibited acts under Idaho Code § 22-3420, so the
  database enforces this rather than trusting the UI.
- **Footer citation corrected** — previously cited the statute chapter; the operative list is the
  IDAPA rule. Corrected *last*, deliberately, after the gaps behind the claim were closed.
- **Delete rejection surfaces in the right place** — the message was being written to page-level
  error state, which blanked the entire application list; then, once scoped to the modal, it
  rendered above the fold in a scrolling body so a click looked like it did nothing. Both fixed.

## Notes

**Migrations were applied by hand via `db query --linked -f`**, not `db push` — this project's
migration history contains 20+ `DROP TABLE` statements and a bulk repair cost it 12 tables in
February. Verified empirically afterward: columns present, RLS on, retention trigger actually
firing (error 23514), audit table actually writing, and all 13 applications / 32 product lines
intact.

**Still open — a data step, not code:** applicator licenses must be entered per staff member
(Staff → Edit → Applicator License #). Element (m) prints `--` until then, and the footer's claim
is only fully true once it is populated.

**Not browser-verified.** `chrome:console` times out in this environment and headless Chrome stops
at the login form, so every UI change was verified by `tsc -b` / build / lint / unit tests and code
reading, then hand-tested by Chris. That gap is what allowed the off-screen error banner to ship in
the first place.

**Deliberately out of scope:** `rei_hours = 0` on every product. REI is 40 CFR 170 and label
accuracy, not IDAPA 101 — it stays on the chemicals-page backlog rather than inheriting compliance
priority.
