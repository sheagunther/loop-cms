# Loop MMT CMS — Master Implementation Plan v1.2
## Loop MMT™ · Loop World | Shrubbery · 21 April 2026

---

## About This Document

*[Section Type: Plan]*

***Evidence status: Nothing in this plan has been implemented or tested. Every mechanism described is architectural. The capability model, the closure wall extensions, the content surfaces, the extension admission model, the media system, and all four novel capabilities are design artifacts. The CMS described in this plan does not exist.***

This document consolidates three CMS architectural plans and two Parallax passes into a single implementation sequence:

- **Distributed Closure Wall Plan v1.2** (5 layers — capability model, deployment tool, ephemeral exceptions, storage enforcement, structural verifier)
- **CMS Capability Gaps Plan v1.1** (3 gaps — draft/published boundary, multi-tenant isolation, extension admission model)
- **CMS Novel Capabilities Report v1** (4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind)
- **Parallax Pass 1** (4 angles — Builder, Incumbent, Investor, Operator-at-Phase-3; 9 findings, 4 HIGH incorporated into v1.1)
- **Parallax Pass 2** (4 angles — Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer; 8 findings, 4 HIGH)
- **Super RCR** (9 items resolved — 8 Parallax 2 findings + media handling gap; 5 workstreams produced)

The three source documents share a single architectural foundation (the capability model), contain overlapping workstreams that collapse under analysis, and have cross-dependencies that constrain their build order. This plan resolves the overlaps, maps the dependencies, and produces a six-phase implementation sequence where each phase proves the mechanism the next phase needs.

**Provenance.** Heavy RCR on sequencing, 21 April 2026. Dara chaired. Eleven takes, two passes. Five collisions (two challenges, three builds). Sol identified the collapse (twelve workstreams → nine). Nyx repositioned Proof Mode as early infrastructure. Wes merged the deployment tool with storage enforcement. Graham threaded the deployment tool as evolving infrastructure rather than a single-phase deliverable. Kira aligned demo scripts with verification gates. Margaux named the phases. Resolution: convergence after collision. Parallax Pass 1 (Builder, Incumbent, Investor, Operator-at-Phase-3): nine findings, four HIGH incorporated into v1.1. Parallax Pass 2 (Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer): eight findings, four HIGH. Super RCR resolved all eight Parallax 2 findings plus the media handling gap — five new workstreams (Developer Onboarding, Migration, Operations, Compliance Hardening, Media) integrated into existing phase structure. Super Frame on media handling (six lenses: Structural, Information-Theoretic, Commercial, Operational, Security, Fractal/Boundary).

**Resource model assumption.** This plan assumes AI-assisted solo development (one operator with AI tooling), consistent with Loop MMT's current development model. Phase 0's parallel tracks (spec + product shell) run as sequential sub-phases under this model. A small team (3–5 people) would parallelize Phase 0's tracks and could begin Phase 5 during Phase 2. The critical path (Phases 0 → 1 → 2 → 3 → 4) is team-size-invariant — the dependencies are architectural, not resourcing.

**What this plan replaces.** The three source documents remain as detailed specifications. This plan does not reproduce their implementation details — it sequences them, resolves their overlaps, and provides the single build order a development team would follow. For the mechanism behind any specific feature, read the source document.

**The grocery store (extended).** Chen Wei's grocery store metaphor carries the whole plan. Phase 0 is getting the building permits and architectural drawings. Phase 1 is installing the stockroom door, building the shelf system, stocking the first products, and building the loading dock for supplier deliveries — the store's fundamental interior structure. Phase 2 is assigning tenants their own sections of shelf space and installing the security cameras in each section. Phase 3 is building the receiving dock and the supplier inspection system. Phase 4 is installing the undo button and the complete security audit trail. Phase 5 is hardening the building for the next scale of operations.

---

## Section 1 — The Collapse

**Sol:** The three source documents contain twelve named workstreams. Under dependency analysis, twelve collapses to nine. The media system adds W10 as a threading dimension (like Proof Mode — it runs through every phase rather than occupying a single phase).

**Collapse 1: Content Surfaces absorbs Gap 1 (Draft/Published).**

Gap 1 is a two-surface system: one editorial surface with full content access, one public surface limited to published content. Content Surfaces is the general-case N-surface system where each consumer gets a named, capability-scoped view of the content corpus. Building Content Surfaces gives you Gap 1 as the first test case — the public/editorial split is just the simplest surface declaration. Building Gap 1 alone gives you a special case that you'd generalize later anyway. Build the general case. Get the special case for free.

**Collapse 2: AI Sandbox merges with Gap 3 (Extension Admission).**

AI Sandbox is the extension admission model applied to AI agents with AI-specific budget classes. The admission gate, the manifest format, the capability budgets, the closure wall enforcement, and the installation pipeline are identical. The only addition is the `aiSpecific` block in the budget schema (data retention policy, PII exposure level, output review requirement) and the content provenance metadata. Building extension admission with AI budget classes from the start produces one system, not two. Building extension admission first and bolting AI budgets on later means revisiting the budget schema.

**Post-collapse workstream inventory (ten units):**

| # | Workstream | Source | Absorbed / Notes |
|---|-----------|--------|------------------|
| W1 | Capability Model (L1) | v1.2 | — |
| W2 | Deployment Tool + Storage Enforcement (L2+L4) | v1.2 | L4 merged into L2 |
| W3 | Content Surfaces | Novel Capabilities | Gap 1 absorbed |
| W4 | Proof Mode | Novel Capabilities | — |
| W5 | Multi-Tenant Isolation (Gap 2) | v1.1 | — |
| W6 | Extension Admission + AI Sandbox | v1.1 + Novel | Gap 3 + AI Sandbox merged |
| W7 | Constellation Rewind | Novel Capabilities | — |
| W8 | Ephemeral Exceptions (L3) | v1.2 | — |
| W9 | Structural Verifier (L5) | v1.2 | — |
| W10 | Media System | Super RCR | Threading dimension (Phases 1–4) |

Three workstreams absorbed. Ten remain. W10 threads through phases like W4 (Proof Mode) — it doesn't occupy a single phase. The dependency graph determines the build order.

---

## Section 2 — The Dependency Graph

**Dara:** Every arrow means "cannot ship without." No arrow means "can ship independently."

```
W1 (Capability Model)
 ├──→ W2 (Deployment Tool + Storage)
 │     ├──→ W8 (Ephemeral Exceptions)
 │     └──→ W9 (Structural Verifier)
 ├──→ W3 (Content Surfaces)
 │     ├──→ W4 (Proof Mode)
 │     │     ├──→ W7 (Constellation Rewind)
 │     │     └──→ W6 (Extension + AI Sandbox) [also depends on W5]
 │     └──→ W5 (Multi-Tenant)
 │           └──→ W6 (Extension + AI Sandbox)
 ├──→ W4 (Proof Mode) [partial — can start after W1, full after W3]
 └──→ W10 (Media System) [partial — media contracts need W1, full threading through W3–W7]
```

**Critical path:** W1 → W3 → W5 → W6. Four sequential phases on the longest dependency chain. W2 runs parallel to W3. W4 starts after W1, matures through each subsequent phase. W10 starts after W1, threads through all subsequent phases. W7, W8, W9 are terminal — nothing depends on them.

**Nyx:** Proof Mode has a split dependency. The Verification Log and append-only Proof Vault can be built after W1 — they're infrastructure that captures self-verification output, and self-verification already exists. The Security Manifest needs Content Surfaces (W3) to be meaningful — surface declarations are part of the manifest. Build the log infrastructure early (after W1), build the manifest generation after W3. Proof Mode threads through the build, accumulating capability at each phase.

**Graham:** The Deployment Tool (W2) similarly threads. Phase 0: spec only. Phase 1: the tool outputs Tier 2 Docker Compose with storage enforcement baked in. Each subsequent phase extends the tool's input vocabulary (surfaces, tenant declarations, extension manifests) and output capabilities. The tool doesn't ship once — it evolves. The Media System (W10) follows the same threading pattern — media contracts and the Media Loop appear at Phase 1, media tenant scoping at Phase 2, media extension budgets at Phase 3, media in rewind at Phase 4.

---

## Section 3 — The Six Phases

### Phase 0 — The Foundation

*Margaux: "Getting the permits."*

**What ships:** The capability model spec amendment and the product shell.

**Spec track (Chen Wei):** Standard amendment defining confinement, attenuation, and revocation as properties of the contract system. This is W1 — the single prerequisite for everything in the plan. The amendment either extends Standard Section 5 (Boundary Enforcement) or adds a new Section 16 (Capability Model). One session of document production.

**Product track (Vee, Renata, parallel):** While the spec is being written, the product shell is built: security model diagram format, developer documentation framework, extension developer guide skeleton, CLI command structure. Zero dependencies on the spec. The product shell is ready when the spec ships, so the first feature phase has somewhere to land its documentation.

**Deliverables:**
- Standard amendment: Capability Model (confinement, attenuation, revocation)
- Product documentation framework
- Security model diagram format specification
- Developer guide skeleton
- DX specification: `loopctl` CLI command structure per phase, extension developer guide outline, manifest template generator spec, local development mode specification (Parallax P1-F2)

**Verification gate:** The spec amendment passes a Super RCR before shipping. This is the API that everything builds on. The cost of a mistake here propagates to every subsequent phase.

**What this phase proves:** The bus contract system can carry capability semantics. Confinement, attenuation, and revocation are expressible as contract properties.

---

### Phase 1 — The Surfaces

*Margaux: "Building the shelves and stocking the first products."*

**What ships:** Content Surfaces, the deployment tool (v1), Proof Mode infrastructure, Media Loop, migration tooling, operational runbook, and the first running CMS demo.

**Content Surfaces (Sol, Graham, Sable):** The surface declaration schema, the aggregate and metadata contract types, the surface-to-loop mapping in the constellation spec, and the self-verification extension. This is W3, which absorbs Gap 1. The draft/published split is the first test case — a two-surface constellation (public and editorial) where the public surface structurally cannot query draft content. Then the analytics and recommendation surfaces prove the general case.

Implementation detail lives in the Novel Capabilities Report §2 and Gaps Plan v1.1 §2. The spec amendment adds: surface declarations to the constellation spec grammar, `FETCH_CONTENT_AGGREGATE` and `FETCH_CONTENT_METADATA` contract types, surface-to-loop factory wiring in the constellation initializer, and a self-verification check that each loop holds only its assigned surface's contracts.

**Deployment Tool v1 (Graham, Dara):** The first version of the deployment tool. Reads a constellation spec with surface declarations, outputs Docker Compose (Tier 2). Storage enforcement (L4) is baked in — non-Vault loops get ephemeral storage, Vault loops get persistent volumes. The tool is a translator: spec in, deployment config out. Deterministic. Idempotent. Re-derives on every deploy.

**Deployment tool architecture (Parallax P1-F1).** The tool is the single largest engineering artifact in the plan — it threads through all six phases and evolves five times. Its architecture must support extension without refactoring. Four components: (1) **Parser** — reads the constellation spec grammar, validates structure, produces an intermediate representation (IR). The IR is the extension point — each phase adds new IR node types (surfaces in v1, tenant declarations in v2, extension manifests in v3, spec version references in v4, exception overlays in v5). The parser also handles import source plugins (JSON, CSV, Contentful export files) — same component, different input grammars. (2) **Validator** — checks the IR against the capability model constraints. Surfaces reference valid contracts. Tenant declarations reference valid Auth Gate configuration. Extensions don't exceed budgets. (3) **Generator** — translates the validated IR into deployment artifacts. Two output targets initially: Docker Compose (Tier 2) and service mesh manifest (Tier 3, added at v5). Each generator is a pluggable backend. (4) **Verifier** — compares the generated output against the IR to confirm nothing was dropped or added in translation. The tool tests its own output. A deployment tool refactoring gate fires between Phase 2 and Phase 3 (Parallax P4-F3) — the tool's architecture is reviewed before the input vocabulary expands from infrastructure declarations (surfaces, tenants) to ecosystem declarations (extensions, manifests, budgets).

**Media Loop (W10 — Phase 1 slice):** A specialized Vault Loop with pluggable backing store (local filesystem at Tier 1, S3/compatible object store at Tier 2, multi-CDN at Tier 3). The Media Loop holds binaries, metadata, and references. Five media contracts ship at Phase 1:

- `STORE_MEDIA` — ingest media with mandatory ingress security pipeline (magic-byte validation, SVG sanitization, EXIF stripping, size/dimension caps). Validated before commit. FBD-MD1.
- `FETCH_MEDIA_PUBLIC` — retrieve public, metadata-stripped, optionally transformed media.
- `FETCH_MEDIA_FULL` — retrieve any media with full metadata (editorial surface only).
- `FETCH_MEDIA_METADATA` — retrieve media metadata without binaries (tags, dimensions, format, creation date — no EXIF, no GPS, no camera identifiers).
- `TRANSFORM_MEDIA` — resize, format conversion, crop. Runs in a Compute Loop. Outputs cached. The transform pipeline includes metadata sanitization — all EXIF data stripped before any media crosses a surface boundary.

Media contracts scope to Content Surfaces like all contracts: the public surface gets `FETCH_MEDIA_PUBLIC`, the editorial surface gets the full set, the analytics surface gets `FETCH_MEDIA_METADATA`. The deployment tool provisions the Media Loop's backing store alongside loop topology.

**Embed system (Phase 1 stub).** Embed declarations in the constellation spec with an allowlist and per-provider CSP policy. Content editors insert embed URLs; the ingestion pipeline validates against the allowlist. Denied URLs are rejected at content ingestion with an educational message ("Embed provider [x] is not in the constellation's embed allowlist. Add it to the spec or use a permitted provider."). Initial allowlist providers: YouTube, Vimeo, CodePen, Twitter/X. Provider isolation via `sandbox` and `csp` attributes per provider entry:

```
embeds: {
  allowlist: ['youtube.com', 'vimeo.com', 'twitter.com', 'codepen.io'],
  isolation: {
    'youtube.com': { csp: "frame-src https://www.youtube.com", sandbox: 'allow-scripts allow-same-origin' },
    'vimeo.com': { csp: "frame-src https://player.vimeo.com", sandbox: 'allow-scripts' }
  },
  default: 'deny'
}
```

**Proof Mode infrastructure (Nyx, Dara):** The Verification Log schema, the append-only Proof Vault, and the log-capture mechanism. Self-verification output from this phase onward goes into the Proof Vault. The Security Manifest generator is stubbed — it produces a partial manifest covering surface declarations. Full manifest generation comes in Phase 2+ as more declaration types exist.

**Independent manifest verifier (Parallax 2 P4-F1).** A second Compute Loop that reads the constellation spec directly and produces its own security projection. The two projections (manifest generator output vs. verifier output) are compared at every verification cycle. Agreement → the manifest is attested. Disagreement → the specific fields that differ are flagged, the manifest is not served until resolved. Dual-channel verification: two independent code paths, same inputs, outputs must agree. FBD-MV1.

**Proof Vault retention policy (Parallax P4-F2).** The Proof Vault is append-only but not unbounded. The Data Gates system (Standard Section 4) governs retention. The Proof Vault declares a configurable retention policy with jurisdiction-aware defaults: 1 year active / 5 years archived (SOC 2 baseline), 6 years active / 10 years archived (HIPAA), 7 years active (financial regulatory). Startup and periodic verification entries compact after active retention — individual check results aggregate into daily summaries. Spec change diffs, extension admission records, and rewind logs are never compacted (they're the forensic trail). The operator declares the retention profile in the constellation spec's `proofMode` block.

**Migration tooling (Parallax 2 P2-F1, P2-F2).** Ships at Phase 1 because the Phase 1 demo requires content and the Phase 2 revenue gate requires customers.

- **`loopctl import`** — content import pipeline. Three import source plugins at launch: JSON (universal interchange), CSV (bulk tabular data), Contentful (first competitive migration path). Each plugin is a parser for the deployment tool's parser component — same architecture, different input grammars. Pipeline: parse source → validate against constellation spec contracts → transform to Vault schema → load into Media Loop (binaries) + Content Vault (structured data) → verify import integrity.
- **`loopctl translate --from contentful`** — content model translator. Reads a Contentful export JSON, outputs a draft constellation spec. Content types → contract schemas. Roles → surface declarations. Webhooks → bus subscriptions. Asset references → Media Loop references. The translator produces a starting point, not a finished spec — it translates 80% automatically and documents the 20% that needs human judgment. FBD-MG1: the translator's output must pass the deployment tool's validator. If it doesn't, the translator is broken.

**Operational runbook (Parallax 2 P3-F1).** Ships with the deployment tool because operations begin when the first deployment happens.

- **Deployment lifecycle:** When to re-derive (every spec change), how to validate before deploying (the Verifier component), how to roll back pre-Constellation-Rewind (revert the spec change and re-derive — the deployment tool is deterministic).
- **Monitoring:** Self-verification failures emit structured JSON log events (parseable by any log aggregator — Datadog, Grafana Loki, ELK). What to watch: verification cycle pass/fail rate, verification duration (degradation signals growing complexity), Proof Vault size.
- **Incident response:** Self-verification failure → structured log event → alert (Phase 1: log-based; Phase 2: webhook; Phase 5: Signal Bus) → diagnosis checklist (spec drift? deployment mismatch? storage corruption?) → resolution procedure per failure type.
- **Backup/recovery:** Vault snapshots on schedule. Spec version history (informal before Phase 4 formalizes it — the operator keeps prior spec versions in version control).
- FBD-OP1: The deployment tool's output includes monitoring configuration. Deploy without alerts configured → warning (not block).

**Deliverables:**
- Standard amendment: Content Surface schema, aggregate/metadata contracts, surface-to-loop mapping
- Standard amendment: Media contracts (STORE, FETCH_PUBLIC, FETCH_FULL, FETCH_METADATA, TRANSFORM), embed declaration schema
- Deployment tool v1: constellation spec → Docker Compose, with storage enforcement + media provisioning
- Media Loop with ingress security pipeline
- Proof Vault + Verification Log infrastructure + independent manifest verifier
- Migration tooling: `loopctl import` (JSON, CSV, Contentful) + `loopctl translate --from contentful`
- Operational runbook v1
- Running demo: two-surface CMS (public/editorial) with draft/published isolation, images, and imported content

**Verification gate:** Deploy a two-surface constellation at Tier 2. From the public Presentation Loop, attempt to form a query for draft content. Confirm: the contract does not exist in scope — not denied, absent. From the analytics Compute Loop, attempt to pull individual content records via `FETCH_CONTENT_FULL`. Confirm: same result. Upload an image through the editorial surface — confirm EXIF stripped on ingress. Fetch the image from the public surface — confirm metadata-sanitized output. Upload an SVG with an embedded `<script>` tag — confirm sanitization. Insert a YouTube embed URL — confirm rendered with sandbox isolation. Insert an embed URL from an unlisted provider — confirm rejection at ingestion. Check the Verification Log — the startup integrity check is recorded. Check the deployment — non-Vault loops have no persistent storage. Run `loopctl import` with a Contentful export — confirm content and media imported. Run `loopctl translate` on the same export — confirm the output passes the deployment tool's validator.

**Kira:** This is the first sales demo. "The public site doesn't filter out your drafts. It doesn't know they exist. Your images are stripped of metadata before they leave the editorial surface. Migrate from Contentful in one command." Three sentences. All demonstrable.

**What this phase proves:** Contract-vocabulary-as-boundary works for text and media. The deployment tool can derive topology from spec. The Proof Vault can capture verification output. Capability attenuation is real at Tier 2. Content can be imported from external CMSes. The operational story starts on day one.

---

### Phase 2 — The Walls

*Margaux: "Assigning the aisles."*

**What ships:** Multi-tenant isolation, a maturing Proof Mode with compliance integrations, and tenant-scoped media.

**Multi-Tenant Isolation (Sol, Nyx, Dara):** This is W5. Auth Gate `tenantId` stamping, tenant-scoped Vault Loop factory (RLS Path A or schema-per-tenant Path B), atomic migration runner FBD (table + RLS policy in one transaction), periodic Clock-triggered verification of tenant scoping, and constellation spec `multiTenant` declaration.

Implementation detail lives in Gaps Plan v1.1 §3. The key additions to the Standard: `tenantId` as a first-class packet field stamped by the Auth Gate, tenant-scoped database capability as a factory parameter, `multiTenant` declaration block in the constellation spec, and the migration runner's atomic table+policy creation.

**Path A guard (Nyx):** The tenant-scoped connection wrapper intercepts and refuses `SET` calls on the `app.current_tenant` session variable. The attenuated database capability grants query access but not scope-change access. Per Parallax finding P1-F2 from the v1.1 plan.

**Deployment Tool v2 (Graham):** The tool now reads `multiTenant` declarations and provisions accordingly — RLS policies for Path A, separate schemas for Path B. Storage enforcement carries forward from v1. Media Loop provisioning includes tenant-scoped namespaces and per-tenant storage quotas.

**Tenant-scoped media (W10 — Phase 2 slice).** Media Loop namespaces per tenant. Per-tenant storage quotas declared in the constellation spec's `multiTenant.media` block. Media garbage collection for unreferenced media after content deletion. CDN purge integration (when source media updates, cached transforms invalidate). The deployment tool provisions tenant media namespaces alongside tenant database scoping.

**Proof Mode maturation (Nyx):** The Security Manifest generator now covers surface declarations *and* tenant isolation configuration. The `cannotAccess` field in the manifest reflects tenant boundaries. The `cannotAccess` field is exhaustive within the declared capability model — it lists every contract type defined in the constellation spec that is not assigned to the component. This scope (spec vocabulary, not universe of possible accesses) is documented in the Security Manifest schema. Each self-verification cycle — startup and periodic — records tenant-scoping checks in the Proof Vault. The Diff Engine comes online: spec changes produce change records in the Verification Log.

**Proof Endpoint (Graham):** The read-only API that serves the Security Manifest and the Verification Log. A Presentation Loop with a Content Surface scoped to the Proof Vault. It can read the proof artifacts. It cannot modify them.

**Third-party compliance integration (Parallax 2 P4-F2).** Ships at Phase 2 aligned with the revenue gate:

- **Structured log format.** Verification Log entries in JSON-LD with CEF (Common Event Format) mapping. Any SIEM (Splunk, Datadog, Elastic) can ingest natively.
- **Webhook on verification events.** Configurable: all events, failures only, or spec-change events. Feeds GRC platforms (Vanta, Drata, Secureframe) directly.
- **Evidence collection API.** A read-only endpoint (extension of the Proof Endpoint) that serves packaged evidence bundles for audit cycles: all verification logs in date range, all spec changes, all extension admissions, all rewind operations. One API call produces the SOC 2 evidence package.

**Deliverables:**
- Standard amendment: multi-tenant declaration, Auth Gate tenantId, Vault Loop factory extension, migration runner FBD, periodic self-verification
- Deployment tool v2: multi-tenant provisioning (RLS or schema-per-tenant) + tenant-scoped media
- Proof Mode: Security Manifest generator (surfaces + tenants), independent manifest verifier, Diff Engine, Proof Endpoint
- Compliance integration: SIEM-compatible log format, verification webhooks, evidence collection API
- Running demo: multi-tenant CMS with two tenants, content surfaces, media, and an auditable security proof with compliance-ready output

**Verification gate:** Deploy a two-tenant constellation with content surfaces. From Tenant A's Vault Loop, execute `SELECT * FROM content` with no tenant filter — only Tenant A's rows return. Attempt to set the session variable to Tenant B's ID — the connection wrapper refuses. Upload media as Tenant A — confirm it's in Tenant A's namespace. Attempt to access Tenant B's media from Tenant A's surface — confirm: contract absent. Hit the Proof Endpoint — the Security Manifest shows surface assignments and tenant boundaries with exhaustive `cannotAccess` fields. Verify the manifest against the independent verifier — both projections agree. Modify the spec (add a surface) — the Diff Engine produces a change record. Hit the evidence collection API with a date range — confirm packaged evidence bundle returns. Forward a verification event to a webhook endpoint — confirm structured delivery.

**Renata:** This is the enterprise demo. "Tenant isolation is enforced at the database engine level. Here's the proof — independently verified. Your SOC 2 evidence package is one API call." The compliance conversation starts here.

**Revenue gate (Parallax P3-F1).** Phase 2 is where the product becomes commercially viable. A multi-tenant CMS with Content Surfaces, media handling, Proof Mode, and compliance integration is an enterprise product with a compliance story and a migration path. Phases 0–1 are pre-revenue infrastructure. Phase 2 is the enterprise MVP. Phases 3–5 are the growth roadmap. The fundraising narrative follows: pre-seed builds the foundation and first demo (Phases 0–1), seed builds the enterprise MVP (Phase 2), Series A builds the ecosystem (Phases 3–4). This framing is structural, not prescriptive — the operator decides the commercial model.

**What this phase proves:** Capability attenuation extends from content vocabulary (surfaces) to data scope (tenants) to media scope (tenant namespaces). The Proof Mode infrastructure is accumulating real evidence with independent verification. The compliance story is production-ready. The deployment tool can derive multi-tenant topology from spec.

---

### Phase 3 — The Gate

*Margaux: "Opening the receiving dock."*

**What ships:** Extension admission with AI sandbox, developer onboarding tools, extension media budgets, embed system, and a complete extensible CMS.

**Extension Admission + AI Sandbox (Ed, Graham, Nyx, Sable, Theo):** This is W6 — the merger of Gap 3 and AI Sandbox. The manifest format, the capability budgets (including AI-specific budget classes from day one), the admission gate (Compute Loop), the installation pipeline (Workflow), the self-verification extensions for installed extensions, and the extension update re-admission pipeline.

Implementation detail lives in Gaps Plan v1.1 §4 and Novel Capabilities Report §4. Built as one system with these components:

**Manifest format (Graham).** Machine-readable, validated against the constellation spec grammar. Carries extension name, version, class (including AI classes), loop declarations, bus subscriptions, storage requirements, external dependencies, and media capability requirements.

**Budget schema (Renata, Nyx).** Budget classes for standard categories (content-enhancement, payment-processing) and AI categories (ai-content-generation, ai-personalization). AI budgets include the `aiSpecific` block: data retention policy, PII exposure level, output review requirement. Media budgets are declared per class: which media contracts the class permits (`FETCH_MEDIA_PUBLIC`, `TRANSFORM_MEDIA`, etc.) and media storage quota. Budgets are declared in the host constellation spec. Published in developer documentation so extension builders know the boundaries before they start.

**Intersective budget composition (Parallax P4-F1, Sol, Nyx).** Real-world extensions don't map cleanly to single budget classes. A "content intelligence" extension that reads content, analyzes it with AI, and serves personalized recommendations spans content-enhancement and ai-personalization. The budget composition model is **intersective**: an extension declaring two budget classes gets the *intersection* of their permissions — the narrower scope on each capability dimension, including media capabilities. Content-enhancement allows `FETCH_CONTENT_PUBLIC`; ai-personalization allows `FETCH_CONTENT_METADATA`. The intersection is `FETCH_CONTENT_METADATA` — the more restrictive contract. The extension gets the tighter boundary wherever two classes' permissions overlap. The `custom` class remains as the escape valve for extensions that genuinely cannot fit standard categories — but intersective composition handles the common case of cross-cutting extensions without requiring operator judgment. The additive (union) approach was rejected: declaring more classes would accumulate permissions, creating a capability-escalation incentive that defeats the security model.

```
// Multi-class manifest example
extensionManifest: {
  name: 'content-intelligence',
  version: '1.0.0',
  classes: ['content-enhancement', 'ai-personalization'],  // multi-class
  media: { requires: ['FETCH_MEDIA_METADATA'] },           // media capabilities
  // Admission gate computes intersection:
  // - contracts: intersection of both classes' allowed contracts
  // - media: intersection of both classes' allowed media contracts
  // - storage: stricter of the two policies
  // - externalDependencies: lower of the two maximums
}
```

**Admission gate (Graham, Sable).** A Compute Loop that compares the manifest against the budget. ADMITTED or OVER-DECLARED with specific violations named. The OVER-DECLARED response is the product — it tells the developer exactly what to fix.

**Installation pipeline (Dara).** Six-step Workflow: validate manifest → admission gate → spec merge → deployment re-derive → self-verify → activate. Each step has a failure strategy. The pipeline is the receiving dock — every extension, every time, no exceptions.

**AI audit trail (Dara).** AI-generated content carries provenance metadata through the publishing pipeline: which extension, what budget class, what input consumed, what output produced. AI-generated media carries the same provenance (which model, what prompt, what parameters). The provenance feeds the Proof Vault.

**Scope boundary — ambient platform capabilities (Nyx).** Per Parallax finding P1-F1: the closure wall governs what the factory gives but not what the browser has. Three-tier mitigation: CSP headers (Tier 1), iframe sandboxing (Tier 2), container isolation (Tier 3). The constellation spec declares the platform-isolation requirements for each extension class alongside its capability budget.

**Extension media budgets (W10 — Phase 3 slice).** Extensions declare media capability requirements in their manifest. `TRANSFORM_MEDIA` is a separate budget item from `FETCH_MEDIA_*` — an extension can read public media without being able to transform it. AI-generated media carries provenance metadata. The admission gate checks media capabilities against the budget class intersection. The embed system matures: extension-provided embed sources can be added to the constellation's embed allowlist with per-extension CSP isolation.

**Deployment Tool v3 (Graham).** The tool now reads extension manifests, provisions extension loops with budget-scoped capabilities (including media capabilities), applies platform-isolation requirements (CSP headers, iframe sandbox attributes), and re-derives topology on extension install.

**Proof Mode maturation (Nyx).** The Security Manifest now covers surfaces, tenants, and extensions. Each extension's admission, budget class, media capabilities, and runtime capabilities appear in the manifest. AI extensions' provenance trails feed the Verification Log. The independent manifest verifier covers all three declaration types.

**Developer onboarding (Parallax 2 P1-F1, P1-F2).** Ships with Phase 3:

- **Reference extensions.** Two complete, documented, working examples. (1) A content-enhancement extension (SEO analyzer) — reads content metadata, produces SEO recommendations. (2) An AI extension (content summarizer) — reads content via `FETCH_CONTENT_METADATA`, generates summaries. Both exercise the full lifecycle from `loopctl init-extension` to running in a sandbox. Small enough to read in 20 minutes. Both documentation and integration test — if the reference extension can't complete the lifecycle, the platform is broken. FBD-DX1.
- **Local development mode.** `loopctl dev` — starts a minimal constellation locally with relaxed enforcement. Provisions: one Vault Loop (SQLite), one Presentation Loop, one Compute Loop (for the extension under development), a Media Loop (local filesystem), and a mock admission gate that reports budget results without refusing. The developer sees exactly what their extension would receive in production — same contracts, same surface scoping, same media contracts — with instant feedback.
- **Budget intersection matrix.** Published in developer documentation. A precomputed table showing every pair of budget classes and their intersective result. `loopctl budget-check --classes content-enhancement,ai-personalization` prints it from the CLI. The developer knows the intersection before writing a line of code.

**Extension lifecycle management (Parallax 2 P3-F2).** Ships with Phase 3:

- **Dependency manifest.** Extensions declare dependencies with version ranges. The platform maintains a vulnerability advisory integration (initially manual curation, later automated via OSV/GitHub Advisory Database).
- **Re-admission trigger.** On configurable schedule (default: monthly), installed extensions are re-evaluated against the current budget schema. Budget tightening → grace period + notification, not immediate revocation. Re-admission output feeds the Proof Vault.
- **Health dashboard.** `loopctl extensions status` — last update, dependency health, admission status, budget compliance, runtime resource usage, media storage usage. The dashboard is a Content Surface — queryable through the same contract system.

**Deliverables:**
- Standard amendment: manifest format, budget schema (with AI classes and media capabilities), extension declaration in constellation spec, installation pipeline spec, embed declaration schema
- Admission gate (Compute Loop)
- Installation pipeline (Workflow)
- AI provenance metadata schema (text and media)
- Deployment tool v3: extension provisioning with platform isolation and media budgets
- Reference extensions (SEO analyzer + AI content summarizer)
- Local development mode (`loopctl dev`)
- Budget intersection matrix + `loopctl budget-check`
- Extension lifecycle management (dependency manifest, re-admission, health dashboard)
- Running demo: CMS with surfaces, tenants, media, and a structurally sandboxed AI content generator

**Verification gate (the ReferenceError demo):** Install an AI content generator extension. From within the AI's compute loop, attempt to access user data. Confirm: `ReferenceError` — the contract does not exist in scope. Not a 403. Not "access denied." The concept is absent. Attempt to access media via `FETCH_MEDIA_FULL` when the budget only permits `FETCH_MEDIA_METADATA` — confirm: `ReferenceError`. Verify: the Security Manifest shows the AI extension's admitted capabilities and prohibitions (including media). Verify: AI-generated content and media carry provenance metadata. Submit an extension with an over-declared manifest (SEO plugin requesting user Vault access and `TRANSFORM_MEDIA`). Confirm: OVER-DECLARED with specific violations named. Run `loopctl dev` — confirm: reference extension completes full lifecycle locally. Run `loopctl budget-check --classes content-enhancement,ai-personalization` — confirm: intersection printed.

**Kira:** This is the ecosystem demo. "Install extensions without installing risk. Install AI without installing risk. Build and test locally in two minutes." Three sentences. All demonstrable.

**What this phase proves:** The admission model works for both conventional extensions and AI agents, with media capabilities budgeted. The `ReferenceError` boundary is real for text and media. Developer onboarding is two minutes. The Proof Mode infrastructure now covers the full security surface — surfaces, tenants, extensions, and media.

---

### Phase 4 — The Safety Net

*Margaux: "Installing the undo button."*

**What ships:** Constellation Rewind, complete Proof Mode, and media in rewind.

**Constellation Rewind (Dara, Graham).** This is W7. The Spec Version Store (append-only vault of spec versions with diffs), the compatibility checker (compares target spec's contract schemas — including media contracts — against current Vault schemas), the Rewind pipeline (seven-step Workflow: validate target → compatibility check → snapshot current → apply spec → redeploy → self-verify → activate), and the Rewind Log integration with the Proof Vault.

**The critical property (Dara):** Rewind works because content is topology-independent. Vaults hold data. Media Loops hold media. The constellation spec declares topology. Rewind rolls back topology. Content and media are unaffected. The Vault/Loop separation and the Media Loop's reference-based architecture are the load-bearing properties. Rewind doesn't add this separation — it exploits it.

**Media in rewind (W10 — Phase 4 slice).** Media references are topology-independent like content references. Rewind rolls back which surfaces can access which media contracts, not the media itself. The compatibility checker validates that rewound surface declarations don't reference media contracts the current Media Loop doesn't provision. Media transforms cached under the old topology may reference surfaces that no longer exist — the rewind pipeline includes a transform cache invalidation step. Media binaries in the Media Loop are never deleted by rewind — only the topology that governs access to them changes.

**Compatibility check (Graham).** The gate that makes rewind safe. If the target spec references contracts that expect schema fields the current Vaults don't have (or no longer have), or media contracts the current Media Loop doesn't provision, the rewind aborts with specific incompatibilities named. Vault schema evolution is forward-only; topology rollback is safe only when the data schema is compatible. The compatibility check enforces this boundary.

**Deployment Tool v4 (Graham).** The tool now accepts a spec version identifier and derives topology from the historical spec. Same tool, different input source.

**Complete Proof Mode (Nyx).** With Constellation Rewind, the Proof Vault now contains: startup verification logs, periodic verification logs, spec change diffs (from the Diff Engine), extension admission records, AI provenance trails, media ingress validation records, embed allowlist changes, and rewind operation records. The Security Manifest covers surfaces, tenants, extensions, AI agents, and media capabilities. The Proof Endpoint serves the complete forensic history of the constellation. An auditor can trace: when was this extension installed? What did it have access to? What media capabilities did it hold? When was this spec changed? What was the previous state? Has the system ever been rewound? What triggered it?

**Deliverables:**
- Standard amendment: Spec Version Store schema, Rewind pipeline, compatibility check (including media contract compatibility)
- Spec Vault (append-only version store)
- Compatibility checker (Compute Loop)
- Rewind pipeline (Workflow) with media transform cache invalidation
- Deployment tool v4: historical spec derivation
- Complete Proof Mode: full forensic audit trail including media operations

**Verification gate:** Deploy a CMS with surfaces, tenants, media, and an extension. Upload media through the editorial surface. Install a new extension with media capabilities. Record the spec version. Rewind to the pre-installation spec. Confirm: extension topology removed, content preserved, media preserved, media transforms from the removed extension's surface invalidated, self-verification passes. Check the Proof Vault: the rewind operation is logged with the diff, the compatibility check result, and the post-rewind verification.

**What this phase proves:** Architectural rollback is safe when content, media, and topology are independent. The Proof Mode forensic trail is complete. The CMS can experiment with confidence.

---

### Phase 5 — Operational Maturity

*Margaux: "Hardening the building."*

**What ships:** Ephemeral exceptions, the structural verifier, and Tier 3 support.

**Ephemeral Exceptions (Dara, Wes).** This is W8. The exception-overlay format for the deployment tool, the CLI command for temporary connections with required TTL, the audit log of all exceptions. Exceptions auto-revoke after TTL expires. The deployment tool refuses to persist connections not declared in the constellation spec. The closure wall rebuilds itself on every deploy.

**Structural Verifier (Nyx, Sol).** This is W9. The distributed verification service for Tier 3 deployments. Receives an attenuated topology-only capability (resolves the verification paradox). Runs on a Clock schedule. Checks: every declared connection exists, no undeclared connections exist, every loop has the correct storage permissions, the Media Loop's backing store matches the spec's declared storage tier. Failures emit `INTEGRITY_FAILURE` on the Signal Bus — the full alerting path (replacing the structured-log and webhook paths from earlier phases). Produces a topology map — a visual, inspectable artifact showing the closure wall, including media flow paths.

**Deployment Tool v5 (Graham).** The tool now outputs service mesh configuration (Istio/Linkerd) for Tier 3. Supports the exception overlay. Provisions the structural verifier's attenuated capability. Media backing store configuration supports multi-CDN at Tier 3.

**Deliverables:**
- Exception overlay format and CLI
- Structural verifier specification and implementation
- Deployment tool v5: Tier 3 support, exception overlays, multi-CDN media
- Topology map visualization (including media flow)

**Verification gate:** Deploy at Tier 3. Add a temporary exception with a 1-hour TTL. Verify: the connection exists. Wait 1 hour (or simulate). Verify: the connection is gone. Introduce an undeclared connection manually. Verify: the structural verifier catches it and emits `INTEGRITY_FAILURE`. Check the topology map: the wall is visible, media flows are visible.

**What this phase proves:** The closure wall is operationally maintainable at scale. Exceptions don't erode the wall. Drift is detectable. Media serves through multi-CDN. The CMS is production-ready at Tier 3.

---

## Section 4 — The Phase Map

**Dara:** One table. Every workstream, every phase, every dependency.

| Phase | Name | Workstreams | Depends On | Effort | Produces |
|-------|------|-------------|------------|--------|----------|
| 0 | The Foundation | W1 (Capability Model) + Product Shell | None | S | Spec amendment, product documentation framework, DX spec |
| 1 | The Surfaces | W3 (Content Surfaces) + W2 v1 (Deploy Tool) + W4 stub (Proof infra) + W10 stub (Media Loop) + Migration + Ops Runbook | Phase 0 | XL | Running two-surface CMS with media, deployment tool, Proof Vault, migration tooling, runbook |
| 2 | The Walls | W5 (Multi-Tenant) + W4 maturation (Proof Mode) + W10 maturation (tenant media) + Compliance integration | Phase 1 | L | Multi-tenant CMS with media, Security Manifest, Proof Endpoint, compliance-ready output |
| 3 | The Gate | W6 (Extensions + AI Sandbox) + W10 maturation (extension media) + Dev onboarding + Extension lifecycle | Phases 1, 2 | XL | Extensible CMS with AI sandbox, media budgets, dev tools, full security manifest |
| 4 | The Safety Net | W7 (Constellation Rewind) + W4 complete (full Proof Mode) + W10 complete (media in rewind) | Phases 1, 2, 3 | M | Architectural rollback, forensic audit trail, media-safe rewind |
| 5 | Operational Maturity | W8 (Ephemeral Exceptions) + W9 (Structural Verifier) | Phase 1 (tool) | L | Tier 3 support, multi-CDN media, operational hardening |

**Relative effort (Parallax P2-F1).** S/M/L/XL are relative, not absolute — time estimates remain uncalibrated. Phase 0 is S (spec document + product shell, no code). Phase 1 is XL (the deployment tool is the largest single engineering artifact, plus Content Surfaces, Media Loop, Proof Vault infrastructure, migration tooling, and operational runbook). Phase 2 is L (multi-tenant is well-understood mechanism, moderate integration, compliance output). Phase 3 is XL (admission gate + installation pipeline + AI budgets + media budgets + ambient capability mitigations + developer onboarding + extension lifecycle). Phase 4 is M (rewind pipeline is a composition of existing primitives — deployment tool + Proof Vault + self-verification). Phase 5 is L (structural verifier for Tier 3 is new engineering; ephemeral exceptions are a deployment tool feature; multi-CDN media provisioning).

**Threading:** The deployment tool evolves through every phase (v1 → v2 → v3 → v4 → v5). Proof Mode accumulates through Phases 1–4 (infrastructure → partial manifest → full manifest with compliance integration → forensic trail). Media (W10) threads through Phases 1–4 (basic media contracts + ingress security → tenant-scoped media → extension media budgets → media in rewind). Self-verification checks accumulate at every phase.

**Parallelism:** Phase 0's spec and product tracks run in parallel. Phase 5 has no dependency on Phases 2–4 (only on Phase 1's deployment tool) — it can begin as early as Phase 2 if Tier 3 deployment is a priority. The critical path is Phase 0 → 1 → 2 → 3 → 4.

---

## Section 5 — What the Plan Produces at Each Phase

**Kira:** Each phase produces a demonstrable capability. Each demo is a sales conversation.

| Phase | Demo | Buyer Conversation |
|-------|------|-------------------|
| 1 | Two-surface CMS: public site can't query drafts. Images with metadata stripped. Content imported from Contentful. | "Your public site doesn't filter out your drafts. It doesn't know they exist. Your images are scrubbed clean. Migrate from Contentful in one command." |
| 2 | Multi-tenant CMS with Proof Endpoint and compliance output | "Tenant isolation at the database engine level. Here's the proof — independently verified. Your SOC 2 evidence package is one API call." |
| 3 | Extension + AI sandbox with ReferenceError demo, built and tested locally in 2 minutes | "Install AI without installing risk. The AI tried to access user data and got told the concept doesn't exist. Build and test extensions locally in two minutes." |
| 4 | Constellation Rewind: install, break, undo — content and media untouched | "Try the extension. If it breaks things, undo the architecture. Content and media untouched." |
| 5 | Topology map showing the closure wall at Tier 3, media flows visible | "Here's your security model, live, inspectable, structurally verified every hour." |

**Renata:** The cumulative pitch after Phase 4: "A CMS where the API shapes what each consumer can ask — about content and media — tenant isolation is proven at the database level, extensions and AI operate in a structural sandbox with budgeted media access, the security posture proves itself with independent verification, embeds are isolated per provider, the compliance evidence package is one API call, and the architecture has an undo button. Migrate from Contentful in one command." That's not a feature list. That's a category.

**Feature-first pitch track (Parallax P2-F2).** The security-first pitch reaches enterprise security buyers. A feature-first pitch reaches content teams: "Define exactly what each consumer — your website, your app, your AI, your analytics — can see and do, including which images and media they can access. Multi-tenant out of the box. Add extensions with one command. Build and test locally in two minutes. Undo any system change without losing content or media. Import from Contentful. One spec file runs at any scale." The security properties are the *reason* these features work. The features are the *reason* buyers care. Product marketing leads with features; technical marketing leads with security. Both are true. They reach different audiences.

---

## Section 6 — Cross-Cutting Concerns

**Sable:** Four concerns appear across the plan. The master plan states each once.

### The Information-Theoretic Bound

Capability attenuation constrains what a consumer can *access*. It does not constrain what a consumer can *infer*. An analytics surface returning aggregate word counts per category leaks information about individual articles (a category with one article has a word count that *is* the article's word count). A tenant-scoped query with timing analysis can infer the existence of other tenants' data. An extension within its admitted capabilities can observe response patterns and infer content structure. Media metadata queries can infer content existence and characteristics even without binary access.

The bound is real, unavoidable (Shannon), and applies at every layer of the plan: Content Surfaces (query vocabulary doesn't prevent inference from aggregates), Multi-Tenant (RLS doesn't prevent timing-based inference), Extension Admission (admitted capabilities don't prevent inference from observed behavior), AI Sandbox (AI agents are specifically good at inference), Media (metadata queries and transform request patterns leak information about source media).

**The plan's position:** Content Surfaces, tenant isolation, extension admission, and media scoping provide structural access control. They do not provide differential privacy. The distinction matters for regulated environments and should be documented in the product's security model. Research-class, not engineering-class.

### Developer Experience

The capability model adds friction at every scale. A developer on a conventional CMS writes a database query and gets data. A developer on Loop MMT writes a contract schema, declares it in the spec, provisions the capability, wires the routing table, and then gets data. The security properties are real. The developer experience cost is also real. Media adds another dimension — media contracts, transform pipeline configuration, embed allowlists, ingress security rules.

**The plan's position:** Developer experience tooling is not optional — it's load-bearing. CLI generators for manifest templates, a `loopctl` command suite, local development mode with relaxed enforcement, educational error messages (the OVER-DECLARED response names the violation and suggests the fix), reference extensions that are both documentation and integration tests, precomputed budget intersection matrices. The product shell (Phase 0) and deployment tool (Phase 1) must embed DX as a first-class concern, not a post-ship polish. Each phase's deliverables include developer-facing documentation and CLI extensions. The fortress must be one people want to live in.

### The Phase 0 Risk

Everything depends on the capability model spec amendment. Ten workstreams across three documents and six phases all build on the same API — including media contracts that must fit the same capability model. The cost of a mistake at Phase 0 propagates everywhere. The Phase 0 verification gate — a Super RCR on the spec amendment — is not ceremonial. It's the most consequential review in the entire plan. Get the three properties right (confinement, attenuation, revocation) and the plan flows — for text, media, embeds, extensions, and AI. Get them wrong and every phase inherits the error.

### Media as Architectural Citizen

Media (images, video, audio, embeds) is not a feature bolted onto a text CMS. It is a content type that every architectural mechanism must handle: Content Surfaces scope media access. Tenant isolation scopes media storage. Extension admission budgets media capabilities. Proof Mode verifies media contract integrity. Constellation Rewind preserves media while rolling back topology. The embed system extends the closure wall to external media providers. The media system's self-similarity with the content system — same patterns (surfaces, budgets, attenuation, verification) applied to a different content type — is the architectural validation that the capability model is general enough to carry the plan.

---

## Section 7 — Risks

**Ed:** Eleven risks. The original five, three from Parallax 1, and three new. Each is real and none is fatal.

**Risk 1 — Complexity accumulation (Theo).** By Phase 4, the constellation spec declares: loop types, bus contracts, routing tables, pipeline specs, content surfaces, media contracts, embed allowlists, tenant configuration, extension manifests, capability budgets, AI-specific constraints, media budgets, and rewind configuration. The spec is the product's center of gravity — and it's getting heavy. Mitigation: the deployment tool and CLI absorb the complexity. The operator writes a high-level declaration; the tool derives the details. Spec weight is managed, not avoided. The `loopctl dev` local mode demonstrates that the developer's interaction with the spec is simple even when the spec itself is rich.

**Risk 2 — Market education (Renata).** "Structural enforcement is better than policy enforcement" assumes a buyer who thinks in those terms. Most don't. Each phase's demo must translate structural properties into business outcomes, not architectural properties. "Your AI can't leak user data" (not "the closure wall attenuates capabilities"). "Your auditor reads one URL" (not "the self-verification system produces an append-only log"). "Your images arrive clean" (not "the ingress pipeline strips EXIF metadata"). The product speaks business. The architecture speaks structure. They never share a sentence.

**Risk 3 — Tier 1 viability (Graham).** The plan prioritizes Tier 2+ (container deployments). Tier 1 (single-file JavaScript) gets the closure wall through the scope chain, but Content Surfaces, multi-tenant isolation, and the deployment tool don't apply at Tier 1. A single-file CMS is the entry point for small teams. If Phase 1 requires containers, the small-team market is excluded. Mitigation: the deployment tool is Phase 1 infrastructure, but the Content Surface declaration and self-verification work at Tier 1 via the scope chain. Media at Tier 1 uses local filesystem. Tier 1 gets structural content and media isolation. Tier 2+ gets the deployment-enforced version. Same spec, different enforcement — per the v1.2 plan's tiering principle.

**Risk 4 — Phase coupling (Dara).** Phases 2–4 build on each other. A delay in Phase 2 (multi-tenant) delays Phase 3 (extensions) which delays Phase 4 (rewind). The critical path has no slack. Mitigation: Phase 5 (operational maturity) is independent and can absorb development capacity during critical-path delays. The deployment tool's architecture is reviewed between Phases 2 and 3 (Parallax P4-F3) to prevent accretion before the input vocabulary expands.

**Risk 5 — Scope of Phase 0 (Ed).** The capability model spec amendment is one session of document production. But "one session" has been wrong before. The Super RCR on the amendment may surface issues that require multiple revision cycles. The capability model must define confinement, attenuation, and revocation precisely enough that five subsequent phases can build on the definitions without ambiguity — and the definitions must carry media contracts as naturally as text contracts. Mitigation: Phase 0 is spec-only — no code, no tooling, no dependencies. It can take as long as it takes without blocking parallel product-shell work.

**Risk 6 — Time-to-parity (Parallax P2-F1).** The plan's Phase 3 (extensions + AI) reaches approximate feature parity with incumbent CMS platforms. Phases 0–2 produce a product that is technically differentiated but feature-inferior to Contentful, Sanity, and Strapi. The incumbent ships features every sprint during the build. Mitigation: differentiation, not parity, is the commercial strategy. The Phase 2 enterprise MVP (multi-tenant + Proof Mode + compliance integration + migration path) occupies a market position no incumbent holds. Chasing feature parity is the wrong race. Owning the structural-security category is the right one.

**Risk 7 — Multi-class budget edge cases (Parallax P4-F1).** The intersective composition model handles the common case (cross-cutting extensions). Edge cases remain: what if the intersection of two budget classes produces zero allowed contracts? (The extension declared incompatible classes.) What if the intersection produces a capability set too narrow to function? (The extension under-declared.) Mitigation: the admission gate reports intersective results before refusing — "your declared classes [content-enhancement, payment-processing] produce an intersection with no shared contracts. Declare a single class or use the custom class." Educational refusal. The precomputed budget intersection matrix catches this before the developer writes code.

**Risk 8 — Proof Vault as liability (Parallax P4-F2).** An append-only forensic log is a compliance asset and a legal discovery target. In litigation, the Proof Vault's history is subpoena-able. An operator who enables Proof Mode creates an audit trail that serves regulators and plaintiffs equally. Mitigation: this is a documentation concern, not an architecture concern. The product documentation must state clearly that Proof Mode creates a forensic record. The operator decides whether to enable it. The default should be off with a clear explanation of what turning it on means.

**Risk 9 — Media storage cost at scale (Theo).** Media is the largest storage cost in any CMS. By Phase 2, a multi-tenant CMS with per-tenant media namespaces could accumulate storage faster than content. Transform caching multiplies storage (4 responsive variants per image = 5x storage per original). CDN bandwidth costs compound. Mitigation: transform caching is bounded (LRU cache with configurable max size per tenant). Media garbage collection runs on schedule. Storage quotas are enforced at the Media Loop. The operator controls the cost curve through spec-declared quotas and retention policies.

**Risk 10 — Embed security model drift (Nyx).** The embed allowlist is static — it's declared in the constellation spec. But embed providers change their URLs, add tracking, modify their iframe behavior. An allowlisted provider that changes its behavior post-allowlisting degrades the isolation model. Mitigation: the embed isolation policy (CSP + sandbox attributes) is the enforcement mechanism, not the allowlist alone. Even if a provider changes behavior, the sandbox restricts what they can do. Periodic review of embed provider behavior is an operational concern documented in the runbook.

**Risk 11 — Migration tooling maintenance burden (Renata).** The `loopctl translate` command targets Contentful first. Each additional CMS (Sanity, Strapi, WordPress) requires a new parser plugin. Parser plugins must be maintained as source CMSes evolve their export formats. Mitigation: JSON import is the universal fallback — any CMS that can export to JSON can import into Loop MMT. The Contentful translator is the reference implementation. Community-contributed translators for other CMSes are a Phase 3+ ecosystem opportunity. The parser plugin architecture (same as deployment tool parsers) keeps the integration surface small.

---

## Section 8 — Four Corners

**FBD (Floor).** The plan's floor is consolidation itself. Three overlapping documents with implicit dependencies is a structural risk — the wrong build order produces rework, the overlapping workstreams produce duplicate effort, and the cross-document dependencies produce integration surprises. The master plan resolves all three: ordered phases, collapsed workstreams, explicit dependency graph. The floor for the CMS product is Sol's capability model — structural enforcement over policy enforcement, at every layer, at every phase, for text and media alike. Eight named FBD controls: FBD-MD1 (media ingress validation before commit), FBD-MV1 (independent manifest verifier coupled to verification schedule), FBD-MG1 (translator output must pass deployment tool validator), FBD-DX1 (reference extensions are integration tests), FBD-OP1 (deployment output includes monitoring config), plus three from v1.1 (deployment tool verifier, admission gate educational refusal, pipeline failure strategies).

**FWW(C) (Ceiling).** Margaux's phase names carry the story: Foundation, Surfaces, Walls, Gate, Safety Net, Operational Maturity. The grocery store metaphor extends through all six phases — and now the store handles produce (perishable, requiring refrigeration, transform-dependent) not just shelf-stable goods. The demos are visceral — the `ReferenceError`, the single-URL security audit, the architectural undo button, the EXIF-stripped image, the embed sandbox, the two-minute local dev setup. The plan reads like a build journal, not a spec.

**STP (Show the Path).** Every phase traces to its source documents, its dependency chain, its verification gate, and its demo script. The collapse is documented (Sol's analysis, post-collapse inventory table). The dependency graph is explicit (ASCII diagram + phase map table). The risks are named with mitigations. Two Parallax passes and a Super RCR are documented with full finding disposition. No hidden state.

**SNR (Signal-to-Noise).** Eight sections. The plan does not reproduce implementation details from the source documents — it references them. Each phase names its deliverables, verification gates, and what-this-proves claims. The cross-cutting concerns section states each recurring theme once. Media is described once architecturally (Section 6) and threaded through phases by reference. The plan is a sequencing document, not a specification document. The specifications live in their source documents.

---

## Section 9 — Provenance and Attribution

| Contribution | Board Member(s) | Role |
|-------------|-----------------|------|
| Workstream collapse (12 → 9) | Sol | Structural analysis — Content Surfaces ⊃ Gap 1, AI Sandbox ⊃ Gap 3 |
| Dependency graph | Dara | Temporal sequencing — critical path identification |
| Proof Mode repositioning | Nyx | Threading Proof Mode as accumulating infrastructure |
| Deployment tool threading | Graham | Tool evolution (v1 → v5) across phases |
| Deployment tool architecture | Graham | Four-component architecture (parser, validator, generator, verifier) — Parallax 1 P1-F1 |
| L2+L4 merge | Wes | Deployment tool + storage enforcement as one build unit |
| Phase 0 parallel tracks | Renata, Vee | Product shell alongside spec work |
| Phase naming | Margaux | Foundation, Surfaces, Walls, Gate, Safety Net, Operational Maturity |
| Demo-as-verification-gate | Kira | Commercial utility from technical verification |
| Enterprise sequencing | Theo | Multi-tenant before extensions (commercial + dependency alignment) |
| Grocery store extension | Chen Wei | Six-phase metaphor from prior two-phase metaphor |
| RCR chair (sequencing) | Dara | Sequencing is her domain — temporal, operational, erosion-aware |
| Information-theoretic bound | Sable | Stated once, referenced everywhere — extended to media |
| Phase 0 risk | Ed | Scope concern on the highest-leverage deliverable |
| Intersective budget composition | Sol, Nyx | Multi-class extension model — Parallax 1 P4-F1 |
| Revenue gate identification | Renata | Phase 2 as enterprise MVP — Parallax 1 P3-F1 |
| Feature-first pitch track | Renata, Kira | Dual marketing strategy — Parallax 1 P2-F2 |
| Proof Vault retention policy | Dara, Nyx | Jurisdiction-aware defaults — Parallax 1 P4-F2 |
| Parallax 1 angles | Wes | Builder, Incumbent, Investor, Operator-at-Phase-3 |
| Parallax 2 angles | Wes | Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer |
| Media Loop architecture | Graham | Specialized Vault Loop with pluggable backing store |
| Media information theory | Sable | EXIF leakage, metadata sanitization, transform inference |
| Media security | Nyx | Ingress pipeline, SVG sanitization, embed isolation |
| Media commercial positioning | Renata | Media surfaces as competitive differentiator |
| Media operations | Dara | Quotas, garbage collection, CDN purge, transform caching |
| Media as fractal/boundary | Sol | Self-similarity of media architecture with content architecture |
| Embed system | Nyx, Graham | Allowlist, per-provider CSP, ingestion-time validation |
| Migration tooling | Renata, Kira, Dara | Import pipeline, Contentful translator, phase placement |
| Operational runbook | Theo, Dara | Deployment lifecycle, monitoring, incident response, backup |
| Independent manifest verifier | Sol, Nyx | Dual-channel verification — two projections must agree |
| Compliance integration | Nyx, Renata | SIEM format, webhooks, evidence collection API |
| Developer onboarding | Vee, Graham | Reference extensions, local dev mode, budget matrix |
| Extension lifecycle | Dara, Nyx | Re-admission, dependency scanning, health dashboard |
| `cannotAccess` semantics | Sable | Exhaustive within declared capability model |
| Super Frame (media) | Full board | Six-lens analysis producing W10 |

*Bev recorded. Leroy held position. Geoff was not present.*

---

## Source Document Reference

| Document | Version | Scope | Detailed Implementation |
|----------|---------|-------|------------------------|
| Distributed Closure Wall Plan | v1.2 | 5 layers — capability model through structural verifier | Layers 1–5 mechanism design, tier model, deployment tool spec |
| CMS Capability Gaps Plan | v1.1 | 3 gaps — draft/published, multi-tenant, extension admission | Gap-by-gap implementation steps, Parallax findings, verification gates |
| CMS Novel Capabilities Report | v1 | 4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind | Feature-by-feature implementation, composition map, competitive positioning |

All three remain canonical for implementation detail. This plan governs sequencing and scope.

---

## Parallax Findings Register

### Parallax Pass 1

Four angles (Builder, Incumbent, Investor, Operator-at-Phase-3). Nine findings. Four HIGH incorporated into v1.1. Four MEDIUM acknowledged as notes. One LOW acknowledged.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| P1-F1 | HIGH | Deployment tool underspecified relative to centrality | INCORPORATED v1.1 — four-component architecture added to Phase 1 |
| P1-F2 | MEDIUM | DX layer has no specification | INCORPORATED v1.1 — DX specification added to Phase 0 deliverables |
| P2-F1 | HIGH | No timeline, even relative | INCORPORATED v1.1 — S/M/L/XL relative effort added to Phase Map |
| P2-F2 | MEDIUM | Competitive positioning assumes security-aware buyers | INCORPORATED v1.1 — feature-first pitch track added to Section 5 |
| P3-F1 | HIGH | No revenue phase identified | INCORPORATED v1.1 — Phase 2 named as revenue gate |
| P3-F2 | MEDIUM | Resource-model-agnostic | INCORPORATED v1.1 — resource model assumption added to About |
| P4-F1 | HIGH | Multi-class extensions unaddressed | INCORPORATED v1.1 — intersective budget composition added to Phase 3 |
| P4-F2 | MEDIUM | Proof Vault has no retention policy | INCORPORATED v1.1 — configurable retention with jurisdiction presets added to Phase 1 |
| P4-F3 | LOW | No deployment tool refactoring gate | INCORPORATED v1.1 — review gate added between Phase 2 and Phase 3 |

### Parallax Pass 2

Four angles (Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer). Eight findings. Four HIGH, four MEDIUM. Zero LOW.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| P1-F1 | HIGH | No reference extension or complete working example | INCORPORATED v1.2 — two reference extensions + `loopctl init-extension` in Phase 3 |
| P1-F2 | MEDIUM | Local development environment unspecified | INCORPORATED v1.2 — `loopctl dev` local mode specified in Phase 3 |
| P2-F1 | HIGH | No migration story — zero import/translation tooling | INCORPORATED v1.2 — `loopctl import` + `loopctl translate` in Phase 1 |
| P2-F2 | MEDIUM | No content model translation tooling | INCORPORATED v1.2 — Contentful translator with draft spec output in Phase 1 |
| P3-F1 | HIGH | No operational runbook | INCORPORATED v1.2 — runbook v1 ships with Phase 1 deployment tool |
| P3-F2 | MEDIUM | No extension lifecycle management | INCORPORATED v1.2 — re-admission, dependency scanning, health dashboard in Phase 3 |
| P4-F1 | HIGH | Manifest attestation gap — self-generated projection | INCORPORATED v1.2 — independent manifest verifier (dual-channel) in Phase 1 |
| P4-F2 | MEDIUM | No third-party compliance integration | INCORPORATED v1.2 — SIEM format, webhooks, evidence API in Phase 2 |

### Super RCR — Media Handling

One Super Frame (six lenses). One new workstream (W10 — Media System) threading through Phases 1–4.

| ID | Finding | Disposition |
|----|---------|-------------|
| SR-1 | Media handling entirely absent from plan | INCORPORATED v1.2 — W10 Media System added, threading Phases 1–4 |
| SR-2 | Embed handling (YouTube, Vimeo, social) absent | INCORPORATED v1.2 — embed system with allowlist + per-provider CSP |
| SR-3 | Media ingress security unaddressed | INCORPORATED v1.2 — magic-byte validation, SVG sanitization, EXIF stripping, size caps (FBD-MD1) |
| SR-4 | Media metadata leakage (EXIF, GPS, camera ID) | INCORPORATED v1.2 — metadata sanitization on all surface-boundary crossings |
| SR-5 | AI media provenance unaddressed | INCORPORATED v1.2 — AI-generated media carries model/prompt/parameter metadata |
| SR-6 | Media in Constellation Rewind unaddressed | INCORPORATED v1.2 — media references topology-independent, transform cache invalidation on rewind |

---

## FBD Control Registry

| Control | Gate | Description |
|---------|------|-------------|
| FBD-MD1 | Phase 1 | Media ingress validation (magic bytes, SVG sanitization, EXIF strip, size/dimension caps) fires before `STORE_MEDIA` commits. Wall catches at input, not output. |
| FBD-MV1 | Phase 1 | Independent manifest verifier runs on same schedule as self-verification. Cannot be disabled independently. Two projections must agree. |
| FBD-MG1 | Phase 1 | Content model translator output must pass deployment tool validator. Translator is broken if its output doesn't validate. |
| FBD-DX1 | Phase 3 | Reference extensions are integration tests. If the reference can't complete the full lifecycle on `loopctl dev`, the dev mode is broken. |
| FBD-OP1 | Phase 1 | Deployment tool output includes monitoring configuration. Deploy without alerts → warning (not block). |

---

[PULSE] Master CMS Implementation Plan v1.2: Two Parallax passes (8 angles, 17 findings total, all incorporated). One Super RCR (9 items, 5 workstreams). One Super Frame (6 lenses on media). 12 workstreams collapsed to 10. 6 phases. 11 risks named. 4 cross-cutting concerns. 5 FBD controls. 3 source documents consolidated. Media handling fully integrated as threading dimension.

[DRIVES: Floor, Ceiling, Depth, Mesh, Ground, Equalization, Constraint — 7/7]

---

*Loop MMT™ · Multi-Module Theory · CMS Master Implementation Plan v1.2*
*Heavy RCR: Dara chaired. Convergence after collision.*
*Parallax 1: 4 angles (Builder, Incumbent, Investor, Operator-at-Phase-3). 9 findings, all incorporated.*
*Parallax 2: 4 angles (Extension Developer, Migrating Agency, Solo Maintainer, Compliance Officer). 8 findings, all incorporated.*
*Super RCR: 9 items resolved (8 Parallax 2 findings + media handling). 5 workstreams. 6 media findings.*
*Super Frame: Media handling — 6 lenses (Structural, Information-Theoretic, Commercial, Operational, Security, Fractal/Boundary).*
*Source documents: Distributed Closure Wall v1.2 + CMS Capability Gaps v1.1 + Novel Capabilities Report v1*
*© 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0*
