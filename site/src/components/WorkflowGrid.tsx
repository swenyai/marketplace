"use client";

import { useState, useMemo } from "react";
import type { MarketplaceWorkflow } from "@/lib/types";
import type { Category } from "@/lib/types";
import { WorkflowCard } from "./WorkflowCard";
import { FilterBar } from "./FilterBar";
import { EmptyState } from "./EmptyState";

interface WorkflowGridProps {
  workflows: MarketplaceWorkflow[];
}

export function WorkflowGrid({ workflows }: WorkflowGridProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of workflows) counts[w.category] = (counts[w.category] ?? 0) + 1;
    return counts;
  }, [workflows]);

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of workflows) {
      for (const s of w.skills) counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [workflows]);

  const filtered = useMemo(() => {
    let result = workflows;
    if (category) result = result.filter((w) => w.category === category);
    if (skill) result = result.filter((w) => w.skills.includes(skill));
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
  }, [workflows, category, skill, query]);

  const clearAll = () => {
    setCategory(null);
    setSkill(null);
    setQuery("");
  };

  const activeSummary = [
    category && <span key="c" className="text-accent">{category}</span>,
    skill && <span key="s" className="text-accent">{skill}</span>,
  ].filter(Boolean);

  return (
    <div>
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        skill={skill}
        onSkillChange={setSkill}
        onClearAll={clearAll}
        categoryCounts={categoryCounts}
        skillCounts={skillCounts}
        totalCount={workflows.length}
      />

      <div className="flex justify-between items-center py-4 text-xs text-text-dim">
        <span>
          <span className="font-mono text-text">{filtered.length}</span> workflow
          {filtered.length !== 1 ? "s" : ""}
          {activeSummary.length > 0 && (
            <>
              {" · filtered by "}
              {activeSummary.reduce<React.ReactNode[]>(
                (acc, el, i) => (i === 0 ? [el] : [...acc, " + ", el]),
                []
              )}
            </>
          )}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.length === 0 ? (
          <EmptyState onClearFilters={clearAll} />
        ) : (
          filtered.map((w) => <WorkflowCard key={w.id} workflow={w} />)
        )}
      </div>
    </div>
  );
}
