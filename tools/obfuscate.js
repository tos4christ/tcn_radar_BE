#!/usr/bin/env node
/**
 * In-place backend obfuscator for the `obfuscate` git branch.
 *
 * It rewrites the project's own server .js files (and bin/www) into an unreadable but functionally
 * identical form, so that the code on the server cannot be read at a glance. Run it ONLY on the
 * `obfuscate` branch, then commit the result. The readable source stays on the normal branch, and
 * `git checkout <normal branch>` restores it (see tools/OBFUSCATION_GUIDE.md).
 *
 *   node tools/obfuscate.js            obfuscate in place (overwrites the files)
 *   node tools/obfuscate.js --dry      list what would change, write nothing
 *   node tools/obfuscate.js --check    after writing, node --check every output (also done per file)
 *
 * What is touched: app.js, bin/www, and every .js under routes/ controllers/ models/ utility/
 * database/ weather2/ axis/. What is NOT touched: node_modules, build, dist, public, .env, the SSL
 * folders, .sql / .json / certificates, and this tools/ folder. Those are either third-party,
 * static, secret, or read as data by path (so they must stay as they are).
 *
 * Safety: each file is obfuscated, then `node --check`ed before it is written back. If any file
 * fails, nothing is written and the run aborts, so a half-obfuscated tree can never reach the server.
 *
 * Needs the dev tool:  npm install --save-dev javascript-obfuscator
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

let Obfuscator;
try {
  Obfuscator = require('javascript-obfuscator');
} catch (e) {
  console.error('\n  javascript-obfuscator is not installed. Run:\n    npm install --save-dev javascript-obfuscator\n');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry');

// Folders to walk for .js files, plus the extensionless entry script.
const INCLUDE_DIRS = ['routes', 'controllers', 'models', 'utility', 'database', 'weather2', 'axis'];
const INCLUDE_FILES = ['app.js', path.join('bin', 'www')];
// Never descend into these (third-party, static, secret, or data read by path).
const SKIP_DIRS = new Set(['node_modules', 'build', 'dist', 'public', 'tools', 'migrations', 'nisossl', 'ssl', '.git']);

/**
 * Options chosen for a live, real-time server:
 *  - identifiers renamed and string literals hidden  -> the code is unreadable
 *  - property names, globals and console kept         -> pg rows, req/res, socket.io and logging work
 *  - control-flow flattening and dead code OFF        -> no slowdown of the socket / MQTT hot path
 *  - selfDefending OFF                                -> crashes still give a usable stack to debug
 */
const OPTIONS = {
  target: 'node',
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  renameProperties: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayCallsTransform: true,
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  numbersToExpressions: false,
  simplify: true,
  selfDefending: false,
  disableConsoleOutput: false,
  sourceMap: false,
  unicodeEscapeSequence: false,
};

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (name.endsWith('.js')) {
      out.push(full);
    }
  }
}

function collectFiles() {
  const out = [];
  for (const d of INCLUDE_DIRS) {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) walk(full, out);
  }
  for (const f of INCLUDE_FILES) {
    const full = path.join(ROOT, f);
    if (fs.existsSync(full)) out.push(full);
  }
  // de-duplicate and keep this script out of the list no matter what
  const self = path.join(__dirname, 'obfuscate.js');
  return [...new Set(out)].filter((f) => f !== self);
}

function nodeCheck(code, label) {
  const tmp = path.join(os.tmpdir(), `obf_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmp, code);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (err) {
    throw new Error(`node --check failed for ${label}: ${String(err.stderr || err.message).slice(0, 300)}`);
  } finally {
    fs.unlinkSync(tmp);
  }
}

function main() {
  const files = collectFiles();
  console.log(`Found ${files.length} source file(s) to obfuscate.`);
  const results = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const original = fs.readFileSync(file, 'utf8');
    // Keep the shebang on bin/www (the obfuscator drops comments).
    const shebang = original.startsWith('#!') ? `${original.split('\n', 1)[0]}\n` : '';
    const body = shebang ? original.slice(shebang.length) : original;
    let obf;
    try {
      obf = Obfuscator.obfuscate(body, OPTIONS).getObfuscatedCode();
    } catch (err) {
      console.error(`\n  ABORTED: could not obfuscate ${rel}: ${err.message}\n  Nothing was written.`);
      process.exit(1);
    }
    const out = shebang + obf;
    try {
      nodeCheck(out, rel);
    } catch (err) {
      console.error(`\n  ABORTED: ${err.message}\n  Nothing was written.`);
      process.exit(1);
    }
    results.push({ file, rel, out, from: original.length, to: out.length });
  }

  if (DRY) {
    results.forEach((r) => console.log(`  would obfuscate ${r.rel}  (${r.from} -> ${r.to} bytes)`));
    console.log(`\nDry run: ${results.length} file(s) checked, none written.`);
    return;
  }

  // All files obfuscated and syntax-checked: now write them.
  results.forEach((r) => fs.writeFileSync(r.file, r.out));
  console.log(`Obfuscated and wrote ${results.length} file(s) in place.`);
  console.log('Next: smoke-test (npm start or pm2), then commit on the obfuscate branch.');
  console.log('Revert anytime with: git checkout <your normal branch> -- . (or switch branches).');
}

main();
