import React, { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowDetail } from "@/components/WorkflowDetail";
import type { MarketplaceWorkflow } from "@/lib/types";

// react-flow needs a real DOM; stub the dynamically imported DagViewer.
vi.mock("@/components/DagViewer", () => ({
  default: () => <div data-testid="dag-viewer-stub" />,
}));

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

// Stateful mock for next/navigation that lets tests drive the URL. The
// shared `state` object is mutated by the router and read by hooks so
// components observe URL changes exactly the way they would in the browser.
const state: { params: URLSearchParams; pathname: string } = {
  params: new URLSearchParams(),
  pathname: "/workflows/test",
};
const replace = vi.fn((url: string) => {
  const [pathname, query = ""] = url.split("?");
  state.pathname = pathname;
  state.params = new URLSearchParams(query);
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => state.params,
  useRouter: () => ({ replace }),
  usePathname: () => state.pathname,
}));

const mockWorkflow: MarketplaceWorkflow = {
  id: "test-workflow",
  name: "Test Workflow",
  description: "Does a test.",
  entry: "a",
  nodes: { a: { name: "A", instruction: "do a", skills: [] } },
  edges: [],
  source: "official",
  category: "ops",
  author: "swenyai",
  tags: [],
  version: "1.0.0",
  filePath: "workflows/official/test.yml",
  nodeCount: 1,
  edgeCount: 0,
  skills: [],
  customSkills: {},
  derivedVariables: [],
};

describe("WorkflowDetail URL ↔ modal integration", () => {
  beforeEach(() => {
    state.params = new URLSearchParams();
    state.pathname = "/workflows/test";
    replace.mockClear();
  });

  it("does not open the modal by default", () => {
    render(<WorkflowDetail workflow={mockWorkflow} />);
    // No dialog when URL has no view param.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the modal when URL contains ?view=graph", async () => {
    state.params = new URLSearchParams("view=graph");
    render(<WorkflowDetail workflow={mockWorkflow} />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("pushes ?view=graph to the URL when the mobile CTA is clicked", async () => {
    const user = userEvent.setup();
    render(<WorkflowDetail workflow={mockWorkflow} />);
    await user.click(screen.getByRole("button", { name: /view workflow graph/i }));
    expect(replace).toHaveBeenCalledOnce();
    const [url] = replace.mock.calls[0];
    expect(url).toContain("view=graph");
  });

  it("preserves unrelated query params when opening the modal", async () => {
    state.params = new URLSearchParams("ref=twitter");
    const user = userEvent.setup();
    render(<WorkflowDetail workflow={mockWorkflow} />);
    await user.click(screen.getByRole("button", { name: /view workflow graph/i }));
    const [url] = replace.mock.calls[0];
    expect(url).toContain("ref=twitter");
    expect(url).toContain("view=graph");
  });
});
