"use client";

import { CATEGORIES, type Category } from "@/lib/types";

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (category: Category | null) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 md:gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3.5 py-2 md:py-1.5 rounded-full text-xs font-medium transition ${
          selected === null
            ? "bg-blue-600 text-white"
            : "bg-[#111] text-gray-400 border border-[#2a2a3a] hover:border-gray-600"
        }`}
      >
        All
      </button>
      {(Object.entries(CATEGORIES) as [Category, { label: string }][]).map(
        ([key, { label }]) => (
          <button
            key={key}
            onClick={() => onChange(selected === key ? null : key)}
            className={`px-3.5 py-2 md:py-1.5 rounded-full text-xs font-medium transition ${
              selected === key
                ? "bg-blue-600 text-white"
                : "bg-[#111] text-gray-400 border border-[#2a2a3a] hover:border-gray-600"
            }`}
          >
            {label}
          </button>
        )
      )}
    </div>
  );
}
