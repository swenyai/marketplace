import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dirs = ["workflows/official", "workflows/community"];
const idMap = new Map();
let hasDuplicates = false;

for (const dir of dirs) {
  if (!existsSync(dir)) continue;

  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  for (const file of files) {
    const path = join(dir, file);
    const raw = readFileSync(path, "utf-8");
    try {
      const parsed = parse(raw);
      const id = parsed.id;
      if (idMap.has(id)) {
        hasDuplicates = true;
        console.error(`❌ Duplicate id '${id}': ${idMap.get(id)} and ${path}`);
      } else {
        idMap.set(id, path);
      }
    } catch {
      // Skip unparseable files (validate.mjs will catch these)
    }
  }
}

if (hasDuplicates) {
  console.error("\nDuplicate IDs found.");
  process.exit(1);
} else {
  console.log(`✓ All ${idMap.size} workflow IDs are unique.`);
}
