"use client";

import { useState } from "react";

interface SubmitFlowProps {
  workflowId: string;
  workflowYaml: string;
  workflowName: string;
  disabled?: boolean;
}

// Marketplace repo coordinates.
const REPO_OWNER = "swenyai";
const REPO_NAME = "marketplace";
const DEFAULT_BRANCH = "main";
const WORKFLOW_DIR = "workflows/community";

// GitHub's URL-based new-file editor silently truncates or rejects
// URLs above ~8KB. We keep a conservative ceiling so the full link
// (including encoded value param) fits comfortably.
const MAX_GITHUB_URL_LENGTH = 8000;

/**
 * Build a GitHub "create new file" URL that pre-populates the editor
 * with the given YAML. Returns null if the resulting URL would exceed
 * GitHub's practical length limit.
 */
export function buildSubmitUrl(
  workflowId: string,
  workflowYaml: string
): string | null {
  const filename = `${workflowId}.yml`;
  const url = `https://github.com/${REPO_OWNER}/${REPO_NAME}/new/${DEFAULT_BRANCH}/${WORKFLOW_DIR}?filename=${encodeURIComponent(
    filename
  )}&value=${encodeURIComponent(workflowYaml)}`;
  if (url.length > MAX_GITHUB_URL_LENGTH) return null;
  return url;
}

/** URL to open the GitHub new-file editor without a pre-filled value. */
export function buildFallbackUrl(workflowId: string): string {
  const filename = `${workflowId}.yml`;
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/new/${DEFAULT_BRANCH}/${WORKFLOW_DIR}?filename=${encodeURIComponent(
    filename
  )}`;
}

export function SubmitFlow({
  workflowId,
  workflowYaml,
  workflowName,
  disabled,
}: SubmitFlowProps) {
  const [copied, setCopied] = useState(false);
  const url = buildSubmitUrl(workflowId, workflowYaml);
  const fallbackUrl = buildFallbackUrl(workflowId);
  const tooLarge = url === null;

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(workflowYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can copy from the YAML viewer above
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
    }
  };

  if (tooLarge) {
    return (
      <div className="space-y-3 bg-[#0c0c14] border border-[#1e1e2e] rounded-xl p-4">
        <div className="text-xs text-gray-400 leading-relaxed">
          <span className="text-gray-200 font-medium">Submit in two steps.</span>{" "}
          This workflow is larger than GitHub&rsquo;s URL limit, so copy
          the YAML first, then paste it into the editor that opens.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyYaml}
            disabled={disabled}
            className="bg-[#111] hover:bg-[#1a1a2e] disabled:opacity-50 text-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium transition border border-[#2a2a3a] flex items-center justify-center gap-2"
          >
            <span className="text-gray-500 text-xs">1.</span>
            <span>{copied ? "Copied" : "Copy YAML"}</span>
          </button>
          <a
            href={fallbackUrl}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={disabled}
            className={`block text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              disabled ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <span className="text-white/60 text-xs">2.</span>
            <span>Open editor</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      className={`block w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      Submit &ldquo;{workflowName}&rdquo; to Marketplace
    </a>
  );
}
