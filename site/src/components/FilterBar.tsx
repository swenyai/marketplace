"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";

interface FilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  category: Category | null;
  onCategoryChange: (c: Category | null) => void;
  skill: string | null;
  onSkillChange: (s: string | null) => void;
  onClearAll: () => void;
  categoryCounts: Record<string, number>;
  skillCounts: Record<string, number>;
  totalCount: number;
}

export function FilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  skill,
  onSkillChange,
  onClearAll,
  categoryCounts,
  skillCounts,
  totalCount,
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasActiveFilter = category !== null || skill !== null || query.trim() !== "";
  // Count only chip-filters for the mobile Filters button badge — the search
  // field already displays its own value, so including it would double-count.
  const chipFilterCount = (category ? 1 : 0) + (skill ? 1 : 0);
  const activeFilterCount =
    (category ? 1 : 0) + (skill ? 1 : 0) + (query.trim() ? 1 : 0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([s]) => s);

  const chipClass = (active: boolean) =>
    `shrink-0 min-h-[36px] md:min-h-[32px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active
        ? "bg-accent-bg border border-accent-border text-accent"
        : "bg-surface border border-border text-text-muted hover:border-text-dim"
    }`;

  const categoryChips = (Object.entries(CATEGORIES) as [Category, { label: string }][])
    .map(([key, { label }]) => {
      const count = categoryCounts[key] ?? 0;
      if (count === 0) return null;
      const active = category === key;
      return (
        <button
          key={key}
          onClick={() => onCategoryChange(active ? null : key)}
          aria-pressed={active}
          className={chipClass(active)}
        >
          <span>{label}</span>
          <span className="font-mono text-[10px] text-text-dim">{count}</span>
        </button>
      );
    })
    .filter(Boolean);

  const skillChips = topSkills.map((s) => {
    const active = skill === s;
    const count = skillCounts[s];
    return (
      <button
        key={s}
        onClick={() => onSkillChange(active ? null : s)}
        aria-pressed={active}
        className={chipClass(active)}
      >
        <span>{s}</span>
        <span className="font-mono text-[10px] text-text-dim">{count}</span>
      </button>
    );
  });

  const clearButton = hasActiveFilter ? (
    <button
      onClick={onClearAll}
      aria-label="Clear filters"
      className="shrink-0 min-h-[36px] md:min-h-[32px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 border border-dashed border-text-dim text-text-dim hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span>×</span>
      <span>clear ({activeFilterCount})</span>
    </button>
  ) : null;

  return (
    <div className="sticky top-14 md:top-[56px] z-40 bg-bg/85 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-3 md:py-4 border-b border-border">
      <div className="flex gap-2 items-center flex-wrap">
        {/* Search — shared between mobile + desktop, single ref for ⌘K */}
        <div className="relative flex-1 md:min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm pointer-events-none">
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${totalCount} workflows…`}
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 md:pr-12 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent-border focus-visible:ring-2 focus-visible:ring-accent min-h-[40px]"
          />
          <kbd className="hidden md:inline-block absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>

        {/* Mobile Filters toggle — desktop hides it since chips wrap inline */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="filter-bar-mobile-panel"
          className={`md:hidden shrink-0 min-h-[40px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            chipFilterCount > 0 || mobileFiltersOpen
              ? "bg-accent-bg border border-accent-border text-accent"
              : "bg-surface border border-border text-text-muted"
          }`}
        >
          <span>Filters</span>
          {chipFilterCount > 0 && (
            <span className="font-mono text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">
              {chipFilterCount}
            </span>
          )}
          <span aria-hidden className="text-text-dim">
            {mobileFiltersOpen ? "▲" : "▼"}
          </span>
        </button>

        {/* Desktop chips — inline with wrap */}
        <div className="hidden md:contents">
          {categoryChips}
          {skillChips}
          {clearButton}
        </div>
      </div>

      {/* Mobile expandable panel — chips wrap in a full grid so nothing falls off */}
      {mobileFiltersOpen && (
        <div
          id="filter-bar-mobile-panel"
          className="md:hidden mt-3 pt-3 border-t border-border flex flex-wrap gap-2"
        >
          {categoryChips}
          {skillChips}
          {clearButton}
        </div>
      )}
    </div>
  );
}
