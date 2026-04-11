import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallButton } from "@/components/InstallButton";
import type { MarketplaceWorkflow } from "@/lib/types";

const MOCK_WORKFLOW: MarketplaceWorkflow = {
  id: "triage",
  name: "Triage",
  description: "Automated issue triage",
  entry: "start",
  nodes: { start: { instruction: "triage", skills: ["github"], output: "result" } },
  edges: [],
  author: "sweny-ai",
  category: "triage",
  tags: ["triage"],
  color: "blue",
  version: "1.0.0",
  source: "official",
  filePath: "workflows/official/triage.yml",
  nodeCount: 1,
  edgeCount: 0,
  skills: ["github"],
};

describe("InstallButton", () => {
  it("renders the initial button text", () => {
    render(<InstallButton workflow={MOCK_WORKFLOW} />);
    expect(screen.getByText("Install to Repo")).toBeInTheDocument();
  });

  it("expands to show form on click", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));

    expect(screen.getByText("Install to GitHub")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("your-org/your-repo")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("collapses back when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.click(screen.getByText("Cancel"));

    expect(screen.getByText("Install to Repo")).toBeInTheDocument();
  });

  it("disables 'Open in GitHub' when repo is empty", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));

    const link = screen.getByText("Open in GitHub").closest("a")!;
    expect(link).toHaveAttribute("href", "#");
    expect(link).toHaveClass("cursor-not-allowed");
  });

  it("enables 'Open in GitHub' with valid owner/repo", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "my-org/my-repo");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    const href = link.getAttribute("href")!;

    expect(href).toContain("https://github.com/my-org/my-repo/new/main");
    expect(href).toContain("filename=.github/workflows/sweny.yml");
    expect(href).toContain("sweny-workflow");
  });

  it("URL-encodes owner, name, and branch", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "org/repo");

    // Change branch to something with special chars
    const branchInput = screen.getByDisplayValue("main");
    await user.clear(branchInput);
    await user.type(branchInput, "feat/my branch");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    const href = link.getAttribute("href")!;

    // Branch should be encoded
    expect(href).toContain(encodeURIComponent("feat/my branch"));
    // Should NOT contain raw space
    expect(href).not.toContain("/new/feat/my branch?");
  });

  it("rejects repo input without slash", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "justrepo");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    expect(link).toHaveAttribute("href", "#");
  });

  it("shows auth token toggles for default variables", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));

    expect(screen.getByText("ANTHROPIC_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("CLAUDE_CODE_OAUTH_TOKEN")).toBeInTheDocument();
  });

  it("includes workflow ID in generated YAML", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "org/repo");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    const href = link.getAttribute("href")!;
    const value = decodeURIComponent(href.split("value=")[1]);

    expect(value).toContain("sweny-workflow:");
    expect(value).toContain("triage");
  });

  it("opens link in new tab with noopener", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "org/repo");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("includes read-only trust statement", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));

    expect(screen.getByText(/SWEny never writes to your repo/)).toBeInTheDocument();
  });

  it("links to cloud.sweny.ai for run tracking", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));

    const cloudLink = screen.getByText("cloud.sweny.ai");
    expect(cloudLink).toHaveAttribute("href", "https://cloud.sweny.ai");
  });

  it("generates valid GitHub Actions YAML with correct permissions", async () => {
    const user = userEvent.setup();
    render(<InstallButton workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Install to Repo"));
    await user.type(screen.getByPlaceholderText("your-org/your-repo"), "org/repo");

    const link = screen.getByText("Open in GitHub").closest("a")!;
    const href = link.getAttribute("href")!;
    const value = decodeURIComponent(href.split("value=")[1]);

    // Valid GH Action structure
    expect(value).toContain("name: SWEny Triage");
    expect(value).toContain("workflow_dispatch");
    expect(value).toContain("schedule:");
    expect(value).toContain("contents: read");
    expect(value).toContain("issues: write");
    expect(value).toContain("pull-requests: write");
    expect(value).toContain("actions/checkout@v4");
    expect(value).toContain("swenyai/sweny@v5");
    expect(value).toContain("ANTHROPIC_API_KEY");
  });
});
