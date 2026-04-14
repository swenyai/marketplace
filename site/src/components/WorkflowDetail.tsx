"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { MarketplaceWorkflow } from "@/lib/types";
import { InstallCommand } from "./InstallCommand";
import { EnvVarList } from "./EnvVarList";
import { DagModal } from "./DagModal";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-dim text-sm">
      Loading DAG…
    </div>
  ),
});

interface WorkflowDetailProps {
  workflow: MarketplaceWorkflow;
  sampleOutputHtml?: string;
}

interface CoreWorkflow {
  id: string;
  name: string;
  description: string;
  entry: string;
  nodes: MarketplaceWorkflow["nodes"];
  edges: MarketplaceWorkflow["edges"];
}

function WorkflowDetailInner({
  workflow,
  sampleOutputHtml,
  coreWorkflow,
}: WorkflowDetailProps & { coreWorkflow: CoreWorkflow }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  // Deep-link support: ?view=graph opens modal on mount
  useEffect(() => {
    setModalOpen(searchParams.get("view") === "graph");
  }, [searchParams]);

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "graph");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-6 lg:gap-10">
        {/* LEFT COLUMN — info */}
        <div className="space-y-5">
          <div>
            <div className="font-mono text-[11px] text-accent mb-2 tracking-wide">
              // {workflow.source} · {workflow.category} · v{workflow.version}
            </div>
            <h1 className="text-2xl md:text-[28px] font-medium tracking-tight text-text leading-tight mb-2">
              {workflow.name}
            </h1>
            <p className="text-[14px] text-text-muted leading-relaxed">
              {workflow.description}
            </p>
          </div>

          <InstallCommand workflowId={workflow.id} />

          <div>
            <h2 className="text-[11px] font-semibold text-text-dim uppercase tracking-[0.12em] mb-3">
              Environment variables
            </h2>
            <EnvVarList variables={workflow.derivedVariables} />
          </div>

          <div className="flex gap-3 items-center text-[11px] text-text-dim pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block w-[5px] h-[5px] rounded-full ${
                  workflow.source === "official" ? "bg-accent" : "bg-text-dim"
                }`}
              />
              <span className="text-text-muted">{workflow.author}</span>
            </span>
            <span className="text-border">·</span>
            <span className="font-mono">{workflow.nodeCount} nodes</span>
            <span className="text-border">·</span>
            <span className="font-mono">{workflow.edgeCount} edges</span>
          </div>

          {sampleOutputHtml && (
            <div
              className="bg-surface border border-border rounded-md overflow-hidden"
            >
              <div className="text-[10px] text-text-dim tracking-wider uppercase font-medium px-4 py-2 border-b border-border bg-surface-2">
                Example workflow output
              </div>
              <div
                className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:overflow-x-auto [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: sampleOutputHtml }}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — DAG (desktop) / CTA (mobile) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="lg:hidden">
            <button
              onClick={openModal}
              className="w-full min-h-[48px] bg-accent-bg border border-accent-border text-accent rounded-md flex items-center justify-center gap-2 text-sm font-medium transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="font-mono">⤢</span>
              <span>View workflow graph</span>
            </button>
          </div>
          <div className="hidden lg:block card-atmosphere rounded-lg overflow-hidden marketplace-dag dag-host relative" style={{ height: "calc(100vh - 180px)", minHeight: 480 }}>
            <button
              onClick={openModal}
              className="absolute top-3 right-3 z-10 text-[10px] text-accent bg-accent-bg border border-accent-border rounded px-2 py-1 uppercase tracking-wider font-medium hover:bg-accent hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ⤢ expand
            </button>
            <DagViewer workflow={coreWorkflow} height="100%" nodeWidth={200} nodeHeight={70} />
          </div>
        </div>
      </div>

      <DagModal open={modalOpen} onClose={closeModal} workflow={coreWorkflow} />
    </>
  );
}

export function WorkflowDetail({ workflow, sampleOutputHtml }: WorkflowDetailProps) {
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

  return (
    <Suspense fallback={null}>
      <WorkflowDetailInner
        workflow={workflow}
        sampleOutputHtml={sampleOutputHtml}
        coreWorkflow={coreWorkflow}
      />
    </Suspense>
  );
}
