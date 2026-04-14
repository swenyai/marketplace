import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnvVarList } from "@/components/EnvVarList";
import type { DerivedVariable } from "@/lib/types";

describe("EnvVarList", () => {
  const vars: DerivedVariable[] = [
    { name: "GITHUB_TOKEN", description: "GitHub token", required: true, skill: "github" },
    { name: "SLACK_WEBHOOK_URL", description: "Slack webhook", required: false, skill: "slack" },
    { name: "SLACK_BOT_TOKEN", description: "Slack bot token", required: false, skill: "slack" },
  ];

  it("shows required vars by default", () => {
    render(<EnvVarList variables={vars} />);
    expect(screen.getByText("GITHUB_TOKEN")).toBeInTheDocument();
    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("hides optional vars behind a Show button", () => {
    render(<EnvVarList variables={vars} />);
    expect(screen.queryByText("SLACK_WEBHOOK_URL")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show optional/i })).toBeInTheDocument();
  });

  it("reveals optional vars when Show clicked", async () => {
    const user = userEvent.setup();
    render(<EnvVarList variables={vars} />);
    await user.click(screen.getByRole("button", { name: /show optional/i }));
    expect(screen.getByText("SLACK_WEBHOOK_URL")).toBeInTheDocument();
    expect(screen.getByText("SLACK_BOT_TOKEN")).toBeInTheDocument();
  });

  it("does not render Show button when no optional vars exist", () => {
    const requiredOnly = vars.filter((v) => v.required);
    render(<EnvVarList variables={requiredOnly} />);
    expect(screen.queryByRole("button", { name: /show optional/i })).not.toBeInTheDocument();
  });
});
