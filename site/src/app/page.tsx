import { getAllWorkflows } from "@/lib/workflows";
import { WorkflowGrid } from "@/components/WorkflowGrid";
import Link from "next/link";

export default function Home() {
  const workflows = getAllWorkflows();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-semibold font-mono truncate tracking-tight">
              SWE<span className="text-accent">ny</span>{" "}
              <span className="text-text-dim font-normal">Workflows</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link
              href="/create"
              className="bg-accent hover:bg-accent-hover text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition whitespace-nowrap min-h-[36px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Create Workflow</span>
            </Link>
            <a
              href="https://github.com/swenyai/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text text-xs md:text-sm min-h-[36px] flex items-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <WorkflowGrid workflows={workflows} />
      </main>
    </div>
  );
}
