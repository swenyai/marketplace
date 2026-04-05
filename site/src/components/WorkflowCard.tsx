"use client";

import type { MarketplaceWorkflow } from "@/lib/types";
import { COLOR_MAP, CATEGORIES } from "@/lib/types";
import { MiniDag } from "./MiniDag";

interface WorkflowCardProps {
  workflow: MarketplaceWorkflow;
  selected: boolean;
  onClick: () => void;
}

export function WorkflowCard({ workflow, selected, onClick }: WorkflowCardProps) {
  const color = workflow.color ?? CATEGORIES[workflow.category]?.color ?? "blue";
  const colors = COLOR_MAP[color];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 transition-all border cursor-pointer ${
        selected
          ? `${colors.bg} ${colors.border} border-2`
          : "bg-[#111] border-[#1e1e2e] hover:border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white ${colors.bg} ${colors.border} border`}
        >
          {workflow.name[0]}
        </div>
        <span className="text-sm font-semibold text-gray-100 truncate">
          {workflow.name}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {workflow.description}
      </p>

      <MiniDag workflow={workflow} className="mb-3" />

      <div className="flex gap-1 flex-wrap mb-2">
        {workflow.skills.map((skill) => (
          <span
            key={skill}
            className="bg-[#0f172a] text-blue-400 px-1.5 py-0.5 rounded text-[10px] border border-blue-900/50"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-700" />
          <span className="text-[10px] text-gray-500">{workflow.author}</span>
        </div>
        <span
          className={`text-[9px] font-medium px-2 py-0.5 rounded ${
            workflow.source === "official"
              ? "bg-blue-950/50 text-blue-400"
              : "bg-green-950/50 text-green-400"
          }`}
        >
          {workflow.source === "official" ? "OFFICIAL" : "COMMUNITY"}
        </span>
      </div>
    </button>
  );
}
