# Loop MMT CMS — Master Implementation Plan v1.1
## Loop MMT™ · Loop World | Shrubbery · 21 April 2026

---

## About This Document

*[Section Type: Plan]*

***Evidence status: Nothing in this plan has been implemented or tested. Every mechanism described is architectural. The capability model, the closure wall extensions, the content surfaces, the extension admission model, and all four novel capabilities are design artifacts. The CMS described in this plan does not exist.***

This document consolidates three CMS architectural plans into a single implementation sequence:

- **Distributed Closure Wall Plan v1.2** (5 layers — capability model, deployment tool, ephemeral exceptions, storage enforcement, structural verifier)
- **CMS Capability Gaps Plan v1.1** (3 gaps — draft/published boundary, multi-tenant isolation, extension admission model)
- **CMS Novel Capabilities Report v1** (4 features — Content Surfaces, Proof Mode, AI Sandbox, Constellation Rewind)

The three documents were produced across two informal sessions on 21 April 2026. They share a single architectural foundation (the capability model), contain overlapping workstreams that collapse under analysis, and have cross-dependencies that constrain their build order. This plan resolves the overlaps, maps the dependencies, and produces a six-phase implementation sequence where each phase proves the mechanism the next phase needs.

**Provenance.** Heavy RCR on sequencing, 21 April 2026. Dara chaired. Eleven takes, two passes. Five collisions (two challenges, three builds). Sol identified the collapse (twelve workstreams → nine). Nyx repositioned Proof Mode as early infrastructure. Wes merged the deployment tool with storage enforcement. Graham threaded the deployment tool as evolving infrastructure rather than a single-phase deliverable. Kira aligned demo scripts with verification gates. Margaux named the phases. Resolution: convergence after collision. One four-angle Parallax pass applied post-plan (Builder, Incumbent, Investor, Operator-at-Phase-3): nine findings, four HIGH, four incorporated into v1.1 — deployment tool architecture, intersective budget composition, revenue gate, relative effort sizing. Four MEDIUM acknowledged as notes. One LOW acknowledged.

**Resource model assumption.** This plan assumes AI-assisted solo development (one operator with AI tooling), consistent with Loop MMT's current development model. Phase 0's parallel tracks (spec + product shell) run as sequential sub-phases under this model. A small team (3–5 people) would parallelize Phases 0's tracks and could begin Phase 5 during Phase 2. The critical path (Phases 0 → 1 → 2 → 3 → 4) is team-size-invariant — the dependencies are architectural, not resourcing.

**What this plan replaces.** The three source documents remain as detailed specifications. This plan does not reproduce their implementation details — it sequences them, resolves their overlaps, and provides the single build order a development team would follow. For the mechanism behind any specific feature, read the source document.

**The grocery store (extended).** Chen Wei's grocery store metaphor carries the whole plan. Phase 0 is getting the building permits and architectural drawings. Phase 1 is installing the stockroom door and building the shelf system — the store's fundamental interior structure. Phase 2 is building the deployment infrastructure — the loading dock, the delivery fleet, the warehouse management system. Phase 3 is assigning tenants their own sections of shelf space. Phase 4 is building the receiving dock and the supplier inspection system. Phase 5 is installing the security cameras, the undo system, and opening for business.

---

## Section 1 — The Collapse

**Sol:** The three source documents contain twelve named workstreams. Under dependency analysis, twelve collapses to nine.

**Collapse 1: Content Surfaces absorbs Gap 1 (Draft/Published).**

Gap 1 is a two-surface system: one editorial surface with full content access, one public surface limited to published content. Content Surfaces is the general-case N-surface system where each consumer gets a named, capability-scoped view of the content corpus. Building Content Surfaces gives you Gap 1 as the first test case — the public/editorial split is just the simplest surface declaration. Building Gap 1 alone gives you a special case that you'd generalize later anyway. Build the general case. Get the special case for free.

**Collapse 2: AI Sandbox merges with Gap 3 (Extension Admission).**

AI Sandbox is the extension admission model applied to AI agents with AI-specific budget classes. The admission gate, the manifest format, the capability budgets, the closure wall enforcement, and the installation pipeline are identical. The only addition is the `aiSpecific` block in the budget schema (data retention policy, PII exposure level, output review requirement) and the content provenance metadata. Building extension admission with AI budget classes from the start produces one system, not two. Building extension admission first and bolting AI budgets on later means revisiting the budget schema.

**Post-collapse workstream inventory (nine units):**

| # | Workstream | Source | Absorbed |
|---|-----------|--------|----------|
| W1 | Capability Model (L1) | v1.2 | — |
| W2 | Deployment Tool + Storage Enforcement (L2+L4) | v1.2 | L4 merged into L2 |
| W3 | Content Surfaces | Novel Capabilities | Gap 1 absorbed |
| W4 | Proof Mode | Novel Capabilities | — |
| W5 | Multi-Tenant Isolation (Gap 2) | v1.1 | — |
| W6 | Extension Admission + AI Sandbox | v1.1 + Novel | Gap 3 + AI Sandbox merged |
| W7 | Constellation Rewind | Novel Capabilities | — |
| W8 | Ephemeral Exceptions (L3) | v1.2 | — |
| W9 | Structural Verifier (L5) | v1.2 | — |

Three workstreams absorbed. Nine remain. The dependency graph determines the build order.

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
 └──→ W4 (Proof Mode) [partial — can start after W1, full after W3]
```

**Critical path:** W1 → W3 → W5 → W6. Four sequential phases on the longest dependency chain. W2 runs parallel to W3. W4 starts after W1, matures through each subsequent phase. W7, W8, W9 are terminal — nothing depends on them.

**Nyx:** Proof Mode has a split dependency. The Verification Log and append-only Proof Vault can be built after W1 — they're infrastructure that captures self-verification output, and self-verification already exists. The Security Manifest needs Content Surfaces (W3) to be meaningful — surface declarations are part of the manifest. Build the log infrastructure early (after W1), build the manifest generation after W3. Proof Mode threads through the build, accumulating capability at each phase.

**Graham:** The Deployment Tool (W2) similarly threads. Phase 0: spec only. Phase 1: the tool outputs Tier 2 Docker Compose with storage enforcement baked in. Each subsequent phase extends the tool's input vocabulary (surfaces, tenant declarations, extension manifests) and output capabilities. The tool doesn't ship once — it evolves.

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
- DX specification: `loopctl` CLI command structure per phase, extension developer guide outline, manifest template generator spec (Parallax P1-F2)

**Verification gate:** The spec amendment passes a Super RCR before shipping. This is the API that everything builds on. The cost of a mistake here propagates to every subsequent phase.

**What this phase proves:** The bus contract system can carry capability semantics. Confinement, attenuation, and revocation are expressible as contract properties.

---

### Phase 1 — The Surfaces

*Margaux: "Building the shelves."*

**What ships:** Content Surfaces, the deployment tool (v1), Proof Mode infrastructure, and the first running CMS demo.

**Content Surfaces (Sol, Graham, Sable):** The surface declaration schema, the aggregate and metadata contract types, the surface-to-loop mapping in the constellation spec, and the self-verification extension. This is W3, which absorbs Gap 1. The draft/published split is the first test case — a two-surface constellation (public and editorial) where the public surface structurally cannot query draft content. Then the analytics and recommendation surfaces prove the general case.

Implementation detail lives in the Novel Capabilities Report §2 and Gaps Plan v1.1 §2. The spec amendment adds: surface declarations to the constellation spec grammar, `FETCH_CONTENT_AGGREGATE` and `FETCH_CONTENT_METADATA` contract types, surface-to-loop factory wiring in the constellation initializer, and a self-verification check that each loop holds only its assigned surface's contracts.

**Deployment Tool v1 (Graham, Dara):** The first version of the deployment tool. Reads a constellation spec with surface declarations, outputs Docker Compose (Tier 2). Storage enforcement (L4) is baked in — non-Vault loops get ephemeral storage, Vault loops get persistent volumes. The tool is a translator: spec in, deployment config out. Deterministic. Idempotent. Re-derives on every deploy.

**Deployment tool architecture (Parallax P1-F1).** The tool is the single largest engineering artifact in the plan — it threads through all six phases and evolves five times. Its architecture must support extension without refactoring. Four components: (1) **Parser** — reads the constellation spec grammar, validates structure, produces an intermediate representation (IR). The IR is the extension point — each phase adds new IR node types (surfaces in v1, tenant declarations in v2, extension manifests in v3, spec version references in v4, exception overlays in v5). (2) **Validator** — checks the IR against the capability model constraints. Surfaces reference valid contracts. Tenant declarations reference valid Auth Gate configuration. Extensions don't exceed budgets. (3) **Generator** — translates the validated IR into deployment artifacts. Two output targets initially: Docker Compose (Tier 2) and service mesh manifest (Tier 3, added at v5). Each generator is a pluggable backend. (4) **Verifier** — compares the generated output against the IR to confirm nothing was dropped or added in translation. The tool tests its own output. A deployment tool refactoring gate fires between Phase 2 and Phase 3 (Parallax P4-F3) — the tool's architecture is reviewed before the input vocabulary expands from infrastructure declarations (surfaces, tenants) to ecosystem declarations (extensions, manifests, budgets).

**Proof Mode infrastructure (Nyx, Dara):** The Verification Log schema, the append-only Proof Vault, and the log-capture mechanism. Self-verification output from this phase onward goes into the Proof Vault. The Security Manifest generator is stubbed — it produces a partial manifest covering surface declarations. Full manifest generation comes in Phase 2+ as more declaration types exist.

**Proof Vault retention policy (Parallax P4-F2).** The Proof Vault is append-only but not unbounded. The Data Gates system (Standard Section 4) governs retention. The Proof Vault declares a configurable retention policy with jurisdiction-aware defaults: 1 year active / 5 years archived (SOC 2 baseline), 6 years active / 10 years archived (HIPAA), 7 years active (financial regulatory). Startup and periodic verification entries compact after active retention — individual check results aggregate into daily summaries. Spec change diffs, extension admission records, and rewind logs are never compacted (they're the forensic trail). The operator declares the retention profile in the constellation spec's `proofMode` block.

**Deliverables:**
- Standard amendment: Content Surface schema, aggregate/metadata contracts, surface-to-loop mapping
- Deployment tool v1: constellation spec → Docker Compose, with storage enforcement
- Proof Vault + Verification Log infrastructure
- Running demo: two-surface CMS (public/editorial) with draft/published isolation

**Verification gate:** Deploy a two-surface constellation at Tier 2. From the public Presentation Loop, attempt to form a query for draft content. Confirm: the contract does not exist in scope — not denied, absent. From the analytics Compute Loop, attempt to pull individual content records via `FETCH_CONTENT_FULL`. Confirm: same result. Check the Verification Log — the startup integrity check is recorded. Check the deployment — non-Vault loops have no persistent storage.

**Kira:** This is the first sales demo. "The public site doesn't filter out your drafts. It doesn't know they exist." That sentence, demonstrated live, opens the conversation.

**What this phase proves:** Contract-vocabulary-as-boundary works. The deployment tool can derive topology from spec. The Proof Vault can capture verification output. Capability attenuation is real at Tier 2.

---

### Phase 2 — The Walls

*Margaux: "Assigning the aisles."*

**What ships:** Multi-tenant isolation and a maturing Proof Mode.

**Multi-Tenant Isolation (Sol, Nyx, Dara):** This is W5. Auth Gate `tenantId` stamping, tenant-scoped Vault Loop factory (RLS Path A or schema-per-tenant Path B), atomic migration runner FBD (table + RLS policy in one transaction), periodic Clock-triggered verification of tenant scoping, and constellation spec `multiTenant` declaration.

Implementation detail lives in Gaps Plan v1.1 §3. The key additions to the Standard: `tenantId` as a first-class packet field stamped by the Auth Gate, tenant-scoped database capability as a factory parameter, `multiTenant` declaration block in the constellation spec, and the migration runner's atomic table+policy creation.

**Path A guard (Nyx):** The tenant-scoped connection wrapper intercepts and refuses `SET` calls on the `app.current_tenant` session variable. The attenuated database capability grants query access but not scope-change access. Per Parallax finding P1-F2 from the v1.1 plan.

**Deployment Tool v2 (Graham):** The tool now reads `multiTenant` declarations and provisions accordingly — RLS policies for Path A, separate schemas for Path B. Storage enforcement carries forward from v1.

**Proof Mode maturation (Nyx):** The Security Manifest generator now covers surface declarations *and* tenant isolation configuration. The `cannotAccess` field in the manifest reflects tenant boundaries. Each self-verification cycle — startup and periodic — records tenant-scoping checks in the Proof Vault. The Diff Engine comes online: spec changes produce change records in the Verification Log.

**Proof Endpoint (Graham):** The read-only API that serves the Security Manifest and the Verification Log. A Presentation Loop with a Content Surface scoped to the Proof Vault. It can read the proof artifacts. It cannot modify them.

**Deliverables:**
- Standard amendment: multi-tenant declaration, Auth Gate tenantId, Vault Loop factory extension, migration runner FBD, periodic self-verification
- Deployment tool v2: multi-tenant provisioning (RLS or schema-per-tenant)
- Proof Mode: Security Manifest generator (surfaces + tenants), Diff Engine, Proof Endpoint
- Running demo: multi-tenant CMS with two tenants, content surfaces, and an auditable security proof

**Verification gate:** Deploy a two-tenant constellation with content surfaces. From Tenant A's Vault Loop, execute `SELECT * FROM content` with no tenant filter — only Tenant A's rows return. Attempt to set the session variable to Tenant B's ID — the connection wrapper refuses. Hit the Proof Endpoint — the Security Manifest shows surface assignments and tenant boundaries. Modify the spec (add a surface) — the Diff Engine produces a change record.

**Renata:** This is the enterprise demo. "Tenant isolation is enforced at the database engine level. Here's the proof." SOC 2 auditors read the manifest and the log instead of interviewing the team for three days. The compliance conversation starts here.

**Revenue gate (Parallax P3-F1).** Phase 2 is where the product becomes commercially viable. A multi-tenant CMS with Content Surfaces and Proof Mode is an enterprise product with a compliance story. Phases 0–1 are pre-revenue infrastructure. Phase 2 is the enterprise MVP. Phases 3–5 are the growth roadmap. The fundraising narrative follows: pre-seed builds the foundation and first demo (Phases 0–1), seed builds the enterprise MVP (Phase 2), Series A builds the ecosystem (Phases 3–4). This framing is structural, not prescriptive — the operator decides the commercial model.

**What this phase proves:** Capability attenuation extends from content vocabulary (surfaces) to data scope (tenants). The Proof Mode infrastructure is accumulating real evidence. The deployment tool can derive multi-tenant topology from spec.

---

### Phase 3 — The Gate

*Margaux: "Opening the receiving dock."*

**What ships:** Extension admission with AI sandbox, and a complete extensible CMS.

**Extension Admission + AI Sandbox (Ed, Graham, Nyx, Sable, Theo):** This is W6 — the merger of Gap 3 and AI Sandbox. The manifest format, the capability budgets (including AI-specific budget classes from day one), the admission gate (Compute Loop), the installation pipeline (Workflow), the self-verification extensions for installed extensions, and the extension update re-admission pipeline.

Implementation detail lives in Gaps Plan v1.1 §4 and Novel Capabilities Report §4. Built as one system with these components:

**Manifest format (Graham).** Machine-readable, validated against the constellation spec grammar. Carries extension name, version, class (including AI classes), loop declarations, bus subscriptions, storage requirements, and external dependencies.

**Budget schema (Renata, Nyx).** Budget classes for standard categories (content-enhancement, payment-processing) and AI categories (ai-content-generation, ai-personalization). AI budgets include the `aiSpecific` block: data retention policy, PII exposure level, output review requirement. Budgets are declared in the host constellation spec. Published in developer documentation so extension builders know the boundaries before they start.

**Intersective budget composition (Parallax P4-F1, Sol, Nyx).** Real-world extensions don't map cleanly to single budget classes. A "content intelligence" extension that reads content, analyzes it with AI, and serves personalized recommendations spans content-enhancement and ai-personalization. The budget composition model is **intersective**: an extension declaring two budget classes gets the *intersection* of their permissions — the narrower scope on each capability dimension. Content-enhancement allows `FETCH_CONTENT_PUBLIC`; ai-personalization allows `FETCH_CONTENT_METADATA`. The intersection is `FETCH_CONTENT_METADATA` — the more restrictive contract. The extension gets the tighter boundary wherever two classes' permissions overlap. The `custom` class remains as the escape valve for extensions that genuinely cannot fit standard categories — but intersective composition handles the common case of cross-cutting extensions without requiring operator judgment. The additive (union) approach was rejected: declaring more classes would accumulate permissions, creating a capability-escalation incentive that defeats the security model.

```
// Multi-class manifest example
extensionManifest: {
  name: 'content-intelligence',
  version: '1.0.0',
  classes: ['content-enhancement', 'ai-personalization'],  // multi-class
  // Admission gate computes intersection:
  // - contracts: intersection of both classes' allowed contracts
  // - storage: stricter of the two policies
  // - externalDependencies: lower of the two maximums
}
```

**Admission gate (Graham, Sable).** A Compute Loop that compares the manifest against the budget. ADMITTED or OVER-DECLARED with specific violations named. The OVER-DECLARED response is the product — it tells the developer exactly what to fix.

**Installation pipeline (Dara).** Six-step Workflow: validate manifest → admission gate → spec merge → deployment re-derive → self-verify → activate. Each step has a failure strategy. The pipeline is the receiving dock — every extension, every time, no exceptions.

**AI audit trail (Dara).** AI-generated content carries provenance metadata through the publishing pipeline: which extension, what budget class, what input consumed, what output produced. The provenance feeds the Proof Vault.

**Scope boundary — ambient platform capabilities (Nyx).** Per Parallax finding P1-F1: the closure wall governs what the factory gives but not what the browser has. Three-tier mitigation: CSP headers (Tier 1), iframe sandboxing (Tier 2), container isolation (Tier 3). The constellation spec declares the platform-isolation requirements for each extension class alongside its capability budget.

**Deployment Tool v3 (Graham).** The tool now reads extension manifests, provisions extension loops with budget-scoped capabilities, applies platform-isolation requirements (CSP headers, iframe sandbox attributes), and re-derives topology on extension install.

**Proof Mode maturation (Nyx).** The Security Manifest now covers surfaces, tenants, and extensions. Each extension's admission, budget class, and runtime capabilities appear in the manifest. AI extensions' provenance trails feed the Verification Log.

**Deliverables:**
- Standard amendment: manifest format, budget schema (with AI classes), extension declaration in constellation spec, installation pipeline spec
- Admission gate (Compute Loop)
- Installation pipeline (Workflow)
- AI provenance metadata schema
- Deployment tool v3: extension provisioning with platform isolation
- Running demo: CMS with surfaces, tenants, and a structurally sandboxed AI content generator

**Verification gate (the ReferenceError demo):** Install an AI content generator extension. From within the AI's compute loop, attempt to access user data. Confirm: `ReferenceError` — the contract does not exist in scope. Not a 403. Not "access denied." The concept is absent. Verify: the Security Manifest shows the AI extension's admitted capabilities and prohibitions. Verify: AI-generated content carries provenance metadata. Submit an extension with an over-declared manifest (SEO plugin requesting user Vault access). Confirm: OVER-DECLARED with specific violation named.

**Kira:** This is the ecosystem demo. "Install extensions without installing risk. Install AI without installing risk." Two sentences. Both demonstrable. Both true.

**What this phase proves:** The admission model works for both conventional extensions and AI agents. The `ReferenceError` boundary is real. The Proof Mode infrastructure now covers the full security surface — surfaces, tenants, and extensions.

---

### Phase 4 — The Safety Net

*Margaux: "Installing the cameras and the undo button."*

**What ships:** Constellation Rewind and complete Proof Mode.

**Constellation Rewind (Dara, Graham).** This is W7. The Spec Version Store (append-only vault of spec versions with diffs), the compatibility checker (compares target spec's contract schemas against current Vault schemas), the Rewind pipeline (seven-step Workflow: validate target → compatibility check → snapshot current → apply spec → redeploy → self-verify → activate), and the Rewind Log integration with the Proof Vault.

**The critical property (Dara):** Rewind works because content is topology-independent. Vaults hold data. The constellation spec declares topology. Rewind rolls back topology. Content is unaffected. The Vault/Loop separation that the Standard already enforces is the load-bearing property. Rewind doesn't add this separation — it exploits it.

**Compatibility check (Graham).** The gate that makes rewind safe. If the target spec references contracts that expect schema fields the current Vaults don't have (or no longer have), the rewind aborts with specific incompatibilities named. Vault schema evolution is forward-only; topology rollback is safe only when the data schema is compatible. The compatibility check enforces this boundary.

**Deployment Tool v4 (Graham).** The tool now accepts a spec version identifier and derives topology from the historical spec. Same tool, different input source.

**Complete Proof Mode (Nyx).** With Constellation Rewind, the Proof Vault now contains: startup verification logs, periodic verification logs, spec change diffs (from the Diff Engine), extension admission records, AI provenance trails, and rewind operation records. The Security Manifest covers surfaces, tenants, extensions, and AI agents. The Proof Endpoint serves the complete forensic history of the constellation. An auditor can trace: when was this extension installed? What did it have access to? When was this spec changed? What was the previous state? Has the system ever been rewound? What triggered it?

**Deliverables:**
- Standard amendment: Spec Version Store schema, Rewind pipeline, compatibility check
- Spec Vault (append-only version store)
- Compatibility checker (Compute Loop)
- Rewind pipeline (Workflow)
- Deployment tool v4: historical spec derivation
- Complete Proof Mode: full forensic audit trail

**Verification gate:** Deploy a CMS with surfaces, tenants, and an extension. Install a new extension. Record the spec version. Rewind to the pre-installation spec. Confirm: extension topology removed, content preserved, self-verification passes. Check the Proof Vault: the rewind operation is logged with the diff, the compatibility check result, and the post-rewind verification.

**What this phase proves:** Architectural rollback is safe when content and topology are independent. The Proof Mode forensic trail is complete. The CMS can experiment with confidence.

---

### Phase 5 — Operational Maturity

*Margaux: "Hardening the building."*

**What ships:** Ephemeral exceptions, the structural verifier, and Tier 3 support.

**Ephemeral Exceptions (Dara, Wes).** This is W8. The exception-overlay format for the deployment tool, the CLI command for temporary connections with required TTL, the audit log of all exceptions. Exceptions auto-revoke after TTL expires. The deployment tool refuses to persist connections not declared in the constellation spec. The closure wall rebuilds itself on every deploy.

**Structural Verifier (Nyx, Sol).** This is W9. The distributed verification service for Tier 3 deployments. Receives an attenuated topology-only capability (resolves the verification paradox). Runs on a Clock schedule. Checks: every declared connection exists, no undeclared connections exist, every loop has the correct storage permissions. Failures emit `INTEGRITY_FAILURE` on the Signal Bus. Produces a topology map — a visual, inspectable artifact showing the closure wall.

**Deployment Tool v5 (Graham).** The tool now outputs service mesh configuration (Istio/Linkerd) for Tier 3. Supports the exception overlay. Provisions the structural verifier's attenuated capability.

**Deliverables:**
- Exception overlay format and CLI
- Structural verifier specification and implementation
- Deployment tool v5: Tier 3 support, exception overlays
- Topology map visualization

**Verification gate:** Deploy at Tier 3. Add a temporary exception with a 1-hour TTL. Verify: the connection exists. Wait 1 hour (or simulate). Verify: the connection is gone. Introduce an undeclared connection manually. Verify: the structural verifier catches it and emits `INTEGRITY_FAILURE`. Check the topology map: the wall is visible.

**What this phase proves:** The closure wall is operationally maintainable at scale. Exceptions don't erode the wall. Drift is detectable. The CMS is production-ready at Tier 3.

---

## Section 4 — The Phase Map

**Dara:** One table. Every workstream, every phase, every dependency.

| Phase | Name | Workstreams | Depends On | Effort | Produces |
|-------|------|-------------|------------|--------|----------|
| 0 | The Foundation | W1 (Capability Model) + Product Shell | None | S | Spec amendment, product documentation framework |
| 1 | The Surfaces | W3 (Content Surfaces, absorbs Gap 1) + W2 v1 (Deploy Tool) + W4 stub (Proof infra) | Phase 0 | XL | Running two-surface CMS, deployment tool, Proof Vault |
| 2 | The Walls | W5 (Multi-Tenant) + W4 maturation (Proof Mode) | Phase 1 | L | Multi-tenant CMS, Security Manifest, Proof Endpoint |
| 3 | The Gate | W6 (Extensions + AI Sandbox) | Phases 1, 2 | XL | Extensible CMS with AI sandbox, full security manifest |
| 4 | The Safety Net | W7 (Constellation Rewind) + W4 complete (full Proof Mode) | Phases 1, 2, 3 | M | Architectural rollback, forensic audit trail |
| 5 | Operational Maturity | W8 (Ephemeral Exceptions) + W9 (Structural Verifier) | Phase 1 (tool) | L | Tier 3 support, operational hardening |

**Relative effort (Parallax P2-F1).** S/M/L/XL are relative, not absolute — time estimates remain uncalibrated. Phase 0 is S (spec document + product shell, no code). Phase 1 is XL (the deployment tool is the largest single engineering artifact, plus Content Surfaces and Proof Vault infrastructure). Phase 2 is L (multi-tenant is well-understood mechanism, moderate integration). Phase 3 is XL (admission gate + installation pipeline + AI budgets + ambient capability mitigations). Phase 4 is M (rewind pipeline is a composition of existing primitives — deployment tool + Proof Vault + self-verification). Phase 5 is L (structural verifier for Tier 3 is new engineering; ephemeral exceptions are a deployment tool feature).

**Threading:** The deployment tool evolves through every phase (v1 → v2 → v3 → v4 → v5). Proof Mode accumulates through Phases 1–4 (infrastructure → partial manifest → full manifest → forensic trail). Self-verification checks accumulate at every phase.

**Parallelism:** Phase 0's spec and product tracks run in parallel. Phase 5 has no dependency on Phases 2–4 (only on Phase 1's deployment tool) — it can begin as early as Phase 2 if Tier 3 deployment is a priority. The critical path is Phase 0 → 1 → 2 → 3 → 4.

---

## Section 5 — What the Plan Produces at Each Phase

**Kira:** Each phase produces a demonstrable capability. Each demo is a sales conversation.

| Phase | Demo | Buyer Conversation |
|-------|------|-------------------|
| 1 | Two-surface CMS: public site can't query drafts | "Your public site doesn't filter out your drafts. It doesn't know they exist." |
| 2 | Multi-tenant CMS with Proof Endpoint | "Tenant isolation at the database engine level. Here's the proof — one URL." |
| 3 | Extension + AI sandbox with ReferenceError demo | "Install AI without installing risk. The AI tried to access user data and got told the concept doesn't exist." |
| 4 | Constellation Rewind: install, break, undo | "Try the extension. If it breaks things, undo the architecture. Content untouched." |
| 5 | Topology map showing the closure wall at Tier 3 | "Here's your security model, live, inspectable, structurally verified every hour." |

**Renata:** The cumulative pitch after Phase 4: "A CMS where the API shapes what each consumer can ask, tenant isolation is proven at the database level, extensions and AI operate in a structural sandbox, the security posture proves itself, and the architecture has an undo button." That's not a feature list. That's a category.

**Feature-first pitch track (Parallax P2-F2).** The security-first pitch reaches enterprise security buyers. A feature-first pitch reaches content teams: "Define exactly what each consumer — your website, your app, your AI, your analytics — can see and do. Multi-tenant out of the box. Add extensions with one command. Undo any system change without losing content. One spec file runs at any scale." The security properties are the *reason* these features work. The features are the *reason* buyers care. Product marketing leads with features; technical marketing leads with security. Both are true. They reach different audiences.

---

## Section 6 — Cross-Cutting Concerns

**Sable:** Three concerns appear in all three source documents. The master plan states each once.

### The Information-Theoretic Bound

Capability attenuation constrains what a consumer can *access*. It does not constrain what a consumer can *infer*. An analytics surface returning aggregate word counts per category leaks information about individual articles (a category with one article has a word count that *is* the article's word count). A tenant-scoped query with timing analysis can infer the existence of other tenants' data. An extension within its admitted capabilities can observe response patterns and infer content structure.

The bound is real, unavoidable (Shannon), and applies at every layer of the plan: Content Surfaces (query vocabulary doesn't prevent inference from aggregates), Multi-Tenant (RLS doesn't prevent timing-based inference), Extension Admission (admitted capabilities don't prevent inference from observed behavior), AI Sandbox (AI agents are specifically good at inference).

**The plan's position:** Content Surfaces, tenant isolation, and extension admission provide structural access control. They do not provide differential privacy. The distinction matters for regulated environments and should be documented in the product's security model. Research-class, not engineering-class.

### Developer Experience

The capability model adds friction at every scale. A developer on a conventional CMS writes a database query and gets data. A developer on Loop MMT writes a contract schema, declares it in the spec, provisions the capability, wires the routing table, and then gets data. The security properties are real. The developer experience cost is also real.

**The plan's position:** Developer experience tooling is not optional — it's load-bearing. CLI generators for manifest templates, a `loopctl` command suite, local development mode with relaxed enforcement, educational error messages (the OVER-DECLARED response names the violation and suggests the fix). The product shell (Phase 0) and deployment tool (Phase 1) must embed DX as a first-class concern, not a post-ship polish. Each phase's deliverables include developer-facing documentation and CLI extensions. The fortress must be one people want to live in.

### The Phase 0 Risk

Everything depends on the capability model spec amendment. Ten features across three documents and six phases all build on the same API. The cost of a mistake at Phase 0 propagates everywhere. The Phase 0 verification gate — a Super RCR on the spec amendment — is not ceremonial. It's the most consequential review in the entire plan. Get the three properties right (confinement, attenuation, revocation) and the plan flows. Get them wrong and every phase inherits the error.

---

## Section 7 — Risks

**Ed:** Eight risks. The original five plus three from the Parallax. Each is real and none is fatal.

**Risk 1 — Complexity accumulation (Theo).** By Phase 4, the constellation spec declares: loop types, bus contracts, routing tables, pipeline specs, content surfaces, tenant configuration, extension manifests, capability budgets, AI-specific constraints, and rewind configuration. The spec is the product's center of gravity — and it's getting heavy. Mitigation: the deployment tool and CLI absorb the complexity. The operator writes a high-level declaration; the tool derives the details. Spec weight is managed, not avoided.

**Risk 2 — Market education (Renata).** "Structural enforcement is better than policy enforcement" assumes a buyer who thinks in those terms. Most don't. Each phase's demo must translate structural properties into business outcomes, not architectural properties. "Your AI can't leak user data" (not "the closure wall attenuates capabilities"). "Your auditor reads one URL" (not "the self-verification system produces an append-only log"). The product speaks business. The architecture speaks structure. They never share a sentence.

**Risk 3 — Tier 1 viability (Graham).** The plan prioritizes Tier 2+ (container deployments). Tier 1 (single-file JavaScript) gets the closure wall through the scope chain, but Content Surfaces, multi-tenant isolation, and the deployment tool don't apply at Tier 1. A single-file CMS is the entry point for small teams. If Phase 1 requires containers, the small-team market is excluded. Mitigation: the deployment tool is Phase 1 infrastructure, but the Content Surface declaration and self-verification work at Tier 1 via the scope chain. Tier 1 gets structural content isolation. Tier 2+ gets the deployment-enforced version. Same spec, different enforcement — per the v1.2 plan's tiering principle.

**Risk 4 — Phase coupling (Dara).** Phases 2–4 build on each other. A delay in Phase 2 (multi-tenant) delays Phase 3 (extensions) which delays Phase 4 (rewind). The critical path has no slack. Mitigation: Phase 5 (operational maturity) is independent and can absorb development capacity during critical-path delays. The deployment tool's architecture is reviewed between Phases 2 and 3 (Parallax P4-F3) to prevent accretion before the input vocabulary expands.

**Risk 5 — Scope of Phase 0 (Ed).** The capability model spec amendment is one session of document production. But "one session" has been wrong before. The Super RCR on the amendment may surface issues that require multiple revision cycles. The capability model must define confinement, attenuation, and revocation precisely enough that five subsequent phases can build on the definitions without ambiguity. Mitigation: Phase 0 is spec-only — no code, no tooling, no dependencies. It can take as long as it takes without blocking parallel product-shell work.

**Risk 6 — Time-to-parity (Parallax P2-F1).** The plan's Phase 3 (extensions + AI) reaches approximate feature parity with incumbent CMS platforms. Phases 0–2 produce a product that is technically differentiated but feature-inferior to Contentful, Sanity, and Strapi. The incumbent ships features every sprint during the build. Mitigation: differentiation, not parity, is the commercial strategy. The Phase 2 enterprise MVP (multi-tenant + Proof Mode) occupies a market position no incumbent holds. Chasing feature parity is the wrong race. Owning the structural-security category is the right one.

**Risk 7 — Multi-class budget edge cases (Parallax P4-F1).** The intersective composition model handles the common case (cross-cutting extensions). Edge cases remain: what if the intersection of two budget classes produces zero allowed contracts? (The extension declared incompatible classes.) What if the intersection produces a capability set too narrow to function? (The extension under-declared.) Mitigation: the admission gate reports intersective results before refusing — "your declared classes [content-enhancement, payment-processing] produce an intersection with no shared contracts. Declare a single class or use the custom class." Educational refusal.

**Risk 8 — Proof Vault as liability (Parallax P4-F2).** An append-only forensic log is a compliance asset and a legal discovery target. In litigation, the Proof Vault's history is subpoena-able. An operator who enables Proof Mode creates an audit trail that serves regulators and plaintiffs equally. Mitigation: this is a documentation concern, not an architecture concern. The product documentation must state clearly that Proof Mode creates a forensic record. The operator decides whether to enable it. The default should be off with a clear explanation of what turning it on means.

---

## Section 8 — Four Corners

**FBD (Floor).** The plan's floor is consolidation itself. Three overlapping documents with implicit dependencies is a structural risk — the wrong build order produces rework, the overlapping workstreams produce duplicate effort, and the cross-document dependencies produce integration surprises. The master plan resolves all three: ordered phases, collapsed workstreams, explicit dependency graph. The floor for the CMS product is Sol's capability model — structural enforcement over policy enforcement, at every layer, at every phase.

**FWW(C) (Ceiling).** Margaux's phase names carry the story: Foundation, Surfaces, Walls, Gate, Safety Net, Operational Maturity. The grocery store metaphor extends through all six phases. The demos are visceral — the `ReferenceError`, the single-URL security audit, the architectural undo button. The plan reads like a build journal, not a spec.

**STP (Show the Path).** Every phase traces to its source documents, its dependency chain, its verification gate, and its demo script. The collapse is documented (Sol's analysis, post-collapse inventory table). The dependency graph is explicit (ASCII diagram + phase map table). The risks are named with mitigations. No hidden state.

**SNR (Signal-to-Noise).** Eight sections. The plan does not reproduce implementation details from the source documents — it references them. Each phase names its deliverables, verification gates, and what-this-proves claims. The cross-cutting concerns section states each recurring theme once. The plan is a sequencing document, not a specification document. The specifications live in their source documents.

---

## Section 9 — Provenance and Attribution

| Contribution | Board Member(s) | Role |
|-------------|-----------------|------|
| Workstream collapse (12 → 9) | Sol | Structural analysis — Content Surfaces ⊃ Gap 1, AI Sandbox ⊃ Gap 3 |
| Dependency graph | Dara | Temporal sequencing — critical path identification |
| Proof Mode repositioning | Nyx | Threading Proof Mode as accumulating infrastructure |
| Deployment tool threading | Graham | Tool evolution (v1 → v5) across phases |
| Deployment tool architecture | Graham | Four-component architecture (parser, validator, generator, verifier) — Parallax P1-F1 |
| L2+L4 merge | Wes | Deployment tool + storage enforcement as one build unit |
| Phase 0 parallel tracks | Renata, Vee | Product shell alongside spec work |
| Phase naming | Margaux | Foundation, Surfaces, Walls, Gate, Safety Net, Operational Maturity |
| Demo-as-verification-gate | Kira | Commercial utility from technical verification |
| Enterprise sequencing | Theo | Multi-tenant before extensions (commercial + dependency alignment) |
| Grocery store extension | Chen Wei | Six-phase metaphor from prior two-phase metaphor |
| RCR chair | Dara | Sequencing is her domain — temporal, operational, erosion-aware |
| Information-theoretic bound | Sable | Stated once, referenced everywhere |
| Phase 0 risk | Ed | Scope concern on the highest-leverage deliverable |
| Intersective budget composition | Sol, Nyx | Multi-class extension model — Parallax P4-F1 |
| Revenue gate identification | Renata | Phase 2 as enterprise MVP — Parallax P3-F1 |
| Feature-first pitch track | Renata, Kira | Dual marketing strategy — Parallax P2-F2 |
| Proof Vault retention policy | Dara, Nyx | Jurisdiction-aware defaults — Parallax P4-F2 |
| Parallax angles | Wes | Builder, Incumbent, Investor, Operator-at-Phase-3 |

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

One four-angle Parallax pass (Builder, Incumbent, Investor, Operator-at-Phase-3). Nine findings. Four HIGH incorporated into v1.1. Four MEDIUM acknowledged as notes. One LOW acknowledged.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| P1-F1 | HIGH | Deployment tool underspecified relative to centrality | INCORPORATED — four-component architecture added to Phase 1 |
| P1-F2 | MEDIUM | DX layer has no specification | ACKNOWLEDGED — DX specification added to Phase 0 deliverables |
| P2-F1 | HIGH | No timeline, even relative | INCORPORATED — S/M/L/XL relative effort added to Phase Map |
| P2-F2 | MEDIUM | Competitive positioning assumes security-aware buyers | ACKNOWLEDGED — feature-first pitch track added to Section 5 |
| P3-F1 | HIGH | No revenue phase identified | INCORPORATED — Phase 2 named as revenue gate |
| P3-F2 | MEDIUM | Resource-model-agnostic | ACKNOWLEDGED — resource model assumption added to About |
| P4-F1 | HIGH | Multi-class extensions unaddressed | INCORPORATED — intersective budget composition added to Phase 3 |
| P4-F2 | MEDIUM | Proof Vault has no retention policy | ACKNOWLEDGED — configurable retention with jurisdiction presets added to Phase 1 |
| P4-F3 | LOW | No deployment tool refactoring gate | ACKNOWLEDGED — review gate added between Phase 2 and Phase 3 |

---

[PULSE] Master CMS Implementation Plan v1.1: Heavy RCR on sequencing (convergence) + one Parallax pass (4 angles, 9 findings, 4 incorporated, 4 acknowledged, 1 acknowledged). 12 workstreams collapsed to 9. 6 phases. 8 risks named. 3 cross-cutting concerns. 3 source documents consolidated.

[DRIVES: Floor, Ceiling, Depth, Mesh, Ground, Equalization, Constraint — 7/7]

---

*Loop MMT™ · Multi-Module Theory · CMS Master Implementation Plan v1.1*
*Heavy RCR: Dara chaired. Convergence after collision.*
*Parallax: 4 angles (Builder, Incumbent, Investor, Operator-at-Phase-3). 9 findings, 4 incorporated.*
*Source documents: Distributed Closure Wall v1.2 + CMS Capability Gaps v1.1 + Novel Capabilities Report v1*
*© 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0*
