"use client";

interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="font-mono text-[10px] text-accent mb-3 tracking-wider">// no matches</div>
      <p className="text-base font-semibold text-text mb-1">
        No workflows match your filters
      </p>
      <p className="text-sm text-text-muted mb-6 max-w-md">
        Try removing one of the filters, or clear them all to see every workflow.
      </p>
      <button
        onClick={onClearFilters}
        className="min-h-[40px] px-4 rounded-md text-sm font-medium border border-dashed border-text-dim text-text-muted hover:text-text hover:border-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        × Clear all filters
      </button>
    </div>
  );
}
