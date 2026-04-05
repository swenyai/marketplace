"use client";

import { useState } from "react";
import type { MarketplaceWorkflow } from "@/lib/types";

interface UsageSnippetProps {
  workflow: MarketplaceWorkflow;
}

export function UsageSnippet({ workflow }: UsageSnippetProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `name: SWEny ${workflow.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sweny:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: swenyai/sweny@v4
        with:
          sweny-workflow: |
            ${workflow.id}
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Add this to <code className="text-gray-400">.github/workflows/sweny.yml</code>:
      </p>
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-gray-200 transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="bg-[#08080f] border border-[#1e1e2e] rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
