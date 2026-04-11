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
import { InstallButton } from "./InstallButton";
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
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white ${colors.bg} ${colors.border} border flex-shrink-0`}
          >
            {workflow.name[0]}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-gray-100 min-w-0 break-words">{workflow.name}</h2>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
              workflow.source === "official"
                ? "bg-blue-950/50 text-blue-400"
                : "bg-green-950/50 text-green-400"
            }`}
          >
            {workflow.source === "official" ? "OFFICIAL" : "COMMUNITY"}
          </span>
        </div>
        <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
          {workflow.description}
        </p>
      </div>

      {/* Meta bar */}
      <div className="flex gap-2 md:gap-4 items-center mb-3 px-3 py-2 bg-[#111] rounded-lg border border-[#1e1e2e] text-[11px] md:text-xs text-gray-500 flex-wrap">
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

      {/* Actions — always above the fold */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <InstallButton workflow={workflow} />
        <a
          href={`/create?fork=${workflow.id}`}
          className="flex-1 bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium text-center transition"
        >
          Fork & Edit
        </a>
        <a
          href={`https://github.com/swenyai/marketplace/blob/main/${workflow.filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-4 py-3 sm:py-2.5 rounded-lg text-sm text-center transition"
        >
          GitHub
        </a>
      </div>

      {/* Tabs — immediately after actions */}
      <div className="flex border-b border-[#1e1e2e] mb-3 overflow-x-auto">
        {(["skills", "yaml", "usage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 md:px-4 py-2.5 text-xs font-medium transition whitespace-nowrap ${
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
      <div className="mb-4">
        {tab === "skills" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...skillNodes.entries()].map(([skill, nodes]) => (
              <div key={skill} className="bg-[#111] border border-[#1e1e2e] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-200 font-medium capitalize">{skill}</span>
                </div>
                <span className="text-[11px] text-gray-600 break-words">Used in: {nodes.join(", ")}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "yaml" && <YamlViewer yaml={yamlString} />}
        {tab === "usage" && <UsageSnippet workflow={workflow} />}
      </div>

      {/* Interactive DAG — visual reference, below actionable content */}
      <div className="bg-[#08080f] border border-[#1e1e2e] rounded-xl mb-3 overflow-hidden marketplace-dag">
        <div className="block md:hidden">
          <DagViewer workflow={coreWorkflow} height={280} nodeWidth={160} nodeHeight={60} />
        </div>
        <div className="hidden md:block">
          <DagViewer workflow={coreWorkflow} height={400} nodeWidth={200} nodeHeight={70} />
        </div>
      </div>

      {/* Cloud CTA */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-950/20 border border-blue-900/30 rounded-lg">
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-xs text-gray-400">
          Track this workflow&apos;s performance{" "}
          <a
            href="https://cloud.sweny.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            cloud.sweny.ai &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
