import { describe, it, expect } from "vitest";
import { buildE2ePrompt, slugify } from "./e2e-prompt";
import { MAX_PROMPT_LENGTH } from "@/app/api/generate/validation";

describe("slugify", () => {
  it("lowercases and dasherizes", () => {
    expect(slugify("Acme Dashboard")).toBe("acme-dashboard");
  });

  it("strips special characters", () => {
    expect(slugify("My App! (v2)")).toBe("my-app---v2-");
  });

  it("falls back to 'my-app' for empty input", () => {
    expect(slugify("")).toBe("my-app");
  });
});

describe("buildE2ePrompt", () => {
  const base = {
    appName: "Acme",
    appUrl: "https://acme.test",
    backend: "supabase",
    backendLabel: "Supabase",
    flowLabels: ["Sign up / Sign in / Sign out"],
  };

  it("includes the app name and URL", () => {
    const prompt = buildE2ePrompt(base);
    expect(prompt).toContain('"Acme"');
    expect(prompt).toContain("https://acme.test");
  });

  it("names the backend in the provision section", () => {
    const prompt = buildE2ePrompt(base);
    expect(prompt).toContain("### provision node (Supabase backend)");
  });

  it("emits Supabase-specific env vars when backend is supabase", () => {
    const prompt = buildE2ePrompt(base);
    expect(prompt).toContain("$SUPABASE_SERVICE_ROLE_KEY");
    expect(prompt).not.toContain("$FIREBASE_PROJECT_ID");
  });

  it("emits Firebase-specific env vars when backend is firebase", () => {
    const prompt = buildE2ePrompt({
      ...base,
      backend: "firebase",
      backendLabel: "Firebase",
    });
    expect(prompt).toContain("$FIREBASE_PROJECT_ID");
    expect(prompt).not.toContain("$SUPABASE_SERVICE_ROLE_KEY");
  });

  it("emits Postgres env vars when backend is postgres", () => {
    const prompt = buildE2ePrompt({
      ...base,
      backend: "postgres",
      backendLabel: "Postgres / REST API",
    });
    expect(prompt).toContain("$API_URL");
  });

  it("skips provisioning when backend is 'none'", () => {
    const prompt = buildE2ePrompt({
      ...base,
      backend: "none",
      backendLabel: "No backend access",
    });
    expect(prompt).toContain("No backend provisioning needed");
  });

  it("lists each flow label as a bullet under 'User flows to test'", () => {
    const prompt = buildE2ePrompt({
      ...base,
      flowLabels: ["Sign up / Sign in / Sign out", "Checkout / Payment"],
    });
    expect(prompt).toContain("User flows to test:\n- Sign up / Sign in / Sign out\n- Checkout / Payment");
  });

  it("bans Playwright and Cypress explicitly", () => {
    const prompt = buildE2ePrompt(base);
    expect(prompt).toMatch(/Do NOT use Playwright, Cypress/);
  });

  it("sets the workflow id to a slugified app name", () => {
    const prompt = buildE2ePrompt({ ...base, appName: "Acme Dashboard" });
    expect(prompt).toContain("'e2e-acme-dashboard'");
  });

  it("uses placeholder id when app name is empty", () => {
    const prompt = buildE2ePrompt({ ...base, appName: "" });
    expect(prompt).toContain("'e2e-my-app'");
  });

  it("repeatedly emphasises skills: []", () => {
    const prompt = buildE2ePrompt(base);
    // Expect the directive to appear in several nodes.
    const occurrences = prompt.match(/skills: \[\]/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(5);
  });

  it("stays under the API's MAX_PROMPT_LENGTH for realistic inputs", () => {
    const prompt = buildE2ePrompt({
      appName: "A Really Really Really Long App Name With Many Words",
      appUrl: "https://longsubdomain.very-long-company-name.example.com",
      backend: "supabase",
      backendLabel: "Supabase",
      flowLabels: [
        "Sign up / Sign in / Sign out",
        "Onboarding / Setup wizard",
        "Checkout / Payment / Subscription",
        "Create, edit, delete content",
        "Navigation / Routing",
        "Search / Filtering",
        "Settings / Profile",
        "Invite / Team management",
      ],
    });
    expect(prompt.length).toBeLessThan(MAX_PROMPT_LENGTH);
  });
});
