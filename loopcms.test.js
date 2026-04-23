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
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

// Override to run the tests against a different build (e.g. the bundled
// dist/loopcms.js) without editing the harness:  LOOPCMS_PATH=... node --test
const LOOPCMS_PATH = process.env.LOOPCMS_PATH
  ? path.resolve(process.env.LOOPCMS_PATH)
  : path.join(__dirname, 'loopcms.js');

// Seed a CSRF token directly into the server's sqlite DB for a given user id.
// Used to exercise authenticated writes for minted (non-admin) JWTs.
function seedCsrf(srv, userId) {
  const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
  try {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    db.prepare("INSERT OR REPLACE INTO csrf_tokens (token, user_id, created_at) VALUES (?,?,datetime('now'))").run(csrfToken, userId);
    return csrfToken;
  } finally {
    db.close();
  }
}

// Mint a JWT the server will accept (server uses the JWT_SECRET env var we set).
function mintToken(srv, { userId, username, role }) {
  return jwt.sign({ userId, username, role }, srv.jwtSecret, { expiresIn: '5m' });
}

// fetch wrapper that sets Authorization + X-CSRF-Token for authenticated writes.
function authed(auth, init = {}) {
  const headers = { ...(init.headers || {}) };
  if (auth?.token) headers['Authorization'] = 'Bearer ' + auth.token;
  if (auth?.csrfToken) headers['X-CSRF-Token'] = auth.csrfToken;
  return { ...init, headers };
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
    // Pass: admin UI must filter buttons by role (data-permission attrs or JS role checks).
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const hasRoleGating =
        /data-permission\s*=/.test(html) ||
        /data-role\s*=/.test(html) ||
        /\.role\s*===?\s*['"](editor|publisher|viewer)['"]/.test(html) ||
        /hasPermission\s*\(/.test(html);
      assert.ok(hasRoleGating,
        'admin UI must gate actions by role (no data-permission attrs, data-role attrs, role comparisons, or hasPermission() calls found)');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-admin-ui-script-parses: admin UI inline <script> is valid JS and exposes onclick handlers', async () => {
    // Regression guard: the admin UI is a single backtick template string on
    // the server. A stray "\'" pattern inside that template rendered as an
    // unescaped apostrophe in the client script, which threw a parse error
    // and left every onclick handler with "ReferenceError: X is not defined".
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const match = html.match(/<script>([\s\S]*?)<\/script>/);
      assert.ok(match, 'admin page has an inline <script> block');
      const script = match[1];

      // (1) The script block itself must parse as browser-grade JavaScript.
      assert.doesNotThrow(() => new Function(script),
        'admin UI <script> must parse as valid JavaScript');

      // (2) Every function referenced from onclick / onchange in the HTML must
      // exist as a top-level declaration AND be exported to window so the
      // inline handlers can resolve it from global scope.
      const handlerNames = new Set();
      for (const m of html.matchAll(/on(?:click|change)="([a-zA-Z_$][\w$]*)\s*\(/g)) {
        handlerNames.add(m[1]);
      }
      assert.ok(handlerNames.size >= 5, 'admin HTML has inline handlers');
      for (const name of handlerNames) {
        const declRe = new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\s*\\(`);
        assert.ok(declRe.test(script),
          `handler "${name}" referenced from an onclick is not declared in the admin script`);
        const exposeRe = new RegExp(`window\\.${name}\\s*=\\s*${name}\\b`);
        assert.ok(exposeRe.test(script),
          `handler "${name}" is declared but not published to window (inline onclick cannot reach it)`);
      }

      // (3) Simulate the browser's DOM eval path: every JS single-quoted string
      // literal in the script that contains on*="..." attributes is the text
      // that will become innerHTML at runtime. Decode each literal, pull out
      // the static on-event attribute values, and parse them as JS. If
      // someone writes "\\'" inside such a string, the literal evaluates to
      // "\'" and the browser's attribute-JS parser chokes.
      const firstJsString = (s, startAt = 0) => {
        const q = s.indexOf("'", startAt);
        if (q < 0) return null;
        let i = q + 1;
        while (i < s.length) {
          if (s[i] === '\\') { i += 2; continue; }
          if (s[i] === "'") return { raw: s.slice(q, i + 1), end: i + 1 };
          i++;
        }
        return null;
      };
      const staticAttrRe = /\son(?:click|change|input|submit|keyup|keydown)="([^"]*)"/g;
      for (const line of script.split('\n')) {
        // Heuristic: only consider lines that build HTML with inline handlers.
        if (!/on(?:click|change|input|submit|keyup|keydown)=/.test(line)) continue;
        let pos = 0, lit;
        while ((lit = firstJsString(line, pos))) {
          pos = lit.end;
          let decoded;
          try { decoded = (0, eval)(lit.raw); } catch (e) { continue; }
          if (typeof decoded !== 'string') continue;
          let m;
          while ((m = staticAttrRe.exec(decoded))) {
            const attrJs = m[1];
            // Skip handlers that are built via JS string concat across the
            // surrounding literals — they aren't complete JS on their own.
            if (attrJs.includes("'+") || attrJs.includes("+'") || attrJs.includes('"+') || attrJs.includes('+"')) continue;
            assert.doesNotThrow(
              () => new Function('return (' + attrJs + ')'),
              `static inline handler would fail to parse at click-time: ${JSON.stringify(attrJs)}`
            );
          }
        }
      }
    } finally {
      await srv.cleanup();
    }
  });

  it('U-admin-ui-no-cache: /admin response is not cached', async () => {
    // If /admin lacks Cache-Control, browsers may keep a stale JS body after
    // a server-side fix — reintroducing the "doLogin is not defined" symptom
    // until the user hard-reloads. no-store prevents that.
    const srv = await startServer();
    try {
      const r = await fetch(srv.baseUrl + '/admin');
      const cc = r.headers.get('cache-control') || '';
      assert.ok(/no-store|no-cache/.test(cc),
        'Cache-Control must prevent stale admin HTML, got: ' + JSON.stringify(cc));
    } finally {
      await srv.cleanup();
    }
  });

  it('U-02: Editor creates article with SEO metadata', async () => {
    // Pass: slug auto-generated from title; meta_title + meta_description populated.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const body = 'This is the opening paragraph of the article and it is long enough to fill a meta description. It keeps going. And going.';
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hello World Seo Test', body: `<p>${body}</p>` }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);
      assert.strictEqual(created.slug, 'hello-world-seo-test', 'slug auto-generated from title');

      const getRes = await fetch(srv.baseUrl + `/api/content/${created.slug}`, authed(auth));
      const item = await getRes.json();
      assert.ok(item.meta_title, 'meta_title populated');
      assert.ok(item.meta_description, 'meta_description populated');
      assert.ok(item.meta_description.length > 0 && item.meta_description.length <= 160,
        'meta_description is present and <= 160 chars, got length ' + item.meta_description.length);
    } finally {
      await srv.cleanup();
    }
  });

  it('U-03: Editor uploads photo with automatic EXIF stripping', async () => {
    // Pass: EXIF marker absent from served file (same mechanism as S-05).
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const marker = Buffer.from('CameraMakerSENTINEL', 'ascii');
      const app1Body = Buffer.concat([Buffer.from('Exif\x00\x00', 'ascii'), marker]);
      const app1Header = Buffer.from([0xFF, 0xE1, 0x00, app1Body.length + 2]);
      const jpeg = Buffer.concat([
        Buffer.from([0xFF, 0xD8]), app1Header, app1Body, Buffer.from([0xFF, 0xD9]),
      ]);

      const uploadRes = await fetch(srv.baseUrl + '/api/media', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'photo.jpg', mime_type: 'image/jpeg',
          data: jpeg.toString('base64'),
        }),
      }));
      assert.strictEqual(uploadRes.status, 201);
      const meta = await uploadRes.json();
      const stored = Buffer.from(await (await fetch(srv.baseUrl + meta.url)).arrayBuffer());
      assert.ok(!stored.includes(marker), 'camera/EXIF metadata must be absent from stored image');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-04: Editor previews content on public surface', async () => {
    // Pass: authenticated fetch sees draft; unauthenticated public page returns 404.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Preview Only', slug: 'preview-only', body: '<p>wip</p>' }),
      }));
      assert.strictEqual(createRes.status, 201);

      const previewRes = await fetch(srv.baseUrl + '/api/content/preview-only', authed(auth));
      assert.strictEqual(previewRes.status, 200, 'authenticated preview returns draft');
      const previewed = await previewRes.json();
      assert.strictEqual(previewed.status, 'draft');

      const publicRes = await fetch(srv.baseUrl + '/preview-only');
      assert.strictEqual(publicRes.status, 404, 'public page for draft must be 404');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-04b: Admin cookie renders drafts on the public surface', async () => {
    // Preview link in admin.html navigates to /<slug> in a new tab. The auth
    // cookie set on login must travel with that navigation and cause the
    // public handler to serve the draft. Anonymous visitors still 404.
    const srv = await startServer();
    try {
      // Login directly to capture the Set-Cookie header.
      const loginRes = await fetch(srv.baseUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' }),
      });
      assert.strictEqual(loginRes.status, 200);
      const setCookie = loginRes.headers.get('set-cookie') || '';
      assert.match(setCookie, /^token=/, 'login sets a token cookie');
      assert.match(setCookie, /HttpOnly/i, 'token cookie is HttpOnly');
      assert.match(setCookie, /SameSite=Lax/i, 'token cookie is SameSite=Lax');
      const authed2 = await loginRes.json();

      await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authed2.token,
          'X-CSRF-Token': authed2.csrfToken,
        },
        body: JSON.stringify({ title: 'Preview Me', slug: 'preview-me', body: '<p>wip</p>' }),
      });

      // Anonymous: still 404.
      const anon = await fetch(srv.baseUrl + '/preview-me');
      assert.strictEqual(anon.status, 404, 'anonymous visitor cannot see draft');

      // With the cookie the login handed back, the public page renders.
      const cookieVal = setCookie.split(';')[0]; // "token=..."
      const preview = await fetch(srv.baseUrl + '/preview-me', {
        headers: { 'Cookie': cookieVal },
      });
      assert.strictEqual(preview.status, 200, 'admin cookie renders the draft');
      const html = await preview.text();
      assert.ok(/Preview Me/.test(html), 'draft title visible in rendered page');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-04c: Edit link in article footer renders only for content:write users', async () => {
    // Footer of /<slug> shows "· Edit -> /admin#write/<slug>" when (and only
    // when) the visitor's auth cookie carries content:write.
    const srv = await startServer();
    try {
      const loginRes = await fetch(srv.baseUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' }),
      });
      const setCookie = loginRes.headers.get('set-cookie') || '';
      const cookieVal = setCookie.split(';')[0];
      const a = await loginRes.json();

      const c = await (await fetch(srv.baseUrl + '/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + a.token, 'X-CSRF-Token': a.csrfToken },
        body: JSON.stringify({ title: 'Edit linkable', slug: 'edit-linkable', body: '<p>x</p>' }),
      })).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + a.token, 'X-CSRF-Token': a.csrfToken },
      });

      const anonHtml = await (await fetch(srv.baseUrl + '/edit-linkable')).text();
      assert.ok(!/href="\/admin#write/.test(anonHtml),
        'no Edit link in footer for anonymous viewer');
      assert.ok(/Powered by/.test(anonHtml), 'baseline footer still rendered');

      const adminHtml = await (await fetch(srv.baseUrl + '/edit-linkable', {
        headers: { 'Cookie': cookieVal },
      })).text();
      assert.match(adminHtml, /href="\/admin#write\/edit-linkable">Edit<\/a>/,
        'Edit link present and points to /admin#write/<slug> for admin');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-05: Editor schedules publication', async () => {
    // Pass: scheduled content has status 'scheduled' and is not publicly visible before time.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Future Post', slug: 'future-post', body: '<p>later</p>' }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const schedRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: future }),
      }));
      assert.strictEqual(schedRes.status, 200, 'schedule request accepted');
      const result = await schedRes.json();
      assert.strictEqual(result.status, 'scheduled', 'status must be scheduled, got ' + result.status);

      const publicRes = await fetch(srv.baseUrl + '/future-post');
      assert.strictEqual(publicRes.status, 404, 'scheduled content must not be publicly served before time');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-06: Editor publishes article', async () => {
    // Pass: after publish, content is on public API, sitemap, and RSS feed.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Shippable', slug: 'shippable', body: '<p>ready</p>' }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      const pubRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, authed(auth, {
        method: 'POST',
      }));
      assert.strictEqual(pubRes.status, 200);

      const publicRes = await fetch(srv.baseUrl + '/shippable');
      assert.strictEqual(publicRes.status, 200, 'public page returns 200 after publish');

      const sitemap = await (await fetch(srv.baseUrl + '/sitemap.xml')).text();
      assert.ok(sitemap.includes('shippable'), 'sitemap includes newly published slug');

      const rss = await (await fetch(srv.baseUrl + '/feed.xml')).text();
      assert.ok(rss.includes('Shippable'), 'RSS feed includes newly published title');
    } finally {
      await srv.cleanup();
    }
  });

  it('U-07: No architectural vocabulary in admin UI', async () => {
    // Pass: user-visible admin HTML has no banned architectural terms.
    const srv = await startServer();
    try {
      const raw = await (await fetch(srv.baseUrl + '/admin')).text();
      // Strip <style>, <script>, and URL query params — we're checking user-facing copy.
      const visible = raw
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\?[a-zA-Z_][\w=&%-]*/g, '');
      const banned = ['contract', 'processRequest', 'pipeline', 'capability', 'bus'];
      for (const word of banned) {
        const re = new RegExp('\\b' + word + '\\b', 'i');
        assert.ok(!re.test(visible), `banned term "${word}" appears in user-facing admin HTML`);
      }
    } finally {
      await srv.cleanup();
    }
  });

  it('U-08: Editor searches for article by keyword', async () => {
    // Pass: a just-created article is findable via /api/search.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Zephyrine unique keyword article',
          slug: 'zephyrine', body: '<p>findable</p>',
        }),
      }));

      const searchRes = await fetch(srv.baseUrl + '/api/search?q=zephyrine&surface=editorial',
        authed(auth));
      const results = await searchRes.json();
      assert.ok(Array.isArray(results));
      assert.ok(results.some(r => r.slug === 'zephyrine'),
        'search must return the newly created article, got ' + JSON.stringify(results.map(r => r.slug)));
    } finally {
      await srv.cleanup();
    }
  });

  it('U-09: Editor views revision history and restores prior version', async () => {
    // Pass: 3 revisions after 2 edits; restore yields a 4th revision matching v1.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'V1', slug: 'versioned', body: '<p>v1 body</p>' }),
      }));
      const created = await createRes.json();

      await fetch(srv.baseUrl + `/api/content/${created.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'V2', body: '<p>v2 body</p>' }),
      }));
      await fetch(srv.baseUrl + `/api/content/${created.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'V3', body: '<p>v3 body</p>' }),
      }));

      const histRes = await fetch(srv.baseUrl + '/api/content/versioned?revisions=true', authed(auth));
      const withHist = await histRes.json();
      assert.ok(Array.isArray(withHist.revisions), 'revisions array present');
      assert.strictEqual(withHist.revisions.length, 3, 'three revisions after create + 2 edits');

      const v1 = withHist.revisions.find(r => r.revision_number === 1);
      assert.ok(v1, 'revision 1 present');
      const restoreRes = await fetch(srv.baseUrl + `/api/content/${created.id}/restore/1`, authed(auth, {
        method: 'POST',
      }));
      assert.strictEqual(restoreRes.status, 200, 'restore endpoint returns 200');

      const afterRes = await fetch(srv.baseUrl + '/api/content/versioned?revisions=true', authed(auth));
      const after = await afterRes.json();
      assert.strictEqual(after.title, v1.title, 'restored title matches v1');
      assert.strictEqual(after.revisions.length, 4, 'restore creates a new revision (non-destructive)');
    } finally {
      await srv.cleanup();
    }
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
      const admin = await getAuthToken(srv.baseUrl);

      const createRes = await fetch(srv.baseUrl + '/api/content', authed(admin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Draft article', slug: 'draft-article', body: '<p>hi</p>' }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      // Editor: mint JWT + seed matching CSRF so the publish fails on RBAC, not CSRF.
      const editor = {
        token: mintToken(srv, { userId: 'ed001', username: 'ed', role: 'editor' }),
        csrfToken: seedCsrf(srv, 'ed001'),
      };
      const pubRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, authed(editor, {
        method: 'POST',
      }));
      assert.strictEqual(pubRes.status, 403, 'editor publish must be forbidden');

      // Verify content is still a draft.
      const getRes = await fetch(srv.baseUrl + '/api/content/draft-article', authed(admin));
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
      const auth = await getAuthToken(srv.baseUrl);

      const payload = {
        title: 'Hello <script>alert(1)</script>',
        slug: 'xss-test',
        body: '<p>body</p>',
      };
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);
      assert.ok(!/<script>/i.test(created.title), 'stored title has no <script> tag');
      assert.ok(created.note, 'sanitize note is returned to the user');

      await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, authed(auth, {
        method: 'POST',
      }));

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
      const auth = await getAuthToken(srv.baseUrl);
      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Secret draft', slug: 'secret-draft', body: '<p>nope</p>' }),
      }));
      assert.strictEqual(createRes.status, 201);

      const sitemap = await (await fetch(srv.baseUrl + '/sitemap.xml')).text();
      assert.ok(!sitemap.includes('secret-draft'), 'sitemap must not leak draft slug');

      const pageRes = await fetch(srv.baseUrl + '/secret-draft');
      assert.strictEqual(pageRes.status, 404, 'public page for draft must be 404');

      // Also verify the authenticated public-surface listing excludes drafts.
      const listRes = await fetch(srv.baseUrl + '/api/content?surface=public', authed(auth));
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
      const auth = await getAuthToken(srv.baseUrl);

      // Minimal JPEG-like payload with an APP1 EXIF segment containing a GPS marker.
      const marker = Buffer.from('GPSLatitudeSENTINEL', 'ascii');
      const app1Body = Buffer.concat([Buffer.from('Exif\x00\x00', 'ascii'), marker]);
      const app1Header = Buffer.from([0xFF, 0xE1, 0x00, app1Body.length + 2]);
      const jpeg = Buffer.concat([
        Buffer.from([0xFF, 0xD8]),                 // SOI
        app1Header, app1Body,                      // APP1 with EXIF + GPS bytes
        Buffer.from([0xFF, 0xD9]),                 // EOI
      ]);

      const uploadRes = await fetch(srv.baseUrl + '/api/media', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'geo.jpg', mime_type: 'image/jpeg',
          data: jpeg.toString('base64'),
        }),
      }));
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
      const auth = await getAuthToken(srv.baseUrl);

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
<script>alert('xss')</script>
<circle cx="50" cy="50" r="40"/></svg>`;

      const uploadRes = await fetch(srv.baseUrl + '/api/media', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'danger.svg', mime_type: 'image/svg+xml',
          data: Buffer.from(svg).toString('base64'),
        }),
      }));
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
      const auth = await getAuthToken(srv.baseUrl);

      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Embed test', slug: 'embed-test',
          body: '<p>hi</p><iframe src="https://evil.example.com/x"></iframe>',
        }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201);

      const getRes = await fetch(srv.baseUrl + '/api/content/embed-test', authed(auth));
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
      const auth = await getAuthToken(srv.baseUrl);
      const imported = {
        title: 'Imported post', slug: 'imported',
        body: '<p>legit</p><script>window.stolen = document.cookie</script><img src=x onerror="alert(1)">',
      };
      const r = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imported),
      }));
      assert.strictEqual(r.status, 201);

      const getRes = await fetch(srv.baseUrl + '/api/content/imported', authed(auth));
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
    // Pass: every proof entry's prev_hash matches the previous entry's entry_hash.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Chain', slug: 'chain', body: '<p>x</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, { method: 'DELETE' }));

      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        const rows = db.prepare('SELECT id, prev_hash, entry_hash FROM proof_vault ORDER BY id ASC').all();
        assert.ok(rows.length >= 3, 'proof vault has multiple entries (got ' + rows.length + ')');
        for (let i = 1; i < rows.length; i++) {
          assert.strictEqual(rows[i].prev_hash, rows[i - 1].entry_hash,
            `chain breaks at entry ${rows[i].id}: prev_hash ${rows[i].prev_hash} !== previous entry_hash ${rows[i - 1].entry_hash}`);
        }
      } finally { db.close(); }
    } finally {
      await srv.cleanup();
    }
  });

  it('I-02: Content integrity checksums valid (FBD-CI1)', async () => {
    // Pass: read returns _integrityOk=true for untouched, false for tampered.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Integrity', slug: 'integrity', body: '<p>legit</p>' }),
      }))).json();

      const cleanRes = await fetch(srv.baseUrl + '/api/content/integrity', authed(auth));
      const clean = await cleanRes.json();
      assert.strictEqual(clean._integrityOk, true, 'untouched content verifies');

      // Tamper with the body directly in the DB.
      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        db.prepare('UPDATE content SET body=? WHERE id=?').run('<p>TAMPERED</p>', c.id);
      } finally { db.close(); }

      const tRes = await fetch(srv.baseUrl + '/api/content/integrity', authed(auth));
      const t = await tRes.json();
      assert.strictEqual(t._integrityOk, false, 'tampered content is flagged');
    } finally {
      await srv.cleanup();
    }
  });

  it('I-03: Ephemeral storage on non-Vault loops', async () => {
    // Pass: rate_limits and csrf_tokens live in separate tables and do not
    // appear inside proof_vault rows.
    const srv = await startServer();
    try {
      // Log in + hit endpoints to populate rate_limits and csrf_tokens.
      await getAuthToken(srv.baseUrl);
      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
        for (const t of ['rate_limits', 'csrf_tokens', 'proof_vault']) {
          assert.ok(names.includes(t), `${t} table exists`);
        }
        const vault = db.prepare('SELECT entry_type, entry_data FROM proof_vault').all();
        const joined = JSON.stringify(vault);
        assert.ok(!/csrf_token/i.test(joined), 'csrf tokens not written to proof vault');
        assert.ok(!/rate_limit/i.test(joined), 'rate-limit keys not written to proof vault');
      } finally { db.close(); }
    } finally {
      await srv.cleanup();
    }
  });

  it('I-04: Deployment dry-run validates before apply (FBD-DD1)', async () => {
    // Pass: a dry-run endpoint validates spec changes before apply.
    // AGENTS.md marks this as "may defer for Phase 1 MVP".
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const r = await fetch(srv.baseUrl + '/api/admin/dry-run', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: { invalid: true } }),
      }));
      assert.ok(r.status !== 404, 'dry-run endpoint exists, got 404');
      const body = await r.json();
      assert.ok('valid' in body || 'errors' in body, 'response reports validity or errors');
    } finally {
      await srv.cleanup();
    }
  });

});

// ============================================================================
// DOMAIN 4: ACCESSIBILITY (3 criteria)
// ============================================================================

describe('Accessibility', () => {

  it('A-01: Admin UI keyboard navigation complete', async () => {
    // Pass: nav actions are real <button>s (not div-onclick); no mouse-only patterns.
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const navButtons = html.match(/<button[^>]*class="nav-btn[^"]*"[^>]*>/g) || [];
      assert.ok(navButtons.length >= 5, 'at least 5 tabbable nav buttons, got ' + navButtons.length);
      assert.ok(!/<div[^>]*\bonclick=/.test(html),
        'no <div onclick=> (breaks keyboard + screen reader)');
    } finally {
      await srv.cleanup();
    }
  });

  it('A-02: Admin UI screen reader compatible', async () => {
    // Pass: ARIA landmarks present; form labels associated; status uses aria-live.
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const hasLandmarks = /<(main|nav|aside|header)\b/.test(html) || /role="(main|navigation|banner)"/.test(html);
      assert.ok(hasLandmarks, 'at least one ARIA landmark element or role');

      // Every <input> should have an associated label (for= or wrapping <label>).
      const inputs = html.match(/<input[^>]*id="([^"]+)"[^>]*>/g) || [];
      const unlabeled = [];
      for (const tag of inputs) {
        const id = tag.match(/id="([^"]+)"/)[1];
        const hasFor = new RegExp(`<label[^>]*for="${id}"`).test(html);
        if (!hasFor) unlabeled.push(id);
      }
      assert.strictEqual(unlabeled.length, 0,
        'inputs without associated <label for>: ' + unlabeled.join(', '));

      assert.ok(/aria-live=/.test(html), 'aria-live region for status messages');
    } finally {
      await srv.cleanup();
    }
  });

  it('A-03: SBOM present', async () => {
    // Pass: repository ships an SBOM or the server exposes one.
    const sbomFiles = ['sbom.json', 'sbom.spdx.json', 'sbom.cdx.json', 'bom.json'];
    const found = sbomFiles.find(f => fs.existsSync(path.join(__dirname, f)));
    if (found) {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, found), 'utf8'));
      assert.ok(data, 'SBOM file parses as JSON');
      return;
    }
    // No file — check for an endpoint.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const r = await fetch(srv.baseUrl + '/api/admin/sbom', authed(auth));
      assert.strictEqual(r.status, 200, 'SBOM file or /api/admin/sbom endpoint must exist (checked: ' + sbomFiles.join(', ') + ')');
      const body = await r.json();
      assert.ok(Array.isArray(body.dependencies) && body.dependencies.length > 0,
        'SBOM lists dependencies');
    } finally {
      await srv.cleanup();
    }
  });

});

// ============================================================================
// DOMAIN 5: CONTENT INFRASTRUCTURE (5 criteria)
// ============================================================================

describe('Content Infrastructure', () => {

  it('CI-01: Sitemap contains all published slugs', async () => {
    // Pass: sitemap has all 3 published slugs; drafts absent.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const slugs = ['sitemap-a', 'sitemap-b', 'sitemap-c'];
      for (const slug of slugs) {
        const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: slug, slug, body: '<p>x</p>' }),
        }))).json();
        await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      }
      await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'sitemap-draft', slug: 'sitemap-draft', body: '<p>x</p>' }),
      }));

      const sitemap = await (await fetch(srv.baseUrl + '/sitemap.xml')).text();
      assert.ok(sitemap.includes('<urlset'), 'valid sitemap XML');
      for (const slug of slugs) assert.ok(sitemap.includes(slug), `sitemap contains ${slug}`);
      assert.ok(!sitemap.includes('sitemap-draft'), 'draft slug absent from sitemap');
    } finally {
      await srv.cleanup();
    }
  });

  it('CI-02: RSS feed contains latest articles', async () => {
    // Pass: valid RSS 2.0; all 3 articles present; most recent first.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const titles = ['RSS Alpha', 'RSS Beta', 'RSS Gamma'];
      for (const title of titles) {
        const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: '<p>x</p>' }),
        }))).json();
        await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
        // small gap to preserve insertion order in published_at
        await new Promise(r => setTimeout(r, 15));
      }

      const rss = await (await fetch(srv.baseUrl + '/feed.xml')).text();
      assert.ok(/<rss\b[^>]*version="2\.0"/.test(rss), 'RSS 2.0 envelope present');
      for (const title of titles) assert.ok(rss.includes(title), `RSS contains ${title}`);

      const positions = titles.map(t => rss.indexOf(t));
      assert.ok(positions[2] < positions[1] && positions[1] < positions[0],
        'RSS most-recent first (Gamma, Beta, Alpha by insertion order)');
    } finally {
      await srv.cleanup();
    }
  });

  it('CI-03: REST API returns published content with relationships resolved', async () => {
    // Pass: valid JSON; only published; pagination headers present.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Published one', slug: 'pub-one', body: '<p>x</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Draft one', slug: 'draft-one', body: '<p>x</p>' }),
      }));

      const r = await fetch(srv.baseUrl + '/api/content?type=article&surface=public');
      assert.strictEqual(r.status, 200, 'unauthenticated public GET returns 200');
      const items = await r.json();
      assert.ok(Array.isArray(items));
      assert.ok(items.every(i => i.status === 'published'), 'only published content returned');
      assert.ok(r.headers.has('x-total-count') || r.headers.has('link'),
        'pagination header (X-Total-Count or Link) present');
    } finally {
      await srv.cleanup();
    }
  });

  it('CI-04: Webhook fires on publish event with HMAC verification', async () => {
    // Pass: registered webhook receives POST with valid HMAC-SHA256 signature
    // over a payload that carries event + content id but not the full body.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const secret = 'webhook-test-secret-' + crypto.randomBytes(8).toString('hex');
      const received = [];

      // Local HTTP sink listening on a free port.
      const http = require('node:http');
      const sink = http.createServer((req, res) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          received.push({
            path: req.url,
            headers: req.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
          res.writeHead(200); res.end('ok');
        });
      });
      await new Promise(r => sink.listen(0, '127.0.0.1', r));
      const sinkUrl = `http://127.0.0.1:${sink.address().port}/hook`;

      try {
        // Register webhook.
        const regRes = await fetch(srv.baseUrl + '/api/webhooks', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sinkUrl, events: ['content.published'], secret }),
        }));
        assert.ok(regRes.ok, 'webhook registration endpoint responded, got ' + regRes.status);

        const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Webhook test', slug: 'wh-test', body: '<p>x</p>' }),
        }))).json();
        await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));

        // Wait up to 3s for delivery
        for (let i = 0; i < 30 && received.length === 0; i++) {
          await new Promise(r => setTimeout(r, 100));
        }
        assert.strictEqual(received.length, 1, 'webhook endpoint received exactly one delivery');
        const hit = received[0];
        const sig = hit.headers['x-hub-signature-256'] || hit.headers['x-signature-256'];
        assert.ok(sig, 'signature header present (X-Hub-Signature-256 or X-Signature-256)');
        const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(hit.body).digest('hex');
        assert.strictEqual(sig, expected, 'HMAC signature matches');

        const payload = JSON.parse(hit.body);
        assert.strictEqual(payload.event, 'content.published');
        assert.strictEqual(payload.content_id || payload.contentId, c.id);
        assert.ok(!payload.body, 'payload must not include full content body (FBD-WH1)');
      } finally {
        await new Promise(r => sink.close(r));
      }
    } finally {
      await srv.cleanup();
    }
  });

  it('CI-05: Search returns published articles, excludes drafts (FBD-FTS1)', async () => {
    // Pass: public search sees only published; editorial sees both.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const unique = 'ftsunique' + Math.random().toString(36).slice(2, 8);

      const pub = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Published ${unique}`, slug: `pub-${unique}`, body: `<p>${unique}</p>` }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${pub.id}/publish`, authed(auth, { method: 'POST' }));

      await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Draft ${unique}`, slug: `draft-${unique}`, body: `<p>${unique}</p>` }),
      }));

      const pubRes = await fetch(srv.baseUrl + `/api/search?q=${unique}&surface=public`);
      const pubHits = await pubRes.json();
      assert.ok(Array.isArray(pubHits));
      assert.strictEqual(pubHits.length, 1,
        `public search returns 1 hit, got ${pubHits.length}: ${JSON.stringify(pubHits.map(x => x.slug))}`);

      const edRes = await fetch(srv.baseUrl + `/api/search?q=${unique}&surface=editorial`, authed(auth));
      const edHits = await edRes.json();
      assert.strictEqual(edHits.length, 2,
        `editorial search returns both, got ${edHits.length}: ${JSON.stringify(edHits.map(x => x.slug))}`);
    } finally {
      await srv.cleanup();
    }
  });

});

// ============================================================================
// DOMAIN 6: DIFFERENTIATION (12 criteria)
// ============================================================================

describe('Differentiation', () => {

  it('D-01: Time Travel — temporal query returns past content', async () => {
    // Pass: ?at=<past> returns old title; no-at returns current.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Original Title', slug: 'tt', body: '<p>v1</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      const beforeEdit = new Date().toISOString();
      await new Promise(r => setTimeout(r, 50));

      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Edited Title', body: '<p>v2</p>' }),
      }));

      const past = await (await fetch(srv.baseUrl + `/api/content/tt?at=${encodeURIComponent(beforeEdit)}`, authed(auth))).json();
      assert.strictEqual(past.title, 'Original Title', 'temporal query returns pre-edit title');

      const now = await (await fetch(srv.baseUrl + '/api/content/tt', authed(auth))).json();
      assert.strictEqual(now.title, 'Edited Title');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-02: Time Travel — horizon header on early timestamp', async () => {
    // Pass: X-Time-Travel-Horizon header on a query predating first revision.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Horizon', slug: 'horizon', body: '<p>x</p>' }),
      }));

      const epoch = '1970-01-01T00:00:00Z';
      const r = await fetch(srv.baseUrl + `/api/content/horizon?at=${epoch}`, authed(auth));
      assert.ok(r.headers.has('x-time-travel-horizon'),
        'X-Time-Travel-Horizon header present on pre-earliest temporal query');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-03: Admin UI temporal preview shows past content', async () => {
    // Pass: admin preview view has a date picker wired to time-travel.
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const hasDatePicker = /<input[^>]*type="(datetime-local|date)"/.test(html);
      const wiredToAt = /[?&]at=/.test(html);
      assert.ok(hasDatePicker, 'admin UI exposes a date picker input');
      assert.ok(wiredToAt, 'admin UI JS constructs requests with ?at= parameter');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-04: Seismograph shows correct webhook count in preview', async () => {
    // Pass: POST /api/content/:id/preview-effects returns effect list with webhook count.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Seismo', slug: 'seismo', body: '<p>x</p>' }),
      }))).json();

      for (let i = 0; i < 2; i++) {
        await fetch(srv.baseUrl + '/api/webhooks', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'http://127.0.0.1:0/noop' + i, events: ['content.published'], secret: 's' + i,
          }),
        }));
      }

      const r = await fetch(srv.baseUrl + `/api/content/${c.id}/preview-effects`, authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: 'publish' }),
      }));
      assert.strictEqual(r.status, 200);
      const effects = await r.json();
      const webhookCount = effects.webhooks?.length ?? effects.webhook_count ?? 0;
      assert.strictEqual(webhookCount, 2, 'effects list counts 2 webhook targets');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-05: Déjà Vu — similarity notification on overlapping draft', async () => {
    // Pass: creating a near-duplicate draft returns a similarity notice.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const text = 'The Loop CMS architecture favors single-file deployments and refuses to lose data.';
      const first = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Loop CMS architecture', slug: 'arch-1', body: `<p>${text}</p>` }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${first.id}/publish`, authed(auth, { method: 'POST' }));

      const dup = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Loop CMS architecture notes', slug: 'arch-2', body: `<p>${text}</p>` }),
      }))).json();

      const similar = dup.similar || dup.deja_vu || dup.dejaVu;
      assert.ok(Array.isArray(similar) && similar.length > 0,
        'create response exposes a similarity hit for the duplicate draft');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-06: Constellation Fingerprint in CLI status', async () => {
    // Pass: /api/status returns fingerprint in adjective-noun-NN format.
    const srv = await startServer();
    try {
      const body = await (await fetch(srv.baseUrl + '/api/status')).json();
      assert.ok(body.fingerprint, 'fingerprint field present');
      assert.ok(/^[a-z]+-[a-z]+-\d{2}$/.test(body.fingerprint),
        'fingerprint matches adjective-noun-NN, got: ' + body.fingerprint);
    } finally {
      await srv.cleanup();
    }
  });

  it('D-07: Constellation Fingerprint in spec history', async () => {
    // Pass: /api/admin/spec-history lists versions each with a fingerprint.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const r = await fetch(srv.baseUrl + '/api/admin/spec-history', authed(auth));
      assert.strictEqual(r.status, 200, 'spec-history endpoint returns 200');
      const entries = await r.json();
      assert.ok(Array.isArray(entries) && entries.length > 0, 'non-empty version list');
      for (const e of entries) {
        assert.ok(e.version !== undefined && e.fingerprint,
          'every entry has version and fingerprint: ' + JSON.stringify(e));
      }
    } finally {
      await srv.cleanup();
    }
  });

  it('D-08: Constellation Fingerprint diff between versions', async () => {
    // Pass: /api/admin/spec-diff returns changes between two fingerprints.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const r = await fetch(srv.baseUrl + '/api/admin/spec-diff?from=1&to=2', authed(auth));
      assert.ok(r.status !== 404, 'spec-diff endpoint exists');
      const body = await r.json();
      assert.ok('changes' in body || 'diff' in body, 'response has changes/diff');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-09: Stranger Walk produces Proof Vault entry', async () => {
    // Pass: POST /api/admin/stranger-walk writes a Proof Vault entry.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Walk me', slug: 'walk-me', body: '<p>ok</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));

      const r = await fetch(srv.baseUrl + '/api/admin/stranger-walk', authed(auth, { method: 'POST' }));
      assert.strictEqual(r.status, 200, 'stranger-walk endpoint returns 200');

      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        const entry = db.prepare("SELECT * FROM proof_vault WHERE entry_type LIKE '%stranger_walk%' OR entry_data LIKE '%Stranger Walk%' ORDER BY id DESC LIMIT 1").get();
        assert.ok(entry, 'Proof Vault contains a stranger_walk entry');
        const data = JSON.parse(entry.entry_data);
        assert.ok('urls_checked' in data || 'checked' in data, 'entry reports URL count');
      } finally { db.close(); }
    } finally {
      await srv.cleanup();
    }
  });

  it('D-10: Stranger Walk catches broken image reference', async () => {
    // Pass: walk flags the article's broken image.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Broken img', slug: 'broken-img',
          body: '<p><img src="/media/does-not-exist.png"></p>',
        }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));

      const r = await fetch(srv.baseUrl + '/api/admin/stranger-walk', authed(auth, { method: 'POST' }));
      const body = await r.json();
      const issues = body.issues || body.broken || [];
      assert.ok(Array.isArray(issues) && issues.some(i => JSON.stringify(i).includes('does-not-exist')),
        'stranger walk reports the broken image');
    } finally {
      await srv.cleanup();
    }
  });

  it('D-11: Ghost Links preserved on content deletion', async () => {
    // Pass: after delete, proof_vault has a ghost_links entry capturing tags + slug.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Ghost A', slug: 'ghost-a',
          body: '<p>See <a href="/ghost-b">B</a></p>',
          tags: '["company-news"]',
        }),
      }))).json();

      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, { method: 'DELETE' }));

      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        const ghost = db.prepare("SELECT * FROM proof_vault WHERE entry_type='content.ghost_links' ORDER BY id DESC LIMIT 1").get();
        assert.ok(ghost, 'ghost_links entry exists');
        const data = JSON.parse(ghost.entry_data);
        assert.strictEqual(data.slug, 'ghost-a');
        assert.ok(data.tags && data.tags.includes('company-news'), 'tags preserved');
      } finally { db.close(); }
    } finally {
      await srv.cleanup();
    }
  });

  it('D-12: Ghost Links visible in admin UI', async () => {
    // Pass: admin UI surfaces a ghost-links view (button/nav or endpoint).
    const srv = await startServer();
    try {
      const html = await (await fetch(srv.baseUrl + '/admin')).text();
      const surfacedInUI = /ghost[-_ ]?links/i.test(html);
      assert.ok(surfacedInUI, 'admin UI mentions ghost links');
    } finally {
      await srv.cleanup();
    }
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
      const auth = await getAuthToken(srv.baseUrl);
      assert.ok(auth.token, 'login returned a token');

      const createRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'First post',
          slug: 'first-post',
          body: '<p>Hello.</p>',
          content_type: 'article',
        }),
      }));
      const created = await createRes.json();
      assert.strictEqual(createRes.status, 201, 'create returns 201, got ' + createRes.status + ' ' + JSON.stringify(created));
      assert.ok(created.id, 'create returns id');

      const pubRes = await fetch(srv.baseUrl + `/api/content/${created.id}/publish`, authed(auth, {
        method: 'POST',
      }));
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
    // Pass: revision count equals write count (1 create + N edits = N+1 revisions).
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Rev test', slug: 'rev-test', body: '<p>v1</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Rev test 2', body: '<p>v2</p>' }),
      }));
      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Rev test 3', body: '<p>v3</p>' }),
      }));

      const withHist = await (await fetch(srv.baseUrl + '/api/content/rev-test?revisions=true', authed(auth))).json();
      assert.strictEqual(withHist.revisions.length, 3, '1 create + 2 edits == 3 revisions');
    } finally {
      await srv.cleanup();
    }
  });

  it('FBD-SEO1: Content without slug cannot publish to public surface', async () => {
    // Pass: publish returns a validation error that mentions the slug.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ' ', body: '<p>no slug</p>' }),
      }))).json();
      // Force an empty slug in the DB (auto-slug would give something).
      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try { db.prepare('UPDATE content SET slug=? WHERE id=?').run('', c.id); }
      finally { db.close(); }

      const pubRes = await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      assert.ok(!pubRes.ok, 'publish refused');
      const body = await pubRes.json();
      assert.ok(/slug/i.test(body.error || ''), 'error mentions slug, got: ' + body.error);
    } finally {
      await srv.cleanup();
    }
  });

  it('FBD-CA1: Cache invalidated on content write', async () => {
    // Pass: the second read reflects the update (no stale cache).
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Cache v1', slug: 'cache-test', body: '<p>v1</p>' }),
      }))).json();
      await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      const first = await (await fetch(srv.baseUrl + '/cache-test')).text();
      assert.ok(/<h1>\s*Cache v1/.test(first), 'first fetch renders v1 headline');

      await fetch(srv.baseUrl + `/api/content/${c.id}`, authed(auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Cache v2', body: '<p>v2</p>' }),
      }));
      const second = await (await fetch(srv.baseUrl + '/cache-test')).text();
      assert.ok(/<h1>\s*Cache v2/.test(second),
        'second fetch reflects the update (no stale cache)');
    } finally {
      await srv.cleanup();
    }
  });

  it('FBD-LM1: Write operations impossible in SAFE_MODE', async () => {
    // Pass: after flipping lifecycle_state to SAFE_MODE, writes are refused; reads succeed.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);

      const db = new DatabaseSync(path.join(srv.tmpDir, 'data', 'content.db'));
      try {
        db.prepare("UPDATE system_state SET value='SAFE_MODE' WHERE key='lifecycle_state'").run();
      } finally { db.close(); }

      const writeRes = await fetch(srv.baseUrl + '/api/content', authed(auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'nope', slug: 'nope', body: '<p>x</p>' }),
      }));
      assert.ok([403, 423, 503].includes(writeRes.status),
        'write refused in SAFE_MODE, got ' + writeRes.status);

      const readRes = await fetch(srv.baseUrl + '/api/status');
      assert.strictEqual(readRes.status, 200, 'reads still succeed in SAFE_MODE');
    } finally {
      await srv.cleanup();
    }
  });

  it('FBD-SW1: Stranger Walk threshold triggers DEGRADED state', async () => {
    // Pass: walk with >5% errors transitions lifecycle_state to DEGRADED.
    const srv = await startServer();
    try {
      const auth = await getAuthToken(srv.baseUrl);
      // Publish content with broken references to drive error rate above 5%.
      for (let i = 0; i < 10; i++) {
        const c = await (await fetch(srv.baseUrl + '/api/content', authed(auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `bad-${i}`, slug: `bad-${i}`,
            body: `<p><img src="/media/missing-${i}.png"></p>`,
          }),
        }))).json();
        await fetch(srv.baseUrl + `/api/content/${c.id}/publish`, authed(auth, { method: 'POST' }));
      }

      const walkRes = await fetch(srv.baseUrl + '/api/admin/stranger-walk', authed(auth, { method: 'POST' }));
      assert.strictEqual(walkRes.status, 200, 'walk endpoint responded');

      const statusRes = await fetch(srv.baseUrl + '/api/status');
      const body = await statusRes.json();
      assert.strictEqual(body.state, 'DEGRADED',
        'lifecycle transitions to DEGRADED after >5% errors, got ' + body.state);
    } finally {
      await srv.cleanup();
    }
  });

});

// ============================================================================
// Total: 47 acceptance criteria across 8 domains
// Status: ALL PENDING — fill in as you build
// ============================================================================
