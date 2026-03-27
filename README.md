# PrivacyTests.org
PrivacyTests.org is an open-source testing program that measures browser privacy characteristics, and a website, https://privacytests.org, that renders the results for human consumption.

PrivacyTests.org uses the MIT license.

## Runtime origin configuration (on-demand flow)

The on-demand test flow uses four public origins that can be overridden at runtime for mirrored deployments.

### Environment variables

These environment variables are read by server-side Node.js code (`scripts/*`, `live/*`):

* `TEST_PAGES_ROOT_1` (default: `https://test-pages.privacytests.org`)
* `TEST_PAGES_ROOT_2` (default: `https://test-pages.privacytests2.org`)
* `TEST_PAGES_ROOT_3` (default: `https://test-pages.privacytests3.org`)
* `RESULTS_ROOT` (default: `https://results.privacytests.org`)

If a variable is unset, the default production hostname is used.

### Browser runtime config

Browser pages read `static/runtime-config.js` via `window.RUNTIME_CONFIG` with the same keys.
By default that file uses production hostnames, but mirror deployments can override values before loading it.

### Example mirror setup

```bash
export TEST_PAGES_ROOT_1="https://test-pages.mirror.example"
export TEST_PAGES_ROOT_2="https://test-pages2.mirror.example"
export TEST_PAGES_ROOT_3="https://test-pages3.mirror.example"
export RESULTS_ROOT="https://results.mirror.example"
```

* aioquic: a submodule with a fork of the aioquic project for HTTP3-related tests
* assets: copy, css, icons, images, fonts for running tests and rendering pages
* live: express JS files for the test server
* results: raw results are saved in this directory
* scripts: scripts for running tests and rendering website and results pages
* static: static files for the test server
* website: the HTML pages where results are published
