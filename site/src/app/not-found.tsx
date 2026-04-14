import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-[12px] text-accent mb-4 tracking-wide">// 404 · not found</div>
      <h1 className="text-3xl font-medium text-text mb-3 tracking-tight">
        We couldn&apos;t find that workflow
      </h1>
      <p className="text-text-muted max-w-md mb-8">
        It may have been renamed, moved, or hasn&apos;t been published yet.
      </p>
      <Link
        href="/"
        className="min-h-[44px] px-5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium inline-flex items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Browse all workflows
      </Link>
    </div>
  );
}
