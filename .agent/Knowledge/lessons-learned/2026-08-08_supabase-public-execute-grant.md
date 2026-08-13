# REVOKE ... FROM anon does not lock a Postgres function
Date: 2026-08-08

## Context

Locking TurfSheet down so the anon key bundled in every client build could no longer read
anything. Tables were handled with policy rewrites plus `REVOKE ALL ... FROM anon`. Two
`SECURITY DEFINER` functions needed attention: `banbury_pin_set_by_token` (keep — it is the
clubhouse handout) and `match_memory_chunks` (close — it vector-searches the memory corpus).

## Problem

`REVOKE EXECUTE ON FUNCTION turfsheet.match_memory_chunks(...) FROM anon;` ran without error and
changed nothing. anon calling the RPC still returned **HTTP 200** after the lockdown.

Postgres grants `EXECUTE` on new functions to `PUBLIC` by default, and Supabase leaves that in
place. `anon` is a member of `PUBLIC`, so it inherits the privilege no matter what you revoke
from `anon` directly.

The ACL says so plainly, and it is easy to read past:

```
{=X/postgres, postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres}
 ^^^^^^^^^^^^ a bare leading "=" is the grant to PUBLIC
```

Revoking from `anon` removes `anon=X` and leaves `=X` — which is the one that mattered.

This bites specifically on `SECURITY DEFINER` functions. Those execute with the owner's rights,
so a table lockdown does not constrain them at all. A locked-down database with an open
`SECURITY DEFINER` RPC is not locked down.

## Solution

```sql
REVOKE EXECUTE ON FUNCTION turfsheet.match_memory_chunks(
    turfsheet.vector, integer, double precision, text, text, text, text
) FROM PUBLIC;
```

Roles holding explicit grants (`authenticated=X`, `service_role=X`) are unaffected — only the
inherited path closes. Confirmed: anon now gets `42501 permission denied for function`.

## Future Application

- **`REVOKE ... FROM anon` on a function is almost never sufficient on Supabase.** Revoke from
  `PUBLIC`, then grant back explicitly to the roles that should keep it.
- **Read the ACL, not the migration's exit status.** DDL that revokes a privilege the role never
  held directly succeeds silently and closes nothing.
- **Verify with `has_function_privilege(...)` after applying**, and better, with a real request:

  ```sql
  select has_function_privilege('anon', 'schema.fn(argtypes)', 'EXECUTE');
  ```

  Both migrations here now assert their own outcome in a `DO $$ ... $$` block so a future change
  that quietly re-opens or over-revokes fails loudly instead of reporting success.
- **Audit `SECURITY DEFINER` functions separately from tables** whenever locking a schema down.
  Find them with:

  ```sql
  select p.proname, p.prosecdef, p.proacl
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = '<schema>' and p.prosecdef;
  ```

See `Tasks/Completed/2026-08/1-site-authentication.md`.
