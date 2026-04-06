import { CreateTabs } from "@/components/CreateTabs";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Workflow",
  description: "Create a new SWEny workflow using AI or the E2E wizard",
};

export default function CreatePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-bold font-mono flex-shrink-0">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal hidden sm:inline">Workflows</span>
            </Link>
            <span className="text-gray-700 hidden sm:inline">/</span>
            <span className="text-xs md:text-sm text-gray-400">Create</span>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-200 text-xs md:text-sm flex-shrink-0 whitespace-nowrap"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Create a Workflow</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Describe what you want in plain English, or use a guided wizard to
            build a workflow tailored to your needs.
          </p>
        </div>
        <CreateTabs />
      </main>
    </div>
  );
}
