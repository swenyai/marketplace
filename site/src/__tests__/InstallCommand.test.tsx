import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallCommand } from "@/components/InstallCommand";

describe("InstallCommand", () => {
  beforeEach(() => {
    // Reset the shared clipboard stub installed in setup.ts so each test
    // sees a clean mock with no call history from prior tests.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
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
    await user.click(screen.getByRole("button", { name: /copy install command/i }));
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("writes the command to clipboard on click", async () => {
    // userEvent.setup() installs its own clipboard stub; set up first, THEN
    // spy on the installed writeText so the component's clipboard call lands
    // on our spy instead of being overwritten by userEvent afterward.
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<InstallCommand workflowId="pr-review-bot" />);
    await user.click(screen.getByRole("button", { name: /copy install command/i }));
    await screen.findByText(/copied/i);
    expect(writeText).toHaveBeenCalledWith("npx sweny new pr-review-bot");
  });
});
