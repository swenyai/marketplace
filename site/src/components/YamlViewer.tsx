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
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-gray-200 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-[#08080f] border border-[#1e1e2e] rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
        {yaml}
      </pre>
    </div>
  );
}
