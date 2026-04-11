"use client";

import { useState, useMemo } from "react";
import { DEFAULT_VARIABLES } from "@/lib/types";
import type { MarketplaceWorkflow } from "@/lib/types";

interface UsageSnippetProps {
  workflow: MarketplaceWorkflow;
}

export function UsageSnippet({ workflow }: UsageSnippetProps) {
  const [copied, setCopied] = useState(false);

  const variables = workflow.variables?.length ? workflow.variables : DEFAULT_VARIABLES;

  // Track which alternative is selected for each variable (by index)
  // -1 = use the primary, 0+ = use that alternative
  const [selections, setSelections] = useState<Record<string, number>>(
    () => Object.fromEntries(variables.map((v) => [v.name, -1]))
  );

  const resolvedVars = useMemo(() => {
    return variables.map((v) => {
      const sel = selections[v.name] ?? -1;
      if (sel === -1) return { name: v.name, description: v.description };
      const alt = v.alternatives?.[sel];
      return alt ? { name: alt.name, description: alt.description } : { name: v.name, description: v.description };
    });
  }, [variables, selections]);

  const envBlock = resolvedVars
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
      {/* Variable toggles */}
      {variables.some((v) => v.alternatives?.length) && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Configure environment variables:</p>
          {variables
            .filter((v) => v.alternatives?.length)
            .map((v) => (
              <div key={v.name} className="flex items-center gap-2 flex-wrap">
                {[
                  { name: v.name, description: v.description, idx: -1 },
                  ...(v.alternatives ?? []).map((a, i) => ({ ...a, idx: i })),
                ].map((option) => (
                  <button
                    key={option.name}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [v.name]: option.idx }))
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition ${
                      (selections[v.name] ?? -1) === option.idx
                        ? "bg-blue-950/50 border-blue-700 text-blue-300"
                        : "bg-[#111] border-[#2a2a3a] text-gray-500 hover:text-gray-300"
                    }`}
                    title={option.description}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Add this to <code className="text-gray-400">.github/workflows/sweny.yml</code>:
      </p>
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 text-xs px-3 py-1.5 rounded bg-gray-800/90 backdrop-blur-sm text-gray-400 hover:text-gray-200 transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="bg-[#08080f] border border-[#1e1e2e] rounded-lg p-3 md:p-4 pr-16 overflow-x-auto text-[10px] md:text-xs text-gray-300 font-mono leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
