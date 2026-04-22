# Loop CMS

A content management system that fits in one file. Run one command, open your browser, see five buttons: Write, Upload, Preview, Schedule, Publish. Everything you write goes to a SQLite database on disk with a hash-chained audit log underneath. Drop the file, kill the process, yank the power — the next boot picks up exactly where you left off. The system that lost everything once made a promise: never again.

## Quick Start

Download [`loopcms.js`](https://github.com/sheagunther/loop-cms/releases/latest/download/loopcms.js) from the latest release. Run it:

```
node loopcms.js
```

That's it. No `npm install`, no `node_modules`, no `package.json`. One file, 262 KB, zero dependencies.

Open http://localhost:3000. First-run seeds an admin account (`admin` / `admin`). Change the password immediately.

## Development

To work on the source, run tests, or rebuild the bundle:

```
git clone https://github.com/sheagunther/loop-cms.git
cd loop-cms
npm install
npm test         # runs the 54-test acceptance suite
npm run build    # produces dist/loopcms.js
```

## What it does

- **Sanitizes content.** Script tags, iframes, and event handlers are stripped on write. JPEGs lose their EXIF on upload. SVGs lose their scripts. The editor tells you what was cleaned up and why.
- **Proof Vault.** Every auth event, content change, and system transition appends to an append-only ledger where each entry's hash is derived from the previous one's. You can prove what happened and in what order.
- **Revision history.** Every save creates a new revision. Restore any prior version — the restore itself becomes the next revision, so the chain is never rewritten.
- **Time travel.** Any content URL accepts `?at=<timestamp>`. Read the site as it existed at that instant. The response tells you how far back the archive goes.
- **Full-text search.** SQLite FTS5 across title, body, slug, and tags. Public search sees published articles; editors see drafts too.
- **RSS, Atom, sitemap.xml.** Generated from the live database on every request. Publish an article, the feeds update.
- **REST API.** `/api/content`, `/api/content/:slug`, `/api/search`, `/api/media`. JWT-authenticated, CSRF-gated, rate-limited, with pagination headers.
- **Constellation Fingerprint.** Every running instance gets a human-memorable name — `amber-lighthouse-42`, `winter-temple-88`. `loopcms · NOMINAL · amber-lighthouse-42` tells you which version is running on which server without reading a git sha.
