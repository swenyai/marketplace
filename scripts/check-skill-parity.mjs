/**
 * Verify SKILL_CONFIG in site/src/lib/types.ts matches @sweny-ai/core builtinSkills.
 * Run: node scripts/check-skill-parity.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const { builtinSkills } = await import("@sweny-ai/core");

// Parse SKILL_CONFIG from types.ts at build time via dynamic import
// We import the site module indirectly by evaluating the TS-like structure
const typesPath = join(process.cwd(), "site/src/lib/types.ts");
const typesContent = readFileSync(typesPath, "utf-8");

// Extract SKILL_CONFIG object from source (between the assignment and the closing };)
const match = typesContent.match(/export const SKILL_CONFIG[^=]*=\s*(\{[\s\S]*?\n\};)/);
if (!match) {
  console.error("Could not parse SKILL_CONFIG from types.ts");
  process.exit(1);
}

let hasErrors = false;

for (const skill of builtinSkills) {
  const coreKeys = Object.keys(skill.config || {});
  if (coreKeys.length === 0) continue;

  // Check SKILL_CONFIG has this skill
  const skillRegex = new RegExp(`${skill.id}:\\s*\\[`);
  if (!skillRegex.test(match[1])) {
    console.error(`\n  SKILL_CONFIG missing skill: ${skill.id}`);
    hasErrors = true;
    continue;
  }

  // Check each config key is present
  for (const key of coreKeys) {
    if (!match[1].includes(`"${key}"`)) {
      console.error(`  SKILL_CONFIG[${skill.id}] missing env: ${key}`);
      hasErrors = true;
    }
  }

  // Check descriptions match
  for (const [key, field] of Object.entries(skill.config || {})) {
    const descMatch = match[1].match(new RegExp(`env:\\s*"${key}"[^}]*description:\\s*"([^"]+)"`));
    const descMatch2 = match[1].match(new RegExp(`description:\\s*"([^"]+)"[^}]*env:\\s*"${key}"`));
    const foundDesc = descMatch?.[1] || descMatch2?.[1];
    if (foundDesc && foundDesc !== field.description) {
      console.error(`  SKILL_CONFIG[${skill.id}].${key} description mismatch:`);
      console.error(`    core: "${field.description}"`);
      console.error(`    site: "${foundDesc}"`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error("\nSKILL_CONFIG parity check failed. Update site/src/lib/types.ts and skills-browser-shim.js to match core.");
  process.exit(1);
} else {
  console.log("SKILL_CONFIG parity check passed.");
}
