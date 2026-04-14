import { getAllWorkflows, getWorkflowById } from "@/lib/workflows";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { codeToHtml } from "shiki";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllWorkflows().map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) return {};

  return {
    title: workflow.name,
    description: workflow.description,
    openGraph: {
      title: `${workflow.name} — SWEny Workflow`,
      description: workflow.description,
      images: [`/api/og/workflows/${workflow.id}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/workflows/${workflow.id}`],
    },
  };
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) notFound();

  const sampleOutputHtml = workflow.sampleOutput
    ? await codeToHtml(workflow.sampleOutput, {
        lang: "markdown",
        theme: "vitesse-dark",
      })
    : undefined;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-semibold font-mono flex-shrink-0 tracking-tight">
              SWE<span className="text-accent">ny</span>{" "}
              <span className="text-text-dim font-normal hidden sm:inline">Workflows</span>
            </Link>
            <span className="text-border hidden sm:inline">/</span>
            <span className="text-xs md:text-sm text-text-muted truncate">{workflow.name}</span>
          </div>
          <Link
            href="/"
            className="text-text-muted hover:text-text text-xs md:text-sm flex-shrink-0 whitespace-nowrap min-h-[44px] md:min-h-[36px] flex items-center px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <WorkflowDetail workflow={workflow} sampleOutputHtml={sampleOutputHtml} />
      </main>
    </div>
  );
}
