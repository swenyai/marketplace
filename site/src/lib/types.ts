import type { Workflow } from "@sweny-ai/core";

export interface WorkflowVariable {
  name: string;
  description: string;
  required?: boolean;
  alternatives?: { name: string; description: string }[];
}

export interface MarketplaceMetadata {
  author: string;
  category: Category;
  tags: string[];
  icon?: string;
  color?: CardColor;
  version: string;
  sweny_version?: string;
  variables?: WorkflowVariable[];
}

export type Category =
  | "triage"
  | "security"
  | "devops"
  | "code-review"
  | "testing"
  | "content"
  | "ops";

export type CardColor =
  | "blue"
  | "red"
  | "purple"
  | "orange"
  | "green"
  | "yellow"
  | "cyan"
  | "amber";

export interface MarketplaceWorkflow extends Workflow, MarketplaceMetadata {
  source: "official" | "community";
  filePath: string;
  nodeCount: number;
  edgeCount: number;
  skills: string[];
  /** Inline custom skills defined in the workflow's skills block */
  customSkills: Record<string, { name?: string; description?: string; instruction?: string; mcp?: any }>;
}

export const DEFAULT_VARIABLES: WorkflowVariable[] = [
  {
    name: "ANTHROPIC_API_KEY",
    description: "Anthropic API key for Claude",
    required: true,
    alternatives: [
      { name: "CLAUDE_CODE_OAUTH_TOKEN", description: "Claude Code OAuth token" },
    ],
  },
];

export const CATEGORIES: Record<
  Category,
  { label: string; icon: string; color: CardColor }
> = {
  triage: { label: "Triage", icon: "alert-triangle", color: "blue" },
  security: { label: "Security", icon: "shield", color: "red" },
  devops: { label: "DevOps", icon: "server", color: "orange" },
  "code-review": { label: "Code Review", icon: "git-pull-request", color: "purple" },
  testing: { label: "Testing", icon: "check-circle", color: "green" },
  content: { label: "Content", icon: "file-text", color: "yellow" },
  ops: { label: "Ops", icon: "activity", color: "cyan" },
};

export const COLOR_MAP: Record<CardColor, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-950/50", border: "border-blue-800", text: "text-blue-400" },
  red: { bg: "bg-red-950/50", border: "border-red-800", text: "text-red-400" },
  purple: { bg: "bg-purple-950/50", border: "border-purple-800", text: "text-purple-400" },
  orange: { bg: "bg-orange-950/50", border: "border-orange-800", text: "text-orange-400" },
  green: { bg: "bg-green-950/50", border: "border-green-800", text: "text-green-400" },
  yellow: { bg: "bg-yellow-950/50", border: "border-yellow-800", text: "text-yellow-400" },
  cyan: { bg: "bg-cyan-950/50", border: "border-cyan-800", text: "text-cyan-400" },
  amber: { bg: "bg-amber-950/50", border: "border-amber-800", text: "text-amber-400" },
};
