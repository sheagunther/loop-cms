#!/usr/bin/env node
// Bundle loopcms.js into a single zero-dep file.
// npm dependencies (bcryptjs, jsonwebtoken) are inlined; node built-ins stay
// as runtime requires so the output runs under plain `node dist/loopcms.js`.

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { builtinModules } = require('module');

const outfile = path.join(__dirname, 'dist', 'loopcms.js');
fs.mkdirSync(path.dirname(outfile), { recursive: true });

const external = [
  ...builtinModules,
  ...builtinModules.map(m => 'node:' + m),
];

esbuild.build({
  entryPoints: [path.join(__dirname, 'loopcms.js')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile,
  external,
  legalComments: 'inline',
  // admin.html is required as a module — esbuild inlines its text content
  // so the bundled output needs no runtime fs lookup for it.
  loader: { '.html': 'text' },
}).then(() => {
  fs.chmodSync(outfile, 0o755);
  const size = fs.statSync(outfile).size;
  console.log(`bundled ${path.relative(__dirname, outfile)} (${(size/1024).toFixed(1)} KB)`);
}).catch(err => { console.error(err); process.exit(1); });
