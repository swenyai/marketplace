import type { Workflow, McpServerConfig } from "@sweny-ai/core";

export interface WorkflowVariable {
  name: string;
  description: string;
  required?: boolean;
}

export interface DerivedVariable {
  name: string;
  description: string;
  required: boolean;
  skill: string;
  /** Other env vars that satisfy the same requirement (e.g. OAuth token in place of API key) */
  alternatives?: string[];
}

/**
 * Static map of builtin skill ID → config fields.
 * Derived from @sweny-ai/core/skills/*.ts — kept static because
 * the marketplace site can't import the Node-only skill modules.
 */
/**
 * Static map of builtin skill ID → config fields.
 * Must match @sweny-ai/core builtinSkills exactly.
 * Kept static because the marketplace site can't import the Node-only skill modules.
 * Run `npm run check:skills` to verify parity with core.
 */
export const SKILL_CONFIG: Record<string, { env: string; description: string; required: boolean }[]> = {
  github: [{ env: "GITHUB_TOKEN", description: "GitHub personal access token or app installation token", required: true }],
  linear: [{ env: "LINEAR_API_KEY", description: "Linear API key", required: true }],
  slack: [
    { env: "SLACK_WEBHOOK_URL", description: "Slack incoming webhook URL", required: false },
    { env: "SLACK_BOT_TOKEN", description: "Slack bot token (for API calls)", required: false },
  ],
  sentry: [
    { env: "SENTRY_AUTH_TOKEN", description: "Sentry authentication token", required: true },
    { env: "SENTRY_ORG", description: "Sentry organization slug", required: true },
    { env: "SENTRY_BASE_URL", description: "Sentry base URL (default: https://sentry.io)", required: false },
  ],
  datadog: [
    { env: "DD_API_KEY", description: "Datadog API key", required: true },
    { env: "DD_APP_KEY", description: "Datadog application key", required: true },
    { env: "DD_SITE", description: "Datadog site (e.g., datadoghq.eu). Default: datadoghq.com", required: false },
  ],
  betterstack: [
    { env: "BETTERSTACK_API_TOKEN", description: "BetterStack Telemetry API token (team-scoped)", required: true },
    { env: "BETTERSTACK_QUERY_ENDPOINT", description: "ClickHouse HTTP endpoint (e.g. https://eu-fsn-3-connect.betterstackdata.com)", required: true },
    { env: "BETTERSTACK_QUERY_USERNAME", description: "ClickHouse connection username", required: true },
    { env: "BETTERSTACK_QUERY_PASSWORD", description: "ClickHouse connection password", required: true },
  ],
  notification: [
    { env: "NOTIFICATION_WEBHOOK_URL", description: "Generic webhook URL for notifications", required: false },
    { env: "DISCORD_WEBHOOK_URL", description: "Discord webhook URL", required: false },
    { env: "TEAMS_WEBHOOK_URL", description: "Microsoft Teams webhook URL", required: false },
    { env: "SMTP_URL", description: "SMTP connection URL for email notifications", required: false },
  ],
  supabase: [
    { env: "SUPABASE_URL", description: "Supabase project URL (e.g., https://xxxx.supabase.co)", required: true },
    { env: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key (full access, server-side only)", required: true },
  ],
};

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
  customSkills: Record<string, { name?: string; description?: string; instruction?: string; mcp?: McpServerConfig }>;
  /** Auto-derived environment variables from the workflow's skills */
  derivedVariables: DerivedVariable[];
  /** Sample output shown on the detail page */
  sampleOutput?: string;
}

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
