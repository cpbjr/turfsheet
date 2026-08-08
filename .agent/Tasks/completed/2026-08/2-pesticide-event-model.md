# Task — Pesticide Event Model ✅

**Completed**: 2026-08-07 (prod verified after Migration B)

## What Was Done

Pesticide applications are now first-class **spray events** with **product line items**, instead of one DB row per chemical and inferred tank-mix grouping. The log shows real application counts; shared ops fields live once; regulator export still emits one row per product line with the same 24 columns.

## Key Changes

- **Migration A** (`20260810000000`): child table `pesticide_application_products`, backfill 32 product rows → 13 events, snapshot for rollback, drop NOT NULL on parent product columns. Applied via Studio and verified V1–V7.
- **Migration B** (`20260812000000`): dropped legacy product columns from parent. Applied after frontend soak; edit/save verified in production.
- **Frontend**: nested load/save (`pesticideData.ts`), multi-product form, expandable event rows, REI = longest in mix, calculator hand-off as `{ event, lines }`. Removed `pesticideMix` cascade and dead `ApplicationPrintView`.
- **PR #30** merged to main (`ac8edf0`). Anon lockdown covers new tables.

## Notes

- Snapshot `pesticide_applications_pre_split_20260810` still retained for full-split rollback — **Task 9 cleanup** remains in `active.md` (drop snapshot + remove from verify script when no longer needed).
- Do not use `supabase db push` on this project; Studio SQL only.
- Implementation plan was `Implementation/2026-08-07-pesticide-event-model.md` (removed on archive).
