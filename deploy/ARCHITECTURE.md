# Mirror Architecture Overview

This is a high-level deployment view for a PrivacyTests mirror running on a
single EC2 instance.

The key structural requirement is that the mirror must preserve three distinct
registrable domains (three eTLD+1s), because the upstream test suite models:

- site A: `privacytests.org`
- site B: `privacytests2.org`
- site C: `privacytests3.org`

The mirror replaces those with three equivalent domain groups while keeping the
application stack on one VM.

## High-Level Diagram

```mermaid
flowchart TB
  U["Users / Browsers"]
  R["Appium / CI Runner"]

  subgraph DNS["DNS / Domain Layer"]
    A["Site A (eTLD+1 #1)<br/>results.site-a<br/>test-pages.site-a<br/><i>replaces privacytests.org</i>"]
    B["Site B (eTLD+1 #2)<br/>test-pages.site-b<br/>upgradable.site-b<br/>insecure.site-b<br/>hsts.site-b<br/>tls.site-b:8900<br/>h1.site-b:8901<br/>h2.site-b:8902<br/>h3.site-b:4434<br/>altsvc.site-b:4433<br/><i>replaces privacytests2.org</i>"]
    C["Site C (eTLD+1 #3)<br/>test-pages.site-c<br/>insecure.site-c<br/>altsvc.site-c:4435<br/><i>replaces privacytests3.org</i>"]
  end

  subgraph AWS["AWS"]
    subgraph VPC["VPC"]
      subgraph SUBNET["Public Subnet"]
        EC2["Amazon EC2<br/>Mirror Host"]
      end
    end
  end

  subgraph HOST["EC2 Application Plane"]
    CADDY["Caddy<br/>TLS termination<br/>host-based routing"]
    STATIC["Static test pages<br/>runtime-config.js"]
    RESULTS["results.js<br/>HTTP 3335 / WS 3336"]
    CACHING["caching.js<br/>3333"]
    PARAMS["params.js<br/>3334"]
    TLS["TLS helper<br/>8900"]
    H1["H1 helper<br/>8901"]
    H2["H2 helper<br/>8902"]
    H3["H3 helper<br/>4434"]
    ALTB["Alt-Svc helper B<br/>4433"]
    ALTC["Alt-Svc helper C<br/>4435"]
    ENV["/etc/privacytests/privacytests.env"]
    SYSTEMD["systemd units"]
  end

  GHA["GitHub Actions deploy"]
  BOOT["provision-vm.sh bootstrap"]

  U --> DNS
  R --> DNS
  A --> EC2
  B --> EC2
  C --> EC2

  EC2 --> CADDY
  CADDY --> STATIC
  CADDY --> RESULTS
  CADDY --> CACHING
  CADDY --> PARAMS

  B --> TLS
  B --> H1
  B --> H2
  B --> H3
  B --> ALTB
  C --> ALTC

  ENV --> CADDY
  ENV --> RESULTS
  ENV --> CACHING
  ENV --> PARAMS
  ENV --> TLS
  ENV --> H1
  ENV --> H2
  SYSTEMD --> RESULTS
  SYSTEMD --> CACHING
  SYSTEMD --> PARAMS
  SYSTEMD --> TLS
  SYSTEMD --> H1
  SYSTEMD --> H2

  BOOT --> EC2
  GHA --> EC2

  classDef domain fill:#eef6ff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
  classDef aws fill:#fff7ed,stroke:#f97316,stroke-width:1.5px,color:#431407;
  classDef host fill:#ecfeff,stroke:#0891b2,stroke-width:1.5px,color:#083344;
  classDef ops fill:#f5f3ff,stroke:#7c3aed,stroke-width:1.5px,color:#2e1065;

  class A,B,C domain;
  class EC2 aws;
  class CADDY,STATIC,RESULTS,CACHING,PARAMS,TLS,H1,H2,H3,ALTB,ALTC,ENV,SYSTEMD host;
  class GHA,BOOT ops;
```

## Reading The Diagram

- All public hostnames terminate on one EC2 instance.
- Caddy is the public ingress layer for the browser-facing hosts on `80/443`.
- The main Node services stay internal to the host on `3333-3336`.
- Specialized helper listeners stay on their dedicated ports for the connection
  and protocol tests.
- Provisioning and deploy are separate concerns:
  - `provision-vm.sh` bootstraps a fresh instance
  - GitHub Actions performs routine sync/restart/health-check deploys

## Domain Model

The three-domain split is part of the test design, not just an implementation
detail.

- Site A is the results and alternate first-party domain.
- Site B is the primary active test domain plus most helper hosts.
- Site C is the third-site domain used for cross-session and selected helper
  behaviors.

If site B and site C are only subdomains under the same registrable domain,
the mirror is not equivalent to upstream for all tests.
