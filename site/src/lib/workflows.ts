import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { parseWorkflow, validateWorkflow } from "@sweny-ai/core/schema";
import type { MarketplaceWorkflow, MarketplaceMetadata, Category, CardColor, DerivedVariable } from "./types";
import { SKILL_CONFIG } from "./types";

const WORKFLOWS_DIR = path.resolve(process.cwd(), "../workflows");

const VALID_CATEGORIES = new Set<string>([
  "triage", "security", "devops", "code-review", "testing", "content", "ops",
]);

/**
 * Derive required environment variables from a workflow's skills.
 * Always includes ANTHROPIC_API_KEY first.
 * Merges with manual variables from YAML (if any) for override descriptions.
 */
function deriveVariables(skillIds: string[], manualVars?: Array<{ name: string; description?: string; required?: boolean }>): DerivedVariable[] {
  const vars: DerivedVariable[] = [
    { name: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude", required: true, skill: "core" },
  ];
  const seen = new Set<string>(["ANTHROPIC_API_KEY"]);

  // Build a lookup from manual variables for description overrides
  const manualLookup = new Map<string, { description?: string; required?: boolean }>();
  if (manualVars) {
    for (const v of manualVars) manualLookup.set(v.name, v);
  }

  for (const skillId of skillIds) {
    const fields = SKILL_CONFIG[skillId];
    if (!fields) continue;
    for (const field of fields) {
      if (seen.has(field.env)) continue;
      seen.add(field.env);
      const manual = manualLookup.get(field.env);
      vars.push({
        name: field.env,
        description: manual?.description ?? field.description,
        required: manual?.required ?? field.required,
        skill: skillId,
      });
    }
  }

  return vars;
}

function readYamlFiles(dir: string, source: "official" | "community"): MarketplaceWorkflow[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  const workflows: MarketplaceWorkflow[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parse(raw);

    try {
      const workflow = parseWorkflow(parsed);
      const errors = validateWorkflow(workflow);
      if (errors.length > 0) {
        console.warn(`Skipping ${file}: ${errors.map((e) => e.message).join(", ")}`);
        continue;
      }

      const meta: MarketplaceMetadata = {
        author: parsed.author ?? "unknown",
        category: VALID_CATEGORIES.has(parsed.category) ? (parsed.category as Category) : "ops",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        icon: parsed.icon,
        color: parsed.color as CardColor | undefined,
        version: parsed.version ?? "1.0.0",
        sweny_version: parsed.sweny_version,
        variables: Array.isArray(parsed.variables) ? parsed.variables : undefined,
      };

      const allSkills = new Set<string>();
      for (const node of Object.values(workflow.nodes)) {
        for (const skill of node.skills) {
          allSkills.add(skill);
        }
      }

      // Extract inline custom skills from the workflow's skills block
      const customSkills: MarketplaceWorkflow["customSkills"] = {};
      if (parsed.skills && typeof parsed.skills === "object") {
        for (const [id, def] of Object.entries(parsed.skills as Record<string, MarketplaceWorkflow["customSkills"][string]>)) {
          customSkills[id] = def;
          allSkills.add(id);
        }
      }

      const skillList = [...allSkills];
      workflows.push({
        ...workflow,
        ...meta,
        source,
        filePath: `workflows/${source}/${file}`,
        nodeCount: Object.keys(workflow.nodes).length,
        edgeCount: workflow.edges.length,
        skills: skillList,
        customSkills,
        derivedVariables: deriveVariables(skillList, meta.variables),
        sampleOutput: typeof parsed.sample_output === "string" ? parsed.sample_output : undefined,
      });
    } catch (err) {
      console.warn(`Skipping ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return workflows;
}

let cachedWorkflows: MarketplaceWorkflow[] | null = null;

export function getAllWorkflows(): MarketplaceWorkflow[] {
  if (cachedWorkflows) return cachedWorkflows;

  const official = readYamlFiles(path.join(WORKFLOWS_DIR, "official"), "official");
  const community = readYamlFiles(path.join(WORKFLOWS_DIR, "community"), "community");

  cachedWorkflows = [
    ...official.sort((a, b) => a.name.localeCompare(b.name)),
    ...community.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return cachedWorkflows;
}

export function getWorkflowById(id: string): MarketplaceWorkflow | undefined {
  return getAllWorkflows().find((w) => w.id === id);
}

export function buildSearchIndex() {
  return getAllWorkflows().map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    author: w.author,
    category: w.category,
    tags: w.tags,
    skills: w.skills,
    source: w.source,
  }));
}
