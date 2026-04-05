"use client";

import { useState } from "react";
import { forkRepo, submitWorkflow } from "@/lib/github";

interface SubmitFlowProps {
  workflowId: string;
  workflowYaml: string;
  workflowName: string;
  disabled?: boolean;
}

export function SubmitFlow({
  workflowId,
  workflowYaml,
  workflowName,
  disabled,
}: SubmitFlowProps) {
  const [status, setStatus] = useState<
    "idle" | "authenticating" | "submitting" | "done" | "error"
  >("idle");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus("authenticating");
    setError(null);

    const token = window.prompt(
      "Enter a GitHub Personal Access Token (with repo scope) to submit your workflow:"
    );
    if (!token) {
      setStatus("idle");
      return;
    }

    try {
      setStatus("submitting");
      const forkName = await forkRepo(token);

      // Wait for GitHub to process the fork
      await new Promise((r) => setTimeout(r, 2000));

      const url = await submitWorkflow(
        token,
        forkName,
        workflowId,
        workflowYaml,
        workflowName
      );
      setPrUrl(url);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStatus("error");
    }
  };

  if (status === "done" && prUrl) {
    return (
      <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-4 text-center">
        <p className="text-green-400 font-medium mb-2">PR created!</p>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          View on GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubmit}
        disabled={
          disabled || status === "submitting" || status === "authenticating"
        }
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
      >
        {status === "authenticating"
          ? "Authenticating..."
          : status === "submitting"
            ? "Creating PR..."
            : "Submit to Marketplace"}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
