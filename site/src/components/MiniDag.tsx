"use client";

import type { MarketplaceWorkflow } from "@/lib/types";
import { COLOR_MAP } from "@/lib/types";

interface MiniDagProps {
  workflow: MarketplaceWorkflow;
  className?: string;
}

export function MiniDag({ workflow, className = "" }: MiniDagProps) {
  const color = workflow.color ?? "blue";
  const { text: textColor } = COLOR_MAP[color];

  // Topological order from entry
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    order.push(nodeId);
    for (const edge of workflow.edges) {
      if (edge.from === nodeId) visit(edge.to);
    }
  }
  visit(workflow.entry);
  for (const id of Object.keys(workflow.nodes)) {
    if (!visited.has(id)) order.push(id);
  }

  const nodeWidth = 48;
  const nodeHeight = 16;
  const gap = 12;
  const svgWidth = order.length * (nodeWidth + gap) - gap + 8;
  const svgHeight = 32;

  const positions = new Map<string, { x: number; y: number }>();
  order.forEach((id, i) => {
    positions.set(id, { x: 4 + i * (nodeWidth + gap), y: 8 });
  });

  return (
    <div className={`bg-[#08080f] rounded-md p-2 ${className}`}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
        {workflow.edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x + nodeWidth}
              y1={from.y + nodeHeight / 2}
              x2={to.x}
              y2={to.y + nodeHeight / 2}
              stroke="#333"
              strokeWidth="0.8"
            />
          );
        })}
        {order.map((id) => {
          const pos = positions.get(id)!;
          const label = id.length > 8 ? id.slice(0, 7) + "\u2026" : id;
          return (
            <g key={id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                rx={3}
                className={`fill-current ${textColor} opacity-20`}
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text
                x={pos.x + nodeWidth / 2}
                y={pos.y + nodeHeight / 2 + 3}
                className={`${textColor} fill-current`}
                fontSize="5"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
