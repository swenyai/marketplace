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
    const triageChip = screen.getByRole("button", { name: /Triage 2/i });
    expect(triageChip).toBeInTheDocument();
  });
});
