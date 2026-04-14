"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

  const variables = workflow.derivedVariables;

  const envBlock = variables
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
        className="flex-1 bg-accent hover:bg-accent-hover text-white px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition inline-flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Install to Repo
      </button>
    );
  }

  return (
    <div className="flex-1 bg-surface border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">Install to GitHub</p>
        <button
          onClick={() => setOpen(false)}
          className="text-text-dim hover:text-text-muted text-xs"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs text-text-dim block mb-1">Repository</label>
        <input
          ref={inputRef}
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="owner/repo"
          className={`w-full bg-surface border rounded px-3 py-2 text-sm text-text placeholder-gray-700 focus:outline-none transition ${
            touched && !valid
              ? "border-red-800/50 focus:border-red-600"
              : "border-border focus:border-accent"
          }`}
        />
        {touched && !valid && (
          <p className="text-[11px] text-red-400/70 mt-1">Enter as owner/repo, e.g. acme/api</p>
        )}
      </div>

      <div>
        <label className="text-xs text-text-dim block mb-1">Branch <span className="text-border">— target for the workflow file</span></label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition"
        />
      </div>

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
                ? "bg-accent hover:bg-accent-hover text-white"
                : "bg-gray-800 text-text-dim cursor-not-allowed"
            }`}
          >
            Open in GitHub
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-[11px] text-text-dim leading-relaxed">
        Opens GitHub&apos;s file editor with the workflow pre-filled. You review and commit — SWEny never writes to your repo.
        After committing, add your API key to{" "}
        <a
          href={valid ? `https://github.com/${repo.trim()}/settings/secrets/actions` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover"
        >
          repo secrets
        </a>
        . Track runs at{" "}
        <a href="https://cloud.sweny.ai" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
          cloud.sweny.ai
        </a>
      </p>
    </div>
  );
}
