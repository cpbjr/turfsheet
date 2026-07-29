# TurfSheet Deployment

## Architecture

- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
- **Trigger:** Push to `main` branch (changes in `turfsheet-app/**`)
- **Production Server:** WhitePineTech (Hetzner Cloud) - `5.78.128.255`
- **Reverse Proxy:** Caddy 2 (automatic SSL via Let's Encrypt)
- **Live URL:** `https://whitepine-tech.com/turfsheet/`

## Deployment Pipeline

1. Checkout code from `main`
2. Setup Node.js 18 + npm cache
3. `npm ci` (install exact deps)
4. `npm run build` (tsc + vite build) — injects Supabase secrets from GitHub Secrets
5. SCP `dist/*` → `/home/deploy/websites/turfsheet/` on production
6. SSH restart Caddy: `docker compose restart caddy` (in `/home/deploy/gateway`)
7. Curl health check against live URL

## Required GitHub Secrets

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY` (added 2026-07-29 — required by `/maps`; Vite inlines
  `import.meta.env` at build time, so without it the bundle throws `MissingMapsKeyError`)
- `SSH_PRIVATE_KEY`
- `SSH_USER` (deploy)
- `SERVER_HOST` (5.78.128.255)

## Deployment Workflow (Branch → PR → Merge)

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit and push branch
3. Open PR against `main` (via `gh pr create` or GitHub UI)
4. Merge PR → triggers GH Actions automatically (no manual step needed)
5. Monitor at: https://github.com/cpbjr/turfsheet/actions

**Note:** This project uses GitHub Actions + Hetzner. It is NOT on Vercel.

## Manual Trigger

GitHub Actions → "Deploy TurfSheet to Hetzner" → "Run workflow"

## Common Failure: TypeScript Errors

The CI runs `tsc -b` before `vite build`. Vite dev server is more lenient than `tsc`.
Always run `npx tsc -b --noEmit` locally before pushing to catch type errors.

## Base Path

Vite config uses `base: '/turfsheet/'` for subpath serving.

---

## Gateway / Caddy Routing

**Caddy is a container, not a host service.** `systemctl is-active caddy` reports inactive and
`/etc/caddy/Caddyfile` does not exist on the host — both are dead ends.

| Thing | Location |
|-------|----------|
| Container | `gateway-caddy-1` (image `caddy:2-alpine`), owns :80 / :443 |
| Config (host) | `/home/deploy/gateway/Caddyfile` → mounted to `/etc/caddy/Caddyfile` |
| Static sites | `/home/deploy/websites/<name>` → mounted at the same path |
| Compose project | `/home/deploy/gateway` |

Each frontend is a route block:

```
route /turfsheet* {
    uri strip_prefix /turfsheet
    root * /home/deploy/websites/turfsheet
    try_files {path} {path}/ /index.html
    file_server
}
```

### Changing routing safely

Always validate before reloading — a syntax error takes **every site on the box** down, not just
TurfSheet.

```bash
ssh whitepine
cp /home/deploy/gateway/Caddyfile /home/deploy/gateway/Caddyfile.bak-$(date +%F)
# edit /home/deploy/gateway/Caddyfile
docker exec gateway-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec gateway-caddy-1 caddy reload  --config /etc/caddy/Caddyfile
```

### ⚠️ The Caddyfile is not in version control

It exists only on the server. **Any host rebuild or redeploy of `/home/deploy/gateway` from source
silently reverts routing changes**, including the `/banbury-map` retirement below — which would
resurrect the retired app and restart it writing to the old database. Getting this directory into
a repo is an open task (see `Tasks/planned.md`).

### Retired routes

**`/banbury-map` — retired 2026-07-29.** Superseded by TurfSheet `/turfsheet/maps`. Its route is now:

```
route /banbury-map* {
    redir * /turfsheet/maps?{query}
}
```

- **302, not 301** — browsers cache 301 permanently, which would make this hard to undo.
- **Query string preserved** so printed `?pinToken=` QR clubhouse handouts still resolve.
- Backup: `/home/deploy/gateway/Caddyfile.bak-2026-07-29-retire-banbury`
- Standalone files remain at `/home/deploy/websites/banbury-map` (unreachable, not deleted).
- Its `config.js` there still holds a **live Google Maps key with no consumer** — revoke or restrict.
- Source table `wpa.banbury_pin_sets` (project `white-pine-projects`) is orphaned but still live.
  Verified 2026-07-29: it and `turfsheet.banbury_pin_sets` held identical rows, so nothing was
  stranded by the cutover.

*Last Updated: 2026-07-29*
