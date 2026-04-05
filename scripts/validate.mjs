import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const { parseWorkflow, validateWorkflow } = await import("@sweny-ai/core/schema");

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
      const structuralErrors = validateWorkflow(workflow);
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
