"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { parse } from "yaml";
import { YamlViewer } from "./YamlViewer";
import { SubmitFlow } from "./SubmitFlow";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] text-gray-600 text-sm">
      Loading DAG...
    </div>
  ),
});

const BACKENDS = [
  { id: "supabase", label: "Supabase", hint: "Auth Admin API + PostgREST" },
  { id: "firebase", label: "Firebase", hint: "Admin SDK or REST API" },
  { id: "postgres", label: "Postgres / REST API", hint: "Direct SQL or custom API" },
  { id: "none", label: "No backend access", hint: "Test unauthenticated flows only" },
];

const FLOWS = [
  { id: "auth", label: "Sign up / Sign in / Sign out" },
  { id: "onboarding", label: "Onboarding / Setup wizard" },
  { id: "purchase", label: "Checkout / Payment / Subscription" },
  { id: "crud", label: "Create, edit, delete content" },
  { id: "navigation", label: "Navigation / Routing" },
  { id: "search", label: "Search / Filtering" },
  { id: "settings", label: "Settings / Profile" },
  { id: "invite", label: "Invite / Team management" },
];

type Step = "backend" | "flows" | "details" | "review";

export function E2eWizard() {
  const [step, setStep] = useState<Step>("backend");
  const [backend, setBackend] = useState("");
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
  const [appUrl, setAppUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [yaml, setYaml] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const toggleFlow = (id: string) => {
    setSelectedFlows((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const workflow = useMemo(() => {
    if (!yaml) return null;
    try {
      const parsed = parse(yaml);
      if (parsed?.id && parsed?.nodes && parsed?.edges && parsed?.entry) {
        return {
          id: parsed.id,
          name: parsed.name ?? parsed.id,
          description: parsed.description ?? "",
          entry: parsed.entry,
          nodes: parsed.nodes,
          edges: parsed.edges,
        };
      }
    } catch {}
    return null;
  }, [yaml]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setValid(null);
    setErrors([]);
    setYaml("");

    const flowLabels = selectedFlows
      .map((id) => FLOWS.find((f) => f.id === id)?.label)
      .filter(Boolean);

    const backendLabel = BACKENDS.find((b) => b.id === backend)?.label ?? backend;

    const prompt = [
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
      backend === "supabase"
        ? "- Use Supabase Auth Admin API for users, PostgREST for table data. Env vars: $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY"
        : backend === "firebase"
          ? "- Use Firebase Admin REST API. Env vars: $FIREBASE_PROJECT_ID, $FIREBASE_API_KEY"
          : backend === "postgres"
            ? "- Use custom REST API or direct database calls. Env vars: $API_URL, $API_KEY"
            : "- No backend provisioning needed, skip to test nodes",
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
      `Set the workflow id to 'e2e-${(appName || "my-app").toLowerCase().replace(/[^a-z0-9]/g, "-")}'.`,
      "Set author to 'community', category to 'testing'.",
      "Set all skills to empty arrays: skills: []",
      "",
      "IMPORTANT: Do NOT use Playwright, Cypress, or any test framework. Do NOT generate test code.",
      "The agent executes natural language instructions against agent-browser. That's the whole point.",
    ].join("\n");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrors([err.error ?? "Generation failed"]);
        setGenerating(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "token") {
              setYaml((prev) => prev + event.content);
            } else if (event.type === "complete") {
              setValid(event.valid);
              setErrors(event.errors ?? []);
            } else if (event.type === "error") {
              setErrors([event.message]);
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setErrors([err.message]);
      }
    } finally {
      setGenerating(false);
    }
  }, [backend, selectedFlows, appUrl, appName]);

  const steps: Step[] = ["backend", "flows", "details", "review"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="space-y-6">
      {/* CLI callout */}
      <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg px-4 py-3 text-sm">
        <p className="text-blue-300 font-medium mb-1">
          Best results? Use the CLI.
        </p>
        <p className="text-blue-400/70 text-xs leading-relaxed">
          Run{" "}
          <code className="bg-blue-950/50 px-1.5 py-0.5 rounded text-blue-300">
            sweny e2e init
          </code>{" "}
          in your project directory. It analyzes your actual codebase — routes,
          auth patterns, API endpoints — and generates a workflow that fits your
          app perfectly. This wizard gives you a solid starting point, but the
          CLI can inspect your code and make proper inferences.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#111] border border-[#1e1e2e] rounded-lg px-4 py-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-gray-300 font-medium">How it works:</span>{" "}
          An AI agent drives a real browser via{" "}
          <code className="text-gray-300">agent-browser</code> — no
          Playwright, no Cypress, no selectors. The agent reads the accessibility
          tree, clicks buttons by their labels, fills forms by their placeholders,
          and adapts when your UI changes. Each test is natural language, not
          code. ~$0.10/run.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i <= stepIndex && setStep(s)}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition ${
                i <= stepIndex
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a2e] text-gray-600"
              }`}
            >
              {i + 1}
            </button>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  i < stepIndex ? "bg-blue-600" : "bg-[#1a1a2e]"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-gray-600 ml-2">
          {step === "backend"
            ? "Backend"
            : step === "flows"
              ? "User Flows"
              : step === "details"
                ? "App Details"
                : "Generate"}
        </span>
      </div>

      {/* Step 1: Backend */}
      {step === "backend" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            What backend does your app use?
          </h3>
          <p className="text-xs text-gray-600">
            This determines how test data is provisioned and cleaned up.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BACKENDS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBackend(b.id);
                  setStep("flows");
                }}
                className={`text-left px-4 py-3 rounded-lg border transition ${
                  backend === b.id
                    ? "bg-blue-950/50 border-blue-700 text-blue-300"
                    : "bg-[#111] border-[#2a2a3a] text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                <div className="text-sm">{b.label}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{b.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Flows */}
      {step === "flows" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            Which user flows should be tested?
          </h3>
          <p className="text-xs text-gray-600">
            Each flow becomes a test node — natural language, not code.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FLOWS.map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFlow(f.id)}
                className={`text-xs px-3 py-2.5 rounded-lg border transition text-left ${
                  selectedFlows.includes(f.id)
                    ? "bg-blue-950/50 border-blue-700 text-blue-300"
                    : "bg-[#111] border-[#2a2a3a] text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("details")}
            disabled={selectedFlows.length === 0}
            className="w-full bg-[#1a1a2e] hover:bg-[#222244] disabled:opacity-50 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition mt-2 border border-[#2a2a3a]"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 3: App details */}
      {step === "details" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            Tell us about your app
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">App name</label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. MyApp, Acme Dashboard"
                className="w-full bg-[#111] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Base URL</label>
              <input
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="e.g. https://myapp.com"
                className="w-full bg-[#111] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <button
            onClick={() => setStep("review")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition mt-2"
          >
            Generate Workflow
          </button>
        </div>
      )}

      {/* Step 4: Review + Generate */}
      {step === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#111] border border-[#1e1e2e] rounded-lg p-3 space-y-1.5">
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">App:</span>{" "}
                {appName || "My App"} ({appUrl || "https://myapp.com"})
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Backend:</span>{" "}
                {BACKENDS.find((b) => b.id === backend)?.label}
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Flows:</span>{" "}
                {selectedFlows
                  .map((id) => FLOWS.find((f) => f.id === id)?.label)
                  .join(", ")}
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Pattern:</span>{" "}
                setup → provision → {selectedFlows.length} test(s) → cleanup → report
              </div>
            </div>

            {!yaml && !generating && (
              <button
                onClick={generate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Generate E2E Workflow
              </button>
            )}

            {generating && (
              <div className="text-xs text-gray-500 animate-pulse">
                Generating your workflow...
              </div>
            )}

            {valid !== null && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${
                  valid
                    ? "bg-green-950/30 text-green-400 border border-green-900/50"
                    : "bg-red-950/30 text-red-400 border border-red-900/50"
                }`}
              >
                {valid
                  ? "Workflow is valid"
                  : `Validation errors: ${errors.join(", ")}`}
              </div>
            )}

            {yaml && <YamlViewer yaml={yaml} />}

            {valid && yaml && (
              <SubmitFlow
                workflowId={
                  workflow?.id ??
                  `e2e-${(appName || "my-app").toLowerCase().replace(/[^a-z0-9]/g, "-")}`
                }
                workflowYaml={yaml}
                workflowName={workflow?.name ?? "E2E Test Workflow"}
              />
            )}
          </div>

          {/* Live DAG */}
          <div className="bg-[#08080f] border border-[#1e1e2e] rounded-xl overflow-hidden">
            {workflow ? (
              <DagViewer workflow={workflow} height="100%" />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] text-gray-600 text-sm">
                {generating
                  ? "Building DAG..."
                  : "DAG preview will appear here"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
