"use client";

import { useState } from "react";
import type { DerivedVariable } from "@/lib/types";

interface EnvVarListProps {
  variables: DerivedVariable[];
}

export function EnvVarList({ variables }: EnvVarListProps) {
  const [showOptional, setShowOptional] = useState(false);
  const required = variables.filter((v) => v.required);
  const optional = variables.filter((v) => !v.required);

  const renderVar = (v: DerivedVariable) => (
    <div
      key={v.name}
      className="bg-surface border border-border rounded-md p-3"
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <code className="font-mono text-[12px] text-text font-medium">{v.name}</code>
        {v.required ? (
          <span className="text-[10px] text-accent bg-accent-bg px-1.5 py-0.5 rounded font-medium tracking-wide">
            required
          </span>
        ) : (
          <span className="text-[10px] text-text-dim bg-surface-2 border border-border px-1.5 py-0.5 rounded font-medium tracking-wide">
            optional
          </span>
        )}
        <span className="text-[10px] text-text-dim font-mono ml-auto">{v.skill}</span>
      </div>
      <p className="text-[12px] text-text-muted leading-relaxed">{v.description}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {required.map(renderVar)}
      {showOptional && optional.map(renderVar)}
      {optional.length > 0 && !showOptional && (
        <button
          onClick={() => setShowOptional(true)}
          className="w-full text-left text-[12px] text-text-muted hover:text-text transition py-2 px-3 border border-dashed border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show optional ({optional.length}) ⌄
        </button>
      )}
    </div>
  );
}
