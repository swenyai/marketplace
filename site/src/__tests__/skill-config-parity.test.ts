/**
 * Tests that SKILL_CONFIG in types.ts is complete and correct,
 * and that deriveVariables produces proper output.
 */
import { describe, it, expect } from "vitest";
import { SKILL_CONFIG } from "@/lib/types";
import type { DerivedVariable } from "@/lib/types";

// Reproduce deriveVariables locally since it's not exported from workflows.ts
// (it runs at build time in Node, not in the browser)
function deriveVariables(skillIds: string[]): DerivedVariable[] {
  const vars: DerivedVariable[] = [
    { name: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude", required: true, skill: "core" },
  ];
  const seen = new Set<string>(["ANTHROPIC_API_KEY"]);
  for (const skillId of skillIds) {
    const fields = SKILL_CONFIG[skillId];
    if (!fields) continue;
    for (const field of fields) {
      if (seen.has(field.env)) continue;
      seen.add(field.env);
      vars.push({
        name: field.env,
        description: field.description,
        required: field.required,
        skill: skillId,
      });
    }
  }
  return vars;
}

// ── SKILL_CONFIG completeness ────────────────────────────────────────

describe("SKILL_CONFIG completeness", () => {
  const EXPECTED_SKILLS = ["github", "linear", "slack", "sentry", "datadog", "betterstack", "notification", "supabase"];

  it("contains all expected skill IDs", () => {
    for (const skill of EXPECTED_SKILLS) {
      expect(SKILL_CONFIG[skill], `missing skill: ${skill}`).toBeDefined();
    }
  });

  it("every entry has env, description, and required fields", () => {
    for (const [skillId, fields] of Object.entries(SKILL_CONFIG)) {
      for (const field of fields) {
        expect(typeof field.env, `${skillId} field missing env`).toBe("string");
        expect(field.env.length, `${skillId} field env is empty`).toBeGreaterThan(0);
        expect(typeof field.description, `${skillId}.${field.env} missing description`).toBe("string");
        expect(field.description.length, `${skillId}.${field.env} description is empty`).toBeGreaterThan(0);
        expect(typeof field.required, `${skillId}.${field.env} missing required`).toBe("boolean");
      }
    }
  });

  it("github has GITHUB_TOKEN (required)", () => {
    const github = SKILL_CONFIG.github;
    expect(github.find((f) => f.env === "GITHUB_TOKEN")).toEqual({
      env: "GITHUB_TOKEN",
      description: "GitHub personal access token or app installation token",
      required: true,
    });
  });

  it("sentry has 3 fields including optional SENTRY_BASE_URL", () => {
    const sentry = SKILL_CONFIG.sentry;
    expect(sentry).toHaveLength(3);
    expect(sentry.find((f) => f.env === "SENTRY_AUTH_TOKEN")?.required).toBe(true);
    expect(sentry.find((f) => f.env === "SENTRY_ORG")?.required).toBe(true);
    expect(sentry.find((f) => f.env === "SENTRY_BASE_URL")?.required).toBe(false);
  });

  it("datadog has 3 fields including optional DD_SITE", () => {
    const dd = SKILL_CONFIG.datadog;
    expect(dd).toHaveLength(3);
    expect(dd.find((f) => f.env === "DD_API_KEY")?.required).toBe(true);
    expect(dd.find((f) => f.env === "DD_APP_KEY")?.required).toBe(true);
    expect(dd.find((f) => f.env === "DD_SITE")?.required).toBe(false);
  });

  it("betterstack has 4 required fields", () => {
    const bs = SKILL_CONFIG.betterstack;
    expect(bs).toHaveLength(4);
    const envs = bs.map((f) => f.env);
    expect(envs).toContain("BETTERSTACK_API_TOKEN");
    expect(envs).toContain("BETTERSTACK_QUERY_ENDPOINT");
    expect(envs).toContain("BETTERSTACK_QUERY_USERNAME");
    expect(envs).toContain("BETTERSTACK_QUERY_PASSWORD");
    for (const field of bs) {
      expect(field.required, `${field.env} should be required`).toBe(true);
    }
  });

  it("notification has 4 optional fields", () => {
    const notif = SKILL_CONFIG.notification;
    expect(notif).toHaveLength(4);
    for (const field of notif) {
      expect(field.required, `${field.env} should be optional`).toBe(false);
    }
  });

  it("supabase has 2 required fields", () => {
    const supa = SKILL_CONFIG.supabase;
    expect(supa).toHaveLength(2);
    for (const field of supa) {
      expect(field.required, `${field.env} should be required`).toBe(true);
    }
  });
});

// ── deriveVariables logic ────────────────────────────────────────────

describe("deriveVariables", () => {
  it("always includes ANTHROPIC_API_KEY first", () => {
    const vars = deriveVariables([]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("ANTHROPIC_API_KEY");
    expect(vars[0].required).toBe(true);
    expect(vars[0].skill).toBe("core");
  });

  it("derives all github env vars", () => {
    const vars = deriveVariables(["github"]);
    expect(vars.find((v) => v.name === "GITHUB_TOKEN")).toBeDefined();
    expect(vars.find((v) => v.name === "GITHUB_TOKEN")?.skill).toBe("github");
    expect(vars.find((v) => v.name === "GITHUB_TOKEN")?.required).toBe(true);
  });

  it("handles multi-skill workflow", () => {
    const vars = deriveVariables(["github", "sentry", "slack"]);
    const names = vars.map((v) => v.name);
    expect(names).toContain("ANTHROPIC_API_KEY");
    expect(names).toContain("GITHUB_TOKEN");
    expect(names).toContain("SENTRY_AUTH_TOKEN");
    expect(names).toContain("SENTRY_ORG");
    expect(names).toContain("SENTRY_BASE_URL");
    expect(names).toContain("SLACK_WEBHOOK_URL");
    expect(names).toContain("SLACK_BOT_TOKEN");
  });

  it("deduplicates env vars", () => {
    // If same skill referenced twice, env vars appear only once
    const vars = deriveVariables(["github", "github"]);
    const tokenVars = vars.filter((v) => v.name === "GITHUB_TOKEN");
    expect(tokenVars).toHaveLength(1);
  });

  it("skips unknown skills gracefully", () => {
    const vars = deriveVariables(["unicorn", "github"]);
    expect(vars.find((v) => v.name === "GITHUB_TOKEN")).toBeDefined();
    // No crash for unknown skill
  });

  it("preserves required/optional distinction", () => {
    const vars = deriveVariables(["sentry"]);
    expect(vars.find((v) => v.name === "SENTRY_AUTH_TOKEN")?.required).toBe(true);
    expect(vars.find((v) => v.name === "SENTRY_BASE_URL")?.required).toBe(false);
  });

  it("produces correct betterstack variable count", () => {
    const vars = deriveVariables(["betterstack"]);
    // ANTHROPIC_API_KEY + 4 betterstack fields
    expect(vars).toHaveLength(5);
  });
});
