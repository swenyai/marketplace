import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yaml"],
  // `@sweny-ai/core/dist/skills/index.js` imports `node:fs` + `node:path` at module
  // scope for custom-skill discovery. That top-level import blows up Turbopack's
  // client chunking and any browser-targeted bundler. The marketplace never uses
  // `loadCustomSkills()` — only the static `builtinSkills` catalog.
  //
  // Fix applied via `postinstall` script (`scripts/patch-sweny-core.mjs`), which
  // overwrites the offending file with the browser-safe shim at
  // `src/lib/skills-browser-shim.js`. The patch is idempotent and backed up.
  // That makes both webpack (build) and Turbopack (dev) work without custom aliasing.
};

export default nextConfig;
