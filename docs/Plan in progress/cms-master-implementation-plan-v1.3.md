# Loop MMT CMS — Master Implementation Plan v1.3
## Loop MMT™ · Loop World | Shrubbery · 21 April 2026

---

## About This Document

*[Section Type: Plan]*

***Evidence status: Nothing in this plan has been implemented or tested. Every mechanism described is architectural. The CMS described in this plan does not exist. It is a grocery store made of words.***

This document consolidates three CMS architectural plans, three Parallax passes, one Super RCR, and one lens-RCR into a single implementation sequence:

- **Distributed Closure Wall Plan v1.2** (5 layers — capability model, deployment tool, ephemeral exceptions, storage enforcement, structural verifier)
- **CMS Capability Gaps Plan v1.1** (3 gaps — draft/published boundary, multi-tenant isolation, extension admission model)
- **CMS Novel Capabilities Report v1** (4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind)
- **Parallax Pass 1** (Builder, Incumbent, Investor, Operator-at-Phase-3 — 9 findings)
- **Parallax Pass 2** (Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer — 8 findings)
- **Super RCR** (9 items — 8 Parallax 2 findings + media handling — Super Frame on media, 6 lenses)
- **Parallax Pass 3** (Content Editor, Lawyer, Performance Engineer, i18n/Accessibility Specialist — 8 findings)
- **Lens RCR** (Rugged Sony Walkman, F1 Racing Operations, McMaster-Carr — 8 resolutions)

The plan builds a CMS. The CMS has an engine (the capability model), a dashboard (the admin UI), a supply chain (the deployment tool), a receiving dock (the admission gate), a security system (Proof Mode), an international food aisle (localization), a checkout counter (the content editor's five buttons), produce (media), wheelchair ramps (accessibility), and an undo button (Constellation Rewind). The grocery store metaphor carries it all, and it earned every aisle.

**Resource model assumption.** AI-assisted solo development (one operator with AI tooling). Phase 0's parallel tracks run sequentially under this model. A small team (3–5) would parallelize and could start Phase 5 during Phase 2. The critical path (Phases 0 → 1 → 2 → 3 → 4) is team-size-invariant — the dependencies are architectural, not resourcing.

**What this plan replaces.** The three source documents remain as detailed specifications. This plan sequences them, resolves their overlaps, and provides the build order. For the mechanism behind any specific feature, read the source document.

---

## Section 1 — The Collapse

**Sol:** The three source documents contain twelve named workstreams. Under dependency analysis, twelve collapses to nine. Media adds W10 as a threading dimension. The admin UI and publishing workflow are Phase 1 deliverables built on existing architectural primitives — they don't add workstreams because they *are* consumers of the workstreams.

**Collapse 1: Content Surfaces absorbs Gap 1 (Draft/Published).** Gap 1 is a two-surface system. Content Surfaces is the general-case N-surface system. Build the general case. Get the special case for free.

**Collapse 2: AI Sandbox merges with Gap 3 (Extension Admission).** AI Sandbox is the extension admission model applied to AI agents with AI-specific budget classes. One system, not two.

**Post-collapse workstream inventory (ten units):**

| # | Workstream | Source | Notes |
|---|-----------|--------|-------|
| W1 | Capability Model (L1) | v1.2 | Includes locale as recognized dimension |
| W2 | Deployment Tool + Storage Enforcement (L2+L4) | v1.2 | L4 merged into L2; incremental operations at Phase 2 |
| W3 | Content Surfaces | Novel Capabilities | Gap 1 absorbed; locale-variant surfaces |
| W4 | Proof Mode | Novel Capabilities | Independent manifest verifier; compliance integration |
| W5 | Multi-Tenant Isolation (Gap 2) | v1.1 | — |
| W6 | Extension Admission + AI Sandbox | v1.1 + Novel | Gap 3 + AI Sandbox merged; liability declaration |
| W7 | Constellation Rewind | Novel Capabilities | Media-safe rewind |
| W8 | Ephemeral Exceptions (L3) | v1.2 | — |
| W9 | Structural Verifier (L5) | v1.2 | Topology map with text equivalent |
| W10 | Media System | Super RCR | Threading dimension (Phases 1–4); eager transforms |

Three workstreams absorbed. Ten remain. The admin UI and publishing workflow are **consumers** of W3 (Content Surfaces) — they prove the architecture by being built on it. They don't need their own workstream because the architecture is doing the work. That's the test.

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
 └──→ W10 (Media System) [partial — media contracts need W1, full threading W3–W7]
```

**Critical path:** W1 → W3 → W5 → W6. W2 runs parallel to W3. W4 and W10 thread through everything. W7, W8, W9 are terminal. The admin UI and publishing workflow ship at Phase 1 as consumers of W3 — they don't appear in the dependency graph because they depend on Content Surfaces, and Content Surfaces is already on the critical path.

---

## Section 3 — The Six Phases

### Phase 0 — The Foundation

*Margaux: "Getting the permits."*

**What ships:** The capability model spec amendment and the product shell.

**Spec track (Chen Wei):** Standard amendment defining confinement, attenuation, and revocation as properties of the contract system. This is W1. The amendment either extends Standard Section 5 (Boundary Enforcement) or adds a new Section 16 (Capability Model).

**Locale decision (Phase 0).** The capability model spec amendment declares locale as a recognized dimension of the contract system. Two models are supported — the constellation operator chooses per deployment:

- **Model A — Locale-as-Surface.** Each locale produces surface variants (`public-en`, `public-ar`, `public-ja`). Same contract vocabulary, locale-specific content. The deployment tool provisions locale-variant surfaces from the spec's locale declaration. Architecturally clean — locale is topology. The F1 answer: same car, different circuit configuration.
- **Model B — Locale-as-Field.** Content records carry a `locale` field. Surfaces are locale-agnostic. Queries include a locale parameter. Simpler for small-scale multilingual. The McMaster answer: universal catalog, locale-aware presentation.

Both models use the same capability infrastructure. The spec amendment defines locale as a surface parameter (Model A) or a content schema field (Model B). Phase 0 doesn't choose between them — it ensures the capability model carries both. The constellation operator's `localeStrategy` declaration in the spec determines which model governs their deployment.

**Product track (Vee, Renata, parallel):** Product shell: security model diagram format, developer documentation framework, extension developer guide skeleton, CLI command structure, local development mode specification.

**Bounded security language (Lens RCR P2-F1).** The product documentation framework establishes the linguistic boundary for all security claims. Two rules:

1. **"Verifiable security configuration" not "proven security posture."** The system's configuration is machine-readable and self-checked. The claim is bounded to contract-level access control. The limitation (structural access control ≠ differential privacy, ≠ inference resistance, ≠ application-level vulnerability protection) travels with every claim.
2. **Two-column disclosure.** Every security document carries: Column 1 — what the system enforces (contract isolation, capability attenuation, structural verification). Column 2 — what the system does not address (side channels, timing attacks, inference from aggregates, extension output quality). McMaster lists tensile strength *and* the temperature range. Sony prints "water resistant" not "waterproof." The spec tolerance bounds the marketing claim.

**Deliverables:**
- Standard amendment: Capability Model (confinement, attenuation, revocation, locale dimension)
- Product documentation framework (with bounded security language)
- Security model diagram format specification
- Developer guide skeleton
- DX specification: `loopctl` CLI command structure, local dev mode spec

**Verification gate:** Super RCR on the spec amendment. The most consequential review in the plan. Get confinement, attenuation, revocation, and locale right — the plan flows. Get them wrong — every phase inherits the error.

**What this phase proves:** The bus contract system carries capability semantics and locale as a recognized dimension.

---

### Phase 1 — The Surfaces

*Margaux: "Building the shelves, stocking the first products, and opening the checkout counter."*

**What ships:** Content Surfaces, the admin UI, the publishing workflow, the deployment tool (v1), Proof Mode infrastructure, the Media Loop with eager transforms, migration tooling, the operational runbook, and the first running CMS demo with an editor who can actually use it.

#### Content Surfaces (Sol, Graham, Sable)

The surface declaration schema, aggregate and metadata contract types, surface-to-loop mapping, locale-variant surface provisioning, and the self-verification extension. This is W3, which absorbs Gap 1. The draft/published split is the first test case. Locale-variant surfaces (if the operator chose Model A) are the second test case.

Implementation detail lives in the Novel Capabilities Report §2 and Gaps Plan v1.1 §2. The spec amendment adds: surface declarations to the constellation spec grammar (with optional `locales` parameter), `FETCH_CONTENT_AGGREGATE` and `FETCH_CONTENT_METADATA` contract types, surface-to-loop factory wiring, and self-verification of surface-contract integrity.

#### The Admin UI — Five Buttons on a Walkman

**Ed:** The grocery store had a supply chain, a security system, a receiving dock, and twelve kinds of enforcement. It did not have a checkout counter. Now it does.

The admin UI is a **Presentation Loop consuming the editorial Content Surface.** It is not a separate system. It is a consumer of the architecture — the same way the public website is a consumer of the public surface. The admin UI proves that Content Surfaces are sufficient to build a full editing experience. It is reference implementation, integration test, and product, simultaneously.

The editor sees five actions. Like a Walkman. Like McMaster's three-click taxonomy. Like the pit wall's decision interface.

1. **Write** — create and edit content. Rich text editor. Structured fields derived from the content schema in the constellation spec. The editor doesn't see contracts or loops. The editor sees "Article," "Page," "Product" — content types derived from the spec's schema declarations. McMaster-organized: by content type, not by architectural concept.
2. **Upload** — attach media. Drag-and-drop into the media library or inline into content. The Media Loop's ingress pipeline (magic-byte validation, SVG sanitization, EXIF stripping) runs silently. The editor sees "Upload complete." The editor does not see "STORE_MEDIA contract executed with FBD-MD1 ingress validation." The belt drive is inside the case.
3. **Preview** — see content as it will appear on any surface. The editor selects a surface (public, analytics, recommendation) and sees what that surface's consumers will see. Preview is a read from the target surface's contracts applied to the draft content. The editor sees the public site's view of their article — without the draft being published.
4. **Schedule** — set a publication date/time. The Clock fires the `SCHEDULED → PUBLISHED` transition. The editor picks a date. The architecture does the rest.
5. **Publish** — push content to the public surface. One button. The content state transitions from `DRAFT` (or `SCHEDULED`) to `PUBLISHED`. The public surface can now query it. The editorial surface already could.

The admin UI is organized like McMaster: content type taxonomy in the left nav, content list with status indicators, single-item editor with surface preview. No architectural jargon. No mention of loops, buses, contracts, or surfaces in the UI copy. The editor's mental model is: "my content, its status, where it appears." The architecture's mental model is: "surface-scoped contract queries with capability attenuation." Same reality, two vocabularies. The admin UI translates.

**Accessibility gate (FBD-AC1).** The admin UI meets WCAG 2.2 AA before Phase 1 ships. Keyboard navigable. Screen reader compatible. Sufficient color contrast. Focus management. ARIA landmarks. This is a verification gate, not a feature toggle. If the admin UI doesn't pass, Phase 1 doesn't ship. The Walkman has raised dots on the Play button so you can find it without looking. The admin UI has semantic HTML so you can use it without seeing.

#### Publishing Workflow — The Pit Stop

Content lifecycle as a **Bus Workflow** — the same architectural primitive used for the extension installation pipeline in Phase 3. Five states: `DRAFT` → `IN_REVIEW` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`.

Each transition is a bus event. Each transition can carry a validation step — a pre-publish check (required fields present? media attached? SEO metadata complete? locale variants linked?). Scheduled publishing is a Clock event. The Workflow is declared in the constellation spec as a Pipeline — provisioned by the deployment tool alongside surfaces and loops.

The F1 pit stop: car enters → jacks up → wheels off → wheels on → jacks down → car exits. Two seconds. Each step has a predecessor, a role, a completion signal. Draft → Review → Publish follows the same choreography. The publishing workflow is not separate infrastructure — it's the Bus Workflow primitive applied to content state. The architecture already has the mechanism. Phase 1 applies it.

#### Deployment Tool v1 (Graham, Dara)

Reads a constellation spec with surface declarations (including locale variants and publishing workflow), outputs Docker Compose (Tier 2). Storage enforcement baked in. Four-component architecture: Parser (spec grammar + import source plugins) → Validator (capability model constraints) → Generator (deployment artifacts, pluggable backends) → Verifier (output matches IR). The import side of the parser handles migration sources. A refactoring gate fires between Phase 2 and Phase 3.

#### Media Loop (W10 — Phase 1)

Specialized Vault Loop with pluggable backing store (local at Tier 1, S3 at Tier 2, multi-CDN at Tier 3). Five media contracts: `STORE_MEDIA`, `FETCH_MEDIA_PUBLIC`, `FETCH_MEDIA_FULL`, `FETCH_MEDIA_METADATA`, `TRANSFORM_MEDIA`. Media contracts scope to Content Surfaces like all contracts.

**Ingress security pipeline (FBD-MD1).** Every media upload passes through: magic-byte file-type validation (not extension), SVG sanitization (strip `<script>`, event handlers), EXIF stripping (GPS, camera ID, timestamps — gone before storage), size/dimension caps. Validated before `STORE_MEDIA` commits. The wall catches it at the input, not the output.

**Eager transform generation (Lens RCR P3-F2).** When media is uploaded, the Media Loop immediately generates transforms for all declared responsive variants in the constellation spec's media configuration (e.g., thumbnail 200px, medium 800px, large 1600px; WebP + JPEG fallback). Transforms are generated at upload time, cached, and ready before the first request. McMaster pre-renders every product page. F1 pre-computes every tire strategy. The media pipeline pre-generates every standard variant. Cold cache on a high-traffic page becomes impossible for standard variants.

**Request coalescing for non-standard transforms.** Custom transforms (unusual crop, non-standard dimensions via API) use request coalescing: first request triggers generation; concurrent identical requests wait on the same promise. The thundering herd becomes a single gallop with a waiting room.

**Embed system.** Embed declarations in the constellation spec with allowlist and per-provider isolation policy. Content editors insert embed URLs; the ingestion pipeline validates against the allowlist. Denied URLs rejected at content ingestion with educational message. Initial providers: YouTube, Vimeo, CodePen, Twitter/X. Per-provider `csp` and `sandbox` attributes.

**Embed accessibility (Lens RCR P4-F2).** Each embed allowlist entry includes `accessibilityRequirements`: `captions: required`, `keyboardNav: required`. The sandbox configuration preserves permissions needed for accessibility features (e.g., `allow-same-origin` for YouTube's caption API). Accessibility constraints are part of the embed isolation policy, not separate from it.

```
embeds: {
  allowlist: ['youtube.com', 'vimeo.com', 'twitter.com', 'codepen.io'],
  isolation: {
    'youtube.com': {
      csp: "frame-src https://www.youtube.com",
      sandbox: 'allow-scripts allow-same-origin',  // allow-same-origin preserves caption API
      accessibilityRequirements: { captions: 'required', keyboardNav: 'required' }
    }
  },
  default: 'deny'
}
```

#### Proof Mode Infrastructure (Nyx, Dara)

Verification Log schema, append-only Proof Vault, log-capture mechanism. Self-verification output from this phase onward goes into the Proof Vault.

**Independent manifest verifier (FBD-MV1).** A second Compute Loop reads the constellation spec and produces its own security projection. Two independent code paths, same inputs, outputs must agree. Dual-channel verification — the pattern aviation uses for flight control. Cannot be disabled independently of self-verification.

**Security Manifest scope declaration.** Every manifest carries: `scopeOfVerification: 'contract-level access control'`. The manifest does not claim to verify side-channel resistance, timing attacks, inference from aggregates, or application-level logic errors. The scope field bounds the claim. McMaster lists tensile strength *and* temperature range. The manifest lists what it verifies *and* what it doesn't.

**Proof Vault retention policy.** Configurable with jurisdiction-aware defaults: 1yr/5yr (SOC 2), 6yr/10yr (HIPAA), 7yr (financial). Compaction rules for verification entries. Forensic entries (spec diffs, admission records, rewind logs) never compact.

#### Migration Tooling

- **`loopctl import`** — JSON, CSV, Contentful plugins. Parser component of the deployment tool, different input grammars. Pipeline: parse → validate → transform → load (Media Loop for binaries, Content Vault for structured data) → verify integrity.
- **`loopctl translate --from contentful`** — reads Contentful export, outputs draft constellation spec. Content types → contract schemas. Roles → surface declarations. Webhooks → bus subscriptions. Asset references → Media Loop references. 80% automatic, 20% documented for human judgment. FBD-MG1: output must pass the deployment tool's validator.

#### Operational Runbook v1

Ships with the deployment tool. Deployment lifecycle (when to re-derive, how to validate, how to roll back pre-Rewind). Monitoring (self-verification failures as structured JSON, parseable by any log aggregator). Incident response (failure → alert → diagnosis checklist → resolution per type). Backup/recovery (Vault snapshots, spec version history in VCS). FBD-OP1: deployment output includes monitoring config; deploy without alerts → warning.

#### Deliverables

- Standard amendment: Content Surface schema, aggregate/metadata contracts, surface-to-loop mapping, locale-variant surfaces
- Standard amendment: Media contracts, embed declaration schema with accessibility requirements
- Standard amendment: Publishing Workflow Pipeline declaration
- Admin UI: Presentation Loop on editorial surface, WCAG 2.2 AA (FBD-AC1)
- Deployment tool v1: spec → Docker Compose, storage enforcement, media provisioning, locale-variant provisioning, publishing workflow provisioning
- Media Loop with ingress security, eager transform generation, request coalescing
- Proof Vault + Verification Log + independent manifest verifier + scope declaration
- Migration tooling: `loopctl import` + `loopctl translate`
- Operational runbook v1
- Running demo: two-surface CMS (public/editorial) with admin UI, content creation, media upload, image transforms, Contentful import, publishing workflow, draft/published isolation, locale variants (if Model A), embed support, and WCAG 2.2 AA accessibility

**Verification gate:** The Walkman test — can an editor who has never seen the system create an article, upload a photo, preview it on the public surface, schedule publication, and see it go live? Without ever encountering the words "loop," "contract," "surface," "bus," or "constellation"? Then: from the public Presentation Loop, attempt to query draft content — confirm absent. Upload an image — confirm EXIF stripped. Upload an SVG with `<script>` — confirm sanitized. Insert a YouTube embed — confirm sandboxed with captions accessible. Insert an unlisted embed provider — confirm rejected. Run `loopctl import` with Contentful export — confirm content and media imported. Check the Verification Log — startup check recorded. Check the deployment — non-Vault loops have ephemeral storage. Run keyboard-only navigation through the admin UI — confirm all functions reachable. Run a screen reader through the admin UI — confirm all content announced.

**Kira:** This is the real demo. Not `loopctl` commands. Not deployment topology. An editor writes an article, uploads a photo, hits Preview, hits Publish. And then you show them the trick: "The public site didn't filter out your draft. It didn't know it existed. Your photo was scrubbed of metadata before it left the editorial surface. The YouTube embed is sandboxed. Migrate your whole Contentful site in one command. And the audit log is already running." The features sell the meeting. The architecture sells the deal.

**What this phase proves:** Contract-vocabulary-as-boundary works for text and media. The admin UI proves Content Surfaces are sufficient to build editing experiences. The publishing workflow proves Bus Workflows extend to content state. An editor can use the system without understanding the system. The operational story starts on day one. Accessibility is not an afterthought.

---

### Phase 2 — The Walls

*Margaux: "Assigning the aisles."*

**What ships:** Multi-tenant isolation, Proof Mode with compliance integrations, tenant-scoped media, and incremental spec operations.

#### Multi-Tenant Isolation (Sol, Nyx, Dara)

Auth Gate `tenantId` stamping, tenant-scoped Vault Loop factory (RLS Path A or schema-per-tenant Path B), atomic migration runner, periodic Clock-triggered verification, constellation spec `multiTenant` declaration. Path A guard: connection wrapper refuses `SET` on tenant session variable.

The admin UI extends: tenant selector for operators managing multiple tenants. Per-tenant content views. The editorial surface spans tenants for super-admins; tenant-scoped editorial surfaces for tenant-specific editors. Locale × tenant produces the surface matrix — `editorial-en-tenantA`, `public-ar-tenantB` — all provisioned from the spec.

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

This doesn't matter at Phase 1 with 2 tenants. It's the difference between 500-tenant feasibility and 500-tenant failure. Phase 2 engineering.

#### Proof Mode Maturation (Nyx)

Security Manifest covers surfaces + tenants. `cannotAccess` exhaustive within declared capability model — lists every contract type not assigned to the component, scoped to the spec's vocabulary, not the universe of possible accesses. Independent manifest verifier covers both declaration types. Diff Engine online: spec changes produce change records.

#### Third-Party Compliance Integration

- **Structured log format.** Verification Log in JSON-LD with CEF mapping. SIEM-native (Splunk, Datadog, Elastic).
- **Webhook on verification events.** All events, failures only, or spec-change events. GRC-ready (Vanta, Drata, Secureframe).
- **Evidence collection API.** Packaged evidence bundles for audit cycles. One API call = SOC 2 evidence package.

**Proof Endpoint.** Read-only API serving Security Manifest and Verification Log. A Presentation Loop scoped to the Proof Vault. Reads proof artifacts. Cannot modify them.

#### Deliverables

- Standard amendment: multi-tenant declaration, Auth Gate tenantId, Vault Loop factory extension, migration runner FBD, periodic self-verification
- Deployment tool v2: multi-tenant provisioning + tenant-scoped media + incremental derive mode
- Self-verification: full + delta modes with sampling
- Admin UI extension: tenant selector, per-tenant content views
- Proof Mode: manifest generator (surfaces + tenants), independent verifier, Diff Engine, Proof Endpoint
- Compliance: SIEM format, webhooks, evidence API
- Running demo: multi-tenant CMS with admin UI, content surfaces, tenant-scoped media, incremental spec operations, and compliance-ready proof

**Verification gate:** Two-tenant constellation. Tenant A SELECT → only Tenant A rows. Session variable manipulation → refused. Tenant A media → Tenant A namespace only. Proof Endpoint → manifest with exhaustive `cannotAccess`, independently verified. Modify spec → Diff Engine change record. Evidence API → packaged bundle. Incremental derive on a single surface addition → only the affected slice regenerated, full re-derive produces identical output.

**Revenue gate.** Phase 2 is the enterprise MVP. Multi-tenant CMS with Content Surfaces, media, admin UI, Proof Mode, compliance integration, migration path, and incremental operations. Pre-seed → Phases 0–1. Seed → Phase 2. Series A → Phases 3–4.

**What this phase proves:** Capability attenuation extends from content vocabulary to data scope to media scope. Incremental operations maintain performance at scale. The compliance story is production-ready. The admin UI works across tenants.

---

### Phase 3 — The Gate

*Margaux: "Opening the receiving dock."*

**What ships:** Extension admission with AI sandbox, developer onboarding tools, extension media budgets, extension lifecycle management, and a complete extensible CMS with bounded liability.

#### Extension Admission + AI Sandbox (W6)

Manifest format, capability budgets (including AI and media budgets), admission gate, installation pipeline, self-verification, update re-admission.

**Intersective budget composition.** Multi-class extensions get the intersection of permissions. More classes = narrower scope, not wider. Media capabilities included in the intersection. The additive approach was rejected — it creates capability-escalation incentive.

**Extension liability declaration (Lens RCR P2-F2).** The extension manifest includes a `liabilityDeclaration` field: the developer acknowledges responsibility for the extension's output. The admission gate checks for its presence. The platform is the marketplace; the extension developer is the merchant. AI provenance metadata is operational telemetry, not legal determination of content rights. F1 supplier accountability: the team is responsible for the car, but the homologation chain traces to the supplier.

**Installation pipeline.** Six-step Workflow: validate → admit → merge spec → re-derive (incremental) → self-verify → activate.

**AI audit trail.** AI-generated content and media carry provenance metadata (model, prompt, parameters, budget class). Provenance feeds the Proof Vault.

**Scope boundary.** CSP headers (Tier 1), iframe sandboxing (Tier 2), container isolation (Tier 3).

**Extension media budgets (W10 — Phase 3).** Extensions declare media capabilities in manifests. `TRANSFORM_MEDIA` budgeted separately from `FETCH_MEDIA_*`. AI-generated media carries provenance. Embed system matures: extension-provided embed sources can join the allowlist with per-extension CSP isolation and accessibility requirements.

#### Developer Onboarding

- **Reference extensions.** Two complete examples: SEO analyzer (content-enhancement) and AI content summarizer (ai-content-generation). Full lifecycle. Documentation and integration test. FBD-DX1.
- **Local dev mode.** `loopctl dev` — minimal constellation, relaxed enforcement, instant feedback. Same contracts as production. Two-minute setup.
- **Budget intersection matrix.** Precomputed table + `loopctl budget-check --classes x,y`. Know the intersection before writing code.

#### Extension Lifecycle Management

- **Dependency manifest.** Version ranges. Vulnerability advisory integration (manual → OSV/GitHub Advisory DB).
- **Re-admission trigger.** Monthly re-evaluation. Budget tightening → grace period + notification. Output to Proof Vault.
- **Health dashboard.** `loopctl extensions status` — last update, health, compliance, media usage. It's a Content Surface.

#### Deliverables

- Standard amendment: manifest format (with liability declaration), budget schema (AI + media), extension spec declaration, installation pipeline, embed accessibility
- Admission gate, installation pipeline, AI provenance schema
- Deployment tool v3: extension provisioning, platform isolation, media budgets
- Reference extensions, local dev mode, budget matrix
- Extension lifecycle management
- Running demo: CMS with admin UI, surfaces, tenants, media, and a sandboxed AI content generator

**Verification gate:** The ReferenceError demo — AI tries to access user data, gets told the concept doesn't exist. AI tries `FETCH_MEDIA_FULL` with a `FETCH_MEDIA_METADATA` budget — ReferenceError. OVER-DECLARED manifest → specific violations named. `loopctl dev` → reference extension lifecycle in two minutes. `loopctl budget-check` → intersection printed. Extension manifest missing `liabilityDeclaration` → admission refused with reason.

**What this phase proves:** The admission model works for extensions and AI, with media budgets. The ReferenceError boundary is real. Developer onboarding is two minutes. Liability is allocated by declaration.

---

### Phase 4 — The Safety Net

*Margaux: "Installing the undo button."*

**What ships:** Constellation Rewind, complete Proof Mode, and media-safe rewind.

#### Constellation Rewind (W7)

Spec Version Store (append-only), compatibility checker (including media contracts), Rewind pipeline (validate → check → snapshot → apply → redeploy → verify → activate), Rewind Log → Proof Vault.

**The critical property:** Rewind works because content and media are topology-independent. Vaults hold data. Media Loops hold media. The spec declares topology. Rewind rolls back topology. Content and media survive. The Vault/Loop separation is the load-bearing property.

**Media in rewind (W10 — Phase 4).** Media references are topology-independent. Rewind changes which surfaces can access which media contracts, not the media itself. Compatibility checker validates media contract references. Transform cache invalidation on rewind. Media binaries never deleted by rewind.

#### Complete Proof Mode

The Proof Vault now contains: startup + periodic verification logs, spec diffs, extension admissions, AI provenance, media ingress records, embed allowlist changes, rewind operations. The Security Manifest covers surfaces, tenants, extensions, AI agents, media capabilities. Full forensic history. The evidence API serves the complete audit trail.

#### Deliverables

- Spec Vault, compatibility checker, Rewind pipeline with media cache invalidation
- Deployment tool v4: historical spec derivation
- Complete Proof Mode: full forensic trail

**Verification gate:** Deploy with surfaces, tenants, media, extension. Rewind to pre-extension spec. Extension topology removed, content preserved, media preserved, transform cache invalidated, self-verification passes. Proof Vault logs the rewind with diff, compatibility check, and post-rewind verification.

**What this phase proves:** Architectural rollback is safe when content, media, and topology are independent. The forensic trail is complete.

---

### Phase 5 — Operational Maturity

*Margaux: "Hardening the building."*

**What ships:** Ephemeral exceptions, structural verifier with accessible topology map, and Tier 3 support.

#### Ephemeral Exceptions (W8)

Exception overlays for the deployment tool. CLI for temporary connections with required TTL. Auto-revoke. Audit log. The closure wall rebuilds on every deploy.

#### Structural Verifier (W9)

Distributed verification for Tier 3. Attenuated topology-only capability. Clock schedule. Checks all declared connections, catches undeclared connections, verifies storage permissions and Media Loop backing store. Failures emit `INTEGRITY_FAILURE` on Signal Bus.

**Topology map with text equivalent (Lens RCR P4-F2).** The visual topology map shows the closure wall, media flows, surface boundaries. The text equivalent generates a parallel structured description: components, connections, surface assignments, verification status. Screen reader consumes text topology. Sighted user consumes visual topology. Same data, two projections. McMaster has technical drawings *and* specification tables.

#### Deliverables

- Exception overlay format and CLI
- Structural verifier with `INTEGRITY_FAILURE` alerting
- Topology map: visual + text equivalent (accessible)
- Deployment tool v5: Tier 3, exception overlays, multi-CDN media

**Verification gate:** Deploy at Tier 3. Exception with 1hr TTL → connection exists → wait → connection gone. Undeclared connection → `INTEGRITY_FAILURE`. Topology map visual renders correctly. Topology map text equivalent contains identical information. Screen reader navigates the text topology successfully.

**What this phase proves:** The closure wall is maintainable at scale. Drift is detectable. The system is accessible at every layer.

---

## Section 4 — The Phase Map

| Phase | Name | Key Additions in v1.3 | Effort | Produces |
|-------|------|----------------------|--------|----------|
| 0 | Foundation | Locale dimension, bounded security language | S | Spec, docs, DX spec |
| 1 | Surfaces | Admin UI (WCAG 2.2 AA), publishing workflow, eager transforms, embed accessibility | XL | Running CMS an editor can use |
| 2 | Walls | Incremental spec operations, compliance integration | L | Enterprise MVP at scale |
| 3 | Gate | Extension liability declaration, dev onboarding, lifecycle mgmt | XL | Extensible CMS with ecosystem |
| 4 | Safety Net | Media-safe rewind | M | Undo button, forensic trail |
| 5 | Maturity | Accessible topology map | L | Tier 3, operational hardening |

**Threading:** Deployment tool (v1→v5). Proof Mode (Phases 1–4). Media (Phases 1–4). Admin UI (Phase 1 → extends at Phase 2 with tenant selector → extends at Phase 3 with extension management). Publishing workflow (Phase 1 → extends with scheduled publishing rules per phase). Accessibility (Phase 1 gate → text equivalents through Phase 5).

---

## Section 5 — What the Plan Produces at Each Phase

| Phase | Demo | Buyer Conversation |
|-------|------|-------------------|
| 1 | Editor writes article, uploads photo, previews on public surface, hits Publish. Content appears. Draft never visible. EXIF stripped. YouTube sandboxed with captions. | "Your editor wrote an article and published it in three clicks. The public site never knew the draft existed. The photo is clean. The embed is sandboxed. Migrate from Contentful in one command." |
| 2 | Multi-tenant with Proof Endpoint and SOC 2 evidence package. Incremental operations at scale. | "Tenant isolation at the database level. Independently verified. SOC 2 evidence in one API call. Scales to 500 tenants." |
| 3 | Extension + AI sandbox with ReferenceError. Built and tested locally in 2 minutes. Liability declared. | "Install AI without risk. Build extensions in two minutes. The developer's liability is declared in the manifest." |
| 4 | Constellation Rewind: install, break, undo. Content, media untouched. | "Undo the architecture. Content and media untouched." |
| 5 | Topology map — visual and text — showing the closure wall at Tier 3. | "Your security model, live, inspectable, accessible, verified every hour." |

**Renata:** The cumulative pitch: "A CMS where editors publish in three clicks, the API shapes what each consumer can ask about content and media, tenant isolation is proven at the database level and independently verified, extensions and AI operate in a structural sandbox with declared liability, media is stripped clean and transforms are instant, embeds are sandboxed with captions preserved, the compliance evidence is one API call, the architecture has an undo button, it handles twelve languages and RTL natively, every interface meets WCAG 2.2 AA, and you can migrate from Contentful in one command."

---

## Section 6 — Cross-Cutting Concerns

Four concerns. Each stated once.

### The Information-Theoretic Bound

Capability attenuation constrains access, not inference. Aggregates leak. Timing leaks. Media metadata leaks. The Security Manifest's scope declaration bounds the claim. Structural access control ≠ differential privacy. Research-class, not engineering-class.

### Developer Experience

The capability model adds friction. DX tooling is load-bearing: CLI generators, local dev mode, educational error messages, reference extensions, budget matrices. The fortress must be one people want to live in.

### The Phase 0 Risk

Everything builds on the capability model. Including locale. Including media contracts. The Super RCR on the spec amendment is the most consequential review in the plan.

### Media as Architectural Citizen

Media is not a bolt-on. It's a content type that every mechanism handles: surfaces scope it, tenants isolate it, budgets constrain it, Proof Mode verifies it, Rewind preserves it, the embed system extends the closure wall to external providers, eager transforms eliminate cold caches, request coalescing prevents thundering herds. The media system's self-similarity with the content system validates the capability model's generality.

---

## Section 7 — Risks

**Ed:** Fourteen risks. Each real. None fatal.

**Risk 1 — Complexity accumulation.** The spec declares everything — loops, contracts, surfaces, media, embeds, tenants, extensions, budgets, locales, publishing workflows, rewind config. Mitigation: the deployment tool and CLI absorb complexity. `loopctl dev` proves the developer interaction is simple even when the spec is rich. The admin UI proves the editor interaction is simpler still.

**Risk 2 — Market education.** The product speaks business, not architecture. "Your editor publishes in three clicks" not "the Bus Workflow transitions content state." Dual pitch tracks: feature-first for content teams, security-first for enterprise.

**Risk 3 — Tier 1 viability.** Tier 1 gets the closure wall through the scope chain, Content Surface declarations, media via local filesystem, and a simplified admin UI. Same spec, different enforcement.

**Risk 4 — Phase coupling.** Critical path has no slack. Phase 5 absorbs capacity during delays.

**Risk 5 — Phase 0 scope.** The spec amendment now carries locale, media contracts, and bounded security language alongside confinement/attenuation/revocation. More surface area = more review cycles. Mitigation: still spec-only, no code, parallel product-shell work absorbs wait time.

**Risk 6 — Time-to-parity.** Differentiation, not parity. The Phase 2 MVP occupies a market position no incumbent holds.

**Risk 7 — Multi-class budget edge cases.** Intersective model + precomputed matrix + educational refusal.

**Risk 8 — Proof Vault as liability.** Documentation concern. Default off. Clear explanation of what turning it on means.

**Risk 9 — Media storage cost at scale.** Transform caching is bounded (LRU). Eager generation bounded to declared standard variants. Garbage collection on schedule. Per-tenant quotas.

**Risk 10 — Embed security drift.** Allowlist is static; providers change behavior. Mitigation: CSP + sandbox are enforcement, not the allowlist alone. Periodic review in operational runbook.

**Risk 11 — Migration tooling maintenance.** JSON is universal fallback. Contentful translator is reference implementation. Community translators are Phase 3+ ecosystem opportunity.

**Risk 12 — Admin UI scope creep (Parallax 3).** The admin UI is "five Walkman buttons," not WordPress. The temptation to build a full CMS admin with plugins, dashboards, analytics, and theme editors is real. Mitigation: the admin UI is a Presentation Loop. Its features are bounded by the editorial Content Surface's contract vocabulary. It can't do more than the surface permits. The architecture constrains the scope. FBD-UI1.

**Risk 13 — Security claim litigation (Parallax 3).** Bounded language + scope declaration + two-column disclosure. The marketing claim matches the technical guarantee. "Water resistant" not "waterproof."

**Risk 14 — Localization complexity (Parallax 3).** Two models (surface-level, field-level) add a decision point at Phase 0. Mitigation: both use the same capability infrastructure. The operator's `localeStrategy` declaration chooses. The capability model carries both. The decision is per-constellation, not per-platform.

---

## Section 8 — Four Corners

**FBD (Floor).** Nine named controls. FBD-MD1 (media ingress before commit), FBD-MV1 (dual-channel manifest verification), FBD-MG1 (translator validates against deployment tool), FBD-DX1 (reference extensions are integration tests), FBD-OP1 (deployment includes monitoring config), FBD-AC1 (admin UI WCAG 2.2 AA gate), FBD-UI1 (admin UI scope bounded by surface contracts), plus deployment tool verifier and admission gate educational refusal. The floor is structural enforcement at every layer, for text and media, from the capability model through the checkout counter.

**FWW(C) (Ceiling).** The grocery store now has a checkout counter, a produce section, an international food aisle, and wheelchair ramps. Margaux's phase names carry the story. The demos are visceral — an editor publishes in three clicks and doesn't know the architecture exists. The ReferenceError. The one-URL audit. The undo button. The EXIF-stripped photo. The sandboxed YouTube embed with captions. The two-minute local dev setup. The Walkman has five buttons and plays in the rain.

**STP (Show the Path).** Three source documents, three Parallax passes, one Super RCR with Super Frame, one lens RCR. Every finding has a disposition. Every phase traces to dependencies, verification gates, and demo scripts. Fourteen risks with mitigations. Full attribution. The path from "these three documents overlap" to "here's the build order for a CMS that handles content, media, embeds, localization, accessibility, multi-tenancy, extensions, AI, and compliance — with an editor UI and an undo button" is documented at every step.

**SNR (Signal-to-Noise).** The plan sequences. The source documents specify. Media stated once architecturally, threaded by reference. Localization stated once as a dimension, provisioned through existing surface machinery. The admin UI stated once as an architectural proof, not re-described at every phase. Accessibility stated once as a gate, not re-justified at every checkpoint.

---

## Section 9 — FBD Control Registry

| Control | Gate | Description |
|---------|------|-------------|
| FBD-MD1 | Phase 1 | Media ingress validation before `STORE_MEDIA` commits |
| FBD-MV1 | Phase 1 | Dual-channel manifest verification; two independent projections must agree |
| FBD-MG1 | Phase 1 | Translator output must pass deployment tool validator |
| FBD-DX1 | Phase 3 | Reference extensions are integration tests for `loopctl dev` |
| FBD-OP1 | Phase 1 | Deployment output includes monitoring config |
| FBD-AC1 | Phase 1 | Admin UI WCAG 2.2 AA verification gate — Phase 1 doesn't ship without it |
| FBD-UI1 | Phase 1+ | Admin UI scope bounded by editorial surface contracts — can't exceed surface permissions |

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

*Bev recorded. Leroy held position. Geoff was not present.*

---

## Source Document Reference

| Document | Version | Scope |
|----------|---------|-------|
| Distributed Closure Wall Plan | v1.2 | 5 layers — capability model through structural verifier |
| CMS Capability Gaps Plan | v1.1 | 3 gaps — draft/published, multi-tenant, extension admission |
| CMS Novel Capabilities Report | v1 | 4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind |

All three remain canonical for implementation detail. This plan governs sequencing and scope.

---

## Findings Register

### Parallax 1 — 9 findings, all incorporated
### Parallax 2 — 8 findings, all incorporated
### Super RCR — 6 media findings, all incorporated
### Parallax 3 — 8 findings, all incorporated
### Lens RCR — 8 resolutions, all incorporated

**Total: 39 findings across 5 review passes. 39 incorporated. 0 outstanding.**

---

[PULSE] Master CMS Implementation Plan v1.3: Three Parallax passes (12 angles, 25 findings). One Super RCR (9 items, 6 media findings). One Lens RCR (3 lenses, 8 resolutions). 39 total findings, 39 incorporated. 10 workstreams. 6 phases. 14 risks. 4 cross-cutting concerns. 7 FBD controls. Admin UI, publishing workflow, localization, accessibility, incremental operations, eager transforms, bounded security claims, extension liability — all integrated.

[DRIVES: Floor, Ceiling, Depth, Mesh, Ground, Equalization, Constraint — 7/7]

---

*Loop MMT™ · Multi-Module Theory · CMS Master Implementation Plan v1.3*
*Three Parallax passes. One Super RCR with Super Frame. One Lens RCR.*
*Lenses: Rugged Sony Walkman · F1 Racing Operations · McMaster-Carr*
*39 findings. 39 incorporated. The grocery store has a checkout counter.*
*© 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0*
