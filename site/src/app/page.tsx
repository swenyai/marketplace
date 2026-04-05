import { getAllWorkflows } from "@/lib/workflows";
import { WorkflowGrid } from "@/components/WorkflowGrid";
import Link from "next/link";

export default function Home() {
  const workflows = getAllWorkflows();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-bold font-mono">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Create Workflow
            </Link>
            <a
              href="https://github.com/swenyai/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <WorkflowGrid workflows={workflows} />
      </main>
    </div>
  );
}
