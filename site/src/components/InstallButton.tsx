"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_VARIABLES } from "@/lib/types";
import type { MarketplaceWorkflow } from "@/lib/types";

interface InstallButtonProps {
  workflow: MarketplaceWorkflow;
}

export function InstallButton({ workflow }: InstallButtonProps) {
  const [open, setOpen] = useState(false);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const variables = workflow.variables?.length ? workflow.variables : DEFAULT_VARIABLES;

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

  const yamlContent = `name: SWEny ${workflow.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'

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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Reset opened state when repo changes
  useEffect(() => {
    setOpened(false);
  }, [repo, branch]);

  const valid = /^[^/]+\/[^/]+$/.test(repo.trim());
  const touched = repo.length > 0;

  const buildInstallUrl = useCallback(() => {
    const [owner, name] = repo.trim().split("/");
    const encoded = encodeURIComponent(yamlContent);
    return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/new/${encodeURIComponent(branch)}?filename=.github/workflows/sweny.yml&value=${encoded}`;
  }, [repo, branch, yamlContent]);

  function handleOpen() {
    if (!valid) return;
    setOpened(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && valid) {
      linkRef.current?.click();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition inline-flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Install to Repo
      </button>
    );
  }

  return (
    <div className="flex-1 bg-[#111] border border-[#2a2a3a] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-200">Install to GitHub</p>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-600 hover:text-gray-400 text-xs"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Repository</label>
        <input
          ref={inputRef}
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="owner/repo"
          className={`w-full bg-[#08080f] border rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition ${
            touched && !valid
              ? "border-red-800/50 focus:border-red-600"
              : "border-[#2a2a3a] focus:border-blue-600"
          }`}
        />
        {touched && !valid && (
          <p className="text-[11px] text-red-400/70 mt-1">Enter as owner/repo, e.g. acme/api</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Branch <span className="text-gray-700">— target for the workflow file</span></label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-[#08080f] border border-[#2a2a3a] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition"
        />
      </div>

      {/* Variable toggles */}
      {variables.some((v) => v.alternatives?.length) && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Auth token:</p>
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
                    onClick={() => setSelections((s) => ({ ...s, [v.name]: option.idx }))}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition ${
                      (selections[v.name] ?? -1) === option.idx
                        ? "bg-blue-950/50 border-blue-700 text-blue-300"
                        : "bg-[#08080f] border-[#2a2a3a] text-gray-500 hover:text-gray-300"
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

      <div className="flex items-center gap-2 pt-1">
        {opened ? (
          <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-900/30 border border-green-800/40 text-green-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Opened in GitHub
          </div>
        ) : (
          <a
            ref={linkRef}
            href={valid ? buildInstallUrl() : "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!valid) { e.preventDefault(); return; }
              handleOpen();
            }}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              valid
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Open in GitHub
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-[11px] text-gray-600 leading-relaxed">
        Opens GitHub&apos;s file editor with the workflow pre-filled. You review and commit — SWEny never writes to your repo.
        After committing, add your API key to{" "}
        <a
          href={valid ? `https://github.com/${repo.trim()}/settings/secrets/actions` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400"
        >
          repo secrets
        </a>
        . Track runs at{" "}
        <a href="https://cloud.sweny.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">
          cloud.sweny.ai
        </a>
      </p>
    </div>
  );
}
