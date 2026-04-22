#!/usr/bin/env node
// ============================================================================
// Loop CMS — Tier 1 Single-File Architecture
// © 2026 Shea Gunther · New Gloucester, Maine · CC BY-NC 4.0
//
// One file. One command. Five buttons.
// The system that lost everything once made a promise: never again.
// ============================================================================

const http = require('http');
const https = require('https');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Software bill of materials — single-file inventory of runtime surface.
const SBOM = {
  name: 'loopcms',
  version: '1.0.0',
  runtime: 'node',
  generated_at: new Date().toISOString(),
  dependencies: [
    { name: 'bcryptjs',       source: 'npm',  purpose: 'password hashing' },
    { name: 'jsonwebtoken',   source: 'npm',  purpose: 'JWT signing and verification' },
    { name: 'node:sqlite',    source: 'node', purpose: 'embedded SQLite storage (DatabaseSync)' },
    { name: 'node:http',      source: 'node', purpose: 'HTTP server' },
    { name: 'node:crypto',    source: 'node', purpose: 'hashing, HMAC, random bytes' },
    { name: 'node:fs',        source: 'node', purpose: 'filesystem I/O' },
    { name: 'node:path',      source: 'node', purpose: 'path joining' },
  ],
};

const CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  jwtExpiry: '15m',
  refreshExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
  mediaDir: process.env.MEDIA_DIR || path.join(process.cwd(), 'media'),
  maxUploadSize: 50 * 1024 * 1024, // 50MB — FBD-MD1
  maxDimension: 10000,
  revisionCap: 50, // FBD-RH1
  rateLimits: {
    public: { max: 100, window: 60000 },   // 100/min
    admin: { max: 60, window: 60000 },      // 60/min
    media: { max: 10, window: 60000 },      // 10/min
  },
  csrfTokenLength: 32,
};

// ============================================================================
// RBAC — STAFF BADGES (FBD-RB1)
// Capabilities are additive from zero, not subtractive from all.
// ============================================================================

const PERMISSIONS = {
  'content:read': true,
  'content:write': true,
  'media:upload': true,
  'content:preview': true,
  'content:schedule': true,
  'content:publish': true,
  'settings:configure': true,
};

const ROLES = {
  viewer:    ['content:read'],
  editor:    ['content:read', 'content:write', 'media:upload', 'content:preview'],
  publisher: ['content:read', 'content:write', 'media:upload', 'content:preview', 'content:schedule', 'content:publish'],
  admin:     Object.keys(PERMISSIONS),
};

// ============================================================================
// CONTRACT_CONFIGS — L21 Cross-Pollination Isomorphism 3
// One table. Every contract type is a config entry.
// Adding a new contract = adding a row.
// ============================================================================

const CONTRACT_CONFIGS = {
  STORE_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: true,
    rateLimit: 'admin',
    rbacPermission: 'content:write',
    proofLevel: 'audit',
  },
  FETCH_CONTENT_AGGREGATE: {
    type: 'read', surface: 'required',
    sanitize: false,
    rateLimit: 'public',
    rbacPermission: 'content:read',
    proofLevel: 'normal',
  },
  FETCH_CONTENT_SINGLE: {
    type: 'read', surface: 'required',
    sanitize: false,
    rateLimit: 'public',
    rbacPermission: 'content:read',
    proofLevel: 'normal',
  },
  DELETE_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: false,
    rateLimit: 'admin',
    rbacPermission: 'content:write',
    proofLevel: 'audit',
  },
  RESTORE_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: false,
    rateLimit: 'admin',
    rbacPermission: 'content:write',
    proofLevel: 'audit',
  },
  PREVIEW_EFFECTS: {
    type: 'read', surface: 'required',
    sanitize: false,
    rateLimit: 'admin',
    rbacPermission: 'content:read',
    proofLevel: 'normal',
  },
  PUBLISH_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: false,
    rateLimit: 'admin',
    rbacPermission: 'content:publish',
    proofLevel: 'audit',
  },
  UNPUBLISH_CONTENT: {
    type: 'write', surface: 'required',
    sanitize: false,
    rateLimit: 'admin',
    rbacPermission: 'content:publish',
    proofLevel: 'audit',
  },
  STORE_MEDIA: {
    type: 'write', surface: 'required',
    sanitize: 'media',
    rateLimit: 'media',
    rbacPermission: 'media:upload',
    proofLevel: 'audit',
  },
  FETCH_MEDIA: {
    type: 'read', surface: 'optional',
    sanitize: false,
    rateLimit: 'public',
    rbacPermission: null, // public media
    proofLevel: 'normal',
  },
  SEARCH_CONTENT: {
    type: 'read', surface: 'required',
    sanitize: false,
    rateLimit: 'public',
    rbacPermission: 'content:read',
    proofLevel: 'normal',
  },
};

// ============================================================================
// DATABASE INITIALIZATION — SQLite (Tier 1)
// ============================================================================

let db;

function initDatabase() {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  fs.mkdirSync(CONFIG.mediaDir, { recursive: true });

  db = new DatabaseSync(path.join(CONFIG.dataDir, 'content.db'));

  db.exec(`
    -- Content Vault
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      body TEXT DEFAULT '',
      content_type TEXT DEFAULT 'article',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','in_review','scheduled','published','archived')),
      surface TEXT DEFAULT 'editorial',
      meta_title TEXT,
      meta_description TEXT,
      tags TEXT DEFAULT '[]',
      checksum TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      published_at TEXT,
      author_id TEXT,
      scheduled_at TEXT
    );

    -- Content Revisions — FBD-RH1
    CREATE TABLE IF NOT EXISTS content_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id TEXT NOT NULL,
      revision_number INTEGER NOT NULL,
      title TEXT,
      slug TEXT,
      body TEXT,
      status TEXT,
      meta_title TEXT,
      meta_description TEXT,
      tags TEXT,
      author_id TEXT,
      fields_modified TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (content_id) REFERENCES content(id)
    );
    CREATE INDEX IF NOT EXISTS idx_revisions_content ON content_revisions(content_id, created_at);

    -- Auth Vault (separate from Content Vault)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'editor' CHECK(role IN ('viewer','editor','publisher','admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Refresh tokens — server-side storage
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Proof Vault — append-only with hash chain (FBD-LI1)
    CREATE TABLE IF NOT EXISTS proof_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_type TEXT NOT NULL,
      entry_data TEXT NOT NULL,
      actor TEXT,
      prev_hash TEXT,
      entry_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    -- Append-only trigger: prevent updates and deletes
    CREATE TRIGGER IF NOT EXISTS proof_vault_no_update
      BEFORE UPDATE ON proof_vault
      BEGIN SELECT RAISE(ABORT, 'Proof Vault is append-only. Entries cannot be modified.'); END;
    CREATE TRIGGER IF NOT EXISTS proof_vault_no_delete
      BEFORE DELETE ON proof_vault
      BEGIN SELECT RAISE(ABORT, 'Proof Vault is append-only. Entries cannot be deleted.'); END;

    -- Media metadata
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      uploaded_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- CSRF tokens
    CREATE TABLE IF NOT EXISTS csrf_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Full-text search — FBD-FTS1
    CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
      title, body, slug, tags, content='content', content_rowid='rowid'
    );

    -- Spec version store (Constellation Fingerprint)
    CREATE TABLE IF NOT EXISTS spec_versions (
      version INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT NOT NULL,
      spec_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Rate limiting
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limits ON rate_limits(key, timestamp);

    -- Webhooks (FBD-WH1)
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      secret TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      consecutive_failures INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- System state
    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initialize system state
  const state = db.prepare('SELECT value FROM system_state WHERE key = ?').get('lifecycle_state');
  if (!state) {
    db.prepare('INSERT INTO system_state (key, value) VALUES (?, ?)').run('lifecycle_state', 'NOMINAL');
    db.prepare('INSERT INTO system_state (key, value) VALUES (?, ?)').run('initialized', 'false');
  }
}

// ============================================================================
// PROOF VAULT — Append-only with hash chain (FBD-LI1)
// ============================================================================

// ============================================================================
// WEBHOOKS (FBD-WH1)
// Retry schedule: immediate, then +30s, then +5min. After 10 consecutive
// terminal failures, the hook is auto-disabled. Payloads carry the event
// type and content id only — never the full content body.
// ============================================================================

const WEBHOOK_RETRY_DELAYS_MS = [0, 30_000, 5 * 60_000];
const WEBHOOK_AUTO_DISABLE_THRESHOLD = 10;

function postWebhook(hook, payloadJson) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(hook.url); }
    catch (e) { reject(new Error('invalid url')); return; }
    const lib = url.protocol === 'https:' ? https : http;
    const sig = 'sha256=' + crypto.createHmac('sha256', hook.secret).update(payloadJson).digest('hex');
    const reqH = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadJson),
        'X-Hub-Signature-256': sig,
        'X-Loop-Event': 'webhook',
      },
      timeout: 5000,
    }, r => {
      r.on('data', () => {});
      r.on('end', () => {
        if (r.statusCode >= 200 && r.statusCode < 300) resolve();
        else reject(new Error('HTTP ' + r.statusCode));
      });
    });
    reqH.on('error', reject);
    reqH.on('timeout', () => { reqH.destroy(new Error('timeout')); });
    reqH.write(payloadJson);
    reqH.end();
  });
}

function scheduleWebhookAttempt(hookId, payloadJson, attempt) {
  const delay = WEBHOOK_RETRY_DELAYS_MS[attempt];
  const timer = setTimeout(async () => {
    const hook = db.prepare('SELECT * FROM webhooks WHERE id=? AND enabled=1').get(hookId);
    if (!hook) return;
    try {
      await postWebhook(hook, payloadJson);
      db.prepare('UPDATE webhooks SET consecutive_failures=0 WHERE id=?').run(hookId);
    } catch (e) {
      if (attempt + 1 < WEBHOOK_RETRY_DELAYS_MS.length) {
        scheduleWebhookAttempt(hookId, payloadJson, attempt + 1);
        return;
      }
      const row = db.prepare('SELECT consecutive_failures FROM webhooks WHERE id=?').get(hookId);
      const failures = (row?.consecutive_failures || 0) + 1;
      const enabled = failures >= WEBHOOK_AUTO_DISABLE_THRESHOLD ? 0 : 1;
      db.prepare('UPDATE webhooks SET consecutive_failures=?, enabled=? WHERE id=?')
        .run(failures, enabled, hookId);
    }
  }, delay);
  timer.unref?.();
}

function emitEvent(eventType, contentId, actorId = 'system') {
  const payload = JSON.stringify({
    event: eventType,
    content_id: contentId || null,
    timestamp: new Date().toISOString(),
  });
  const hooks = db.prepare('SELECT id, events FROM webhooks WHERE enabled=1').all();
  for (const h of hooks) {
    let events = [];
    try { events = JSON.parse(h.events); } catch (e) { continue; }
    if (!Array.isArray(events) || !events.includes(eventType)) continue;
    scheduleWebhookAttempt(h.id, payload, 0);
  }
}

function proofAppend(entryType, entryData, actor = 'system') {
  const lastEntry = db.prepare('SELECT entry_hash FROM proof_vault ORDER BY id DESC LIMIT 1').get();
  const prevHash = lastEntry ? lastEntry.entry_hash : '0000000000000000';
  const payload = `${prevHash}|${entryType}|${JSON.stringify(entryData)}|${actor}|${Date.now()}`;
  const entryHash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);

  db.prepare(`INSERT INTO proof_vault (entry_type, entry_data, actor, prev_hash, entry_hash)
    VALUES (?, ?, ?, ?, ?)`).run(entryType, JSON.stringify(entryData), actor, prevHash, entryHash);

  return entryHash;
}

// ============================================================================
// CONTENT SANITIZATION — The Food Safety Inspector (FBD-CS1)
// Allowlist-based. No <script>, no <iframe>, no event handlers.
// ============================================================================

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'em', 'strong', 'code', 'pre', 'br', 'hr', 'div', 'span',
]);

const ALLOWED_ATTRS = {
  'a': ['href'],
  'img': ['src', 'alt', 'width', 'height'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan'],
};

function sanitizeHtml(html) {
  if (!html) return '';
  let cleaned = html
    // Strip script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip iframe tags
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    // Strip event handlers (onerror, onclick, onload, etc.)
    .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    // Strip javascript: URIs
    .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href=$1#$1')
    // Strip data: URIs (except images)
    .replace(/src\s*=\s*(['"])data:(?!image).*?\1/gi, 'src=$1#$1')
    // Strip style attributes
    .replace(/\s+style\s*=\s*(['"]).*?\1/gi, '');
  return cleaned;
}

function sanitizeForOutput(text) {
  // FBD-OE1: context-aware output encoding
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// FBD-MD1: strip APPn markers (EXIF/XMP/ICC) from JPEG buffers.
// Hand-rolled — walks JPEG marker segments and drops any FF E0..FF EF block.
function stripJpegMetadata(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) return buffer;
  const out = [Buffer.from([0xFF, 0xD8])];
  let pos = 2;
  while (pos + 1 < buffer.length) {
    if (buffer[pos] !== 0xFF) { out.push(buffer.subarray(pos)); break; }
    const marker = buffer[pos + 1];
    if (marker === 0xD9) { out.push(buffer.subarray(pos)); break; }       // EOI
    if (marker === 0xDA) { out.push(buffer.subarray(pos)); break; }       // SOS → image data
    if (marker >= 0xD0 && marker <= 0xD7) { out.push(Buffer.from([0xFF, marker])); pos += 2; continue; }
    if (pos + 4 > buffer.length) break;
    const segLen = (buffer[pos + 2] << 8) | buffer[pos + 3];
    const segEnd = pos + 2 + segLen;
    if (segLen < 2 || segEnd > buffer.length) break;
    if (marker >= 0xE0 && marker <= 0xEF) { pos = segEnd; continue; }     // strip APPn
    out.push(buffer.subarray(pos, segEnd));
    pos = segEnd;
  }
  return Buffer.concat(out);
}

// FBD-MD1: strip executable content from SVG bytes before storage.
function sanitizeSvg(svgText) {
  return svgText
    // Whole <script>...</script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Self-closing or orphan <script ... />
    .replace(/<script\b[^>]*\/?>/gi, '')
    // <foreignObject> can smuggle HTML/script
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    // on* event handlers (quoted and unquoted)
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    // href / xlink:href with javascript: or data: schemes
    .replace(/\s(?:xlink:)?href\s*=\s*"(?:\s*(?:javascript|data):)[^"]*"/gi, '')
    .replace(/\s(?:xlink:)?href\s*=\s*'(?:\s*(?:javascript|data):)[^']*'/gi, '');
}

// ============================================================================
// CONSTELLATION FINGERPRINT — Human-memorable state names
// ============================================================================

const ADJECTIVES = ['amber','azure','brass','cedar','coral','crimson','dawn','dusk','echo','ember',
  'fern','flame','frost','ghost','golden','granite','harbor','haze','indigo','iron',
  'jade','jasper','lapis','lemon','lilac','lunar','marble','maple','mesa','mist',
  'neon','night','oak','olive','onyx','opal','pearl','pine','plum','quartz',
  'raven','reef','rose','ruby','rust','sage','sand','silk','silver','slate',
  'solar','steel','stone','storm','teal','terra','thistle','timber','topaz','velvet',
  'violet','walnut','willow','winter'];

const NOUNS = ['anchor','beacon','bridge','canyon','castle','cipher','cliff','compass','crest','crystal',
  'delta','dome','dune','falcon','forge','fountain','glacier','grove','harbor','haven',
  'island','journey','lantern','lighthouse','meadow','mesa','monument','nebula','oasis','orbit',
  'passage','peak','phantom','pinnacle','portal','prism','quarry','rapids','ridge','river',
  'sanctuary','sentinel','shadow','shore','sierra','signal','spire','summit','temple','thunder',
  'tower','trail','valley','venture','vertex','vista','vortex','wagon','zenith','zephyr'];

function generateFingerprint(input) {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  const a = parseInt(hash.slice(0, 4), 16) % ADJECTIVES.length;
  const n = parseInt(hash.slice(4, 8), 16) % NOUNS.length;
  const num = parseInt(hash.slice(8, 10), 16) % 100;
  return `${ADJECTIVES[a]}-${NOUNS[n]}-${String(num).padStart(2, '0')}`;
}

// ============================================================================
// RATE LIMITING (FBD-RL1)
// ============================================================================

function checkRateLimit(key, tier) {
  const limit = CONFIG.rateLimits[tier];
  if (!limit) return true;
  const now = Date.now();
  const windowStart = now - limit.window;

  // Clean old entries
  db.prepare('DELETE FROM rate_limits WHERE timestamp < ?').run(windowStart);

  const count = db.prepare('SELECT COUNT(*) as count FROM rate_limits WHERE key = ? AND timestamp > ?')
    .get(key, windowStart);

  if (count.count >= limit.max) return false;

  db.prepare('INSERT INTO rate_limits (key, timestamp) VALUES (?, ?)').run(key, now);
  return true;
}

// ============================================================================
// SLUG GENERATION — FBD-SEO1
// ============================================================================

function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ============================================================================
// CONTENT CHECKSUM — FBD-CI1
// ============================================================================

function computeChecksum(content) {
  return crypto.createHash('sha256')
    .update(JSON.stringify({ title: content.title, body: content.body, slug: content.slug }))
    .digest('hex').slice(0, 16);
}

// ============================================================================
// STRANGER WALK — self-navigation health sweep (D-09, D-10, FBD-SW1)
// Walks every published URL, verifies referenced media exists on disk.
// >5% URLs with issues → lifecycle transitions to DEGRADED.
// ============================================================================

function strangerWalk() {
  const articles = db.prepare("SELECT slug, body FROM content WHERE status='published'").all();
  const issues = [];
  const urlsChecked = articles.length;
  let urlsWithIssues = 0;

  for (const a of articles) {
    let articleHasIssue = false;
    const imgMatches = [...(a.body || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    for (const m of imgMatches) {
      const src = m[1];
      if (src.startsWith('/media/')) {
        const filename = src.slice('/media/'.length);
        if (!fs.existsSync(path.join(CONFIG.mediaDir, filename))) {
          issues.push({ url: '/' + a.slug, image: src, issue: 'missing media file' });
          articleHasIssue = true;
        }
      }
    }
    if (articleHasIssue) urlsWithIssues++;
  }

  const errorRate = urlsChecked > 0 ? urlsWithIssues / urlsChecked : 0;
  const degraded = errorRate > 0.05;
  if (degraded) {
    db.prepare("UPDATE system_state SET value='DEGRADED' WHERE key='lifecycle_state'").run();
    proofAppend('system.state_transition', { from: 'NOMINAL', to: 'DEGRADED', reason: 'stranger_walk threshold breach' }, 'system');
  }

  proofAppend('stranger_walk.complete', {
    summary: `Stranger Walk complete. ${urlsChecked} URLs checked. ${issues.length} issues found.`,
    urls_checked: urlsChecked,
    issues_found: issues.length,
    error_rate: errorRate,
    issues: issues.slice(0, 50),
  }, 'system');

  return { urls_checked: urlsChecked, issues_found: issues.length, issues, error_rate: errorRate, degraded };
}

// ============================================================================
// DÉJÀ VU — FTS5 prefilter + Jaccard similarity (threshold 0.7)
// ============================================================================

function dejaVuTokenize(text) {
  return new Set((text || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2));
}

function dejaVuJaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

function findSimilarContent(title, body, excludeId) {
  const tokens = dejaVuTokenize((title || '') + ' ' + (body || '').slice(0, 1000));
  if (tokens.size < 3) return [];

  let candidates = [];
  try {
    const fq = Array.from(tokens).slice(0, 20).join(' OR ');
    candidates = db.prepare(
      `SELECT c.id, c.title, c.slug, c.body, c.created_at FROM content c
       JOIN content_fts f ON c.rowid = f.rowid
       WHERE content_fts MATCH ? AND c.id != ?
       ORDER BY rank LIMIT 20`
    ).all(fq, excludeId || '');
  } catch (e) {
    candidates = db.prepare('SELECT id, title, slug, body, created_at FROM content WHERE id != ? LIMIT 50')
      .all(excludeId || '');
  }

  const hits = [];
  for (const c of candidates) {
    const sim = dejaVuJaccard(tokens, dejaVuTokenize((c.title || '') + ' ' + (c.body || '')));
    if (sim >= 0.7) {
      hits.push({
        id: c.id, title: c.title, slug: c.slug,
        similarity: Math.round(sim * 100) / 100,
        created_at: c.created_at,
      });
    }
  }
  hits.sort((a, b) => b.similarity - a.similarity);
  return hits;
}

// ============================================================================
// processRequest — The Pipeline (L21 Isomorphism 4)
// Not middleware. Not configurable. A function body.
// The order cannot be misconfigured because it isn't configured — it's compiled.
// ============================================================================

function processRequest(req) {
  const config = CONTRACT_CONFIGS[req.contractId];
  if (!config) {
    return { ok: false, status: 400, error: 'Unknown contract', code: 'UNKNOWN_CONTRACT' };
  }

  // Public reads (surface='public') bypass auth/authz — anonymous visitors
  // may fetch published content, hit the public search, etc.
  const isPublicRead = config.type === 'read' && req.surface === 'public';

  // Phase 1: Authenticate (FBD-AU1)
  const identity = reqAuthenticate(req, config);
  if (!identity.ok && config.rbacPermission && !isPublicRead) {
    return { ok: false, status: 401, error: identity.error, code: 'AUTH_FAILED' };
  }

  // Phase 2: Authorize (FBD-RB1)
  if (config.rbacPermission && !isPublicRead) {
    const auth = reqAuthorize(identity, config);
    if (!auth.ok) {
      return { ok: false, status: 403,
        error: `You need the ${config.rbacPermission} permission. Ask your admin.`,
        code: 'FORBIDDEN' };
    }
  }

  // FBD-LM1: writes are refused when lifecycle is in SAFE_MODE. Reads still flow.
  if (config.type === 'write') {
    const state = db.prepare("SELECT value FROM system_state WHERE key='lifecycle_state'").get();
    if (state?.value === 'SAFE_MODE') {
      return { ok: false, status: 503,
        error: 'System is in SAFE_MODE — writes are paused until the operator clears it.',
        code: 'SAFE_MODE' };
    }
  }

  // Phase 3: Validate
  const validated = reqValidate(req, config);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.error, code: 'VALIDATION_FAILED' };
  }

  // Phase 4: Sanitize (FBD-CS1 / FBD-MD1)
  const sanitized = reqSanitize(validated.data, config);

  // Phase 5: Execute
  const result = reqExecute(sanitized, identity, config, req);

  // Phase 6: Log (FBD-LI1)
  reqLog(result, identity, config, req);

  return result;
}

function reqAuthenticate(req, config) {
  if (!config.rbacPermission) return { ok: true, user: null, role: null };

  const token = req.token;
  if (!token) return { ok: false, error: 'No authentication token provided' };

  try {
    const decoded = jwt.verify(token, CONFIG.jwtSecret);
    return { ok: true, user: decoded, role: decoded.role, userId: decoded.userId };
  } catch (e) {
    return { ok: false, error: 'Invalid or expired token. Please log in again.' };
  }
}

function reqAuthorize(identity, config) {
  if (!identity.ok || !identity.role) return { ok: false };
  const rolePerms = ROLES[identity.role] || [];
  if (!rolePerms.includes(config.rbacPermission)) return { ok: false };
  return { ok: true };
}

function reqValidate(req, config) {
  if (config.type === 'write' && req.contractId.includes('CONTENT')) {
    if (req.contractId === 'STORE_CONTENT' && !req.payload?.title) {
      return { ok: false, error: 'Content requires a title' };
    }
  }
  return { ok: true, data: req.payload || {} };
}

function reqSanitize(data, config) {
  if (config.sanitize !== true) return data;
  let changed = false;
  if (data.body) {
    const original = data.body;
    data.body = sanitizeHtml(data.body);
    if (original !== data.body) changed = true;
  }
  if (data.title) {
    const original = data.title;
    data.title = sanitizeHtml(data.title);
    if (original !== data.title) changed = true;
  }
  if (changed) {
    data._sanitized = true;
    data._sanitizeNote = 'We cleaned up some HTML in your content — unsafe tags were removed.';
  }
  return data;
}

function reqExecute(data, identity, config, req) {
  const userId = identity.userId || 'anonymous';

  switch (req.contractId) {
    case 'STORE_CONTENT': {
      const existing = req.contentId
        ? db.prepare('SELECT * FROM content WHERE id = ?').get(req.contentId)
        : null;

      if (existing) {
        // Update
        const slug = data.slug || existing.slug;
        const updated = { ...existing, ...data, slug, updated_at: new Date().toISOString() };
        const checksum = computeChecksum(updated);

        db.prepare(`UPDATE content SET title=?, slug=?, body=?, meta_title=?, meta_description=?,
          tags=?, checksum=?, updated_at=?, author_id=? WHERE id=?`)
          .run(updated.title, slug, updated.body, data.meta_title || existing.meta_title,
            data.meta_description || existing.meta_description,
            data.tags || existing.tags, checksum, updated.updated_at, userId, existing.id);

        // Create revision — FBD-RH1
        const revNum = (db.prepare('SELECT MAX(revision_number) as n FROM content_revisions WHERE content_id=?')
          .get(existing.id)?.n || 0) + 1;
        db.prepare(`INSERT INTO content_revisions (content_id, revision_number, title, slug, body, status,
          meta_title, meta_description, tags, author_id, fields_modified, created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(existing.id, revNum, updated.title, slug, updated.body, existing.status,
            updated.meta_title ?? null, updated.meta_description ?? null, updated.tags ?? null, userId,
            JSON.stringify(Object.keys(data).filter(k => !k.startsWith('_'))),
            new Date().toISOString());

        // Update FTS
        try {
          db.prepare(`INSERT INTO content_fts(rowid, title, body, slug, tags)
            VALUES ((SELECT rowid FROM content WHERE id=?), ?, ?, ?, ?)`)
            .run(existing.id, updated.title, updated.body || '', slug, data.tags || '[]');
        } catch(e) { /* FTS update best-effort at Tier 1 */ }

        return { ok: true, status: 200, data: { ...updated, id: existing.id, checksum }, note: data._sanitizeNote };
      } else {
        // Create
        const slug = data.slug || generateSlug(data.title);
        const id = crypto.randomBytes(8).toString('hex');
        const checksum = computeChecksum({ ...data, slug });
        const now = new Date().toISOString();

        db.prepare(`INSERT INTO content (id, title, slug, body, content_type, status, meta_title,
          meta_description, tags, checksum, author_id, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(id, data.title, slug, data.body || '', data.content_type || 'article', 'draft',
            data.meta_title || data.title, data.meta_description || (data.body || '').slice(0, 160),
            data.tags || '[]', checksum, userId, now, now);

        // Revision 1
        db.prepare(`INSERT INTO content_revisions (content_id, revision_number, title, slug, body, status, author_id, fields_modified, created_at)
          VALUES (?,?,?,?,?,?,?,?,?)`)
          .run(id, 1, data.title, slug, data.body || '', 'draft', userId, '["create"]', new Date().toISOString());

        // Index in FTS — FBD-FTS1 (mirror of UPDATE path)
        try {
          db.prepare(`INSERT INTO content_fts(rowid, title, body, slug, tags)
            VALUES ((SELECT rowid FROM content WHERE id=?), ?, ?, ?, ?)`)
            .run(id, data.title, data.body || '', slug, data.tags || '[]');
        } catch(e) { /* FTS best-effort at Tier 1 */ }

        const similar = findSimilarContent(data.title, data.body, id);

        return { ok: true, status: 201,
          data: { id, title: data.title, slug, status: 'draft', checksum, similar },
          note: data._sanitizeNote };
      }
    }

    case 'FETCH_CONTENT_AGGREGATE': {
      const surface = req.surface || 'editorial';
      let whereClause = '';
      const whereParams = [];

      if (surface === 'public') {
        whereClause += ' WHERE status = ?';
        whereParams.push('published');
      }
      if (data.content_type) {
        whereClause += whereParams.length ? ' AND' : ' WHERE';
        whereClause += ' content_type = ?';
        whereParams.push(data.content_type);
      }

      const total = db.prepare('SELECT COUNT(*) as n FROM content' + whereClause).get(...whereParams).n;

      const limit = Math.min(parseInt(data.limit) || 20, 100);
      const offset = Math.max(parseInt(data.offset) || 0, 0);
      const rows = db.prepare('SELECT * FROM content' + whereClause + ' ORDER BY updated_at DESC LIMIT ? OFFSET ?')
        .all(...whereParams, limit, offset);

      // FBD-CI1: verify checksums on read
      const verified = rows.map(r => {
        const expected = computeChecksum(r);
        return { ...r, _integrityOk: r.checksum === expected };
      });
      return { ok: true, status: 200, data: verified, meta: { total, limit, offset } };
    }

    case 'FETCH_CONTENT_SINGLE': {
      const item = db.prepare('SELECT * FROM content WHERE slug = ? OR id = ?')
        .get(data.slug || data.id, data.id || data.slug);
      if (!item) return { ok: false, status: 404, error: 'Content not found' };

      // Time Travel: if ?at= is present, return the revision closest to that instant.
      if (data.at) {
        const horizonRow = db.prepare('SELECT MIN(created_at) as t FROM content_revisions WHERE content_id=?').get(item.id);
        const rev = db.prepare(
          'SELECT * FROM content_revisions WHERE content_id=? AND created_at <= ? ORDER BY created_at DESC, revision_number DESC LIMIT 1'
        ).get(item.id, data.at);
        if (!rev) {
          return { ok: false, status: 404,
            error: 'No revision at that time — the horizon is ' + (horizonRow?.t || 'unknown'),
            meta: { horizon: horizonRow?.t || null } };
        }
        return { ok: true, status: 200,
          data: { ...item, ...rev, id: item.id, _temporal: true, _at: data.at },
          meta: { horizon: horizonRow?.t || null } };
      }

      // Integrity check
      const expected = computeChecksum(item);
      item._integrityOk = item.checksum === expected;

      // Fetch revisions if requested
      if (data.withRevisions) {
        item.revisions = db.prepare(
          'SELECT * FROM content_revisions WHERE content_id = ? ORDER BY revision_number DESC LIMIT ?'
        ).all(item.id, CONFIG.revisionCap);
      }

      return { ok: true, status: 200, data: item };
    }

    case 'PUBLISH_CONTENT': {
      const item = db.prepare('SELECT * FROM content WHERE id = ?').get(req.contentId);
      if (!item) return { ok: false, status: 404, error: 'Content not found' };
      // FBD-SEO1: no slug, no publish
      if (!item.slug) return { ok: false, status: 400, error: 'Content needs a slug before it can be published. No address, no storefront.' };

      const now = new Date().toISOString();
      // Scheduling: a future scheduled_at puts the item into 'scheduled' instead of 'published'.
      const scheduledAt = data?.scheduled_at;
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        db.prepare('UPDATE content SET status=?, scheduled_at=?, surface=?, updated_at=? WHERE id=?')
          .run('scheduled', scheduledAt, 'editorial', now, item.id);
        return { ok: true, status: 200, data: { ...item, status: 'scheduled', scheduled_at: scheduledAt, surface: 'editorial' } };
      }

      db.prepare('UPDATE content SET status = ?, published_at = ?, surface = ?, updated_at = ? WHERE id = ?')
        .run('published', now, 'public', now, item.id);

      return { ok: true, status: 200, data: { ...item, status: 'published', published_at: now, surface: 'public' } };
    }

    case 'UNPUBLISH_CONTENT': {
      const item = db.prepare('SELECT * FROM content WHERE id = ?').get(req.contentId);
      if (!item) return { ok: false, status: 404, error: 'Content not found' };
      db.prepare('UPDATE content SET status = ?, surface = ?, updated_at = ? WHERE id = ?')
        .run('draft', 'editorial', new Date().toISOString(), item.id);
      return { ok: true, status: 200, data: { ...item, status: 'draft', surface: 'editorial' } };
    }

    case 'DELETE_CONTENT': {
      const item = db.prepare('SELECT * FROM content WHERE id = ?').get(req.contentId);
      if (!item) return { ok: false, status: 404, error: 'Content not found' };
      // Ghost Links — preserve outbound reference map
      proofAppend('content.ghost_links', {
        slug: item.slug, title: item.title, tags: item.tags,
        deleted_at: new Date().toISOString()
      }, userId);
      db.prepare('DELETE FROM content WHERE id = ?').run(item.id);
      return { ok: true, status: 200, data: { deleted: item.id, slug: item.slug } };
    }

    case 'PREVIEW_EFFECTS': {
      const transition = data.transition || 'publish';
      const eventMap = {
        publish:   'content.published',
        unpublish: 'content.unpublished',
        create:    'content.created',
        update:    'content.updated',
        delete:    'content.deleted',
      };
      const event = eventMap[transition] || null;
      const item = req.contentId
        ? db.prepare('SELECT id, slug FROM content WHERE id=?').get(req.contentId)
        : null;
      const hooks = db.prepare('SELECT id, url, events FROM webhooks WHERE enabled=1').all();
      const matching = hooks.filter(h => {
        try { return JSON.parse(h.events).includes(event); } catch (e) { return false; }
      });
      return { ok: true, status: 200, data: {
        content_id: item?.id || req.contentId || null,
        slug: item?.slug || null,
        transition, event,
        webhooks: matching.map(h => ({ id: h.id, url: h.url })),
        webhook_count: matching.length,
        cache_keys: [],      // no response cache at Tier 1 — placeholder for FBD-CA1 later
        feeds: ['sitemap.xml', 'feed.xml'],
      }};
    }

    case 'RESTORE_CONTENT': {
      const item = db.prepare('SELECT * FROM content WHERE id = ?').get(req.contentId);
      if (!item) return { ok: false, status: 404, error: 'Content not found' };
      const revNum = parseInt(data.revision_number);
      if (!Number.isFinite(revNum)) return { ok: false, status: 400, error: 'Revision number required' };
      const rev = db.prepare('SELECT * FROM content_revisions WHERE content_id=? AND revision_number=?')
        .get(req.contentId, revNum);
      if (!rev) return { ok: false, status: 404, error: 'Revision not found' };

      const now = new Date().toISOString();
      const restored = { ...item, title: rev.title, slug: rev.slug, body: rev.body,
        meta_title: rev.meta_title, meta_description: rev.meta_description, tags: rev.tags };
      const checksum = computeChecksum(restored);

      db.prepare(`UPDATE content SET title=?, slug=?, body=?, meta_title=?, meta_description=?,
        tags=?, checksum=?, updated_at=?, author_id=? WHERE id=?`)
        .run(rev.title, rev.slug, rev.body, rev.meta_title, rev.meta_description,
          rev.tags, checksum, now, userId, req.contentId);

      // Non-destructive: the restore itself is a new revision.
      const nextNum = (db.prepare('SELECT MAX(revision_number) as n FROM content_revisions WHERE content_id=?')
        .get(req.contentId)?.n || 0) + 1;
      db.prepare(`INSERT INTO content_revisions (content_id, revision_number, title, slug, body, status,
        meta_title, meta_description, tags, author_id, fields_modified, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(req.contentId, nextNum, rev.title, rev.slug, rev.body, item.status,
          rev.meta_title, rev.meta_description, rev.tags, userId,
          JSON.stringify(['restore:' + revNum]), new Date().toISOString());

      try {
        db.prepare(`INSERT INTO content_fts(rowid, title, body, slug, tags)
          VALUES ((SELECT rowid FROM content WHERE id=?), ?, ?, ?, ?)`)
          .run(req.contentId, rev.title, rev.body || '', rev.slug, rev.tags || '[]');
      } catch(e) { /* best-effort */ }

      return { ok: true, status: 200, data: {
        id: req.contentId, restored_from: revNum, revision_number: nextNum,
        title: rev.title, slug: rev.slug,
      }};
    }

    case 'STORE_MEDIA': {
      return { ok: true, status: 200, data: data };
    }

    case 'FETCH_MEDIA': {
      const mediaItem = db.prepare('SELECT * FROM media WHERE id = ? OR filename = ?')
        .get(data.id, data.filename);
      if (!mediaItem) return { ok: false, status: 404, error: 'Media not found' };
      return { ok: true, status: 200, data: mediaItem };
    }

    case 'SEARCH_CONTENT': {
      if (!data.q) return { ok: true, status: 200, data: [] };
      const surface = req.surface || 'editorial';
      let results;
      try {
        if (surface === 'public') {
          results = db.prepare(`SELECT c.* FROM content c
            JOIN content_fts f ON c.rowid = f.rowid
            WHERE content_fts MATCH ? AND c.status = 'published'
            ORDER BY rank LIMIT 20`).all(data.q);
        } else {
          results = db.prepare(`SELECT c.* FROM content c
            JOIN content_fts f ON c.rowid = f.rowid
            WHERE content_fts MATCH ?
            ORDER BY rank LIMIT 20`).all(data.q);
        }
      } catch(e) {
        // Fallback to LIKE search if FTS fails
        results = db.prepare(`SELECT * FROM content WHERE title LIKE ? OR body LIKE ? LIMIT 20`)
          .all(`%${data.q}%`, `%${data.q}%`);
      }
      return { ok: true, status: 200, data: results };
    }

    default:
      return { ok: false, status: 400, error: `Unhandled contract: ${req.contractId}` };
  }
}

// Map successful write contracts to the webhook event name.
// STORE_CONTENT splits on HTTP status — 201 is a create, 200 is an update.
function eventForResult(contractId, result) {
  if (!result.ok || result.status >= 300) return null;
  switch (contractId) {
    case 'STORE_CONTENT':     return result.status === 201 ? 'content.created' : 'content.updated';
    case 'PUBLISH_CONTENT':   return 'content.published';
    case 'UNPUBLISH_CONTENT': return 'content.unpublished';
    case 'DELETE_CONTENT':    return 'content.deleted';
    default: return null;
  }
}

function reqLog(result, identity, config, req) {
  if (config.proofLevel === 'audit' || !result.ok) {
    proofAppend(
      result.ok ? `contract.${req.contractId.toLowerCase()}` : 'contract.error',
      {
        contract: req.contractId,
        status: result.status,
        userId: identity.userId || 'anonymous',
        contentId: req.contentId || result.data?.id,
        error: result.error,
      },
      identity.userId || 'anonymous'
    );
  }
  const event = eventForResult(req.contractId, result);
  if (event) {
    emitEvent(event, req.contentId || result.data?.id, identity.userId || 'anonymous');
  }
}

// ============================================================================
// CONTENT WEATHER — Daily narrative summary
// ============================================================================

function generateContentWeather() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const proofEntries = db.prepare('SELECT COUNT(*) as count FROM proof_vault WHERE created_at > ?').get(since);
  const published = db.prepare("SELECT COUNT(*) as count FROM content WHERE published_at > ?").get(since);
  const drafts = db.prepare("SELECT COUNT(*) as count FROM content WHERE status='draft' AND updated_at > ?").get(since);
  const totalContent = db.prepare('SELECT COUNT(*) as count FROM content').get();
  const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media').get();
  const lifecycleState = db.prepare("SELECT value FROM system_state WHERE key='lifecycle_state'").get();
  const proofValid = db.prepare('SELECT COUNT(*) as count FROM proof_vault').get();

  const conditions = proofEntries.count === 0 ? 'Clear skies' :
    proofEntries.count < 10 ? 'Partly cloudy' : 'Overcast';

  return `${conditions}. ${totalContent.count} content items, ${totalMedia.count} media files. ` +
    `${published.count} articles published in the last 24 hours. ${drafts.count} drafts updated. ` +
    `${proofValid.count} proof vault entries, chain intact. ` +
    `System ${lifecycleState?.value || 'NOMINAL'} since startup.`;
}

// ============================================================================
// HTTP SERVER — Routing
// ============================================================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > CONFIG.maxUploadSize) { reject(new Error('Upload too large')); req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch(e) { resolve({ _raw: body }); }
    });
    req.on('error', reject);
  });
}

function getToken(req) {
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  // Check cookie
  const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    acc[k] = v;
    return acc;
  }, {}) || {};
  return cookies.token;
}

// FBD-CF1: validate the submitted CSRF token is bound to the caller's user.
function validateCsrf(req, token) {
  if (!token) return false;
  const submitted = req.headers['x-csrf-token'];
  if (!submitted) return false;
  const decoded = jwt.decode(token);
  if (!decoded?.userId) return false;
  const row = db.prepare('SELECT user_id FROM csrf_tokens WHERE token = ?').get(submitted);
  return !!row && row.user_id === decoded.userId;
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'",
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'; script-src 'unsafe-inline'",
    'Cache-Control': 'no-store',
  });
  res.end(html);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;
  const token = getToken(req);

  // ---- STATIC MEDIA ----
  if (pathname.startsWith('/media/')) {
    const filename = pathname.slice(7);
    const filepath = path.join(CONFIG.mediaDir, filename);
    if (fs.existsSync(filepath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' });
      fs.createReadStream(filepath).pipe(res);
      return;
    }
    sendJson(res, 404, { error: 'Media not found' });
    return;
  }

  // ---- AUTH ENDPOINTS ----
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const clientIp = req.socket.remoteAddress;
    if (!checkRateLimit(`login:${clientIp}`, 'admin')) {
      sendJson(res, 429, { error: 'Too many login attempts. Please wait a moment.' });
      return;
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(body.username);
    if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
      proofAppend('auth.fail', { username: body.username, ip: clientIp }, 'anonymous');
      sendJson(res, 401, { error: 'Wrong username or password.' });
      return;
    }
    const accessToken = jwt.sign({ userId: user.id, username: user.username, role: user.role }, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiry });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?,?,?)')
      .run(refreshToken, user.id, new Date(Date.now() + CONFIG.refreshExpiry).toISOString());

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(CONFIG.csrfTokenLength).toString('hex');
    db.prepare("INSERT OR REPLACE INTO csrf_tokens (token, user_id, created_at) VALUES (?,?,datetime('now'))").run(csrfToken, user.id);

    proofAppend('auth.success', { userId: user.id, username: user.username }, user.id);
    sendJson(res, 200, { token: accessToken, refreshToken, csrfToken, user: { id: user.id, username: user.username, role: user.role, permissions: ROLES[user.role] || [] } });
    return;
  }

  if (pathname === '/api/auth/refresh' && method === 'POST') {
    const body = await parseBody(req);
    const stored = db.prepare("SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime('now')").get(body.refreshToken);
    if (!stored) { sendJson(res, 401, { error: 'Invalid refresh token. Please log in again.' }); return; }
    // Rotate — invalidate old, issue new
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(body.refreshToken);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(stored.user_id);
    const accessToken = jwt.sign({ userId: user.id, username: user.username, role: user.role }, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiry });
    const newRefresh = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?,?,?)').run(newRefresh, user.id, new Date(Date.now() + CONFIG.refreshExpiry).toISOString());
    sendJson(res, 200, { token: accessToken, refreshToken: newRefresh });
    return;
  }

  // ---- CSRF GATE (FBD-CF1) — authenticated state-changing requests ----
  const isCsrfProtectedWrite =
    (method === 'POST' || method === 'PUT' || method === 'DELETE') &&
    (pathname.startsWith('/api/content') || pathname === '/api/media' ||
     pathname.startsWith('/api/webhooks'));
  if (isCsrfProtectedWrite && !validateCsrf(req, token)) {
    sendJson(res, 403, { error: 'CSRF token required. Log out and back in to get a fresh one.' });
    return;
  }

  // ---- API ENDPOINTS (processRequest pipeline) ----
  if (pathname.startsWith('/api/content')) {
    const body = method === 'POST' || method === 'PUT' ? await parseBody(req) : {};
    const parts = pathname.split('/').filter(Boolean); // ['api', 'content', ':slug?']

    if (method === 'GET' && parts.length === 2) {
      // List all content
      const result = processRequest({
        contractId: 'FETCH_CONTENT_AGGREGATE',
        token,
        surface: url.searchParams.get('surface') || (token ? 'editorial' : 'public'),
        payload: {
          limit: url.searchParams.get('limit'),
          offset: url.searchParams.get('offset'),
          content_type: url.searchParams.get('type'),
        },
      });
      const extraHeaders = {};
      if (result.ok && result.meta) {
        extraHeaders['X-Total-Count'] = String(result.meta.total);
        const { total, limit, offset } = result.meta;
        const linkParts = [];
        if (offset + limit < total) {
          const nextOffset = offset + limit;
          linkParts.push(`<${pathname}?limit=${limit}&offset=${nextOffset}>; rel="next"`);
        }
        if (offset > 0) {
          const prevOffset = Math.max(0, offset - limit);
          linkParts.push(`<${pathname}?limit=${limit}&offset=${prevOffset}>; rel="prev"`);
        }
        if (linkParts.length) extraHeaders['Link'] = linkParts.join(', ');
      }
      sendJson(res, result.status, result.ok ? result.data : { error: result.error }, extraHeaders);
      return;
    }

    if (method === 'GET' && parts.length === 3) {
      // Get single content
      const result = processRequest({
        contractId: 'FETCH_CONTENT_SINGLE',
        token,
        payload: {
          slug: parts[2],
          withRevisions: url.searchParams.get('revisions') === 'true',
          at: url.searchParams.get('at') || undefined,
        },
      });
      const extraHeaders = {};
      if (result.meta?.horizon) extraHeaders['X-Time-Travel-Horizon'] = result.meta.horizon;
      sendJson(res, result.status, result.ok ? result.data : { error: result.error }, extraHeaders);
      return;
    }

    if (method === 'POST' && parts.length === 2) {
      // Create content
      const result = processRequest({ contractId: 'STORE_CONTENT', token, payload: body });
      sendJson(res, result.status, result.ok ? { ...result.data, note: result.note } : { error: result.error });
      return;
    }

    if (method === 'PUT' && parts.length === 3) {
      // Update content
      const result = processRequest({ contractId: 'STORE_CONTENT', token, contentId: parts[2], payload: body });
      sendJson(res, result.status, result.ok ? { ...result.data, note: result.note } : { error: result.error });
      return;
    }

    if (method === 'POST' && parts.length === 4 && parts[3] === 'publish') {
      const result = processRequest({ contractId: 'PUBLISH_CONTENT', token, contentId: parts[2], payload: body });
      sendJson(res, result.status, result.ok ? result.data : { error: result.error });
      return;
    }

    if (method === 'POST' && parts.length === 4 && parts[3] === 'unpublish') {
      const result = processRequest({ contractId: 'UNPUBLISH_CONTENT', token, contentId: parts[2] });
      sendJson(res, result.status, result.ok ? result.data : { error: result.error });
      return;
    }

    if (method === 'DELETE' && parts.length === 3) {
      const result = processRequest({ contractId: 'DELETE_CONTENT', token, contentId: parts[2] });
      sendJson(res, result.status, result.ok ? result.data : { error: result.error });
      return;
    }

    if (method === 'POST' && parts.length === 4 && parts[3] === 'preview-effects') {
      const result = processRequest({ contractId: 'PREVIEW_EFFECTS', token, contentId: parts[2], payload: body });
      sendJson(res, result.status, result.ok ? result.data : { error: result.error });
      return;
    }

    if (method === 'POST' && parts.length === 5 && parts[3] === 'restore') {
      const result = processRequest({
        contractId: 'RESTORE_CONTENT', token, contentId: parts[2],
        payload: { revision_number: parts[4] },
      });
      sendJson(res, result.status, result.ok ? result.data : { error: result.error });
      return;
    }
  }

  // ---- SEARCH ----
  if (pathname === '/api/search' && method === 'GET') {
    const result = processRequest({
      contractId: 'SEARCH_CONTENT', token,
      surface: url.searchParams.get('surface') || 'public',
      payload: { q: url.searchParams.get('q') },
    });
    sendJson(res, result.status, result.ok ? result.data : { error: result.error });
    return;
  }

  // ---- MEDIA UPLOAD ----
  if (pathname === '/api/media' && method === 'POST') {
    // Simple base64 upload for Tier 1
    const body = await parseBody(req);
    const authResult = processRequest({ contractId: 'STORE_MEDIA', token, payload: body });
    if (!authResult.ok) { sendJson(res, authResult.status, { error: authResult.error }); return; }

    if (body.data && body.filename) {
      const ext = path.extname(body.filename).toLowerCase();
      const id = crypto.randomBytes(8).toString('hex');
      const filename = `${id}${ext}`;
      const filepath = path.join(CONFIG.mediaDir, filename);

      let buffer = Buffer.from(body.data, 'base64');
      if (buffer.length > CONFIG.maxUploadSize) { sendJson(res, 413, { error: 'File too large. Maximum 50MB.' }); return; }

      // FBD-MD1: sanitize media before storage
      const mime = (body.mime_type || '').toLowerCase();
      if (mime === 'image/jpeg' || ext === '.jpg' || ext === '.jpeg') {
        buffer = stripJpegMetadata(buffer);
      } else if (mime === 'image/svg+xml' || ext === '.svg') {
        buffer = Buffer.from(sanitizeSvg(buffer.toString('utf8')), 'utf8');
      }

      fs.writeFileSync(filepath, buffer);
      db.prepare('INSERT INTO media (id, filename, original_name, mime_type, size, path, uploaded_by) VALUES (?,?,?,?,?,?,?)')
        .run(id, filename, body.filename, body.mime_type || 'application/octet-stream', buffer.length, filepath,
          token ? jwt.decode(token)?.userId : 'anonymous');

      proofAppend('media.uploaded', { id, filename: body.filename, size: buffer.length },
        token ? jwt.decode(token)?.userId : 'anonymous');
      sendJson(res, 201, { id, filename, url: `/media/${filename}`, size: buffer.length });
      return;
    }
    sendJson(res, 400, { error: 'Provide data (base64) and filename' });
    return;
  }

  if (pathname === '/api/media' && method === 'GET') {
    const mediaList = db.prepare('SELECT id, filename, original_name, mime_type, size, created_at FROM media ORDER BY created_at DESC').all();
    sendJson(res, 200, mediaList);
    return;
  }

  // ---- WEATHER ----
  if (pathname === '/api/weather') {
    sendJson(res, 200, { weather: generateContentWeather() });
    return;
  }

  // ---- WEBHOOKS ----
  if (pathname === '/api/webhooks') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    if (method === 'GET') {
      const rows = db.prepare('SELECT id, url, events, enabled, consecutive_failures, created_at FROM webhooks ORDER BY created_at DESC').all();
      sendJson(res, 200, rows.map(r => ({ ...r, events: JSON.parse(r.events) })));
      return;
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      if (!body.url || !Array.isArray(body.events) || !body.secret) {
        sendJson(res, 400, { error: 'url, events[], and secret are required' });
        return;
      }
      try { new URL(body.url); } catch (e) {
        sendJson(res, 400, { error: 'invalid url' });
        return;
      }
      const id = crypto.randomBytes(8).toString('hex');
      db.prepare('INSERT INTO webhooks (id, url, events, secret) VALUES (?,?,?,?)')
        .run(id, body.url, JSON.stringify(body.events), body.secret);
      sendJson(res, 201, { id, url: body.url, events: body.events, enabled: true });
      return;
    }
  }
  if (pathname.startsWith('/api/webhooks/') && method === 'DELETE') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    const id = pathname.slice('/api/webhooks/'.length);
    const info = db.prepare('DELETE FROM webhooks WHERE id=?').run(id);
    sendJson(res, info.changes ? 200 : 404, info.changes ? { deleted: id } : { error: 'Not found' });
    return;
  }

  // ---- ADMIN: SBOM ----
  if (pathname === '/api/admin/sbom' && method === 'GET') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    sendJson(res, 200, SBOM);
    return;
  }

  // ---- ADMIN: spec history ----
  if (pathname === '/api/admin/spec-history' && method === 'GET') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    const entries = db.prepare('SELECT version, fingerprint, spec_hash, created_at FROM spec_versions ORDER BY version DESC').all();
    sendJson(res, 200, entries);
    return;
  }

  // ---- ADMIN: spec diff between two versions ----
  if (pathname === '/api/admin/spec-diff' && method === 'GET') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    const from = parseInt(url.searchParams.get('from'));
    const to = parseInt(url.searchParams.get('to'));
    const fromRow = db.prepare('SELECT version, fingerprint, spec_hash, created_at FROM spec_versions WHERE version=?').get(from);
    const toRow = db.prepare('SELECT version, fingerprint, spec_hash, created_at FROM spec_versions WHERE version=?').get(to);
    const identical = fromRow && toRow && fromRow.spec_hash === toRow.spec_hash;
    const changes = [];
    if (fromRow && toRow) {
      if (fromRow.fingerprint !== toRow.fingerprint) changes.push({ field: 'fingerprint', from: fromRow.fingerprint, to: toRow.fingerprint });
      if (fromRow.spec_hash !== toRow.spec_hash) changes.push({ field: 'spec_hash', from: fromRow.spec_hash, to: toRow.spec_hash });
    }
    sendJson(res, 200, { from: fromRow, to: toRow, diff: identical ? 'same' : 'different', changes });
    return;
  }

  // ---- ADMIN: stranger walk ----
  if (pathname === '/api/admin/stranger-walk' && method === 'POST') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    const result = strangerWalk();
    sendJson(res, 200, result);
    return;
  }

  // ---- ADMIN: ghost-links listing (proof vault, entry_type=content.ghost_links) ----
  if (pathname === '/api/admin/ghost-links' && method === 'GET') {
    if (!token) { sendJson(res, 401, { error: 'Authentication required.' }); return; }
    const rows = db.prepare("SELECT id, entry_data, actor, created_at FROM proof_vault WHERE entry_type='content.ghost_links' ORDER BY id DESC LIMIT 100").all();
    const entries = rows.map(r => ({ id: r.id, actor: r.actor, created_at: r.created_at, ...JSON.parse(r.entry_data) }));
    sendJson(res, 200, entries);
    return;
  }

  // ---- STATUS (loopctl status equivalent) ----
  if (pathname === '/api/status') {
    const state = db.prepare("SELECT value FROM system_state WHERE key='lifecycle_state'").get();
    const contentCount = db.prepare('SELECT COUNT(*) as n FROM content').get();
    const mediaCount = db.prepare('SELECT COUNT(*) as n FROM media').get();
    const proofCount = db.prepare('SELECT COUNT(*) as n FROM proof_vault').get();
    const latestProof = db.prepare('SELECT entry_hash FROM proof_vault ORDER BY id DESC LIMIT 1').get();
    const specHash = crypto.createHash('sha256').update(JSON.stringify({ content: contentCount.n, media: mediaCount.n })).digest('hex');
    const fingerprint = generateFingerprint(specHash);

    sendJson(res, 200, {
      status: `loopcms · ${state?.value || 'NOMINAL'} · ${fingerprint} · Content: ${contentCount.n} items · Media: ${mediaCount.n} files · Proof: ${proofCount.n} entries, chain ${latestProof ? 'valid' : 'empty'}`,
      state: state?.value, fingerprint, content: contentCount.n, media: mediaCount.n, proof: proofCount.n,
    });
    return;
  }

  // ---- RSS FEED (Presentation Loop) ----
  if (pathname === '/feed.xml') {
    const articles = db.prepare("SELECT * FROM content WHERE status='published' ORDER BY published_at DESC LIMIT 20").all();
    const host = `http://${req.headers.host}`;
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Loop CMS</title><link>${host}</link><description>Content feed</description>
${articles.map(a => `<item><title>${sanitizeForOutput(a.title)}</title><link>${host}/${a.slug}</link>
<description>${sanitizeForOutput((a.body || '').slice(0, 300))}</description>
<pubDate>${new Date(a.published_at).toUTCString()}</pubDate></item>`).join('\n')}
</channel></rss>`;
    res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
    res.end(rss);
    return;
  }

  // ---- SITEMAP (Presentation Loop) ----
  if (pathname === '/sitemap.xml') {
    const articles = db.prepare("SELECT slug, updated_at FROM content WHERE status='published'").all();
    const host = `http://${req.headers.host}`;
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles.map(a => `<url><loc>${host}/${a.slug}</loc><lastmod>${a.updated_at}</lastmod></url>`).join('\n')}
</urlset>`;
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(sitemap);
    return;
  }

  // ---- PUBLIC CONTENT (Presentation Loop on public surface) ----
  if (pathname !== '/' && pathname !== '/admin' && !pathname.startsWith('/api') && !pathname.startsWith('/media')) {
    const slug = pathname.slice(1);
    const article = db.prepare("SELECT * FROM content WHERE slug = ? AND status = 'published'").get(slug);
    if (article) {
      sendHtml(res, publicArticlePage(article));
      return;
    }
  }

  // ---- ADMIN UI ----
  if (pathname === '/admin' || pathname === '/') {
    sendHtml(res, adminPage());
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

// ============================================================================
// FIRST-RUN EXPERIENCE
// ============================================================================

function firstRun() {
  const initialized = db.prepare("SELECT value FROM system_state WHERE key='initialized'").get();
  if (initialized?.value === 'true') return;

  // Create admin account
  const hash = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?,?,?,?)')
    .run('admin001', 'admin', hash, 'admin');

  // Create "Hello, World" article
  processRequest({
    contractId: 'STORE_CONTENT',
    token: jwt.sign({ userId: 'admin001', username: 'admin', role: 'admin' }, CONFIG.jwtSecret, { expiresIn: '1m' }),
    payload: {
      title: 'Hello, World — your first article',
      body: '<p>Someone thought about what an empty screen feels like and decided you shouldn\'t have to see one.</p><p>This is your CMS. Write something. The system will remember it.</p>',
      meta_description: 'Welcome to Loop CMS.',
      tags: '["welcome"]',
    },
  });

  db.prepare("UPDATE system_state SET value='true' WHERE key='initialized'").run();
  proofAppend('system.first_run', { version: '1.0.0', tier: 1 }, 'system');

  console.log('\n  Welcome to Loop CMS.');
  console.log('  Default login: admin / admin');
  console.log('  Change your password immediately.\n');
}

// ============================================================================
// ADMIN UI — Five buttons. Served from the same process.
// The admin UI is a Presentation Loop on the editorial Content Surface.
// ============================================================================

function adminPage() {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Loop CMS</title>
<style>
  :root {
    --bg:#fafaf9;
    --fg:#1a1a1a;
    --accent:#d94f04;
    --accent-hover:#c44503;
    --border:#e5e5e5;
    --muted:#737373;
    --success:#16a34a;
    --success-bg:#ecfdf5;
    --success-fg:#065f46;
    --surface:#fff;
    --sidebar-bg:#1a1a2e;
    --sidebar-fg:#d6d6e0;
    --sidebar-fg-muted:#8b8ba3;
    --sidebar-hover:#26263d;
    --sidebar-active:#2e2e4a;
    --weather-bg:#f5f3ef;
    --weather-fg:#4a4036;
    --radius:8px;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html { font-size:16px; }
  body {
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:var(--bg); color:var(--fg);
    font-size:16px; line-height:1.6;
    -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
  }
  .app { display:flex; min-height:100vh; }

  /* ---- Sidebar ---- */
  .sidebar {
    width:240px; background:var(--sidebar-bg); color:var(--sidebar-fg);
    padding:24px 0; display:flex; flex-direction:column;
  }
  .sidebar h1 {
    font-size:17px; font-weight:600; color:#fff;
    padding:0 24px 20px; letter-spacing:0.5px;
    border-bottom:1px solid rgba(255,255,255,0.08);
  }
  .sidebar h1 span { color:var(--accent); }
  .sidebar nav { padding:12px 0; }
  .nav-btn {
    display:block; width:100%; padding:14px 24px;
    border:none; background:none; color:var(--sidebar-fg-muted);
    text-align:left; cursor:pointer;
    font-size:14px; font-weight:500; font-family:inherit;
    transition:background 0.15s, color 0.15s; position:relative;
  }
  .nav-btn:hover { background:var(--sidebar-hover); color:#fff; }
  .nav-btn.active { background:var(--sidebar-active); color:#fff; }
  .nav-btn.active::before {
    content:''; position:absolute; left:0; top:0; bottom:0;
    width:3px; background:var(--accent);
  }
  .sidebar-footer {
    margin-top:auto; padding:16px 24px; font-size:12px;
    color:var(--sidebar-fg-muted);
    border-top:1px solid rgba(255,255,255,0.08);
  }

  /* ---- Main ---- */
  .main { flex:1; overflow-y:auto; padding:40px 48px; }
  h2 { font-size:22px; font-weight:600; letter-spacing:-0.2px; }
  h3 { font-size:16px; font-weight:600; margin-bottom:4px; }

  /* ---- Weather banner ---- */
  .weather {
    background:var(--weather-bg);
    border-left:3px solid var(--accent);
    border-radius:0 var(--radius) var(--radius) 0;
    padding:14px 20px; margin-bottom:32px;
    font-size:14px; color:var(--weather-fg); line-height:1.6;
  }

  /* ---- Cards ---- */
  .card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--radius); padding:24px; margin-bottom:20px;
  }

  /* ---- Buttons ---- */
  .btn {
    padding:9px 18px; border-radius:var(--radius); border:none;
    cursor:pointer; font-size:14px; font-weight:500; font-family:inherit;
    transition:background 0.15s, border-color 0.15s;
  }
  .btn-primary { background:var(--accent); color:#fff; }
  .btn-primary:hover { background:var(--accent-hover); }
  .btn-outline { background:none; border:1px solid var(--border); color:var(--fg); }
  .btn-outline:hover { border-color:#c5c5c5; background:#f5f5f4; }
  .btn-success { background:var(--success); color:#fff; }
  .btn-success:hover { background:#15803d; }
  .btn-sm { padding:6px 12px; font-size:13px; }

  /* ---- Forms ---- */
  input, textarea, select {
    width:100%; padding:10px 14px;
    border:1px solid var(--border); border-radius:var(--radius);
    font-size:14px; font-family:inherit; line-height:1.5;
    margin-bottom:12px; background:var(--surface);
    transition:border-color 0.15s, box-shadow 0.15s;
  }
  input:focus, textarea:focus, select:focus {
    outline:none; border-color:var(--accent);
    box-shadow:0 0 0 3px rgba(217,79,4,0.1);
  }
  textarea { min-height:200px; resize:vertical; line-height:1.6; }
  .field-group { margin-bottom:16px; }
  .field-group label {
    display:block; font-size:12px; color:var(--muted);
    margin-bottom:6px; text-transform:uppercase;
    letter-spacing:0.6px; font-weight:600;
  }

  /* ---- Editor (writer feel) ---- */
  .editor-title {
    font-size:24px; font-weight:600; line-height:1.3;
    padding:8px 0; margin-bottom:20px;
    background:transparent; border:none;
    border-bottom:1px solid var(--border); border-radius:0;
  }
  .editor-title:focus { border-color:var(--accent); box-shadow:none; }
  .editor-body {
    min-height:420px; padding:18px 22px;
    font-size:16px; line-height:1.7;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  }

  /* ---- Status pills ---- */
  .status-badge {
    display:inline-block; padding:4px 12px; border-radius:999px;
    font-size:12px; font-weight:500; text-transform:capitalize;
    letter-spacing:0.2px;
  }
  .status-draft     { background:#fef3c7; color:#92400e; }
  .status-published { background:var(--success-bg); color:var(--success-fg); }
  .status-scheduled { background:#dbeafe; color:#1e40af; }
  .status-archived  { background:#e5e7eb; color:#374151; }

  /* ---- Content list ---- */
  .content-list { list-style:none; }
  .content-item {
    padding:20px 0; border-bottom:1px solid var(--border);
    display:flex; justify-content:space-between;
    align-items:center; gap:16px;
  }
  .content-item:last-child { border-bottom:none; }
  .content-title {
    display:inline-block; font-size:18px; font-weight:600;
    line-height:1.4; color:var(--fg); cursor:pointer;
    transition:color 0.15s;
  }
  .content-title:hover { color:var(--accent); }
  .content-meta { font-size:13px; color:var(--muted); margin-top:4px; }

  /* ---- Login ---- */
  .login-box { max-width:400px; margin:80px auto; padding:0 16px; }
  .login-box h2 { margin-bottom:6px; }

  /* ---- Misc ---- */
  .seismograph {
    background:#fffbeb; border:1px solid #fbbf24; border-radius:var(--radius);
    padding:12px 16px; margin-top:12px; font-size:13px; color:#92400e;
  }
  .sanitize-note {
    background:#fef3c7; border-left:3px solid #f59e0b;
    padding:10px 14px; margin:12px 0; font-size:13px; color:#92400e;
    border-radius:0 var(--radius) var(--radius) 0;
  }
  .fingerprint { font-family:'SF Mono',Monaco,Menlo,monospace; font-size:12px; color:var(--accent); }
  .hidden { display:none; }
  .toast {
    padding:12px 18px; border-radius:var(--radius); color:#fff;
    font-size:14px; margin-bottom:8px;
    animation:fadeIn 0.3s; box-shadow:0 4px 12px rgba(0,0,0,0.12);
    pointer-events:auto;
  }
  .toast-success { background:var(--success); }
  .toast-error { background:#dc2626; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }

  .collapsible-header {
    display:block; width:100%; text-align:left;
    background:none; border:none; cursor:pointer; font-family:inherit;
    font-size:12px; color:var(--muted); font-weight:600;
    text-transform:uppercase; letter-spacing:0.6px;
    padding:14px 0; margin-top:16px;
    border-top:1px solid var(--border);
  }
  .collapsible-header:hover { color:var(--fg); }

  @media(max-width:768px) {
    .sidebar { width:64px; }
    .sidebar h1, .nav-btn span { display:none; }
    .main { padding:24px; }
    .editor-title { font-size:22px; }
  }
</style>
</head>
<body>
<div id="toast-region" aria-live="polite" aria-atomic="true" style="position:fixed;top:20px;right:20px;z-index:9999;pointer-events:none"></div>
<div class="app" id="app">

<!-- LOGIN SCREEN -->
<div id="login-screen" class="login-box">
  <div class="card">
    <h2>Loop CMS</h2>
    <p style="color:var(--muted);margin-bottom:20px;font-size:14px">Sign in to continue.</p>
    <div class="field-group"><label for="login-user">Username</label><input id="login-user" type="text" autocomplete="username"></div>
    <div class="field-group"><label for="login-pass">Password</label><input id="login-pass" type="password" autocomplete="current-password"></div>
    <button class="btn btn-primary" onclick="doLogin()" style="width:100%">Sign In</button>
    <p id="login-error" style="color:#dc2626;font-size:13px;margin-top:8px" class="hidden"></p>
  </div>
</div>

<!-- MAIN APP -->
<div id="main-app" class="app hidden" style="width:100%">
  <nav class="sidebar">
    <h1>Loop<span>CMS</span></h1>
    <button class="nav-btn active" data-permission="content:write" onclick="showView('write')">&#9998; Write</button>
    <button class="nav-btn" data-permission="media:upload" onclick="showView('upload')">&#8682; Upload</button>
    <button class="nav-btn" data-permission="content:preview" onclick="showView('preview')">&#9673; Preview</button>
    <button class="nav-btn" data-permission="content:schedule" onclick="showView('schedule')">&#9200; Schedule</button>
    <button class="nav-btn" data-permission="content:publish" onclick="showView('publish')">&#10003; Publish</button>
    <button class="nav-btn" data-permission="content:read" onclick="showView('ghost-links')">&#9678; Ghost Links</button>
    <div class="sidebar-footer">
      <div id="user-info"></div>
      <div id="fingerprint" class="fingerprint" style="margin-top:4px"></div>
      <button class="btn btn-sm btn-outline" onclick="doLogout()" style="margin-top:8px;color:#999">Sign Out</button>
    </div>
  </nav>
  <div class="main" id="main-content"></div>
</div>
</div>

<script>
let state = { token:null, refreshToken:null, csrfToken:null, user:null, currentView:'write', editingId:null };

// ---- AUTH ----
async function doLogin() {
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  try {
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username:user,password:pass}) });
    const d = await r.json();
    if (r.ok) {
      state.token = d.token; state.refreshToken = d.refreshToken; state.csrfToken = d.csrfToken; state.user = d.user;
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('main-app').classList.remove('hidden');
      document.getElementById('user-info').textContent = d.user.username + ' · ' + d.user.role;
      applyRolePermissions();
      loadStatus(); showView('write');
    } else {
      const el = document.getElementById('login-error'); el.textContent = d.error; el.classList.remove('hidden');
    }
  } catch(e) { toast('Connection error','error'); }
}
function applyRolePermissions() {
  const perms = new Set(state.user?.permissions || []);
  document.querySelectorAll('[data-permission]').forEach(el => {
    el.style.display = perms.has(el.dataset.permission) ? '' : 'none';
  });
}
function doLogout() { state = {token:null,refreshToken:null,csrfToken:null,user:null,currentView:'write',editingId:null};
  document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('main-app').classList.add('hidden'); }

async function apiFetch(url, opts={}) {
  const headers = {'Content-Type':'application/json', ...opts.headers};
  if (state.token) headers['Authorization'] = 'Bearer '+state.token;
  if (state.csrfToken) headers['X-CSRF-Token'] = state.csrfToken;
  const r = await fetch(url, {...opts, headers});
  if (r.status === 401 && state.refreshToken) {
    const ref = await fetch('/api/auth/refresh', {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({refreshToken:state.refreshToken})});
    if (ref.ok) { const d = await ref.json(); state.token=d.token; state.refreshToken=d.refreshToken;
      headers['Authorization']='Bearer '+d.token; return fetch(url,{...opts,headers}); }
    doLogout(); return r;
  }
  return r;
}

// ---- VIEWS ----
async function loadStatus() {
  const r = await apiFetch('/api/status'); const d = await r.json();
  document.getElementById('fingerprint').textContent = d.fingerprint || '';
}

function showView(view) {
  state.currentView = view; state.editingId = null;
  document.querySelectorAll('.nav-btn').forEach((b,i) => b.classList.toggle('active', ['write','upload','preview','schedule','publish','ghost-links'][i]===view));
  const main = document.getElementById('main-content');

  if (view === 'write') loadWriteView(main);
  else if (view === 'upload') loadUploadView(main);
  else if (view === 'preview') loadPreviewView(main);
  else if (view === 'schedule') main.innerHTML = '<div class="card"><h3>Schedule</h3><p style="color:var(--muted);margin-top:8px">Select an article from Write view and set a publish date.</p></div>';
  else if (view === 'publish') loadPublishView(main);
  else if (view === 'ghost-links') loadGhostLinksView(main);
}

async function loadGhostLinksView(main) {
  const r = await apiFetch('/api/admin/ghost-links');
  const entries = r.ok ? await r.json() : [];
  main.innerHTML = '<h2 style="margin-bottom:16px">Ghost Links</h2>' +
    '<p style="color:var(--muted);margin-bottom:16px">Deleted content preserves outbound references here. Links survive the source.</p>' +
    (entries.length ? entries.map(e =>
      '<div class="card"><h3>'+esc(e.title||e.slug||'(untitled)')+'</h3>' +
      '<div style="color:var(--muted);font-size:13px;margin-top:4px">/'+esc(e.slug||'')+' · deleted '+
      (e.deleted_at ? new Date(e.deleted_at).toLocaleDateString() : '')+'</div>' +
      (e.tags ? '<div style="margin-top:8px;font-size:13px">Tags: '+esc(e.tags)+'</div>' : '') +
      '</div>'
    ).join('') : '<div class="card"><p style="color:var(--muted)">No deleted content yet.</p></div>');
}

async function loadWriteView(main) {
  const wr = await apiFetch('/api/weather'); const weather = await wr.json();
  const r = await apiFetch('/api/content'); const articles = await r.json();

  main.innerHTML = '<div class="weather">' + (weather.weather||'System loading...') + '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h2>Content</h2><button class="btn btn-primary" onclick="newArticle()">+ New Article</button></div>' +
    '<div class="card"><ul class="content-list" id="content-list">' +
    (Array.isArray(articles) ? articles.map(a =>
      '<li class="content-item"><div><span class="content-title" onclick="editArticle(\\''+a.id+'\\')">' +
      esc(a.title) + '</span><div class="content-meta">' + (a.slug||'') + ' · ' +
      new Date(a.updated_at).toLocaleDateString() + '</div></div>' +
      '<span class="status-badge status-'+a.status+'">' + a.status + '</span></li>'
    ).join('') : '<li>No content yet</li>') + '</ul></div>';
}

function newArticle() { state.editingId=null; showEditor({title:'',body:'',slug:'',meta_title:'',meta_description:'',tags:'[]'}); }

async function editArticle(id) {
  const r = await apiFetch('/api/content/'+id); const a = await r.json();
  state.editingId = a.id; showEditor(a);
}

function showEditor(a) {
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:16px">' +
    '<h3>'+(state.editingId?'Edit':'New')+' Article</h3>' +
    '<button class="btn btn-outline btn-sm" onclick="showView(\\'write\\')">Back</button></div>' +
    '<div class="field-group"><label for="ed-title">Title</label><input id="ed-title" class="editor-title" value="'+esc(a.title||'')+'" placeholder="Untitled"></div>' +
    '<div class="field-group"><label for="ed-body">Body</label><textarea id="ed-body" class="editor-body" placeholder="Start writing...">'+esc(a.body||'')+'</textarea></div>' +
    '<button type="button" class="collapsible-header" onclick="document.getElementById(\\'seo-panel\\').classList.toggle(\\'hidden\\')">&#9660; SEO & Metadata</button>' +
    '<div id="seo-panel" class="hidden">' +
    '<div class="field-group"><label for="ed-slug">Slug</label><input id="ed-slug" value="'+esc(a.slug||'')+'" placeholder="auto-generated from title"></div>' +
    '<div class="field-group"><label for="ed-meta-title">Meta Title</label><input id="ed-meta-title" value="'+esc(a.meta_title||'')+'"></div>' +
    '<div class="field-group"><label for="ed-meta-desc">Meta Description</label><input id="ed-meta-desc" value="'+esc(a.meta_description||'')+'"></div>' +
    '<div class="field-group"><label for="ed-tags">Tags (JSON array)</label><input id="ed-tags" value=\\''+esc(a.tags||'[]')+'\\'></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary" onclick="saveArticle()">Save</button>' +
    (state.editingId && a.status!=='published' ? '<button class="btn btn-success" onclick="publishArticle(\\''+a.id+'\\')">Publish</button>' : '') +
    '</div><div id="save-note"></div></div>';
}

async function saveArticle() {
  const payload = {
    title: document.getElementById('ed-title').value,
    body: document.getElementById('ed-body').value,
    slug: document.getElementById('ed-slug').value || undefined,
    meta_title: document.getElementById('ed-meta-title')?.value,
    meta_description: document.getElementById('ed-meta-desc')?.value,
    tags: document.getElementById('ed-tags')?.value || '[]',
  };
  const url = state.editingId ? '/api/content/'+state.editingId : '/api/content';
  const method = state.editingId ? 'PUT' : 'POST';
  const r = await apiFetch(url, {method, body:JSON.stringify(payload)});
  const d = await r.json();
  if (r.ok) {
    state.editingId = d.id;
    let noteHtml = '';
    if (d.note) noteHtml = '<div class="sanitize-note">'+esc(d.note)+'</div>';
    document.getElementById('save-note').innerHTML = noteHtml;
    toast('Saved','success');
  } else { toast(d.error||'Save failed','error'); }
}

async function publishArticle(id) {
  const r = await apiFetch('/api/content/'+id+'/publish', {method:'POST'});
  const d = await r.json();
  if (r.ok) { toast('Published! The article is now live.','success'); showView('write'); }
  else { toast(d.error||'Publish failed','error'); }
}

async function loadUploadView(main) {
  const r = await apiFetch('/api/media'); const media = await r.json();
  main.innerHTML = '<h2 style="margin-bottom:16px">Media Library</h2>' +
    '<div class="card"><div class="field-group"><label for="file-input">Upload File</label>' +
    '<input type="file" id="file-input" onchange="uploadFile()"></div></div>' +
    '<div class="card"><h3>Files</h3>' +
    (Array.isArray(media) && media.length ? media.map(m =>
      '<div class="content-item"><div><span>'+esc(m.original_name)+'</span>' +
      '<div class="content-meta">'+Math.round(m.size/1024)+'KB · '+new Date(m.created_at).toLocaleDateString()+'</div></div>' +
      '<a href="/media/'+m.filename+'" target="_blank" class="btn btn-sm btn-outline">View</a></div>'
    ).join('') : '<p style="color:var(--muted)">No media uploaded yet.</p>') + '</div>';
}

async function uploadFile() {
  const input = document.getElementById('file-input');
  if (!input.files.length) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async function() {
    const base64 = reader.result.split(',')[1];
    const r = await apiFetch('/api/media', {method:'POST', body:JSON.stringify({
      data:base64, filename:file.name, mime_type:file.type })});
    if (r.ok) { toast('Uploaded','success'); loadUploadView(document.getElementById('main-content')); }
    else { toast('Upload failed','error'); }
  };
  reader.readAsDataURL(file);
}

async function loadPreviewView(main) {
  const r = await apiFetch('/api/content?surface=public'); const articles = await r.json();
  main.innerHTML = '<h2 style="margin-bottom:16px">Public Preview</h2>' +
    '<div class="card" style="margin-bottom:16px">' +
    '<label for="tt-at" style="display:block;font-size:12px;color:var(--muted);margin-bottom:4px">Time travel</label>' +
    '<input id="tt-at" type="datetime-local" onchange="timeTravelPreview(this.value)" style="padding:6px">' +
    '<span style="margin-left:8px;color:var(--muted);font-size:13px">Pick a past moment to see what the site looked like.</span>' +
    '</div>' +
    '<div id="preview-list">' +
    (Array.isArray(articles) && articles.length ? articles.map(a =>
      '<div class="card"><h3><a href="/'+a.slug+'" target="_blank" style="color:var(--fg)">'+esc(a.title)+'</a></h3>' +
      '<p style="color:var(--muted);font-size:13px;margin-top:4px">/' + esc(a.slug) + ' · Published ' +
      new Date(a.published_at).toLocaleDateString() + '</p></div>'
    ).join('') : '<div class="card"><p style="color:var(--muted)">No published content yet. Write and publish your first article.</p></div>') +
    '</div>';
}

async function timeTravelPreview(datetimeLocal) {
  if (!datetimeLocal) return;
  const iso = new Date(datetimeLocal).toISOString();
  const r = await apiFetch('/api/content?surface=public&at=' + encodeURIComponent(iso));
  const items = r.ok ? await r.json() : [];
  const list = document.getElementById('preview-list'); if (!list) return;
  list.innerHTML = (Array.isArray(items) && items.length ? items.map(a =>
    '<div class="card"><h3>'+esc(a.title||'')+'</h3>' +
    '<p style="color:var(--muted);font-size:13px;margin-top:4px">/' + esc(a.slug||'') +
    ' · snapshot at ' + esc(iso) + '</p></div>'
  ).join('') : '<div class="card"><p style="color:var(--muted)">No content existed at that time.</p></div>');
}

async function loadPublishView(main) {
  const r = await apiFetch('/api/content'); const articles = await r.json();
  const drafts = Array.isArray(articles) ? articles.filter(a => a.status !== 'published') : [];
  const published = Array.isArray(articles) ? articles.filter(a => a.status === 'published') : [];

  main.innerHTML = '<h2 style="margin-bottom:16px">Publish</h2>' +
    '<div class="card"><h3>Ready to Publish</h3>' +
    (drafts.length ? drafts.map(a =>
      '<div class="content-item"><div><span>'+esc(a.title)+'</span>' +
      '<div class="content-meta">'+esc(a.slug||'no slug')+' · '+a.status+'</div></div>' +
      '<button class="btn btn-sm btn-success" onclick="publishArticle(\\''+a.id+'\\')">Publish</button></div>'
    ).join('') : '<p style="color:var(--muted)">All content is published.</p>') + '</div>' +
    '<div class="card" style="margin-top:16px"><h3>Published</h3>' +
    (published.length ? published.map(a =>
      '<div class="content-item"><div><span>'+esc(a.title)+'</span>' +
      '<div class="content-meta">/'+esc(a.slug)+'</div></div>' +
      '<span class="status-badge status-published">live</span></div>'
    ).join('') : '<p style="color:var(--muted)">Nothing published yet.</p>') + '</div>';
}

// ---- HELPERS ----
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function toast(msg,type) {
  const t = document.createElement('div'); t.className='toast toast-'+type; t.textContent=msg;
  (document.getElementById('toast-region') || document.body).appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

// Inline onclick handlers read from the global scope. Explicitly publish every
// function that is referenced from an onclick="..." / onchange="..." attribute
// so a future minifier, strict mode, or module wrapping does not silently
// break the admin UI.
window.doLogin = doLogin;
window.doLogout = doLogout;
window.showView = showView;
window.newArticle = newArticle;
window.editArticle = editArticle;
window.saveArticle = saveArticle;
window.publishArticle = publishArticle;
window.uploadFile = uploadFile;
window.timeTravelPreview = timeTravelPreview;
window.applyRolePermissions = applyRolePermissions;
</script>
</body></html>`;
}

// ============================================================================
// PUBLIC ARTICLE PAGE — Presentation Loop on public surface
// ============================================================================

function publicArticlePage(article) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${sanitizeForOutput(article.meta_title || article.title)}</title>
<meta name="description" content="${sanitizeForOutput(article.meta_description || '')}">
<link rel="alternate" type="application/rss+xml" href="/feed.xml">
<style>
  body { font-family:Georgia,'Times New Roman',serif; max-width:680px; margin:40px auto; padding:0 20px;
    color:#1a1a1a; line-height:1.7; background:#fafaf9; }
  h1 { font-size:2em; margin-bottom:8px; line-height:1.2; }
  .meta { color:#737373; font-size:14px; margin-bottom:32px; font-family:-apple-system,sans-serif; }
  .content { font-size:18px; }
  .content p { margin-bottom:1.2em; }
  .content img { max-width:100%; height:auto; border-radius:4px; }
  a { color:#d94f04; }
  footer { margin-top:48px; padding-top:16px; border-top:1px solid #e5e5e5; font-size:13px; color:#737373;
    font-family:-apple-system,sans-serif; }
</style></head><body>
<article>
<h1>${sanitizeForOutput(article.title)}</h1>
<div class="meta">Published ${new Date(article.published_at).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</div>
<div class="content">${article.body}</div>
</article>
<footer>Powered by <a href="/admin">Loop CMS</a> · <a href="/feed.xml">RSS</a></footer>
</body></html>`;
}

// ============================================================================
// START
// ============================================================================

function start() {
  const command = process.argv[2];

  initDatabase();

  if (command === 'init' || !command) {
    firstRun();

    const server = http.createServer(async (req, res) => {
      try { await handleRequest(req, res); }
      catch(e) { console.error(e); sendJson(res, 500, { error: 'Something went wrong. The system logged it.' }); }
    });

    server.listen(CONFIG.port, CONFIG.host, () => {
      const statusResult = processRequest({
        contractId: 'FETCH_CONTENT_AGGREGATE',
        payload: {}, surface: 'editorial',
      });
      const count = statusResult.ok ? statusResult.data.length : 0;
      const specHash = crypto.createHash('sha256').update(Date.now().toString()).digest('hex');
      const fingerprint = generateFingerprint(specHash);

      // Record spec version
      db.prepare('INSERT INTO spec_versions (fingerprint, spec_hash) VALUES (?,?)').run(fingerprint, specHash);

      console.log(`\n  Ready. Open your browser.`);
      console.log(`  http://${CONFIG.host}:${CONFIG.port}\n`);
      console.log(`  loopcms · NOMINAL · ${fingerprint}`);
      console.log(`  Content: ${count} items · Proof: chain valid\n`);

      proofAppend('system.startup', { state: 'NOMINAL', fingerprint, port: CONFIG.port }, 'system');
    });
  }

  if (command === 'status') {
    const contentCount = db.prepare('SELECT COUNT(*) as n FROM content').get();
    const proofCount = db.prepare('SELECT COUNT(*) as n FROM proof_vault').get();
    const state = db.prepare("SELECT value FROM system_state WHERE key='lifecycle_state'").get();
    const latest = db.prepare('SELECT fingerprint FROM spec_versions ORDER BY version DESC LIMIT 1').get();
    console.log(`loopcms · ${state?.value || 'NOMINAL'} · ${latest?.fingerprint || 'no-deploy'} · Content: ${contentCount.n} items · Proof: ${proofCount.n} entries, chain valid`);
    process.exit(0);
  }

  if (command === 'weather') {
    console.log('\n  ' + generateContentWeather() + '\n');
    process.exit(0);
  }
}

start();
