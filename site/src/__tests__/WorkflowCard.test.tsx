import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowCard } from "@/components/WorkflowCard";
import type { MarketplaceWorkflow } from "@/lib/types";

// next/link is a thin wrapper in this codebase; render its children
// inline so we can assert on the link's href and content directly.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function makeWorkflow(overrides: Partial<MarketplaceWorkflow> = {}): MarketplaceWorkflow {
  return {
    id: "demo",
    name: "Demo Workflow",
    description: "A demo workflow",
    entry: "a",
    nodes: { a: { name: "A", instruction: "do a", skills: [] } },
    edges: [],
    source: "official",
    category: "ops",
    author: "swenyai",
    tags: [],
    version: "1.0.0",
    filePath: "workflows/official/demo.yml",
    nodeCount: 3,
    edgeCount: 2,
    skills: [],
    customSkills: {},
    derivedVariables: [],
    ...overrides,
  };
}

describe("WorkflowCard", () => {
  it("links to the workflow detail page", () => {
    render(<WorkflowCard workflow={makeWorkflow({ id: "pr-review-bot" })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/workflows/pr-review-bot");
  });

  it("renders the source/category line and node count", () => {
    render(<WorkflowCard workflow={makeWorkflow({ nodeCount: 7, source: "community" })} />);
    expect(screen.getByText(/community · ops/i)).toBeInTheDocument();
    expect(screen.getByText(/7 nodes/)).toBeInTheDocument();
  });

  it("does not render a pill row when the workflow has no skills", () => {
    const { container } = render(<WorkflowCard workflow={makeWorkflow({ skills: [] })} />);
    // Skill pills are rendered as <span> children of a flex row. With zero
    // skills the entire row is gated out — no pill spans should exist.
    // Filter out the dot, count, and other text spans by class signature.
    const pillSpans = container.querySelectorAll('span.bg-surface-2.border-border');
    expect(pillSpans.length).toBe(0);
  });

  it("renders up to 3 skill pills inline", () => {
    render(
      <WorkflowCard workflow={makeWorkflow({ skills: ["github", "slack", "linear"] })} />,
    );
    expect(screen.getByText("github")).toBeInTheDocument();
    expect(screen.getByText("slack")).toBeInTheDocument();
    expect(screen.getByText("linear")).toBeInTheDocument();
    // No overflow indicator when length === 3.
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it("shows a +N overflow indicator when more than 3 skills exist", () => {
    render(
      <WorkflowCard
        workflow={makeWorkflow({ skills: ["github", "slack", "linear", "sentry", "datadog"] })}
      />,
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
