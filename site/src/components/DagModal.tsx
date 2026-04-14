"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { Workflow } from "@sweny-ai/core";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-dim text-sm">
      Loading DAG…
    </div>
  ),
});

interface DagModalProps {
  open: boolean;
  onClose: () => void;
  workflow: Workflow;
}

export function DagModal({ open, onClose, workflow }: DagModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Workflow graph"
    >
      <div className="flex justify-between items-center px-4 md:px-6 py-3 border-b border-border flex-shrink-0">
        <div className="font-mono text-[11px] text-accent">
          // {workflow.id} · workflow graph
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-dim hover:text-text text-xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ×
        </button>
      </div>
      <div className="flex-1 marketplace-dag dag-host">
        <DagViewer workflow={workflow} height="100%" nodeWidth={200} nodeHeight={70} />
      </div>
    </div>
  );
}
