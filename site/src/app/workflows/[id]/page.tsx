import { getAllWorkflows, getWorkflowById } from "@/lib/workflows";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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
    },
  };
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) notFound();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-bold font-mono">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm text-gray-400">{workflow.name}</span>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <WorkflowDetail workflow={workflow} />
      </main>
    </div>
  );
}
