import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DagModal } from "@/components/DagModal";
import type { Workflow } from "@sweny-ai/core";

// Stub next/dynamic to render synchronously (no lazy loading in jsdom)
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a synchronous wrapper — vitest resolves the mock immediately
    const Comp = (props: Record<string, unknown>) => {
      // The loader is already mocked via vi.mock("@/components/DagViewer")
      // so we just render the stub directly
      return <div data-testid="dag-viewer-stub" />;
    };
    return Comp;
  },
}));

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
