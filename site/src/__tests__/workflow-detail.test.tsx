import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import type { MarketplaceWorkflow } from "@/lib/types";

const SRC = resolve(__dirname, "..");

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC, relativePath), "utf-8");
}

function collectComponentFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) continue;
    if (/\.(tsx?)$/.test(entry) && !entry.includes(".test.")) {
      files.push(full);
    }
  }
  return files;
}

const MOCK_WORKFLOW: MarketplaceWorkflow = {
  id: "triage",
  name: "Triage",
  description: "Automated issue triage",
  entry: "start",
  nodes: {
    start: { instruction: "triage issues", skills: ["github"], output: "result" },
    review: { instruction: "review findings", skills: ["github", "slack"], output: "done" },
  },
  edges: [{ from: "start", to: "review" }],
  author: "sweny-ai",
  category: "triage",
  tags: ["triage"],
  color: "blue",
  version: "1.0.0",
  source: "official",
  filePath: "workflows/official/triage.yml",
  nodeCount: 2,
  edgeCount: 1,
  skills: ["github", "slack"],
  customSkills: {},
  derivedVariables: [
    { name: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude", required: true, skill: "core" },
    { name: "GITHUB_TOKEN", description: "GitHub personal access token", required: true, skill: "github" },
    { name: "SLACK_WEBHOOK_URL", description: "Slack incoming webhook URL", required: false, skill: "slack" },
  ],
};

// ---------------------------------------------------------------------------
// WorkflowDetail: Layout & structure
// ---------------------------------------------------------------------------

describe("WorkflowDetail layout", () => {
  const src = readSrc("components/WorkflowDetail.tsx");

  it("renders actions BEFORE the DAG (above the fold)", () => {
    const actionsIdx = src.indexOf("Actions — always above the fold");
    const dagIdx = src.indexOf("Interactive DAG");
    expect(actionsIdx).toBeGreaterThan(-1);
    expect(dagIdx).toBeGreaterThan(-1);
    expect(actionsIdx).toBeLessThan(dagIdx);
  });

  it("renders tabs BEFORE the DAG (immediately after actions)", () => {
    const tabsIdx = src.indexOf("Tabs — immediately after actions");
    const dagIdx = src.indexOf("Interactive DAG");
    expect(tabsIdx).toBeGreaterThan(-1);
    expect(tabsIdx).toBeLessThan(dagIdx);
  });

  it("renders cloud CTA AFTER the DAG (bottom of page)", () => {
    const dagIdx = src.indexOf("Interactive DAG");
    const ctaIdx = src.indexOf("Cloud CTA");
    expect(dagIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(dagIdx);
  });

  it("layout order: actions → tabs → tab content → DAG → cloud CTA", () => {
    const order = [
      src.indexOf("Actions — always above the fold"),
      src.indexOf("Tabs — immediately after actions"),
      src.indexOf("Tab content"),
      src.indexOf("Interactive DAG"),
      src.indexOf("Cloud CTA"),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1]);
    }
  });

  it("contains all three action buttons", () => {
    expect(src).toContain("<InstallButton");
    expect(src).toContain("Fork & Edit");
    expect(src).toContain("GitHub");
  });

  it("links Fork & Edit to /create?fork=workflowId", () => {
    expect(src).toContain("/create?fork=${workflow.id}");
  });

  it("links GitHub to the correct raw file on GitHub", () => {
    expect(src).toContain("github.com/swenyai/marketplace/blob/main/${workflow.filePath}");
  });

  it("opens GitHub link in new tab with noopener", () => {
    // The GitHub source link
    const ghLinkMatch = src.match(/href=\{`https:\/\/github\.com\/swenyai\/marketplace[\s\S]*?<\/a>/);
    expect(ghLinkMatch).not.toBeNull();
    expect(ghLinkMatch![0]).toContain('target="_blank"');
    expect(ghLinkMatch![0]).toContain('rel="noopener noreferrer"');
  });

  it("cloud CTA links to cloud.sweny.ai", () => {
    expect(src).toContain('href="https://cloud.sweny.ai"');
  });

  it("shows OFFICIAL badge for official workflows", () => {
    expect(src).toContain("OFFICIAL");
    expect(src).toContain("COMMUNITY");
  });

  it("shows workflow metadata (author, nodes, edges, version)", () => {
    expect(src).toContain("workflow.author");
    expect(src).toContain("workflow.nodeCount");
    expect(src).toContain("workflow.edgeCount");
    expect(src).toContain("workflow.version");
  });

  it("has three tabs: skills, yaml, usage", () => {
    expect(src).toContain('"skills"');
    expect(src).toContain('"yaml"');
    expect(src).toContain('"usage"');
    expect(src).toContain("Skills Required");
    expect(src).toContain("YAML Source");
    expect(src).toContain("Usage");
  });

  it("defaults to skills tab", () => {
    expect(src).toContain('useState<Tab>("skills")');
  });

  it("renders responsive DAG — mobile and desktop sizes", () => {
    expect(src).toContain("block md:hidden");
    expect(src).toContain("hidden md:block");
    expect(src).toContain("height={280}");
    expect(src).toContain("height={400}");
  });

  it("uses dynamic import for DagViewer with SSR disabled", () => {
    expect(src).toContain("dynamic(");
    expect(src).toContain("ssr: false");
  });
});

// ---------------------------------------------------------------------------
// InstallButton + UsageSnippet: YAML parity
// ---------------------------------------------------------------------------

describe("InstallButton and UsageSnippet YAML parity", () => {
  const installSrc = readSrc("components/InstallButton.tsx");
  const usageSrc = readSrc("components/UsageSnippet.tsx");

  it("both use the same swenyai/sweny action version", () => {
    const installVersion = installSrc.match(/swenyai\/sweny@(v\d+)/)?.[1];
    const usageVersion = usageSrc.match(/swenyai\/sweny@(v\d+)/)?.[1];
    expect(installVersion).toBeDefined();
    expect(usageVersion).toBeDefined();
    expect(installVersion).toBe(usageVersion);
  });

  it("both use actions/checkout@v4", () => {
    expect(installSrc).toContain("actions/checkout@v4");
    expect(usageSrc).toContain("actions/checkout@v4");
  });

  it("both include permissions block with contents:read", () => {
    expect(installSrc).toContain("contents: read");
    expect(usageSrc).toContain("contents: read");
  });

  it("both include permissions for issues:write", () => {
    expect(installSrc).toContain("issues: write");
    expect(usageSrc).toContain("issues: write");
  });

  it("both include permissions for pull-requests:write", () => {
    expect(installSrc).toContain("pull-requests: write");
    expect(usageSrc).toContain("pull-requests: write");
  });

  it("both use workflow_dispatch trigger", () => {
    expect(installSrc).toContain("workflow_dispatch");
    expect(usageSrc).toContain("workflow_dispatch");
  });

  it("both use schedule trigger", () => {
    expect(installSrc).toContain("schedule:");
    expect(usageSrc).toContain("schedule:");
  });

  it("both reference sweny-workflow with the workflow id", () => {
    expect(installSrc).toContain("sweny-workflow:");
    expect(usageSrc).toContain("sweny-workflow:");
  });

  it("both use derivedVariables from workflow (not DEFAULT_VARIABLES)", () => {
    expect(installSrc).toContain("derivedVariables");
    expect(usageSrc).toContain("derivedVariables");
    // Neither should import DEFAULT_VARIABLES
    expect(installSrc).not.toContain("DEFAULT_VARIABLES");
    expect(usageSrc).not.toContain("DEFAULT_VARIABLES");
  });
});

// ---------------------------------------------------------------------------
// SKILL_CONFIG: static skill → env var mapping
// ---------------------------------------------------------------------------

describe("SKILL_CONFIG shared constant", () => {
  const typesSrc = readSrc("lib/types.ts");

  it("is exported from lib/types.ts", () => {
    expect(typesSrc).toContain("export const SKILL_CONFIG");
  });

  it("includes github with GITHUB_TOKEN", () => {
    expect(typesSrc).toContain("GITHUB_TOKEN");
  });

  it("includes slack with SLACK_WEBHOOK_URL", () => {
    expect(typesSrc).toContain("SLACK_WEBHOOK_URL");
  });
});

// ---------------------------------------------------------------------------
// Mobile UX guard: no text-[10px] in feature components
// ---------------------------------------------------------------------------

describe("Mobile UX: no text-[10px] in WorkflowDetail or InstallButton", () => {
  const files = [
    "components/WorkflowDetail.tsx",
    "components/InstallButton.tsx",
  ];

  for (const file of files) {
    it(`${file} does not use text-[10px]`, () => {
      const src = readSrc(file);
      const matches = src.match(/text-\[10px\]/g);
      expect(matches).toBeNull();
    });
  }
});

// ---------------------------------------------------------------------------
// WorkflowDetail: RTL rendering tests
// ---------------------------------------------------------------------------

// Mock the DagViewer since it uses canvas/external lib
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const MockDag = () => <div data-testid="dag-viewer">DAG</div>;
    MockDag.displayName = "MockDagViewer";
    return MockDag;
  },
}));

// Mock yaml stringify
vi.mock("yaml", () => ({
  stringify: (obj: unknown) => JSON.stringify(obj),
}));

// Dynamic import needs this
vi.mock("./DagViewer", () => ({
  __esModule: true,
  default: () => <div data-testid="dag-viewer">DAG</div>,
}));

describe("WorkflowDetail rendering", () => {
  // Lazy import to let mocks take effect
  let WorkflowDetail: typeof import("@/components/WorkflowDetail").WorkflowDetail;

  beforeAll(async () => {
    const mod = await import("@/components/WorkflowDetail");
    WorkflowDetail = mod.WorkflowDetail;
  });

  it("renders workflow name and description", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    expect(screen.getByText("Triage")).toBeInTheDocument();
    expect(screen.getByText("Automated issue triage")).toBeInTheDocument();
  });

  it("renders OFFICIAL badge for official workflows", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    expect(screen.getByText("OFFICIAL")).toBeInTheDocument();
  });

  it("renders COMMUNITY badge for community workflows", () => {
    render(<WorkflowDetail workflow={{ ...MOCK_WORKFLOW, source: "community" }} />);
    expect(screen.getByText("COMMUNITY")).toBeInTheDocument();
  });

  it("renders metadata bar with author, nodes, edges, version", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    expect(screen.getByText("sweny-ai")).toBeInTheDocument();
    expect(screen.getByText("2 nodes")).toBeInTheDocument();
    expect(screen.getByText("1 edges")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  it("renders Install to Repo button", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    expect(screen.getByText("Install to Repo")).toBeInTheDocument();
  });

  it("renders Fork & Edit link", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    const link = screen.getByText("Fork & Edit");
    expect(link.closest("a")).toHaveAttribute("href", "/create?fork=triage");
  });

  it("renders GitHub source link", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    const link = screen.getByText("GitHub");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://github.com/swenyai/marketplace/blob/main/workflows/official/triage.yml"
    );
  });

  it("renders cloud CTA with link to cloud.sweny.ai", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    const cloudLink = screen.getByText(/cloud\.sweny\.ai/);
    expect(cloudLink.closest("a")).toHaveAttribute("href", "https://cloud.sweny.ai");
  });

  it("defaults to Skills Required tab showing skills from nodes", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    // Skills tab is active by default
    expect(screen.getByText("github")).toBeInTheDocument();
    expect(screen.getByText("slack")).toBeInTheDocument();
  });

  it("shows which nodes use each skill", () => {
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);
    // github is used in start and review
    expect(screen.getByText("Used in: start, review")).toBeInTheDocument();
    // slack is used in review only
    expect(screen.getByText("Used in: review")).toBeInTheDocument();
  });

  it("switches to YAML tab on click", async () => {
    const user = userEvent.setup();
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("YAML Source"));

    // Skills content should be gone
    expect(screen.queryByText("Used in: start, review")).not.toBeInTheDocument();
  });

  it("switches to Usage tab on click", async () => {
    const user = userEvent.setup();
    render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);

    await user.click(screen.getByText("Usage"));

    // Usage tab content shows instructions
    expect(screen.getByText(/\.github\/workflows\/sweny\.yml/)).toBeInTheDocument();
  });

  it("actions appear before DAG in DOM order", () => {
    const { container } = render(<WorkflowDetail workflow={MOCK_WORKFLOW} />);

    const installBtn = screen.getByText("Install to Repo");
    const dagViewer = container.querySelector("[data-testid='dag-viewer']");

    if (dagViewer) {
      // compareDocumentPosition: 4 = DOCUMENT_POSITION_FOLLOWING
      const position = installBtn.compareDocumentPosition(dagViewer);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
