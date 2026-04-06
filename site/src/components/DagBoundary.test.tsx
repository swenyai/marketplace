import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DagBoundary } from "./DagBoundary";

/** Component that throws on render to trigger the boundary. */
function Exploder({ message }: { message: string }) {
  throw new Error(message);
}

describe("<DagBoundary />", () => {
  // React logs caught errors to console.error; silence for readability.
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    cleanup();
  });

  it("renders children when no error occurs", () => {
    render(
      <DagBoundary>
        <div data-testid="ok">All good</div>
      </DagBoundary>
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });

  it("catches render errors and shows a dark-themed fallback", () => {
    render(
      <DagBoundary>
        <Exploder message="boom" />
      </DagBoundary>
    );
    expect(screen.getByText(/DAG preview unavailable/i)).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    render(
      <DagBoundary label="Workflow preview failed">
        <Exploder message="nope" />
      </DagBoundary>
    );
    expect(screen.getByText("Workflow preview failed")).toBeInTheDocument();
  });

  it("does not leak the light-theme studio colours", () => {
    render(
      <DagBoundary>
        <Exploder message="boom" />
      </DagBoundary>
    );
    // The fallback's outer container should not carry the #fef2f2 background.
    const fallback = screen.getByText("boom").closest("div");
    expect(fallback).not.toBeNull();
    // Tailwind class 'text-red-400/80' should be present on the message div.
    expect(screen.getByText("boom")).toHaveClass("text-red-400/80");
  });
});
