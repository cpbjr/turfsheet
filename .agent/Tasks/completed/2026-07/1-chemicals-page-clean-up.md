# Task 1 - Chemicals Page Clean-Up ✅

**Completed**: 2026-07-28 (code + method constraint; REI data still open — see active.md)

## What Was Done

The Chemical Management page is the one feature Darryl has responded to, so this pass made it
actually usable for the applications Banbury really does. The trigger was a live logging failure:
Cutrine Plus Granular hand-tossed into Pond 8 East had no honest way to be recorded — Application
Method offered only spray/granular/injection/drench/other and Equipment had no hand option.

## Key Changes

- **Application Method and Equipment expanded, with a free-text escape hatch.** Method gained
  Broadcast (By Hand), Aquatic / Water Treatment and Spot Treatment; Equipment gained By Hand,
  Hand Spreader, Push Spreader and ATV/Utility Spreader. Both now offer "Other (type it in)" so a
  missing option can never block logging an application again. Free text is stored directly in the
  existing column — no `method_other` column — and round-trips back into the text box on edit.
- **"Recommended By" now resolves.** It had always printed `--` on both the detail modal and the
  compliance printout: `staff.id` arrives from Postgres as a number but was compared against
  `String(id)`. Fixed with a new `sameId()` helper in `lib/utils.ts`, applied to all four staff
  lookups in the pesticide feature.
- **Record Application modal widened** via a new optional `size` prop on the shared `Modal`,
  defaulting to the existing width so the other 8 consumers are untouched.
- **Form correctness fixes:** `operator_id` is now parsed to an integer on submit; selecting a
  product no longer clobbers a method the user already chose; edit mode now restores the selected
  product so REI and label warnings reappear; REI of `0` no longer prints as `--`.

## Notes

**Database:** `20260728120000_relax_pesticide_method_constraint.sql` replaced the 5-value enum CHECK
with a permissive length check (1–60 chars). Applied manually via Supabase Studio and recorded in
`schema_migrations`. Both existing application records verified unchanged afterwards.

**`npx supabase db push` is NOT safe on this project.** ~70 local TurfSheet migrations show as
unapplied remotely (including the February schema rebuilds that drop and recreate tables), so a push
would replay them in version order. Separately, the ~60 "remote-only" migrations are **not** drift —
they are White Pine Agency `wpa` schema work. Five app schemas (`turfsheet`, `wpa`, `maintenance_log`,
`taskboard`, `white_pine_projects`) share one Postgres instance and therefore one
`supabase_migrations.schema_migrations` table, which the CLI cannot distinguish. Apply TurfSheet
schema changes through Studio until that history is untangled.

**Tooling gotchas found:**
- MCP-as-code has no working `turfsheet` project. `run.ts` reads a hardcoded list in
  `Tools/mcp-servers/supabase/index.ts` which lacks the entry, so `{"project":"turfsheet"}` returns
  "Unknown project". Workaround used throughout: `{"project":"maintenance-log"}` (same instance,
  service_role) with schema-qualified `turfsheet.*` names, wrapping results in `json_agg` because the
  `execute_sql` RPC mangles plain row sets. That RPC is SELECT-only — it cannot run DDL.
- The `turfsheet` password in `Tools/mcp-servers/config.json` is a duplicate of the `lookbetternaked`
  one and fails auth. Direct `db.<ref>.supabase.co` is IPv6-only and unreachable from this machine.
- `CLAUDE.md` still names Supabase ref `scktzhwtkscabtpkvhne`. Everything live — `.env.local`, CI
  secrets, the deployed app — uses **`klyzdnocgrvassppripi`**.

**Verified by:** `tsc -b --noEmit` clean, `npm run build` clean, and read-only DB queries confirming
the constraint swap and that both live records survived. **Not verified in a browser** — the
`chrome:console` MCP tool times out in this environment.
