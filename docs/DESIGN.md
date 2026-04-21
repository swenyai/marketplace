# SWEny Workflow Marketplace — Design

A public marketplace for discovering, sharing, and creating [SWEny](https://github.com/swenyai/sweny) workflows. This document describes how the site works for contributors to the marketplace codebase itself. For how to submit a workflow, see [CONTRIBUTING.md](../CONTRIBUTING.md).

- **Repo:** `swenyai/marketplace`
- **Domain:** `marketplace.sweny.ai`
- **Framework:** Next.js 15 (App Router) + React 19 + Tailwind CSS 4
- **Deploy:** Vercel auto-deploy on push to `main`

## Repo layout

```
marketplace/
├── workflows/
│   ├── official/              # Maintained by the SWEny team
│   └── community/             # Community-contributed, merged via PR
├── site/                      # Next.js app → marketplace.sweny.ai
│   ├── src/app/
│   │   ├── page.tsx                         # Browse (gallery + filters)
│   │   ├── workflows/[id]/page.tsx          # Workflow permalink
│   │   ├── create/page.tsx                  # AI generation + Studio editor
│   │   ├── api/generate/route.ts            # Streaming generation endpoint
│   │   └── api/og/workflows/[id]/route.tsx  # OG image renderer
│   ├── src/components/        # DagViewer, MiniDag, FilterBar, WorkflowCard, …
│   └── src/lib/               # workflows.ts (build-time index), normalize, types
├── scripts/
│   ├── validate.mjs           # CI: parse + validate every YAML
│   ├── check-unique-ids.mjs   # CI: no duplicate workflow IDs
│   └── check-skill-parity.mjs # CI: skills match @sweny-ai/core catalog
└── .github/workflows/ci.yml   # Validates workflows + runs site tests on PR
```

## Workflow YAML

Every file in `workflows/` carries standard SWEny fields plus marketplace metadata. The contributor-facing spec lives in [CONTRIBUTING.md](../CONTRIBUTING.md). Summary of required metadata:

| Field | Description |
|-------|-------------|
| `id` | Unique, URL-safe (`^[a-z0-9-]+$`) |
| `name` | Display name (3–80 chars) |
| `description` | One-liner for cards and SEO (10–300 chars) |
| `author` | GitHub username |
| `category` | One of: `triage`, `security`, `devops`, `code-review`, `testing`, `content`, `ops` |
| `tags` | 1–10 search terms |
| `version` | Semver |
| `sweny_version` | Optional semver range (e.g. `">=5.0.0"`) |
| `icon`, `color` | Optional card accents |

The standard workflow body (`entry`, `nodes`, `edges`) is parsed and validated with `@sweny-ai/core`.

## Pages

- **`/`** — Gallery grid with `FilterBar` (category pills + tag/skill filters + search). Cards show mini-DAG previews. Clicking a card opens `DagModal` with the interactive viewer; the modal deep-links to `/workflows/[id]`.
- **`/workflows/[id]`** — Permalink page: full `DagViewer`, YAML source, usage snippet, and install CTA. OG image is rendered on demand via `/api/og/workflows/[id]`.
- **`/create`** — AI-powered generator. Users describe the workflow in natural language; YAML streams into a live `DagViewer`. `E2eWizard` guides users through submitting a PR to this repo.

## AI generation — `POST /api/generate`

Streaming route that calls the Vercel AI Gateway:

- **Gateway:** `https://ai-gateway.vercel.sh/v1/messages`
- **Auth:** `VERCEL_AI_GATEWAY_TOKEN` (server-only env var)
- **Model:** Anthropic Claude Sonnet
- **Validation:** result is parsed with `@sweny-ai/core` before streaming the final `complete` event
- **Rate limiting:** per-IP, implemented in `site/src/app/api/generate/rate-limit.ts`

## Build-time indexing

`site/src/lib/workflows.ts` reads every `workflows/**/*.yml` at build time and exports a typed index used by pages. Validation runs both at build time (via `scripts/validate.mjs` in CI) and when new workflows are parsed. The browse page is static (SSG). Only `/create` and `/api/generate` execute on the server.

## CI — `.github/workflows/ci.yml`

One workflow, two jobs:

1. **`validate-workflows`** — runs `validate.mjs` + `check-unique-ids.mjs` on every PR.
2. **`test-site`** — runs `vitest` + `next build` against the site.

Deploys are handled by Vercel's GitHub integration (no deploy job in CI).

## Design system

- Dark theme to match `docs.sweny.ai` and Studio
- Brand accent: `blue-500` (`#3b82f6`)
- Card accents derived from the `color` field on each workflow
- `@vercel/analytics` + `@vercel/speed-insights` are wired in `site/src/app/layout.tsx`

## Out of scope

- User accounts, ratings, comments (use GitHub PRs/issues)
- Workflow execution from the site (users run workflows in their own CI)
- Private or paid workflows (the repo is MIT-licensed and public)
- Workflow versioning beyond the semver `version` field (no separate registry)
