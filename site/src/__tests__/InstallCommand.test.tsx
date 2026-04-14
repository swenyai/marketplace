import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallCommand } from "@/components/InstallCommand";

describe("InstallCommand", () => {
  beforeEach(() => {
    const clipboardMock = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(global, "navigator", {
      value: new Proxy(navigator, {
        get(target: Navigator, prop: string | symbol) {
          if (prop === "clipboard") return clipboardMock;
          return (target as unknown as Record<string | symbol, unknown>)[prop];
        },
      }),
      configurable: true,
      writable: true,
    });
  });

  it("renders the npx command with workflow id", () => {
    render(<InstallCommand workflowId="pr-review-bot" />);
    expect(screen.getByText(/npx sweny new pr-review-bot/)).toBeInTheDocument();
  });

  it("shows 'copied ✓' feedback after clicking copy", async () => {
    const user = userEvent.setup();
    render(<InstallCommand workflowId="pr-review-bot" />);
    const button = screen.getByRole("button", { name: /copy install command/i });
    await user.click(button);
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("writes the command to clipboard on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, "navigator", {
      value: new Proxy(navigator, {
        get(target: Navigator, prop: string | symbol) {
          if (prop === "clipboard") return { writeText };
          return (target as unknown as Record<string | symbol, unknown>)[prop];
        },
      }),
      configurable: true,
      writable: true,
    });
    const user = userEvent.setup();
    render(<InstallCommand workflowId="pr-review-bot" />);
    await user.click(screen.getByRole("button", { name: /copy install command/i }));
    await screen.findByText(/copied/i);
    expect(writeText).toHaveBeenCalledWith("npx sweny new pr-review-bot");
  });
});
