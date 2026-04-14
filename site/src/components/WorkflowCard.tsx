"use client";

import Link from "next/link";
import type { MarketplaceWorkflow } from "@/lib/types";

interface WorkflowCardProps {
  workflow: MarketplaceWorkflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Link
      href={`/workflows/${workflow.id}`}
      className="group card-atmosphere rounded-lg p-4 transition hover:border-accent-border block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="font-mono text-[10px] text-accent mb-2 tracking-wide">
        // {workflow.source} · {workflow.category}
      </div>
      <h3 className="text-base font-semibold text-text mb-1 tracking-tight leading-tight">
        {workflow.name}
      </h3>
      <p className="text-[13px] text-text-muted leading-[1.5] mb-3 line-clamp-2">
        {workflow.description}
      </p>
      <div className="flex gap-1 flex-wrap mb-3 min-h-[18px]">
        {workflow.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="bg-surface-2 border border-border text-text-muted px-1.5 py-0.5 rounded text-[10px] font-medium"
          >
            {skill}
          </span>
        ))}
        {workflow.skills.length > 3 && (
          <span className="text-[10px] text-text-dim self-center">
            +{workflow.skills.length - 3}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-border text-[11px] text-text-dim">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-[5px] h-[5px] rounded-full ${
              workflow.source === "official" ? "bg-accent" : "bg-text-dim"
            }`}
          />
          <span className="text-text-muted font-medium">{workflow.author}</span>
        </span>
        <span className="font-mono">{workflow.nodeCount} nodes</span>
      </div>
    </Link>
  );
}
