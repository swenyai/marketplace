# Marketplace UX Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate marketplace.sweny.ai to Linear/Vercel/Stripe-tier premium polish — dual-theme design token system, refined card grid, detail page with side-by-side desktop layout and mobile-friendly full-screen DAG modal.

**Architecture:** Tailwind 4 CSS-variable token system (`@theme` block in globals.css + `prefers-color-scheme` override) feeds semantic utilities (`bg-surface`, `text-text`, `border-border`). Components rebuilt against tokens — no more `bg-[#09090b]` arbitrary values. Detail page splits into info column + sticky DAG column on desktop; mobile replaces inline DAG with a CTA that opens a shared full-screen modal (pan + zoom via react-flow).

**Tech Stack:** Next.js 15 (App Router, SSG), React 19, Tailwind 4, TypeScript, Vitest + Testing Library, `@xyflow/react` (via `@sweny-ai/studio` viewer), `yaml`, Shiki (new — code highlighting), `@vercel/og` (new — OG image generator).

**Spec:** `docs/superpowers/specs/2026-04-14-marketplace-ux-elevation-design.md`

---

## File Structure

Files that will be created or modified, grouped by responsibility.

**Design system (Section 1):**
- Modify `site/src/app/globals.css` — token definitions, theme override, font config, scrollbar styling.
- Modify `site/tailwind.config.ts` — may be removed; Tailwind 4 uses `@theme` in CSS.
- Modify `site/src/app/layout.tsx` — swap Geist fonts for Inter + JetBrains Mono.

**Home page (Section 2):**
- Modify `site/src/app/page.tsx` — use new tokens; simplify so cards link to detail route instead of inline selection.
- Modify `site/src/components/WorkflowGrid.tsx` — remove inline detail panel; add sticky filter bar, sort, clear-filters chip.
- Create `site/src/components/FilterBar.tsx` — sticky filter bar with search + category chips + skill chips + clear button.
- Modify `site/src/components/CategoryFilter.tsx` — chip style using tokens, count badges, accent-active state.
- Create `site/src/components/SkillFilter.tsx` — new, parallel to CategoryFilter.
- Modify `site/src/components/WorkflowCard.tsx` — C aesthetic (mono category line, 16px title, source dot, gradient atmosphere).
- Create `site/src/components/EmptyState.tsx` — "no matches" empty state with Clear-filters CTA.

**Detail page (Section 3):**
- Modify `site/src/app/workflows/[id]/page.tsx` — side-by-side layout wrapper, OG image metadata.
- Rewrite `site/src/components/WorkflowDetail.tsx` — split into info column + dag column, sticky DAG on scroll.
- Create `site/src/components/InstallCommand.tsx` — hero install command block with copy feedback.
- Create `site/src/components/EnvVarList.tsx` — required-default / optional-collapsed env var list.
- Create `site/src/components/SampleOutput.tsx` — markdown + Shiki syntax highlighting.
- Create `site/src/components/DagModal.tsx` — full-screen modal with pan/zoom, URL `?view=graph` deep-link.

**Polish (Section 4):**
- Create `site/src/app/api/og/workflows/[id]/route.tsx` — `@vercel/og` image generator.
- Create `site/src/app/not-found.tsx` — themed 404.
- Create `site/src/app/error.tsx` — themed 500.

---

## Task 0: Setup — install dependencies

**Files:**
- Modify: `site/package.json`

- [ ] **Step 1: Install new deps**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm install shiki
```

Expected: `shiki` added to dependencies. Shiki is used for sample-output syntax highlighting (bundled, SSR-safe).

- [ ] **Step 2: Verify `@vercel/og` available**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm list @vercel/og 2>/dev/null || npm install @vercel/og
```

Expected: `@vercel/og` installed (ships with `next` but install explicitly to lock version).

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/package.json site/package-lock.json && git commit -m "chore: add shiki and @vercel/og for marketplace UX elevation"
```

---

## Task 1: Design tokens — globals.css with dual theme

**Files:**
- Modify: `site/src/app/globals.css`
- Modify: `site/tailwind.config.ts`

- [ ] **Step 1: Replace globals.css with token definitions**

Write this exact content to `site/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Colors — dark mode default */
  --color-bg: #050505;
  --color-surface: #0a0a0a;
  --color-surface-2: #18181b;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-text-dim: #71717a;
  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-accent-bg: rgba(59, 130, 246, 0.12);
  --color-accent-border: rgba(59, 130, 246, 0.4);

  /* Fonts (wired up in layout.tsx) */
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  /* Spacing unchanged — Tailwind 4 defaults are already 4px-based */
}

/* Light theme override */
@media (prefers-color-scheme: light) {
  @theme inline {
    --color-bg: #ffffff;
    --color-surface: #fafafa;
    --color-surface-2: #f4f4f5;
    --color-border: #e4e4e7;
    --color-text: #09090b;
    --color-text-muted: #52525b;
    --color-text-dim: #71717a;
    --color-accent: #2563eb;
    --color-accent-hover: #1d4ed8;
    --color-accent-bg: rgba(37, 99, 235, 0.10);
    --color-accent-border: rgba(37, 99, 235, 0.35);
  }
}

/* Card atmosphere — dark-only gradient, light uses solid */
.card-atmosphere {
  background:
    radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.08), transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(56, 189, 248, 0.04), transparent 50%),
    var(--color-surface);
  border: 1px solid var(--color-border);
  position: relative;
}

@media (prefers-color-scheme: light) {
  .card-atmosphere {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }
}

/* Scrollbar styling — thin, theme-aware */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

/* React Flow overrides preserved from current */
.react-flow__attribution,
.react-flow__minimap { display: none !important; }

.marketplace-dag .react-flow__node { font-size: 11px !important; }
@media (max-width: 768px) {
  .marketplace-dag .react-flow__node { font-size: 10px !important; }
}
.marketplace-dag .react-flow__edge-text { font-size: 9px !important; }
.marketplace-dag { touch-action: pan-y pinch-zoom; }
.marketplace-dag .react-flow__edge-textbg { rx: 4; ry: 4; }
.marketplace-dag .react-flow__controls {
  transform: scale(0.85);
  transform-origin: bottom left;
}

/* Studio viewer error theming preserved */
.dag-host div[style*="rgb(254, 242, 242)"],
.dag-host div[style*="#fef2f2"] {
  background: transparent !important;
  color: rgb(248, 113, 113) !important;
  font-family: var(--font-mono);
}
.dag-host div[style*="rgb(254, 242, 242)"] code,
.dag-host div[style*="#fef2f2"] code {
  color: rgb(248, 113, 113) !important;
}
```

- [ ] **Step 2: Delete tailwind.config.ts**

Run:
```bash
rm /Users/nate/src/swenyai/marketplace/site/tailwind.config.ts
```

Expected: file removed. Tailwind 4 no longer needs it — `@theme` in CSS handles config.

- [ ] **Step 3: Run build to verify tokens work**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run build 2>&1 | tail -20
```

Expected: build succeeds. If build fails because components use `bg-[#09090b]` etc, that's OK — we'll fix those in subsequent tasks. What matters now is that Tailwind compiles the new `@theme`.

- [ ] **Step 4: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/globals.css site/tailwind.config.ts && git commit -m "feat(tokens): dual-theme design token system with blue accent"
```

---

## Task 2: Fonts — swap Geist for Inter + JetBrains Mono

**Files:**
- Modify: `site/src/app/layout.tsx`

- [ ] **Step 1: Replace font imports**

In `site/src/app/layout.tsx`, change lines 1-17 from:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@sweny-ai/studio/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

To:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@sweny-ai/studio/style.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
```

- [ ] **Step 2: Update body className**

In `site/src/app/layout.tsx`, change the `<body>` element from:

```tsx
<body
  className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#09090b] text-gray-100 antialiased`}
>
```

To:

```tsx
<body
  className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-bg text-text antialiased`}
>
```

Also remove `className="dark"` from the `<html>` element — system preference drives theming now (dark is still default via `@theme`). Change:

```tsx
<html lang="en" className="dark">
```

To:

```tsx
<html lang="en">
```

- [ ] **Step 3: Update footer colors to use tokens**

In `site/src/app/layout.tsx`, replace footer classes using arbitrary hex with token utilities. Change:

```tsx
<footer className="border-t border-[#1e1e2e] mt-16 py-8 px-6">
```

To:

```tsx
<footer className="border-t border-border mt-16 py-8 px-6">
```

And the inner text elements — update any `text-gray-400`, `text-gray-500`, `text-gray-700` to `text-text-muted` and `text-text-dim` appropriately. The `hover:text-blue-400 transition` becomes `hover:text-accent-hover transition`.

Final footer block should read:

```tsx
<footer className="border-t border-border mt-16 py-8 px-6">
  <div className="max-w-4xl mx-auto">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <span className="text-sm font-semibold text-text-muted tracking-tight">
        SWE<span className="text-accent">ny</span> Workflows
      </span>
      <div className="flex items-center gap-6 text-xs text-text-dim">
        <a href="https://cloud.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
          Dashboard
        </a>
        <a href="https://spec.sweny.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
          Spec
        </a>
        <a href="https://github.com/swenyai/sweny" target="_blank" rel="noopener noreferrer" className="hover:text-accent-hover transition">
          GitHub
        </a>
      </div>
    </div>
    <p className="text-[11px] text-text-dim text-center opacity-70">
      Read-only by design. SWEny never writes to your repos.
    </p>
  </div>
</footer>
```

- [ ] **Step 4: Run dev server and visually verify**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run dev -- --port 3210 &
sleep 4
curl -s http://localhost:3210 | grep -c "Inter" | head -1
kill %1 2>/dev/null
```

Expected: curl returns a count ≥ 1 (Inter font reference in HTML). If 0, fonts didn't load.

- [ ] **Step 5: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/layout.tsx && git commit -m "feat(fonts): swap Geist for Inter + JetBrains Mono"
```

---

## Task 3: Home page shell — top bar with tokens

**Files:**
- Modify: `site/src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx using tokens**

Replace `site/src/app/page.tsx` entire content with:

```tsx
import { getAllWorkflows } from "@/lib/workflows";
import { WorkflowGrid } from "@/components/WorkflowGrid";
import Link from "next/link";

export default function Home() {
  const workflows = getAllWorkflows();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-semibold font-mono truncate tracking-tight">
              SWE<span className="text-accent">ny</span>{" "}
              <span className="text-text-dim font-normal">Workflows</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link
              href="/create"
              className="bg-accent hover:bg-accent-hover text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition whitespace-nowrap min-h-[36px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Create Workflow</span>
            </Link>
            <a
              href="https://github.com/swenyai/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text text-xs md:text-sm min-h-[36px] flex items-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <WorkflowGrid workflows={workflows} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Start dev server and verify top bar renders**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run dev -- --port 3210 &
sleep 4
curl -s http://localhost:3210 | grep -o "SWEny" | head -1
kill %1 2>/dev/null
```

Expected: output `SWEny`.

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/page.tsx && git commit -m "feat(home): top bar uses token system"
```

---

## Task 4: FilterBar component — sticky, ⌘K, chips with counts, clear-all

**Files:**
- Create: `site/src/components/FilterBar.tsx`
- Create: `site/src/__tests__/FilterBar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `site/src/__tests__/FilterBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "@/components/FilterBar";
import type { Category } from "@/lib/types";

describe("FilterBar", () => {
  const defaultProps = {
    query: "",
    onQueryChange: vi.fn(),
    category: null as Category | null,
    onCategoryChange: vi.fn(),
    skill: null as string | null,
    onSkillChange: vi.fn(),
    onClearAll: vi.fn(),
    categoryCounts: { triage: 2, security: 3 } as Record<string, number>,
    skillCounts: { github: 5, slack: 2 } as Record<string, number>,
    totalCount: 18,
  };

  it("renders search input with placeholder including total count", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Search 18 workflows/i)).toBeInTheDocument();
  });

  it("shows the clear-all chip only when a filter is active", () => {
    const { rerender } = render(<FilterBar {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();

    rerender(<FilterBar {...defaultProps} category="triage" />);
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("calls onClearAll when clear chip clicked", async () => {
    const onClearAll = vi.fn();
    render(<FilterBar {...defaultProps} category="triage" onClearAll={onClearAll} />);
    await userEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("focuses search when ⌘K is pressed", async () => {
    render(<FilterBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Search 18 workflows/i);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(document.activeElement).toBe(input);
  });

  it("focuses search when Ctrl-K is pressed (non-mac)", async () => {
    render(<FilterBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Search 18 workflows/i);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it("shows count next to category chip", () => {
    render(<FilterBar {...defaultProps} />);
    // 'Triage' chip should show "2" as a count
    const triageChip = screen.getByRole("button", { name: /Triage 2/i });
    expect(triageChip).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/FilterBar.test.tsx 2>&1 | tail -15
```

Expected: FAIL with module-not-found for `@/components/FilterBar`.

- [ ] **Step 3: Create FilterBar.tsx**

Create `site/src/components/FilterBar.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
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
  const hasActiveFilter = category !== null || skill !== null || query.trim() !== "";
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

  // Sorted skill list by count descending, top 6 only
  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([s]) => s);

  return (
    <div className="sticky top-14 md:top-[56px] z-40 bg-bg/85 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-4 border-b border-border">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm pointer-events-none">
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${totalCount} workflows…`}
            className="w-full bg-surface border border-border rounded-md pl-9 pr-12 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent-border focus-visible:ring-2 focus-visible:ring-accent min-h-[40px]"
          />
          <kbd className="hidden md:inline-block absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>

        {(Object.entries(CATEGORIES) as [Category, { label: string }][]).map(
          ([key, { label }]) => {
            const count = categoryCounts[key] ?? 0;
            if (count === 0) return null;
            const active = category === key;
            return (
              <button
                key={key}
                onClick={() => onCategoryChange(active ? null : key)}
                aria-pressed={active}
                className={`min-h-[32px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-accent-bg border border-accent-border text-accent"
                    : "bg-surface border border-border text-text-muted hover:border-text-dim"
                }`}
              >
                <span>{label}</span>
                <span className="font-mono text-[10px] text-text-dim">{count}</span>
              </button>
            );
          }
        )}

        {topSkills.map((s) => {
          const active = skill === s;
          const count = skillCounts[s];
          return (
            <button
              key={s}
              onClick={() => onSkillChange(active ? null : s)}
              aria-pressed={active}
              className={`min-h-[32px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "bg-accent-bg border border-accent-border text-accent"
                  : "bg-surface border border-border text-text-muted hover:border-text-dim"
              }`}
            >
              <span>{s}</span>
              <span className="font-mono text-[10px] text-text-dim">{count}</span>
            </button>
          );
        })}

        {hasActiveFilter && (
          <button
            onClick={onClearAll}
            aria-label="Clear filters"
            className="min-h-[32px] px-3 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 border border-dashed border-text-dim text-text-dim hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>×</span>
            <span>clear filters ({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/FilterBar.test.tsx 2>&1 | tail -15
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/FilterBar.tsx site/src/__tests__/FilterBar.test.tsx && git commit -m "feat(home): FilterBar with sticky, ⌘K, chip counts, clear-all"
```

---

## Task 5: EmptyState component

**Files:**
- Create: `site/src/components/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/EmptyState.tsx && git commit -m "feat(home): EmptyState component"
```

---

## Task 6: WorkflowCard rebuild — C aesthetic (mono category, source dot, gradient)

**Files:**
- Modify: `site/src/components/WorkflowCard.tsx`

- [ ] **Step 1: Rewrite WorkflowCard.tsx**

Replace entire content:

```tsx
"use client";

import Link from "next/link";
import type { MarketplaceWorkflow } from "@/lib/types";

interface WorkflowCardProps {
  workflow: MarketplaceWorkflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Link
      href={`/workflows/${workflow.id}`}
      className="group card-atmosphere rounded-lg p-4 transition hover:border-accent-border block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="font-mono text-[10px] text-accent mb-2 tracking-wide">
        // {workflow.source} · {workflow.category}
      </div>
      <h3 className="text-base font-semibold text-text mb-1 tracking-tight leading-tight">
        {workflow.name}
      </h3>
      <p className="text-[13px] text-text-muted leading-[1.5] mb-3 line-clamp-2">
        {workflow.description}
      </p>
      <div className="flex gap-1 flex-wrap mb-3 min-h-[18px]">
        {workflow.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="bg-surface-2 border border-border text-text-muted px-1.5 py-0.5 rounded text-[10px] font-medium"
          >
            {skill}
          </span>
        ))}
        {workflow.skills.length > 3 && (
          <span className="text-[10px] text-text-dim self-center">
            +{workflow.skills.length - 3}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-border text-[11px] text-text-dim">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-[5px] h-[5px] rounded-full ${
              workflow.source === "official" ? "bg-accent" : "bg-text-dim"
            }`}
          />
          <span className="text-text-muted font-medium">{workflow.author}</span>
        </span>
        <span className="font-mono">{workflow.nodeCount} nodes</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Run existing tests to ensure nothing breaks**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run 2>&1 | tail -10
```

Expected: existing tests pass. Some may need updating in later tasks — log any failures; only fix ones caused by this task's change.

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/WorkflowCard.tsx && git commit -m "feat(home): WorkflowCard rebuilt in C aesthetic with mono category line and source dot"
```

---

## Task 7: WorkflowGrid — use FilterBar, card-as-link, result count, empty state

**Files:**
- Modify: `site/src/components/WorkflowGrid.tsx`

- [ ] **Step 1: Rewrite WorkflowGrid.tsx**

Replace entire content:

```tsx
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
```

- [ ] **Step 2: Run tests**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run 2>&1 | tail -10
```

Expected: FilterBar tests pass. If any other tests fail, they're addressed later (likely in WorkflowDetail task).

- [ ] **Step 3: Start dev server and manually verify**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run dev -- --port 3210 &
sleep 4
curl -s http://localhost:3210 | grep -c "Search " | head -1
kill %1 2>/dev/null
```

Expected: ≥1 (search placeholder renders).

- [ ] **Step 4: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/WorkflowGrid.tsx && git commit -m "feat(home): WorkflowGrid uses FilterBar with skill + clear-all filters"
```

---

## Task 8: Remove CategoryFilter (now inside FilterBar)

**Files:**
- Delete: `site/src/components/CategoryFilter.tsx`

- [ ] **Step 1: Verify no other references**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && grep -rn "CategoryFilter" src/ 2>&1
```

Expected: no matches (WorkflowGrid now imports FilterBar, not CategoryFilter).

- [ ] **Step 2: Delete file**

Run:
```bash
rm /Users/nate/src/swenyai/marketplace/site/src/components/CategoryFilter.tsx
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add -A site/src/components/CategoryFilter.tsx && git commit -m "chore: remove CategoryFilter (subsumed by FilterBar)"
```

---

## Task 9: InstallCommand component — hero copy-to-clipboard with feedback

**Files:**
- Create: `site/src/components/InstallCommand.tsx`
- Create: `site/src/__tests__/InstallCommand.test.tsx`

- [ ] **Step 1: Write failing test**

Create `site/src/__tests__/InstallCommand.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallCommand } from "@/components/InstallCommand";

describe("InstallCommand", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the npx command with workflow id", () => {
    render(<InstallCommand workflowId="pr-review-bot" />);
    expect(screen.getByText(/npx sweny new pr-review-bot/)).toBeInTheDocument();
  });

  it("shows 'copied ✓' feedback after clicking copy", async () => {
    const user = userEvent.setup();
    render(<InstallCommand workflowId="pr-review-bot" />);
    const button = screen.getByRole("button", { name: /copy install command/i });
    await user.click(button);
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("writes the command to clipboard on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const user = userEvent.setup();
    render(<InstallCommand workflowId="pr-review-bot" />);
    await user.click(screen.getByRole("button", { name: /copy install command/i }));
    expect(writeText).toHaveBeenCalledWith("npx sweny new pr-review-bot");
  });
});
```

- [ ] **Step 2: Run test — confirm failure**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/InstallCommand.test.tsx 2>&1 | tail -10
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create InstallCommand.tsx**

```tsx
"use client";

import { useState } from "react";

interface InstallCommandProps {
  workflowId: string;
}

export function InstallCommand({ workflowId }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const command = `npx sweny new ${workflowId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silent fallback
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-md p-3 flex items-center justify-between gap-3 font-mono text-[13px]">
      <code className="text-text overflow-x-auto whitespace-nowrap flex-1">
        <span className="text-accent">$ </span>
        {command}
      </code>
      <button
        onClick={handleCopy}
        aria-label="Copy install command"
        className="flex-shrink-0 text-[10px] text-text-dim hover:text-text uppercase tracking-wider font-sans font-medium transition min-h-[32px] px-2 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {copied ? (
          <span className="text-accent">copied ✓</span>
        ) : (
          <span>copy</span>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/InstallCommand.test.tsx 2>&1 | tail -10
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/InstallCommand.tsx site/src/__tests__/InstallCommand.test.tsx && git commit -m "feat(detail): InstallCommand hero block with copy feedback"
```

---

## Task 10: EnvVarList component — required default, optional collapsible

**Files:**
- Create: `site/src/components/EnvVarList.tsx`
- Create: `site/src/__tests__/EnvVarList.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnvVarList } from "@/components/EnvVarList";
import type { DerivedVariable } from "@/lib/types";

describe("EnvVarList", () => {
  const vars: DerivedVariable[] = [
    { name: "GITHUB_TOKEN", description: "GitHub token", required: true, skill: "github" },
    { name: "SLACK_WEBHOOK_URL", description: "Slack webhook", required: false, skill: "slack" },
    { name: "SLACK_BOT_TOKEN", description: "Slack bot token", required: false, skill: "slack" },
  ];

  it("shows required vars by default", () => {
    render(<EnvVarList variables={vars} />);
    expect(screen.getByText("GITHUB_TOKEN")).toBeInTheDocument();
    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("hides optional vars behind a Show button", () => {
    render(<EnvVarList variables={vars} />);
    expect(screen.queryByText("SLACK_WEBHOOK_URL")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show optional/i })).toBeInTheDocument();
  });

  it("reveals optional vars when Show clicked", async () => {
    const user = userEvent.setup();
    render(<EnvVarList variables={vars} />);
    await user.click(screen.getByRole("button", { name: /show optional/i }));
    expect(screen.getByText("SLACK_WEBHOOK_URL")).toBeInTheDocument();
    expect(screen.getByText("SLACK_BOT_TOKEN")).toBeInTheDocument();
  });

  it("does not render Show button when no optional vars exist", () => {
    const requiredOnly = vars.filter((v) => v.required);
    render(<EnvVarList variables={requiredOnly} />);
    expect(screen.queryByRole("button", { name: /show optional/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — confirm failure**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/EnvVarList.test.tsx 2>&1 | tail -10
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create EnvVarList.tsx**

```tsx
"use client";

import { useState } from "react";
import type { DerivedVariable } from "@/lib/types";

interface EnvVarListProps {
  variables: DerivedVariable[];
}

export function EnvVarList({ variables }: EnvVarListProps) {
  const [showOptional, setShowOptional] = useState(false);
  const required = variables.filter((v) => v.required);
  const optional = variables.filter((v) => !v.required);

  const renderVar = (v: DerivedVariable) => (
    <div
      key={v.name}
      className="bg-surface border border-border rounded-md p-3"
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <code className="font-mono text-[12px] text-text font-medium">{v.name}</code>
        {v.required ? (
          <span className="text-[10px] text-accent bg-accent-bg px-1.5 py-0.5 rounded font-medium tracking-wide">
            required
          </span>
        ) : (
          <span className="text-[10px] text-text-dim bg-surface-2 border border-border px-1.5 py-0.5 rounded font-medium tracking-wide">
            optional
          </span>
        )}
        <span className="text-[10px] text-text-dim font-mono ml-auto">{v.skill}</span>
      </div>
      <p className="text-[12px] text-text-muted leading-relaxed">{v.description}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {required.map(renderVar)}
      {showOptional && optional.map(renderVar)}
      {optional.length > 0 && !showOptional && (
        <button
          onClick={() => setShowOptional(true)}
          className="w-full text-left text-[12px] text-text-muted hover:text-text transition py-2 px-3 border border-dashed border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show optional ({optional.length}) ⌄
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test — confirm pass**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/EnvVarList.test.tsx 2>&1 | tail -10
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/EnvVarList.tsx site/src/__tests__/EnvVarList.test.tsx && git commit -m "feat(detail): EnvVarList with collapsible optional section"
```

---

## Task 11: SampleOutput component — Shiki syntax highlighting

**Files:**
- Create: `site/src/components/SampleOutput.tsx`

- [ ] **Step 1: Create SampleOutput.tsx**

```tsx
import { codeToHtml } from "shiki";

interface SampleOutputProps {
  output: string;
  language?: string;
}

/**
 * Renders sample output as syntax-highlighted HTML.
 * SSR: this is a server component — Shiki runs at build time during SSG.
 */
export async function SampleOutput({ output, language = "markdown" }: SampleOutputProps) {
  const html = await codeToHtml(output, {
    lang: language,
    theme: "vitesse-dark",
  });

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="text-[10px] text-text-dim tracking-wider uppercase font-medium px-4 py-2 border-b border-border bg-surface-2">
        Example workflow output
      </div>
      <div
        className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:overflow-x-auto [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify import resolves**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx tsc --noEmit 2>&1 | grep -E "SampleOutput|shiki" | head -5
```

Expected: no errors (empty output).

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/SampleOutput.tsx && git commit -m "feat(detail): SampleOutput with Shiki syntax highlighting"
```

---

## Task 12: DagModal component — full-screen with pan/zoom and URL deep-link

**Files:**
- Create: `site/src/components/DagModal.tsx`
- Create: `site/src/__tests__/DagModal.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DagModal } from "@/components/DagModal";
import type { Workflow } from "@sweny-ai/core";

// Stub the real DagViewer — react-flow needs a real DOM environment
vi.mock("@/components/DagViewer", () => ({
  default: () => <div data-testid="dag-viewer-stub" />,
}));

describe("DagModal", () => {
  const workflow: Workflow = {
    id: "test",
    name: "Test",
    description: "test",
    entry: "a",
    nodes: { a: { name: "A", instruction: "do a", skills: [] } },
    edges: [],
  };

  it("does not render when open is false", () => {
    render(<DagModal open={false} onClose={vi.fn()} workflow={workflow} />);
    expect(screen.queryByTestId("dag-viewer-stub")).not.toBeInTheDocument();
  });

  it("renders the DAG when open is true", () => {
    render(<DagModal open={true} onClose={vi.fn()} workflow={workflow} />);
    expect(screen.getByTestId("dag-viewer-stub")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key pressed", async () => {
    const onClose = vi.fn();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test — confirm failure**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/DagModal.test.tsx 2>&1 | tail -10
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create DagModal.tsx**

```tsx
"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { Workflow } from "@sweny-ai/core";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-dim text-sm">
      Loading DAG…
    </div>
  ),
});

interface DagModalProps {
  open: boolean;
  onClose: () => void;
  workflow: Workflow;
}

export function DagModal({ open, onClose, workflow }: DagModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Workflow graph"
    >
      <div className="flex justify-between items-center px-4 md:px-6 py-3 border-b border-border flex-shrink-0">
        <div className="font-mono text-[11px] text-accent">
          // {workflow.id} · workflow graph
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-dim hover:text-text text-xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ×
        </button>
      </div>
      <div className="flex-1 marketplace-dag dag-host">
        <DagViewer workflow={workflow} height="100%" nodeWidth={200} nodeHeight={70} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — confirm pass**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/DagModal.test.tsx 2>&1 | tail -10
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/DagModal.tsx site/src/__tests__/DagModal.test.tsx && git commit -m "feat(detail): DagModal full-screen viewer with ESC/close handling"
```

---

## Task 13: WorkflowDetail rewrite — side-by-side with sticky DAG, mobile CTA

**Files:**
- Modify: `site/src/components/WorkflowDetail.tsx`
- Modify: `site/src/__tests__/workflow-detail.test.tsx`

- [ ] **Step 1: Rewrite WorkflowDetail.tsx**

```tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { MarketplaceWorkflow } from "@/lib/types";
import { InstallCommand } from "./InstallCommand";
import { EnvVarList } from "./EnvVarList";
import { DagModal } from "./DagModal";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-dim text-sm">
      Loading DAG…
    </div>
  ),
});

interface WorkflowDetailProps {
  workflow: MarketplaceWorkflow;
  sampleOutputHtml?: string;
}

export function WorkflowDetail({ workflow, sampleOutputHtml }: WorkflowDetailProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  const coreWorkflow = useMemo(
    () => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      entry: workflow.entry,
      nodes: workflow.nodes,
      edges: workflow.edges,
    }),
    [workflow]
  );

  // Deep-link support: ?view=graph opens modal on mount
  useEffect(() => {
    setModalOpen(searchParams.get("view") === "graph");
  }, [searchParams]);

  const openModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "graph");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-6 lg:gap-10">
        {/* LEFT COLUMN — info */}
        <div className="space-y-5">
          <div>
            <div className="font-mono text-[11px] text-accent mb-2 tracking-wide">
              // {workflow.source} · {workflow.category} · v{workflow.version}
            </div>
            <h1 className="text-2xl md:text-[28px] font-medium tracking-tight text-text leading-tight mb-2">
              {workflow.name}
            </h1>
            <p className="text-[14px] text-text-muted leading-relaxed">
              {workflow.description}
            </p>
          </div>

          <InstallCommand workflowId={workflow.id} />

          <div>
            <h2 className="text-[11px] font-semibold text-text-dim uppercase tracking-[0.12em] mb-3">
              Environment variables
            </h2>
            <EnvVarList variables={workflow.derivedVariables} />
          </div>

          <div className="flex gap-3 items-center text-[11px] text-text-dim pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block w-[5px] h-[5px] rounded-full ${
                  workflow.source === "official" ? "bg-accent" : "bg-text-dim"
                }`}
              />
              <span className="text-text-muted">{workflow.author}</span>
            </span>
            <span className="text-border">·</span>
            <span className="font-mono">{workflow.nodeCount} nodes</span>
            <span className="text-border">·</span>
            <span className="font-mono">{workflow.edgeCount} edges</span>
          </div>

          {sampleOutputHtml && (
            <div
              className="bg-surface border border-border rounded-md overflow-hidden"
            >
              <div className="text-[10px] text-text-dim tracking-wider uppercase font-medium px-4 py-2 border-b border-border bg-surface-2">
                Example workflow output
              </div>
              <div
                className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:overflow-x-auto [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: sampleOutputHtml }}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — DAG (desktop) / CTA (mobile) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="lg:hidden">
            <button
              onClick={openModal}
              className="w-full min-h-[48px] bg-accent-bg border border-accent-border text-accent rounded-md flex items-center justify-center gap-2 text-sm font-medium transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="font-mono">⤢</span>
              <span>View workflow graph</span>
            </button>
          </div>
          <div className="hidden lg:block card-atmosphere rounded-lg overflow-hidden marketplace-dag dag-host relative" style={{ height: "calc(100vh - 180px)", minHeight: 480 }}>
            <button
              onClick={openModal}
              className="absolute top-3 right-3 z-10 text-[10px] text-accent bg-accent-bg border border-accent-border rounded px-2 py-1 uppercase tracking-wider font-medium hover:bg-accent hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ⤢ expand
            </button>
            <DagViewer workflow={coreWorkflow} height="100%" nodeWidth={200} nodeHeight={70} />
          </div>
        </div>
      </div>

      <DagModal open={modalOpen} onClose={closeModal} workflow={coreWorkflow} />
    </>
  );
}
```

- [ ] **Step 2: Update existing workflow-detail test**

The existing test at `site/src/__tests__/workflow-detail.test.tsx` tests the old shape with tabs. Replace it with a simpler test that matches the new component:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import type { MarketplaceWorkflow } from "@/lib/types";

// Stub dynamic imports for jsdom
vi.mock("@/components/DagViewer", () => ({
  default: () => <div data-testid="dag-viewer-stub" />,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/workflows/test",
}));

const mockWorkflow: MarketplaceWorkflow = {
  id: "test-workflow",
  name: "Test Workflow",
  description: "Does a test.",
  entry: "a",
  nodes: { a: { name: "A", instruction: "do a", skills: ["github"] } },
  edges: [],
  source: "official",
  category: "ops",
  author: "swenyai",
  tags: [],
  version: "1.0.0",
  filePath: "workflows/official/test.yml",
  nodeCount: 1,
  edgeCount: 0,
  skills: ["github"],
  customSkills: {},
  derivedVariables: [
    { name: "GITHUB_TOKEN", description: "GitHub token", required: true, skill: "github" },
    { name: "SLACK_WEBHOOK_URL", description: "Slack webhook", required: false, skill: "slack" },
  ],
};

describe("WorkflowDetail", () => {
  it("renders title, description, and category line", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.getByRole("heading", { name: "Test Workflow" })).toBeInTheDocument();
    expect(screen.getByText(/Does a test/i)).toBeInTheDocument();
    expect(screen.getByText(/official · ops · v1\.0\.0/i)).toBeInTheDocument();
  });

  it("renders the install command", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.getByText(/npx sweny new test-workflow/i)).toBeInTheDocument();
  });

  it("renders required env vars inline", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.getByText("GITHUB_TOKEN")).toBeInTheDocument();
  });

  it("hides optional env vars behind Show button", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.queryByText("SLACK_WEBHOOK_URL")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show optional/i })).toBeInTheDocument();
  });

  it("renders mobile CTA button to view graph", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.getByRole("button", { name: /view workflow graph/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to confirm pass**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run src/__tests__/workflow-detail.test.tsx 2>&1 | tail -15
```

Expected: PASS (5 tests).

- [ ] **Step 4: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/components/WorkflowDetail.tsx site/src/__tests__/workflow-detail.test.tsx && git commit -m "feat(detail): rewrite with side-by-side layout, sticky DAG, mobile CTA"
```

---

## Task 14: Update /workflows/[id]/page.tsx — pre-render sample output HTML

**Files:**
- Modify: `site/src/app/workflows/[id]/page.tsx`

- [ ] **Step 1: Add Shiki pre-rendering**

Replace entire content:

```tsx
import { getAllWorkflows, getWorkflowById } from "@/lib/workflows";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { codeToHtml } from "shiki";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllWorkflows().map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) return {};

  return {
    title: workflow.name,
    description: workflow.description,
    openGraph: {
      title: `${workflow.name} — SWEny Workflow`,
      description: workflow.description,
      images: [`/api/og/workflows/${workflow.id}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/workflows/${workflow.id}`],
    },
  };
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) notFound();

  const sampleOutputHtml = workflow.sampleOutput
    ? await codeToHtml(workflow.sampleOutput, {
        lang: "markdown",
        theme: "vitesse-dark",
      })
    : undefined;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-sm md:text-base font-semibold font-mono flex-shrink-0 tracking-tight">
              SWE<span className="text-accent">ny</span>{" "}
              <span className="text-text-dim font-normal hidden sm:inline">Workflows</span>
            </Link>
            <span className="text-border hidden sm:inline">/</span>
            <span className="text-xs md:text-sm text-text-muted truncate">{workflow.name}</span>
          </div>
          <Link
            href="/"
            className="text-text-muted hover:text-text text-xs md:text-sm flex-shrink-0 whitespace-nowrap min-h-[36px] flex items-center px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <WorkflowDetail workflow={workflow} sampleOutputHtml={sampleOutputHtml} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run build 2>&1 | tail -20
```

Expected: build succeeds. Static pages for each workflow generated. If build fails on Shiki, check import path.

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/workflows/[id]/page.tsx && git commit -m "feat(detail): wider layout, pre-rendered sample output HTML, OG image meta"
```

---

## Task 15: OG image generator route

**Files:**
- Create: `site/src/app/api/og/workflows/[id]/route.tsx`

- [ ] **Step 1: Create route**

```tsx
import { ImageResponse } from "next/og";
import { getWorkflowById } from "@/lib/workflows";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.2), transparent 50%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.12), transparent 50%), #050505",
          padding: "72px",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#3b82f6",
            marginBottom: 20,
            fontFamily: "monospace",
            letterSpacing: "0.02em",
          }}
        >
          // {workflow.source} · {workflow.category}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: 24,
            lineHeight: 1.05,
          }}
        >
          {workflow.name}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            lineHeight: 1.4,
            maxWidth: 960,
          }}
        >
          {workflow.description}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 22,
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#fafafa", fontWeight: 600 }}>SWEny Workflows</span>
          <span>·</span>
          <span>{workflow.nodeCount} nodes</span>
          <span>·</span>
          <span>{workflow.skills.slice(0, 3).join(" · ")}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

- [ ] **Step 2: Build to verify route compiles**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run build 2>&1 | grep -E "og/workflows" | head -3
```

Expected: route appears in build output (e.g. `ƒ /api/og/workflows/[id]`).

- [ ] **Step 3: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/api/og/workflows/[id]/route.tsx && git commit -m "feat(og): per-workflow OG image generator"
```

---

## Task 16: Not-found and error pages

**Files:**
- Create: `site/src/app/not-found.tsx`
- Create: `site/src/app/error.tsx`

- [ ] **Step 1: Create not-found.tsx**

```tsx
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
```

- [ ] **Step 2: Create error.tsx**

```tsx
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
```

- [ ] **Step 3: Build and verify**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/src/app/not-found.tsx site/src/app/error.tsx && git commit -m "feat(polish): themed 404 and 500 pages in C aesthetic"
```

---

## Task 17: Purge residual hardcoded hex values

**Files:**
- Modify: `site/src/components/InstallButton.tsx`
- Modify: `site/src/components/UsageSnippet.tsx`
- Modify: `site/src/components/YamlViewer.tsx`
- Modify: `site/src/components/DagBoundary.tsx`
- Modify: `site/src/components/MiniDag.tsx`
- Modify: `site/src/components/CreatePrompt.tsx`
- Modify: `site/src/components/CreateTabs.tsx`
- Modify: `site/src/components/E2eWizard.tsx`
- Modify: `site/src/components/SubmitFlow.tsx`

- [ ] **Step 1: Find all remaining arbitrary-hex usages**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && grep -rn "\[#[0-9a-fA-F]\{3,8\}\]" src/components src/app 2>&1 | head -40
```

Expected: list of arbitrary-value classes in components. Capture this list — each line is a replacement target.

- [ ] **Step 2: Mechanical replacement with token utilities**

Apply these substitutions across every file listed in Step 1:

| Old class | New class |
|---|---|
| `bg-[#09090b]` | `bg-bg` |
| `bg-[#0c0c14]` / `bg-[#08080f]` | `bg-surface` |
| `bg-[#111]` | `bg-surface` |
| `bg-[#1a1a2e]` | `bg-surface-2` |
| `bg-[#1e1e2e]` | `bg-surface-2` |
| `border-[#1e1e2e]` / `border-[#2a2a3a]` | `border-border` |
| `text-gray-100` | `text-text` |
| `text-gray-300` / `text-gray-400` | `text-text-muted` |
| `text-gray-500` / `text-gray-600` | `text-text-dim` |
| `text-gray-700` | `text-border` |
| `text-blue-400` / `text-blue-500` | `text-accent` |
| `text-blue-600` | `text-accent-hover` |
| `bg-blue-600` / `bg-blue-700` | `bg-accent` |
| `hover:bg-blue-700` | `hover:bg-accent-hover` |
| `bg-blue-950/50` / `bg-blue-950/20` | `bg-accent-bg` |
| `border-blue-900/50` / `border-blue-900/30` | `border-accent-border` |
| `focus:border-blue-600` | `focus:border-accent` |

For each file, open with Read, apply Edit calls for each substitution, repeat. Component-specific colors for category badges (`bg-red-950/50` etc in COLOR_MAP in types.ts) are preserved — those are intentional per-category tinting, not arbitrary chrome.

- [ ] **Step 3: Re-run grep to confirm purge**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && grep -rn "bg-\[#" src/components src/app 2>&1 | head -20
```

Expected: empty (no arbitrary `bg-[#...]` values remain, except possibly in `types.ts` `COLOR_MAP` which is out of scope for this task).

- [ ] **Step 4: Also kill `text-[10px]` / `text-[11px]` arbitrary values**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && grep -rn "text-\[1[01]px\]" src/ 2>&1 | head -20
```

For each match:
- `text-[10px]` → `text-[10px]` is fine but preferably use size from the strict scale. Keep if semantic; otherwise replace with `text-xs` (12px) or keep the 10px for small captions. The goal is consistency: if you see a 10px AND an 11px in the same file, pick one. Use 11px for mono meta, 10px for pills/labels.

This is judgment-heavy; err on the side of keeping 10px/11px and only flag blatant inconsistency (e.g., 10px in one place and 11px in an adjacent spot doing the same thing).

- [ ] **Step 5: Run full test suite**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npx vitest run 2>&1 | tail -15
```

Expected: all tests pass. If any still use hardcoded class assertions that break, update the test to match new classes.

- [ ] **Step 6: Build to verify no Tailwind compile errors**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace && git add site/ && git commit -m "refactor(tokens): replace remaining hardcoded hex with semantic token utilities"
```

---

## Task 18: Final manual verification — run dev and click through

**Files:** None.

- [ ] **Step 1: Start dev server**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm run dev -- --port 3210 &
sleep 5
```

- [ ] **Step 2: Smoke test — homepage**

Run:
```bash
curl -s http://localhost:3210 | grep -Ec "Search 18 workflows|font-mono" | head -1
```

Expected: ≥2 (search placeholder + font-mono class both present).

- [ ] **Step 3: Smoke test — detail page**

Run:
```bash
curl -s http://localhost:3210/workflows/pr-review-bot | grep -Ec "npx sweny new pr-review-bot" | head -1
```

Expected: ≥1 (install command rendered).

- [ ] **Step 4: Smoke test — OG image**

Run:
```bash
curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" http://localhost:3210/api/og/workflows/pr-review-bot
```

Expected: `200 image/png`.

- [ ] **Step 5: Smoke test — 404**

Run:
```bash
curl -s http://localhost:3210/workflows/nonexistent-workflow | grep -c "404 · not found" | head -1
```

Expected: `1`.

- [ ] **Step 6: Kill server**

Run:
```bash
kill %1 2>/dev/null; wait 2>/dev/null; true
```

- [ ] **Step 7: User verification prompt (manual)**

Tell the user to open the dev server in a browser at http://localhost:3210 and verify:
- Homepage: sticky filter bar, ⌘K focuses search, chips show counts, clear-all chip appears with filter
- Cards: gradient atmosphere, source dot (blue for official, gray for community)
- Detail page: side-by-side on desktop, DAG sticky on scroll, install command shows "copied ✓" on click
- Detail page mobile (resize browser to 375px): DAG replaced with "View workflow graph" CTA button
- Click the CTA or the desktop "⤢ expand" button → full-screen modal, ESC closes, URL shows `?view=graph`
- Refresh with `?view=graph` in URL → modal opens on load
- Light theme: enable macOS light mode / DevTools prefers-color-scheme emulation → site flips cleanly
- 404: navigate to `/workflows/nonexistent` → themed 404 page

If any of the above fails, file a follow-up task. Otherwise:

- [ ] **Step 8: Final commit marker**

```bash
cd /Users/nate/src/swenyai/marketplace && git commit --allow-empty -m "chore: marketplace UX elevation complete"
```

---

## Self-review notes (from writing-plans skill)

**Spec coverage:**

| Spec section | Tasks |
|---|---|
| Section 1 · Color tokens | Task 1 |
| Section 1 · Typography (Inter + JetBrains Mono) | Task 2 |
| Section 1 · Card treatment | Task 1 (`.card-atmosphere` class) |
| Section 1 · Spacing | Inherited from Tailwind 4 defaults |
| Section 1 · Scrollbar styling | Task 1 |
| Section 2 · Sticky filter bar, ⌘K | Task 4 |
| Section 2 · Grid meta row | Task 7 |
| Section 2 · Workflow card | Task 6 |
| Section 2 · Responsive grid | Task 7 |
| Section 2 · Empty state | Task 5, 7 |
| Section 3 · Desktop 45/55 split | Task 13 |
| Section 3 · Install command hero | Task 9 |
| Section 3 · Env vars collapsible | Task 10 |
| Section 3 · Sample output markdown | Task 11, 14 |
| Section 3 · Mobile DAG CTA | Task 13 |
| Section 3 · DAG modal w/ deep-link | Task 12, 13 |
| Section 4 · Touch targets ≥44 | Tasks 3, 4, 5, 9, 12, 13, 16 (min-h-[44px] / min-h-[40px] on buttons) |
| Section 4 · Focus-visible rings | Tasks 3, 4, 5, 9, 12, 13, 16 |
| Section 4 · Copy-to-clipboard feedback | Task 9 |
| Section 4 · OG images | Tasks 14, 15 |
| Section 4 · Sample output markdown | Task 11 |
| Section 4 · 404 + 500 pages | Task 16 |
| Section 4 · Font loading (swap) | Task 2 |
| Section 4 · Scrollbar styling | Task 1 |

All sections covered.

**Residual issues addressed in Task 17:** hardcoded hex purge across components not directly rewritten.

**Type consistency:** `MarketplaceWorkflow`, `DerivedVariable`, `Workflow` all come from existing `@/lib/types` / `@sweny-ai/core` — not redefined. `InstallCommand` takes `workflowId: string`. `EnvVarList` takes `variables: DerivedVariable[]`. `DagModal` takes `{ open, onClose, workflow: Workflow }`. `WorkflowDetail` takes `{ workflow: MarketplaceWorkflow, sampleOutputHtml?: string }`. All callers match these shapes.

**Placeholder scan:** no TBDs, no "add error handling," no "similar to task N." Every code block is complete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-marketplace-ux-elevation.md`.

User has already requested **subagent-driven-development** for execution. Proceed via that skill — it dispatches a fresh subagent per task with two-stage review (spec compliance + code quality) after each.
