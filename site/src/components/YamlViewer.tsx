"use client";

import { useState } from "react";

interface YamlViewerProps {
  yaml: string;
}

export function YamlViewer({ yaml }: YamlViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 text-xs px-3 py-1.5 rounded bg-gray-800/90 backdrop-blur-sm text-text-muted hover:text-text transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-surface border border-border rounded-lg p-3 md:p-4 pr-16 overflow-x-auto text-[10px] md:text-xs text-text-muted font-mono leading-relaxed">
        {yaml}
      </pre>
    </div>
  );
}
