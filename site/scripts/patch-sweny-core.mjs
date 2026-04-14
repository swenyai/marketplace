#!/usr/bin/env node
/**
 * Patch @sweny-ai/core/dist/skills/index.js in-place.
 *
 * Upstream bug: `skills/index.js` imports `node:fs` + `node:path` at module
 * scope for `loadCustomSkills()` custom-skill discovery. Neither Turbopack's
 * client chunking context nor bundlers targeting `browser` tolerate a
 * top-level `node:*` import.
 *
 * The marketplace site never calls `loadCustomSkills()` — it only needs the
 * static `builtinSkills` catalog for DAG node coloring. So we overwrite the
 * file with a browser-safe version copied from `src/lib/skills-browser-shim.js`,
 * which exports the same `builtinSkills` data without the `node:fs` import.
 *
 * Run automatically via `postinstall`. Idempotent: re-applies only if the
 * target file still contains the problematic import.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, "..", "node_modules", "@sweny-ai", "core", "dist", "skills", "index.js");
const shim = resolve(__dirname, "..", "src", "lib", "skills-browser-shim.js");

if (!existsSync(target)) {
  // Running before install; nothing to patch.
  process.exit(0);
}
if (!existsSync(shim)) {
  console.error(`patch-sweny-core: shim missing at ${shim}`);
  process.exit(1);
}

const contents = readFileSync(target, "utf8");
if (!contents.includes('from "node:fs"')) {
  // Already patched (or upstream fixed). No-op.
  process.exit(0);
}

// Back up once so repeated runs don't chain-overwrite backups.
const backup = target + ".orig";
if (!existsSync(backup)) {
  copyFileSync(target, backup);
}

const shimContents = readFileSync(shim, "utf8");
writeFileSync(target, shimContents);
console.log(`patch-sweny-core: replaced ${target} with browser-safe shim`);
