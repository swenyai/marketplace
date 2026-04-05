"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { MarketplaceWorkflow } from "@/lib/types";

const DagViewer = dynamic(
  () => import("./DagViewer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">Loading DAG...</div> }
);
import { COLOR_MAP, CATEGORIES } from "@/lib/types";
import { YamlViewer } from "./YamlViewer";
import { UsageSnippet } from "./UsageSnippet";
import { stringify } from "yaml";

type Tab = "skills" | "yaml" | "usage";

interface WorkflowDetailProps {
  workflow: MarketplaceWorkflow;
}

export function WorkflowDetail({ workflow }: WorkflowDetailProps) {
  const [tab, setTab] = useState<Tab>("skills");
  const color = workflow.color ?? CATEGORIES[workflow.category]?.color ?? "blue";
  const colors = COLOR_MAP[color];

  const coreWorkflow = useMemo(
    () => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      entry: workflow.entry,
      nodes: workflow.nodes,
      edges: workflow.edges,
    }),
    [workflow]
  );

  const yamlString = useMemo(() => stringify(workflow), [workflow]);

  const skillNodes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [nodeId, node] of Object.entries(workflow.nodes)) {
      for (const skill of node.skills) {
        const arr = map.get(skill) ?? [];
        arr.push(nodeId);
        map.set(skill, arr);
      }
    }
    return map;
  }, [workflow]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${colors.bg} ${colors.border} border`}
          >
            {workflow.name[0]}
          </div>
          <h2 className="text-xl font-bold text-gray-100">{workflow.name}</h2>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded ${
              workflow.source === "official"
                ? "bg-blue-950/50 text-blue-400"
                : "bg-green-950/50 text-green-400"
            }`}
          >
            {workflow.source === "official" ? "OFFICIAL" : "COMMUNITY"}
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {workflow.description}
        </p>
      </div>

      {/* Meta bar */}
      <div className="flex gap-4 items-center mb-4 px-3 py-2 bg-[#111] rounded-lg border border-[#1e1e2e] text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-700" />
          <span>{workflow.author}</span>
        </div>
        <span className="text-gray-700">|</span>
        <span>{workflow.nodeCount} nodes</span>
        <span className="text-gray-700">|</span>
        <span>{workflow.edgeCount} edges</span>
        <span className="text-gray-700">|</span>
        <span>v{workflow.version}</span>
      </div>

      {/* Interactive DAG */}
      <div className="bg-[#08080f] border border-[#1e1e2e] rounded-xl mb-4 overflow-hidden">
        <DagViewer workflow={coreWorkflow} height={280} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e1e2e] mb-4">
        {(["skills", "yaml", "usage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium transition ${
              tab === t
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "skills" ? "Skills Required" : t === "yaml" ? "YAML Source" : "Usage"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "skills" && (
        <div className="grid grid-cols-2 gap-2">
          {[...skillNodes.entries()].map(([skill, nodes]) => (
            <div key={skill} className="bg-[#111] border border-[#1e1e2e] rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-200 font-medium capitalize">{skill}</span>
              </div>
              <span className="text-[10px] text-gray-600">Used in: {nodes.join(", ")}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "yaml" && <YamlViewer yaml={yamlString} />}
      {tab === "usage" && <UsageSnippet workflow={workflow} />}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setTab("usage")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Use This Workflow
        </button>
        <a
          href={`/create?fork=${workflow.id}`}
          className="flex-1 bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-4 py-2.5 rounded-lg text-sm font-medium text-center transition"
        >
          Fork & Edit
        </a>
        <a
          href={`https://github.com/swenyai/marketplace/blob/main/${workflow.filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-3 py-2.5 rounded-lg text-sm transition"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
