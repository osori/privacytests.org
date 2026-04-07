# VM Provisioning Guide

This document is the operational reference for provisioning a fresh VM to run
the PrivacyTests mirror.

It is intentionally narrower than
[MIRROR_BOOTSTRAP.md](/home/ilkyu/workspace/privacytests.org/deploy/MIRROR_BOOTSTRAP.md):

- this file focuses on first-boot setup and verification
- `MIRROR_BOOTSTRAP.md` also covers host-role rationale, parity notes, and the
  mirror-specific background for this fork

## What This Provisioning Flow Assumes

- Ubuntu-based VM
- repository already cloned onto the VM
- a deploy user that can run `sudo`
- DNS already pointing at the VM for the mirror hostnames you plan to use

The provisioning entrypoint is:

- [provision-vm.sh](/home/ilkyu/workspace/privacytests.org/deploy/provision-vm.sh)

## What The Script Configures

`deploy/provision-vm.sh` is the first-boot bootstrap for the mirror. It:

- installs runtime packages when `INSTALL_PACKAGES=1`
- ensures the repo path exists and is owned by the deploy user
- writes `/etc/privacytests/privacytests.env`
- renders `/etc/caddy/Caddyfile` from
  [Caddyfile.template](/home/ilkyu/workspace/privacytests.org/deploy/caddy/Caddyfile.template)
- installs systemd units from
  [deploy/systemd](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-results.service)
- runs [deploy.sh](/home/ilkyu/workspace/privacytests.org/deploy/deploy.sh)
- starts or restarts Caddy and the live services
- copies helper certificates into `/etc/privacytests/certs`
- runs post-provision smoke checks

## Required Inputs

At minimum, set:

- `APP_ROOT`
- `SITE_LABELS`
- `RESULTS_ROOT`
- `TEST_PAGES_ROOT_1`
- `TEST_PAGES_ROOT_2`
- `TEST_PAGES_ROOT_3`

For full helper-host parity, also set:

- `UPGRADABLE_ROOT`
- `INSECURE_ROOT_2`
- `INSECURE_ROOT_3`
- `HSTS_ROOT`
- `TLS_ROOT`
- `H1_ROOT`
- `H2_ROOT`
- `H3_ROOT`
- `ALTSVC_ROOT_2`
- `ALTSVC_ROOT_3`

Optional but usually needed in production:

- `ENTRY_SITE_LABELS` when `/me.html` should live on apex or another separate
  public host
- `ACME_EMAIL`
- `SERVICE_USER`
- `SERVICE_GROUP`
- `PROXY_SERVICE`

## Network Prerequisites

Before running the script, make sure:

- all public mirror hostnames resolve to the VM
- helper hosts are DNS-only if you use Cloudflare
- the VM firewall allows:
  - `80/tcp`
  - `443/tcp`
  - `8900-8902/tcp`
  - `4433-4435/tcp`
  - `4433-4435/udp`

For why those hosts and ports exist, see
[MIRROR_BOOTSTRAP.md](/home/ilkyu/workspace/privacytests.org/deploy/MIRROR_BOOTSTRAP.md).

## Fresh VM Procedure

### 1. Prepare the repo path

```bash
sudo mkdir -p /srv/privacytests.org
sudo chown -R "$USER:$USER" /srv/privacytests.org
git clone <your-fork-url> /srv/privacytests.org
cd /srv/privacytests.org
```

### 2. Run provisioning

Example for the mirror hosts used in this fork:

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

If you want `/me.html` on a separate entry host, add `ENTRY_SITE_LABELS` and
leave `RESULTS_ROOT` pointed at the results/API host:

```bash
APP_ROOT=/srv/privacytests.org \
ENTRY_SITE_LABELS='example.com, www.example.com' \
SITE_LABELS='results.example.com, test-pages.example.net, test-pages.example.org' \
RESULTS_ROOT=https://results.example.com \
TEST_PAGES_ROOT_1=https://test-pages.example.net \
TEST_PAGES_ROOT_2=https://test-pages.example.org \
TEST_PAGES_ROOT_3=https://test-pages.example.org \
ACME_EMAIL=you@example.com \
./deploy/provision-vm.sh
```

### 3. Verify services

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

### 4. Verify listeners

```bash
sudo ss -ltnup | egrep ':(80|443|3333|3334|3335|3336|8900|8901|8902|4433|4434|4435)\b'
```

### 5. Verify public endpoints

```bash
curl -fsS https://results.ij.fyi/healthz
curl -fsS https://results.ij.fyi/me.html > /dev/null
curl -fsS http://upgradable.ij2.qzz.io/upgradable.html?source=hyperlink > /dev/null
curl -fsS https://tls.ij2.qzz.io:8900/
curl -fsS https://altsvc.ij2.qzz.io:4433/protocol
curl -fsSI https://h3.ij2.qzz.io:4434/connection_id
```

When `ENTRY_SITE_LABELS` is set, verify `/me.html` on that host instead of the
results host.

## Local Smoke Setup

For a local-only or first-pass smoke setup on a new VM, you can point
everything at loopback:

```bash
APP_ROOT=/srv/privacytests.org \
SITE_LABELS=:80 \
RESULTS_ROOT=http://127.0.0.1 \
TEST_PAGES_ROOT_1=http://127.0.0.1 \
TEST_PAGES_ROOT_2=http://127.0.0.1 \
TEST_PAGES_ROOT_3=http://127.0.0.1 \
./deploy/provision-vm.sh
```

This is useful for validating that packages install, services boot, and the
basic reverse-proxy path works before DNS and certificates are in place.

For local smoke mode, leave `ENTRY_SITE_LABELS` unset unless you also expose a
second listener specifically for the entry host.

## Re-running Provisioning

`deploy/provision-vm.sh` is intended to be re-runnable. Typical reasons to
re-run it:

- hostnames changed
- helper hosts were added
- Caddy config generation changed
- systemd unit templates changed
- the VM was rebuilt from scratch

Typical rerun pattern:

```bash
cd /srv/privacytests.org
APP_ROOT=/srv/privacytests.org \
... \
./deploy/provision-vm.sh
```

## What Provisioning Does Not Replace

Provisioning is first-boot setup. Routine code deploys should still use:

- [deploy-mirror.yml](/home/ilkyu/workspace/privacytests.org/.github/workflows/deploy-mirror.yml)

That workflow assumes the VM is already provisioned. It syncs code, restarts
services, and checks `/healthz`; it is not the bootstrap step.

## Troubleshooting

- `mkdir: cannot create directory '/srv/...': Permission denied`
  - the deploy user does not own `APP_ROOT`, or the path was never created
- `curl: (7) Failed to connect to 127.0.0.1 port 80`
  - Caddy is not running, or provisioning never installed the proxy/service
  stack
- helper-host tests fail but `/healthz` is fine
  - check DNS, public firewall rules, and whether the helper listeners are
  actually bound on `8900-8902` and `4433-4435`
- `/me` says `not found`
  - the session may have been lost due to a `privacytests-live-results.service`
  restart; the live results store is in memory

## Related Docs

- [README.md](/home/ilkyu/workspace/privacytests.org/deploy/README.md)
- [MIRROR_BOOTSTRAP.md](/home/ilkyu/workspace/privacytests.org/deploy/MIRROR_BOOTSTRAP.md)
