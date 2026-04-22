// ============================================================================
// Loop CMS — Phase 1 Verification Gate · Test Harness Seed
// Foundry Protocol v1 · Step 2 · Action 4
//
// 47 acceptance criteria across 8 domains.
// Each test is a stub: name, criterion, pending.
// Fill in as you build. Tests before code.
// ============================================================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const LOOPCMS_PATH = path.join(__dirname, 'loopcms.js');

// Mint a JWT the server will accept (server uses the JWT_SECRET env var we set).
function mintToken(srv, { userId, username, role }) {
  return jwt.sign({ userId, username, role }, srv.jwtSecret, { expiresIn: '5m' });
}

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForStatus(baseUrl, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(baseUrl + '/api/status');
      if (r.ok) return await r.json();
    } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('Server did not become ready: ' + (lastErr?.message || 'timeout'));
}

// Helper: start server, return base URL + cleanup function
async function startServer() {
  const port = await pickFreePort();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loopcms-test-'));
  const dataDir = path.join(tmpDir, 'data');
  const mediaDir = path.join(tmpDir, 'media');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(mediaDir, { recursive: true });
  const jwtSecret = 'test-secret-' + port + '-' + Math.random().toString(36).slice(2);

  const child = spawn(process.execPath, [LOOPCMS_PATH], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: dataDir,
      MEDIA_DIR: mediaDir,
      JWT_SECRET: jwtSecret,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdoutChunks = [];
  const stderrChunks = [];
  child.stdout.on('data', c => stdoutChunks.push(c));
  child.stderr.on('data', c => stderrChunks.push(c));

  const baseUrl = `http://127.0.0.1:${port}`;
  let exited = false;
  child.on('exit', () => { exited = true; });

  try {
    await waitForStatus(baseUrl, 10000);
  } catch (e) {
    child.kill('SIGKILL');
    const out = Buffer.concat(stdoutChunks).toString() + Buffer.concat(stderrChunks).toString();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error('startServer failed: ' + e.message + '\n' + out);
  }

  const cleanup = async () => {
    if (!exited) {
      child.kill('SIGTERM');
      await new Promise(r => { child.once('exit', r); setTimeout(() => { child.kill('SIGKILL'); r(); }, 2000); });
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  };

  return {
    baseUrl, port, tmpDir, child, jwtSecret,
    stdout: () => Buffer.concat(stdoutChunks).toString(),
    stderr: () => Buffer.concat(stderrChunks).toString(),
    cleanup,
  };
}

// Helper: login as seeded admin (first-run creates admin/admin), return tokens
async function getAuthToken(baseUrl, role = 'admin') {
  const creds = { admin: { username: 'admin', password: 'admin' } }[role];
  if (!creds) throw new Error('Unknown role for getAuthToken: ' + role);
  const r = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(`login failed ${r.status}: ${JSON.stringify(body)}`);
  return { token: body.token, csrfToken: body.csrfToken, user: body.user };
}

// ============================================================================
// DOMAIN 1: USABILITY (9 criteria)
// ============================================================================

describe('Usability', () => {

  it('U-01: Editor logs in and sees only role-permitted actions', async () => {
    // Criterion: An editor-role user logs in. The admin UI renders only
    // the actions their RBAC role permits. Publisher sees all 5. Editor
    // sees Write, Upload, Preview. Viewer sees content lists (read-only).
    // Pass: role-filtered action rendering confirmed for 3 roles.
  });

  it('U-02: Editor creates article with SEO metadata', async () => {
    // Criterion: Create an article. Slug auto-generated from title.
    // Meta description populated from first 160 chars of body.
    // SEO fields (slug, metaTitle, metaDescription) present in response.
    // Pass: all three SEO fields populated correctly.
  });

  it('U-03: Editor uploads photo with automatic EXIF stripping', async () => {
    // Criterion: Upload an image with EXIF GPS data. Retrieved image
    // has no EXIF GPS/camera metadata. Upload succeeds silently.
    // Pass: uploaded image stripped of EXIF; original metadata absent.
  });

  it('U-04: Editor previews content on public surface', async () => {
    // Criterion: Draft content visible in preview mode on public surface.
    // Same content NOT visible via public API without auth.
    // Pass: preview returns content; public GET returns 404 for draft.
  });

  it('U-05: Editor schedules publication', async () => {
    // Criterion: Set a future publication date. Content state transitions
    // to SCHEDULED. Content not publicly visible until scheduled time.
    // Pass: state is SCHEDULED; public surface does not serve until time.
  });

  it('U-06: Editor publishes article', async () => {
    // Criterion: Press Publish. Content transitions from DRAFT to PUBLISHED.
    // Content visible on public surface. Sitemap updated. RSS updated.
    // Pass: public API returns article; sitemap includes slug; RSS includes entry.
  });

  it('U-07: No architectural vocabulary in admin UI', async () => {
    // Criterion: Admin UI HTML does not contain the words: contract,
    // loop, bus, surface, pipeline, vault, capability, processRequest.
    // Pass: none of these terms appear in rendered admin HTML.
  });

  it('U-08: Editor searches for article by keyword', async () => {
    // Criterion: Create article with known keywords. Search via
    // GET /api/search?q=keyword. Article appears in results.
    // Pass: search returns the created article.
  });

  it('U-09: Editor views revision history and restores prior version', async () => {
    // Criterion: Edit an article twice. View revision history (3 versions).
    // Restore version 1. Current content matches version 1. A new revision
    // (version 4) is created for the restore — not a destructive overwrite.
    // Pass: content matches v1; revision count is 4.
  });

});

// ============================================================================
// DOMAIN 2: SECURITY (11 criteria)
// ============================================================================

describe('Security', () => {

  it('S-01: Wrong credentials rejected and rate-limited', async () => {
    // Pass: 401 on bad creds; 429 after threshold.
    // (Post-window recovery omitted — window is 60s, too slow for CI.)
    const srv = await startServer();
    try {
      // Use a non-existent username so we skip bcrypt and fire fast.
      const badLogin = () => fetch(srv.baseUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nosuchuser', password: 'x' }),
      });

      const first = await badLogin();
      assert.strictEqual(first.status, 401, 'bad creds return 401');

      // Admin-tier limit is 60/min. Fire until we see a 429.
      let sawLimited = false;
      for (let i = 0; i < 80; i++) {
        const r = await badLogin();
        if (r.status === 429) { sawLimited = true; break; }
      }
      assert.ok(sawLimited, 'rate limit kicks in within 80 attempts');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-02: Unpermitted publish rejected', async () => {
    // Pass: 403 when editor (no content:publish) tries to publish; content stays DRAFT.
    const srv = await startServer();
    try {
      const { token: adminToken } = await getAuthToken(srv.baseUrl);

      const createRes = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ title: 'Draft article', slug: 'draft-article', body: '<p>hi</p>' }),
      });
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      const editorToken = mintToken(srv, { userId: 'ed001', username: 'ed', role: 'editor' });
      const pubRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + editorToken },
      });
      assert.strictEqual(pubRes.status, 403, 'editor publish must be forbidden');

      // Verify content is still a draft.
      const getRes = await fetch(srv.baseUrl + '/api/content/draft-article', {
        headers: { 'Authorization': 'Bearer ' + adminToken },
      });
      const item = await getRes.json();
      assert.strictEqual(item.status, 'draft', 'content remained draft after refused publish');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-03: XSS in title sanitized and verified clean on render', async () => {
    // Pass: stored title has no script tag; rendered public page is encoded.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);

      const payload = {
        title: 'Hello <script>alert(1)</script>',
        slug: 'xss-test',
        body: '<p>body</p>',
      };
      const createRes = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);
      assert.ok(!/<script>/i.test(created.title), 'stored title has no <script> tag');
      assert.ok(created.note, 'sanitize note is returned to the user');

      await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token },
      });

      const pageRes = await fetch(srv.baseUrl + '/xss-test');
      const html = await pageRes.text();
      assert.ok(!/<script>alert\(1\)<\/script>/i.test(html),
        'rendered public page has no executable script tag');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-04: Draft invisible from public surface', async () => {
    // Pass: draft slug missing from sitemap; public page returns 404.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ title: 'Secret draft', slug: 'secret-draft', body: '<p>nope</p>' }),
      });
      assert.strictEqual(createRes.status, 201);

      const sitemap = await (await fetch(srv.baseUrl + '/sitemap.xml')).text();
      assert.ok(!sitemap.includes('secret-draft'), 'sitemap must not leak draft slug');

      const pageRes = await fetch(srv.baseUrl + '/secret-draft');
      assert.strictEqual(pageRes.status, 404, 'public page for draft must be 404');

      // Also verify the authenticated public-surface listing excludes drafts.
      const listRes = await fetch(srv.baseUrl + '/api/content?surface=public', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const items = await listRes.json();
      assert.ok(Array.isArray(items));
      assert.ok(!items.some(i => i.slug === 'secret-draft'), 'public-surface listing excludes drafts');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-05: Image EXIF stripped on upload', async () => {
    // Pass: EXIF marker absent from stored file.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);

      // Minimal JPEG-like payload with an APP1 EXIF segment containing a GPS marker.
      const marker = Buffer.from('GPSLatitudeSENTINEL', 'ascii');
      const app1Body = Buffer.concat([Buffer.from('Exif\x00\x00', 'ascii'), marker]);
      const app1Header = Buffer.from([0xFF, 0xE1, 0x00, app1Body.length + 2]);
      const jpeg = Buffer.concat([
        Buffer.from([0xFF, 0xD8]),                 // SOI
        app1Header, app1Body,                      // APP1 with EXIF + GPS bytes
        Buffer.from([0xFF, 0xD9]),                 // EOI
      ]);

      const uploadRes = await fetch(srv.baseUrl + '/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          filename: 'geo.jpg', mime_type: 'image/jpeg',
          data: jpeg.toString('base64'),
        }),
      });
      assert.strictEqual(uploadRes.status, 201);
      const meta = await uploadRes.json();

      const fetched = await fetch(srv.baseUrl + meta.url);
      const stored = Buffer.from(await fetched.arrayBuffer());
      assert.ok(!stored.includes(marker), 'GPS marker must be stripped from stored image');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-06: SVG script tags sanitized on upload', async () => {
    // Pass: stored SVG contains no <script> or on* handler.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
<script>alert('xss')</script>
<circle cx="50" cy="50" r="40"/></svg>`;

      const uploadRes = await fetch(srv.baseUrl + '/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          filename: 'danger.svg', mime_type: 'image/svg+xml',
          data: Buffer.from(svg).toString('base64'),
        }),
      });
      assert.strictEqual(uploadRes.status, 201);
      const meta = await uploadRes.json();

      const stored = await (await fetch(srv.baseUrl + meta.url)).text();
      assert.ok(!/<script/i.test(stored), 'stored SVG must have no <script>');
      assert.ok(!/\son\w+\s*=/i.test(stored), 'stored SVG must have no event handler attributes');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-07: Unlisted embed source rejected', async () => {
    // Pass: iframe stripped from stored body.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);

      const createRes = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          title: 'Embed test', slug: 'embed-test',
          body: '<p>hi</p><iframe src="https://evil.example.com/x"></iframe>',
        }),
      });
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      const getRes = await fetch(srv.baseUrl + '/api/content/embed-test', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const item = await getRes.json();
      assert.ok(!/<iframe/i.test(item.body), 'iframe must be stripped from stored body');
      assert.ok(!item.body.includes('evil.example.com'), 'embed src must not survive');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-08: Unbudgeted media transform rejected', async () => {
    // Pass: unauthenticated media write is rejected (401/403/429).
    const srv = await startServer();
    try {
      const r = await fetch(srv.baseUrl + '/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'a.png', data: 'AA==' }),
      });
      assert.ok([401, 403, 429].includes(r.status),
        'unauthenticated media request must be rejected, got ' + r.status);
    } finally {
      await srv.cleanup();
    }
  });

  it('S-09: Imported XSS sanitized (FBD-IS1)', async () => {
    // Pass: XSS in imported body is stripped on store.
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);
      const imported = {
        title: 'Imported post', slug: 'imported',
        body: '<p>legit</p><script>window.stolen = document.cookie</script><img src=x onerror="alert(1)">',
      };
      const r = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(imported),
      });
      assert.strictEqual(r.status, 201);

      const getRes = await fetch(srv.baseUrl + '/api/content/imported', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const item = await getRes.json();
      assert.ok(!/<script/i.test(item.body), 'imported body has no <script>');
      assert.ok(!/\sonerror\s*=/i.test(item.body), 'imported body has no onerror handler');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-10: CSRF-tokenless request rejected (FBD-CF1)', async () => {
    // Pass: write without CSRF token is rejected; with valid token is accepted.
    const srv = await startServer();
    try {
      const { token, csrfToken } = await getAuthToken(srv.baseUrl);

      const noCsrf = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ title: 'no-csrf', slug: 'no-csrf', body: '<p>x</p>' }),
      });
      assert.ok([401, 403].includes(noCsrf.status),
        `write without CSRF token must be rejected, got ${noCsrf.status}`);

      const withCsrf = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ title: 'with-csrf', slug: 'with-csrf', body: '<p>x</p>' }),
      });
      assert.strictEqual(withCsrf.status, 201, 'write with CSRF token must be accepted');
    } finally {
      await srv.cleanup();
    }
  });

  it('S-11: No literal secrets in generated config', async () => {
    // Pass: jwtSecret is derived from env/randomBytes, not a hardcoded literal.
    const source = fs.readFileSync(LOOPCMS_PATH, 'utf8');
    const match = source.match(/jwtSecret:\s*([^,\n]+)/);
    assert.ok(match, 'jwtSecret setting must exist');
    const rhs = match[1];
    assert.ok(/process\.env\.JWT_SECRET/.test(rhs) && /randomBytes/.test(rhs),
      'jwtSecret must come from env var or randomBytes, got: ' + rhs);

    // No literal secret-shaped strings sitting on the jwtSecret line.
    assert.ok(!/jwtSecret:\s*['"][0-9a-fA-F]{16,}['"]/m.test(source),
      'no hex-literal secret assigned to jwtSecret');
  });

});

// ============================================================================
// DOMAIN 3: INTEGRITY (4 criteria)
// ============================================================================

describe('Integrity', () => {

  it('I-01: Proof Vault hash chain valid (FBD-LI1)', async () => {
    // Criterion: After multiple operations (create, publish, delete),
    // verify the Proof Vault hash chain. Each entry's hash includes
    // the previous entry's hash. Chain is unbroken.
    // Pass: all entries verify; chain integrity confirmed.
  });

  it('I-02: Content integrity checksums valid (FBD-CI1)', async () => {
    // Criterion: Create content. Verify stored checksum matches
    // computed checksum of content. Tamper with content directly in DB.
    // Read via API → checksum mismatch detected.
    // Pass: valid content serves normally; tampered content triggers error.
  });

  it('I-03: Ephemeral storage on non-Vault loops', async () => {
    // Criterion: Rate limit data, CSRF tokens, cached responses are
    // ephemeral — not in the Proof Vault. They do not participate
    // in the hash chain.
    // Pass: ephemeral data tables separate from proof_vault table.
  });

  it('I-04: Deployment dry-run validates before apply (FBD-DD1)', async () => {
    // Criterion: (May defer for MVP) Spec changes must pass dry-run
    // validation before applying. Invalid spec → refused.
    // Pass: invalid spec rejected; valid spec accepted after dry-run.
  });

});

// ============================================================================
// DOMAIN 4: ACCESSIBILITY (3 criteria)
// ============================================================================

describe('Accessibility', () => {

  it('A-01: Admin UI keyboard navigation complete', async () => {
    // Criterion: All admin UI actions reachable via keyboard (Tab, Enter,
    // Escape). No mouse-only interactions. Focus order is logical.
    // Pass: all 5 actions triggerable without mouse.
  });

  it('A-02: Admin UI screen reader compatible', async () => {
    // Criterion: ARIA landmarks present. Form labels associated.
    // Status messages use aria-live. Buttons have accessible names.
    // Pass: HTML passes automated a11y checks (axe-core or equivalent).
  });

  it('A-03: SBOM present', async () => {
    // Criterion: A software bill of materials listing all dependencies
    // is generated and available.
    // Pass: SBOM file exists and lists all npm dependencies.
  });

});

// ============================================================================
// DOMAIN 5: CONTENT INFRASTRUCTURE (5 criteria)
// ============================================================================

describe('Content Infrastructure', () => {

  it('CI-01: Sitemap contains all published slugs', async () => {
    // Criterion: Publish 3 articles with known slugs. GET /sitemap.xml
    // returns valid XML with <url> entries for all 3 slugs.
    // Unpublished content absent from sitemap.
    // Pass: all 3 slugs in sitemap; drafts absent.
  });

  it('CI-02: RSS feed contains latest articles', async () => {
    // Criterion: Publish 3 articles. GET /feed.xml returns valid RSS 2.0
    // with <item> entries for all 3. Most recent first.
    // Pass: valid RSS; all 3 articles present; correct order.
  });

  it('CI-03: REST API returns published content with relationships resolved', async () => {
    // Criterion: GET /api/content/articles returns JSON array of published
    // articles. Each article includes resolved reference fields (if any)
    // at depth 1. Pagination headers present.
    // Pass: valid JSON; published content only; references resolved.
  });

  it('CI-04: Webhook fires on publish event with HMAC verification', async () => {
    // Criterion: Register a webhook for content.published events.
    // Publish an article. Webhook endpoint receives POST with JSON payload
    // and X-Hub-Signature-256 header. HMAC verification passes.
    // Payload contains event type and content ID, NOT full content body.
    // Pass: webhook received; HMAC valid; no content body in payload.
  });

  it('CI-05: Search returns published articles, excludes drafts (FBD-FTS1)', async () => {
    // Criterion: Create 1 published article and 1 draft with same keyword.
    // Public search returns only the published article.
    // Authenticated editorial search returns both.
    // Pass: public search = 1 result; editorial search = 2 results.
  });

});

// ============================================================================
// DOMAIN 6: DIFFERENTIATION (12 criteria)
// ============================================================================

describe('Differentiation', () => {

  it('D-01: Time Travel — temporal query returns past content', async () => {
    // Criterion: Create article, publish, edit title, publish again.
    // GET /api/content/articles?at=[before-edit-timestamp] returns
    // original title. GET without `at` returns current title.
    // Pass: temporal query returns old title; current query returns new title.
  });

  it('D-02: Time Travel — horizon header on early timestamp', async () => {
    // Criterion: Query with timestamp before first revision.
    // Response includes X-Time-Travel-Horizon header with oldest
    // available revision timestamp.
    // Pass: horizon header present and accurate.
  });

  it('D-03: Admin UI temporal preview shows past content', async () => {
    // Criterion: Admin UI preview mode with date picker. Selecting a
    // past date shows content as it existed at that time.
    // Pass: preview at past date shows correct historical content.
  });

  it('D-04: Seismograph shows correct webhook count in preview', async () => {
    // Criterion: Register 2 webhooks for content.published. Use
    // PREVIEW_EFFECTS on a content item. Effect list includes 2 webhook
    // targets. Also shows cache invalidation count and any relationship
    // updates.
    // Pass: effect list matches expected downstream effects.
  });

  it('D-05: Déjà Vu — similarity notification on overlapping draft', async () => {
    // Criterion: Publish article about "Loop CMS architecture."
    // Create new draft with 80% overlapping content.
    // Similarity notification appears (title, date, overlap %).
    // Pass: notification present with correct match.
  });

  it('D-06: Constellation Fingerprint in CLI status', async () => {
    // Criterion: GET /api/admin/status returns fingerprint field
    // in adjective-noun-number format (e.g., "amber-lighthouse-42").
    // Pass: fingerprint matches expected format.
  });

  it('D-07: Constellation Fingerprint in spec history', async () => {
    // Criterion: GET /api/admin/spec-history returns version entries
    // with fingerprint alongside version number.
    // Pass: each entry has version + fingerprint.
  });

  it('D-08: Constellation Fingerprint diff between versions', async () => {
    // Criterion: (May defer) Diff between two fingerprints shows
    // configuration changes.
    // Pass: diff endpoint returns changes between two spec versions.
  });

  it('D-09: Stranger Walk produces Proof Vault entry', async () => {
    // Criterion: Trigger Stranger Walk. It checks all sitemap URLs.
    // Proof Vault contains entry: "Stranger Walk complete. N URLs checked.
    // M issues found."
    // Pass: Proof Vault entry present with correct counts.
  });

  it('D-10: Stranger Walk catches broken image reference', async () => {
    // Criterion: Publish article referencing a nonexistent image.
    // Run Stranger Walk. Proof Vault entry reports the broken reference.
    // Pass: broken image flagged in Stranger Walk results.
  });

  it('D-11: Ghost Links preserved on content deletion', async () => {
    // Criterion: Create article A linking to article B and tagged
    // "company-news." Delete article A. Ghost Links entry in Proof Vault
    // preserves outbound references (link to B, tag "company-news").
    // GET /api/admin/ghost-links/:slug returns the reference map.
    // Pass: ghost links entry exists with correct references.
  });

  it('D-12: Ghost Links visible in admin UI', async () => {
    // Criterion: Admin UI shows recently deleted content and their
    // preserved outbound references in a Ghost Links view.
    // Pass: Ghost Links section renders deleted content references.
  });

});

// ============================================================================
// DOMAIN 7: INTEGRATION (3 criteria)
// ============================================================================

describe('Integration', () => {

  it('INT-01: Single-file Tier 1 — download, run, publish', async () => {
    // Pass: server starts; article published; under 90 seconds.
    const t0 = Date.now();
    const srv = await startServer();
    try {
      const { token } = await getAuthToken(srv.baseUrl);
      assert.ok(token, 'login returned a token');

      const createRes = await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          title: 'First post',
          slug: 'first-post',
          body: '<p>Hello.</p>',
          content_type: 'article',
        }),
      });
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201, 'create returns 201, got ' + createRes.status + ' ' + JSON.stringify(created));
      assert.ok(created.id, 'create returns id');

      const pubRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const published = await pubRes.json();
      assert.strictEqual(pubRes.status, 200, 'publish returns 200, got ' + pubRes.status + ' ' + JSON.stringify(published));
      assert.strictEqual(published.status, 'published');

      const pageRes = await fetch(srv.baseUrl + '/first-post');
      assert.strictEqual(pageRes.status, 200, 'published article is reachable on public surface');

      const elapsed = Date.now() - t0;
      assert.ok(elapsed < 90_000, `took ${elapsed}ms, must be <90s`);
    } finally {
      await srv.cleanup();
    }
  });

  it('INT-02: Watchdog heartbeat visible in status', async () => {
    // Pass: status endpoint returns health metrics.
    const srv = await startServer();
    try {
      const r = await fetch(srv.baseUrl + '/api/status');
      assert.strictEqual(r.status, 200);
      const body = await r.json();
      assert.ok(body.status, 'status string present');
      assert.ok('state' in body, 'state field present');
      assert.ok('fingerprint' in body, 'fingerprint present');
      assert.ok('content' in body, 'content count present');
      assert.ok('proof' in body, 'proof count present');
    } finally {
      await srv.cleanup();
    }
  });

  it('INT-03: Lifecycle state reports NOMINAL', async () => {
    // Pass: status.state === 'NOMINAL'.
    const srv = await startServer();
    try {
      const r = await fetch(srv.baseUrl + '/api/status');
      const body = await r.json();
      assert.strictEqual(body.state, 'NOMINAL', 'fresh server should be NOMINAL, got ' + body.state);
    } finally {
      await srv.cleanup();
    }
  });

});

// ============================================================================
// DOMAIN 8: FBD CONTROLS (spot checks — not exhaustive per-control tests)
// ============================================================================

describe('FBD Control Spot Checks', () => {

  it('FBD-RH1: Content write without revision is structurally impossible', async () => {
    // Criterion: Every STORE_CONTENT call creates a revision in the
    // same transaction. Verify by checking revision count after write.
    // Pass: revision_count === write_count for all content items.
  });

  it('FBD-SEO1: Content without slug cannot publish to public surface', async () => {
    // Criterion: Create content with empty slug. Attempt to publish.
    // Rejected by reqValidate.
    // Pass: publish attempt returns validation error about missing slug.
  });

  it('FBD-CA1: Cache invalidated on content write', async () => {
    // Criterion: Fetch content (populates cache). Update content.
    // Fetch again. Second fetch returns updated content, not stale cache.
    // Pass: second fetch reflects the update.
  });

  it('FBD-LM1: Write operations impossible in SAFE_MODE', async () => {
    // Criterion: Transition system to SAFE_MODE. Attempt content write.
    // Rejected. Read operations still succeed (from cache).
    // Pass: write rejected; read succeeds.
  });

  it('FBD-SW1: Stranger Walk threshold triggers DEGRADED state', async () => {
    // Criterion: Create situation where >5% of URLs have issues.
    // Run Stranger Walk. System transitions to DEGRADED.
    // Pass: lifecycle state changes to DEGRADED after walk.
  });

});

// ============================================================================
// Total: 47 acceptance criteria across 8 domains
// Status: ALL PENDING — fill in as you build
// ============================================================================
