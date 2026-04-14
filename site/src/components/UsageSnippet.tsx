"use client";

import { useState } from "react";
import type { MarketplaceWorkflow } from "@/lib/types";

interface UsageSnippetProps {
  workflow: MarketplaceWorkflow;
}

export function UsageSnippet({ workflow }: UsageSnippetProps) {
  const [copied, setCopied] = useState(false);

  const variables = workflow.derivedVariables;

  const requiredVars = variables.filter((v) => v.required);
  const optionalVars = variables.filter((v) => !v.required);

  const envBlock = variables
    .map((v) => `          ${v.name}: \${{ secrets.${v.name} }}`)
    .join("\n");

  const snippet = `name: SWEny ${workflow.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  sweny:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: swenyai/sweny@v5
        with:
          sweny-workflow: |
            ${workflow.id}
        env:
${envBlock}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Required variables */}
      {requiredVars.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-muted">Required secrets:</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredVars.map((v) => (
              <span
                key={v.name}
                className="text-[11px] px-2 py-0.5 rounded bg-accent-bg border border-accent-border text-accent"
                title={`${v.description} (${v.skill})`}
              >
                {v.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optional variables */}
      {optionalVars.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-dim">Optional:</p>
          <div className="flex flex-wrap gap-1.5">
            {optionalVars.map((v) => (
              <span
                key={v.name}
                className="text-[11px] px-2 py-0.5 rounded bg-surface border border-border text-text-dim"
                title={`${v.description} (${v.skill})`}
              >
                {v.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-text-dim">
        Add this to <code className="text-text-muted">.github/workflows/sweny.yml</code>:
      </p>
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 text-xs px-3 py-1.5 rounded bg-gray-800/90 backdrop-blur-sm text-text-muted hover:text-text transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="bg-surface border border-border rounded-lg p-3 md:p-4 pr-16 overflow-x-auto text-[10px] md:text-xs text-text-muted font-mono leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
