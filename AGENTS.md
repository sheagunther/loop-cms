# Loop CMS — AGENTS.md
## Build Guide for Claude Code · Foundry Protocol v1

---

## Project

Loop CMS is a single-file CMS (Node.js) that starts with one command, scales from SQLite to Kubernetes, and refuses to lose data. The existing build (`loopcms.js`, ~1,441 lines) covers Phase 1a core. This guide covers completing Phase 1 — the first shippable product.

**Full specification:** `cms-master-implementation-plan-v1_13.md` (1,580 lines). This file is the map. The Plan is the territory. When in doubt, read the Plan.

---

## Tech Stack & Conventions

- **Runtime:** Node.js (current build). Plan spec says Deno/Bun — the existing build uses Node.js with `node:sqlite`. Keep Node.js.
- **Storage:** SQLite via `node:sqlite` (DatabaseSync). Synchronous API.
- **Auth:** JWT (short-lived, 15min) + refresh tokens (7 days) + bcrypt. Local auth only at Tier 1.
- **Dependencies:** `bcryptjs`, `jsonwebtoken`. Minimize external deps — single-file architecture.
- **Style:** Single file. No framework. No build step. Functions, not classes. Config tables, not if/else chains.
- **Security from line one:** Every content write sanitizes (FBD-CS1). Every request authenticates (FBD-AU1). Every admin action checks RBAC (FBD-RB1). No exceptions.
- **Test framework:** Node.js built-in test runner (`node:test`) + `node:assert`.

---

## Architecture — Three Core Patterns

### 1. CONTRACT_CONFIGS
Every operation is a config entry. Adding a new operation = adding a config row. No per-operation handler code.

```
CONTRACT_CONFIGS = {
  FETCH_CONTENT_AGGREGATE: { type:'read', surface:'required', sanitize:false, rateLimit:'public', rbacPermission:'content:read', proofLevel:'normal' },
  STORE_CONTENT:           { type:'write', surface:'required', sanitize:true,  rateLimit:'admin', rbacPermission:'content:write', proofLevel:'audit' },
  PUBLISH_CONTENT:         { type:'write', surface:'required', sanitize:false, rateLimit:'admin', rbacPermission:'content:publish', proofLevel:'audit' },
  STORE_MEDIA:             { type:'write', surface:'required', sanitize:'media', rateLimit:'media', rbacPermission:'media:upload', proofLevel:'audit' },
  SEARCH_CONTENT:          { type:'read', surface:'required', sanitize:false, rateLimit:'public', rbacPermission:'content:read', proofLevel:'normal' },
  API_FETCH_CONTENT:       { type:'read', surface:'required', sanitize:false, rateLimit:'api', rbacPermission:'content:read', proofLevel:'normal' },
  DELETE_CONTENT:          { type:'write', surface:'required', sanitize:false, rateLimit:'admin', rbacPermission:'content:write', proofLevel:'audit' },
  PREVIEW_EFFECTS:         { type:'read', surface:'required', sanitize:false, rateLimit:'admin', rbacPermission:'content:read', proofLevel:'normal' },
  FETCH_REVISIONS:         { type:'read', surface:'required', sanitize:false, rateLimit:'admin', rbacPermission:'content:read', proofLevel:'normal' },
}
```

### 2. processRequest Pipeline
Six phases. Not middleware. A function body. Order is compiled, not configured.

```
function processRequest(req) {
  const config = CONTRACT_CONFIGS[req.contractId];
  const identity = reqAuthenticate(req, config);    // FBD-AU1
  const permissions = reqAuthorize(identity, config); // FBD-RB1
  const validated = reqValidate(req, config);
  const sanitized = reqSanitize(validated, config);  // FBD-CS1
  const result = reqExecute(sanitized, identity, config, req);
  reqLog(result, identity, config, req);             // FBD-LI1, FBD-RH1
  return result;
}
```

### 3. Presentation Loops
Everything that serves content — admin UI, REST API, sitemap, RSS, Atom — is a Presentation Loop reading from Content Surfaces via contracts. One data path. RBAC, sanitization, rate limiting apply uniformly.

---

## Implementation Sequence

The existing build has Phase 1a core. Complete in this order:

### Already Built (verify, don't rebuild)
1. ✅ `processRequest` pipeline (6 phases)
2. ✅ `CONTRACT_CONFIGS` (9 types)
3. ✅ SQLite schema (content, revisions, auth, proof vault, media, FTS5, rate limits)
4. ✅ JWT + bcrypt + RBAC (4 roles, 7 permissions)
5. ✅ HTML sanitization (FBD-CS1)
6. ✅ Proof Vault with append-only triggers + hash chain (FBD-LI1)
7. ✅ Content integrity checksums (FBD-CI1)
8. ✅ Rate limiting (FBD-RL1)
9. ✅ Admin UI (5 buttons)
10. ✅ Content Weather
11. ✅ Constellation Fingerprint
12. ✅ RSS + Sitemap as Presentation Loops
13. ✅ FTS5 search
14. ✅ Ghost Links (basic)
15. ✅ Content revision history (FBD-RH1)
16. ✅ CSRF tokens (FBD-CF1)
17. ✅ First-run experience

### To Build (Phase 1b — differentiation features)

**Priority 1 — Webhooks (content event bus):**
- Event types: `content.created`, `content.updated`, `content.published`, `content.unpublished`, `content.deleted`, `media.uploaded`, `media.deleted`
- Webhook registration: declared in config or stored in DB. Per-registration HMAC-SHA256 secret.
- Delivery: HTTP POST + JSON payload + HMAC signature header. Retry 3x with exponential backoff (immediate, 30s, 5min). Auto-disable after 10 consecutive failures.
- FBD-WH1: webhook payloads carry event metadata + content ID only, never full content body.
- Internal consumers: cache invalidation, search index updates, sitemap regen, RSS updates all use same event stream.

**Priority 2 — Time Travel Surfaces:**
- Add optional `at` parameter to `FETCH_CONTENT_AGGREGATE` and `API_FETCH_CONTENT`.
- When present, `reqExecute` reads from `content_revisions WHERE created_at <= :at ORDER BY created_at DESC LIMIT 1` instead of live content table.
- API response carries `X-Time-Travel-Horizon` header (oldest available revision timestamp).
- Admin UI: date picker on Preview button.
- RBAC: editorial surface requires `content:read`. Public surface temporal queries configurable (default: editorial only).

**Priority 3 — Content Seismograph:**
- `PREVIEW_EFFECTS` contract: takes content ID + proposed state transition, returns effect list.
- Reads: webhook subscription list, relationship index (if any), cache key registry, Presentation Loop manifest.
- Returns: downstream effects as structured list (webhook targets, cache keys to invalidate, feed updates, etc.).
- Admin UI: expandable panel on Publish button showing effects before confirmation.
- Target: <100ms (reads in-memory/in-process data).

**Priority 4 — Déjà Vu (content similarity detection):**
- On draft save, async: run title + opening paragraph through FTS5 search index.
- Return similar existing content (title, date, overlap percentage).
- Admin UI: sidebar notification when similarity > 0.7 threshold. Dismissible. Only shown once per draft.
- Not blocking — advisory. The draft saves immediately. The similarity check is a non-blocking follow-up.

**Priority 5 — Stranger Walk (basic):**
- Clock-triggered (or on-demand via `GET /api/admin/stranger-walk`).
- Fetches every URL in the sitemap. Checks image references.
- Produces Proof Vault entry: "Stranger Walk complete. N URLs checked. M issues found."
- FBD-SW1: threshold breach (configurable, default 5% errors) triggers DEGRADED state transition.

### To Verify/Fix (existing build gaps)
- Content relationships + taxonomies (reference/taxonomy field types, FBD-CR1 referential integrity)
- Headless REST API endpoints (`/api/content/:type`, `/api/content/:type/:slug`, `/api/search`, `/api/taxonomies/:name`)
- Response caching (in-memory LRU, FBD-CA1 invalidation on write)
- SEO slug validation (FBD-SEO1: no slug → no publish to public surface)
- Redirect engine (redirect table, 3-hop cap)
- System lifecycle state machine (NOMINAL/DEGRADED/SAFE_MODE/RECOVERY, FBD-LM1)
- Watchdog/health monitor (liveness heartbeat, graduated response)
- Output encoding (FBD-OE1)
- Bounded execution timeouts (FBD-TE1)
- Sanitization dual-verification (FBD-SV1)
- Publishing workflow state machine (DRAFT→IN_REVIEW→SCHEDULED→PUBLISHED→ARCHIVED)
- Deployment dry-run (FBD-DD1) — may defer for Phase 1 MVP
- Media EXIF stripping, SVG sanitization (FBD-MD1)

---

## Interface Contracts

### HTTP Route → Contract Mapping
```
GET  /api/content/:type           → FETCH_CONTENT_AGGREGATE
GET  /api/content/:type/:slug     → API_FETCH_CONTENT
GET  /api/content/:type/:id/revisions → FETCH_REVISIONS
GET  /api/search?q=...            → SEARCH_CONTENT
POST /api/content                 → STORE_CONTENT
PUT  /api/content/:id             → STORE_CONTENT (update)
POST /api/content/:id/publish     → PUBLISH_CONTENT
DELETE /api/content/:id           → DELETE_CONTENT
POST /api/content/:id/preview-effects → PREVIEW_EFFECTS
POST /api/media                   → STORE_MEDIA
GET  /sitemap.xml                 → Presentation Loop (public surface)
GET  /feed.xml                    → Presentation Loop (RSS, public surface)
GET  /atom.xml                    → Presentation Loop (Atom, public surface)
```

### Database Schema (core tables)
```sql
-- content (live state)
content(id, title, slug, body, status, content_type, author_id, seo_meta_title, seo_meta_description, seo_canonical_url, seo_og_image, seo_no_index, seo_structured_data, checksum, created_at, updated_at)

-- content_revisions (FBD-RH1 — every write creates a revision)
content_revisions(id, content_id, revision_number, title, slug, body, status, author_id, fields_modified, created_at)

-- proof_vault (append-only, hash chain — FBD-LI1)
proof_vault(id, entry_type, entry_data, actor, prev_hash, entry_hash, created_at)

-- auth tables
users(id, username, password_hash, role, created_at)
refresh_tokens(id, user_id, token_hash, expires_at, created_at)
csrf_tokens(token, user_id, created_at)

-- media
media(id, filename, original_name, mime_type, size, checksum, uploader_id, created_at)

-- webhooks (new)
webhooks(id, url, events, secret, enabled, consecutive_failures, created_at)

-- FTS5 virtual table
content_fts(title, body, slug)

-- rate_limits
rate_limits(key, count, window_start)
```

---

## Coding Constraints

1. **Single file.** Everything in `loopcms.js`. No splitting.
2. **Security from line one.** Input sanitization on every content write. Auth on every capability-bearing request. RBAC on every admin action.
3. **Test with every module.** Write test stubs first. Fill them in as you build. Tests before code where possible.
4. **Config tables, not if/else.** New capability = new config entry in CONTRACT_CONFIGS + handler in reqExecute.
5. **Proof Vault everything.** Security events, content events, system events → append-only log with hash chain.
6. **System Voice.** Error messages teach, not scold. "We cleaned up some HTML in your title — script tags aren't allowed in content." Present tense for state, past tense for events.
7. **Commit at every checkpoint.** Each commit: what was built, what's next, what's broken.

---

## First-Demo Milestone

**The Walk-Through Chapter 1 test:** Download one file. Run one command. Open browser. See admin panel with five buttons. Create an article, paste content with a script tag (sanitized with notification), upload an image, press Publish. Seismograph panel shows downstream effects. Article is live. Sitemap updated. RSS feed includes it. Webhook fires. Total time: under ninety seconds.

The existing build is close to this. The missing pieces: Seismograph preview panel and webhook delivery.

---

## Decomposition — Parallel Build Units

If using multiple Claude Code instances:

| Unit | Dependencies | Can Parallel? |
|------|-------------|---------------|
| Webhook system (event bus + delivery) | Core (exists) | Yes — independent |
| Time Travel (temporal query modifier) | Content revisions (exists) | Yes — independent |
| Seismograph (PREVIEW_EFFECTS) | Webhook list (needs webhook unit) | After webhooks |
| Déjà Vu (similarity detection) | FTS5 search (exists) | Yes — independent |
| Stranger Walk (self-navigation) | Sitemap (exists) | Yes — independent |
| REST API hardening | Core (exists) | Yes — independent |

**Interface contract:** All units read/write through `processRequest`. All units use `CONTRACT_CONFIGS`. No unit bypasses the pipeline. Integration works because every unit uses the same typed interfaces.

---

*AGENTS.md · Loop CMS · Foundry Protocol v1 · 22 April 2026*
*Map, not territory. Full spec: cms-master-implementation-plan-v1_13.md*
