# Deployment hostname and port matrix

This document maps the hostnames/ports used by PrivacyTests to deployment tiers.

Sources used:
- `live/pto-nginx.conf` `server_name` + `listen` blocks
- `live/results.js` `pageSequence`
- `static/test_definitions.js` special endpoint tests (`h1`, `h2`, `h3`, `altsvc`, `tls`) and related connection tests

Legend:
- **/me.html** = required for the minimal “Test my browser” flow
- **Full run** = required for parity with the automated suite
- **Optional/advanced** = useful for extended parity, alternate domains, or protocol experiments

## Minimal `/me.html` flow

For a basic `/me.html` experience, only the main results app and two first-party page domains from `pageSequence` are required.

| Feature / role | Endpoint(s) | Port(s) | `/me.html` | Full run | Optional/advanced | Notes |
|---|---|---:|:---:|:---:|:---:|---|
| Results app + websocket | `results.privacytests.org` | `443` (and `80` redirect) | ✅ | ✅ |  | Serves `/`, `/step`, `/post`, `/results`, `/me` |
| Primary first-party test pages (“same”) | `test-pages.privacytests2.org` | `443` (and `80` redirect) | ✅ | ✅ |  | Used by most pages in `pageSequence` |
| Secondary first-party test pages (“different”) | `test-pages.privacytests.org` | `443` (and `80` redirect) | ✅ | ✅ |  | Used for cross-site comparison in `pageSequence` |

### Recommended naming on your own domain

If you deploy on your own zone, keep semantic names and point them at your test host, for example:

- `results.pto2.duckdns.org` → results service (HTTPS 443)
- `test-pages.pto2.duckdns.org` → “different” first party (HTTPS 443)
- `test-pages2.pto2.duckdns.org` → “same” first party (HTTPS 443)

You can keep the exact `first_party_root_same` / `first_party_root_different` split while changing only hostnames.

## Full test suite parity

This matrix includes endpoints used by protocol-specific or special tests, including those from `static/test_definitions.js`.

| Feature / test area | Concrete hostname(s) | Port(s) | `/me.html` | Full run | Optional/advanced | Source / rationale |
|---|---|---:|:---:|:---:|:---:|---|
| Core results API/UI | `results.privacytests.org` | `443`, `80` | ✅ | ✅ |  | `results.js` backend + nginx vhost |
| Main pageSequence domain A | `test-pages.privacytests2.org` | `443`, `80` | ✅ | ✅ |  | `first_party_root_same` |
| Main pageSequence domain B | `test-pages.privacytests.org` | `443`, `80` | ✅ | ✅ |  | `first_party_root_different` |
| Upgradable HTTP→HTTPS test | `upgradable.privacytests2.org` | `80`, `443` |  | ✅ |  | Explicit URL in `pageSequence` (`http://.../upgradable.html`) |
| Insecure HTTP test host | `insecure.privacytests2.org` | `80` |  |  | ✅ | Present in nginx and historical `pageSequence` comment |
| Alt-Svc control endpoint (v2) | `altsvc.privacytests2.org` | `4433` |  | ✅ |  | `altSvcOrigin` default in `test_definitions.js` |
| Alt-Svc control endpoint (v3 variant) | `altsvc.privacytests3.org` | `4435` |  |  | ✅ | Alternate `altSvcOrigin` when running on `privacytests3.org` |
| H3 connection test endpoint | `h3.privacytests2.org` | `4434` |  | ✅ |  | `H3 connection` test fetches `/connection_id` |
| H2 connection test endpoint | `h2.privacytests2.org` | `8902` |  | ✅ |  | `H2 connection` test uses dedicated high port |
| H1 connection test endpoint | `h1.privacytests2.org` | `8901` |  | ✅ |  | `H1 connection` test uses dedicated high port |
| TLS session test endpoint | `tls.privacytests2.org` | `8900` |  | ✅ |  | `TLS Session ID` test fetches this origin |
| HSTS host test endpoint | `hsts.privacytests2.org` | `443`, `80` |  |  | ✅ | Available in nginx for HSTS-specific behavior |
| Third first-party variant | `test-pages.privacytests3.org` | `443`, `80` |  |  | ✅ | Supports privacytests3 domain variants |
| Staging site | `staging.privacytests.org` | `443`, `80` |  |  | ✅ | Staging/static host, not required for prod suite |

### Suggested host naming pattern for self-hosted parity

For full parity on your own domain, a practical mapping is:

- `results.pto2.duckdns.org` (443)
- `test-pages.pto2.duckdns.org` (443)
- `test-pages2.pto2.duckdns.org` (443)
- `upgradable.pto2.duckdns.org` (80 + 443)
- `insecure.pto2.duckdns.org` (80)
- `altsvc.pto2.duckdns.org` (4433)
- `altsvc3.pto2.duckdns.org` (4435, optional)
- `h3.pto2.duckdns.org` (4434)
- `h2.pto2.duckdns.org` (8902)
- `h1.pto2.duckdns.org` (8901)
- `tls.pto2.duckdns.org` (8900)
- `hsts.pto2.duckdns.org` (443/80, optional)

If you do not need every advanced protocol test, you can skip `insecure`, `hsts`, and the `privacytests3`-style alternates.
