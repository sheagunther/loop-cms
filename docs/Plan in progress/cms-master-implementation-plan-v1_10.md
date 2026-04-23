# Loop MMT CMS — Master Implementation Plan v1.10
## Loop MMT™ · Loop World | Shrubbery · 22 April 2026

---

## About This Document

*[Section Type: Plan]*

***Evidence status: Nothing in this plan has been implemented or tested. Every mechanism described is architectural. The CMS described in this plan does not exist. It is a grocery store made of words.***

This document consolidates three CMS architectural plans and twelve review passes into a single implementation sequence:

- **Distributed Closure Wall Plan v1.2** (5 layers — capability model, deployment tool, ephemeral exceptions, storage enforcement, structural verifier)
- **CMS Capability Gaps Plan v1.1** (3 gaps — draft/published boundary, multi-tenant isolation, extension admission model)
- **CMS Novel Capabilities Report v1** (4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind)
- **Parallax Passes 1–3** (12 angles, 25 findings — Builder through i18n/Accessibility Specialist)
- **Super RCR** (9 items — media handling with Super Frame, 6 lenses)
- **Lens RCR** (Rugged Sony Walkman, F1 Racing Operations, McMaster-Carr — 8 resolutions)
- **Security RCR** (26 findings — authentication, transport, operational security, content safety, threat modeling, advanced threats)
- **L21 Cross-Pollination RCR** (12 isomorphisms — config-driven contracts, request pipeline, state shape factories, single-file Tier 1, dual-format proof logging)
- **NASA Flight Software Engineering RCR** (14 findings — safe mode, watchdog, digital twin, graceful degradation, content integrity, bounded execution, lifecycle state machine)
- **FWW(C) + Hitchhiker's Guide RCR** (13 findings — system voice, first-run experience, demo narrative, single-file as product lead, Jamie's View, SEP field clearance, bistromathic re-estimate)
- **Competitive Gap Analysis RCR** (7 gaps patched + 2 refinements — content revision history, webhooks/event bus, SEO infrastructure, full-text search, content relationships, headless REST API, caching architecture, RSS/Atom feeds, workflow escalation refinements)
- **Weird RCR** (8 differentiation capabilities — Time Travel Surfaces, Content Seismograph, Déjà Vu, Constellation Fingerprint, Stranger Walk, Editorial Pulse, Content Weather, Ghost Links)

The plan builds a CMS that starts as one file and scales to Kubernetes. Download one file. Run one command. An editor publishes in three clicks without knowing the architecture exists. The same constellation spec deploys to Docker Compose for enterprise and Kubernetes for scale. Under the hood: capability model (the engine), five editor buttons (the checkout counter), Proof Mode (the security system), authentication (the membership card scanner), RBAC (the staff badges), content sanitization (the food safety inspector), rate limiting (the fire marshal), transport security (the armored car), secret management (the safe), dependency scanning (the supply chain), security ratchet (the one-way turnstile), intrusion detection (the loss prevention team), content revision history (the notebook), webhooks (the delivery notification), SEO infrastructure (the street address and phone number), full-text search (the aisle signs), content relationships (the cross-references), headless REST API (the pickup window), response caching (the pre-stocked shelves), RSS/Atom feeds (the newsletter), Time Travel Surfaces (the store's memory of every shelf arrangement it's ever had), Content Seismograph (the ripple forecast before you restock), Déjà Vu (the check for duplicate stock), Constellation Fingerprint (the store's memorable name for each layout), Stranger Walk (the daily front-door inspection), Ghost Links (the record of where removed products used to be shelved). The lifecycle state machine knows when to stop. The watchdog knows when something's wrong. The system fails gracefully or not at all.

**Resource model assumption.** AI-assisted solo development (one operator with AI tooling). Phase 0's parallel tracks run sequentially under this model. A small team (3–5) would parallelize. The critical path (Phases 0 → 1 → 2 → 3 → 4) is team-size-invariant — the dependencies are architectural, not resourcing.

**What this plan replaces.** CMS Master Implementation Plan v1.9 is superseded. This plan integrates 122 total findings from twelve review passes plus 12 L21 isomorphisms. For mechanism detail, read the source documents.

---

## Section 0 — The Threat Model

Six data flows. Seven actor types. Every security mechanism in this plan traces to a named threat, a named actor, and a named data flow. The tables below are the security reviewer's reference — the structure that governs Phases 0–5.

**Chen Wei:** Every security mechanism answers a question. Before writing the answers, name the questions.

### Threat Actors

| Actor | Capability | Goal | Trust Level |
|-------|-----------|------|-------------|
| Anonymous Internet User | HTTP requests, public API access | Data theft, service disruption, defacement | None |
| Authenticated Editor | Content creation, media upload, admin UI | Unauthorized access, privilege escalation, accidental exposure | Partial — bounded by RBAC |
| Tenant Admin | Spec modification, extension installation, tenant configuration | Cross-tenant access, data exfiltration, service abuse | Scoped — bounded by tenant isolation |
| Extension Developer | Code execution within sandbox, declared capability budget | Data harvesting within scope, capability escalation, supply chain attack | Conditional — bounded by admission + behavioral monitoring |
| AI Agent | Content generation, media generation within sandbox | Prompt injection, budget exhaustion, output that bypasses content safety | Conditional — bounded by AI sandbox + budget |
| Compromised Dependency | Code execution at process level | Full system compromise, credential theft, data exfiltration | Assumed hostile — bounded by supply chain controls |
| Compromised Operator | Full administrative access | Rollback security patches, exfiltrate backups, tamper with audit trail | Highest — bounded by security ratchet + log integrity |

### STRIDE on Primary Data Flows

Six data flows. Each assessed against six STRIDE categories. Each cell names the mitigation or names the gap.

**Flow 1 — Editor → Admin UI → Content Surface.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | Attacker impersonates editor | FBD-AU1 (authentication gate) + MFA for admin |
| **T**ampering | Content modified in transit | FBD-TL1 (TLS) + CSRF tokens (FBD-CF1) |
| **R**epudiation | Editor denies creating content | Proof Vault audit trail for editor actions |
| **I**nformation Disclosure | Editor sees content outside their tenant/role | FBD-RB1 (RBAC) + tenant scoping |
| **D**enial of Service | Flood content creation | FBD-RL1 (rate limiting) |
| **E**levation of Privilege | Editor gains admin capabilities | FBD-RB1 (permission model — capabilities are additive from zero, not subtractive from all) |

**Flow 2 — Public User → Presentation Loop → Content Surface.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | N/A — public read, no identity | — |
| **T**ampering | Response modified in transit | FBD-TL1 (TLS + HSTS) |
| **R**epudiation | N/A — anonymous reads | — |
| **I**nformation Disclosure | Draft content visible on public surface | Content Surface isolation (Gap 1 collapse — architectural) |
| **D**enial of Service | Traffic flood on public API | FBD-RL1 (rate limiting) + CDN |
| **E**levation of Privilege | Public request accesses editorial surface | Capability model — public Presentation Loop has no editorial contracts |

**Flow 3 — Extension → Contract System → Data.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | Extension impersonates another extension | Extension identity in capability budget (each extension gets unique budget scope) |
| **T**ampering | Extension modifies data outside scope | Capability model — contracts are the only data access path |
| **R**epudiation | Extension denies generating output | AI provenance metadata + Proof Vault |
| **I**nformation Disclosure | Extension reads data within scope and exfiltrates | FBD-BM1 (behavioral monitoring — egress anomaly detection) |
| **D**enial of Service | Extension exhausts compute budget | Budget system + FBD-VB1 (verification budgeting) |
| **E**levation of Privilege | Extension gains capabilities beyond manifest | Admission gate + intersective budget composition (more classes = narrower) |

**Flow 4 — Deployment Tool → Infrastructure.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | Attacker supplies malicious spec | Spec validation + operator authentication |
| **T**ampering | Spec injection — malicious values in generated configs | FBD-SI1 (spec output sanitization — all spec values escaped for target format) |
| **R**epudiation | Operator denies deploying a configuration | Spec Version Store (append-only) + Diff Engine |
| **I**nformation Disclosure | Generated configs expose secrets | FBD-SM1 (secrets as vault references, never literals) |
| **D**enial of Service | Rapid spec changes trigger re-derive storms | FBD-VB1 (verification budgeting — queue with compute cap) |
| **E**levation of Privilege | Spec modification grants wider permissions | FBD-SR1 (security ratchet — irrevocable security transitions) |

**Flow 5 — Migration Tool → Content Vault + Media Loop.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | Malicious import file poses as Contentful export | FBD-MG1 (translator validates against deployment tool) + schema validation |
| **T**ampering | Import file contains XSS payloads in content fields | FBD-IS1 (import sanitization — same sanitization pipeline as editor ingress) |
| **R**epudiation | N/A — import is an explicit operator action | Logged in Proof Vault |
| **I**nformation Disclosure | Import file probes capability model boundaries | Schema validation rejects unknown fields; errors don't reveal internal structure |
| **D**enial of Service | Massive import file exhausts memory | FBD-IS1 (import resource limits — max records, max file size, streaming parser) |
| **E**levation of Privilege | Import schema definitions escalate capabilities | FBD-MG1 — output must pass deployment tool validator |

**Flow 6 — Self-Verification → Proof Vault.**

| Category | Threat | Mitigation |
|----------|--------|------------|
| **S**poofing | Attacker generates fake verification results | Independent manifest verifier (FBD-MV1) — two independent code paths must agree |
| **T**ampering | Verification log entries modified | Proof Vault append-only + hash chain (FBD-LI1) |
| **R**epudiation | Operator claims verification passed when it didn't | Append-only log with hash chain — entries are immutable and sequenced |
| **I**nformation Disclosure | Verification results reveal internal topology | Proof Endpoint scoped to verification status, not topology detail |
| **D**enial of Service | Attacker triggers verification storms | FBD-VB1 (verification budgeting) |
| **E**levation of Privilege | Compromised verifier reports false-positive compliance | Independent verifier (dual-channel) — both channels compromised simultaneously is the residual risk |

### Scope Declaration

This threat model covers the six primary data flows above. Out of scope: physical security, social engineering beyond phishing resistance at the UI layer, nation-state actors, and side-channel attacks (timing, power analysis). The information-theoretic bound (Section 6) applies: capability attenuation constrains access, not inference. Aggregates leak. Timing leaks. The scope declaration bounds the security claim.

---

## Section 1 — The Collapse

**Sol:** The three source documents contain twelve named workstreams. Under dependency analysis, twelve collapses to nine. Media adds W10 as a threading dimension. Security adds W11 as a threading dimension — like media, it touches every phase. The admin UI and publishing workflow are Phase 1 deliverables built on existing architectural primitives — they don't add workstreams because they *are* consumers of the workstreams.

**Collapse 1: Content Surfaces absorbs Gap 1 (Draft/Published).** Gap 1 is a two-surface system. Content Surfaces is the general-case N-surface system. Build the general case. Get the special case for free.

**Collapse 2: AI Sandbox merges with Gap 3 (Extension Admission).** AI Sandbox is the extension admission model applied to AI agents with AI-specific budget classes. One system, not two.

**Post-collapse workstream inventory (eleven units):**

| # | Workstream | Source | Notes |
|---|-----------|--------|-------|
| W1 | Capability Model (L1) | v1.2 | Includes locale as recognized dimension |
| W2 | Deployment Tool + Storage Enforcement (L2+L4) | v1.2 | L4 merged into L2; incremental operations at Phase 2 |
| W3 | Content Surfaces | Novel Capabilities | Gap 1 absorbed; locale-variant surfaces; content sanitization |
| W4 | Proof Mode | Novel Capabilities | Independent manifest verifier; compliance integration; log integrity |
| W5 | Multi-Tenant Isolation (Gap 2) | v1.1 | — |
| W6 | Extension Admission + AI Sandbox | v1.1 + Novel | Gap 3 + AI Sandbox merged; liability declaration; behavioral monitoring |
| W7 | Constellation Rewind | Novel Capabilities | Media-safe rewind; security ratchet |
| W8 | Ephemeral Exceptions (L3) | v1.2 | — |
| W9 | Structural Verifier (L5) | v1.2 | Topology map with text equivalent; verification budgeting |
| W10 | Media System | Super RCR | Threading dimension (Phases 1–4); eager transforms; transform budgeting |
| W11 | Security Infrastructure | Security RCR | Threading dimension (Phases 0–5); authn, RBAC, transport, secrets, rate limiting, supply chain, incident response, intrusion detection. Security infrastructure is implemented through `CONTRACT_CONFIGS` entries and the `processRequest` pipeline, not as independent enforcement systems. FBD-CS1, FBD-RL1, FBD-RB1, FBD-LI1, FBD-TB1, and FBD-MD1 are properties of contract config entries, enforced by pipeline phases. |
| W12 | Content Infrastructure | Competitive Gap Analysis RCR | Threading dimension (Phases 0–1 core, Phase 2+ scaling); revision history, content events + webhooks, SEO (slugs, metadata, sitemaps, redirects), full-text search, content relationships + taxonomies, headless REST API, response caching, RSS/Atom feeds. Content infrastructure is implemented through `CONTRACT_CONFIGS` entries, schema grammar extensions, and Presentation Loop variants. |

Three workstreams absorbed. Twelve remain. The admin UI and publishing workflow are **consumers** of W3 (Content Surfaces) — they prove the architecture by being built on it. Security (W11) and Content Infrastructure (W12) are threading dimensions like Media (W10) — they don't have a "phase" because they thread every phase. W12 threads primarily through Phases 0–1 with scaling adaptations at Phase 2+.

---

## Section 2 — The Dependency Graph

**Dara:** Every arrow means "cannot ship without."

```
W1 (Capability Model — with locale dimension)
 ├──→ W2 (Deployment Tool + Storage)
 │     ├──→ W8 (Ephemeral Exceptions)
 │     └──→ W9 (Structural Verifier)
 ├──→ W3 (Content Surfaces — with locale variants)
 │     ├──→ W4 (Proof Mode)
 │     │     ├──→ W7 (Constellation Rewind)
 │     │     └──→ W6 (Extension + AI Sandbox) [also depends on W5]
 │     └──→ W5 (Multi-Tenant)
 │           └──→ W6 (Extension + AI Sandbox)
 ├──→ W4 (Proof Mode) [partial — infra after W1, manifest after W3]
 ├──→ W10 (Media System) [partial — media contracts need W1, full threading W3–W7]
 ├──→ W11 (Security Infrastructure) [partial — authn/transport after W1, RBAC at W3, full threading W3–W9]
 └──→ W12 (Content Infrastructure) [partial — schema grammar after W1, implementation at W3, scaling at W5]
```

**Critical path:** W1 → W3 → W5 → W6. W2 runs parallel to W3. W4, W10, W11, and W12 thread through everything. W7, W8, W9 are terminal. The admin UI and publishing workflow ship at Phase 1 as consumers of W3 — they don't appear in the dependency graph because they depend on Content Surfaces, and Content Surfaces is already on the critical path.

---

## Section 3 — The Six Phases

### Phase 0 — The Foundation

*Margaux: "Getting the permits and hiring the security firm."*

**What ships:** The capability model spec amendment, the product shell, the threat model, and the authentication architecture.

**Spec track (Chen Wei):** Standard amendment defining confinement, attenuation, and revocation as properties of the contract system. This is W1. The amendment either extends Standard Section 5 (Boundary Enforcement) or adds a new Section 16 (Capability Model).

**Locale decision (Phase 0).** Two models, operator chooses per deployment: **Model A — Locale-as-Surface** (each locale produces surface variants — `public-en`, `public-ar` — locale is topology), or **Model B — Locale-as-Field** (content records carry a `locale` field, surfaces are locale-agnostic). Both use the same capability infrastructure. The constellation operator's `localeStrategy` declaration governs.

**Threat model (Security RCR).** STRIDE analysis on six primary data flows, documented in Section 0 of this plan. The threat model is a Phase 0 deliverable because it governs every subsequent phase. Every security mechanism traces to a named threat, a named actor, and a named data flow.

**System lifecycle state machine (NASA RCR).** The CMS carries a formal operational state machine from Phase 1 onward. Four states, explicit transitions, defined permitted operations:

| State | Behavior | Entry Trigger | Permitted Operations |
|-------|----------|---------------|---------------------|
| NOMINAL | Full operation — all contracts, all pipelines | Startup passes preflight; recovery completes | All |
| DEGRADED | Content serving continues, write operations throttled or suspended, alerts firing | Non-critical subsystem failure (e.g., Proof Vault error, transform worker crash); health monitor anomaly | Reads, cached content, operator diagnostics |
| SAFE_MODE | Read-only cached content, all mutations suspended, operator notified | Critical failure (watchdog timeout, hash chain break, Content Vault integrity error); explicit operator command | Reads from cache only, operator diagnostics, state export |
| RECOVERY | Operator-directed restoration from known-good state | Operator initiates after SAFE_MODE diagnosis | Spec re-derive, backup restore, subsystem restart |

Transitions are logged in the Proof Vault (when available) and to the application log (always). `loopctl status` reports current lifecycle state. The lifecycle state machine is the CMS's flight rules — what's permitted in which state, what causes transitions. FBD-LM1: the system cannot serve write operations in SAFE_MODE. Not "should not." Cannot. The state machine governs the pipeline.

**Safe Mode design principle:** NASA defines safe mode before mission-critical logic, because safe mode is what keeps the mission alive long enough for the next command to matter. STOP is the most important thing the code does. The CMS's Safe Mode preserves content availability (cached reads) and system recoverability (state export, operator access) while preventing further damage. The wall stops the damage. Safe Mode stops the bleeding.

**Authentication architecture (W11 — Phase 0).** The membership card scanner. Authentication is infrastructure, not a feature — like the capability model, everything else depends on it. Phase 0 defines:

- **Identity model.** Constellation operators declare an auth provider in the spec (`authProvider: { type: 'oidc', issuer: '...' }` or `authProvider: { type: 'local' }`). Local auth stores bcrypt-hashed credentials in a dedicated Auth Vault (not the Content Vault). OIDC delegates to external providers. The deployment tool provisions the auth infrastructure alongside everything else.
- **Session architecture.** Stateless JWT tokens with short expiry (15 minutes) + refresh tokens (7 days) stored server-side. Refresh token rotation — each use invalidates the old token and issues a new one. Stolen refresh tokens are single-use. Token claims carry: user ID, tenant ID (if multi-tenant), role, session ID. The capability system reads role from the token; RBAC gates read permissions from the role. FBD-AU1: no capability-bearing request processes without a valid, non-expired token. The token is the membership card. No card, no entry.
- **RBAC model.** Staff badges. Five base permissions map to the admin UI's five buttons: `content:write`, `media:upload`, `content:preview`, `content:schedule`, `content:publish`. Administrative permissions layer on top: `extensions:manage`, `settings:configure`, `tenants:manage` (Phase 2), `rewind:execute` (Phase 4). Four default roles: Viewer (read-only), Editor (write + upload + preview), Publisher (all five content actions), Admin (all permissions). Custom roles via the constellation spec. FBD-RB1: every admin action requires a named permission; no default-allow. The principle: capabilities are additive from zero, not subtractive from all. An editor with no explicit `content:publish` permission cannot publish. The RBAC model is the staff badge system — stockers can't open the safe, cashiers can't restock the pharmacy.
- **MFA.** Required for Admin role. Optional for Publisher and Editor (constellation operator configures). TOTP or WebAuthn. MFA enforcement is a capability model property — the auth provider declares MFA support, the role declaration requires it.

**Product track (Vee, Renata, parallel):** Product shell: security model diagram format, developer documentation framework, extension developer guide skeleton, CLI command structure, local development mode specification.

**System Voice (FWW(C) + Hitchhiker's RCR).** Three surfaces, one voice: the CLI, error messages, and Proof Vault human-readable entries all follow the same principles — informative (what happened), oriented (what to do next), warm (not robotic). The voice guide ships with the product shell.

- **CLI voice.** `loopctl status` doesn't dump JSON — it gives you the CMS in one glance: `mysite · NOMINAL · 2 surfaces · 1 tenant / Content: 847 items · Media: 2.1 GB · Proof: chain valid / Last deploy: 3 hours ago · Next verification: 12 min`. Dry run: `✓ Dry run clean. Ready to deploy. Run loopctl deploy to go live.`
- **Error message voice.** Every FBD rejection is a teaching moment. Name what happened, name what the user can do, name who can help. "You need the Publish badge to push this live — ask your admin to add content:publish to your role." The sanitizer shows "We cleaned up some HTML in your title — script tags aren't allowed in content," not silence.
- **Proof Vault human side.** Present tense for current state ("Public surface verified — all contracts intact"), past tense for events ("Editor stripped script tag from article title at 3:42 PM"), specificity without jargon. The operator reads this at 2 AM. It should read like a confident, clear colleague.

**Commercial Architecture (Hitchhiker's RCR — SEP Field).** Four product decisions named here so they're no longer Somebody Else's Problem. Phase 0 doesn't answer them — Phase 0 names them as decisions to make:

1. **Pricing model shape.** Per-deployment, per-tenant, or flat fee? The tier structure (single-file free → Docker paid → Kubernetes enterprise) implies a model. The model needs explicit design.
2. **Target buyer profile.** Solo blogger who outgrew WordPress? Agency managing 12 client sites? Enterprise needing SOC 2? All three? The tiers serve different scales — name who each tier is for.
3. **Landing page and download infrastructure.** The sixty-second demo needs a URL. Phase 1 deliverable — product, not architecture.
4. **Competitive positioning.** What does this CMS replace? What pain does the buyer already have? "No plugin conflicts. No database migration. No 'your PHP version is incompatible.'" Name the familiar failure. The novel solution becomes legible.

#### Spec Shape Model (L21 Cross-Pollination — Isomorphisms 1, 2)

The constellation spec is a typed runtime object, not a free-form document. Factory functions define default shapes:

- `makeConstellationSpec()` — returns the default spec shape with all sub-objects
- `makeSurface(type, locale)` — returns a surface with default contracts, default RBAC, default rate limits
- `makeTenant(id, config)` — returns a tenant with default isolation, default quotas, default roles
- `makeMediaLoop(backingStore)` — returns a media loop with default ingress pipeline, default transform config
- `makeExtension(manifest)` — returns an extension runtime config with pre-computed intersective budget

The deployment tool calls the factories. Constellation Rewind's `restoreConstellation` calls the same factories. `parseSpecFile(yaml)` validates against the factory-generated shape and returns a typed object. Shape mismatches caught at parse time. Factories carry defaults — the FBD floor is baked into the shape. You can tighten from defaults; you can't accidentally omit them.

L21 precedent: `makeUnidirectionalBus(src, dst)`, `makeDualChannelBus(src, dst, extras)`, `makePatternMatcher(extras)` — used by both initialization and `restoreFromSnapshot`.

#### Contract Configuration Model (L21 Cross-Pollination — Isomorphism 3)

`CONTRACT_CONFIGS` table. Every contract type is a config entry:

```
CONTRACT_CONFIGS = {
  FETCH_CONTENT_AGGREGATE: {
    type: 'read', surface: 'required',
    sanitize: false,
    rateLimit: 'public',
    rbacPermission: 'content:read',
    proofLevel: 'normal',
  },
  STORE_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: true,        // FBD-CS1
    rateLimit: 'admin',
    rbacPermission: 'content:write',
    proofLevel: 'audit',
  },
  STORE_MEDIA: {
    type: 'write', surface: 'required',
    sanitize: 'media',     // FBD-MD1
    rateLimit: 'media',
    rbacPermission: 'media:upload',
    proofLevel: 'audit',
  },
  TRANSFORM_MEDIA: {
    type: 'compute', surface: 'optional',
    sanitize: false,
    rateLimit: 'transform', // FBD-TB1
    rbacPermission: 'media:transform',
    proofLevel: 'normal',
    isolated: true,
  },
}
```

One `executeContract(contractId, payload, context)` function reads the config and applies the pipeline. No per-contract handler code. Adding a new contract type = adding a config entry. Sanitization, rate limiting, RBAC, and proof logging are properties of the contract, not separate systems.

L21 precedent: `BUS_CONFIGS` — nine buses, one config table, generic functions that take `busId` and look up config. No per-bus functions.

#### Tier 1 — Single-File Architecture (L21 Cross-Pollination — Isomorphism 12)

The CMS at Tier 1 is a single file:

- **Runtime:** Deno or Bun. Serves HTTP. Runs TypeScript directly. No npm install (Deno). No build step.
- **Storage:** SQLite (embedded). Content Vault = SQLite database. Proof Vault = separate SQLite database or table with append-only trigger (`BEFORE DELETE/UPDATE ON proof_vault BEGIN SELECT RAISE(ABORT, 'immutable'); END`).
- **Media:** Local filesystem. Transforms generated at upload, cached alongside originals.
- **Admin UI:** Served from same process. Presentation Loop on editorial Content Surface. Same five buttons.
- **Contracts:** `CONTRACT_CONFIGS` in source. `processRequest()` pipeline. All in-process.
- **Authentication:** Local auth, bcrypt in SQLite, JWT tokens. Same RBAC model.
- **Deployment:** `curl -O https://loopcms.dev/loopcms.ts && deno run --allow-net --allow-read --allow-write loopcms.ts init mysite.yaml`

What this eliminates at Tier 1: Docker, Docker Compose, separate deployment tool, separate database server, npm/build pipeline. What this preserves: capability model, content sanitization, admin UI, Proof Vault, constellation spec, RBAC, media ingress, contract system.

**Spec portability:** Same YAML spec works at Tier 1 (single-file), Tier 2 (Docker Compose + Postgres), Tier 3 (Kubernetes). The spec is portable. The deployment mechanism is tiered. The capability model is constant.

L21 precedent: One HTML file. 18,900 lines. 574 functions. No build step. No framework. 331 versions. It works.

Commercial angle: "Download one file. Run one command. You have a CMS." Free tier = single-file. Paid tier = Tier 2 enterprise. Spec portability is the upgrade path — the customer owns their spec.

Updated tier boundary table:

| Tier | Runtime | Storage | Media | Isolation | Protects Against | Does Not Protect Against |
|------|---------|---------|-------|-----------|-----------------|------------------------|
| 0 | Single file (Deno/Bun) | SQLite | Local fs | Scope chain (JS) | Accidental cross-component access | Malicious code in same process. Single-operator only. |
| 1 | Single file | SQLite | Local fs | Scope chain | Same as Tier 0 + authenticated access | Same as Tier 0. Self-authored extensions only. |
| 2 | Docker Compose | Postgres | S3 | iframe + CSP | DOM access, cookie theft, most XSS | Container escape. Docker is a speed bump, not a wall. |
| 3 | Kubernetes | Postgres | Multi-CDN | Container (separate process, network ns) | Process-level access, lateral movement | Kernel exploits, hardware side channels. |

**Bounded security language (Lens RCR P2-F1).** Two rules govern all security claims: (1) "Verifiable security configuration" not "proven security posture" — the claim is bounded to contract-level access control, and the limitation travels with every claim. (2) Two-column disclosure — every security document carries what the system enforces *and* what it doesn't address. McMaster lists tensile strength *and* the temperature range.

**Transport security (W11 — Phase 0).** TLS 1.2+ required for all non-localhost connections (FBD-TL1 — the deployment tool refuses to generate without). HSTS headers. Auto-provisioned certs via cert-manager (Kubernetes) or Caddy (Docker Compose). The operator doesn't configure TLS — the deployment tool does it.

#### Content Modeling Grammar (W12 — Phase 0)

The constellation spec grammar extends to carry content infrastructure declarations. These are Phase 0 spec-level additions; implementation ships at Phase 1.

**Content relationship fields.** Two relationship types in the schema grammar: `reference` (one-to-one or one-to-many to another content type) and `taxonomy` (many-to-many via a named taxonomy). Taxonomies declared at the spec level: `taxonomies: { category: { hierarchical: true }, tag: { hierarchical: false } }`. Content types declare relationship fields: `fields: { author: { type: 'reference', to: 'author' }, categories: { type: 'taxonomy', taxonomy: 'category' } }`. Referential integrity: a reference to a nonexistent content item fails `processRequest` validation. FBD-CR1: deleting content with inbound references requires explicit handling declared per field — reject (default), cascade, or nullify. No orphaned references.

**SEO field class.** Every content type carries SEO fields as a standard field group: `slug` (URL path, unique per surface, auto-generated from title, editable, validated for URL safety), `metaTitle`, `metaDescription`, `canonicalUrl` (optional, defaults to self), `ogImage` (Media Loop reference), `noIndex` (boolean), `structuredData` (JSON-LD). FBD-SEO1: content without a slug cannot be published to a public surface. The slug is the street address. No address, no storefront.

**Redirect declarations.** The constellation spec carries a `redirects` table: `redirects: [{ from: '/old-path', to: '/new-path', type: 301 }]`. Applied at the `processRequest` routing layer before contract resolution. Redirect chains capped at 3 hops (prevents infinite loops). Redirect targets validated against URL safety rules. Redirect creation rate-limited via FBD-RL1.

**Content event schema.** Event types declared at the spec level: `content.created`, `content.updated`, `content.published`, `content.unpublished`, `content.deleted`, `media.uploaded`, `media.deleted`. Events carry: type, content ID, content type, surface, timestamp, actor. Webhook registrations in the spec: `webhooks: [{ url: 'https://...', events: ['content.published'], secret: '...' }]`.

**Headless API endpoint architecture.** The REST API is a Presentation Loop — it reads from Content Surfaces using the same contracts as any other consumer. Endpoint pattern: `GET /api/content/:type` (list with pagination, filtering, field selection), `GET /api/content/:type/:slug` (single item with reference depth), `GET /api/search` (full-text search). API keys for public-surface read access (tenant-scoped at Phase 2, per-key rate limits, revocable with immediate propagation). Authenticated access via JWT for editorial surface. Response shape designed for GraphQL compatibility — flat, typed structures with explicit relationship fields.

**Deliverables:**
- Standard amendment: Capability Model (confinement, attenuation, revocation, locale dimension)
- Spec shape model: factory functions (`makeConstellationSpec`, `makeSurface`, `makeTenant`, `makeMediaLoop`, `makeExtension`)
- Contract configuration model: `CONTRACT_CONFIGS` table with security properties as contract entries
- Tier 1 single-file architecture: Deno/Bun + SQLite + local fs, spec portability across tiers
- Threat model: STRIDE on six data flows (Section 0)
- Authentication architecture: identity model, session architecture, RBAC model, MFA requirements
- Transport security requirements
- Product documentation framework (with bounded security language)
- Security model diagram format specification
- Developer guide skeleton
- DX specification: `loopctl` CLI command structure, local dev mode spec
- Content modeling grammar: relationship field types, taxonomy declarations, SEO field class, content event schema, webhook registration schema, redirect table, headless API endpoint specification

**Verification gate:** Super RCR in two rounds. Round 1: spec amendment, authentication architecture, and threat model (architectural foundation). Round 2: content modeling grammar — relationships, SEO fields, content events, API surface, redirect schema (content modeling layer). Two rounds, one phase — the content modeling grammar depends on the capability model, so Round 2 consumes Round 1's output. The most consequential review in the plan.

**What this phase proves:** The bus contract system carries capability semantics, locale as a recognized dimension, and authentication as infrastructure. The threat model covers the six primary data flows. The RBAC model maps cleanly to the admin UI's five buttons. The content modeling grammar carries relationships, SEO, events, and API endpoint declarations as typed spec-level constructs.

---

### Phase 1 — The Surfaces

*Margaux: "Building the shelves, stocking the first products, opening the checkout counter, and hiring security."*

**What ships:** Content Surfaces, the admin UI, the publishing workflow, the deployment tool (v1), Proof Mode infrastructure, the Media Loop with eager transforms, migration tooling, the operational runbook, content sanitization, rate limiting, CSRF protection, secret management, supply chain baseline, content revision history, content event bus with webhooks, SEO infrastructure (slugs, metadata, sitemaps, redirects), full-text search, content relationships and taxonomies, headless REST API, response caching (Layer 1), RSS/Atom feeds, and the first running CMS demo with an editor who can log in, see only what their role permits, search for content, publish an article with SEO metadata, and have external systems notified — without knowing the architecture exists.

**Implementation sequencing (internal to Phase 1).** Phase 1 is XXL. The mitigation is not sub-phasing (which creates schema migration between sub-deliverables and breaks the demo narrative) but incremental implementation within a single phase: (1) `processRequest` pipeline first — the skeleton that everything hangs on; (2) `CONTRACT_CONFIGS` entries one at a time — each contract type is self-contained and testable; (3) Presentation Loop variants last — admin UI, headless API, sitemap, RSS are all consumers of the same contracts. The verification gate fires once at the end. L21 precedent: 18,900 lines in one file, built function by function, verified at each version boundary.

#### Request Pipeline Architecture (L21 Cross-Pollination — Isomorphism 4)

The `processRequest` function. Six phases in compile-time order:

```
function processRequest(req) {
  const identity = reqAuthenticate(req);          // FBD-AU1
  const permissions = reqAuthorize(identity, req.contractId); // FBD-RB1
  const config = CONTRACT_CONFIGS[req.contractId];
  const validated = reqValidate(req, config);
  const sanitized = reqSanitize(validated, config); // FBD-CS1/MD1
  const result = reqExecute(sanitized, permissions, config);
  reqLog(result, identity, config);               // FBD-LI1
  return result;
}
```

Not middleware. Not configurable. A function body. The order cannot be misconfigured because it isn't configured — it's written. Every request through one function.

**Bounded execution time (FBD-TE1, NASA RCR).** Each pipeline phase carries a timeout: authenticate (100ms), authorize (50ms), validate (200ms), sanitize (500ms), execute (configurable per contract type in `CONTRACT_CONFIGS`, default 5s), log (100ms). Timeout → structured error, not a hang. Media transforms get longer execute budgets than metadata reads. Unbounded execution is a runaway thruster — the timeout is the flight computer's kill switch.

**Sanitization verification (FBD-SV1, NASA RCR).** NASA uses dual-channel verification for critical computations — two independent code paths, results must agree. Content sanitization (FBD-CS1) runs in the pipeline. An independent verification function confirms the sanitized output contains no prohibited elements. Two code paths. Same input. Agreement required. Disagreement → stricter result wins, discrepancy logged in Proof Vault. The sanitizer is the food safety inspector. The verifier is the independent auditor who checks the inspector's work.

L21 precedent: `executeOneTick()` — preamble → sample → read → gate → rotate → write. Order matters. Not configurable.

#### One-Way Content Flow (L21 Cross-Pollination — Isomorphism 5)

Architectural constraint: Presentation Loops read from Content Surfaces. They never modify the Content Vault. The admin UI is a Presentation Loop with an action dispatcher — it reads for display and dispatches modifications through the `processRequest` pipeline. Content flows: user action → pipeline → vault → surface → presentation → user sees result.

L21 precedent: "Render functions read from L21, write to DOM/canvas. They never modify L21."

#### Content Surfaces (Sol, Graham, Sable)

The surface declaration schema, aggregate and metadata contract types, surface-to-loop mapping, locale-variant surface provisioning, and the self-verification extension. This is W3, which absorbs Gap 1. The draft/published split is the first test case. Locale-variant surfaces (if the operator chose Model A) are the second test case.

Implementation detail lives in the Novel Capabilities Report §2 and Gaps Plan v1.1 §2. The spec amendment adds: surface declarations to the constellation spec grammar (with optional `locales` parameter), `FETCH_CONTENT_AGGREGATE` and `FETCH_CONTENT_METADATA` contract types, surface-to-loop factory wiring, and self-verification of surface-contract integrity.

#### Content Sanitization — The Food Safety Inspector

**Vee, Nyx:** The grocery store inspects every item before it goes on the shelf. The CMS inspects every piece of content before it touches a surface.

**Input sanitization (FBD-CS1).** Every content field that accepts rich text passes through an allowlist-based HTML sanitizer before storage. The allowlist permits structural HTML (`<p>`, `<h1>`–`<h6>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<a>`, `<img>`, `<table>`, `<em>`, `<strong>`, `<code>`, `<pre>`) and strips everything else. No `<script>`, no `<iframe>`, no `onerror`, no `onload`, no `javascript:` URIs, no `style` attributes, no `data:` URIs, no CSS injection vectors. Links are validated: `href` must be `https://` or a relative path. Images are validated: `src` must reference the Media Loop (no external image URLs in content — external images go through the embed system).

The sanitizer is the *same pipeline* for all content ingress: admin UI, migration import, API, extension-generated content. FBD-CS1: content that has not passed the sanitizer cannot be written to the Content Vault. The sanitizer is the wall, not a filter. A thousand editors creating content in good faith will accidentally produce dangerous HTML. One editor creating content in bad faith will definitely produce it. The food safety inspector catches both.

**Output encoding (FBD-OE1).** Content sanitization catches input. Output encoding catches output. Even sanitized content rendered into HTML needs context-aware escaping — HTML context, attribute context, JavaScript context, URL context, CSS context. The Presentation Loop applies output encoding at render time. Sanitization at input + encoding at output = defense in depth.

**Content integrity at rest (FBD-CI1, NASA RCR).** NASA scrubs memory continuously, detecting bit errors before they propagate. The Content Vault carries content checksums: every record gets a hash computed at write time by `processRequest`. On read, the checksum is verified. Mismatch → content not served, anomaly logged, DEGRADED state triggered. At Tier 1 (SQLite), a column. At Tier 2+ (Postgres), a column with a trigger. The Proof Vault protects proof integrity with its hash chain. FBD-CI1 protects content integrity with per-record checksums. Silent corruption becomes detectable corruption.

#### The Admin UI — Five Buttons on a Walkman

**Ed:** The grocery store had a supply chain, a security system, a receiving dock, and twelve kinds of enforcement. It did not have a checkout counter. Now it does. And there's a membership card scanner at the door and staff badges on the employees.

The admin UI is a **Presentation Loop consuming the editorial Content Surface.** It is not a separate system. It is a consumer of the architecture — the same way the public website is a consumer of the public surface. The admin UI proves that Content Surfaces are sufficient to build a full editing experience. It is reference implementation, integration test, and product, simultaneously.

The editor sees five actions. Like a Walkman. Like McMaster's three-click taxonomy. Like the pit wall's decision interface.

1. **Write** — create and edit content. Rich text editor. Structured fields derived from the content schema in the constellation spec. The editor doesn't see contracts or loops. The editor sees "Article," "Page," "Product" — content types derived from the spec's schema declarations. McMaster-organized: by content type, not by architectural concept. Content passes through FBD-CS1 (input sanitization) before storage.
2. **Upload** — attach media. Drag-and-drop into the media library or inline into content. The Media Loop's ingress pipeline (magic-byte validation, SVG sanitization, EXIF stripping) runs silently. The editor sees "Upload complete." The editor does not see "STORE_MEDIA contract executed with FBD-MD1 ingress validation." The belt drive is inside the case.
3. **Preview** — see content as it will appear on any surface. The editor selects a surface (public, analytics, recommendation) and sees what that surface's consumers will see. Preview is a read from the target surface's contracts applied to the draft content. The editor sees the public site's view of their article — without the draft being published.
4. **Schedule** — set a publication date/time. The Clock fires the `SCHEDULED → PUBLISHED` transition. The editor picks a date. The architecture does the rest.
5. **Publish** — push content to the public surface. One button. The content state transitions from `DRAFT` (or `SCHEDULED`) to `PUBLISHED`. The public surface can now query it. The editorial surface already could.

**What the editor sees depends on their badge.** Viewers see content lists (read-only). Editors see Write, Upload, and Preview. Publishers see all five. Admins see the five plus Settings and Extensions (Phase 3). The admin UI reads the user's role from the JWT token and renders only the permitted actions. FBD-RB1: the UI doesn't hide buttons with CSS — it doesn't render the components at all. The API enforces the same permissions independently. The UI could be replaced with curl and the RBAC would still hold. Belt and suspenders.

The admin UI is organized like McMaster: content type taxonomy in the left nav, content list with status indicators, single-item editor with surface preview. No architectural jargon. No mention of loops, buses, contracts, or surfaces in the UI copy. The editor's mental model is: "my content, its status, where it appears." The architecture's mental model is: "surface-scoped contract queries with capability attenuation." Same reality, two vocabularies. The admin UI translates.

**Accessibility gate (FBD-AC1).** The admin UI meets WCAG 2.2 AA before Phase 1 ships. Keyboard navigable. Screen reader compatible. Sufficient color contrast. Focus management. ARIA landmarks. This is a verification gate, not a feature toggle. If the admin UI doesn't pass, Phase 1 doesn't ship. The Walkman has raised dots on the Play button so you can find it without looking. The admin UI has semantic HTML so you can use it without seeing.

**Session security for the admin UI (W11 — Phase 1).**

- **CSRF protection (FBD-CF1).** Every state-modifying request carries a CSRF token. The token is generated per session, stored server-side, delivered via a non-cookie channel (custom header or meta tag), and validated on every POST/PUT/DELETE. SameSite=Strict on all cookies. FBD-CF1: state-modifying requests without a valid CSRF token are rejected. Making sure the person at the register is the one who picked up the groceries.
- **Anti-clickjacking.** `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'` on all admin UI responses. The admin UI cannot be framed. Period.
- **Session termination.** Explicit logout invalidates both access and refresh tokens server-side. Idle timeout (configurable, default 30 minutes) triggers re-authentication. Concurrent session limit (configurable, default 3). Token issued before a password change is invalidated.

#### First-Run Experience (FWW(C) RCR)

What happens after `loopctl init` finishes? An empty admin panel is a blank page. A blank page is the most hostile UX in computing. The first-run experience: welcome message, a sample content item ("Hello, World — your first article" with a placeholder image), a prompt to create the admin account, and a single-page setup wizard (site name, locale, one content type). Total time from `loopctl init` to "editor looking at their first article in the admin UI": under ninety seconds. The sixty-second pitch becomes a ninety-second reality. The roller coaster doesn't start with a safety briefing — it starts with the click of the restraint and the slow climb.

#### Publishing Workflow — The Pit Stop

Content lifecycle as a **Bus Workflow** — the same architectural primitive used for the extension installation pipeline in Phase 3. Five states: `DRAFT` → `IN_REVIEW` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`.

Each transition is a bus event. Each transition can carry a validation step — a pre-publish check (required fields present? media attached? SEO metadata complete? locale variants linked?). Scheduled publishing is a Clock event. The Workflow is declared in the constellation spec as a Pipeline — provisioned by the deployment tool alongside surfaces and loops.

The F1 pit stop: car enters → jacks up → wheels off → wheels on → jacks down → car exits. Two seconds. Each step has a predecessor, a role, a completion signal. Draft → Review → Publish follows the same choreography. The publishing workflow is not separate infrastructure — it's the Bus Workflow primitive applied to content state. The architecture already has the mechanism. Phase 1 applies it.

**Publishing workflow RBAC.** Each transition is gated by a permission. `content:write` permits DRAFT creation and editing. `content:publish` permits IN_REVIEW → PUBLISHED and SCHEDULED → PUBLISHED. `content:schedule` permits IN_REVIEW → SCHEDULED. Archiving requires `content:publish`. An editor without `content:publish` can write and submit for review but cannot push to the public surface. The Workflow checks the token. The permission model governs the state machine.

#### Deployment Tool v1 (Graham, Dara)

Reads a constellation spec with surface declarations (including locale variants and publishing workflow), outputs Docker Compose (Tier 2) or single-file config (Tier 1). Storage enforcement baked in. Four-component architecture: Parser (spec grammar + import source plugins) → Validator (capability model constraints) → Generator (deployment artifacts, pluggable backends) → Verifier (output matches IR). The import side of the parser handles migration sources. A refactoring gate fires between Phase 2 and Phase 3.

**Deployment dry run (FBD-DD1, NASA RCR).** NASA never transmits a command to Mars without running it through the digital twin first. `loopctl deploy --dry-run` generates all outputs, validates them against the capability model, runs the structural verifier on the generated topology, and reports what would change — without applying anything. `loopctl deploy` applies only changes that have passed dry-run validation. FBD-DD1: the deployment tool refuses to apply changes that haven't been dry-run validated. You cannot skip the twin.

**Spec Version Store (moved from Phase 4).** Append-only version history of constellation specs, available from Phase 1. `loopctl spec-history` shows previous specs. `loopctl deploy --spec-version N` re-derives from a prior known-good spec. Not full Constellation Rewind (that's Phase 4 — compatibility checker, media cache invalidation, security ratchet). But the ability to return to a known-good state ships on Day 1. Perseverance can safe-mode on Sol 1. The CMS can roll back on Day 1.

**Spec output sanitization (FBD-SI1).** Every spec value in generated configs is escaped for the target format. The deployment tool is a compiler consuming untrusted input — FBD-SI1 makes spec injection structurally impossible.

**Secret management (FBD-SM1).** Generated configurations never contain literal secrets — all are vault references (Docker secrets, Kubernetes secrets, HashiCorp Vault, or `.env` with restricted permissions for Tier 1). FBD-SM1: the generator refuses to emit a literal secret value. Secrets rotate on a schedule declared in the constellation spec.

**TLS enforcement (FBD-TL1).** The generator refuses non-TLS configuration for any tier above localhost. Auto-provisioned certs via cert-manager or Caddy. Implementation of Phase 0 transport security requirements.

#### Media Loop (W10 — Phase 1)

Specialized Vault Loop with pluggable backing store (local at Tier 1, S3 at Tier 2, multi-CDN at Tier 3). Five media contracts: `STORE_MEDIA`, `FETCH_MEDIA_PUBLIC`, `FETCH_MEDIA_FULL`, `FETCH_MEDIA_METADATA`, `TRANSFORM_MEDIA`. Media contracts scope to Content Surfaces like all contracts.

**Hot-path discipline (L21 Cross-Pollination — Isomorphism 6).** Media transforms follow tick-engine discipline — no network access, pre-allocated buffers, resource caps in the transform subprocess/worker. Tiered isolation driven by `CONTRACT_CONFIGS.TRANSFORM_MEDIA.isolated` flag + runtime tier detection. Tier 1: Worker thread with limited imports. Tier 2: restricted subprocess with seccomp. Tier 3: container with network namespace. L21 precedent: hot-path discipline in `executeOneTick` — no DOM, no allocation in the tick body.

**Ingress security pipeline (FBD-MD1).** Every media upload passes through: magic-byte file-type validation (not extension), SVG sanitization (strip `<script>`, event handlers, `xlink:href` to external resources, `foreignObject`), EXIF stripping (GPS, camera ID, timestamps — gone before storage), size/dimension caps (configurable in the spec, defaults: 50MB per file, 10,000px max dimension). Validated before `STORE_MEDIA` commits. The wall catches it at the input, not the output.

**Image processing isolation.** Media transforms run in a restricted subprocess: no network access, memory/CPU limits, seccomp profile. The transform worker cannot reach the network or read files outside its input/output directories. Defense in depth: validate the input (FBD-MD1), isolate the processing, scan the dependency (FBD-SC1).

**Eager transform generation (Lens RCR P3-F2).** Uploads immediately generate transforms for all declared responsive variants (thumbnail, medium, large; WebP + JPEG). Cold cache on a high-traffic page becomes impossible for standard variants.

**Custom transform budgeting (FBD-TB1).** Custom transforms are a capability, not an open endpoint. Per-user budget (requests/hour, max dimensions). Zero budget for unauthenticated requests. Request coalescing within budgeted requests.

**Embed system.** Allowlist in the constellation spec with per-provider CSP + sandbox + accessibility requirements (`captions: required`, `keyboardNav: required`). Denied URLs rejected with educational message. CSP pins embed sources; iframe `csp` attribute restricts fetch. DNS rebinding residual risk documented in two-column disclosure.

#### Rate Limiting (FBD-RL1)

Four layers: public API (100 req/min/IP, configurable), admin API (60 req/min/user, content creation 20/min, media upload 10/min), media transforms (per-user budget via FBD-TB1, standard transforms cached), migration (max 10K records, 500MB, streaming parser). Standard `429 Too Many Requests` with `Retry-After`. Rate limit state per-instance; shared state via Redis is a Phase 2 optimization.

#### Proof Mode Infrastructure (Nyx, Dara)

Verification Log schema, append-only Proof Vault, log-capture mechanism. Self-verification output from this phase onward goes into the Proof Vault.

**Independent manifest verifier (FBD-MV1).** A second Compute Loop reads the constellation spec and produces its own security projection. Two independent code paths, same inputs, outputs must agree. Dual-channel verification — the pattern aviation uses for flight control. Cannot be disabled independently of self-verification.

**Security Manifest scope declaration.** Every manifest carries: `scopeOfVerification: 'contract-level access control'`. The manifest does not claim to verify side-channel resistance, timing attacks, inference from aggregates, or application-level logic errors. The scope field bounds the claim. McMaster lists tensile strength *and* temperature range. The manifest lists what it verifies *and* what it doesn't.

**Proof Vault retention policy.** Configurable with jurisdiction-aware defaults: 1yr/5yr (SOC 2), 6yr/10yr (HIPAA), 7yr (financial). Compaction rules for verification entries. Forensic entries (spec diffs, admission records, rewind logs) never compact.

**Log integrity (FBD-LI1).** Proof Vault: append-only with hash chain. Each entry hashes the previous entry; tampering invalidates the chain forward. Verified on every read. Application logs outside the Proof Vault carry per-entry HMACs using a write-only key — the application can append but cannot verify or forge.

**Dual-format proof logging (L21 Cross-Pollination — Isomorphism 9).** Every entry: `MACHINE.CODE.PATH key=value t=unix || Human-readable description`. Machine side feeds SIEM. Human side feeds the operator at 2 AM. Voice principle: present tense for current state, past tense for events, specificity without jargon.

```
PROOF.VERIFY.PASS surface=public tenant=A t=1713700800 || Public surface verified — all contracts intact
PROOF.AUTH.FAIL ip=192.168.1.1 user=editor@co t=1713700801 || Authentication failed for editor@co — wrong password, 3rd attempt
```

**Proof Vault litigation awareness.** Proof Mode default off. Activation flow includes acknowledgment: verification failures recorded permanently, remediation timelines recorded permanently, Proof Vault may be discoverable. Two-column disclosure: proves what the system checked, not that the system is secure.

#### Migration Tooling

- **`loopctl import`** — JSON, CSV, Contentful plugins. Parser component of the deployment tool, different input grammars. Pipeline: parse → validate → **sanitize** → transform → load (Media Loop for binaries, Content Vault for structured data) → verify integrity.
- **Import sanitization (FBD-IS1).** The import pipeline applies the same content sanitization (FBD-CS1) as the admin UI. Content fields in imported data pass through the allowlist HTML sanitizer. Media files pass through the ingress pipeline (FBD-MD1). Resource limits: max 10,000 records per import operation, max 500MB per import file, streaming parser with constant memory. FBD-IS1: imported content that has not passed the sanitizer cannot be written to the Content Vault. The migration tool is the receiving dock. The food safety inspector works the dock the same as the sales floor.
- **`loopctl translate --from contentful`** — reads Contentful export, outputs draft constellation spec. Content types → contract schemas. Roles → surface declarations. Webhooks → bus subscriptions. Asset references → Media Loop references. 80% automatic, 20% documented for human judgment. FBD-MG1: output must pass the deployment tool's validator.
- **Tier 1 migration.** At Tier 1, migration imports run in-process through the same `processRequest` pipeline. No separate binary. `loopcms import contentful-export.json` uses the same six-phase pipeline as every other content write.

#### Supply Chain Baseline (W11 — Phase 1)

SBOM (SPDX/CycloneDX) with every release. Automated vulnerability scanning on every build. Pinned versions (lock files committed, no floating ranges). Docker base images pinned to digest and scanned. FBD-SC1: the build pipeline refuses to produce a release with CRITICAL/HIGH CVEs without a time-bounded exception.

#### Operational Runbook v1

Ships with the deployment tool. Deployment lifecycle (when to re-derive, how to validate, how to roll back pre-Rewind). Monitoring (self-verification failures as structured JSON, parseable by any log aggregator). **Incident response pipeline** — not a checklist, a pipeline: detection (structured alerts from self-verification, rate limit breaches, hash chain failures, authentication anomalies) → classification (operational anomaly vs. security incident — distinct escalation paths) → containment (operator-triggered: revoke tokens, disable extension, re-derive from known-good spec) → remediation → post-incident review → Proof Vault record. Backup/recovery (Vault snapshots, spec version history in VCS — **encrypted at rest**, access-controlled, tested quarterly). FBD-OP1: deployment output includes monitoring config; deploy without alerts → warning. FBD-BK1: backup outputs are encrypted with a key that is not stored alongside the backup. Unencrypted backup → blocked. **FBD-BK1 amendment (NASA RCR):** backup success requires post-backup integrity verification — each backup includes a verification hash confirmed before reporting success. Backup integrity is verified at backup time, not only during monthly restore tests.

#### Watchdog and Health Monitor (NASA RCR)

NASA nests fault protection: hardware watchdog → software health monitor → safe mode → ground team. The CMS mirrors this:

- **Liveness heartbeat.** The system emits a heartbeat on a fixed interval (configurable, default 10s). If the heartbeat stops, the watchdog triggers Safe Mode transition. The heartbeat carries system metrics (response latency p99, error rate, memory pressure, active connection count).
- **Health monitor.** Continuous evaluation of heartbeat metrics against configured thresholds. Graduated response: log → alert → throttle (DEGRADED state) → Safe Mode. A response latency spike or error rate sustained above threshold triggers DEGRADED before the system fails hard. The fire alarm that goes off before the fire reaches the sprinklers.
- **Process supervision.** If `processRequest` hasn't completed within FBD-TE1's outer bound (default 30s), the request is killed and the anomaly logged. Sustained timeouts trigger health monitor escalation.

The watchdog is infrastructure, not a feature. It ships with Phase 1 alongside the operational runbook.

**Secret rotation runbook.** Covers: database credentials, JWT signing keys, API keys, CDN credentials, S3 credentials, HMAC log integrity keys. Rotation schedule declared in the constellation spec. The deployment tool generates rotation reminders. Leaked-secret procedure: rotate immediately, re-derive, audit Proof Vault for access during exposure window.

#### Dev/Prod Security Parity

**Theo's finding.** `loopctl dev` runs with "relaxed enforcement." What exactly is relaxed:

- **Relaxed:** TLS requirement (localhost exemption). Rate limits (higher thresholds for rapid dev iteration). Proof Mode (optional in dev). SBOM generation (not required for local dev builds).
- **Not relaxed:** Content sanitization (same pipeline). RBAC (same permission model). CSRF tokens (same enforcement). Capability model (same contracts). Media ingress (same validation). Output encoding (same escaping).

The documentation carries a table: "What changes between dev and production" with exactly these items. FBD-DP1: the capabilities and content security pipeline are identical in dev and production. The only differences are operational (TLS, rate limits, audit). Developers experience the same security boundaries they'll encounter in production.

#### Content Revision History (W12 — Phase 1)

Every content write through `processRequest` creates a revision record in a `content_revisions` table alongside the Content Vault write, within the same database transaction. Revisions store: full content snapshot, author ID, timestamp, revision number, change summary (fields modified). If the revision write fails, the content write rolls back — content integrity over revision availability.

**Admin UI: History view.** Per content item — visual diff between any two revisions, one-click restore (creates a new revision, not a destructive overwrite). Accessible via the content editor sidebar. The editor sees "3 hours ago — Jamie changed title and body" and can preview or restore.

**Revision cap.** Configurable per content type in the constellation spec (default 50 revisions per content item). Oldest revisions pruned by a background job, not inline with the write. Pruning preserves the first revision (creation) and the most recent N revisions.

**API access.** `GET /api/content/:type/:slug/revisions` returns revision history (see Headless REST API section below). Revision data respects RBAC — editorial surface only.

FBD-RH1: content writes that bypass revision creation are structurally impossible — revision creation is a step in `processRequest`'s `reqLog` phase, wrapped in the same transaction as the content write. The notebook writes itself every time the pen touches the page.

#### Content Event Bus + Webhooks (W12 — Phase 1)

The Signal Bus (used internally at Phase 2 for revocation propagation) ships at Phase 1 carrying content lifecycle events. Events fire on every content state transition through `processRequest`.

**Event types:** `content.created`, `content.updated`, `content.published`, `content.unpublished`, `content.deleted`, `content.state_changed` (workflow transitions), `media.uploaded`, `media.deleted`, `media.transformed`.

**Event payload:** `{ event, contentId, contentType, surface, slug, timestamp, actor, tenantId (Phase 2+) }`. FBD-WH1: webhook payloads never include full content body — only event metadata and content ID. Full content fetched via the headless API (prevents data exfiltration via webhook endpoint).

**Webhook registration.** Declared in the constellation spec: `webhooks: [{ url: 'https://...', events: ['content.published', 'media.uploaded'], secret: 'hmac-secret-here' }]`. Webhook URLs must be HTTPS for non-localhost. Per-registration HMAC-SHA256 secrets for payload verification.

**Delivery.** HTTP POST with JSON payload + HMAC signature header. Retry with exponential backoff (3 attempts: immediate, 30s, 5min). After 3 failures, dead-letter queue — visible in admin UI under Settings. Webhooks that fail 10 consecutive deliveries are auto-disabled with operator notification. Webhook delivery logged in Proof Vault.

**Internal consumers.** The event bus drives cache invalidation (FBD-CA1), search index updates (FBD-FTS1), sitemap regeneration, and RSS feed updates — all Phase 1 consumers of the same event stream that external webhooks consume. One bus, many listeners.

#### SEO Infrastructure (W12 — Phase 1)

**SEO fields on every content item.** Implemented as a standard field group attached to all content types via the Phase 0 schema grammar. The admin UI renders SEO fields in a collapsible panel below the main content editor — slug, meta title, meta description, OG image selector, canonical URL, noIndex toggle, structured data editor. Auto-population: slug generated from title on first save (editable), meta title defaults to content title, meta description defaults to first 160 characters of body.

**XML Sitemap — as a Presentation Loop.** The sitemap is not a special-case generator. It is a built-in Presentation Loop that reads published content on the public surface and renders it in sitemap XML format instead of HTML. `GET /sitemap.xml` returns `<urlset>` with `<url>` entries for every published content item with a slug. Includes `<lastmod>` from the content's last-modified timestamp and `<changefreq>` derived from content type (configurable in the spec). Sitemap regenerated on `content.published` and `content.unpublished` events from the content event bus. At Tier 1: generated in-process. At Tier 2+: cached, invalidated by events.

**RSS/Atom Feeds — as a Presentation Loop.** Same pattern as the sitemap. Built-in Presentation Loops rendering the public surface in RSS 2.0 and Atom XML formats. `GET /feed.xml` (RSS), `GET /atom.xml` (Atom). Configurable per content type: `feeds: { article: { enabled: true, limit: 20 } }`. Feed entries include title, slug, publication date, author, and content excerpt. Feed regenerated on `content.published` events.

**Redirect engine.** Redirect table from the constellation spec applied at the `processRequest` routing layer before contract resolution. `loopctl redirects add /old /new 301` for CLI management. Redirect chains capped at 3 hops — the fourth hop returns the last valid target with a warning logged. Redirect creation rate-limited. Redirect table included in deployment dry-run validation.

**`robots.txt`.** Generated by the deployment tool from the constellation spec. Configurable per surface: `robots: { publicSurface: { disallow: ['/admin', '/api'] } }`. Served as a static file.

FBD-SEO1: content without a slug cannot transition to PUBLISHED state on a public surface. The `processRequest` validation phase rejects the state transition. No slug, no public URL, no publication.

#### Full-Text Search (W12 — Phase 1)

**Search contract.** `SEARCH_CONTENT` added to `CONTRACT_CONFIGS`:

```
SEARCH_CONTENT: {
  type: 'read', surface: 'required',
  sanitize: false,
  rateLimit: 'public',
  rbacPermission: 'content:read',
  proofLevel: 'normal',
}
```

**Phase 1 implementation (Tier 1).** SQLite FTS5 virtual table over content fields (title, body, slug, taxonomy terms). Index updated synchronously on content write — the `reqLog` phase of `processRequest` triggers the FTS update within the same transaction. Query via `SEARCH_CONTENT` contract: `GET /api/search?q=term&surface=public&type=article`.

**Phase 2+ implementation (Tier 2/3).** Pluggable search adapter interface. Default: Postgres `tsvector` full-text search with `GIN` index. Adapter interface for Meilisearch, Elasticsearch, Algolia — the adapter receives content events from the event bus and maintains its own index. Search index updates async via event bus at Tier 2+.

**Search index reconciliation.** Periodic reconciliation (daily at Phase 1, hourly at Phase 2+): compare Content Vault record count and checksums against search index, rebuild on mismatch. Same principle as FBD-CI1 (content integrity at rest) applied to the search index.

**Admin UI search.** Search bar at the top of the content list view. Searches across all content types the user's RBAC permits. Results ranked by relevance, filterable by content type, status, date range, taxonomy.

FBD-FTS1: search results respect Content Surface boundaries. Public search only returns published content on the public surface. Editorial search only returns content the requesting user's RBAC permits. The search contract inherits the same RBAC and surface-scoping rules as `FETCH_CONTENT_AGGREGATE`. No search result leaks drafts to the public.

#### Content Relationships and Taxonomies (W12 — Phase 1)

**Relationship resolution.** The `FETCH_CONTENT_AGGREGATE` and `API_FETCH_CONTENT` contracts resolve relationship fields in responses. Configurable reference depth (default 1, max 3). Depth 1: related content items returned as summary objects (ID, slug, title, type). Depth 2+: full nested content (with revision history excluded — performance boundary).

**Taxonomy implementation.** At Tier 1 (SQLite): junction table for many-to-many relationships between content items and taxonomy terms. Hierarchical taxonomies use a `parentId` column with recursive queries. At Tier 2+ (Postgres): same schema, `ltree` extension for hierarchical queries. Taxonomy terms are themselves content items in a `taxonomy_terms` Content Surface — they carry slugs, metadata, and SEO fields. Taxonomy management in the admin UI: dedicated taxonomy editor accessible from Settings.

**Referential integrity.** Enforced at the `processRequest` validation phase. A reference field pointing to a nonexistent content item fails validation and the write is rejected. FBD-CR1 governs deletes: when content with inbound references is deleted, behavior is per-field in the schema — `onDelete: 'reject'` (default, delete refused with list of referencing items), `onDelete: 'nullify'` (references set to null, referencing items updated), `onDelete: 'cascade'` (referencing items deleted — dangerous, requires `content:delete_cascade` permission). Cascade deletes logged individually in Proof Vault.

**Rewind interaction.** Constellation Rewind (Phase 4) rolls back topology, not content. Content relationships reference content items, not topology. If Rewind removes a content type that other content references, FBD-CR1's reject/nullify/cascade rules apply to the Rewind operation — the compatibility checker validates relationship integrity before applying the rewind. Rewind that would orphan references is refused unless the operator specifies a resolution strategy.

#### Headless REST API (W12 — Phase 1)

The REST API is a Presentation Loop. It reads from Content Surfaces using the same contracts as the admin UI or any other consumer. No separate data path. No separate access control. The API is a serialization layer on top of the architecture that already exists.

**Endpoints:**

- `GET /api/content/:type` — list content items. Query params: `surface` (required for public, defaults to editorial for authenticated), `page`, `limit` (default 20, max 100), `fields` (field selection — comma-separated), `depth` (reference resolution depth, default 1), `sort` (field + direction), `filter[field]=value` (field-level filtering), `taxonomy[name]=term` (taxonomy filtering).
- `GET /api/content/:type/:slug` — single content item by slug. Same query params for fields, depth.
- `GET /api/content/:type/:id/revisions` — revision history (authenticated, editorial surface only).
- `GET /api/search` — full-text search (see Search contract above).
- `GET /api/taxonomies/:name` — list taxonomy terms (hierarchical structure preserved).
- `GET /sitemap.xml`, `GET /feed.xml`, `GET /atom.xml` — built-in Presentation Loop outputs.

**Authentication.** Public surface: API key (read-only, rate-limited per key via FBD-RL1, revocable with immediate propagation). Editorial surface: JWT (same token as admin UI). API keys managed via `loopctl api-keys create --surface public --name "frontend"`.

**Response format.** JSON with flat, typed structures. Relationship fields returned as summary objects at depth 1, expandable via `depth` param. Pagination via `Link` headers and response metadata. `ETag` and `Cache-Control` headers for HTTP caching (feeds into Layer 2 caching — see Response Caching section below).

**`CONTRACT_CONFIGS` entries:**

```
API_FETCH_CONTENT: {
  type: 'read', surface: 'required',
  sanitize: false,
  rateLimit: 'api',
  rbacPermission: 'content:read',
  proofLevel: 'normal',
}
API_SEARCH_CONTENT: {
  type: 'read', surface: 'required',
  sanitize: false,
  rateLimit: 'api',
  rbacPermission: 'content:read',
  proofLevel: 'normal',
}
```

**GraphQL.** Not Phase 1. Phase 2 or extension. The REST response shape is designed for GraphQL compatibility — flat structures with explicit relationship fields map 1:1 to GraphQL resolvers. When GraphQL ships, it reads the same contracts through the same pipeline. REST first because it's universal, cacheable by CDNs, and requires zero client-side tooling. The API key works with `curl`. The Phase 1 developer experience is `curl https://mysite.com/api/content/articles`.

#### Response Caching (W12 — Phase 1)

**Three-layer model:**

**Layer 1 — Application cache.** In-memory LRU cache for `FETCH_CONTENT_AGGREGATE` and `API_FETCH_CONTENT` responses on public surfaces. Cache key: contract + surface + query params + locale. TTL configurable in the constellation spec (default 60s). At Tier 1: in-process LRU (configurable max entries, default 1000). At Tier 2+: Redis or equivalent.

**Layer 2 — HTTP cache.** `Cache-Control` and `ETag` headers on public API responses. `Cache-Control: public, max-age=60, stale-while-revalidate=300` for public surface content. `Cache-Control: private, no-cache` for editorial surface. CDN respects these headers. CDN cache purge triggered by content events via webhook at Phase 2.

**Layer 3 — Edge cache (Tier 3 only).** Edge caching via CDN configuration generated by the deployment tool. Phase 2+ when CDN integration matures.

**Cache invalidation.** FBD-CA1: write operations (`STORE_CONTENT`, `STORE_MEDIA`) trigger cache invalidation for the affected surface via the content event bus. At Tier 1: synchronous LRU eviction. At Tier 2+: Redis key deletion + CDN purge (bounded by CDN purge propagation time — sub-second for most CDNs, documented in two-column disclosure). The editor publishes, the cache clears, the next public request gets fresh content. Stale reads after writes bounded by event propagation, not unbounded.

#### Publishing Workflow Refinements (W12 — Phase 1)

The existing five-state workflow (`DRAFT → IN_REVIEW → SCHEDULED → PUBLISHED → ARCHIVED`) gains two refinements from the competitive gap analysis:

**Backward transition comments (FBD-WF1).** Backward stage transitions (e.g., IN_REVIEW → DRAFT, PUBLISHED → ARCHIVED) require the `content:reject` permission and a mandatory comment field explaining the reason. No silent demotion of content state. The comment is stored in the revision history and logged in Proof Vault. The editor whose content is sent back sees "Returned to Draft by [reviewer]: [reason]" in the content editor.

**Review escalation timer.** Configurable in the constellation spec: `workflow: { escalation: { inReview: 48h, approval: 24h } }`. If content sits in `IN_REVIEW` for more than the configured duration, the submitter is notified and the admin is alerted. Stale review queues are where editorial velocity goes to die. The Clock fires the escalation check on its existing schedule.

#### Time Travel Surfaces (Weird RCR — Phase 1)

The revision history (FBD-RH1) stores per-record snapshots. But it's record-scoped — "show me this article at version 7." The cross-graph question is different: "show me the entire public surface as it existed at 3:47 PM on March 15th."

**Temporal query modifier.** `FETCH_CONTENT_AGGREGATE` and `API_FETCH_CONTENT` gain an optional `at` parameter. When present, `reqExecute` reads from `content_revisions WHERE revision_timestamp <= :at ORDER BY revision_timestamp DESC LIMIT 1` instead of the live content table. Not a new surface — a temporal projection of any existing surface. Not a new contract — a modifier on existing read contracts.

**Admin UI integration.** The Preview button gains a date picker. The editor sees "Preview as of [date]" alongside "Preview on [surface]." Two preview dimensions — spatial (which surface) and temporal (which moment).

**Headless API integration.** `GET /api/content/articles?at=2026-03-15T15:47:00Z` returns the content graph as it existed at that timestamp. The API response carries `X-Time-Travel-Horizon: [oldest-available-timestamp]` so the consumer knows the temporal boundary. The revision cap (default 50 per item) bounds the horizon — time travel only reaches as far back as revisions exist.

**RBAC.** Temporal queries on the editorial surface require `content:read`. On the public surface, temporal queries are configurable per surface (some operators may not want public time travel). Default: editorial only.

**Performance.** At Tier 1 (SQLite), compound index on `(content_id, revision_timestamp)`. At Tier 2 (Postgres), same index. The query is a range scan, not a table copy. No materialized temporal surfaces needed.

No CMS in the fifteen surveyed does cross-content-graph temporal queries. Git does file-level time travel. Notion does page-level version history. "Show me my entire site as it looked last Tuesday" currently requires a full backup restore. This makes it a read query.

#### Content Seismograph (Weird RCR — Phase 1)

The editor presses Publish. Content goes live. What they don't see: the sitemap regenerates, the RSS feed updates, 3 cached pages invalidate, 2 webhooks fire, the search index updates, 4 articles that reference this one now have a live link. The editor presses one button and causes a magnitude-7 content event with no instrumentation.

**Pre-publish effect preview.** A `PREVIEW_EFFECTS` internal contract. Takes a content ID and a proposed state transition. Reads the event bus subscription list (FBD-WH1), the relationship index (FBD-CR1), the cache key registry (FBD-CA1), and the Presentation Loop manifest. Returns the effect list. Does not execute anything — pure read.

**Admin UI integration.** The Publish button gains an expandable panel. Before confirming, the editor sees: "Publishing this will: update the sitemap, add to the RSS feed, fire webhooks to [slack.example.com, zapier.com], invalidate cache for [/articles, /homepage, /category/news], resolve references in [3 articles], and update taxonomy page [/category/company-news]." Optional — the editor can still one-click publish without reading it. The seismograph reading shows before the quake.

**Performance.** The preview reads in-memory registries. The webhook list, relationship index, and cache key map are all in-process at Tier 1. Target: <100ms.

No CMS in the fifteen shows pre-publish downstream effect previews. The Seismograph turns the Publish button from a mystery into a map.

#### Déjà Vu — Content Similarity Detection (Weird RCR — Phase 1)

The full-text search (FBD-FTS1) indexes published and draft content. Nobody checks whether substantially similar content already exists when an editor creates new content. At 50 articles, the editor knows. At 500 articles across 3 editors, nobody knows.

**Similarity check on draft save.** When the editor saves a draft, the CMS runs the draft's title and opening paragraph through the search index asynchronously and returns similar existing content. Not blocking — advisory. A small banner in the editor sidebar: "Similar content found: [Article Title] (published 3 months ago, 78% term overlap)." The editor can dismiss or click to compare.

**Architectural fit.** Uses existing `SEARCH_CONTENT` contract (FBD-FTS1). Not in the `processRequest` critical path — runs async after the write completes. The draft saves immediately. The similarity check arrives as a non-blocking notification. At Tier 1 (FTS5): term-based similarity using BM25 scoring on extracted keywords. At Tier 2+ (pluggable search): vector similarity if the search adapter supports it. The adapter interface gains an optional `findSimilar(content)` method.

**Risk.** False positives. Content about the same topic will trigger. Mitigation: high default threshold (0.7), dismissible, only shown once per draft (not on every save).

#### Constellation Fingerprint (Weird RCR — Phase 1)

The Spec Version Store holds append-only constellation spec history. `loopctl deploy --spec-version 47` re-derives from version 47. But 47 is a number. The operator can't remember whether version 47 was before the rebrand or after the new content type.

**Human-memorable state names.** Every spec version gets a deterministic name generated from its spec content hash. Two adjective-noun pairs plus a short numeric suffix: `amber-lighthouse-42`, `velvet-compass-17`, `quiet-thunder-88`. Deterministic: same spec content always produces the same fingerprint. Word lists: 256 adjectives × 256 nouns × 100 numeric suffixes = ~6.5M unique fingerprints.

**CLI integration.** `loopctl status` shows: `mysite · NOMINAL · amber-lighthouse-42 (v47) · deployed 3 hours ago`. `loopctl spec-history` shows fingerprints alongside version numbers. `loopctl rewind amber-lighthouse-42`, `loopctl diff amber-lighthouse-42 velvet-compass-17` — fingerprints work everywhere version numbers work.

**Storage.** Each version record carries: `{ version: 47, hash: '...', fingerprint: 'amber-lighthouse-42', timestamp: '...', diff: '...' }`. Layered on top of the Spec Version Store. Near-zero implementation cost.

**Risk.** Fingerprint collision within a single deployment. Mitigation: 6.5M unique names, realistic deployments will never exceed thousands of versions. If collision detected, append version number: `amber-lighthouse-42-v312`.

The fingerprint makes deployment state conversational. "Roll back to amber-lighthouse" is something a non-technical stakeholder can say in a meeting.

#### The Stranger Walk (Weird RCR — Phase 1)

The structural verifier (W9) checks architectural topology. The Proof Vault verifies data integrity. The watchdog checks process health. Nobody checks whether the site works as a visitor. Published content might reference a deleted image. A redirect might loop. The sitemap might list a slug that returns 404. The structure is sound. The surface is broken.

**Self-navigation verification.** A Clock-triggered verification job that navigates the public surface as an unauthenticated visitor. Fetches every URL in the sitemap, follows internal links, checks image references, validates redirects, confirms RSS entries resolve, queries the API for every content type. Produces a Proof Vault entry: "Stranger Walk complete. 847 URLs checked. 2 broken image references. 1 redirect loop at /old-blog → /old-blog."

**Architectural fit.** A verification loop, same architectural category as the structural verifier (W9). Clock-triggered (configurable interval — daily default, hourly for high-traffic sites). Internal — does not make external HTTP requests. Reads from the same data sources that public requests read from, using the same contracts. The Stranger Walk is `processRequest` called with a synthetic public-surface identity, walking the content graph.

**FBD-SW1.** Broken public-surface references detected by the Stranger Walk trigger a Proof Vault entry and admin notification. Threshold breach (configurable, default 5% of URLs returning errors) triggers DEGRADED state transition. The Stranger Walk follows the same budget/scheduling pattern as verification budgeting (FBD-VB1) — budget per cycle, full coverage within K cycles. Delta Walk (check only URLs affected by recent publishes/unpublishes) between full walks.

No CMS in the fifteen does internal synthetic monitoring as a first-class verification primitive. External tools (Pingdom, Datadog Synthetics) do URL checking from outside. The Stranger Walk catches the break at the layer that matters — the one the customer sees.

#### Ghost Links — Deleted Content Archaeology (Weird RCR — Phase 1)

FBD-CR1 handles inbound references when content is deleted. Nobody handles outbound references — the links, relationships, and taxonomy associations the deleted content carried. When the CEO's letter is deleted, the fact that it linked to the investor relations page, referenced 3 team member profiles, and was tagged "company news" is lost with it.

**Outbound reference preservation.** When content is deleted (and the final revision is created per FBD-RH1), the CMS preserves the deleted content's outbound reference map as metadata in the Proof Vault. Not the content itself — the graph edges. "Deleted item [CEO's Letter, /ceo-letter] pointed to: [/investor-relations, /team/alice, /team/bob, /team/carol] and was tagged [company-news, quarterly]."

**Implementation.** An extension of the `reqLog` phase of `processRequest` for `DELETE_CONTENT` operations. Before the delete commits, extract outbound references from the content's relationship fields. Write the reference map to the Proof Vault as a `content.ghost_links` entry. Storage: a JSON object per deleted content item, stored alongside the deletion audit entry. Minimal — hundreds of bytes per deleted item.

**Queryable.** `loopctl ghost-links /ceo-letter` returns the preserved reference map. Admin UI: a "Ghost Links" view in the content type list showing recently deleted content and what it pointed to. Ghost Links follow the same Proof Vault retention policy as other forensic entries.

No CMS in the fifteen preserves outbound references from deleted content. Trash/recycle bins preserve full content temporarily — but when the trash is emptied, the graph edges are gone forever.

**Standards (6 amendments):**
- Content Surface schema, aggregate/metadata contracts, surface-to-loop mapping, locale-variant surfaces
- Media contracts, embed declaration schema with accessibility requirements
- Publishing Workflow Pipeline declaration (with escalation timer and backward transition comments)
- Authentication (identity model, session, RBAC, MFA)
- Content sanitization (input sanitizer, output encoding)
- Content modeling: relationship fields, taxonomy declarations, SEO field class, content events, API surface

**Infrastructure (22 components):**
- Admin UI: Presentation Loop on editorial surface, RBAC-gated, WCAG 2.2 AA (FBD-AC1), CSRF-protected (FBD-CF1), with first-run experience, search bar, revision history view, SEO panel, taxonomy editor, Seismograph pre-publish panel, Déjà Vu similarity notifications, temporal preview date picker
- Deployment tool v1: spec → Docker Compose + single-file, dry run (FBD-DD1), Spec Version Store with Constellation Fingerprints, TLS (FBD-TL1), secrets (FBD-SM1), spec sanitization (FBD-SI1), redirect table, robots.txt generation
- Request pipeline: `processRequest` six-phase function with bounded execution (FBD-TE1), sanitization verification (FBD-SV1), one-way content flow, revision creation (FBD-RH1), content event emission, Ghost Link preservation on delete
- Media Loop with ingress security, eager transforms, coalescing, budgeting (FBD-TB1), isolation
- Proof Vault + Verification Log + manifest verifier + hash chain (FBD-LI1) + dual-format logging
- Content integrity checksums (FBD-CI1)
- Rate limiting at four layers (FBD-RL1) + content sanitization pipeline (FBD-CS1) + output encoding (FBD-OE1)
- Watchdog/health monitor with liveness heartbeat and graduated response
- System lifecycle state machine: NOMINAL → DEGRADED → SAFE_MODE → RECOVERY (FBD-LM1)
- Content revision history: per-record versioning with diff, restore, and temporal query support (FBD-RH1)
- Content event bus + webhook delivery system (FBD-WH1)
- SEO infrastructure: slug management, metadata fields, redirect engine (FBD-SEO1)
- Full-text search: FTS5 (Tier 1) with contract-based access and similarity detection (FBD-FTS1)
- Content relationships + taxonomies with referential integrity (FBD-CR1)
- Headless REST API: Presentation Loop with API key management and temporal query parameter
- Response cache: Layer 1 in-memory LRU with event-driven invalidation (FBD-CA1)
- Time Travel Surfaces: temporal query modifier on read contracts with `at` parameter
- Content Seismograph: `PREVIEW_EFFECTS` internal contract for pre-publish downstream effect preview
- Déjà Vu: async content similarity detection via FTS5 search index on draft save
- Constellation Fingerprint: deterministic human-memorable state names on Spec Version Store
- Stranger Walk: Clock-triggered public surface self-navigation verification (FBD-SW1)
- Ghost Links: outbound reference map preservation on content deletion in Proof Vault

**Integration (6 systems):**
- Migration tooling: `loopctl import` (FBD-IS1 sanitization) + `loopctl translate` + Tier 1 in-process migration
- Operational runbook v1 with incident response pipeline, secret rotation, and System Voice guide
- Supply chain baseline: SBOM, dependency scanning, pinned versions (FBD-SC1)
- Built-in Presentation Loops: XML sitemap, RSS 2.0 feed, Atom feed (event-driven regeneration)
- API key management: `loopctl api-keys create/list/revoke`
- Running demo: single-file Tier 1 setup in sixty seconds → editor publishes in three clicks → same spec deploys to Docker. Plus full two-surface verification suite, search, SEO metadata, revision history, and webhook notification.

**Verification gate:** The Walkman test, security edition — 47 verification items across eight domains. *Usability (9):* Editor logs in, sees role-permitted actions, creates article with SEO metadata (slug auto-generated, meta description populated), uploads photo, previews on public surface, schedules, publishes — without encountering architectural vocabulary; editor searches for article by keyword and finds it; editor views revision history and restores a prior version. *Security (11):* Wrong credentials rejected and rate-limited; unpermitted publish rejected; XSS in title sanitized and verified clean on render; draft invisible from public surface; image EXIF stripped; SVG script sanitized; unlisted embed rejected; unbudgeted transform rejected; imported XSS sanitized; CSRF-tokenless request rejected; no literal secrets in generated config. *Integrity (4):* Verification Log running with valid hash chain; ephemeral storage on non-Vault loops; content checksums valid (FBD-CI1); deployment dry-run validates before apply (FBD-DD1). *Accessibility (3):* Keyboard navigation complete; screen reader compatible; SBOM present. *Content Infrastructure (5):* Sitemap at `/sitemap.xml` contains all published slugs; RSS feed at `/feed.xml` contains latest articles; REST API at `/api/content/articles` returns published content with relationship references resolved; webhook fires on publish event (HMAC-verified); search returns published articles, excludes drafts. *Differentiation (12):* Temporal query `GET /api/content/articles?at=[yesterday]` returns content as it existed yesterday; query with timestamp before first revision returns `X-Time-Travel-Horizon` header; admin UI temporal preview shows article at past timestamp; Seismograph publish preview shows correct webhook count, cache invalidation count, and relationship count for a content item with known downstream effects; Déjà Vu — create draft with 80% overlap to existing article → similarity notification appears in editor sidebar; `loopctl status` shows constellation fingerprint; `loopctl spec-history` shows fingerprints; `loopctl diff [fingerprint-1] [fingerprint-2]` works; Stranger Walk runs → Proof Vault entry shows "N URLs checked, M issues found"; introduce broken image reference → Stranger Walk catches it on next run; delete content with outbound references → `loopctl ghost-links [slug]` returns preserved reference map; Ghost Links visible in admin UI. *Integration (3):* Single-file Tier 1 demo (download, run, same spec deploys to Docker); watchdog heartbeat visible in `loopctl status`; lifecycle state reports NOMINAL.

**What this phase proves:** The capability model extends to humans (RBAC), media (ingress), and content (sanitization). An editor uses the system without understanding it. The operational, security, and fault-response stories start on day one. The content infrastructure is complete: revision history, search, SEO, relationships, headless API, webhooks, caching, and feeds all route through the same `processRequest` pipeline and `CONTRACT_CONFIGS` pattern. The differentiation capabilities — time travel, seismograph, déjà vu, constellation fingerprint, stranger walk, ghost links — all route through the same mechanisms without new architectural concepts. The Closure Wall absorbed fifteen new capabilities across two RCRs without widening.

**Demo narrative (FWW(C) + Hitchhiker's + Weird RCR, updated for v1.10).** The verification gate is QA. The demo is a movie. No plugin conflicts. No database migration. No "your PHP version is incompatible." Alex — a content editor who has never seen this CMS — downloads one file, runs one command. Ninety seconds later, Alex is looking at "Hello, World — your first article" in the admin UI. Alex writes the company rebrand article, uploads the new logo (EXIF stripped without Alex knowing), copies a code snippet with a `<script>` tag from the old site (the UI shows "We cleaned up some HTML in your title — script tags aren't allowed in content"), fills in the SEO panel (slug auto-suggested, meta description pre-populated from the first paragraph), tags the article with "company news" and links the author profile, previews on the public surface, schedules publication for Monday, and sees five buttons and nothing else. Meanwhile: the sitemap updates, the RSS feed includes the article, the webhook fires to the Slack integration, the revision history records every edit, and the search index has already indexed the content. A React developer on the team runs `curl https://mysite.com/api/content/articles/company-rebrand` and gets JSON. Before pressing Publish, Alex glances at the Seismograph panel: "This will update the sitemap, add to the RSS feed, fire the Slack webhook, and resolve 3 references in other articles." Alex publishes. The next day, Alex starts a Q2 roadmap article and sees a Déjà Vu notification: "Similar content found: 'Q1 Roadmap Update' published 3 months ago." The CTO runs `loopctl status` and sees: `mysite · NOMINAL · amber-lighthouse-42 · deployed 3 hours ago`. Two weeks later, the Stranger Walk catches a broken image on an old blog post nobody remembers editing — the CMS told them before a customer noticed. Sixty seconds if you're fast. Three minutes if you're showing it to a buyer. The architecture is invisible. The experience is the product.

---

### Phase 2 — The Walls

*Margaux: "Assigning the aisles and installing the cameras."*

**What ships:** Multi-tenant isolation, Proof Mode with compliance integrations, tenant-scoped media, incremental spec operations, intrusion detection, backup hardening, verification budgeting, log aggregation, CDN cache integration, tenant-scoped webhooks, pluggable search adapters, GraphQL API, Editorial Pulse, and Content Weather.

#### Multi-Tenant Isolation (Sol, Nyx, Dara)

Auth Gate `tenantId` stamping, tenant-scoped Vault Loop factory (RLS Path A or schema-per-tenant Path B), atomic migration runner, periodic Clock-triggered verification, constellation spec `multiTenant` declaration. Path A guard: connection wrapper refuses `SET` on tenant session variable.

The admin UI extends: tenant selector for operators managing multiple tenants. Per-tenant content views. The editorial surface spans tenants for super-admins; tenant-scoped editorial surfaces for tenant-specific editors. Locale × tenant produces the surface matrix — `editorial-en-tenantA`, `public-ar-tenantB` — all provisioned from the spec.

**Tenant-scoped RBAC.** The RBAC model extends: roles are tenant-scoped. An editor in Tenant A has `content:write` for Tenant A only. A super-admin has cross-tenant permissions. The JWT token carries `tenantId`; every capability check includes tenant scope. FBD-RB1 governs: a capability-bearing request must have both a valid permission and a valid tenant scope.

#### Tenant-Scoped Media (W10 — Phase 2)

Per-tenant Media Loop namespaces. Per-tenant storage quotas. Media garbage collection. CDN purge integration. The deployment tool provisions tenant media namespaces alongside tenant database scoping.

#### Incremental Spec Operations (Lens RCR P3-F1)

The deployment tool and self-verification system each get two modes:

**Deployment tool:**
- **Full re-derive** — reads entire spec, parses, validates, generates, verifies. Correctness backstop. Runs on initial deploy, nightly, or on-demand.
- **Incremental derive** — reads the delta since last validated state, parses changed IR nodes, validates delta against cached state, generates affected topology slices, verifies those slices. McMaster-fast. The spec is the catalog; the incremental derive is the indexed search.

**Self-verification:**
- **Full verification** — startup + configurable schedule (daily at low scale, weekly at high scale). Checks everything. The factory post-session replay.
- **Delta verification** — tight schedule (hourly). Checks only what changed since last full verification, plus a random sample of unchanged checks. F1 telemetry: live analysis on the delta, full replay on the archive.

**Dirty-flag delta verification (L21 Cross-Pollination — Isomorphism 10).** Each verifiable component (surface, tenant, extension) carries a `verificationDirty` flag. Spec changes set the flag on affected components. Delta verification checks flagged components + random sample of unflagged. Full verification checks everything and clears all flags. Verification scheduler mirrors L21's `mainLoop`: check `anyDirtyFlags || scheduledFullSweep` before running verification. FBD-VB1 (verification budgeting) is L21's `MAX_TICKS_PER_FRAME` — cap work per cycle. L21 precedent: `alu.displayNeedsRefresh` — skip expensive renders when state hasn't changed.

**Verification budgeting (FBD-VB1).** Self-verification has a compute budget: maximum CPU-seconds per verification cycle, configurable in the constellation spec. When the budget is exhausted, remaining checks are queued for the next cycle. **Bounded coverage guarantee (NASA RCR amendment):** verification must guarantee full coverage within K cycles (configurable, default 10). Rolled-over items are prioritized in the next cycle. No item remains unverified for more than K cycles. The cap prevents storms. The bound prevents neglect. NASA's memory scrubbing guarantees every page is scrubbed within a bounded interval — the CMS verification system provides the same guarantee for structural checks.

This doesn't matter at Phase 1 with 2 tenants. It's the difference between 500-tenant feasibility and 500-tenant failure. Phase 2 engineering.

#### Intrusion Detection (W11 — Phase 2)

**Dara's finding:** The self-verification system checks *structural* integrity. It doesn't check for *behavioral* anomalies. Phase 2 adds behavioral monitoring:

- **Capability usage anomaly detection.** Baseline per-component, per-contract access patterns over a rolling window (7 days). Alert on: access volume exceeding 3σ from baseline, access patterns at unusual times, access to contracts near (but within) the permission boundary. The loss prevention team. A structurally compliant extension that suddenly reads 10x its normal data volume triggers an alert. The alert goes to the operator, not to the extension.
- **Authentication anomaly detection.** Alert on: login from new IP after extended inactivity, concurrent sessions exceeding threshold, rapid role changes, brute-force login attempts (blocked by rate limiting, but the pattern is logged for analysis).
- **Egress monitoring.** Extensions that make outbound HTTP requests: log destination, volume, payload size. Alert on: new egress destinations, volume spikes, large payloads. This is the missing piece from Sol's finding — the capability model constrains what an extension can *read*, but without egress monitoring it can't constrain what the extension *sends*.

Intrusion detection data feeds the Proof Vault. Alerts feed the incident response pipeline. The loss prevention team watches the cameras and reports to the manager.

#### Backup Hardening (W11 — Phase 2)

**FBD-BK1** from Phase 1 covers encryption. Phase 2 adds:

- **Backup integrity verification.** Monthly automated restore to an isolated environment. The backup is tested, not just stored. An untested backup is a hypothesis.
- **Backup access control.** Backup access requires a distinct permission (`backups:access`) not included in any default role. Backup operations are logged in the Proof Vault.
- **VCS security.** The constellation spec lives in version control. The VCS repository has branch protection, required reviews for spec changes, and audit logging. The spec is the system's DNA — the VCS is the biosafety cabinet.

#### Deployment Twin (NASA RCR)

NASA has OPTIMISM in the Mars Yard — same mass, same wheels, same software. Every command runs on the twin before it touches Mars. Phase 2 formalizes the staging twin: `loopctl deploy --stage` applies the validated dry-run output to a production-matched environment, runs the full verification suite (including tenant isolation checks), and only then offers `loopctl deploy --promote` to production. The twin is not optional infrastructure — it is a Phase 2 deliverable. At Tier 1, the twin is a second single-file instance on the same machine. At Tier 2+, the twin mirrors production topology in a separate namespace. The digital twin validated 500,000 telemetry variables before JPL sent commands to Mars. The CMS validates against its own twin before applying to production.

#### Proof Mode Maturation (Nyx)

Security Manifest covers surfaces + tenants. `cannotAccess` exhaustive within declared capability model — lists every contract type not assigned to the component, scoped to the spec's vocabulary, not the universe of possible accesses. Independent manifest verifier covers both declaration types. Diff Engine online: spec changes produce change records.

#### Third-Party Compliance Integration

- **Structured log format.** Verification Log in JSON-LD with CEF mapping. SIEM-native (Splunk, Datadog, Elastic).
- **Webhook on verification events.** All events, failures only, or spec-change events. GRC-ready (Vanta, Drata, Secureframe).
- **Evidence collection API.** Packaged evidence bundles for audit cycles. One API call = SOC 2 evidence package.

**Proof Endpoint.** Read-only API serving Security Manifest and Verification Log. A Presentation Loop scoped to the Proof Vault. Reads proof artifacts. Cannot modify them.

#### Revocation Propagation (W11 — Phase 2)

**Sol's finding:** The gap between "revocation declared" and "revocation enforced." Phase 2 defines the propagation model:

- **Immediate revocation for active sessions.** When a capability is revoked in the spec, the deployment tool pushes a revocation event to the Signal Bus. All components that cache capability state receive the event and invalidate their cache. The next capability check reads the current state. The gap between spec change and enforcement is bounded by event propagation time (sub-second in normal operation), not re-derive time (minutes).
- **Extension suspension.** When an extension is revoked, the admission gate sends a `SUSPEND` event. The extension's sandbox is frozen: in-flight requests complete, new requests are rejected. The extension remains frozen until the re-derive completes and either confirms the revocation or reinstates the extension. No gap. No window. The drawbridge goes up immediately. The portcullis follows.

#### Content Infrastructure Scaling (W12 — Phase 2)

**Tenant-scoped webhooks.** Webhook registrations become tenant-scoped. Each tenant can register its own webhook endpoints via the admin UI (Settings → Webhooks). Tenant webhooks receive only events for their tenant. Super-admin webhooks receive events across all tenants. API keys become tenant-scoped — each key is bound to a tenant and can only access that tenant's content.

**Pluggable search adapter.** The Phase 1 FTS5/tsvector search is sufficient for small-to-medium scale. Phase 2 adds the adapter interface for external search services: Meilisearch, Elasticsearch, Algolia. The adapter receives content events from the event bus and maintains its own index. Search queries route through the same `SEARCH_CONTENT` contract — the adapter is invisible to the consumer. Configuration in the constellation spec: `search: { adapter: 'meilisearch', url: 'http://...', apiKey: 'vault:search-key' }`.

**CDN cache integration.** Layer 2 caching matures: CDN cache purge triggered by content events via webhook. The deployment tool generates CDN purge configuration (Cloudflare, Fastly, AWS CloudFront). Per-tenant cache keys ensure tenant isolation at the CDN layer. Cache invalidation bounded by CDN purge propagation time (sub-second for most CDNs — documented in two-column disclosure: Column 1 — what the cache guarantees; Column 2 — CDN propagation is eventually consistent).

**GraphQL API.** Phase 2 adds a GraphQL endpoint alongside the REST API. Same contracts, same pipeline, same access control. The Phase 1 REST response shape was designed for this — flat, typed structures with explicit relationship fields map 1:1 to GraphQL resolvers. GraphQL queries resolve through the same `API_FETCH_CONTENT` contracts. Subscriptions (real-time content updates) via the content event bus. GraphQL schema auto-generated from the constellation spec's content type declarations.

**Monitoring dashboard.** A Presentation Loop on the Proof Vault surface — the same architectural pattern as the admin UI (editorial surface) and the headless API (public surface), applied to observability data. Renders: lifecycle state, watchdog metrics (p99 latency, error rate, memory), verification status, recent Proof Vault entries, webhook delivery health, search index status, cache hit rates. Phase 1's `loopctl status` is the CLI projection of this data. Phase 2's dashboard is the web projection. Same data, different Presentation Loop. Accessible from the admin UI under a dedicated Monitoring section (requires `admin:monitor` permission).

#### Editorial Pulse (Weird RCR — Phase 2)

The Proof Vault records every publish event. The workflow tracks every state transition. The review escalation timer fires when content sits too long. These are all reactive. Nobody aggregates them into a health signal.

**Three editorial health signals in the admin UI sidebar.** Computed from Proof Vault data and workflow state:

1. **Publishing cadence.** Rolling average: "3 articles/week (steady)" or "3 articles/week → 0 articles this week (stalled)." Trend arrow. Not a target — a mirror. The team sees its own rhythm.
2. **Review queue health.** Current depth + average time-in-review + oldest item. "7 items in review. Average: 2 days. Oldest: 6 days." The escalation timer catches individual items. The Pulse shows the pattern.
3. **Content freshness.** Count of published content by age bucket: <30 days, 30–90 days, 90–365 days, >365 days. "23 articles older than 1 year." Not enforcement. Awareness.

**Architectural fit.** Same infrastructure as the monitoring dashboard — a Presentation Loop on the Proof Vault surface. At Tier 1: computed on-demand from SQLite queries. At Tier 2+: precomputed by Clock-triggered aggregation job. Cached for 1 hour. No new mechanisms — different data source, same Presentation Loop pattern.

The Pulse is not analytics. It's a vital-signs monitor. The difference between a heart rate monitor and a full blood panel.

#### Content Weather (Weird RCR — Phase 2)

The dual-format logging writes machine-parseable data alongside human-readable descriptions. The monitoring dashboard visualizes metrics. Both are accurate. Neither is *readable*. The operator doesn't want to parse a dashboard at 7 AM. The operator wants to read a sentence.

**Daily narrative summary.** Generated from the previous 24 hours of Proof Vault data, event bus activity, and system health metrics. Delivered as a Proof Vault entry, visible in the admin UI, and optionally delivered via webhook (so it lands in Slack or email). Example:

> **Daily Weather — 22 April 2026**
> Clear skies. 4,847 requests served, 99.7% success rate. Three editors active — Jamie published 2 articles, Alex saved 4 drafts, Pat uploaded 6 images. The search index rebuilt at 3:12 AM and found everything it expected. One webhook to slack.example.com failed at 10:17 AM (timeout), retried successfully at 10:18 AM. Editorial velocity steady at 3.2 articles/week. Cache hit rate: 94%. No anomalies. No Stranger Walk findings. System state: NOMINAL since 15 March.

**Architectural fit.** Template-driven: structured data → fill-in-the-blanks template → narrative. No AI generation needed. Conditional sections — anomaly section only appears if anomalies exist, webhook failure section only if failures occurred. New event type: `system.daily_weather`. Reads the same data the monitoring dashboard reads and the Editorial Pulse computes. Renders in narrative form instead of charts.

**Risk.** Template maintenance when new event types are added. Mitigation: the template reads event type metadata from the event bus schema — new event types automatically appear as "N [event type] events." Custom narrative for specific event types is additive.

The System Voice speaks in errors and CLI output. The Content Weather is the System Voice speaking when nothing is wrong. The operator who reads "clear skies" trusts the system more than the operator who sees a green dashboard and wonders what it's hiding.

#### Deliverables

- Standard amendment: multi-tenant declaration, Auth Gate tenantId, Vault Loop factory extension, migration runner FBD, periodic self-verification, tenant-scoped RBAC
- Deployment tool v2: multi-tenant provisioning + tenant-scoped media + incremental derive mode + revocation propagation + CDN purge configuration
- Self-verification: full + delta modes with sampling + verification budgeting (FBD-VB1)
- Admin UI extension: tenant selector, per-tenant content views, tenant-scoped RBAC, tenant webhook management
- Proof Mode: manifest generator (surfaces + tenants), independent verifier, Diff Engine, Proof Endpoint
- Compliance: SIEM format, webhooks, evidence API
- Intrusion detection: capability anomaly, authentication anomaly, egress monitoring
- Backup hardening: encryption, integrity verification at backup time (FBD-BK1 amended), access control
- Deployment twin: `loopctl deploy --stage` → twin validation → `loopctl deploy --promote`
- Content infrastructure scaling: tenant-scoped webhooks, pluggable search adapter, CDN cache integration, GraphQL API
- Monitoring dashboard: Presentation Loop on Proof Vault surface — lifecycle state, watchdog metrics, verification status, webhook health, search index status, cache hit rates
- Editorial Pulse: admin UI sidebar widget — publishing cadence, review queue health, content freshness signals (Presentation Loop on Proof Vault surface)
- Content Weather: daily narrative system health summary — template-driven, delivered via Proof Vault entry + optional `system.daily_weather` webhook
- Running demo: multi-tenant CMS with admin UI, content surfaces, tenant-scoped media, incremental spec operations, compliance-ready proof, intrusion detection, encrypted backups, staging twin, GraphQL endpoint, CDN-cached API responses, monitoring dashboard, editorial health signals, daily weather report

**Verification gate:** Two-tenant constellation. Tenant A SELECT → only Tenant A rows. Session variable manipulation → refused. Tenant A media → Tenant A namespace only. Proof Endpoint → manifest with exhaustive `cannotAccess`, independently verified. Modify spec → Diff Engine change record. Evidence API → packaged bundle. Incremental derive on a single surface addition → only the affected slice regenerated, full re-derive produces identical output. Revoke an extension → immediate suspension, no requests processed during gap. Rapid spec changes → verification checks queued, not re-derive storms. Restore backup to isolated environment → data intact, secrets encrypted. Simulate capability usage spike → anomaly alert fires. GraphQL query returns same data as REST endpoint for identical content request. Monitoring dashboard shows lifecycle state, verification status, and webhook delivery health. CDN cache purge fires on content publish — subsequent request serves fresh content. Editorial Pulse shows publishing cadence, review queue depth, and content freshness in admin UI sidebar. Content Weather daily summary appears in Proof Vault and delivers via webhook to configured endpoint.

**Revenue gate.** Phase 2 is the enterprise MVP. Multi-tenant CMS with Content Surfaces, media, admin UI, RBAC, Proof Mode, compliance integration, migration path, incremental operations, intrusion detection, and encrypted backups. Pre-seed → Phases 0–1. Seed → Phase 2. Series A → Phases 3–4.

**What this phase proves:** Capability attenuation extends from content vocabulary to data scope to media scope to human roles. Incremental operations maintain performance at scale. Revocation is immediate, not eventual. The compliance story is production-ready. The intrusion detection story is production-ready. The admin UI works across tenants with tenant-scoped RBAC.

---

### Phase 3 — The Gate

*Margaux: "Opening the receiving dock and posting the rules."*

**What ships:** Extension admission with AI sandbox, developer onboarding tools, extension media budgets, extension lifecycle management, behavioral monitoring for extensions, and a complete extensible CMS with bounded liability.

#### Extension Admission + AI Sandbox (W6)

Manifest format, capability budgets (including AI and media budgets), admission gate, installation pipeline, self-verification, update re-admission.

**Intersective budget composition.** Multi-class extensions get the intersection of permissions. More classes = narrower scope, not wider. Media capabilities included in the intersection. The additive approach was rejected — it creates capability-escalation incentive.

**Extension admission as scripts-box verification (L21 Cross-Pollination — Isomorphism 8).** The extension admission pipeline mirrors L21's scripts-box verification pipeline:

| Scripts Box | CMS Extension Admission |
|------------|------------------------|
| Parse source text | Parse extension manifest |
| Validate against schema | Validate against capability model |
| Register in SKINS/challenge registry | Register in extension registry |
| Revert to OG on failure | Revoke capabilities on failure |
| Init-time re-verification | Monthly re-admission trigger |
| Type-mismatch rejection | Budget class mismatch rejection |
| Foundational scripts (read-only) | Platform contracts (immutable) |
| 16-slot limit per section | Max extensions per tenant |

**Extension liability declaration (Lens RCR P2-F2).** The extension manifest includes a `liabilityDeclaration` field: the developer acknowledges responsibility for the extension's output. The admission gate checks for its presence. The platform is the marketplace; the extension developer is the merchant. AI provenance metadata is operational telemetry, not legal determination of content rights. F1 supplier accountability: the team is responsible for the car, but the homologation chain traces to the supplier. Renata's finding applies: the manifest field is a *technical declaration*, not a *legal instrument*. The legal surface requires Terms of Service (Phase 3 product deliverable), a developer agreement template, and documentation of the field's legal limitations. The two-column disclosure: Column 1 — what `liabilityDeclaration` does (records the developer's acknowledgment, gates admission, creates an auditable record). Column 2 — what it doesn't do (create enforceable indemnification, substitute for legal agreements, protect the platform from being named in litigation).

**Installation pipeline.** Six-step Workflow: validate → admit → merge spec → re-derive (incremental) → self-verify → activate. **Installation rate limiting.** Max 5 extension installations per hour per tenant. Re-submission after withdrawal requires a 24-hour cooldown. FBD-RL1 applies: the installation pipeline is rate-limited to prevent the resource-drain attack Sable identified.

**AI audit trail.** AI-generated content and media carry provenance metadata (model, prompt, parameters, budget class). Provenance feeds the Proof Vault.

**Scope boundary.** CSP headers (Tier 1), iframe sandboxing (Tier 2), container isolation (Tier 3).

**Tier boundary documentation (Security RCR).** Graham's finding, refined: each tier explicitly documents what it protects against and what it doesn't. The tier boundary table (see Phase 0 — Tier 1 Single-File Architecture) carries the full specification. This table ships in the security documentation — the bounded-claims principle applied to isolation tiers.

**Sandbox breach response (NASA RCR, FBD-BM1 amendment).** The plan defines sandbox isolation per tier and behavioral monitoring for anomalies. It now also defines what happens when the sandbox *is* breached. Breach detected (egress to undeclared destination, capability usage outside budget scope, CSP violation report) → immediate extension suspension (faster than revocation — the drawbridge goes up), forensic state captured (last N requests, egress log, resource usage), operator notified with breach report, extension cannot be reactivated without re-admission through the full gate. The moat fills behind the drawbridge.

**Extension media budgets (W10 — Phase 3).** Extensions declare media capabilities in manifests. `TRANSFORM_MEDIA` budgeted separately from `FETCH_MEDIA_*`. AI-generated media carries provenance. Embed system matures: extension-provided embed sources can join the allowlist with per-extension CSP isolation and accessibility requirements.

#### Extension Behavioral Monitoring (W11 — Phase 3)

**Sol's cross-surface leakage finding.** An extension with `FETCH_CONTENT_AGGREGATE` on the editorial surface can read everything on that surface — including drafts. The capability model constrains *which contracts*, not *behavior within scope*. Phase 3 adds:

- **Egress policy declaration.** Extension manifests declare egress destinations (`egress: ['api.analytics.com', 'cdn.images.com']`). The admission gate validates egress declarations. At Tier 3, network policy enforces the declaration — the extension's container can only reach declared destinations. At Tier 2, CSP + iframe sandbox restrict outbound connections. At Tier 1, egress is documented-only (no enforcement — see Tier boundary documentation). FBD-BM1: at Tier 2+, extension network egress to undeclared destinations is blocked.
- **Data volume monitoring.** Per-extension read volume tracked. Alerts on volume exceeding declared purpose. An analytics extension that declares `FETCH_CONTENT_METADATA` but reads at the volume of `FETCH_CONTENT_AGGREGATE` triggers investigation.
- **Output sampling.** For AI extensions, periodic sampling of generated content for policy compliance (PII detection, content safety). Automated — not manual review of every output, but statistical sampling.

#### Developer Onboarding

- **Reference extensions.** Two complete examples: SEO analyzer (content-enhancement, the "serious" reference) and a **color palette extractor** that pulls dominant colors from uploaded images and suggests complementary palettes (ai-content-generation, the "that's cool" reference). Full lifecycle. Documentation and integration test. FBD-DX1. The reference extension sets the tone for the ecosystem — if the reference is boring, developers assume extensions are boring.
- **Local dev mode.** `loopctl dev` — minimal constellation, relaxed enforcement (per FBD-DP1 — same capability model, same sanitization, relaxed TLS/rate limits/Proof Mode), instant feedback. Same contracts as production. Two-minute setup.
- **Budget intersection matrix.** Precomputed table + `loopctl budget-check --classes x,y`. Know the intersection before writing code. Intersection pre-computed at admission time, stored as flat capability set in extension's runtime config. No runtime intersection computation. The `executeContract` function checks the flat set — one lookup, not a multi-class intersection computation on every request. L21 precedent: `KEYBINDING_CHORD_TARGETS[code].validDest` — validity pre-declared in config, checked at runtime.

#### Extension Lifecycle Management

- **Dependency manifest.** Version ranges. Vulnerability advisory integration (manual → OSV/GitHub Advisory DB).
- **Re-admission trigger.** Monthly re-evaluation. Budget tightening → grace period + notification. Output to Proof Vault.
- **Health dashboard.** `loopctl extensions status` — last update, health, compliance, media usage, egress patterns. It's a Content Surface.

#### Extension Terms of Service (W11 — Phase 3)

- **Developer agreement template.** Legal framework for the extension ecosystem. Covers: data handling obligations, liability allocation (the manifest field is a technical declaration — the developer agreement is the legal instrument), security requirements for extension developers, termination conditions.
- **Platform Terms of Service update.** Covers: platform liability boundaries for extension behavior, dispute resolution, data breach notification obligations.
- These are product/legal deliverables, not architectural. But they ship with Phase 3 because Phase 3 is when untrusted code enters. The receiving dock has rules, and the rules are posted.

#### Deliverables

- Standard amendment: manifest format (with liability declaration + egress declaration), budget schema (AI + media), extension spec declaration, installation pipeline, embed accessibility
- Admission gate, installation pipeline, AI provenance schema
- Deployment tool v3: extension provisioning, platform isolation, media budgets, egress policy enforcement
- Reference extensions, local dev mode, budget matrix
- Extension lifecycle management
- Extension behavioral monitoring (FBD-BM1)
- Tier boundary documentation
- Extension ToS / developer agreement template
- Running demo: CMS with admin UI, surfaces, tenants, media, RBAC, rate limits, content sanitization, and a sandboxed AI content generator with egress policy

**Verification gate:** The ReferenceError demo — AI tries to access user data, gets told the concept doesn't exist. AI tries `FETCH_MEDIA_FULL` with a `FETCH_MEDIA_METADATA` budget — ReferenceError. OVER-DECLARED manifest → specific violations named. `loopctl dev` → reference extension lifecycle in two minutes. `loopctl budget-check` → intersection printed. Extension manifest missing `liabilityDeclaration` → admission refused with reason. Extension attempts egress to undeclared destination at Tier 2+ → blocked (FBD-BM1). Extension installed and withdrawn and resubmitted within 24 hours → cooldown enforced. Five extensions installed in one hour → rate limited. Extension read volume spikes → anomaly alert.

**What this phase proves:** The admission model works for extensions and AI, with media budgets and egress controls. The ReferenceError boundary is real. Developer onboarding is two minutes. Liability is allocated by declaration *and* by agreement. Behavioral monitoring catches within-scope abuse.

---

### Phase 4 — The Safety Net

*Margaux: "Installing the undo button — with a one-way turnstile."*

**What ships:** Constellation Rewind, complete Proof Mode, media-safe rewind, and the security ratchet.

#### Constellation Rewind (W7)

Spec Version Store (append-only — established at Phase 1, extended here with compatibility checker and full Rewind pipeline), Rewind pipeline (validate → check → snapshot → apply → redeploy → verify → activate), Rewind Log → Proof Vault.

**The critical property:** Rewind works because content and media are topology-independent. Vaults hold data. Media Loops hold media. The spec declares topology. Rewind rolls back topology. Content and media survive. The Vault/Loop separation is the load-bearing property.

**Factory-driven rewind (L21 Cross-Pollination — Isomorphism 7).** `captureConstellation` and `restoreConstellation` both use state shape factories. Adding a spec feature requires updating both functions. The factories are the common ground. L21 precedent: this has broken three times in L21 — the factories prevent the failure mode by making the shape the single source of truth.

**Media in rewind (W10 — Phase 4).** Media references are topology-independent. Rewind changes which surfaces can access which media contracts, not the media itself. Compatibility checker validates media contract references. Transform cache invalidation on rewind. Media binaries never deleted by rewind.

**Hash chain break procedure (NASA RCR).** If Proof Vault hash chain verification fails on read — indicating tampering or corruption — the system transitions the Proof Vault subsystem to DEGRADED state. New proof entries continue to a fresh chain segment. The broken segment is quarantined and preserved for forensic analysis. The operator receives a forensic report: which entry broke the chain, when, the last valid entry. The system does not pretend the chain is intact. Detection without response is a camera without a guard.

#### The Security Ratchet (FBD-SR1)

**Wes's weaponization finding + Sol's revocation extension.** Rewind can roll back topology, but it cannot roll back past security-critical transitions. The security ratchet is a one-way turnstile — once you've upgraded the locks, you can't go back to the old keys.

**How it works:** Spec changes are classified as *topology changes* (adding/removing surfaces, changing contracts, modifying locale configuration) or *security transitions* (adding authentication requirements, tightening capability budgets, revoking extension permissions, adding tenant isolation, enabling Proof Mode). Topology changes are rewindable. Security transitions are irrevocable — they create a ratchet point in the Spec Version Store.

The Rewind pipeline's compatibility checker validates: "does the target spec version cross a ratchet point?" If yes, the rewind is refused with a specific explanation: "Cannot rewind past security transition [name] applied at [version]. The transition [description] is irrevocable." The operator can override with a specific, documented, audited command (`loopctl rewind --force-past-ratchet --reason "..."`) — because the operator is the coherence layer — but the override is logged in the Proof Vault as a security-critical event and triggers an alert.

**Irrevocable** (cannot rewind past): authentication requirements, capability budget tightenings, extension revocations, tenant isolation enablement, Proof Mode enablement, RBAC permission removals. **Rewindable**: surface additions/removals, locale changes, media configuration, publishing workflow modifications, non-security extension updates.

The ratchet doesn't prevent the operator from making their system less secure — it prevents Rewind from *accidentally* doing so. The operator can always re-derive forward. Forward is deliberate. Backward might be an accident — or an attack.

#### Complete Proof Mode

The Proof Vault now contains: startup + periodic verification logs, spec diffs, extension admissions, AI provenance, media ingress records, embed allowlist changes, rewind operations (including ratchet overrides), authentication anomalies, intrusion detection alerts, capability usage baselines, backup access records. The Security Manifest covers surfaces, tenants, extensions, AI agents, media capabilities. Full forensic history. The evidence API serves the complete audit trail.

#### Deliverables

- Spec Vault, compatibility checker, Rewind pipeline with media cache invalidation and security ratchet (FBD-SR1)
- Deployment tool v4: historical spec derivation with ratchet enforcement
- Complete Proof Mode: full forensic trail

**Verification gate:** Deploy with surfaces, tenants, media, extension, RBAC, Proof Mode. Rewind to pre-extension spec → extension topology removed, content preserved, media preserved, transform cache invalidated, self-verification passes, Proof Vault logs the rewind. Attempt rewind to pre-authentication spec → **refused** (FBD-SR1 ratchet). Attempt rewind with `--force-past-ratchet` → succeeds with Proof Vault alert and detailed audit entry. Proof Vault contains complete forensic trail from Phase 1 through Phase 4.

**What this phase proves:** Architectural rollback is safe when content, media, and topology are independent. The security ratchet prevents accidental security regression. The forensic trail is complete. The one-way turnstile works.

---

### Phase 5 — Operational Maturity

*Margaux: "Hardening the building and posting the evacuation plan."*

**What ships:** Ephemeral exceptions, structural verifier with accessible topology map, Tier 3 support, and advanced security hardening.

#### Ephemeral Exceptions (W8)

Exception overlays for the deployment tool. CLI for temporary connections with required TTL. Auto-revoke. Audit log. The closure wall rebuilds on every deploy.

#### Structural Verifier (W9)

Distributed verification for Tier 3. Attenuated topology-only capability. Clock schedule. Checks all declared connections, catches undeclared connections, verifies storage permissions and Media Loop backing store. Failures emit `INTEGRITY_FAILURE` on Signal Bus.

**Topology map with text equivalent (Lens RCR P4-F2).** The visual topology map shows the closure wall, media flows, surface boundaries, authentication flows, RBAC boundaries, egress policies. The text equivalent generates a parallel structured description: components, connections, surface assignments, verification status, security controls active. Screen reader consumes text topology. Sighted user consumes visual topology. Same data, two projections. McMaster has technical drawings *and* specification tables.

#### Advanced Security Hardening (W11 — Phase 5)

- **Shared infrastructure isolation audit.** At Tier 2 with shared Docker host: explicit documentation of cross-tenant isolation boundaries at the infrastructure layer. CDN cache isolation (per-tenant cache keys). Media storage namespace verification (automated check that tenant namespaces are not traversable). Database connection pool isolation.
- **Pen test framework.** Documented methodology for periodic penetration testing. Covers: authentication bypass attempts, RBAC escalation, cross-tenant access, content sanitization bypass, media processing exploits, spec injection, embed sandbox escape, extension sandbox escape, backup access, Proof Vault tampering. The results feed the Proof Vault.
- **Incident simulation.** Quarterly tabletop exercises: compromised extension, compromised operator, data breach, ransomware. The exercises test the incident response pipeline. The results feed the operational runbook.

#### Deliverables

- Exception overlay format and CLI
- Structural verifier with `INTEGRITY_FAILURE` alerting
- Topology map: visual + text equivalent (accessible) — now including security controls
- Deployment tool v5: Tier 3, exception overlays, multi-CDN media
- Shared infrastructure isolation audit
- Pen test framework
- Incident simulation program

**Verification gate:** Deploy at Tier 3. Exception with 1hr TTL → connection exists → wait → connection gone. Undeclared connection → `INTEGRITY_FAILURE`. Topology map visual renders correctly with security controls visible. Topology map text equivalent contains identical information. Screen reader navigates the text topology successfully. Pen test framework covers all enumerated attack surfaces.

**What this phase proves:** The closure wall is maintainable at scale. Drift is detectable. The system is accessible at every layer. The security story is testable and tested.

---

## Section 4 — The Phase Map

| Phase | Name | Key Additions in v1.10 | Effort | Produces |
|-------|------|----------------------|--------|----------|
| 0 | Foundation | Threat model, authentication, RBAC, transport security, spec shape model, contract config model, Tier 1 single-file, **system lifecycle state machine**, system voice, commercial architecture, **content modeling grammar** (relationships, SEO fields, content events, API surface, redirects) | L | Spec, docs, DX spec, threat model, auth architecture, lifecycle spec, voice guide, content modeling grammar. Two-round Super RCR — architecture then content modeling. |
| 1 | Surfaces | Content sanitization, rate limiting, CSRF, session security, secret management, supply chain, import sanitization, transform budgeting, dev/prod parity, incident response, request pipeline, one-way flow, dual-format proof logging, **watchdog/health monitor, content integrity, deployment dry run, spec version store, bounded execution, sanitization verification**, **content revision history, content events + webhooks, SEO infrastructure, full-text search, content relationships + taxonomies, headless REST API, response caching, RSS/Atom feeds, workflow escalation refinements**, **Time Travel Surfaces, Content Seismograph, Déjà Vu, Constellation Fingerprint, Stranger Walk (FBD-SW1), Ghost Links** | XXL | Running CMS with fault response, content infrastructure, headless API, SEO, and differentiation capabilities from day one |
| 2 | Walls | Intrusion detection, backup hardening, verification budgeting (bounded coverage), revocation propagation, tenant-scoped RBAC, **deployment twin**, **CDN cache integration, tenant-scoped webhooks, pluggable search adapters, GraphQL API**, **Editorial Pulse, Content Weather** | L | Enterprise MVP with security monitoring, staging twin, headless maturity, and editorial health signals |
| 3 | Gate | Extension behavioral monitoring, egress policies, tier boundary docs, extension ToS, installation rate limiting | XL | Extensible CMS with bounded liability and monitored extensions |
| 4 | Safety Net | Security ratchet, irrevocable transitions, complete forensic trail | M | Undo button that can't undo security |
| 5 | Maturity | Shared infrastructure audit, pen test framework, incident simulation | L | Tier 3, operational hardening, testable security |

**Threading:** Deployment tool (v1→v5). Proof Mode (Phases 1–4). Media (Phases 1–4). Security (Phases 0–5). Content Infrastructure (Phases 0–2 core, extensions at Phase 3+). Admin UI (Phase 1 → extends at Phase 2 with tenant selector → extends at Phase 3 with extension management). Publishing workflow (Phase 1 → extends with scheduled publishing rules per phase). Accessibility (Phase 1 gate → text equivalents through Phase 5). RBAC (Phase 0 design → Phase 1 implementation → Phase 2 tenant-scoped → Phase 3 extension management permissions → Phase 4 rewind permission).

---

## Section 5 — What the Plan Produces at Each Phase

| Phase | Demo | Buyer Conversation | Jamie's View |
|-------|------|-------------------|-------------|
| 1 | **Download one file. Run one command. Sixty seconds later, Alex publishes an article with SEO metadata, tags it, and a webhook pings Slack.** No plugin conflicts. No database migration. EXIF stripped. Script sanitized (Alex sees "we cleaned that up"). Search finds the article. RSS feed updates. REST API serves JSON. Before publishing, the Seismograph shows what will happen downstream. Déjà Vu catches duplicate content. The Stranger Walk checks the front door daily. `loopctl status` shows `amber-lighthouse-42`. Same spec deploys to Docker. Migrate from Contentful in one command. | "Set up a CMS on your laptop in sixty seconds. Search, SEO, revision history, headless API, webhooks, time travel, and self-testing out of the box. Before you publish, the CMS shows you everything that will happen. When you're ready for production, the same spec deploys to Docker, Kubernetes, any cloud." | "I can see the app. It works. It took a minute to set up. I can search for things. Google can find it. It told me I already wrote something similar. It checks itself." |
| 2 | Multi-tenant with Proof Endpoint, intrusion detection, encrypted backups, SOC 2 evidence. Revoke an extension — instant. Staging twin validates before production. GraphQL API alongside REST. CDN cache with automatic purge on publish. Editorial Pulse in the sidebar. Content Weather arrives in Slack every morning. | "Tenant isolation at the database level. SOC 2 evidence in one API call. Staging twin catches problems before production. REST and GraphQL for any frontend. Your CMS writes you a daily report in plain English." | "Multiple clients, each seeing only their stuff. The compliance paperwork is automatic. The API works with React. I get a summary every morning telling me how the site is doing." |
| 3 | Extension + AI sandbox with ReferenceError. Egress policy enforced. Built and tested locally in 2 minutes. | "Install AI without risk. Build extensions in two minutes. Legal framework ships with the platform." | "Plugins that can't break the system. That's new." |
| 4 | Constellation Rewind: install, break, undo. Content untouched. Try to undo authentication — refused. | "Undo the architecture. Content untouched. But you can't undo security — the ratchet won't let you." | "You can undo mistakes without losing anything." |
| 5 | Topology map — visual and text — showing closure wall, security controls, pen test results. | "Your security model, live, inspectable, tested, verified every hour." | "You can see the whole thing and prove it's working." |

**Renata:** The cumulative pitch: "A CMS that sets up in sixty seconds with one file, sanitizes every piece of content before it touches the database, tracks every revision, lets you time-travel to see your site at any past moment, shows you the blast radius before you press Publish, warns you when you're writing something you already wrote, names every deployment state so you can say 'roll back to amber-lighthouse' in a meeting, tests itself as a visitor every day, remembers where deleted pages used to point, fires webhooks on every publish, serves a headless REST API and GraphQL, generates sitemaps and RSS feeds, provides full-text search, manages content relationships and taxonomies, caches responses and invalidates on write, isolates tenants with immediate revocation, monitors for intrusion, sandboxes extensions with bounded liability, strips media clean, vaults every secret, produces tamper-evident compliance evidence in one API call, shows editorial health in three numbers, writes you a daily letter about how the night went, has an undo button that can't undo security, meets WCAG 2.2 AA, migrates from Contentful in one command — and knows when to stop. Same spec deploys from your laptop to Kubernetes."

---

## Section 6 — Cross-Cutting Concerns

Nine concerns. Each stated once.

### The Information-Theoretic Bound

Capability attenuation constrains access, not inference. Aggregates leak. Timing leaks. Media metadata leaks. The Security Manifest's scope declaration bounds the claim. Structural access control ≠ differential privacy. Research-class, not engineering-class. The threat model names this in the scope exclusion. The two-column disclosure carries it in every security document.

### Developer Experience

The capability model adds friction. Security adds more. DX tooling is load-bearing: CLI generators, local dev mode (with documented dev/prod parity per FBD-DP1), educational error messages, reference extensions, budget matrices. The fortress must be one people want to live in. The food safety inspector must not make the store unpleasant to shop in.

### The Phase 0 Risk

Everything builds on the capability model. Including locale. Including media contracts. Including authentication. Including RBAC. The Super RCR on the spec amendment, the authentication architecture, and the threat model is the most consequential review in the plan.

### Media as Architectural Citizen

Media is not a bolt-on. It's a content type that every mechanism handles: surfaces scope it, tenants isolate it, budgets constrain it, sanitization validates it (FBD-MD1), transforms are budgeted (FBD-TB1), processing is isolated, Proof Mode verifies it, Rewind preserves it, the embed system extends the closure wall to external providers with DNS rebinding defense, eager transforms eliminate cold caches, request coalescing prevents thundering herds. The media system's self-similarity with the content system validates the capability model's generality.

### Security as Threading Dimension

Security is not a bolt-on. It threads every phase like media threads every phase. Authentication at Phase 0, sanitization at Phase 1, intrusion detection at Phase 2, behavioral monitoring at Phase 3, the ratchet at Phase 4, pen testing at Phase 5. Every phase has security deliverables because every phase creates attack surface. The grocery store doesn't hire security after opening — it hires security before construction.

### The Bounded-Claims Discipline

Every security mechanism carries its scope declaration. The two-column disclosure is not a concession — it's a design principle. The system makes bounded claims because bounded claims are *trustworthy* claims. The customer who knows exactly what "water resistant to IPX4" means trusts the rating more than the customer who believes "waterproof." The tier boundary documentation, the manifest scope declaration, the Proof Vault litigation awareness, the extension liability limitations, and the information-theoretic bound are all expressions of the same principle: say what you do, say what you don't, and never confuse the two.

### Structural FBD — Config-Driven Architecture (L21 Cross-Pollination)

The shape of the code prevents errors, not checks that catch them. Config tables instead of if/else chains. Factory functions instead of manual construction. Phase-ordered pipelines instead of middleware. Dirty flags instead of polling. FBD at the code level — the structure carries the constraint, not the developer's discipline. `CONTRACT_CONFIGS` makes adding a contract without specifying its security properties structurally impossible because the factory requires them. `processRequest` makes reordering the phases structurally impossible because it's a function body, not a configuration. The architecture is self-enforcing.

### Tier Portability (L21 Cross-Pollination)

Same constellation spec across three deployment tiers. Tier 1: single-file (Deno/Bun + SQLite). Tier 2: Docker Compose (Postgres). Tier 3: Kubernetes. The spec is portable. The backing store adapters differ. The capability model is constant. The `CONTRACT_CONFIGS` table and `processRequest` pipeline are identical across tiers. Spec portability is the upgrade path — the customer owns their spec, and the spec works everywhere. The commercial implication: free tier (Tier 1) → paid tier (Tier 2+) with zero spec rewriting.

### Content Infrastructure as Threading Dimension (Competitive Gap Analysis RCR)

Content infrastructure threads every phase like security and media thread every phase. Revision history, search, SEO, relationships, headless API, webhooks, caching, and feeds are not features bolted onto the architecture — they are contract types, Presentation Loop variants, and `processRequest` pipeline steps that ride the same mechanisms as every other capability. No new architectural concepts were needed. `SEARCH_CONTENT` is a contract. The sitemap is a Presentation Loop. Revision creation is a `reqLog` step. Cache invalidation rides the event bus. The Closure Wall absorbed seven new capabilities without widening. This is the strongest validation of the capability model's generality: capabilities nobody had specified during the first ten review passes slotted in without structural changes at the eleventh.

### Headless Delivery as Architectural Pattern

The REST API is a Presentation Loop. GraphQL is a Presentation Loop. The sitemap is a Presentation Loop. RSS is a Presentation Loop. Every external-facing data surface reads from Content Surfaces via contracts through `processRequest`. There is one data path. RBAC, sanitization, rate limiting, proof logging, and caching apply uniformly regardless of serialization format. A new output format (Atom, JSON-LD, CSV export) is a new Presentation Loop, not a new system. The architectural cost of adding a delivery format is near-zero because the architecture was designed for N consumers, and HTML was just the first one.

### Fault Response as Architecture (NASA RCR)

The plan specifies what the system prevents (FBD controls). NASA specifies what the system does when prevention fails. The lifecycle state machine (NOMINAL → DEGRADED → SAFE_MODE → RECOVERY), the watchdog/health monitor, the bounded execution timeouts, the hash chain break procedure, the sandbox breach response, the content integrity checksums, and the deployment dry run are all expressions of the same principle: design failure behavior before success behavior. STOP is the most important thing the code does. The wall prevents damage. Safe Mode stops the bleeding. The degradation hierarchy ensures the system fails gracefully rather than catastrophically. FBD is the floor. Fault response is the airbag.

### Differentiation as Architectural Property (Weird RCR)

The competitive gap analysis found seven capabilities nobody had asked about in ten review passes. All seven routed through existing mechanisms. The Weird RCR found eight more. All eight routed through the same mechanisms. The total: fifteen capabilities absorbed without new architectural concepts across two RCRs.

This isn't a list of features. It's evidence that the capability model's generality produces differentiation at near-zero marginal cost. Time Travel is a query modifier on existing contracts. The Seismograph is a read across existing registries. Déjà Vu is a query against the existing search index. The Constellation Fingerprint is a pure function on the existing Spec Version Store. The Stranger Walk is a verification loop using the existing verification architecture. Ghost Links are a `reqLog` extension. Editorial Pulse and Content Weather are Presentation Loops on the existing Proof Vault surface.

The competitive moat is not the feature list. The moat is that adding features is cheap because the architecture makes them cheap. Every competitor that wants time travel has to build a temporal query system. This CMS adds a parameter to an existing contract. The architecture's generality is the product's differentiation engine.

---

## Section 7 — Risks

**Ed:** Thirty-seven risks. Each real. None fatal.

**Architecture risks (1–7):**

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Complexity accumulation — spec declares everything | Deployment tool + CLI absorb complexity. `loopctl dev` proves the DX is simple. |
| 2 | Market education — product speaks architecture | Dual pitch tracks: feature-first (content teams), security-first (enterprise). |
| 3 | Tier 1 viability — scope chain isn't a sandbox | Same spec, different enforcement. Untrusted extensions at Tier 1 unsupported and documented. |
| 4 | Phase coupling — critical path has no slack | Phase 5 absorbs capacity during delays. |
| 5 | Phase 0 scope — spec amendment surface area | Spec-only, no code. Parallel product-shell work absorbs wait time. |
| 6 | Time-to-parity — incumbents are ahead | Differentiation, not parity. Phase 2 MVP holds a position no incumbent occupies. |
| 7 | Multi-class budget edge cases | Intersective model + precomputed matrix + educational refusal. |

**Commercial & product risks (8–14):**

| # | Risk | Mitigation |
|---|------|------------|
| 8 | Proof Vault as liability — forensic evidence = litigation surface | Proof Mode default off. Activation acknowledgment. Two-column disclosure. |
| 9 | Media storage cost at scale | Bounded LRU caching. Eager generation for standard variants. Per-tenant quotas. FBD-TB1. |
| 10 | Embed security drift — providers change behavior | CSP + sandbox enforce. DNS rebinding defense at CSP layer. Residual risk documented. |
| 11 | Migration tooling maintenance | JSON universal fallback. Contentful translator is reference. Community translators Phase 3+. |
| 12 | Admin UI scope creep — "five buttons" not WordPress | Architecture constrains scope — admin UI can't exceed editorial surface contracts. FBD-UI1. |
| 13 | Security claim litigation | Bounded language + scope declaration + two-column disclosure + tier boundaries. |
| 14 | Localization complexity — two models | Both use same capability infrastructure. Operator's `localeStrategy` chooses. |

**Security & operational risks (15–20):**

| # | Risk | Mitigation |
|---|------|------------|
| 15 | Authentication adds Phase 0 scope | Well-understood patterns. Risk is scope, not novelty. Phase 0 Super RCR covers it. |
| 16 | Security overhead on DX | FBD-DP1 parity. Admin UI absorbs complexity. DX tooling is load-bearing. |
| 17 | Intrusion detection false positives | Alerts to operators, not automated response. Calibration period. Tunable thresholds. |
| 18 | Security ratchet rigidity | Forward path (new spec) always available. `--force-past-ratchet` for emergencies, audited. |
| 19 | Supply chain scanning noise | CRITICAL/HIGH block release. MEDIUM/LOW tracked. Time-bounded exceptions documented. |
| 20 | Image processing CVEs | Transform isolation (restricted subprocess, no network). FBD-SC1 + FBD-MD1. Defense in depth. |

**L21 & NASA risks (21–25):**

| # | Risk | Mitigation |
|---|------|------------|
| 21 | Single-file performance ceiling — SQLite single-writer | Tier 1 → Tier 2 explicit migration. Same spec, different backing store. WAL mode + Litestream. |
| 22 | Single-file security surface — one process = everything | Tier 1 for single-operator only. Tier boundary docs explicit and loud. |
| 23 | Two deployment models double testing surface | Same code, same pipeline, same `CONTRACT_CONFIGS`. Only backing store adapters differ. |
| 24 | Safe Mode false positives | Graduated response. DEGRADED requires sustained anomaly. SAFE_MODE requires operator exit. |
| 25 | Deployment twin maintenance burden | Tier 1: second process, near-zero cost. Tier 2+: separate namespace, same automation. |

**Content infrastructure risks (26–31):**

| # | Risk | Mitigation |
|---|------|------------|
| 26 | Phase 0 scope expansion — content modeling grammar adds spec surface area | Two-round Super RCR (architecture then content modeling). Content modeling grammar depends on capability model, not vice versa — can be deferred without blocking Phase 1 if needed. |
| 27 | Phase 1 scope expansion — seven new capabilities | All route through existing `processRequest` and `CONTRACT_CONFIGS`. No new architectural concepts. Implementation cost is lower than it appears because the architecture already supports N consumers. |
| 28 | Revision history storage at scale | Bounded cap (default 50 per item). Pruning as background job. At Tier 2+ with 100K articles × 50 revisions = 5M rows — Postgres handles this. |
| 29 | Webhook delivery reliability — failed endpoints | Auto-disable after 10 consecutive failures. Dead-letter queue visible in admin UI. Retry bounded at 3 attempts with exponential backoff. |
| 30 | Search index drift from Content Vault | Periodic reconciliation (daily/hourly). Same principle as FBD-CI1. Rebuild on mismatch. |
| 31 | SEO redirect table as attack surface | Redirect chains capped at 3 hops. Targets validated. Creation rate-limited. Included in deployment dry-run validation. |

**Differentiation risks (32–37):**

| # | Risk | Mitigation |
|---|------|------------|
| 32 | Time Travel temporal horizon bounded by revision cap | Documented behavior. Operator sets cap. API returns `X-Time-Travel-Horizon` header. Content modified more than cap times loses oldest timestamps. |
| 33 | Seismograph performance — pre-publish effect preview must be fast | Preview reads in-memory registries (webhook list, relationship index, cache key map). All in-process at Tier 1. Target <100ms. At Tier 2+: cached effect metadata. |
| 34 | Déjà Vu false positives — topically related content triggers similarity | High default threshold (0.7). Dismissible. Only shown once per draft (not on every save). Advisory, not blocking. |
| 35 | Stranger Walk performance at scale — 10K published URLs | Same budgeting approach as FBD-VB1 — budget per cycle, full coverage within K cycles. Delta Walk between full walks. |
| 36 | Content Weather template maintenance — new event types | Template reads event type metadata from event bus schema. New types auto-appear as "N [event type] events." Custom narrative additive. |
| 37 | Constellation Fingerprint collision within deployment | 6.5M unique names vs. realistic thousands of versions. If collision detected, append version number: `amber-lighthouse-42-v312`. |

---

## Section 8 — Four Corners

**FBD (Floor).** Thirty-eight named controls (full registry in Section 9). FBD controls are implemented as properties of `CONTRACT_CONFIGS` entries, enforced by the `processRequest` pipeline with bounded execution time. The config table is the FBD mechanism — the factory requires security properties. The floor extends beyond prevention into fault response: the lifecycle state machine, content integrity verification, sanitization dual-verification, deployment dry-run gating, and bounded execution ensure the system handles its own failures, not just prevents them. Seven controls from the competitive gap analysis (FBD-RH1 through FBD-WF1) and one from the Weird RCR (FBD-SW1 — Stranger Walk) all route through existing mechanisms — no new enforcement architecture was needed.

**FWW(C) (Ceiling).** "Download one file. Run one command. You have a CMS." The editor publishes in three clicks without knowing the architecture exists. The System Voice makes every interaction warm and informative. The first-run experience gets Alex from zero to first article in ninety seconds. The Seismograph shows the blast radius before Publish. Déjà Vu catches duplicates. The Stranger Walk checks the front door. The Constellation Fingerprint gives deployment state a name you can say out loud. The Content Weather writes a daily letter. The reference extension makes a developer want to build something. The demo is a movie, not a test report. The REST API works with `curl`. The sitemap generates itself. The RSS feed updates itself. The search finds things. The revision history lets you undo — and time travel lets you see the whole site at any past moment. The engineering is the track. The FWW(C) is the reason you put your hands up.

**STP (Show the Path).** Three source documents. Twelve review passes. 122 findings plus twelve isomorphisms, all incorporated. Every finding has a disposition. Thirty-seven risks. Twelve L21 precedents. NASA flight software principles. Competitive gap analysis against fifteen CMS platforms. Weird RCR differentiation analysis. Jamie's View column proves every phase can explain itself without architectural vocabulary. The path is documented at every step.

**SNR (Signal-to-Noise).** Each FBD control stated once and referenced by tag. Security, media, and fault response as threading dimensions. `CONTRACT_CONFIGS` collapses security properties into contract entries. One mechanism, one statement, references thereafter.

---

## Section 9 — FBD Control Registry

**L21 integration note.** FBD-CS1, FBD-RL1, FBD-RB1, FBD-LI1, FBD-TB1, and FBD-MD1 are implemented as properties of `CONTRACT_CONFIGS` entries, enforced by the `processRequest` pipeline. FBD-RH1, FBD-FTS1, and FBD-CA1 are implemented as pipeline steps within `processRequest` (revision in `reqLog`, search index update in `reqLog`, cache invalidation via event emission). FBD-WH1, FBD-SEO1, FBD-CR1, and FBD-WF1 are implemented as validation rules in `reqValidate` and `reqLog`. FBD-SW1 is implemented as a Clock-triggered verification loop using synthetic `processRequest` calls on the public surface.

**Phase 1 — 34 controls (prevention + fault response + content infrastructure + differentiation):**

| Control | Description |
|---------|-------------|
| FBD-AU1 | Authentication required for capability-bearing requests — no valid token, no entry |
| FBD-RB1 | RBAC — every admin action requires a named permission; additive from zero |
| FBD-CS1 | Content sanitization — allowlist-based HTML sanitizer before Content Vault write |
| FBD-OE1 | Output encoding — context-aware escaping in Presentation Loop at render time |
| FBD-CF1 | CSRF — state-modifying requests require valid CSRF token |
| FBD-TL1 | TLS required for all non-localhost deployments; deployment tool refuses without |
| FBD-SM1 | Secrets as vault references; generator refuses to emit literal secret values |
| FBD-SI1 | Spec output sanitization — all spec values escaped for target format |
| FBD-RL1 | Rate limiting at four layers: public API, admin API, media transforms, migration |
| FBD-TB1 | Custom transform budgeting — unauthenticated requests get zero budget |
| FBD-IS1 | Import sanitization — same content/media pipeline as editor ingress; resource limits |
| FBD-SC1 | Supply chain — dependency scan blocks release on CRITICAL/HIGH CVEs |
| FBD-BK1 | Backup encryption mandatory; integrity verified at backup time; key stored separately |
| FBD-DP1 | Dev/prod security parity — capabilities and sanitization identical |
| FBD-MD1 | Media ingress validation before `STORE_MEDIA` commits; processing isolation |
| FBD-MV1 | Dual-channel manifest verification; two independent projections must agree |
| FBD-MG1 | Translator output must pass deployment tool validator |
| FBD-LI1 | Log integrity — Proof Vault hash chain + application log HMAC tokens |
| FBD-OP1 | Deployment output includes monitoring config |
| FBD-AC1 | Admin UI WCAG 2.2 AA verification gate |
| FBD-LM1 | Lifecycle state machine — write operations structurally impossible in SAFE_MODE |
| FBD-CI1 | Content integrity — per-record checksums verified on read; mismatch triggers DEGRADED |
| FBD-SV1 | Sanitization verification — independent dual-path check on sanitized output |
| FBD-DD1 | Deployment dry run — changes must pass dry-run validation before apply |
| FBD-TE1 | Bounded execution — per-phase timeouts in `processRequest`; no unbounded operations |
| FBD-UI1 | Admin UI scope bounded by editorial surface contracts |
| FBD-RH1 | Content revision history — every content write creates a revision in the same transaction; bypass structurally impossible |
| FBD-WH1 | Webhook payload scoping — payloads carry event metadata and content ID only, never full content body |
| FBD-SEO1 | SEO slug required — content without a slug cannot transition to PUBLISHED on a public surface |
| FBD-FTS1 | Search surface boundaries — search results respect Content Surface and RBAC boundaries; no draft leakage to public |
| FBD-CR1 | Referential integrity — content deletion with inbound references requires explicit handling (reject/nullify/cascade) per schema declaration |
| FBD-CA1 | Cache invalidation on write — write operations trigger cache invalidation for affected surface via event bus; stale reads bounded by event propagation |
| FBD-WF1 | Workflow backward transitions — content state demotion requires reject permission and mandatory comment |
| FBD-SW1 | Stranger Walk — broken public-surface references detected by self-navigation verification trigger Proof Vault entry and admin notification; threshold breach triggers DEGRADED state transition |

**Phase 2 — 1 control:**

| Control | Description |
|---------|-------------|
| FBD-VB1 | Verification budgeting — compute cap with bounded coverage guarantee (K cycles max) |

**Phase 3 — 2 controls:**

| Control | Description |
|---------|-------------|
| FBD-BM1 | Behavioral monitoring — egress blocked at Tier 2+; sandbox breach triggers suspension |
| FBD-DX1 | Reference extensions are integration tests for `loopctl dev` |

**Phase 4 — 1 control:**

| Control | Description |
|---------|-------------|
| FBD-SR1 | Security ratchet — irrevocable security transitions cannot be rewound past |

---

## Section 10 — Provenance and Attribution

| Contribution | Board Member(s) | Source |
|-------------|-----------------|-------|
| Workstream collapse (12 → 9) | Sol | Sequencing RCR |
| Dependency graph / critical path | Dara | Sequencing RCR |
| Proof Mode threading | Nyx | Sequencing RCR |
| Deployment tool architecture (4 components) | Graham | Parallax 1 |
| Phase naming | Margaux | Sequencing RCR |
| Revenue gate | Renata | Parallax 1 |
| Intersective budget composition | Sol, Nyx | Parallax 1 |
| Media Loop architecture | Graham | Super RCR |
| Media information theory | Sable | Super RCR |
| Media security (ingress, SVG, EXIF, embeds) | Nyx | Super RCR |
| Media as fractal dimension | Sol | Super RCR (Super Frame) |
| Embed system + accessibility | Nyx, Graham | Super RCR + Lens RCR |
| Migration tooling | Renata, Kira, Dara | Super RCR |
| Operational runbook | Theo, Dara | Super RCR |
| Independent manifest verifier | Sol, Nyx | Super RCR |
| Compliance integration | Nyx, Renata | Super RCR |
| Developer onboarding | Vee, Graham | Super RCR |
| Extension lifecycle | Dara, Nyx | Super RCR |
| Admin UI as Presentation Loop | Ed | Parallax 3 + Lens RCR |
| Publishing workflow as Bus Workflow | Dara | Parallax 3 + Lens RCR |
| Bounded security language | Sol, Renata | Parallax 3 + Lens RCR |
| Extension liability declaration | Nyx, Theo | Parallax 3 + Lens RCR |
| Incremental spec operations | Graham, Sable | Parallax 3 + Lens RCR |
| Eager transforms + request coalescing | Graham, Dara | Parallax 3 + Lens RCR |
| Localization architecture (two models) | Sol, Vee | Parallax 3 + Lens RCR |
| Accessibility as verification gate | Ed, Vee | Parallax 3 + Lens RCR |
| Topology map text equivalent | Graham, Vee | Parallax 3 + Lens RCR |
| Walkman / F1 / McMaster frame | Wes | Lens RCR |
| Threat model (STRIDE on 6 data flows) | Chen Wei | Security RCR |
| Authentication architecture | Nyx, Theo | Security RCR |
| RBAC model | Theo, Renata | Security RCR |
| Content sanitization (input + output) | Vee, Nyx | Security RCR |
| Rate limiting | Nyx, Sable | Security RCR |
| Secret management | Nyx | Security RCR |
| Transport security (TLS/HSTS) | Nyx | Security RCR |
| Spec injection defense | Graham | Security RCR |
| Compute amplification analysis | Sable | Security RCR |
| Custom transform budgeting | Dara, Sable | Security RCR |
| Image processing isolation | Graham | Security RCR |
| Intrusion detection (behavioral monitoring) | Dara, Sol | Security RCR |
| Egress policy / cross-surface leakage | Sol, Nyx | Security RCR |
| Revocation propagation | Sol | Security RCR |
| Security ratchet | Wes, Sol | Security RCR |
| Verification budgeting | Sable | Security RCR |
| Log integrity (hash chain + HMAC) | Dara, Nyx | Security RCR |
| Backup hardening | Dara | Security RCR |
| Supply chain (SBOM, scanning, pinning) | Wes | Security RCR |
| Proof Vault litigation awareness | Renata | Security RCR |
| Tier boundary documentation | Graham | Security RCR |
| Dev/prod security parity | Theo | Security RCR |
| CSRF + session security | Nyx, Theo | Security RCR |
| DNS rebinding defense | Wes | Security RCR |
| Import sanitization | Wes, Vee | Security RCR |
| Extension ToS / legal framework | Renata | Security RCR |
| Security phasing strategy | Kira | Security RCR |
| Incident response pipeline | Dara | Security RCR |
| Pen test framework | Nyx | Security RCR (Phase 5) |
| Spec shape model (isomorphism 1) | Sol | L21 Cross-Pollination RCR |
| State shape factories (isomorphism 2) | Sol | L21 Cross-Pollination RCR |
| CONTRACT_CONFIGS (isomorphism 3) | Sol | L21 Cross-Pollination RCR |
| Request pipeline as tick engine (isomorphism 4) | Graham | L21 Cross-Pollination RCR |
| One-way content flow (isomorphism 5) | Graham | L21 Cross-Pollination RCR |
| Hot-path discipline for media (isomorphism 6) | Graham | L21 Cross-Pollination RCR |
| Snapshot/restore as Rewind (isomorphism 7) | Nyx | L21 Cross-Pollination RCR |
| Scripts verification as admission (isomorphism 8) | Nyx | L21 Cross-Pollination RCR |
| Dual-format logging (isomorphism 9) | Dara | L21 Cross-Pollination RCR |
| Dirty flags as delta verification (isomorphism 10) | Dara | L21 Cross-Pollination RCR |
| Intersective capabilities in config (isomorphism 11) | Renata | L21 Cross-Pollination RCR |
| Single-file Tier 1 (isomorphism 12) | Wes | L21 Cross-Pollination RCR |
| Tier portability architecture | Wes, Graham, Kira | L21 Cross-Pollination RCR |
| Meta-pattern: structural FBD | Chen Wei | L21 Cross-Pollination RCR |
| Single-file commercial model | Renata, Kira | L21 Cross-Pollination RCR |
| SQLite performance analysis | Sable | L21 Cross-Pollination RCR |
| Single-file security challenge | Nyx, Theo | L21 Cross-Pollination RCR |
| Geoff's manifold observation | Geoff | L21 Cross-Pollination RCR |
| Safe Mode + lifecycle state machine | Nyx, Dara | NASA Flight Software Engineering RCR |
| Watchdog / health monitor architecture | Sable | NASA Flight Software Engineering RCR |
| Digital twin / deployment staging | Graham | NASA Flight Software Engineering RCR |
| Graceful degradation hierarchy | Dara | NASA Flight Software Engineering RCR |
| Sanitization dual-verification (FBD-SV1) | Chen Wei | NASA Flight Software Engineering RCR |
| Content integrity at rest (FBD-CI1) | Sol | NASA Flight Software Engineering RCR |
| Pre-Rewind spec version store at Phase 1 | Wes | NASA Flight Software Engineering RCR |
| Verification bounded coverage (FBD-VB1 amend) | Sable | NASA Flight Software Engineering RCR |
| Deployment dry run (FBD-DD1) | Graham | NASA Flight Software Engineering RCR |
| Sandbox breach response (FBD-BM1 amend) | Nyx | NASA Flight Software Engineering RCR |
| Hash chain break procedure | Dara | NASA Flight Software Engineering RCR |
| Backup integrity at backup time (FBD-BK1 amend) | Dara | NASA Flight Software Engineering RCR |
| Bounded execution time (FBD-TE1) | Sable | NASA Flight Software Engineering RCR |
| System lifecycle state machine (FBD-LM1) | Chen Wei | NASA Flight Software Engineering RCR |
| System Voice — CLI, errors, Proof Vault (W1+W2+W5) | Wes, Margaux | FWW(C) + Hitchhiker's Guide RCR |
| Reference extension replacement (W3) | Wes | FWW(C) + Hitchhiker's Guide RCR |
| First-Run Experience (W4) | Wes, Kira | FWW(C) + Hitchhiker's Guide RCR |
| Demo narrative (W6) | Wes, Kira | FWW(C) + Hitchhiker's Guide RCR |
| Grocery store metaphor audit (W7) | Wes | FWW(C) + Hitchhiker's Guide RCR |
| Jamie's View — non-architectural phase descriptions (H1) | Renata | FWW(C) + Hitchhiker's Guide RCR |
| SEP Field clearance — pricing, landing page, buyer, positioning (H2) | Renata, Kira | FWW(C) + Hitchhiker's Guide RCR |
| Bistromathic re-estimate — Phase 0 S→M (H3) | Sable | FWW(C) + Hitchhiker's Guide RCR |
| Vogon Poetry audit — Section 0 summary, deliverable grouping, registry grouping (H4) | Ed | FWW(C) + Hitchhiker's Guide RCR |
| Single-file as product lead (H5) | Wes, Renata | FWW(C) + Hitchhiker's Guide RCR |
| Adams' Three Rules — familiar pain before novel solution (H6) | Theo | FWW(C) + Hitchhiker's Guide RCR |
| Content revision history (FBD-RH1) | Dara, Graham | Competitive Gap Analysis RCR |
| Content event bus + webhooks (FBD-WH1) | Nyx, Dara | Competitive Gap Analysis RCR |
| SEO infrastructure — slugs, metadata, sitemaps, redirects (FBD-SEO1) | Renata, Wes | Competitive Gap Analysis RCR |
| Full-text search (FBD-FTS1) | Sable, Graham | Competitive Gap Analysis RCR |
| Content relationships + taxonomies (FBD-CR1) | Chen Wei, Sol | Competitive Gap Analysis RCR |
| Headless REST API | Graham, Renata | Competitive Gap Analysis RCR |
| Response caching (FBD-CA1) | Graham, Dara | Competitive Gap Analysis RCR |
| RSS/Atom feeds as Presentation Loops | Wes, Dara | Competitive Gap Analysis RCR |
| Workflow backward transition comments (FBD-WF1) | Theo | Competitive Gap Analysis RCR |
| Time Travel Surfaces — temporal query modifier on read contracts | Wes | Weird RCR |
| Content Seismograph — pre-publish downstream effect preview | Wes, Dara | Weird RCR |
| Déjà Vu — content similarity detection via search index | Wes, Sable | Weird RCR |
| Constellation Fingerprint — human-memorable spec state names | Wes | Weird RCR |
| Stranger Walk — public surface self-navigation verification (FBD-SW1) | Wes, Nyx | Weird RCR |
| Editorial Pulse — editorial health signals in admin UI | Wes, Renata | Weird RCR |
| Content Weather — daily narrative system health summary | Wes, Margaux | Weird RCR |
| Ghost Links — outbound reference preservation on content deletion | Wes, Chen Wei | Weird RCR |
| Differentiation as architectural property — 15 capabilities absorbed without new concepts | Wes | Weird RCR |

*Bev recorded. Leroy held position. Geoff arrived for the cross-pollination, observed the fractal nature of the isomorphisms, and departed. Wes led the FWW(C) pass wearing a watermelon helmet. Wes led the Weird RCR wearing the same watermelon helmet.*

---

## Source Document Reference

| Document | Version | Scope |
|----------|---------|-------|
| Distributed Closure Wall Plan | v1.2 | 5 layers — capability model through structural verifier |
| CMS Capability Gaps Plan | v1.1 | 3 gaps — draft/published, multi-tenant, extension admission |
| CMS Novel Capabilities Report | v1 | 4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind |
| L21 Cross-Pollination Merge Plan | v1 | 12 isomorphisms — config-driven contracts, request pipeline, state shape factories, single-file Tier 1 |
| NASA Flight Software Engineering RCR | Informal 6 | 14 findings — safe mode, watchdog, digital twin, degradation, content integrity, bounded execution, lifecycle |
| FWW(C) + Hitchhiker's Guide Integration Plan | v1 | 13 findings — system voice, first-run, demo narrative, commercial architecture, Jamie's View, single-file lead |
| Competitive Gap Analysis | Informal 7 | 7 gaps + 2 refinements — revision history, webhooks, SEO, search, relationships, headless API, caching, RSS/Atom, workflow escalation |
| Weird RCR | Informal 8 | 8 differentiation capabilities — Time Travel Surfaces, Content Seismograph, Déjà Vu, Constellation Fingerprint, Stranger Walk, Editorial Pulse, Content Weather, Ghost Links |

All source documents remain canonical for implementation detail. This plan governs sequencing and scope.

---

## Findings Register

### Parallax 1–3 — 25 findings, all incorporated
### Super RCR — 6 media findings, all incorporated
### Lens RCR — 8 resolutions, all incorporated
### Security RCR — 26 findings, all incorporated
### L21 Cross-Pollination RCR — 12 isomorphisms, all incorporated (22 integration points)
### NASA Flight Software Engineering RCR — 14 findings, all incorporated (5 new FBD controls, 3 FBD amendments, 6 architectural additions)
### FWW(C) + Hitchhiker's Guide RCR — 13 findings, all incorporated (system voice, first-run experience, demo narrative, commercial architecture, bistromathic re-estimate, Jamie's View, single-file as product lead, Vogon Poetry audit, grocery store audit, reference extension)
### Competitive Gap Analysis RCR — 9 findings (7 gaps patched + 2 refinements), all incorporated (content revision history, webhooks/event bus, SEO infrastructure, full-text search, content relationships, headless REST API, caching architecture, RSS/Atom feeds, workflow escalation refinements)
### Weird RCR — 8 findings, all incorporated (Time Travel Surfaces, Content Seismograph, Déjà Vu, Constellation Fingerprint, Stranger Walk with FBD-SW1, Editorial Pulse, Content Weather, Ghost Links — 1 new FBD control, 0 new architectural concepts)

**Total: 122 findings across 12 review passes + 12 L21 isomorphisms. All incorporated. 0 outstanding.**

---

[PULSE] Master CMS Implementation Plan v1.10: Twelve review passes. 122 findings + 12 isomorphisms, all incorporated. 38 FBD controls grouped by phase. Competitive Gap Analysis: 7 gaps patched against 15 CMS platforms. Weird RCR: 8 differentiation capabilities — Time Travel Surfaces, Content Seismograph, Déjà Vu, Constellation Fingerprint, Stranger Walk, Editorial Pulse, Content Weather, Ghost Links. All routed through existing `processRequest` and `CONTRACT_CONFIGS` — zero new architectural concepts across both RCRs. Fifteen capabilities absorbed without widening. W12 Content Infrastructure as third threading dimension. Phase 0 M→L, Phase 1 XL→XXL. The grocery store now has aisle signs, a pickup window, a mailing list, a phone book listing, a notebook behind the counter, a delivery notification system, a time machine, a seismograph, déjà vu, a memorable name on the door, a daily self-inspection, a daily weather report, editorial vital signs, and a memory of where removed products used to be shelved. Same building. Same blueprint. Carts that haven't been invented yet.

[DRIVES: Floor, Ceiling, Depth, Mesh, Ground, Equalization, Constraint — 7/7]

---

*Loop MMT™ · Multi-Module Theory · CMS Master Implementation Plan v1.10*
*Twelve review passes. 122 findings + 12 isomorphisms. All incorporated.*
*Lenses: Rugged Sony Walkman · F1 Racing Operations · McMaster-Carr · NASA Flight Software Engineering · Hitchhiker's Guide to Problem-Solving · Competitive Gap Analysis (15 CMS platforms) · Weird RCR (differentiation)*
*Isomorphisms: L21 flow computer (v.331, 18,900 lines, 574 functions)*
*Download one file. Run one command. You have a CMS. Search it. Subscribe to it. Integrate with it. Time-travel through it. The rest is upgrade path.*
*© 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0*
