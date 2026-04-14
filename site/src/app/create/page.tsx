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
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-bold font-mono flex-shrink-0">
              SWE<span className="text-accent">ny</span>{" "}
              <span className="text-text-dim font-normal hidden sm:inline">Workflows</span>
            </Link>
            <span className="text-border hidden sm:inline">/</span>
            <span className="text-xs md:text-sm text-text-muted">Create</span>
          </div>
          <Link
            href="/"
            className="text-text-muted hover:text-text text-xs md:text-sm flex-shrink-0 whitespace-nowrap"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Create a Workflow</h1>
          <p className="text-text-muted text-xs md:text-sm mt-1">
            Describe what you want in plain English, or use a guided wizard to
            build a workflow tailored to your needs.
          </p>
        </div>
        <CreateTabs />
      </main>
    </div>
  );
}
