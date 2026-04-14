import React, { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DagModal } from "@/components/DagModal";
import type { Workflow } from "@sweny-ai/core";

// Stub the real DagViewer — react-flow needs a real DOM environment.
// We mock the module so `import("./DagViewer")` (from next/dynamic) resolves
// to this stub via vitest's module registry.
vi.mock("@/components/DagViewer", () => ({
  default: () => <div data-testid="dag-viewer-stub" />,
}));

// Replace next/dynamic with a React.lazy equivalent: it invokes the user's
// actual loader (which hits the vi.mock registry above) and renders through
// a Suspense boundary. Unlike a hard-coded stub, this keeps the mock honest —
// if the component imports something else dynamically, the loader still runs.
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

  it("renders the DAG when open is true", async () => {
    render(<DagModal open={true} onClose={vi.fn()} workflow={workflow} />);
    expect(await screen.findByTestId("dag-viewer-stub")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    await user.click(await screen.findByRole("button", { name: /close workflow graph/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key pressed", async () => {
    const onClose = vi.fn();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    // Wait for the dynamic DagViewer to resolve so effects settle.
    await screen.findByTestId("dag-viewer-stub");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("exposes dialog role with modal semantics and accessible label", async () => {
    render(<DagModal open={true} onClose={vi.fn()} workflow={workflow} />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", expect.stringContaining("graph"));
  });

  it("moves focus to the close button on open", async () => {
    render(<DagModal open={true} onClose={vi.fn()} workflow={workflow} />);
    const closeBtn = await screen.findByRole("button", { name: /close workflow graph/i });
    expect(closeBtn).toHaveFocus();
  });

  it("restores focus to the triggering element when closed", async () => {
    // Render a trigger button outside the modal so we can verify focus is returned to it.
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>
            open
          </button>
          <DagModal open={open} onClose={() => setOpen(false)} workflow={workflow} />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    await user.click(trigger);
    // Wait for the modal's dynamic viewer so effects have run.
    await screen.findByTestId("dag-viewer-stub");
    expect(trigger).not.toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("locks body scroll while open and restores prior overflow on close", async () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(
      <DagModal open={true} onClose={vi.fn()} workflow={workflow} />,
    );
    await screen.findByTestId("dag-viewer-stub");
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<DagModal open={false} onClose={vi.fn()} workflow={workflow} />);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("closes when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    const dialog = await screen.findByRole("dialog");
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close when content inside the dialog is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DagModal open={true} onClose={onClose} workflow={workflow} />);
    // The DagViewer stub is content inside the dialog, not the backdrop.
    const stub = await screen.findByTestId("dag-viewer-stub");
    await user.click(stub);
    expect(onClose).not.toHaveBeenCalled();
  });
});
