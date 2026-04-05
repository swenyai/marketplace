"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { parse, stringify } from "yaml";
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

const FRAMEWORKS = [
  { id: "nextjs", label: "Next.js" },
  { id: "react", label: "React (CRA/Vite)" },
  { id: "vue", label: "Vue / Nuxt" },
  { id: "svelte", label: "SvelteKit" },
  { id: "express", label: "Express / Node API" },
  { id: "other", label: "Other" },
];

const TEST_RUNNERS = [
  { id: "playwright", label: "Playwright" },
  { id: "cypress", label: "Cypress" },
];

const FLOWS = [
  { id: "auth", label: "Authentication (login, signup, logout)" },
  { id: "crud", label: "CRUD operations (create, read, update, delete)" },
  { id: "navigation", label: "Navigation & routing" },
  { id: "forms", label: "Form validation & submission" },
  { id: "checkout", label: "Checkout / payments" },
  { id: "onboarding", label: "User onboarding" },
  { id: "search", label: "Search & filtering" },
  { id: "settings", label: "User settings / profile" },
  { id: "notifications", label: "Notifications & alerts" },
  { id: "api", label: "API integration / data loading" },
];

type Step = "framework" | "runner" | "flows" | "review";

export function E2eWizard() {
  const [step, setStep] = useState<Step>("framework");
  const [framework, setFramework] = useState<string>("");
  const [runner, setRunner] = useState<string>("playwright");
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
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

    const frameworkLabel =
      FRAMEWORKS.find((f) => f.id === framework)?.label ?? framework;

    const prompt = [
      `Create an e2e testing workflow for a ${frameworkLabel} application using ${runner}.`,
      "",
      "The workflow should cover these user flows:",
      ...flowLabels.map((f) => `- ${f}`),
      "",
      "Structure the workflow with these nodes:",
      "1. analyze — Read the codebase to understand routing, components, and existing tests",
      "2. One node per user flow group — generate tests for that specific flow",
      "3. run-tests — Execute all generated tests and collect results",
      "4. report — Create a PR with the test files and a summary of results",
      "",
      `Use ${runner} patterns and best practices. Generate real, runnable test code in the instructions.`,
      "Each test generation node should produce a complete test file.",
      `The workflow id should be 'e2e-${framework}'.`,
      "Set author to 'community', category to 'testing'.",
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
  }, [framework, runner, selectedFlows]);

  const steps: Step[] = ["framework", "runner", "flows", "review"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="space-y-6">
      {/* CLI callout */}
      <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg px-4 py-3 text-sm">
        <p className="text-blue-300 font-medium mb-1">Best results? Use the CLI.</p>
        <p className="text-blue-400/70 text-xs leading-relaxed">
          Run{" "}
          <code className="bg-blue-950/50 px-1.5 py-0.5 rounded text-blue-300">
            sweny e2e init
          </code>{" "}
          in your project directory. It analyzes your actual codebase — routes,
          components, auth patterns — and generates a workflow that fits your app
          perfectly. This wizard is a great starting point, but the CLI is where
          the magic happens.
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
          {step === "framework"
            ? "Tech Stack"
            : step === "runner"
              ? "Test Runner"
              : step === "flows"
                ? "User Flows"
                : "Generate"}
        </span>
      </div>

      {/* Step content */}
      {step === "framework" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            What framework does your app use?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FRAMEWORKS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFramework(f.id);
                  setStep("runner");
                }}
                className={`text-sm px-4 py-3 rounded-lg border transition text-left ${
                  framework === f.id
                    ? "bg-blue-950/50 border-blue-700 text-blue-300"
                    : "bg-[#111] border-[#2a2a3a] text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "runner" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            Which test runner?
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {TEST_RUNNERS.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRunner(r.id);
                  setStep("flows");
                }}
                className={`text-sm px-4 py-3 rounded-lg border transition text-left ${
                  runner === r.id
                    ? "bg-blue-950/50 border-blue-700 text-blue-300"
                    : "bg-[#111] border-[#2a2a3a] text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "flows" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            Which user flows should be tested?
          </h3>
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
            onClick={() => setStep("review")}
            disabled={selectedFlows.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition mt-2"
          >
            Generate Workflow
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#111] border border-[#1e1e2e] rounded-lg p-3 space-y-1.5">
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Stack:</span>{" "}
                {FRAMEWORKS.find((f) => f.id === framework)?.label}
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Runner:</span>{" "}
                {TEST_RUNNERS.find((r) => r.id === runner)?.label}
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-300">Flows:</span>{" "}
                {selectedFlows
                  .map((id) => FLOWS.find((f) => f.id === id)?.label)
                  .join(", ")}
              </div>
            </div>

            {!yaml && !generating && (
              <button
                onClick={generate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Generate Custom E2E Workflow
              </button>
            )}

            {generating && (
              <div className="text-xs text-gray-500 animate-pulse">
                Generating your custom workflow...
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
                workflowId={workflow?.id ?? `e2e-${framework}`}
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
