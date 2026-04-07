# Deployment (free VPS friendly)

This directory contains templates for running the PrivacyTests mirror with:

- **Caddy** as reverse proxy (automatic TLS)
- **systemd** units for persistent startup/restart
- **`deploy/provision-vm.sh`** to bootstrap a fresh Ubuntu VM

For the full fresh-VM recipe used by the current mirror fork, including DNS,
helper subdomains, GCE firewall rules, and a summary of the mirror-specific
repo changes, see:

- [deploy/MIRROR_BOOTSTRAP.md](/home/ilkyu/workspace/privacytests.org/deploy/MIRROR_BOOTSTRAP.md)
- [docs/fork-delta.md](/home/ilkyu/workspace/privacytests.org/docs/fork-delta.md)

## Services and ports

The live stack uses these listeners:

- `live/caching.js` → `127.0.0.1:3333`
- `live/params.js` → `127.0.0.1:3334`
- `live/results.js` → `127.0.0.1:3335` and WebSocket `127.0.0.1:3336`
- `live/tls.js` → `:8900`
- `live/h1.js` → `:8901`
- `live/h2.js` → `:8902`

## Reverse proxy routing

`deploy/caddy/Caddyfile.template` includes:

- optional `ENTRY_SITE_LABELS` for a separate static `/me.html` entry host
- `/runtime-config.js` generated from provisioned runtime roots
- `/` static content from `static/`
- `/live/*` → `live/caching.js` backend
- `/post`, `/step`, `/me` (and `/results`) → `live/results.js`
- `/healthz` → `live/results.js`

## Health-check contract (for CI post-deploy)

Endpoint:

- `GET https://<PRIMARY_DOMAIN>/healthz`

Expected:

- HTTP status: `200`
- Body JSON exactly:

```json
{"ok":true,"service":"results"}
```

Example check:

```bash
curl -fsS https://<PRIMARY_DOMAIN>/healthz | jq -e '.ok == true and .service == "results"'
```

## systemd templates

`deploy/systemd/` provides two operating modes:

1. **Split-process mode (recommended for reliability)**
   - Individual unit files per listener/API.
   - `privacytests-live.target` groups all units.

2. **Single-process mode (simple)**
   - `privacytests-live-index.service` runs `live/index.js`.
   - This starts all listeners from one parent process.

### Install split-process mode

```bash
sudo cp deploy/systemd/privacytests-live-*.service /etc/systemd/system/
sudo cp deploy/systemd/privacytests-live.target /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now privacytests-live.target
```

All service templates read runtime hostnames from:

```bash
/etc/privacytests/privacytests.env
```

### Install Caddy template

```bash
sudo cp deploy/caddy/Caddyfile.template /etc/caddy/Caddyfile
# replace placeholders in /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Bootstrap a fresh VM

`deploy/provision-vm.sh` installs packages, renders systemd + Caddy config,
writes `/etc/privacytests/privacytests.env`, starts the live services, and runs
smoke checks.

Local-only smoke setup on a fresh VM:

```bash
APP_ROOT=/srv/privacytests.org \
SITE_LABELS=:80 \
RESULTS_ROOT=http://127.0.0.1 \
TEST_PAGES_ROOT_1=http://127.0.0.1 \
TEST_PAGES_ROOT_2=http://127.0.0.1 \
TEST_PAGES_ROOT_3=http://127.0.0.1 \
./deploy/provision-vm.sh
```

For a real mirror, keep the same script and swap in your public hostnames:

```bash
APP_ROOT=/srv/privacytests.org \
ENTRY_SITE_LABELS='example.com, www.example.com' \
SITE_LABELS='results.example.com, test-pages.example.com, test-pages2.example.com' \
ACME_EMAIL=you@example.com \
RESULTS_ROOT=https://results.example.com \
TEST_PAGES_ROOT_1=https://test-pages.example.com \
TEST_PAGES_ROOT_2=https://test-pages2.example.com \
TEST_PAGES_ROOT_3=https://test-pages2.example.com \
./deploy/provision-vm.sh
```

If `ENTRY_SITE_LABELS` is omitted, `/me.html` stays on the main `SITE_LABELS`
hosts. If it is set, the entry host serves static pages like `/me.html` and
`/runtime-config.js`, while `/post`, `/step`, `/results`, and `/me` still live
under `RESULTS_ROOT`.

## Notes for low-cost/free VPS usage

- Keep Node processes bound to localhost (`3333-3336`) and expose only Caddy ports `80/443` publicly.
- Use the split-process units so a crash in one listener does not drop the others.
- Ensure certificates expected by `live/tls.js`, `live/h1.js`, and `live/h2.js` exist at `/etc/letsencrypt/live/...`.

## Google Compute Engine e2-micro guidance

Yes, these templates can work on an `e2-micro` (1 vCPU shared, ~1 GB RAM), with a few practical adjustments:

- Prefer the single-process service on tiny instances:
  - `deploy/systemd/privacytests-live-index-e2micro.service`
  - It sets `NODE_OPTIONS=--max-old-space-size=256` to reduce memory pressure.
- If you run split-process mode, expect higher RAM usage and more frequent restarts under load.
- On GCE firewall rules, allow inbound:
  - `80/tcp`, `443/tcp` for Caddy
  - `8900/tcp`, `8901/tcp`, `8902/tcp` if you expose raw TLS/h1/h2 listeners for tests
- Keep `3333-3336` private (no public firewall rule), since Caddy proxies to them locally.

Quick health verification after deploy:

```bash
curl -fsS https://<PRIMARY_DOMAIN>/healthz
# expected: {"ok":true,"service":"results"}
```
