# Workflow Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public marketplace site at marketplace.sweny.ai where users can browse, search, and create SWEny workflows with interactive DAG visualization and AI-powered generation.

**Architecture:** Next.js 15 App Router deployed to Vercel. Workflow YAML files live in `/workflows/` and are read at build time to generate static pages. The `/create` page uses a streaming API route (Vercel AI Gateway → Claude) to generate workflows from natural language. GitHub OAuth enables fork+PR submission.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, @sweny-ai/core (parsing/validation), @sweny-ai/studio (DAG viewer), Vercel AI SDK, fuse.js (search)

**Repo:** `/Users/nate/src/swenyai/marketplace` — already initialized, pushed to `swenyai/marketplace`

**Vercel Project:** `marketplace-sweny-ai` (prj_1Qqusc9wzuzAodaKHkKyxSoo3GNs), domain `marketplace.sweny.ai` configured

---

## File Structure

```
site/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout: dark theme, Geist font, metadata
│   │   ├── page.tsx                  # Browse page: gallery grid + detail panel
│   │   ├── workflows/[id]/
│   │   │   └── page.tsx              # Permalink: full-page workflow detail
│   │   ├── create/
│   │   │   └── page.tsx              # Create page: AI prompt + Studio editor
│   │   ├── api/generate/
│   │   │   └── route.ts              # AI generation endpoint (streaming)
│   │   └── globals.css               # Tailwind imports
│   ├── components/
│   │   ├── WorkflowCard.tsx          # Gallery card with mini-DAG SVG
│   │   ├── WorkflowGrid.tsx          # Responsive grid + detail panel layout
│   │   ├── WorkflowDetail.tsx        # Detail panel: DAG viewer + tabs + actions
│   │   ├── SearchBar.tsx             # Cmd+K search overlay + inline bar
│   │   ├── CategoryFilter.tsx        # Category pill filter bar
│   │   ├── MiniDag.tsx               # SVG mini-DAG for cards (build-time data)
│   │   ├── CreatePrompt.tsx          # AI natural language input + streaming display
│   │   ├── YamlViewer.tsx            # Syntax-highlighted YAML with copy button
│   │   ├── UsageSnippet.tsx          # GitHub Action YAML generator
│   │   └── SubmitFlow.tsx            # GitHub OAuth + fork + PR submission
│   └── lib/
│       ├── workflows.ts              # Load YAML at build time, build search index
│       ├── search.ts                 # Client-side fuzzy search with fuse.js
│       ├── types.ts                  # MarketplaceWorkflow type (extends Workflow)
│       └── github.ts                 # GitHub API helpers (fork, commit, PR)
├── public/
│   └── og/                           # Generated OG images (build step, later)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 1: Next.js Project Scaffold

**Files:**
- Create: `site/package.json`
- Create: `site/tsconfig.json`
- Create: `site/next.config.ts`
- Create: `site/tailwind.config.ts`
- Create: `site/src/app/globals.css`
- Create: `site/src/app/layout.tsx`
- Create: `site/src/app/page.tsx` (placeholder)

- [ ] **Step 1: Create site/package.json**

```json
{
  "name": "@sweny-ai/marketplace",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.3.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@sweny-ai/core": "latest",
    "@sweny-ai/studio": "latest",
    "@xyflow/react": "^12.6.4",
    "elkjs": "^0.9.3",
    "fuse.js": "^7.1.0",
    "yaml": "^2.7.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.3",
    "@types/node": "^22.15.2",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "tailwindcss": "^4.1.3",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 2: Create site/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create site/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing YAML from the workflows directory above site/
  experimental: {
    serverComponentsExternalPackages: ["yaml"],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create site/tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
};

export default config;
```

- [ ] **Step 5: Create site/postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 6: Create site/src/app/globals.css**

```css
@import "tailwindcss";
```

- [ ] **Step 7: Create site/src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "SWEny Workflows — AI Workflow Marketplace",
    template: "%s | SWEny Workflows",
  },
  description:
    "Discover, share, and create AI-powered workflows for software engineering. Browse community workflows with interactive DAG visualization.",
  metadataBase: new URL("https://marketplace.sweny.ai"),
  openGraph: {
    type: "website",
    siteName: "SWEny Workflows",
    title: "SWEny Workflows — AI Workflow Marketplace",
    description:
      "Discover, share, and create AI-powered workflows for software engineering.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#09090b] text-gray-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

Note: Copy Geist font files from the cloud app (`/Users/nate/src/swenyai/app/src/app/fonts/`) into `site/src/app/fonts/`.

- [ ] **Step 8: Create placeholder site/src/app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">
        SWE<span className="text-blue-500">ny</span>{" "}
        <span className="text-gray-500 font-normal">Workflows</span>
      </h1>
    </main>
  );
}
```

- [ ] **Step 9: Install dependencies and verify dev server starts**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site && npm install
npm run dev
```
Expected: Dev server starts on localhost:3000, shows "SWEny Workflows" heading.

- [ ] **Step 10: Commit**

```bash
cd /Users/nate/src/swenyai/marketplace
git add site/
git commit -m "feat: scaffold Next.js 15 site with Tailwind + dark theme"
```

---

### Task 2: Workflow Data Layer

**Files:**
- Create: `site/src/lib/types.ts`
- Create: `site/src/lib/workflows.ts`

- [ ] **Step 1: Create site/src/lib/types.ts**

```typescript
import type { Workflow } from "@sweny-ai/core";

/** Marketplace-specific metadata that extends the core Workflow type */
export interface MarketplaceMetadata {
  author: string;
  category: Category;
  tags: string[];
  icon?: string;
  color?: CardColor;
  version: string;
  sweny_version?: string;
}

export type Category =
  | "triage"
  | "security"
  | "devops"
  | "code-review"
  | "testing"
  | "content"
  | "ops";

export type CardColor =
  | "blue"
  | "red"
  | "purple"
  | "orange"
  | "green"
  | "yellow"
  | "cyan";

export interface MarketplaceWorkflow extends Workflow, MarketplaceMetadata {
  /** "official" or "community" — derived from file path */
  source: "official" | "community";
  /** Relative path to the YAML file in the repo */
  filePath: string;
  /** Node count (derived) */
  nodeCount: number;
  /** Edge count (derived) */
  edgeCount: number;
  /** Unique skills used across all nodes (derived) */
  skills: string[];
}

export const CATEGORIES: Record<
  Category,
  { label: string; icon: string; color: CardColor }
> = {
  triage: { label: "Triage", icon: "alert-triangle", color: "blue" },
  security: { label: "Security", icon: "shield", color: "red" },
  devops: { label: "DevOps", icon: "server", color: "orange" },
  "code-review": { label: "Code Review", icon: "git-pull-request", color: "purple" },
  testing: { label: "Testing", icon: "check-circle", color: "green" },
  content: { label: "Content", icon: "file-text", color: "yellow" },
  ops: { label: "Ops", icon: "activity", color: "cyan" },
};

export const COLOR_MAP: Record<CardColor, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-950/50", border: "border-blue-800", text: "text-blue-400" },
  red: { bg: "bg-red-950/50", border: "border-red-800", text: "text-red-400" },
  purple: { bg: "bg-purple-950/50", border: "border-purple-800", text: "text-purple-400" },
  orange: { bg: "bg-orange-950/50", border: "border-orange-800", text: "text-orange-400" },
  green: { bg: "bg-green-950/50", border: "border-green-800", text: "text-green-400" },
  yellow: { bg: "bg-yellow-950/50", border: "border-yellow-800", text: "text-yellow-400" },
  cyan: { bg: "bg-cyan-950/50", border: "border-cyan-800", text: "text-cyan-400" },
};
```

- [ ] **Step 2: Create site/src/lib/workflows.ts**

```typescript
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { parseWorkflow, validateWorkflow } from "@sweny-ai/core/schema";
import type { MarketplaceWorkflow, MarketplaceMetadata, Category, CardColor } from "./types";

const WORKFLOWS_DIR = path.resolve(process.cwd(), "../workflows");

const VALID_CATEGORIES = new Set([
  "triage", "security", "devops", "code-review", "testing", "content", "ops",
]);

function readYamlFiles(dir: string, source: "official" | "community"): MarketplaceWorkflow[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  const workflows: MarketplaceWorkflow[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parse(raw);

    try {
      // Validate core workflow fields
      const workflow = parseWorkflow(parsed);
      const errors = validateWorkflow(workflow);
      if (errors.length > 0) {
        console.warn(`Skipping ${file}: ${errors.map((e) => e.message).join(", ")}`);
        continue;
      }

      // Extract marketplace metadata
      const meta: MarketplaceMetadata = {
        author: parsed.author ?? "unknown",
        category: VALID_CATEGORIES.has(parsed.category) ? parsed.category as Category : "ops",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        icon: parsed.icon,
        color: parsed.color as CardColor | undefined,
        version: parsed.version ?? "1.0.0",
        sweny_version: parsed.sweny_version,
      };

      // Derive computed fields
      const allSkills = new Set<string>();
      for (const node of Object.values(workflow.nodes)) {
        for (const skill of node.skills) {
          allSkills.add(skill);
        }
      }

      workflows.push({
        ...workflow,
        ...meta,
        source,
        filePath: `workflows/${source}/${file}`,
        nodeCount: Object.keys(workflow.nodes).length,
        edgeCount: workflow.edges.length,
        skills: [...allSkills],
      });
    } catch (err) {
      console.warn(`Skipping ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return workflows;
}

let cachedWorkflows: MarketplaceWorkflow[] | null = null;

/** Load all workflows from the filesystem. Cached after first call. */
export function getAllWorkflows(): MarketplaceWorkflow[] {
  if (cachedWorkflows) return cachedWorkflows;

  const official = readYamlFiles(path.join(WORKFLOWS_DIR, "official"), "official");
  const community = readYamlFiles(path.join(WORKFLOWS_DIR, "community"), "community");

  // Official first, then community sorted by name
  cachedWorkflows = [
    ...official.sort((a, b) => a.name.localeCompare(b.name)),
    ...community.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return cachedWorkflows;
}

/** Get a single workflow by ID */
export function getWorkflowById(id: string): MarketplaceWorkflow | undefined {
  return getAllWorkflows().find((w) => w.id === id);
}

/** Build a search index for client-side fuzzy search */
export function buildSearchIndex(): Array<{
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  skills: string[];
  source: string;
}> {
  return getAllWorkflows().map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    author: w.author,
    category: w.category,
    tags: w.tags,
    skills: w.skills,
    source: w.source,
  }));
}
```

- [ ] **Step 3: Verify data layer loads workflows**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace/site
node -e "
  const { getAllWorkflows } = await import('./src/lib/workflows.ts');
  const wfs = getAllWorkflows();
  console.log(wfs.length, 'workflows loaded');
  console.log(wfs.map(w => w.id));
"
```

Note: This may need `tsx` to run TS directly. If so: `npx tsx -e "..."`. Expected: 3 workflows (triage, implement, seed-content).

- [ ] **Step 4: Commit**

```bash
git add site/src/lib/
git commit -m "feat: workflow data layer — load + validate YAML at build time"
```

---

### Task 3: Browse Page — Gallery Grid

**Files:**
- Create: `site/src/components/WorkflowCard.tsx`
- Create: `site/src/components/MiniDag.tsx`
- Create: `site/src/components/CategoryFilter.tsx`
- Create: `site/src/components/WorkflowGrid.tsx`
- Modify: `site/src/app/page.tsx`

- [ ] **Step 1: Create site/src/components/MiniDag.tsx**

A lightweight SVG component that renders a simplified DAG from workflow nodes and edges. Used in cards for visual preview.

```tsx
"use client";

import type { MarketplaceWorkflow } from "@/lib/types";
import { COLOR_MAP } from "@/lib/types";

interface MiniDagProps {
  workflow: MarketplaceWorkflow;
  className?: string;
}

export function MiniDag({ workflow, className = "" }: MiniDagProps) {
  const nodes = Object.entries(workflow.nodes);
  const color = workflow.color ?? "blue";
  const { text: textColor } = COLOR_MAP[color];

  // Simple left-to-right layout: assign x by topological order
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    order.push(nodeId);
    for (const edge of workflow.edges) {
      if (edge.from === nodeId) visit(edge.to);
    }
  }
  visit(workflow.entry);
  // Add any unreachable nodes
  for (const [id] of nodes) {
    if (!visited.has(id)) order.push(id);
  }

  const nodeWidth = 48;
  const nodeHeight = 16;
  const gap = 12;
  const svgWidth = order.length * (nodeWidth + gap) - gap + 8;
  const svgHeight = 32;

  const positions = new Map<string, { x: number; y: number }>();
  order.forEach((id, i) => {
    positions.set(id, { x: 4 + i * (nodeWidth + gap), y: 8 });
  });

  return (
    <div className={`bg-[#08080f] rounded-md p-2 ${className}`}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
        {/* Edges */}
        {workflow.edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x + nodeWidth}
              y1={from.y + nodeHeight / 2}
              x2={to.x}
              y2={to.y + nodeHeight / 2}
              stroke="#333"
              strokeWidth="0.8"
            />
          );
        })}
        {/* Nodes */}
        {order.map((id) => {
          const pos = positions.get(id)!;
          const label = id.length > 8 ? id.slice(0, 7) + "…" : id;
          return (
            <g key={id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                rx={3}
                className={`fill-current ${textColor} opacity-20`}
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <text
                x={pos.x + nodeWidth / 2}
                y={pos.y + nodeHeight / 2 + 3}
                className={`${textColor} fill-current`}
                fontSize="5"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Create site/src/components/WorkflowCard.tsx**

```tsx
"use client";

import type { MarketplaceWorkflow } from "@/lib/types";
import { COLOR_MAP, CATEGORIES } from "@/lib/types";
import { MiniDag } from "./MiniDag";

interface WorkflowCardProps {
  workflow: MarketplaceWorkflow;
  selected: boolean;
  onClick: () => void;
}

export function WorkflowCard({ workflow, selected, onClick }: WorkflowCardProps) {
  const color = workflow.color ?? CATEGORIES[workflow.category]?.color ?? "blue";
  const colors = COLOR_MAP[color];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 transition-all border cursor-pointer ${
        selected
          ? `${colors.bg} ${colors.border} border-2`
          : "bg-[#111] border-[#1e1e2e] hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white ${colors.bg} ${colors.border} border`}
        >
          {workflow.name[0]}
        </div>
        <span className="text-sm font-semibold text-gray-100 truncate">
          {workflow.name}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {workflow.description}
      </p>

      {/* Mini DAG */}
      <MiniDag workflow={workflow} className="mb-3" />

      {/* Skill badges */}
      <div className="flex gap-1 flex-wrap mb-2">
        {workflow.skills.map((skill) => (
          <span
            key={skill}
            className="bg-[#0f172a] text-blue-400 px-1.5 py-0.5 rounded text-[10px] border border-blue-900/50"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer: author + badge */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-700" />
          <span className="text-[10px] text-gray-500">{workflow.author}</span>
        </div>
        <span
          className={`text-[9px] font-medium px-2 py-0.5 rounded ${
            workflow.source === "official"
              ? "bg-blue-950/50 text-blue-400"
              : "bg-green-950/50 text-green-400"
          }`}
        >
          {workflow.source === "official" ? "OFFICIAL" : "COMMUNITY"}
        </span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Create site/src/components/CategoryFilter.tsx**

```tsx
"use client";

import { CATEGORIES, type Category } from "@/lib/types";

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (category: Category | null) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
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
```

- [ ] **Step 4: Create site/src/components/WorkflowGrid.tsx**

```tsx
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

  const selected = selectedId
    ? workflows.find((w) => w.id === selectedId) ?? null
    : null;

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
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-[#1a1a2e] px-1.5 py-0.5 rounded border border-[#2a2a3a]">
            ⌘K
          </kbd>
        </div>
        <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
      </div>

      {/* Grid + Detail */}
      <div className={`grid gap-6 ${selected ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Cards */}
        <div className={`grid gap-3 ${selected ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-4"} auto-rows-max`}>
          {filtered.map((w) => (
            <WorkflowCard
              key={w.id}
              workflow={w}
              selected={w.id === selectedId}
              onClick={() =>
                setSelectedId(w.id === selectedId ? null : w.id)
              }
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
          <div className="bg-[#0c0c14] rounded-xl border border-[#1e1e2e] p-6 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-24">
            <WorkflowDetail workflow={selected} />
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="mt-6 flex justify-between items-center text-xs text-gray-600">
        <span>{filtered.length} workflow{filtered.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update site/src/app/page.tsx**

```tsx
import { getAllWorkflows, buildSearchIndex } from "@/lib/workflows";
import { WorkflowGrid } from "@/components/WorkflowGrid";
import Link from "next/link";

export default function Home() {
  const workflows = getAllWorkflows();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-bold font-mono">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Create Workflow
            </Link>
            <a
              href="https://github.com/swenyai/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <WorkflowGrid workflows={workflows} />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Verify browse page renders**

Run: `cd /Users/nate/src/swenyai/marketplace/site && npm run dev`
Expected: Browse page shows 3 official workflow cards with mini-DAGs, search bar, and category pills.

- [ ] **Step 7: Commit**

```bash
git add site/src/
git commit -m "feat: browse page with gallery grid, search, category filters"
```

---

### Task 4: Detail Panel with Studio DAG Viewer

**Files:**
- Create: `site/src/components/WorkflowDetail.tsx`
- Create: `site/src/components/YamlViewer.tsx`
- Create: `site/src/components/UsageSnippet.tsx`

- [ ] **Step 1: Create site/src/components/YamlViewer.tsx**

```tsx
"use client";

import { useState } from "react";

interface YamlViewerProps {
  yaml: string;
}

export function YamlViewer({ yaml }: YamlViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-gray-200 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-[#08080f] border border-[#1e1e2e] rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
        {yaml}
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Create site/src/components/UsageSnippet.tsx**

```tsx
"use client";

import { useState } from "react";
import type { MarketplaceWorkflow } from "@/lib/types";

interface UsageSnippetProps {
  workflow: MarketplaceWorkflow;
}

export function UsageSnippet({ workflow }: UsageSnippetProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `name: SWEny ${workflow.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sweny:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: swenyai/sweny@v4
        with:
          sweny-workflow: |
            ${workflow.id}
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Add this to <code className="text-gray-400">.github/workflows/sweny.yml</code>:
      </p>
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-gray-200 transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="bg-[#08080f] border border-[#1e1e2e] rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create site/src/components/WorkflowDetail.tsx**

```tsx
"use client";

import { useState, useMemo } from "react";
import { WorkflowViewer } from "@sweny-ai/studio/viewer";
import "@sweny-ai/studio/style.css";
import type { MarketplaceWorkflow } from "@/lib/types";
import { COLOR_MAP, CATEGORIES } from "@/lib/types";
import { YamlViewer } from "./YamlViewer";
import { UsageSnippet } from "./UsageSnippet";
import { stringify } from "yaml";

type Tab = "skills" | "yaml" | "usage";

interface WorkflowDetailProps {
  workflow: MarketplaceWorkflow;
}

export function WorkflowDetail({ workflow }: WorkflowDetailProps) {
  const [tab, setTab] = useState<Tab>("skills");
  const color = workflow.color ?? CATEGORIES[workflow.category]?.color ?? "blue";
  const colors = COLOR_MAP[color];

  // Build a clean workflow object for the viewer (strip marketplace metadata)
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

  // Reconstruct YAML from the workflow for display
  const yamlString = useMemo(() => stringify(workflow), [workflow]);

  // Collect unique skills with which nodes use them
  const skillNodes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [nodeId, node] of Object.entries(workflow.nodes)) {
      for (const skill of node.skills) {
        const arr = map.get(skill) ?? [];
        arr.push(nodeId);
        map.set(skill, arr);
      }
    }
    return map;
  }, [workflow]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${colors.bg} ${colors.border} border`}
          >
            {workflow.name[0]}
          </div>
          <h2 className="text-xl font-bold text-gray-100">{workflow.name}</h2>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded ${
              workflow.source === "official"
                ? "bg-blue-950/50 text-blue-400"
                : "bg-green-950/50 text-green-400"
            }`}
          >
            {workflow.source === "official" ? "OFFICIAL" : "COMMUNITY"}
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {workflow.description}
        </p>
      </div>

      {/* Meta bar */}
      <div className="flex gap-4 items-center mb-4 px-3 py-2 bg-[#111] rounded-lg border border-[#1e1e2e] text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-700" />
          <span>{workflow.author}</span>
        </div>
        <span className="text-gray-700">|</span>
        <span>{workflow.nodeCount} nodes</span>
        <span className="text-gray-700">|</span>
        <span>{workflow.edgeCount} edges</span>
        <span className="text-gray-700">|</span>
        <span>v{workflow.version}</span>
      </div>

      {/* Interactive DAG */}
      <div className="bg-[#08080f] border border-[#1e1e2e] rounded-xl mb-4 overflow-hidden">
        <WorkflowViewer workflow={coreWorkflow} height={280} showMiniMap={false} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e1e2e] mb-4">
        {(["skills", "yaml", "usage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium transition ${
              tab === t
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "skills"
              ? "Skills Required"
              : t === "yaml"
                ? "YAML Source"
                : "Usage"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "skills" && (
        <div className="grid grid-cols-2 gap-2">
          {[...skillNodes.entries()].map(([skill, nodes]) => (
            <div
              key={skill}
              className="bg-[#111] border border-[#1e1e2e] rounded-lg p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-200 font-medium capitalize">
                  {skill}
                </span>
              </div>
              <span className="text-[10px] text-gray-600">
                Used in: {nodes.join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}
      {tab === "yaml" && <YamlViewer yaml={yamlString} />}
      {tab === "usage" && <UsageSnippet workflow={workflow} />}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setTab("usage")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Use This Workflow
        </button>
        <a
          href={`/create?fork=${workflow.id}`}
          className="flex-1 bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-4 py-2.5 rounded-lg text-sm font-medium text-center transition"
        >
          Fork & Edit
        </a>
        <a
          href={`https://github.com/swenyai/marketplace/blob/main/${workflow.filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111] hover:bg-[#1a1a2e] text-gray-300 border border-[#2a2a3a] px-3 py-2.5 rounded-lg text-sm transition"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify detail panel renders with Studio DAG**

Run: `npm run dev`
Expected: Click a card → detail panel slides in with interactive DAG viewer (pannable, zoomable), tabs work (Skills / YAML / Usage), action buttons present.

- [ ] **Step 5: Commit**

```bash
git add site/src/components/
git commit -m "feat: detail panel with Studio DAG viewer, YAML display, usage snippet"
```

---

### Task 5: Workflow Permalink Page

**Files:**
- Create: `site/src/app/workflows/[id]/page.tsx`

- [ ] **Step 1: Create site/src/app/workflows/[id]/page.tsx**

```tsx
import { getAllWorkflows, getWorkflowById } from "@/lib/workflows";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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
    },
  };
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) notFound();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-bold font-mono">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm text-gray-400">{workflow.name}</span>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <WorkflowDetail workflow={workflow} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify permalink renders**

Run: Navigate to `http://localhost:3000/workflows/triage`
Expected: Full-page detail view of the triage workflow with DAG, tabs, and actions.

- [ ] **Step 3: Commit**

```bash
git add site/src/app/workflows/
git commit -m "feat: workflow permalink pages with SEO metadata"
```

---

### Task 6: AI Generation Endpoint

**Files:**
- Create: `site/src/app/api/generate/route.ts`

- [ ] **Step 1: Create the AI generation API route**

```typescript
import { builtinSkills, workflowJsonSchema } from "@sweny-ai/core";
import { parseWorkflow, validateWorkflow } from "@sweny-ai/core/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now >= entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) {
    return Response.json(
      { error: "Rate limited. Try again in an hour." },
      { status: 429 }
    );
  }

  const { prompt, existingWorkflow } = await request.json();
  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return Response.json({ error: "Invalid prompt" }, { status: 400 });
  }

  const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
  if (!token) {
    return Response.json({ error: "AI not configured" }, { status: 500 });
  }

  // Build system prompt with workflow schema and skill catalog
  const skillList = builtinSkills
    .map((s) => `- ${s.id}: ${s.description}`)
    .join("\n");
  const systemPrompt = [
    "You generate SWEny workflow definitions as YAML.",
    "",
    "## Workflow JSON Schema",
    "```json",
    JSON.stringify(workflowJsonSchema, null, 2),
    "```",
    "",
    "## Available Skills",
    skillList,
    "",
    "## Rules",
    "- Every workflow needs: id, name, description, entry, nodes, edges",
    "- Node instructions should be detailed and specific",
    "- Use only skills from the Available Skills list above",
    "- Include marketplace metadata: author, category, tags, version",
  ].join("\n");

  const userMessage = existingWorkflow
    ? `Refine this existing workflow based on the following instruction:\n\nInstruction: ${prompt}\n\nExisting workflow:\n\`\`\`yaml\n${existingWorkflow}\n\`\`\``
    : `Create a SWEny workflow for the following description:\n\n${prompt}\n\nInclude marketplace metadata fields: author (use "community"), category, tags, version (use "1.0.0"), icon, and color.`;

  // Stream from Vercel AI Gateway
  const response = await fetch("https://ai-gateway.vercel.sh/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      stream: true,
      system: systemPrompt + "\n\nRespond with ONLY the YAML workflow definition. No markdown fences, no explanation, just the raw YAML.",
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("AI Gateway error:", err);
    return Response.json({ error: "AI generation failed" }, { status: 502 });
  }

  // Transform Anthropic SSE stream to our format
  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.text) {
                const text = event.delta.text;
                fullText += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "token", content: text })}\n\n`)
                );
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }

        // Validate the complete workflow
        let valid = false;
        let errors: string[] = [];
        try {
          // Dynamic import yaml since it's a server dep
          const { parse } = await import("yaml");
          const parsed = parse(fullText);
          const workflow = parseWorkflow(parsed);
          const validationErrors = validateWorkflow(workflow);
          if (validationErrors.length === 0) {
            valid = true;
          } else {
            errors = validationErrors.map((e) => e.message);
          }
        } catch (err) {
          errors = [err instanceof Error ? err.message : "Parse error"];
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "complete", yaml: fullText, valid, errors })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

Note: `buildSystemPrompt` is NOT exported from `@sweny-ai/core` — the system prompt is constructed inline using `workflowJsonSchema` and `builtinSkills` which ARE exported.

- [ ] **Step 2: Verify the endpoint responds**

Run:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "scan for TODO comments and create issues"}' \
  --no-buffer
```
Expected: SSE stream of tokens followed by a `complete` event with valid YAML.

- [ ] **Step 3: Commit**

```bash
git add site/src/app/api/
git commit -m "feat: AI generation endpoint with Vercel AI Gateway streaming"
```

---

### Task 7: Create Page — AI Prompt + Live Preview

**Files:**
- Create: `site/src/components/CreatePrompt.tsx`
- Create: `site/src/app/create/page.tsx`

- [ ] **Step 1: Create site/src/components/CreatePrompt.tsx**

```tsx
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { WorkflowViewer } from "@sweny-ai/studio/viewer";
import "@sweny-ai/studio/style.css";
import { parse } from "yaml";
import { YamlViewer } from "./YamlViewer";

const EXAMPLE_PROMPTS = [
  "Scan dependencies for security vulnerabilities and create issues for critical CVEs",
  "Auto-review pull requests for code style, test coverage, and breaking changes",
  "Monitor Sentry for new errors, investigate root cause, and create Linear issues",
  "Generate API documentation from code comments and push to the docs site",
  "Run pre-deploy checks: migration safety, env drift, rollback readiness",
];

export function CreatePrompt() {
  const [prompt, setPrompt] = useState("");
  const [yaml, setYaml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const workflow = useMemo(() => {
    if (!yaml) return null;
    try {
      const parsed = parse(yaml);
      if (parsed?.id && parsed?.nodes && parsed?.edges && parsed?.entry) {
        return {
          id: parsed.id,
          name: parsed.name ?? parsed.id,
          description: parsed.description ?? "",
          entry: parsed.entry,
          nodes: parsed.nodes,
          edges: parsed.edges,
        };
      }
    } catch {
      // YAML not yet parseable
    }
    return null;
  }, [yaml]);

  const generate = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setGenerating(true);
      setValid(null);
      setErrors([]);
      setYaml("");

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            existingWorkflow: yaml || null,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          setErrors([err.error ?? "Generation failed"]);
          setGenerating(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "token") {
                setYaml((prev) => prev + event.content);
              } else if (event.type === "complete") {
                setValid(event.valid);
                setErrors(event.errors ?? []);
              } else if (event.type === "error") {
                setErrors([event.message]);
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setErrors([err.message]);
        }
      } finally {
        setGenerating(false);
      }
    },
    [yaml]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-120px)]">
      {/* Left: Prompt + YAML output */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what your workflow should do..."
              rows={3}
              className="w-full bg-[#111] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-600 resize-none"
            />
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>

        {/* Example prompts */}
        {!yaml && !generating && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600">Try an example:</p>
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setPrompt(ex);
                  generate(ex);
                }}
                className="block w-full text-left text-xs text-gray-500 hover:text-blue-400 bg-[#111] border border-[#1e1e2e] rounded-lg px-3 py-2 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Validation status */}
        {valid !== null && (
          <div
            className={`text-xs px-3 py-2 rounded-lg ${
              valid
                ? "bg-green-950/30 text-green-400 border border-green-900/50"
                : "bg-red-950/30 text-red-400 border border-red-900/50"
            }`}
          >
            {valid
              ? "Workflow is valid"
              : `Validation errors: ${errors.join(", ")}`}
          </div>
        )}

        {/* YAML output */}
        {yaml && <YamlViewer yaml={yaml} />}
      </div>

      {/* Right: Live DAG preview */}
      <div className="bg-[#08080f] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {workflow ? (
          <WorkflowViewer workflow={workflow} height="100%" showMiniMap={false} />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-gray-600 text-sm">
            {generating
              ? "Building DAG..."
              : "DAG preview will appear here"}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create site/src/app/create/page.tsx**

```tsx
import { CreatePrompt } from "@/components/CreatePrompt";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Workflow",
  description: "Create a new SWEny workflow using AI or the visual editor",
};

export default function CreatePage() {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-bold font-mono">
              SWE<span className="text-blue-500">ny</span>{" "}
              <span className="text-gray-500 font-normal">Workflows</span>
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm text-gray-400">Create</span>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            Browse All
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create a Workflow</h1>
          <p className="text-gray-400 text-sm mt-1">
            Describe what you want in plain English. AI generates the workflow,
            you refine it, then submit to the marketplace.
          </p>
        </div>
        <CreatePrompt />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify create flow works**

Run: Navigate to `http://localhost:3000/create`, type "scan for TODO comments and create GitHub issues", click Generate.
Expected: YAML streams in on the left, DAG builds in real-time on the right.

- [ ] **Step 4: Commit**

```bash
git add site/src/
git commit -m "feat: create page with AI-powered workflow generation + live DAG preview"
```

---

### Task 8: GitHub Submit Flow

**Files:**
- Create: `site/src/lib/github.ts`
- Create: `site/src/components/SubmitFlow.tsx`
- Modify: `site/src/components/CreatePrompt.tsx` — add submit button

- [ ] **Step 1: Create site/src/lib/github.ts**

```typescript
const REPO_OWNER = "swenyai";
const REPO_NAME = "marketplace";

/** Fork the marketplace repo (idempotent — returns existing fork if already forked) */
export async function forkRepo(token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/forks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok && res.status !== 202) {
    throw new Error(`Fork failed: ${res.status}`);
  }

  const fork = await res.json();
  return fork.full_name; // e.g. "alice/marketplace"
}

/** Create a branch, commit a file, and open a PR */
export async function submitWorkflow(
  token: string,
  forkFullName: string,
  workflowId: string,
  workflowYaml: string,
  workflowName: string
): Promise<string> {
  const [owner] = forkFullName.split("/");
  const branch = `add-${workflowId}`;
  const filePath = `workflows/community/${workflowId}.yml`;

  // Get the default branch SHA
  const mainRef = await fetch(
    `https://api.github.com/repos/${forkFullName}/git/ref/heads/main`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  const mainData = await mainRef.json();
  const sha = mainData.object.sha;

  // Create branch
  await fetch(`https://api.github.com/repos/${forkFullName}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });

  // Create/update file
  await fetch(
    `https://api.github.com/repos/${forkFullName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add workflow: ${workflowName}`,
        content: btoa(unescape(encodeURIComponent(workflowYaml))),
        branch,
      }),
    }
  );

  // Open PR
  const prRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `Add: ${workflowName}`,
        body: `## New Workflow: ${workflowName}\n\nSubmitted via [marketplace.sweny.ai/create](https://marketplace.sweny.ai/create).\n\nPlease review the workflow YAML and DAG for correctness.`,
        head: `${owner}:${branch}`,
        base: "main",
      }),
    }
  );

  if (!prRes.ok) {
    const err = await prRes.json();
    throw new Error(err.message ?? "Failed to create PR");
  }

  const pr = await prRes.json();
  return pr.html_url;
}
```

- [ ] **Step 2: Create site/src/components/SubmitFlow.tsx**

```tsx
"use client";

import { useState } from "react";
import { forkRepo, submitWorkflow } from "@/lib/github";

interface SubmitFlowProps {
  workflowId: string;
  workflowYaml: string;
  workflowName: string;
  disabled?: boolean;
}

export function SubmitFlow({
  workflowId,
  workflowYaml,
  workflowName,
  disabled,
}: SubmitFlowProps) {
  const [status, setStatus] = useState<
    "idle" | "authenticating" | "submitting" | "done" | "error"
  >("idle");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus("authenticating");
    setError(null);

    // For now, prompt for a GitHub PAT
    // TODO: Replace with proper GitHub OAuth flow
    const token = window.prompt(
      "Enter a GitHub Personal Access Token (with repo scope) to submit your workflow:"
    );
    if (!token) {
      setStatus("idle");
      return;
    }

    try {
      setStatus("submitting");
      const forkName = await forkRepo(token);

      // Wait a moment for GitHub to process the fork
      await new Promise((r) => setTimeout(r, 2000));

      const url = await submitWorkflow(
        token,
        forkName,
        workflowId,
        workflowYaml,
        workflowName
      );
      setPrUrl(url);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStatus("error");
    }
  };

  if (status === "done" && prUrl) {
    return (
      <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-4 text-center">
        <p className="text-green-400 font-medium mb-2">PR created!</p>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          View on GitHub →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubmit}
        disabled={disabled || status === "submitting" || status === "authenticating"}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
      >
        {status === "authenticating"
          ? "Authenticating..."
          : status === "submitting"
            ? "Creating PR..."
            : "Submit to Marketplace"}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add SubmitFlow to CreatePrompt**

Add the SubmitFlow component below the action buttons in CreatePrompt.tsx. Import `SubmitFlow` and render it when `yaml` is non-empty and `valid` is true:

```tsx
// Add to CreatePrompt.tsx, below the YamlViewer:
{valid && yaml && (
  <SubmitFlow
    workflowId={workflow?.id ?? "new-workflow"}
    workflowYaml={yaml}
    workflowName={workflow?.name ?? "New Workflow"}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add site/src/
git commit -m "feat: GitHub submit flow — fork repo + commit YAML + open PR"
```

---

### Task 9: CI Validation Pipeline

**Files:**
- Create: `scripts/validate.mjs`
- Create: `scripts/check-unique-ids.mjs`
- Create: `.github/workflows/validate.yml`

- [ ] **Step 1: Create scripts/validate.mjs**

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// Dynamic import for @sweny-ai/core (ESM)
const { parseWorkflow, validateWorkflow } = await import("@sweny-ai/core/schema");

const VALID_CATEGORIES = new Set([
  "triage", "security", "devops", "code-review", "testing", "content", "ops",
]);

const dirs = ["workflows/official", "workflows/community"];
let hasErrors = false;

for (const dir of dirs) {
  if (!existsSync(dir)) continue;

  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  for (const file of files) {
    const path = join(dir, file);
    const raw = readFileSync(path, "utf-8");
    const errors = [];

    try {
      const parsed = parse(raw);

      // Validate core workflow
      const workflow = parseWorkflow(parsed);
      const structuralErrors = validateWorkflow(workflow);
      for (const e of structuralErrors) {
        errors.push(`[structure] ${e.message}`);
      }

      // Validate marketplace metadata
      if (!parsed.author) errors.push("[metadata] missing 'author'");
      if (!parsed.category) errors.push("[metadata] missing 'category'");
      else if (!VALID_CATEGORIES.has(parsed.category))
        errors.push(`[metadata] invalid category '${parsed.category}'`);
      if (!parsed.tags || !Array.isArray(parsed.tags) || parsed.tags.length === 0)
        errors.push("[metadata] missing or empty 'tags'");
      if (!parsed.version) errors.push("[metadata] missing 'version'");

      // Validate id format
      if (!/^[a-z0-9-]+$/.test(parsed.id))
        errors.push(`[metadata] id must be lowercase alphanumeric with hyphens: '${parsed.id}'`);
    } catch (e) {
      errors.push(`[parse] ${e.message}`);
    }

    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\n❌ ${path}:`);
      for (const e of errors) console.error(`   ${e}`);
    } else {
      console.log(`✓ ${path}`);
    }
  }
}

if (hasErrors) {
  console.error("\nValidation failed.");
  process.exit(1);
} else {
  console.log("\nAll workflows valid.");
}
```

- [ ] **Step 2: Create scripts/check-unique-ids.mjs**

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dirs = ["workflows/official", "workflows/community"];
const idMap = new Map(); // id → file path
let hasDuplicates = false;

for (const dir of dirs) {
  if (!existsSync(dir)) continue;

  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  for (const file of files) {
    const path = join(dir, file);
    const raw = readFileSync(path, "utf-8");
    try {
      const parsed = parse(raw);
      const id = parsed.id;
      if (idMap.has(id)) {
        hasDuplicates = true;
        console.error(`❌ Duplicate id '${id}': ${idMap.get(id)} and ${path}`);
      } else {
        idMap.set(id, path);
      }
    } catch {
      // Skip unparseable files (validate.mjs will catch these)
    }
  }
}

if (hasDuplicates) {
  console.error("\nDuplicate IDs found.");
  process.exit(1);
} else {
  console.log(`✓ All ${idMap.size} workflow IDs are unique.`);
}
```

- [ ] **Step 3: Create .github/workflows/validate.yml**

```yaml
name: Validate Workflows
on:
  pull_request:
    paths:
      - 'workflows/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: node scripts/validate.mjs
      - run: node scripts/check-unique-ids.mjs
```

- [ ] **Step 4: Add @sweny-ai/core as a root dependency for scripts**

Add to root `package.json`:

```json
{
  "dependencies": {
    "@sweny-ai/core": "latest",
    "yaml": "^2.7.1"
  }
}
```

- [ ] **Step 5: Verify validation works locally**

Run:
```bash
cd /Users/nate/src/swenyai/marketplace
npm install
node scripts/validate.mjs
node scripts/check-unique-ids.mjs
```
Expected: All 3 official workflows pass validation, all IDs unique.

- [ ] **Step 6: Commit**

```bash
git add scripts/ .github/ package.json
git commit -m "feat: CI validation pipeline — validate YAML + check unique IDs on PR"
```

---

### Task 10: Deploy Pipeline + First Deploy

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `site/.gitignore`

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Deploy Marketplace
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: cd site && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: site
```

- [ ] **Step 2: Create site/.gitignore**

```
node_modules/
.next/
.vercel/
```

- [ ] **Step 3: Add GitHub secrets**

Set these secrets on `swenyai/marketplace` via `gh`:

```bash
gh secret set VERCEL_TOKEN --repo swenyai/marketplace
gh secret set VERCEL_ORG_ID --repo swenyai/marketplace --body "team_q73iqEacPA0Mtx3VrYkvZyo0"
gh secret set VERCEL_PROJECT_ID --repo swenyai/marketplace --body "prj_1Qqusc9wzuzAodaKHkKyxSoo3GNs"
```

- [ ] **Step 4: Commit and push everything**

```bash
git add -A
git commit -m "feat: deploy pipeline + first deploy to marketplace.sweny.ai"
git push origin main
```

- [ ] **Step 5: Verify deployment**

Check: `https://marketplace.sweny.ai` loads the browse page with 3 official workflow cards.

---

### Task 11: Seed Community Workflows (AI-Generated)

**Files:**
- Create: `workflows/community/security-audit.yml`
- Create: `workflows/community/pr-review-bot.yml`
- Create: `workflows/community/deploy-guard.yml`
- Create: `workflows/community/test-coverage-check.yml`
- Create: `workflows/community/changelog-generator.yml`

- [ ] **Step 1: Generate seed workflows using the create endpoint**

Use the deployed `/api/generate` endpoint (or local dev server) to generate 5 community workflows. For each, call:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "<description>"}' --no-buffer
```

Descriptions:
1. "Scan project dependencies for known CVEs and security vulnerabilities, check for OWASP top 10 issues in code, generate a security report, and create issues for critical findings"
2. "Automatically review pull requests for code style violations, missing tests, documentation gaps, and breaking API changes, then post a summary comment"
3. "Run pre-deployment checks including database migration safety, environment variable drift detection, and rollback readiness verification"
4. "Analyze test coverage across the codebase, identify untested critical paths, and generate test stubs for uncovered functions"
5. "Generate a changelog from recent commits and merged PRs, categorize changes by type, and create a draft release"

- [ ] **Step 2: Save and validate each generated workflow**

Save the output YAML to the appropriate file path. Ensure each has correct marketplace metadata (author: "sweny-ai", appropriate category, tags, etc.). Run:

```bash
node scripts/validate.mjs
node scripts/check-unique-ids.mjs
```

Expected: All workflows pass.

- [ ] **Step 3: Commit and push**

```bash
git add workflows/community/
git commit -m "feat: seed 5 community workflows (AI-generated)"
git push origin main
```

---
