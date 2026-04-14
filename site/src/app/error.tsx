"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-[12px] text-accent mb-4 tracking-wide">// 500 · something broke</div>
      <h1 className="text-3xl font-medium text-text mb-3 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-text-muted max-w-md mb-8">
        An unexpected error occurred. Try again, or head back to the catalog.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="min-h-[44px] px-5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium inline-flex items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="min-h-[44px] px-5 bg-surface border border-border hover:border-text-dim text-text rounded-md text-sm font-medium inline-flex items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Browse workflows
        </Link>
      </div>
    </div>
  );
}
