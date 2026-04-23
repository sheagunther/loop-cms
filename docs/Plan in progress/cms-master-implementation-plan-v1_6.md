# Loop MMT CMS — Master Implementation Plan v1.6
## Loop MMT™ · Loop World | Shrubbery · 21 April 2026

---

## About This Document

*[Section Type: Plan]*

***Evidence status: Nothing in this plan has been implemented or tested. Every mechanism described is architectural. The CMS described in this plan does not exist. It is a grocery store made of words.***

This document consolidates three CMS architectural plans and nine review passes into a single implementation sequence:

- **Distributed Closure Wall Plan v1.2** (5 layers — capability model, deployment tool, ephemeral exceptions, storage enforcement, structural verifier)
- **CMS Capability Gaps Plan v1.1** (3 gaps — draft/published boundary, multi-tenant isolation, extension admission model)
- **CMS Novel Capabilities Report v1** (4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind)
- **Parallax Passes 1–3** (12 angles, 25 findings — Builder through i18n/Accessibility Specialist)
- **Super RCR** (9 items — media handling with Super Frame, 6 lenses)
- **Lens RCR** (Rugged Sony Walkman, F1 Racing Operations, McMaster-Carr — 8 resolutions)
- **Security RCR** (26 findings — authentication, transport, operational security, content safety, threat modeling, advanced threats)
- **L21 Cross-Pollination RCR** (12 isomorphisms — config-driven contracts, request pipeline, state shape factories, single-file Tier 1, dual-format proof logging)
- **NASA Flight Software Engineering RCR** (14 findings — safe mode, watchdog, digital twin, graceful degradation, content integrity, bounded execution, lifecycle state machine)

The plan builds a CMS. The grocery store metaphor: engine (capability model), checkout counter (five editor buttons), security system (Proof Mode), membership card scanner (authentication), staff badges (RBAC), food safety inspector (content sanitization), fire marshal (rate limiting), armored car (transport security), safe in the back office (secret management), FDA supply chain (dependency scanning), one-way turnstile (security ratchet), loss prevention team (intrusion detection), fire alarm system (watchdog/health monitor), evacuation plan (safe mode), and a sprinkler system that activates floor by floor (graceful degradation).

**Resource model assumption.** AI-assisted solo development (one operator with AI tooling). Phase 0's parallel tracks run sequentially under this model. A small team (3–5) would parallelize. The critical path (Phases 0 → 1 → 2 → 3 → 4) is team-size-invariant — the dependencies are architectural, not resourcing.

**What this plan replaces.** CMS Master Implementation Plan v1.5 is superseded. This plan integrates 91 total findings from nine review passes plus 12 L21 isomorphisms. For mechanism detail, read the source documents.

---

## Section 0 — The Threat Model

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

Three workstreams absorbed. Eleven remain. The admin UI and publishing workflow are **consumers** of W3 (Content Surfaces) — they prove the architecture by being built on it. Security (W11) is a threading dimension like Media (W10) — it doesn't have a "phase" because it threads every phase.

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
 └──→ W11 (Security Infrastructure) [partial — authn/transport after W1, RBAC at W3, full threading W3–W9]
```

**Critical path:** W1 → W3 → W5 → W6. W2 runs parallel to W3. W4, W10, and W11 thread through everything. W7, W8, W9 are terminal. The admin UI and publishing workflow ship at Phase 1 as consumers of W3 — they don't appear in the dependency graph because they depend on Content Surfaces, and Content Surfaces is already on the critical path.

---

## Section 3 — The Six Phases

### Phase 0 — The Foundation

*Margaux: "Getting the permits and hiring the security firm."*

**What ships:** The capability model spec amendment, the product shell, the threat model, and the authentication architecture.

**Spec track (Chen Wei):** Standard amendment defining confinement, attenuation, and revocation as properties of the contract system. This is W1. The amendment either extends Standard Section 5 (Boundary Enforcement) or adds a new Section 16 (Capability Model).

**Locale decision (Phase 0).** The capability model spec amendment declares locale as a recognized dimension of the contract system. Two models are supported — the constellation operator chooses per deployment:

- **Model A — Locale-as-Surface.** Each locale produces surface variants (`public-en`, `public-ar`, `public-ja`). Same contract vocabulary, locale-specific content. The deployment tool provisions locale-variant surfaces from the spec's locale declaration. Architecturally clean — locale is topology. The F1 answer: same car, different circuit configuration.
- **Model B — Locale-as-Field.** Content records carry a `locale` field. Surfaces are locale-agnostic. Queries include a locale parameter. Simpler for small-scale multilingual. The McMaster answer: universal catalog, locale-aware presentation.

Both models use the same capability infrastructure. The spec amendment defines locale as a surface parameter (Model A) or a content schema field (Model B). Phase 0 doesn't choose between them — it ensures the capability model carries both. The constellation operator's `localeStrategy` declaration in the spec determines which model governs their deployment.

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

**Bounded security language (Lens RCR P2-F1).** The product documentation framework establishes the linguistic boundary for all security claims. Two rules:

1. **"Verifiable security configuration" not "proven security posture."** The system's configuration is machine-readable and self-checked. The claim is bounded to contract-level access control. The limitation (structural access control ≠ differential privacy, ≠ inference resistance, ≠ application-level vulnerability protection) travels with every claim.
2. **Two-column disclosure.** Every security document carries: Column 1 — what the system enforces (contract isolation, capability attenuation, structural verification, authentication, RBAC, transport encryption, content sanitization, rate limiting). Column 2 — what the system does not address (side channels, timing attacks, inference from aggregates, extension output quality, social engineering beyond UI-level phishing resistance, nation-state actors). McMaster lists tensile strength *and* the temperature range. Sony prints "water resistant" not "waterproof." The spec tolerance bounds the marketing claim.

**Transport security requirements (W11 — Phase 0).** The armored car. Phase 0 defines the requirements; Phase 1 enforces them.

- TLS 1.2+ required for all non-localhost connections. FBD-TL1: the deployment tool refuses to generate configurations without TLS for any non-local tier. `loopctl dev` on localhost is exempt. Production without TLS is structurally impossible — the tool won't produce it.
- HSTS headers with `max-age` ≥ 1 year, `includeSubDomains`.
- Certificate management: the deployment tool generates configuration for cert-manager (Kubernetes) or Caddy auto-TLS (Docker Compose). The operator doesn't configure TLS — the deployment tool does it.

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

**Verification gate:** Super RCR on the spec amendment, the authentication architecture, and the threat model together. The most consequential review in the plan. Get confinement, attenuation, revocation, locale, and authentication right — the plan flows. Get them wrong — every phase inherits the error.

**What this phase proves:** The bus contract system carries capability semantics, locale as a recognized dimension, and authentication as infrastructure. The threat model covers the six primary data flows. The RBAC model maps cleanly to the admin UI's five buttons.

---

### Phase 1 — The Surfaces

*Margaux: "Building the shelves, stocking the first products, opening the checkout counter, and hiring security."*

**What ships:** Content Surfaces, the admin UI, the publishing workflow, the deployment tool (v1), Proof Mode infrastructure, the Media Loop with eager transforms, migration tooling, the operational runbook, content sanitization, rate limiting, CSRF protection, secret management, supply chain baseline, and the first running CMS demo with an editor who can log in, see only what their role permits, and publish an article without knowing the architecture exists.

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

#### Publishing Workflow — The Pit Stop

Content lifecycle as a **Bus Workflow** — the same architectural primitive used for the extension installation pipeline in Phase 3. Five states: `DRAFT` → `IN_REVIEW` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`.

Each transition is a bus event. Each transition can carry a validation step — a pre-publish check (required fields present? media attached? SEO metadata complete? locale variants linked?). Scheduled publishing is a Clock event. The Workflow is declared in the constellation spec as a Pipeline — provisioned by the deployment tool alongside surfaces and loops.

The F1 pit stop: car enters → jacks up → wheels off → wheels on → jacks down → car exits. Two seconds. Each step has a predecessor, a role, a completion signal. Draft → Review → Publish follows the same choreography. The publishing workflow is not separate infrastructure — it's the Bus Workflow primitive applied to content state. The architecture already has the mechanism. Phase 1 applies it.

**Publishing workflow RBAC.** Each transition is gated by a permission. `content:write` permits DRAFT creation and editing. `content:publish` permits IN_REVIEW → PUBLISHED and SCHEDULED → PUBLISHED. `content:schedule` permits IN_REVIEW → SCHEDULED. Archiving requires `content:publish`. An editor without `content:publish` can write and submit for review but cannot push to the public surface. The Workflow checks the token. The permission model governs the state machine.

#### Deployment Tool v1 (Graham, Dara)

Reads a constellation spec with surface declarations (including locale variants and publishing workflow), outputs Docker Compose (Tier 2) or single-file config (Tier 1). Storage enforcement baked in. Four-component architecture: Parser (spec grammar + import source plugins) → Validator (capability model constraints) → Generator (deployment artifacts, pluggable backends) → Verifier (output matches IR). The import side of the parser handles migration sources. A refactoring gate fires between Phase 2 and Phase 3.

**Deployment dry run (FBD-DD1, NASA RCR).** NASA never transmits a command to Mars without running it through the digital twin first. `loopctl deploy --dry-run` generates all outputs, validates them against the capability model, runs the structural verifier on the generated topology, and reports what would change — without applying anything. `loopctl deploy` applies only changes that have passed dry-run validation. FBD-DD1: the deployment tool refuses to apply changes that haven't been dry-run validated. You cannot skip the twin.

**Spec Version Store (moved from Phase 4).** Append-only version history of constellation specs, available from Phase 1. `loopctl spec-history` shows previous specs. `loopctl deploy --spec-version N` re-derives from a prior known-good spec. Not full Constellation Rewind (that's Phase 4 — compatibility checker, media cache invalidation, security ratchet). But the ability to return to a known-good state ships on Day 1. Perseverance can safe-mode on Sol 1. The CMS can roll back on Day 1.

**Spec output sanitization (FBD-SI1).** Every value from the constellation spec that appears in generated configuration files is escaped for the target format. YAML values are quoted and escaped. Docker Compose labels are sanitized. Environment variable values are shell-escaped. No raw spec string reaches a generated file without passing through format-appropriate escaping. The deployment tool is a compiler. Compilers that consume untrusted input and generate executable configuration are the canonical injection surface. FBD-SI1 makes spec injection structurally impossible — the escaping is in the generator, not in a validation step that can be skipped.

**Secret management (FBD-SM1).** The safe in the back office. Generated configurations never contain literal secrets. Database credentials, API keys, signing keys, CDN credentials, S3 credentials — all are vault references. The deployment tool generates configuration that points to a secret store (environment-appropriate: Docker secrets, Kubernetes secrets, HashiCorp Vault, or `.env` file with restricted permissions for Tier 1). FBD-SM1: the generator refuses to emit a literal secret value. The configuration file references a name; the runtime resolves the name to a value. Secrets are rotated on a schedule declared in the constellation spec (`secretRotation: { interval: '90d', notify: 'admin' }`). The deployment tool generates rotation reminders. Leaked secrets trigger re-derive with new references.

**TLS enforcement (FBD-TL1).** For any non-localhost deployment, the deployment tool generates TLS configuration. The generator includes cert-manager annotations (Kubernetes) or Caddy reverse-proxy blocks (Docker Compose) with automatic certificate provisioning. HSTS headers are baked into the generated reverse-proxy configuration. FBD-TL1: the generator refuses to produce a non-TLS configuration for any tier above localhost. Dev mode on localhost is exempt — and the dev mode documentation explicitly states that localhost exemption does not apply to any network-accessible deployment.

#### Media Loop (W10 — Phase 1)

Specialized Vault Loop with pluggable backing store (local at Tier 1, S3 at Tier 2, multi-CDN at Tier 3). Five media contracts: `STORE_MEDIA`, `FETCH_MEDIA_PUBLIC`, `FETCH_MEDIA_FULL`, `FETCH_MEDIA_METADATA`, `TRANSFORM_MEDIA`. Media contracts scope to Content Surfaces like all contracts.

**Hot-path discipline (L21 Cross-Pollination — Isomorphism 6).** Media transforms follow tick-engine discipline — no network access, pre-allocated buffers, resource caps in the transform subprocess/worker. Tiered isolation driven by `CONTRACT_CONFIGS.TRANSFORM_MEDIA.isolated` flag + runtime tier detection. Tier 1: Worker thread with limited imports. Tier 2: restricted subprocess with seccomp. Tier 3: container with network namespace. L21 precedent: hot-path discipline in `executeOneTick` — no DOM, no allocation in the tick body.

**Ingress security pipeline (FBD-MD1).** Every media upload passes through: magic-byte file-type validation (not extension), SVG sanitization (strip `<script>`, event handlers, `xlink:href` to external resources, `foreignObject`), EXIF stripping (GPS, camera ID, timestamps — gone before storage), size/dimension caps (configurable in the spec, defaults: 50MB per file, 10,000px max dimension). Validated before `STORE_MEDIA` commits. The wall catches it at the input, not the output.

**Image processing isolation.** Image processing libraries (Sharp, libvips, ImageMagick) have extensive CVE histories. A crafted image that passes magic-byte validation can still exploit a vulnerability in the transform library. Mitigation: media transforms run in a restricted subprocess with no network access, memory limits, CPU time limits, and a seccomp profile that denies system calls not required for image processing. The transform worker cannot reach the network, cannot read files outside its input/output directories, and is killed if it exceeds its resource budget. The food safety inspector checks the ingredients. The kitchen has its own fire suppression system.

**Eager transform generation (Lens RCR P3-F2).** When media is uploaded, the Media Loop immediately generates transforms for all declared responsive variants in the constellation spec's media configuration (e.g., thumbnail 200px, medium 800px, large 1600px; WebP + JPEG fallback). Transforms are generated at upload time, cached, and ready before the first request. McMaster pre-renders every product page. F1 pre-computes every tire strategy. The media pipeline pre-generates every standard variant. Cold cache on a high-traffic page becomes impossible for standard variants.

**Custom transform budgeting (FBD-TB1).** Custom transforms (unusual crop, non-standard dimensions via API) are a capability in the capability model, not an open endpoint. Each authenticated consumer has a custom transform budget (requests per hour, max output dimensions). FBD-TB1: custom transform requests without a valid budget allocation are rejected. Unauthenticated requests get zero custom transform budget. This eliminates compute amplification — an attacker cannot send a thousand slightly-different transform requests because each one consumes budget, and the budget has a ceiling. The fire marshal's occupancy limit. Request coalescing still applies within budgeted requests: concurrent identical custom transforms wait on the same promise.

**Embed system.** Embed declarations in the constellation spec with allowlist and per-provider isolation policy. Content editors insert embed URLs; the ingestion pipeline validates against the allowlist. Denied URLs rejected at content ingestion with educational message. Initial providers: YouTube, Vimeo, CodePen, Twitter/X. Per-provider `csp` and `sandbox` attributes.

**Embed accessibility (Lens RCR P4-F2).** Each embed allowlist entry includes `accessibilityRequirements`: `captions: required`, `keyboardNav: required`. The sandbox configuration preserves permissions needed for accessibility features (e.g., `allow-same-origin` for YouTube's caption API). Accessibility constraints are part of the embed isolation policy, not separate from it.

**Embed DNS rebinding defense.** The embed allowlist validates domain at content ingestion time. The Presentation Loop's CSP headers pin embed sources to specific domains. Additionally, the embed iframe's `csp` attribute restricts the frame's own fetch capabilities to the declared domain. DNS rebinding requires the frame to load content from a different IP than originally allowed — the CSP pins the domain, and the frame's restricted fetch policy limits what the rebound content can do. Residual risk: `allow-same-origin` weakens isolation. The two-column disclosure names this explicitly under "what the system does not address: embed provider behavior changes, DNS rebinding with `allow-same-origin` frames."

```
embeds: {
  allowlist: ['youtube.com', 'vimeo.com', 'twitter.com', 'codepen.io'],
  isolation: {
    'youtube.com': {
      csp: "frame-src https://www.youtube.com",
      sandbox: 'allow-scripts allow-same-origin',
      accessibilityRequirements: { captions: 'required', keyboardNav: 'required' }
    }
  },
  default: 'deny'
}
```

#### Rate Limiting — The Fire Marshal

**FBD-RL1.** The fire marshal's occupancy limit. Rate limiting applies at four layers:

1. **Public API.** Per-IP rate limits on all public surface reads. Default: 100 requests/minute/IP. Configurable in the constellation spec. The CDN absorbs the first wave; the application layer enforces the ceiling.
2. **Admin API.** Per-user rate limits on authenticated requests. Default: 60 requests/minute/user. Content creation: 20/minute. Media upload: 10/minute. These are generous for legitimate use and lethal for brute-force attacks.
3. **Media transforms.** Per-user custom transform budget (see FBD-TB1). Standard transforms served from cache — no rate limit needed (they're pre-generated).
4. **Migration.** Per-operation limits: max 10,000 records per import, max 500MB per import file, streaming parser (constant memory regardless of input size). The import pipeline is not an open door — it's a loading dock with a weight limit.

Rate limit responses use standard `429 Too Many Requests` with `Retry-After` header. Rate limit state is per-instance (not shared across horizontal replicas at Tier 2 — shared state via Redis is a Phase 2 optimization if needed).

#### Proof Mode Infrastructure (Nyx, Dara)

Verification Log schema, append-only Proof Vault, log-capture mechanism. Self-verification output from this phase onward goes into the Proof Vault.

**Independent manifest verifier (FBD-MV1).** A second Compute Loop reads the constellation spec and produces its own security projection. Two independent code paths, same inputs, outputs must agree. Dual-channel verification — the pattern aviation uses for flight control. Cannot be disabled independently of self-verification.

**Security Manifest scope declaration.** Every manifest carries: `scopeOfVerification: 'contract-level access control'`. The manifest does not claim to verify side-channel resistance, timing attacks, inference from aggregates, or application-level logic errors. The scope field bounds the claim. McMaster lists tensile strength *and* temperature range. The manifest lists what it verifies *and* what it doesn't.

**Proof Vault retention policy.** Configurable with jurisdiction-aware defaults: 1yr/5yr (SOC 2), 6yr/10yr (HIPAA), 7yr (financial). Compaction rules for verification entries. Forensic entries (spec diffs, admission records, rewind logs) never compact.

**Log integrity (FBD-LI1).** The Proof Vault is append-only with a hash chain. Each entry includes a hash of the previous entry. Tampering with any entry invalidates the chain from that point forward. The hash chain is verified on every Proof Vault read (Proof Endpoint, evidence API, compliance export). Application logs outside the Proof Vault (access logs, media processing logs, error logs) are written to a structured log stream with an integrity token — a per-entry HMAC using a key that the application process can write with but not read. Log verification (checking HMACs) requires the verification key, stored separately from the application. An attacker who compromises the application can append logs but cannot verify or forge them. The loss prevention team's camera footage is on a separate locked recorder.

**Dual-format proof logging (L21 Cross-Pollination — Isomorphism 9).** Every Proof Vault entry carries two projections in a single line:

Format: `MACHINE.CODE.PATH key=value key=value t=unix || Human-readable description`

Examples:
```
PROOF.VERIFY.PASS surface=public tenant=A t=1713700800 || Surface 'public' for Tenant A passed structural verification
PROOF.AUTH.FAIL ip=192.168.1.1 user=editor@co t=1713700801 || Authentication failed for editor@co from 192.168.1.1
PROOF.CONTENT.SANITIZE field=title removed=script user=editor@co t=1713700803 || Content sanitizer stripped script tag from title
```

Machine side: structured, parseable, feeds SIEM, feeds automated analysis. Human side: readable, feeds operator, feeds incident response.

L21 precedent: `writeLogLine('OP.BUS.A.SRC=ALU', 'Bus A source set to ALU')` — 331 versions of dual-format logging.

**Proof Vault litigation awareness.** The Proof Vault is forensic evidence. When Proof Mode is on, the operator accepts: (1) verification failures are recorded permanently, (2) remediation timelines are recorded permanently, (3) the Proof Vault may be discoverable in litigation. The Proof Mode activation flow includes a clear acknowledgment screen. The documentation carries a section on legal implications. The bounded security language applies: the Proof Vault proves what the system checked, not that the system is secure. The two-column disclosure for Proof Mode: Column 1 — what the Proof Vault proves (structural verification was performed, results were recorded, entries are tamper-evident). Column 2 — what it doesn't prove (application correctness, business logic safety, absence of undetected compromises between verification intervals).

#### Migration Tooling

- **`loopctl import`** — JSON, CSV, Contentful plugins. Parser component of the deployment tool, different input grammars. Pipeline: parse → validate → **sanitize** → transform → load (Media Loop for binaries, Content Vault for structured data) → verify integrity.
- **Import sanitization (FBD-IS1).** The import pipeline applies the same content sanitization (FBD-CS1) as the admin UI. Content fields in imported data pass through the allowlist HTML sanitizer. Media files pass through the ingress pipeline (FBD-MD1). Resource limits: max 10,000 records per import operation, max 500MB per import file, streaming parser with constant memory. FBD-IS1: imported content that has not passed the sanitizer cannot be written to the Content Vault. The migration tool is the receiving dock. The food safety inspector works the dock the same as the sales floor.
- **`loopctl translate --from contentful`** — reads Contentful export, outputs draft constellation spec. Content types → contract schemas. Roles → surface declarations. Webhooks → bus subscriptions. Asset references → Media Loop references. 80% automatic, 20% documented for human judgment. FBD-MG1: output must pass the deployment tool's validator.
- **Tier 1 migration.** At Tier 1, migration imports run in-process through the same `processRequest` pipeline. No separate binary. `loopcms import contentful-export.json` uses the same six-phase pipeline as every other content write.

#### Supply Chain Baseline (W11 — Phase 1)

**Wes's finding.** The plan has an admission gate for extensions but no admission gate for its own dependencies. Phase 1 establishes the baseline:

- **Software Bill of Materials (SBOM).** Every release includes an SBOM (SPDX or CycloneDX format) listing all direct and transitive dependencies with versions and licenses.
- **Dependency scanning.** Automated vulnerability scanning on every build. Known-vulnerable dependencies block release. The tooling: `npm audit` (Node), Snyk or Grype (container images), Trivy (Docker base images).
- **Pinned versions.** Lock files committed. No floating version ranges in production dependencies. Reproducible builds: same input → same output.
- **Base image policy.** Docker base images are official images, pinned to digest (not tag), and scanned before use. The deployment tool's generated Docker Compose references pinned base images.

FBD-SC1: the build pipeline refuses to produce a release artifact if the dependency scan reports any CRITICAL or HIGH severity vulnerability without an explicit, time-bounded exception. The FDA checks the supply chain. A contaminated ingredient doesn't make it to the shelf.

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

#### Deliverables

- Standard amendment: Content Surface schema, aggregate/metadata contracts, surface-to-loop mapping, locale-variant surfaces
- Standard amendment: Media contracts, embed declaration schema with accessibility requirements
- Standard amendment: Publishing Workflow Pipeline declaration
- Standard amendment: Authentication (identity model, session, RBAC, MFA)
- Standard amendment: Content sanitization (input sanitizer, output encoding)
- Admin UI: Presentation Loop on editorial surface, RBAC-gated, WCAG 2.2 AA (FBD-AC1), CSRF-protected (FBD-CF1)
- Deployment tool v1: spec → Docker Compose, storage enforcement, media provisioning, locale-variant provisioning, publishing workflow provisioning, TLS enforcement (FBD-TL1), secret management (FBD-SM1), spec sanitization (FBD-SI1)
- Media Loop with ingress security, eager transform generation, request coalescing, custom transform budgeting (FBD-TB1), image processing isolation
- Rate limiting at four layers (FBD-RL1)
- Content sanitization pipeline (FBD-CS1) + output encoding (FBD-OE1)
- Proof Vault + Verification Log + independent manifest verifier + scope declaration + hash chain (FBD-LI1) + dual-format logging
- Migration tooling: `loopctl import` (with FBD-IS1 sanitization) + `loopctl translate` + Tier 1 in-process migration
- Operational runbook v1 with incident response pipeline and secret rotation
- Supply chain baseline: SBOM, dependency scanning, pinned versions (FBD-SC1)
- Request pipeline architecture: `processRequest` six-phase function with bounded execution (FBD-TE1) and sanitization verification (FBD-SV1)
- One-way content flow: Presentation Loops read only; admin UI dispatches to pipeline
- Content integrity checksums (FBD-CI1)
- Deployment dry run (FBD-DD1) + Spec Version Store (append-only version history)
- Watchdog/health monitor with liveness heartbeat and graduated response
- System lifecycle state machine: NOMINAL → DEGRADED → SAFE_MODE → RECOVERY (FBD-LM1)
- Running demo: two-surface CMS with authenticated admin UI, RBAC, content sanitization, media ingress, publishing workflow, draft/published isolation, WCAG 2.2 AA, CSRF, TLS, rate limiting, content integrity, lifecycle status reporting. **Single-file Tier 1 demo:** download one file, run one command, same spec deploys to Docker.

**Verification gate:** The Walkman test, security edition — 25 verification items across four domains. *Usability (7):* Editor logs in, sees role-permitted actions, creates article, uploads photo, previews on public surface, schedules, publishes — without encountering architectural vocabulary. *Security (11):* Wrong credentials rejected and rate-limited; unpermitted publish rejected; XSS in title sanitized and verified clean on render; draft invisible from public surface; image EXIF stripped; SVG script sanitized; unlisted embed rejected; unbudgeted transform rejected; imported XSS sanitized; CSRF-tokenless request rejected; no literal secrets in generated config. *Integrity (4):* Verification Log running with valid hash chain; ephemeral storage on non-Vault loops; content checksums valid (FBD-CI1); deployment dry-run validates before apply (FBD-DD1). *Accessibility (3):* Keyboard navigation complete; screen reader compatible; SBOM present. Plus: single-file Tier 1 demo (download, run, same spec deploys to Docker); watchdog heartbeat visible in `loopctl status`; lifecycle state reports NOMINAL.

**What this phase proves:** The capability model extends to humans (RBAC), media (ingress), and content (sanitization). An editor uses the system without understanding it. The operational, security, and fault-response stories start on day one.

---

### Phase 2 — The Walls

*Margaux: "Assigning the aisles and installing the cameras."*

**What ships:** Multi-tenant isolation, Proof Mode with compliance integrations, tenant-scoped media, incremental spec operations, intrusion detection, backup hardening, verification budgeting, and log aggregation.

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

#### Deliverables

- Standard amendment: multi-tenant declaration, Auth Gate tenantId, Vault Loop factory extension, migration runner FBD, periodic self-verification, tenant-scoped RBAC
- Deployment tool v2: multi-tenant provisioning + tenant-scoped media + incremental derive mode + revocation propagation
- Self-verification: full + delta modes with sampling + verification budgeting (FBD-VB1)
- Admin UI extension: tenant selector, per-tenant content views, tenant-scoped RBAC
- Proof Mode: manifest generator (surfaces + tenants), independent verifier, Diff Engine, Proof Endpoint
- Compliance: SIEM format, webhooks, evidence API
- Intrusion detection: capability anomaly, authentication anomaly, egress monitoring
- Backup hardening: encryption, integrity verification at backup time (FBD-BK1 amended), access control
- Deployment twin: `loopctl deploy --stage` → twin validation → `loopctl deploy --promote`
- Running demo: multi-tenant CMS with admin UI, content surfaces, tenant-scoped media, incremental spec operations, compliance-ready proof, intrusion detection, encrypted backups, and staging twin

**Verification gate:** Two-tenant constellation. Tenant A SELECT → only Tenant A rows. Session variable manipulation → refused. Tenant A media → Tenant A namespace only. Proof Endpoint → manifest with exhaustive `cannotAccess`, independently verified. Modify spec → Diff Engine change record. Evidence API → packaged bundle. Incremental derive on a single surface addition → only the affected slice regenerated, full re-derive produces identical output. Revoke an extension → immediate suspension, no requests processed during gap. Rapid spec changes → verification checks queued, not re-derive storms. Restore backup to isolated environment → data intact, secrets encrypted. Simulate capability usage spike → anomaly alert fires.

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

- **Reference extensions.** Two complete examples: SEO analyzer (content-enhancement) and AI content summarizer (ai-content-generation). Full lifecycle. Documentation and integration test. FBD-DX1.
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

**What is irrevocable:**
- Authentication requirement added → cannot rewind to unauthenticated access
- Capability budget tightened → cannot rewind to wider budget
- Extension revoked → cannot rewind to reinstated extension (must re-admit through the admission gate)
- Tenant isolation enabled → cannot rewind to shared access
- Proof Mode enabled → cannot rewind to unmonitored state
- RBAC permission removed → cannot rewind to permissive state

**What is rewindable:**
- Surface additions/removals
- Locale configuration changes
- Media configuration changes
- Publishing workflow modifications
- Non-security extension updates

The security ratchet doesn't prevent the operator from making their system less secure — it prevents Rewind from *accidentally* making it less secure. The operator can always re-derive a new spec with wider permissions. But they have to do it forward (new spec, new deploy, new audit trail), not backward (rewind past the tightening). Forward is deliberate. Backward might be an accident — or an attack.

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

| Phase | Name | Key Additions in v1.4 | Effort | Produces |
|-------|------|----------------------|--------|----------|
| 0 | Foundation | Threat model, authentication, RBAC, transport security, spec shape model, contract config model, Tier 1 single-file, **system lifecycle state machine** | S | Spec, docs, DX spec, threat model, auth architecture, lifecycle spec |
| 1 | Surfaces | Content sanitization, rate limiting, CSRF, session security, secret management, supply chain, import sanitization, transform budgeting, dev/prod parity, incident response, request pipeline, one-way flow, dual-format proof logging, **watchdog/health monitor, content integrity, deployment dry run, spec version store, bounded execution, sanitization verification** | XL | Running CMS with fault response from day one |
| 2 | Walls | Intrusion detection, backup hardening, verification budgeting (bounded coverage), revocation propagation, tenant-scoped RBAC, **deployment twin** | L | Enterprise MVP with security monitoring and staging twin |
| 3 | Gate | Extension behavioral monitoring, egress policies, tier boundary docs, extension ToS, installation rate limiting | XL | Extensible CMS with bounded liability and monitored extensions |
| 4 | Safety Net | Security ratchet, irrevocable transitions, complete forensic trail | M | Undo button that can't undo security |
| 5 | Maturity | Shared infrastructure audit, pen test framework, incident simulation | L | Tier 3, operational hardening, testable security |

**Threading:** Deployment tool (v1→v5). Proof Mode (Phases 1–4). Media (Phases 1–4). Security (Phases 0–5). Admin UI (Phase 1 → extends at Phase 2 with tenant selector → extends at Phase 3 with extension management). Publishing workflow (Phase 1 → extends with scheduled publishing rules per phase). Accessibility (Phase 1 gate → text equivalents through Phase 5). RBAC (Phase 0 design → Phase 1 implementation → Phase 2 tenant-scoped → Phase 3 extension management permissions → Phase 4 rewind permission).

---

## Section 5 — What the Plan Produces at Each Phase

| Phase | Demo | Buyer Conversation |
|-------|------|-------------------|
| 1 | Editor logs in, writes article, uploads photo, previews, hits Publish. Content appears. Draft never visible. EXIF stripped. YouTube sandboxed. Script in headline sanitized. Wrong credentials rejected. No-publish user can't publish. TLS everywhere. Migrate from Contentful — sanitized. **Single-file demo:** Download one file. Run one command. Editor logs in, writes, uploads, publishes. Same spec deploys to Docker for enterprise. | "Your editor logged in with MFA, saw exactly what their role permits, and published in three clicks. The script someone injected was stripped before it touched the database. Migrate from Contentful in one command — through the same security pipeline. Set up a CMS on your laptop in sixty seconds. Write an article, upload a photo, hit Publish. When you're ready for production, the same spec file deploys to Docker, Kubernetes, any cloud. The spec is portable. The capability model is constant." |
| 2 | Multi-tenant with Proof Endpoint, intrusion detection, encrypted backups, and SOC 2 evidence. Revoke an extension — suspension is immediate. | "Tenant isolation at the database level. Intrusion detection watches for anomalies. Revocation is instant. SOC 2 evidence in one API call. Backups encrypted. Scales to 500 tenants." |
| 3 | Extension + AI sandbox with ReferenceError. Egress policy enforced. Built and tested locally in 2 minutes. | "Install AI without risk. Egress is declared and enforced. Build extensions in two minutes. The legal framework ships with the platform." |
| 4 | Constellation Rewind: install, break, undo. Content untouched. Try to undo authentication — refused. | "Undo the architecture. Content untouched. But you can't accidentally undo security — the ratchet won't let you." |
| 5 | Topology map — visual and text — showing the closure wall, security controls, and pen test results. | "Your security model, live, inspectable, accessible, tested, verified every hour." |

**Renata:** The cumulative pitch: "A CMS that sets up in sixty seconds with one file, sanitizes every piece of content before it touches the database, isolates tenants at the database level with immediate revocation, monitors for intrusion, sandboxes extensions with declared egress and bounded liability, strips media clean and budgets transforms, encrypts transport and vaults every secret, produces tamper-evident compliance evidence in one API call, has an undo button that can't undo security, meets WCAG 2.2 AA on every interface, migrates from Contentful in one command through the same security pipeline — and knows when to stop. The fire alarm goes off before the fire reaches the sprinklers. The evacuation plan is posted. The same spec deploys from your laptop to Kubernetes."

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

### Fault Response as Architecture (NASA RCR)

The plan specifies what the system prevents (FBD controls). NASA specifies what the system does when prevention fails. The lifecycle state machine (NOMINAL → DEGRADED → SAFE_MODE → RECOVERY), the watchdog/health monitor, the bounded execution timeouts, the hash chain break procedure, the sandbox breach response, the content integrity checksums, and the deployment dry run are all expressions of the same principle: design failure behavior before success behavior. STOP is the most important thing the code does. The wall prevents damage. Safe Mode stops the bleeding. The degradation hierarchy ensures the system fails gracefully rather than catastrophically. FBD is the floor. Fault response is the airbag.

---

## Section 7 — Risks

**Ed:** Twenty-five risks. Each real. None fatal. Six from security. Three from L21. Two from NASA.

**Risk 1 — Complexity accumulation.** The spec declares everything — loops, contracts, surfaces, media, embeds, tenants, extensions, budgets, locales, publishing workflows, rewind config, authentication, RBAC, egress policies, rate limits. Mitigation: the deployment tool and CLI absorb complexity. `loopctl dev` proves the developer interaction is simple even when the spec is rich. The admin UI proves the editor interaction is simpler still.

**Risk 2 — Market education.** The product speaks business, not architecture. "Your editor publishes in three clicks" not "the Bus Workflow transitions content state." Dual pitch tracks: feature-first for content teams, security-first for enterprise.

**Risk 3 — Tier 1 viability.** Tier 1 gets the closure wall through the scope chain, Content Surface declarations, media via local filesystem, and a simplified admin UI. Same spec, different enforcement. Tier 1 does not support untrusted extensions (documented in tier boundary table).

**Risk 4 — Phase coupling.** Critical path has no slack. Phase 5 absorbs capacity during delays.

**Risk 5 — Phase 0 scope.** The spec amendment now carries locale, media contracts, bounded security language, authentication architecture, RBAC model, and the threat model alongside confinement/attenuation/revocation. More surface area = more review cycles. Mitigation: still spec-only, no code, parallel product-shell work absorbs wait time. The authentication architecture is infrastructure — it's worth the Phase 0 investment.

**Risk 6 — Time-to-parity.** Differentiation, not parity. The Phase 2 MVP occupies a market position no incumbent holds.

**Risk 7 — Multi-class budget edge cases.** Intersective model + precomputed matrix + educational refusal.

**Risk 8 — Proof Vault as liability.** Forensic evidence creates litigation surface. Mitigation: Proof Mode default off, activation acknowledgment screen, legal implications documentation, two-column disclosure on Proof Vault scope. The operator makes an informed choice.

**Risk 9 — Media storage cost at scale.** Transform caching is bounded (LRU). Eager generation bounded to declared standard variants. Custom transforms budgeted (FBD-TB1). Garbage collection on schedule. Per-tenant quotas.

**Risk 10 — Embed security drift.** Allowlist is static; providers change behavior. Mitigation: CSP + sandbox are enforcement, not the allowlist alone. DNS rebinding defense at the CSP layer. Periodic review in operational runbook. Residual risk documented in two-column disclosure.

**Risk 11 — Migration tooling maintenance.** JSON is universal fallback. Contentful translator is reference implementation. Community translators are Phase 3+ ecosystem opportunity.

**Risk 12 — Admin UI scope creep (Parallax 3).** The admin UI is "five Walkman buttons," not WordPress. The temptation to build a full CMS admin with plugins, dashboards, analytics, and theme editors is real. Mitigation: the admin UI is a Presentation Loop. Its features are bounded by the editorial Content Surface's contract vocabulary. It can't do more than the surface permits. The architecture constrains the scope. FBD-UI1.

**Risk 13 — Security claim litigation (Parallax 3).** Bounded language + scope declaration + two-column disclosure + tier boundary documentation. The marketing claim matches the technical guarantee. "Water resistant" not "waterproof."

**Risk 14 — Localization complexity (Parallax 3).** Two models (surface-level, field-level) add a decision point at Phase 0. Mitigation: both use the same capability infrastructure. The operator's `localeStrategy` declaration chooses. The capability model carries both. The decision is per-constellation, not per-platform.

**Risk 15 — Authentication adds Phase 0 scope (Security RCR).** Authentication architecture is a significant Phase 0 addition. Mitigation: identity model, session architecture, and RBAC are well-understood problems with established patterns. The risk is not novelty — it's scope. The Phase 0 Super RCR must cover authn alongside capability model.

**Risk 16 — Security overhead on DX (Security RCR).** Content sanitization, CSRF tokens, rate limiting, RBAC — each adds friction for developers and editors. Mitigation: FBD-DP1 (dev/prod parity) ensures developers experience the friction early. The admin UI absorbs the complexity — the editor doesn't configure CSRF tokens, the framework handles it. The DX tooling is load-bearing.

**Risk 17 — Intrusion detection false positives (Security RCR).** Behavioral anomaly detection at Phase 2 will produce false positives. Mitigation: alerts go to operators, not automated response (except rate limiting). Baseline calibration period. Tunable thresholds. False positives are operationally annoying. False negatives are security failures. Err toward detection.

**Risk 18 — Security ratchet rigidity (Security RCR).** The ratchet prevents accidental security regression but also prevents intentional security relaxation via Rewind. Mitigation: the operator can always re-derive a new spec with wider permissions (forward path). The `--force-past-ratchet` override exists for emergencies, audited. The ratchet constrains one operation (Rewind), not all operations.

**Risk 19 — Supply chain scanning noise (Security RCR).** Dependency scanning produces findings. Not all findings are exploitable in context. Mitigation: CRITICAL and HIGH block release (FBD-SC1). MEDIUM and LOW are tracked. Time-bounded exceptions require documentation.

**Risk 20 — Image processing CVEs (Security RCR).** Image processing libraries have ongoing vulnerability disclosures. Mitigation: transform isolation (restricted subprocess, no network, memory/CPU limits, seccomp). Dependency scanning (FBD-SC1) catches known CVEs. The isolation contains the blast radius of unknown CVEs. Defense in depth: validate the input (FBD-MD1), isolate the processing, scan the dependency.

**Risk 21 — Single-file performance ceiling (L21 Cross-Pollination).** SQLite is single-writer. ~50,000 inserts/sec capacity, but concurrent writes queue. Fine for single-operator (single-digit editors). Fails at 50 concurrent editors. Mitigation: Tier 1 → Tier 2 migration is explicit. Same spec, different backing store. SQLite WAL mode handles concurrent reads. Litestream for continuous backup.

**Risk 22 — Single-file security surface (L21 Cross-Pollination).** One process = one compromise = everything. No container isolation. No network segmentation. Mitigation: Tier 1 is for single-operator deployments. Tier boundary documentation is explicit and loud. Any deployment with untrusted users or untrusted extensions must be Tier 2+.

**Risk 23 — Two deployment models (L21 Cross-Pollination).** Single-file and Docker Compose double testing surface. Mitigation: same code, same `processRequest` pipeline, same `CONTRACT_CONFIGS`. Only backing store adapters differ (SQLite vs. Postgres, local fs vs. S3, Worker thread vs. subprocess). Adapter interface is the abstraction boundary.

**Risk 24 — Safe Mode false positives (NASA RCR).** The watchdog and health monitor will occasionally trigger DEGRADED or SAFE_MODE transitions for transient issues (network blip, temporary memory spike). Mitigation: graduated response with configurable thresholds. DEGRADED requires sustained anomaly (default: 3 consecutive heartbeat violations). SAFE_MODE requires critical failure or sustained DEGRADED (default: 5 minutes in DEGRADED without recovery). Auto-recovery from DEGRADED if metrics return to normal. SAFE_MODE requires explicit operator action to exit — conservative by design. False positives are operationally annoying. False negatives are data loss.

**Risk 25 — Deployment twin maintenance burden (NASA RCR).** The Phase 2 staging twin must mirror production topology, adding infrastructure cost and maintenance. Mitigation: at Tier 1, the twin is a second process on the same machine (near-zero cost). At Tier 2+, the twin shares infrastructure but runs in a separate namespace. The deployment tool provisions the twin alongside production — same spec, same generator, one additional target. The twin is maintained by the same automation that maintains production. NASA maintains OPTIMISM alongside Perseverance because the alternative — testing on the production rover — is unacceptable.

---

## Section 8 — Four Corners

**FBD (Floor).** Thirty named controls (full registry in Section 9). FBD controls are implemented as properties of `CONTRACT_CONFIGS` entries, enforced by the `processRequest` pipeline with bounded execution time. The config table is the FBD mechanism — the factory requires security properties. The floor now extends beyond prevention into fault response: the lifecycle state machine (FBD-LM1), content integrity verification (FBD-CI1), sanitization dual-verification (FBD-SV1), deployment dry-run gating (FBD-DD1), and bounded execution (FBD-TE1) ensure the system handles its own failures, not just prevents them. Structural enforcement at every layer, for text and media, from the membership card scanner through the one-way turnstile to the fire alarm and the evacuation plan.

**FWW(C) (Ceiling).** "Download one file. Run one command. You have a CMS." The single-file demo is FWW(C) at its purest. The grocery store has a fire alarm system, an evacuation plan, and sprinklers that activate floor by floor — and the editor still publishes in three clicks without knowing any of it exists.

**STP (Show the Path).** Three source documents. Nine review passes: three Parallax, one Super RCR with Super Frame, one Lens, one Security, one L21 Cross-Pollination, one NASA Flight Software Engineering. Ninety-one findings plus twelve isomorphisms, all incorporated. Every finding has a disposition. Every phase traces to dependencies, verification gates, and demos. Twenty-five risks. Twelve L21 precedents from a working 18,900-line codebase. NASA flight software engineering principles validated across 40+ missions. The path is documented at every step.

**SNR (Signal-to-Noise).** The plan sequences. The source documents specify. Each FBD control stated once and referenced by tag. Security as threading dimension. Media as threading dimension. Fault response as threading dimension. The lifecycle state machine carries the degradation structure. `CONTRACT_CONFIGS` collapses security properties into contract entries. One mechanism, one statement, references thereafter.

---

## Section 9 — FBD Control Registry

**L21 integration note.** FBD-CS1, FBD-RL1, FBD-RB1, FBD-LI1, FBD-TB1, and FBD-MD1 are implemented as properties of `CONTRACT_CONFIGS` entries, enforced by the `processRequest` pipeline. The config table is the FBD mechanism — adding a contract without specifying its security properties is structurally impossible because the factory requires them.

| Control | Gate | Description |
|---------|------|-------------|
| FBD-AU1 | Phase 1 | Authentication required for capability-bearing requests — no valid token, no entry |
| FBD-RB1 | Phase 1 | RBAC — every admin action requires a named permission; additive from zero |
| FBD-CS1 | Phase 1 | Content sanitization — allowlist-based HTML sanitizer before Content Vault write |
| FBD-OE1 | Phase 1 | Output encoding — context-aware escaping in Presentation Loop at render time |
| FBD-CF1 | Phase 1 | CSRF — state-modifying requests require valid CSRF token |
| FBD-TL1 | Phase 1 | TLS required for all non-localhost deployments; deployment tool refuses to generate without |
| FBD-SM1 | Phase 1 | Secrets as vault references; generator refuses to emit literal secret values |
| FBD-SI1 | Phase 1 | Spec output sanitization — all spec values escaped for target format in generated configs |
| FBD-RL1 | Phase 1 | Rate limiting at four layers: public API, admin API, media transforms, migration |
| FBD-TB1 | Phase 1 | Custom transform budgeting — unauthenticated requests get zero budget |
| FBD-IS1 | Phase 1 | Import sanitization — same content/media pipeline as editor ingress; resource limits |
| FBD-SC1 | Phase 1 | Supply chain — dependency scan blocks release on CRITICAL/HIGH CVEs |
| FBD-BK1 | Phase 1 | Backup encryption mandatory; key stored separately from backup |
| FBD-DP1 | Phase 1 | Dev/prod security parity — capabilities and sanitization identical; only operational controls relaxed |
| FBD-MD1 | Phase 1 | Media ingress validation before `STORE_MEDIA` commits; processing isolation |
| FBD-MV1 | Phase 1 | Dual-channel manifest verification; two independent projections must agree |
| FBD-MG1 | Phase 1 | Translator output must pass deployment tool validator |
| FBD-LI1 | Phase 1 | Log integrity — Proof Vault hash chain + application log HMAC tokens |
| FBD-OP1 | Phase 1 | Deployment output includes monitoring config |
| FBD-AC1 | Phase 1 | Admin UI WCAG 2.2 AA verification gate |
| FBD-UI1 | Phase 1+ | Admin UI scope bounded by editorial surface contracts |
| FBD-VB1 | Phase 2 | Verification budgeting — compute cap on self-verification cycles |
| FBD-BM1 | Phase 3 | Behavioral monitoring — egress to undeclared destinations blocked at Tier 2+ |
| FBD-DX1 | Phase 3 | Reference extensions are integration tests for `loopctl dev` |
| FBD-SR1 | Phase 4 | Security ratchet — irrevocable security transitions cannot be rewound past |
| FBD-LM1 | Phase 1 | Lifecycle state machine — write operations structurally impossible in SAFE_MODE |
| FBD-CI1 | Phase 1 | Content integrity — per-record checksums verified on read; mismatch triggers DEGRADED |
| FBD-SV1 | Phase 1 | Sanitization verification — independent dual-path check on sanitized output |
| FBD-DD1 | Phase 1 | Deployment dry run — changes must pass dry-run validation before apply |
| FBD-TE1 | Phase 1 | Bounded execution — per-phase timeouts in `processRequest`; no unbounded operations |

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

*Bev recorded. Leroy held position. Geoff arrived for the cross-pollination, observed the fractal nature of the isomorphisms, and departed having said exactly as much as Geoff wanted to say.*

---

## Source Document Reference

| Document | Version | Scope |
|----------|---------|-------|
| Distributed Closure Wall Plan | v1.2 | 5 layers — capability model through structural verifier |
| CMS Capability Gaps Plan | v1.1 | 3 gaps — draft/published, multi-tenant, extension admission |
| CMS Novel Capabilities Report | v1 | 4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind |
| L21 Cross-Pollination Merge Plan | v1 | 12 isomorphisms — config-driven contracts, request pipeline, state shape factories, single-file Tier 1 |
| NASA Flight Software Engineering RCR | Informal 6 | 14 findings — safe mode, watchdog, digital twin, degradation, content integrity, bounded execution, lifecycle |

All four remain canonical for implementation detail. This plan governs sequencing and scope.

---

## Findings Register

### Parallax 1–3 — 25 findings, all incorporated
### Super RCR — 6 media findings, all incorporated
### Lens RCR — 8 resolutions, all incorporated
### Security RCR — 26 findings, all incorporated
### L21 Cross-Pollination RCR — 12 isomorphisms, all incorporated (22 integration points)
### NASA Flight Software Engineering RCR — 14 findings, all incorporated (5 new FBD controls, 3 FBD amendments, 6 architectural additions)

**Total: 91 findings across 9 review passes + 12 L21 isomorphisms. All incorporated. 0 outstanding.**

---

[PULSE] Master CMS Implementation Plan v1.6: Nine review passes. 91 findings + 12 isomorphisms, all incorporated. 11 workstreams. 6 phases. 25 risks. 9 cross-cutting concerns. 30 FBD controls. STRIDE threat model. System lifecycle state machine (NOMINAL → DEGRADED → SAFE_MODE → RECOVERY). CONTRACT_CONFIGS + processRequest with bounded execution. Watchdog/health monitor. Content integrity checksums. Sanitization dual-verification. Deployment dry run. Digital twin staging. Spec version store at Phase 1. Hash chain break procedure. Sandbox breach response. NASA flight software engineering principles: design failure behavior before success behavior. STOP is the most important thing the code does.

[DRIVES: Floor, Ceiling, Depth, Mesh, Ground, Equalization, Constraint — 7/7]

---

*Loop MMT™ · Multi-Module Theory · CMS Master Implementation Plan v1.6*
*Nine review passes. 91 findings + 12 isomorphisms. All incorporated.*
*Lenses: Rugged Sony Walkman · F1 Racing Operations · McMaster-Carr · NASA Flight Software Engineering*
*Isomorphisms: L21 flow computer (v.331, 18,900 lines, 574 functions)*
*The grocery store has a security team, a single-file demo, and an evacuation plan.*
*© 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0*
