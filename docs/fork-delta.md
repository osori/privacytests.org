# Fork Delta

This document tracks the fork-only changes in `osori/privacytests.org` relative
to upstream `privacytests/privacytests.org`.

Its purpose is operational:

- make future upstream syncs predictable
- distinguish fork-only infrastructure work from upstream browser-test logic
- provide a checklist for deciding what should stay fork-only vs. what could be
  upstreamed later

## Principles

The fork should preserve these rules unless there is an explicit reason not to:

- keep the core browser privacy test intent and pass/fail semantics aligned with
  upstream
- prefer additive files and config wrappers over deep edits to upstream files
- default configured values to the original upstream hostnames and behavior
- isolate deployment and self-hosting logic under `deploy/` whenever possible

## Fork-only areas

These areas are expected to remain fork-specific.

### 1. Self-hosting and VM bootstrap

Files:

- [deploy/provision-vm.sh](/home/ilkyu/workspace/privacytests.org/deploy/provision-vm.sh)
- [deploy/caddy/Caddyfile.template](/home/ilkyu/workspace/privacytests.org/deploy/caddy/Caddyfile.template)
- [deploy/deploy.sh](/home/ilkyu/workspace/privacytests.org/deploy/deploy.sh)
- [deploy/systemd/privacytests-live-results.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-results.service)
- [deploy/systemd/privacytests-live-caching.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-caching.service)
- [deploy/systemd/privacytests-live-params.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-params.service)
- [deploy/systemd/privacytests-live-tls.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-tls.service)
- [deploy/systemd/privacytests-live-h1.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-h1.service)
- [deploy/systemd/privacytests-live-h2.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-h2.service)
- [deploy/systemd/privacytests-live-index.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-index.service)
- [deploy/systemd/privacytests-live-index-e2micro.service](/home/ilkyu/workspace/privacytests.org/deploy/systemd/privacytests-live-index-e2micro.service)
- [.github/workflows/deploy-mirror.yml](/home/ilkyu/workspace/privacytests.org/.github/workflows/deploy-mirror.yml)

Why this stays fork-only:

- upstream does not need this fork's Caddy/systemd/GCE-specific deployment path
- these files encode operational choices rather than browser-test behavior

### 2. Fork-specific operational documentation

Files:

- [deploy/MIRROR_BOOTSTRAP.md](/home/ilkyu/workspace/privacytests.org/deploy/MIRROR_BOOTSTRAP.md)
- [deploy/PROVISIONING.md](/home/ilkyu/workspace/privacytests.org/deploy/PROVISIONING.md)
- [docs/deployment-hostnames.md](/home/ilkyu/workspace/privacytests.org/docs/deployment-hostnames.md)

Why this stays fork-only:

- it describes this fork's host map, firewall assumptions, and deployment model

## Upstream files patched by the fork

These files come from upstream but now contain fork-maintained changes. They are
the main files to re-check during every upstream sync.

### Runtime host indirection

Files:

- [scripts/runtime-config.js](/home/ilkyu/workspace/privacytests.org/scripts/runtime-config.js)
- [static/runtime-config.js](/home/ilkyu/workspace/privacytests.org/static/runtime-config.js)
- [live/results.js](/home/ilkyu/workspace/privacytests.org/live/results.js)
- [scripts/test.js](/home/ilkyu/workspace/privacytests.org/scripts/test.js)
- [static/test_definitions.js](/home/ilkyu/workspace/privacytests.org/static/test_definitions.js)
- [static/https.js](/home/ilkyu/workspace/privacytests.org/static/https.js)
- [static/hsts.js](/home/ilkyu/workspace/privacytests.org/static/hsts.js)
- [static/stream-isolation.js](/home/ilkyu/workspace/privacytests.org/static/stream-isolation.js)
- [static/post_data.js](/home/ilkyu/workspace/privacytests.org/static/post_data.js)
- [live/caching.js](/home/ilkyu/workspace/privacytests.org/live/caching.js)
- [static/misc.js](/home/ilkyu/workspace/privacytests.org/static/misc.js)
- [static/navigation_inner.js](/home/ilkyu/workspace/privacytests.org/static/navigation_inner.js)

Purpose:

- replace hardcoded `privacytests.org`, `privacytests2.org`, and
  `privacytests3.org` roots with configurable values that still default to the
  upstream layout

Sync rule:

- preserve new upstream test logic
- re-apply only the host indirection if upstream has changed the surrounding
  code

### Entry-point and cross-window origin plumbing

Files:

- [scripts/me.js](/home/ilkyu/workspace/privacytests.org/scripts/me.js)
- [static/me.html](/home/ilkyu/workspace/privacytests.org/static/me.html)
- [static/runtime-helpers.js](/home/ilkyu/workspace/privacytests.org/static/runtime-helpers.js)
- [static/navigation.html](/home/ilkyu/workspace/privacytests.org/static/navigation.html)
- [static/supercookies.html](/home/ilkyu/workspace/privacytests.org/static/supercookies.html)
- [static/session.html](/home/ilkyu/workspace/privacytests.org/static/session.html)

Purpose:

- make `/me.html` self-hostable on arbitrary entry hosts
- replace `event.origin.includes("privacytests")` checks with explicit allowed
  origins derived from runtime config

Sync rule:

- preserve upstream page flow changes
- keep the fork's allowed-origin checks instead of reintroducing
  `privacytests`-substring matching

### Helper certificate loading

Files:

- [live/certificates.js](/home/ilkyu/workspace/privacytests.org/live/certificates.js)
- [live/tls.js](/home/ilkyu/workspace/privacytests.org/live/tls.js)
- [live/h1.js](/home/ilkyu/workspace/privacytests.org/live/h1.js)
- [live/h2.js](/home/ilkyu/workspace/privacytests.org/live/h2.js)

Purpose:

- load helper certs from configured helper origins instead of assuming the
  original upstream Let’s Encrypt paths

Sync rule:

- preserve upstream protocol-test behavior
- keep the fork's hostname-agnostic certificate loading

### Static page runtime-config loading

Files:

- [static/clear_hsts.html](/home/ilkyu/workspace/privacytests.org/static/clear_hsts.html)
- [static/fingerprinting.html](/home/ilkyu/workspace/privacytests.org/static/fingerprinting.html)
- [static/https.html](/home/ilkyu/workspace/privacytests.org/static/https.html)
- [static/insecure.html](/home/ilkyu/workspace/privacytests.org/static/insecure.html)
- [static/misc.html](/home/ilkyu/workspace/privacytests.org/static/misc.html)
- [static/query.html](/home/ilkyu/workspace/privacytests.org/static/query.html)
- [static/set_hsts.html](/home/ilkyu/workspace/privacytests.org/static/set_hsts.html)
- [static/supplementary.html](/home/ilkyu/workspace/privacytests.org/static/supplementary.html)
- [static/test_hsts.html](/home/ilkyu/workspace/privacytests.org/static/test_hsts.html)
- [static/tracking_content.html](/home/ilkyu/workspace/privacytests.org/static/tracking_content.html)
- [static/upgradable.html](/home/ilkyu/workspace/privacytests.org/static/upgradable.html)

Purpose:

- ensure the browser-side pages can see `window.RUNTIME_CONFIG` before running
  tests or posting results

Sync rule:

- if upstream changes page structure, reinsert `runtime-config.js` only where it
  is still needed

### Non-hosting bug fix

File:

- [scripts/render.js](/home/ilkyu/workspace/privacytests.org/scripts/render.js)

Purpose:

- load `assets/copy/sections.yaml` via a repo-relative path instead of a
  working-directory-sensitive path so live `/me` rendering is reliable

Sync rule:

- keep this fix unless upstream resolves the path handling another way

## Changes that should not drift silently

When syncing from upstream, explicitly re-check:

- any file that now references `window.RUNTIME_CONFIG`
- any file that now calls `getRuntimeConfig()`
- any file that validates `event.origin`
- any file in `deploy/`

## Recommended sync workflow

1. Fetch upstream and inspect the changed files first.
2. Rebase or merge the fork integration branch onto the updated upstream branch.
3. For each conflicted file listed in this document, preserve:
   - upstream test logic
   - fork host/config indirection
   - fork deployment/bootstrap files
4. Re-run the minimum validation:
   - `bash -n deploy/provision-vm.sh`
   - `git diff --check`
   - any targeted runtime or deploy smoke test relevant to the touched files
5. Update this document if a new fork-only patch area was introduced.

## Commit and PR guidance for future fork-only work

- Prefix future fork-maintenance PRs and commits with `[fork]` when the change is
  intentionally not meant for upstream
- Prefer one concern per PR:
  - runtime host indirection
  - helper-cert loading
  - provisioning/deploy
  - docs
- If a change alters actual browser-test semantics, record that explicitly in
  this document instead of letting it blend into host/config work

## Current fork-only generated or local-only items

These should not be treated as upstream-sync concerns:

- `.codex` local workspace scratch file

