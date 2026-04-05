"use client";

import { WorkflowViewer } from "@sweny-ai/studio/viewer";
import type { Workflow } from "@sweny-ai/core";

interface DagViewerProps {
  workflow: Workflow;
  height?: string | number;
}

export default function DagViewer({ workflow, height = 280 }: DagViewerProps) {
  return <WorkflowViewer workflow={workflow} height={height} />;
}
