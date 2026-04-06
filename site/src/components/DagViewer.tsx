"use client";

import { WorkflowViewer } from "@sweny-ai/studio/viewer";
import type { Workflow } from "@sweny-ai/core";

interface DagViewerProps {
  workflow: Workflow;
  height?: string | number;
  nodeWidth?: number;
  nodeHeight?: number;
}

export default function DagViewer({ workflow, height = 280, nodeWidth, nodeHeight }: DagViewerProps) {
  return <WorkflowViewer workflow={workflow} height={height} nodeWidth={nodeWidth} nodeHeight={nodeHeight} />;
}
