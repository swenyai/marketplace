import { getAllWorkflows } from "@/lib/workflows";
import { WorkflowGrid } from "@/components/WorkflowGrid";
import Link from "next/link";

export default function Home() {
  const workflows = getAllWorkflows();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-bold font-mono truncate">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Create Workflow</span>
            </Link>
            <a
              href="https://github.com/swenyai/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 text-xs md:text-sm"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <WorkflowGrid workflows={workflows} />
      </main>
    </div>
  );
}
