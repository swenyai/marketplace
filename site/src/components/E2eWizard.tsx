"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { parse } from "yaml";
import { YamlViewer } from "./YamlViewer";
import { SubmitFlow } from "./SubmitFlow";
import { DagBoundary } from "./DagBoundary";
import { buildE2ePrompt, slugify } from "./e2e-prompt";
import { CreditsExhaustedNotice } from "./CreditsExhaustedNotice";
import { normalizeWorkflow } from "@/lib/normalize-workflow";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] text-text-dim text-sm">
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
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight generation on unmount so we don't setState
  // after the component is gone.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const toggleFlow = (id: string) => {
    setSelectedFlows((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const workflow = useMemo(() => {
    if (!yaml) return null;
    try {
      return normalizeWorkflow(parse(yaml));
    } catch {
      return null;
    }
  }, [yaml]);

  const generate = useCallback(async () => {
    // Cancel any in-flight request before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setGenerating(true);
    setValid(null);
    setErrors([]);
    setErrorCode(null);
    setYaml("");

    const flowLabels = selectedFlows
      .map((id) => FLOWS.find((f) => f.id === id)?.label)
      .filter((x): x is string => Boolean(x));

    const backendLabel = BACKENDS.find((b) => b.id === backend)?.label ?? backend;

    const prompt = buildE2ePrompt({
      appName,
      appUrl,
      backend,
      backendLabel,
      flowLabels,
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorCode(err.code ?? null);
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
      <div className="bg-accent-bg border border-accent-border rounded-lg px-4 py-3 text-sm">
        <p className="text-accent font-medium mb-1">
          Best results? Use the CLI.
        </p>
        <p className="text-accent/70 text-xs leading-relaxed">
          Run{" "}
          <code className="bg-accent-bg px-1.5 py-0.5 rounded text-accent">
            sweny new e2e
          </code>{" "}
          in your project directory. It analyzes your actual codebase — routes,
          auth patterns, API endpoints — and generates a workflow that fits your
          app perfectly. This wizard gives you a solid starting point, but the
          CLI can inspect your code and make proper inferences.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-surface border border-border rounded-lg px-4 py-3">
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="text-text font-medium">How it works:</span>{" "}
          An AI agent drives a real browser via{" "}
          <code className="text-text">agent-browser</code> — no
          Playwright, no Cypress, no selectors. The agent reads the accessibility
          tree, clicks buttons by their labels, fills forms by their placeholders,
          and adapts when your UI changes. Each test is natural language, not
          code. ~$0.10/run.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => i <= stepIndex && setStep(s)}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition ${
                i <= stepIndex
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-text-dim"
              }`}
            >
              {i + 1}
            </button>
            {i < steps.length - 1 && (
              <div
                className={`w-4 md:w-8 h-0.5 ${
                  i < stepIndex ? "bg-accent" : "bg-surface-2"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-text-dim ml-1 md:ml-2">
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
          <h3 className="text-sm font-medium text-text-muted">
            What backend does your app use?
          </h3>
          <p className="text-xs text-text-dim">
            This determines how test data is provisioned and cleaned up.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BACKENDS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBackend(b.id);
                  setStep("flows");
                }}
                className={`text-left px-4 py-3 rounded-lg border transition ${
                  backend === b.id
                    ? "bg-accent-bg border-accent-border text-accent"
                    : "bg-surface border-border text-text-muted hover:border-gray-600 hover:text-text"
                }`}
              >
                <div className="text-sm">{b.label}</div>
                <div className="text-[10px] text-text-dim mt-0.5">{b.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Flows */}
      {step === "flows" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-muted">
            Which user flows should be tested?
          </h3>
          <p className="text-xs text-text-dim">
            Each flow becomes a test node — natural language, not code.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FLOWS.map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFlow(f.id)}
                className={`text-xs px-3 py-2.5 rounded-lg border transition text-left ${
                  selectedFlows.includes(f.id)
                    ? "bg-accent-bg border-accent-border text-accent"
                    : "bg-surface border-border text-text-muted hover:border-gray-600 hover:text-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("details")}
            disabled={selectedFlows.length === 0}
            className="w-full bg-surface-2 hover:bg-surface-2/80 disabled:opacity-50 text-text-muted px-4 py-2.5 rounded-lg text-sm font-medium transition mt-2 border border-border"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 3: App details */}
      {step === "details" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-muted">
            Tell us about your app
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-dim mb-1 block">App name</label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. MyApp, Acme Dashboard"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-dim mb-1 block">Base URL</label>
              <input
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="e.g. https://myapp.com"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <button
            onClick={() => setStep("review")}
            className="w-full bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition mt-2"
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
            <div className="bg-surface border border-border rounded-lg p-3 space-y-1.5">
              <div className="text-xs text-text-dim">
                <span className="text-text-muted">App:</span>{" "}
                {appName || "My App"} ({appUrl || "https://myapp.com"})
              </div>
              <div className="text-xs text-text-dim">
                <span className="text-text-muted">Backend:</span>{" "}
                {BACKENDS.find((b) => b.id === backend)?.label}
              </div>
              <div className="text-xs text-text-dim">
                <span className="text-text-muted">Flows:</span>{" "}
                {selectedFlows
                  .map((id) => FLOWS.find((f) => f.id === id)?.label)
                  .join(", ")}
              </div>
              <div className="text-xs text-text-dim">
                <span className="text-text-muted">Pattern:</span>{" "}
                setup → provision → {selectedFlows.length} test(s) → cleanup → report
              </div>
            </div>

            {/* Generate button — always visible; disabled while generating */}
            {!yaml && (
              <button
                onClick={generate}
                disabled={generating}
                className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Generating workflow...</span>
                  </>
                ) : (
                  "Generate E2E Workflow"
                )}
              </button>
            )}

            {/* Out-of-credits fallback to local CLI */}
            {errorCode === "insufficient_credits" && (
              <CreditsExhaustedNotice
                command="npx sweny new e2e"
                message="Our hosted free tier ran out of credits. The CLI generates a sharper E2E workflow anyway — it inspects your actual codebase. No account required."
                onRetry={generate}
                retrying={generating}
              />
            )}

            {/* Error display — shows regardless of valid state */}
            {errorCode !== "insufficient_credits" && errors.length > 0 && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                  <span>Generation failed</span>
                </div>
                <ul className="text-xs text-red-300/80 space-y-0.5 list-disc list-inside">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="text-xs bg-red-950/50 hover:bg-red-900/50 border border-red-800 text-red-300 px-3 py-1.5 rounded transition mt-1"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Success banner when valid */}
            {valid === true && errors.length === 0 && (
              <div className="bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2 text-xs text-green-400">
                Workflow is valid
              </div>
            )}

            {/* Streaming status + regenerate button while yaml is present */}
            {yaml && (
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-text-dim flex items-center gap-2">
                  {generating ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                      <span>Streaming workflow...</span>
                    </>
                  ) : valid === true ? (
                    <span>Generation complete</span>
                  ) : valid === false ? (
                    <span className="text-red-400">Generation finished with errors</span>
                  ) : null}
                </div>
                {!generating && (
                  <button
                    onClick={generate}
                    className="text-xs text-text-dim hover:text-text-muted border border-border hover:border-gray-600 px-3 py-1.5 rounded transition"
                  >
                    Regenerate
                  </button>
                )}
              </div>
            )}

            {yaml && <YamlViewer yaml={yaml} />}

            {valid && yaml && (
              <SubmitFlow
                workflowId={workflow?.id ?? `e2e-${slugify(appName)}`}
                workflowYaml={yaml}
                workflowName={workflow?.name ?? "E2E Test Workflow"}
              />
            )}
          </div>

          {/* Live DAG */}
          <div className="dag-host bg-surface border border-border rounded-xl overflow-hidden min-h-[400px]">
            {workflow ? (
              <DagBoundary>
                <DagViewer workflow={workflow} height="100%" />
              </DagBoundary>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-text-dim text-sm gap-3 p-6 text-center">
                {generating ? (
                  <>
                    <span className="w-6 h-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    <span>Building DAG from streaming workflow...</span>
                  </>
                ) : (
                  <span>DAG preview will appear here</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
