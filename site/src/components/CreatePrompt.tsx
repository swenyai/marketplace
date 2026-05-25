"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { parse } from "yaml";
import { YamlViewer } from "./YamlViewer";
import { SubmitFlow } from "./SubmitFlow";
import { DagBoundary } from "./DagBoundary";
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

const EXAMPLE_PROMPTS = [
  "Scan dependencies for security vulnerabilities and create issues for critical CVEs",
  "Auto-review pull requests for code style, test coverage, and breaking changes",
  "Monitor Sentry for new errors, investigate root cause, and create Linear issues",
  "Generate API documentation from code comments and push to the docs site",
  "Run pre-deploy checks: migration safety, env drift, rollback readiness",
];

export function CreatePrompt() {
  const [prompt, setPrompt] = useState("");
  const [yaml, setYaml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const workflow = useMemo(() => {
    if (!yaml) return null;
    try {
      return normalizeWorkflow(parse(yaml));
    } catch {
      // YAML not yet parseable — viewer stays in its empty state
      return null;
    }
  }, [yaml]);

  const generate = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setGenerating(true);
      setValid(null);
      setErrors([]);
      setErrorCode(null);
      setLastPrompt(text);
      setYaml("");

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            existingWorkflow: yaml || null,
          }),
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
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setErrors([err.message]);
        }
      } finally {
        setGenerating(false);
      }
    },
    [yaml]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:min-h-[calc(100vh-120px)]">
      {/* Left: Prompt + YAML output */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what your workflow should do..."
              rows={3}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent resize-none"
            />
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="absolute bottom-3 right-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>

        {/* Example prompts */}
        {!yaml && !generating && (
          <div className="space-y-2">
            <p className="text-xs text-text-dim">Try an example:</p>
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setPrompt(ex);
                  generate(ex);
                }}
                className="block w-full text-left text-xs text-text-dim hover:text-accent bg-surface border border-border rounded-lg px-3 py-2 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Out-of-credits fallback to local CLI */}
        {errorCode === "insufficient_credits" && (
          <CreditsExhaustedNotice
            command="npx sweny new"
            onRetry={() => generate(lastPrompt)}
            retrying={generating}
          />
        )}

        {/* Generic generation error (non-credits) */}
        {errorCode !== "insufficient_credits" && errors.length > 0 && valid === null && (
          <div className="text-xs px-3 py-2 rounded-lg bg-red-950/30 text-red-400 border border-red-900/50">
            {errors.join(", ")}
          </div>
        )}

        {/* Validation status */}
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

        {/* YAML output */}
        {yaml && <YamlViewer yaml={yaml} />}

        {/* Submit to marketplace */}
        {valid && yaml && (
          <SubmitFlow
            workflowId={workflow?.id ?? "new-workflow"}
            workflowYaml={yaml}
            workflowName={workflow?.name ?? "New Workflow"}
          />
        )}
      </div>

      {/* Right: Live DAG preview */}
      <div className="dag-host bg-surface border border-border rounded-xl overflow-hidden">
        {workflow ? (
          <DagBoundary>
            <DagViewer workflow={workflow} height="100%" />
          </DagBoundary>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-text-dim text-sm">
            {generating ? "Building DAG..." : "DAG preview will appear here"}
          </div>
        )}
      </div>
    </div>
  );
}
