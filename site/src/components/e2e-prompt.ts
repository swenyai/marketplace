/**
 * Pure prompt builder for the E2E Test Wizard. Extracted from E2eWizard.tsx
 * so it can be unit-tested without mounting React.
 */

export interface E2ePromptInput {
  appName: string;
  appUrl: string;
  backend: string;
  backendLabel: string;
  flowLabels: string[];
}

/** Slug a human-readable app name into a workflow id suffix. */
export function slugify(name: string): string {
  return (name || "my-app").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function backendProvisionLine(backend: string): string {
  switch (backend) {
    case "supabase":
      return "- Use Supabase Auth Admin API for users, PostgREST for table data. Env vars: $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY";
    case "firebase":
      return "- Use Firebase Admin REST API. Env vars: $FIREBASE_PROJECT_ID, $FIREBASE_API_KEY";
    case "postgres":
      return "- Use custom REST API or direct database calls. Env vars: $API_URL, $API_KEY";
    default:
      return "- No backend provisioning needed, skip to test nodes";
  }
}

export function buildE2ePrompt(input: E2ePromptInput): string {
  const { appName, appUrl, backend, backendLabel, flowLabels } = input;

  return [
    `Create an E2E UAT workflow for "${appName || "my app"}" at ${appUrl || "https://myapp.com"} using the agent-browser pattern.`,
    "",
    "CRITICAL: This uses the agent-browser CLI for browser automation — NOT Playwright, NOT Cypress, NO test framework code.",
    "The agent drives a real browser via accessibility tree (@ref element IDs), not CSS selectors.",
    "",
    "## Required node structure",
    "",
    "Every workflow MUST have exactly these node types:",
    "",
    "### setup node (copy verbatim)",
    "- Start agent-browser daemon in background",
    "- Poll for readiness with `agent-browser get url` (30s timeout)",
    "- Close stale sessions: `agent-browser close --all`",
    "- List all available commands: open, snapshot, click, fill, press, get url, screenshot, scroll, scrollintoview, select, keyboard type",
    "- skills: [] (no skills — agent uses shell commands)",
    "- Output: status (ready|fail)",
    "",
    `### provision node (${backendLabel} backend)`,
    "- Read env vars ($E2E_BASE_URL, backend credentials)",
    "- Generate unique test credentials: e2e-{timestamp}@yourapp.test",
    "- Clean up stale test data from prior crashed runs",
    "- Create fresh test data via backend admin API",
    backendProvisionLine(backend),
    "- Output: status, base_url, run_id, test_email, test_password, user_id",
    "- skills: []",
    "",
    "### test nodes — one per user flow, natural language instructions",
    "Each test node MUST:",
    "- Reference values from provision output ('Use the test_email from the provision step')",
    "- Use numbered steps with specific agent-browser commands",
    "- Navigate with: agent-browser open <URL>",
    "- Read the page with: agent-browser snapshot (returns @ref IDs)",
    "- Interact with: agent-browser click @ref, agent-browser fill @ref 'text'",
    "- Define success/failure: check URL or snapshot content",
    "- Take screenshot: agent-browser screenshot results/<name>.png",
    "- Output: status (pass|fail), error",
    "- skills: [] (NO skills — the agent uses shell commands)",
    "",
    "User flows to test:",
    ...flowLabels.map((f) => `- ${f}`),
    "",
    "### cleanup node",
    "- Delete all test data matching e2e-* convention",
    "- Must run on BOTH success AND failure paths",
    "- Skip gracefully if credentials missing",
    "- skills: []",
    "",
    "### report node",
    "- Compile pass/fail from all test nodes",
    "- One-sentence summary",
    "- Output: total, passed, failed, summary",
    "- skills: []",
    "",
    "## Edge routing (CRITICAL)",
    "Happy path: setup → provision → test_a → test_b → ... → cleanup → report",
    "Each node's failure edge goes to cleanup (never skip cleanup):",
    "- setup fail → report (nothing to clean up)",
    "- provision fail → cleanup",
    "- any test fail → cleanup",
    "",
    `Set the workflow id to 'e2e-${slugify(appName)}'.`,
    "Set author to 'community', category to 'testing'.",
    "Set all skills to empty arrays: skills: []",
    "",
    "IMPORTANT: Do NOT use Playwright, Cypress, or any test framework. Do NOT generate test code.",
    "The agent executes natural language instructions against agent-browser. That's the whole point.",
  ].join("\n");
}
