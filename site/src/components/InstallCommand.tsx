"use client";

import { useState } from "react";

interface InstallCommandProps {
  workflowId: string;
}

export function InstallCommand({ workflowId }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const command = `npx sweny new ${workflowId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silent fallback
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-md p-3 flex items-center justify-between gap-3 font-mono text-[13px]">
      <code className="text-text overflow-x-auto whitespace-nowrap flex-1">
        <span className="text-accent">$ </span>
        {command}
      </code>
      <button
        onClick={handleCopy}
        aria-label="Copy install command"
        className="flex-shrink-0 text-[10px] text-text-dim hover:text-text uppercase tracking-wider font-sans font-medium transition min-h-[32px] px-2 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {copied ? (
          <span className="text-accent">copied ✓</span>
        ) : (
          <span>copy</span>
        )}
      </button>
    </div>
  );
}
