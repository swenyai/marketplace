"use client";

import { useState, useMemo } from "react";
import type { MarketplaceWorkflow } from "@/lib/types";
import type { Category } from "@/lib/types";
import { WorkflowCard } from "./WorkflowCard";
import { CategoryFilter } from "./CategoryFilter";
import { WorkflowDetail } from "./WorkflowDetail";

interface WorkflowGridProps {
  workflows: MarketplaceWorkflow[];
}

export function WorkflowGrid({ workflows }: WorkflowGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let result = workflows;
    if (categoryFilter) {
      result = result.filter((w) => w.category === categoryFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)) ||
          w.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [workflows, categoryFilter, query]);

  const selected = selectedId ? workflows.find((w) => w.id === selectedId) ?? null : null;

  return (
    <div>
      {/* Search + Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search workflows... (e.g. "security", "triage", "code review")'
            className="w-full bg-[#111] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-600"
          />
          <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-[#1a1a2e] px-1.5 py-0.5 rounded border border-[#2a2a3a]">
            \u2318K
          </kbd>
        </div>
        <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
      </div>

      {/* Grid + Detail */}
      <div className={`grid gap-4 md:gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Cards */}
        <div
          className={`grid gap-3 auto-rows-max ${
            selected
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {filtered.map((w) => (
            <WorkflowCard
              key={w.id}
              workflow={w}
              selected={w.id === selectedId}
              onClick={() => setSelectedId(w.id === selectedId ? null : w.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No workflows match your search.
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-[#0c0c14] rounded-xl border border-[#1e1e2e] p-4 md:p-6 overflow-y-auto lg:max-h-[calc(100vh-200px)] lg:sticky lg:top-24">
            <WorkflowDetail workflow={selected} />
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="mt-6 flex justify-between items-center text-xs text-gray-600">
        <span>
          {filtered.length} workflow{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
