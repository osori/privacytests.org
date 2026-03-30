# Mirror Bootstrap Reference

This document records the mirror-specific infrastructure and repo changes used
to bring up the `results.ij.fyi` / `ij2.qzz.io` / `ij3.qzz.io` deployment on a
fresh VM.

It exists so future forks do not need to reconstruct the setup from chat logs
or rediscover which helper hosts, ports, and runtime roots are required.

## Scope

The goal of this fork was:

- keep the core browser test logic intact
- move hostnames and helper infrastructure off `privacytests.org`,
  `privacytests2.org`, and `privacytests3.org`
- make a fresh Ubuntu VM bootstrap reproducible from the repo

The main entrypoint for a fresh VM is:

- [provision-vm.sh](/home/ilkyu/workspace/privacytests.org/deploy/provision-vm.sh)

## Hosts Required For Mirror Parity

Main app hosts:

- `results.<your-domain>`
- `test-pages.<domain-1>`
- `test-pages.<domain-2>`
- `test-pages.<domain-3>`

Dedicated helper hosts:

- `upgradable.<domain-2>`
- `insecure.<domain-2>`
- `insecure.<domain-3>`
- `hsts.<domain-2>`
- `tls.<domain-2>:8900`
- `h1.<domain-2>:8901`
- `h2.<domain-2>:8902`
- `h3.<domain-2>:4434`
- `altsvc.<domain-2>:4433`
- `altsvc.<domain-3>:4435`

The concrete hostnames used for this fork were:

- `results.ij.fyi`
- `test-pages.ij.fyi`
- `test-pages.ij2.qzz.io`
- `test-pages.ij3.qzz.io`
- `upgradable.ij2.qzz.io`
- `insecure.ij2.qzz.io`
- `insecure.ij3.qzz.io`
- `hsts.ij2.qzz.io`
- `tls.ij2.qzz.io:8900`
- `h1.ij2.qzz.io:8901`
- `h2.ij2.qzz.io:8902`
- `h3.ij2.qzz.io:4434`
- `altsvc.ij2.qzz.io:4433`
- `altsvc.ij3.qzz.io:4435`

Full upstream parity expects three distinct eTLD+1s:

- site A: equivalent to `privacytests.org`
- site B: equivalent to `privacytests2.org`
- site C: equivalent to `privacytests3.org`

Using multiple subdomains under one registrable domain is not equivalent. For
example, `ij2.qzz.io` and `ij3.qzz.io` are both still under `qzz.io`.

## Host Role Table

### Mirror-controlled hosts

| Site | Upstream hostname | Purpose | Test cases / stages |
| --- | --- | --- | --- |
| Site A | `results.privacytests.org` | Results and orchestration host | websocket session setup, `/post`, `/results`, `/me` |
| Site A | `test-pages.privacytests.org` | "Different first-party" host | cross-site read phase for `supercookies`, `navigation`, query-parameter stripping, desktop tracking-cookie read phase |
| Site B | `test-pages.privacytests2.org` | Main active test host and "same first-party" host | `supercookies.html`, `navigation.html`, `tracking_content.html`, `misc.html`, `https.html`, `/live/*`, `IP address leak`, `GPC enabled first-party` |
| Site B | `upgradable.privacytests2.org` | HTTP host that should upgrade to HTTPS | `Upgradable address`, `Upgradable hyperlink`, upgraded side of `Upgradable image`, `Upgradable script` |
| Site B | `insecure.privacytests2.org` | Insecure control host for subresource upgrade tests | insecure side of `Upgradable image`, `Upgradable script` |
| Site B | `hsts.privacytests2.org` | HSTS setup and clear host | `HSTS cache`, `HSTS cache (fetch)` setup |
| Site B | `tls.privacytests2.org:8900` | TLS helper | `TLS Session ID` |
| Site B | `h1.privacytests2.org:8901` | HTTP/1 helper | `H1 connection` |
| Site B | `h2.privacytests2.org:8902` | HTTP/2 helper | `H2 connection` |
| Site B | `h3.privacytests2.org:4434` | HTTP/3 helper | `H3 connection` |
| Site B | `altsvc.privacytests2.org:4433` | Alt-Svc helper for the default side | `Alt-Svc` when the current page is not on site C |
| Site C | `test-pages.privacytests3.org` | Third-site host for cross-session isolation | `session_3p`, `session_1p`; also selects the site-C `Alt-Svc` variant |
| Site C | `insecure.privacytests3.org` | Pure insecure top-level host | `Insecure website warning`; also readback side for `HSTS cache`, `HSTS cache (fetch)` |
| Site C | `altsvc.privacytests3.org:4435` | Alt-Svc helper for the third site | `Alt-Svc` when the current page is on site C |

### External dependencies still used by tests

| Host or service | Purpose | Test cases |
| --- | --- | --- |
| `wtfismyip.com` | public IP discovery | `Tor enabled`, `IP address leak` comparison input |
| `encryptedsni.com` | ECH status probe | `ECH enabled` |
| `onionoo.torproject.org` | Tor relay lookup | `Stream isolation` / Tor-related detection |
| hosts listed in [trackers.json](/home/ilkyu/workspace/privacytests.org/static/trackers.json) | real third-party tracker loads | tracker-loading stage and desktop tracking-cookie behavior |
| `cdn.jsdelivr.net` | hosted JS dependency | `indexedDB` test via `idb-keyval` |

## DNS And Firewall

DNS:

- point every hostname above at the VM public IP
- for Cloudflare-managed zones, use `DNS only`
- do not proxy the helper hosts through Cloudflare

The helper ports are non-standard, and the tests rely on preserving protocol
behavior rather than going through a CDN/proxy layer.

GCE firewall:

- `80/tcp`
- `443/tcp`
- `8900-8902/tcp`
- `4433-4435/tcp`
- `4433-4435/udp`

On GCE, the helper-specific firewall rules in this fork were attached through a
dedicated instance tag:

- `privacytests-helper`

## Fresh VM Bootstrap

Assumptions:

- Ubuntu VM
- repo checked out at `/srv/privacytests.org`
- deploy user owns that path
- DNS already points at the VM

### 1. Clone Repo

```bash
sudo mkdir -p /srv/privacytests.org
sudo chown -R "$USER:$USER" /srv/privacytests.org
git clone <your-fork-url> /srv/privacytests.org
cd /srv/privacytests.org
```

### 2. Run Provisioning

Replace the hostnames below with your own if you are not using the same
domains as this fork.

```bash
APP_ROOT=/srv/privacytests.org \
SITE_LABELS='results.ij.fyi, test-pages.ij.fyi, test-pages.ij2.qzz.io, test-pages.ij3.qzz.io' \
RESULTS_ROOT=https://results.ij.fyi \
TEST_PAGES_ROOT_1=https://test-pages.ij.fyi \
TEST_PAGES_ROOT_2=https://test-pages.ij2.qzz.io \
TEST_PAGES_ROOT_3=https://test-pages.ij3.qzz.io \
UPGRADABLE_ROOT=http://upgradable.ij2.qzz.io \
INSECURE_ROOT_2=http://insecure.ij2.qzz.io \
INSECURE_ROOT_3=http://insecure.ij3.qzz.io \
HSTS_ROOT=https://hsts.ij2.qzz.io \
TLS_ROOT=https://tls.ij2.qzz.io:8900 \
H1_ROOT=https://h1.ij2.qzz.io:8901 \
H2_ROOT=https://h2.ij2.qzz.io:8902 \
H3_ROOT=https://h3.ij2.qzz.io:4434 \
ALTSVC_ROOT_2=https://altsvc.ij2.qzz.io:4433 \
ALTSVC_ROOT_3=https://altsvc.ij3.qzz.io:4435 \
ACME_EMAIL=you@example.com \
./deploy/provision-vm.sh
```

What the script does:

- installs packages when `INSTALL_PACKAGES=1`
- writes `/etc/privacytests/privacytests.env`
- installs systemd units from `deploy/systemd/`
- renders `/etc/caddy/Caddyfile`
- starts Caddy and the live services
- installs Node dependencies for `live/` and `scripts/`
- copies Caddy-issued helper certs into `/etc/privacytests/certs`
- restarts the raw TLS/H1/H2 helper services
- runs smoke checks

### 3. Verify Services

```bash
systemctl is-active \
  caddy \
  privacytests-live-results.service \
  privacytests-live-caching.service \
  privacytests-live-params.service \
  privacytests-live-tls.service \
  privacytests-live-h1.service \
  privacytests-live-h2.service
```

### 4. Verify Local Listeners

```bash
sudo ss -ltnup | egrep ':(80|443|3333|3334|3335|3336|8900|8901|8902|4433|4434|4435)\b'
```

### 5. Verify Public Endpoints

```bash
curl -fsS https://results.ij.fyi/healthz
curl -fsS https://results.ij.fyi/me.html > /dev/null
curl -fsS http://upgradable.ij2.qzz.io/upgradable.html?source=hyperlink > /dev/null
curl -fsS https://tls.ij2.qzz.io:8900/
curl -fsS https://altsvc.ij2.qzz.io:4433/protocol
curl -fsSI https://h3.ij2.qzz.io:4434/connection_id
```

Expected spot-check behavior for this fork:

- `/healthz` returns `{"ok":true,"service":"results"}`
- `/me.html` returns `200`
- `altsvc.../protocol` returns `h2` over the baseline HTTP/2 request
- `h3.../connection_id` returns an empty body over the baseline HTTP/2 request,
  with an `Alt-Svc` header advertising HTTP/3

## GitHub Actions Mirror Deploy

The current CI deploy workflow is:

- [deploy-mirror.yml](/home/ilkyu/workspace/privacytests.org/.github/workflows/deploy-mirror.yml)

Important variables/secrets:

- `MIRROR_SSH_HOST`
- `MIRROR_SSH_USER`
- `MIRROR_SSH_KEY`
- `MIRROR_SSH_PORT`
- `MIRROR_DEPLOY_PATH`
- `MIRROR_DEPLOY_SERVICES`
- `MIRROR_PROXY_SERVICE`
- `MIRROR_HEALTHCHECK_URL`
- `MIRROR_APP_URL`

The workflow assumes the VM is already provisioned. It syncs the repo,
restarts services, and checks `/healthz`. It is not the first-boot bootstrap.

## Mirror-Specific Repo Changes

High-level changes made in this fork:

### 1. Provisioning And Infra

- added [provision-vm.sh](/home/ilkyu/workspace/privacytests.org/deploy/provision-vm.sh)
- expanded [Caddyfile.template](/home/ilkyu/workspace/privacytests.org/deploy/caddy/Caddyfile.template)
  for helper hosts and runtime-config generation
- updated [deploy.sh](/home/ilkyu/workspace/privacytests.org/deploy/deploy.sh)
- updated systemd templates in
  [deploy/systemd](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-results.service)
  to read `/etc/privacytests/privacytests.env`

### 2. Runtime Host Indirection

These files now support mirror-specific helper roots instead of hardcoding
`privacytests2.org` / `privacytests3.org`:

- [scripts/runtime-config.js](/home/ilkyu/workspace/privacytests.org/scripts/runtime-config.js)
- [static/runtime-config.js](/home/ilkyu/workspace/privacytests.org/static/runtime-config.js)
- [live/results.js](/home/ilkyu/workspace/privacytests.org/live/results.js)
- [scripts/test.js](/home/ilkyu/workspace/privacytests.org/scripts/test.js)
- [static/https.js](/home/ilkyu/workspace/privacytests.org/static/https.js)
- [static/hsts.js](/home/ilkyu/workspace/privacytests.org/static/hsts.js)
- [static/stream-isolation.js](/home/ilkyu/workspace/privacytests.org/static/stream-isolation.js)
- [static/test_definitions.js](/home/ilkyu/workspace/privacytests.org/static/test_definitions.js)

### 3. Raw TLS/H1/H2 Helper Services

Added and updated:

- [live/certificates.js](/home/ilkyu/workspace/privacytests.org/live/certificates.js)
- [live/tls.js](/home/ilkyu/workspace/privacytests.org/live/tls.js)
- [live/h1.js](/home/ilkyu/workspace/privacytests.org/live/h1.js)
- [live/h2.js](/home/ilkyu/workspace/privacytests.org/live/h2.js)

These services now load certs based on the configured helper origins rather than
assuming the original upstream hostnames.

### 4. Static Page Plumbing

Mirror runtime-config loading and ordering changes were made in the static pages
used by the test flow, including:

- [me.html](/home/ilkyu/workspace/privacytests.org/static/me.html)
- [runtime-helpers.js](/home/ilkyu/workspace/privacytests.org/static/runtime-helpers.js)
- [supercookies.html](/home/ilkyu/workspace/privacytests.org/static/supercookies.html)
- [navigation.html](/home/ilkyu/workspace/privacytests.org/static/navigation.html)
- [misc.html](/home/ilkyu/workspace/privacytests.org/static/misc.html)
- [tracking_content.html](/home/ilkyu/workspace/privacytests.org/static/tracking_content.html)
- [post_data.js](/home/ilkyu/workspace/privacytests.org/static/post_data.js)

### 5. Results Renderer Fix

The mirror results page `/me` needed one non-hosting fix in:

- [scripts/render.js](/home/ilkyu/workspace/privacytests.org/scripts/render.js)

This change makes the renderer load `assets/copy/sections.yaml` using a stable
repo-relative path instead of a working-directory-sensitive path. Without it,
the live `/me` page could return `not found` even when the session data existed.

## Important Limits

This fork moved the mirror off the original `privacytests` helper domains, but
some test pages still depend on third-party public internet services by design,
for example:

- `wtfismyip.com`
- `encryptedsni.com`
- external tracker URLs from [trackers.json](/home/ilkyu/workspace/privacytests.org/static/trackers.json)

Those are upstream test dependencies, not mirror-hosting dependencies.

## Known Operational Gotchas

- `tracking_content.html` has no per-tracker timeout. If one external tracker
  request stays pending forever on a device, the run can hang at progress
  `0.545`.
- The live results session store is in memory. Restarting
  `privacytests-live-results.service` drops in-flight session IDs.
- If helper-host behavior changes in Caddy, run:

```bash
sudo systemctl reload caddy
```

to ensure the active config matches the rendered `/etc/caddy/Caddyfile`.
