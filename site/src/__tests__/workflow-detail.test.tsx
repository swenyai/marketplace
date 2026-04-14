import React, { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import type { MarketplaceWorkflow } from "@/lib/types";

// react-flow needs a real DOM; stub the dynamically imported DagViewer.
vi.mock("@/components/DagViewer", () => ({
  default: () => <div data-testid="dag-viewer-stub" />,
}));

// next/dynamic → React.lazy-equivalent so the loader still runs and hits
// the vi.mock registry above.
vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>,
  ) => {
    const Lazy = React.lazy(loader);
    const Wrapped = (props: Record<string, unknown>) => (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
    return Wrapped;
  },
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

  it("hides optional env vars behind the Show toggle", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.queryByText("SLACK_WEBHOOK_URL")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /show optional/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("renders mobile CTA button to view graph", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(screen.getByRole("button", { name: /view workflow graph/i })).toBeInTheDocument();
  });
});
