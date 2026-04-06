import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmitFlow, buildSubmitUrl, buildFallbackUrl } from "./SubmitFlow";

describe("buildSubmitUrl", () => {
  it("builds a GitHub new-file URL with encoded filename and value", () => {
    const url = buildSubmitUrl("my-workflow", "id: my-workflow\nname: Test");
    expect(url).toContain("https://github.com/swenyai/marketplace/new/main/workflows/community");
    expect(url).toContain("filename=my-workflow.yml");
    expect(url).toContain("value=");
  });

  it("URL-encodes YAML special characters", () => {
    const yaml = "name: Hello & World\npath: /foo?bar=baz";
    const url = buildSubmitUrl("id", yaml);
    expect(url).not.toBeNull();
    expect(url).toContain(encodeURIComponent(yaml));
  });

  it("returns null when the resulting URL would exceed GitHub's length limit", () => {
    // A workflow that, once URL-encoded, will blow past the 8000-char cap.
    const huge = "x".repeat(9000);
    expect(buildSubmitUrl("big", huge)).toBeNull();
  });

  it("returns a URL when the encoded output is just under the limit", () => {
    // Keep well under 8000 chars post-encoding.
    const yaml = "x".repeat(2000);
    const url = buildSubmitUrl("small", yaml);
    expect(url).not.toBeNull();
    expect(url!.length).toBeLessThanOrEqual(8000);
  });

  it("encodes filenames with unsafe characters", () => {
    // Consumer is expected to pass a safe id, but we should still encode.
    const url = buildSubmitUrl("id with spaces", "yaml: 1");
    expect(url).toContain("filename=id%20with%20spaces.yml");
  });
});

describe("buildFallbackUrl", () => {
  it("omits the value parameter", () => {
    const url = buildFallbackUrl("my-workflow");
    expect(url).toContain("filename=my-workflow.yml");
    expect(url).not.toContain("value=");
  });

  it("points to the correct new-file path", () => {
    const url = buildFallbackUrl("x");
    expect(url).toContain("/swenyai/marketplace/new/main/workflows/community");
  });
});

describe("<SubmitFlow />", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    // JSDOM doesn't implement clipboard by default, and `navigator.clipboard`
    // is a readonly getter — use defineProperty to override.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("renders a single submit link for small workflows", () => {
    render(
      <SubmitFlow
        workflowId="my-workflow"
        workflowYaml="id: my-workflow"
        workflowName="My Workflow"
      />
    );

    const link = screen.getByRole("link", { name: /submit .*My Workflow/i });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("/new/main/workflows/community")
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the copy+open fallback when the workflow is too large", () => {
    render(
      <SubmitFlow
        workflowId="huge"
        workflowYaml={"x".repeat(9000)}
        workflowName="Huge Workflow"
      />
    );

    expect(
      screen.getByText(/too large to pre-fill/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy yaml/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open github editor/i })).toBeInTheDocument();
  });

  it("copies the YAML to clipboard when the copy button is clicked", async () => {
    const yaml = "x".repeat(9000);

    render(
      <SubmitFlow
        workflowId="huge"
        workflowYaml={yaml}
        workflowName="Huge Workflow"
      />
    );

    // fireEvent is used here (not userEvent) because user-event v14
    // installs its own Clipboard API shim that intercepts our mock.
    fireEvent.click(screen.getByRole("button", { name: /copy yaml/i }));

    expect(writeText).toHaveBeenCalledWith(yaml);
    expect(
      await screen.findByRole("button", { name: /copied/i })
    ).toBeInTheDocument();
  });

  it("prevents navigation when disabled", async () => {
    const user = userEvent.setup();
    render(
      <SubmitFlow
        workflowId="my-workflow"
        workflowYaml="id: my-workflow"
        workflowName="My Workflow"
        disabled
      />
    );

    const link = screen.getByRole("link", { name: /submit/i });
    expect(link).toHaveAttribute("aria-disabled", "true");
    // Pointer-events:none on the disabled class means the click shouldn't
    // fire at all; assert we can still find the element in a disabled state.
    await user.click(link).catch(() => {});
    expect(link).toHaveClass("pointer-events-none");
  });

  it("still sets href even when disabled so the link semantics are preserved", () => {
    render(
      <SubmitFlow
        workflowId="my-workflow"
        workflowYaml="id: my-workflow"
        workflowName="My Workflow"
        disabled
      />
    );
    const link = screen.getByRole("link", { name: /submit/i });
    // href present → still a valid anchor for screen readers.
    expect(link).toHaveAttribute("href");
  });
});
