# Deployment (free VPS friendly)

This directory contains templates for running the PrivacyTests mirror with:

- **Caddy** as reverse proxy (automatic TLS)
- **systemd** units for persistent startup/restart

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

### Install Caddy template

```bash
sudo cp deploy/caddy/Caddyfile.template /etc/caddy/Caddyfile
# edit placeholders in /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

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
