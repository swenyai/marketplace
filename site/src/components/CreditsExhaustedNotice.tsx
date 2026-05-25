"use client";

import { useState } from "react";

interface CreditsExhaustedNoticeProps {
  /** Local CLI command that does the same thing this generator would have. */
  command: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function CreditsExhaustedNotice({
  command,
  message,
  onRetry,
  retrying,
}: CreditsExhaustedNoticeProps) {
  const [copied, setCopied] = useState(false);

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
    <div className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
      <p className="text-sm text-text font-medium">Free tier is out of credits</p>
      <p className="text-xs text-text-dim leading-relaxed">
        {message ??
          "Our hosted free tier ran out of credits. No need to wait — build this workflow locally with the SWEny CLI, no account required."}
      </p>

      <div className="bg-surface border border-border rounded-md p-3 flex items-center justify-between gap-3 font-mono text-[13px]">
        <code className="text-text overflow-x-auto whitespace-nowrap flex-1">
          <span className="text-accent">$ </span>
          {command}
        </code>
        <button
          onClick={handleCopy}
          aria-label="Copy CLI command"
          className="flex-shrink-0 text-[10px] text-text-dim hover:text-text uppercase tracking-wider font-medium transition min-h-[44px] md:min-h-[32px] min-w-[44px] md:min-w-0 px-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {copied ? <span className="text-accent">copied ✓</span> : <span>copy</span>}
        </button>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="text-xs text-text-dim hover:text-text underline underline-offset-2 disabled:opacity-50 transition"
        >
          Try the hosted generator again
        </button>
      )}
    </div>
  );
}
