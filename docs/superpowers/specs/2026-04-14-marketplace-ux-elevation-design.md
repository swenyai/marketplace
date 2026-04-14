# Marketplace UX Elevation — Design Spec

**Status:** Draft · 2026-04-14
**Goal:** Elevate marketplace.sweny.ai from "good" to Linear/Vercel/Stripe-tier premium polish without changing the underlying information architecture.

## Context

The marketplace is a Next.js SSG site at `marketplace.sweny.ai` that catalogs SWEny workflows (official + community YAML files). Visitors browse, click into a detail page, and copy a `npx sweny new <id>` command to install locally. The bones are right. The surface isn't.

### Answered questions (brainstorm)

- **Vision:** Premium tool, taken seriously. Linear / Vercel / Stripe energy.
- **Primary conversion:** Copy the `npx` install command and run it locally. Marketplace is a discovery funnel for the OSS CLI, not a cloud signup page.
- **Primary pain point:** Doesn't feel premium enough. Visual craft is the gap.
- **Aesthetic direction:** Dark Luxury (Direction C in brainstorm) — deep blacks, gradient atmospheres, monospace accents signalling "developer tool," surgical use of one accent color. Install command treated as a hero element.
- **Theming:** Dual theme driven by `prefers-color-scheme`. No manual toggle for v1.
- **Accent color:** Blue — `#3b82f6` in dark, `#2563eb` in light (contrast tuned).
- **DAG on mobile:** Keep side-by-side on desktop; mobile replaces inline DAG with a "View workflow graph" CTA that opens a full-screen modal with pan+zoom. Complex DAGs need dedicated real estate.

## Architecture

The site stays structurally the same (Next.js 14 App Router, SSG, Tailwind). The elevation is driven by three changes:

1. **Design token system** — CSS variables in `globals.css`, both themes. Tailwind consumes via `theme.extend.colors`. All existing `bg-[#09090b]` / `text-[10px]` / `text-[11px]` arbitrary values get replaced with semantic tokens.
2. **Component restyling** — every component rebuilt against the new token system and the C aesthetic (gradient atmospheres on dark, monospace accents, mono type scale).
3. **DAG modal component** — new full-screen viewer using the existing react-flow setup, with pan/zoom, node-click reveals, and URL deep-linking (`?view=graph`).

No routing changes. No API changes. No data model changes.

## Section 1 — Design foundation

### Color tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#050505` | `#ffffff` | Page background |
| `--surface` | `#0a0a0a` | `#fafafa` | Card, elevated panel |
| `--surface-2` | `#18181b` | `#f4f4f5` | Input, code block |
| `--border` | `rgba(255,255,255,0.08)` | `#e4e4e7` | Default border |
| `--text` | `#fafafa` | `#09090b` | Primary text |
| `--text-muted` | `#a1a1aa` | `#52525b` | Body, description |
| `--text-dim` | `#71717a` | `#71717a` | Meta, caption |
| `--accent` | `#3b82f6` | `#2563eb` | Single accent (links, mono prompts, active states, focus rings) |

### Typography

- **Inter** for UI text (self-hosted via `next/font/google` with `display: swap`)
- **JetBrains Mono** for technical accents — commands, file paths, category tags, version strings

Strict scale (kills the current `text-[10px]`/`text-[11px]` sprawl):

| Size | Weight | Tracking | Use |
|---|---|---|---|
| 28px | 500 | -0.02em | Page hero |
| 22px | 600 | -0.015em | Card title |
| 16px | 600 | -0.01em | Grid card title |
| 14px | 400 | 0 | Body |
| 12px | 500 | 0.04em uppercase | Labels |
| 12px mono | 400 | 0 | Commands, paths |
| 11px mono | 400 | 0.02em | Category, version meta |
| 10px | 500 | 0.04em | Pills |

### Card treatment

- **Dark:** two soft radial gradients (top-left blue, bottom-right cyan, both <10% opacity) layered over `--surface`. 1px border with a gradient mask for the "premium edge" look.
- **Light:** no gradients (they read muddy on white). Solid `--border`, subtle `box-shadow: 0 1px 2px rgba(0,0,0,0.03)`.

### Spacing

4px base. Restrained 7-step scale: 4, 8, 12, 16, 24, 32, 48.

### Implementation path

1. Define CSS variables in `site/src/app/globals.css` — both themes inside `:root` and `@media (prefers-color-scheme: light)` block.
2. Extend Tailwind config (`tailwind.config.ts`) to consume them — `bg-surface` instead of `bg-[#0a0a0a]`.
3. Replace all hardcoded hex values across `site/src/components/` and `site/src/app/`.
4. Kills the `bg-[#09090b]` / `text-[10px]` / `text-[11px]` arbitrary-value sprawl in the same pass (audit item).

## Section 2 — Card grid + filter system

### Filter bar (sticky, top of `/`)

- `position: sticky; top: 0;` with `backdrop-filter: blur(12px)` and semi-transparent `--bg`.
- Search input with inline search icon, `⌘K` keyboard shortcut **actually wired up** (focuses search input). Placeholder: `Search N workflows…` (N = total count).
- Category chips, skill chips, count-per-chip displayed in mono 10px inline: `Code Review  5`.
- Active chip uses accent tint: `background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.4); color: #93c5fd`.
- Dashed **"× clear filters (N)"** chip appears when any filter is active (audit fix).

### Grid meta row

Between filter bar and grid:
- Left: `<mono>N</mono> workflows · filtered by <active-chip-summary>`.
- Right: sort select (Recently updated / Alphabetical).

### Workflow card

Layout (inside the gradient-atmosphere container):

```
// official · code-review         ← mono 10px accent color
PR Review Bot                     ← 16px semibold
Automated pull request review     ← 13px body, 2-line clamp
with security checks.

[github] [slack]                  ← 10px pills
────────────────────────────       ← divider
● swenyai              4 nodes    ← 11px meta; ● = source dot
```

- Source dot: blue for `official`, gray for `community`. Replaces current bulky badge (audit fix).
- Hover: `border-color` shifts toward accent.
- Click target: entire card.

### Responsive

- Desktop (≥1024px): 3 columns.
- Tablet (≥640px): 2 columns.
- Mobile: 1 column, card padding reduced from 32→24.

### Empty state

When filters return 0 results: centered panel with mono `// no matches` label, plain-language message, and a "Clear filters" button styled as the dashed chip.

## Section 3 — Detail page (side-by-side + DAG modal)

### Desktop layout (≥1024px)

Two-column grid, approx 45/55 split — the DAG column is the wider one. Complex workflows (10+ nodes) need the room.

**Left column (narrower, ~45%):**
- Mono category line: `// official · code-review · v1.0.0`
- Page hero title (28px)
- Description (14px body)
- **Install command block** (hero element): dark fill, mono 12px, `$ ` prompt in accent, copy button revealing `copied ✓` for 1.5s after click.
- Env vars block — required vars shown by default with `required` pill; optional vars collapsed behind `Show optional (N)` chevron.
- Sample output rendered with markdown + code syntax highlighting (currently pre-formatted monolith).

**Right column (wider, ~55%):**
- DAG (react-flow) in its own container, full column height, sticky within viewport on scroll so it stays visible while user reads env vars / sample output.
- `⤢ expand` button in the top-right corner opens the same full-screen modal as mobile — for users who still need more room.

### Mobile layout (<1024px)

Stacked. Everything from left column in order. Where the DAG would go on desktop:

```
┌────────────────────────────────┐
│  ⤢  View workflow graph        │  ← accent-tinted button
└────────────────────────────────┘
```

Tapping opens the full-screen modal.

### Full-screen DAG modal

Shared component used by desktop `⤢ expand` and mobile CTA:

- **Full viewport**, `--bg` background, DAG centered, generous padding.
- Uses existing react-flow instance with `fitView` on open.
- **Pan + zoom**: pinch-zoom/drag on mobile, scroll-zoom/click-drag on desktop.
- **Node click** reveals that node's instruction, skills, and model in a side panel (desktop) or bottom sheet (mobile).
- **Dismiss:** ESC on desktop; swipe-down or tap-outside on mobile; X button top-right on both.
- **URL deep-link:** `/workflows/:id?view=graph` so graph state is shareable. Reading the query param opens the modal on initial render.
- Animation: fade + scale-up (200ms) from the trigger element position.

## Section 4 — Polish

- **Touch targets ≥44px** — enforce via Tailwind plugin/shortcut (`min-h-[44px]`) on all interactive primitives.
- **Focus-visible states** — global `focus-visible:ring-2 focus-visible:ring-[var(--accent)]` on buttons, chips, links, inputs.
- **Loading + empty states** — friendly empty state with Clear-filters CTA; skeleton cards for bookmarkable filter URLs.
- **Copy-to-clipboard feedback** — install command, env var names, any code block shows `copied ✓` inline for 1.5s after click.
- **Per-workflow OG images** — `@vercel/og` generator renders workflow title over mini-DAG visualization at `/api/og/workflows/:id`. Used in `<meta>` tags on detail pages for rich Slack/Discord/Twitter link previews.
- **Sample output renders as markdown** with syntax highlighting (Shiki or equivalent), not a raw pre-formatted block.
- **Env var block collapsible** — required on top with `required` pill; optional vars collapsed under chevron.
- **404 + 500 pages** in C aesthetic: mono `// 404 · not found`, helpful fallback to browse.
- **Font loading** — self-host Inter + JetBrains Mono via `next/font/google` with `display: swap`. No FOUT.
- **Scrollbar styling** — thin, theme-aware scrollbars in overflow containers and the DAG modal.

## Section 5 — Non-goals

Explicitly **not** in this pass:

- **Authoring UI** — community contribution stays GitHub-PR-based.
- **Author profiles** — no `/author/:id` routes, no avatars.
- **Popularity metrics / trending** — we have no reliable telemetry for local npx installs; fake numbers erode trust.
- **Editorial / featured collections** — premium ≠ magazine. Filters do the work.
- **Comments / reviews** — feedback lives in GitHub issues on the workflow YAML.
- **SWEny Cloud cross-promotion on every page** — subtle footer link only. Primary CTA is local install.
- **Manual theme toggle** — system preference only for v1. Token system supports adding a toggle later if feedback demands it.

## Test plan

- **Visual regression:** screenshot `/`, `/workflows/pr-review-bot`, `/workflows/implement` at desktop (1440px) + mobile (375px) in both themes before/after.
- **Keyboard navigation:** `⌘K` focuses search, Tab order on filter chips, arrow-key nav inside the DAG modal.
- **Accessibility:** Lighthouse accessibility score ≥95 for `/` and a detail page; WCAG AA contrast check on both themes (accent on bg, text-muted on surface, etc).
- **Browser:** Safari iOS (pinch-zoom on DAG modal), Chrome, Firefox.
- **OG image:** manually verify `<meta og:image>` renders correctly by pasting workflow URL into Slack.
- **Install flow:** click → detail page → copy command → paste in terminal → `npx sweny new <id>` works end-to-end (this is the primary conversion path — must be friction-free).

## Files likely to be touched

Primarily in `site/src/`:

- `app/globals.css` — CSS variable tokens (new)
- `tailwind.config.ts` — token integration (new/modified)
- `app/layout.tsx` — `next/font` additions
- `app/page.tsx` — grid + sticky filter bar
- `app/workflows/[id]/page.tsx` — detail page split layout
- `components/WorkflowCard.tsx` — card rebuild
- `components/FilterBar.tsx` — extract or rewrite from current filter UI
- `components/DagViewer.tsx` — existing react-flow component
- `components/DagModal.tsx` — new full-screen modal wrapper (new)
- `components/InstallCommand.tsx` — new, extracted hero block (new)
- `components/EnvVarList.tsx` — collapsible rebuild
- `components/SampleOutput.tsx` — markdown + syntax highlighting
- `app/api/og/workflows/[id]/route.tsx` — OG image generator (new)
- `app/not-found.tsx`, `app/error.tsx` — re-themed

## Open questions (carried to plan phase)

- Which syntax highlighter — Shiki (SSR, large) vs `react-syntax-highlighter` (smaller, client-side)?
- OG image font loading strategy — bundle a `.ttf` with the route or use `@vercel/og` built-in fonts?
- Does `DagModal` need to be a full-page route (`/workflows/:id/graph`) for back-button behavior, or just a query param with `scroll-restoration` handling?
