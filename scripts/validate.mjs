import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const { parseWorkflow, validateWorkflow } = await import("@sweny-ai/core/schema");
const { builtinSkills } = await import("@sweny-ai/core");
const KNOWN_SKILL_IDS = new Set(builtinSkills.map((s) => s.id));

const VALID_CATEGORIES = new Set([
  "triage", "security", "devops", "code-review", "testing", "content", "ops",
]);

const dirs = ["workflows/official", "workflows/community"];
let hasErrors = false;

for (const dir of dirs) {
  if (!existsSync(dir)) continue;

  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  for (const file of files) {
    const path = join(dir, file);
    const raw = readFileSync(path, "utf-8");
    const errors = [];

    try {
      const parsed = parse(raw);

      const workflow = parseWorkflow(parsed);
      // Merge builtin skill IDs with any inline skills defined in this workflow
      const workflowSkillIds = new Set(KNOWN_SKILL_IDS);
      if (parsed.skills && typeof parsed.skills === "object") {
        for (const skillId of Object.keys(parsed.skills)) {
          workflowSkillIds.add(skillId);
        }
      }
      const structuralErrors = validateWorkflow(workflow, workflowSkillIds);
      for (const e of structuralErrors) {
        errors.push(`[structure] ${e.message}`);
      }

      if (!parsed.author) errors.push("[metadata] missing 'author'");
      if (!parsed.category) errors.push("[metadata] missing 'category'");
      else if (!VALID_CATEGORIES.has(parsed.category))
        errors.push(`[metadata] invalid category '${parsed.category}'`);
      if (!parsed.tags || !Array.isArray(parsed.tags) || parsed.tags.length === 0)
        errors.push("[metadata] missing or empty 'tags'");
      if (!parsed.version) errors.push("[metadata] missing 'version'");

      if (!/^[a-z0-9-]+$/.test(parsed.id))
        errors.push(`[metadata] id must be lowercase alphanumeric with hyphens: '${parsed.id}'`);

      // Validate inline skills block
      if (parsed.skills && typeof parsed.skills === "object") {
        for (const [skillId, def] of Object.entries(parsed.skills)) {
          if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(skillId) || skillId.includes("--") || skillId.length > 64) {
            errors.push(`[skills] invalid skill ID '${skillId}' (lowercase alphanumeric + hyphens, no consecutive hyphens, max 64 chars)`);
          }
          if (!def.instruction && !def.mcp) {
            errors.push(`[skills] skill '${skillId}' must have instruction or mcp`);
          }
        }
      }
    } catch (e) {
      errors.push(`[parse] ${e.message}`);
    }

    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\n❌ ${path}:`);
      for (const e of errors) console.error(`   ${e}`);
    } else {
      console.log(`✓ ${path}`);
    }
  }
}

if (hasErrors) {
  console.error("\nValidation failed.");
  process.exit(1);
} else {
  console.log("\nAll workflows valid.");
}
