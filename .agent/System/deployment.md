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
- `SSH_PRIVATE_KEY`
- `SSH_USER` (deploy)
- `SERVER_HOST` (5.78.128.255)

## Manual Trigger

GitHub Actions → "Deploy TurfSheet to Hetzner" → "Run workflow"

## Common Failure: TypeScript Errors

The CI runs `tsc -b` before `vite build`. Vite dev server is more lenient than `tsc`.
Always run `npx tsc -b --noEmit` locally before pushing to catch type errors.

## Base Path

Vite config uses `base: '/turfsheet/'` for subpath serving.

*Last Updated: 2026-02-24*
