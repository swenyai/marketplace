/**
 * Browser-safe shim for @sweny-ai/core/dist/skills/index.js
 *
 * The real module uses node:fs + node:path for custom skill discovery.
 * This shim provides the static builtin skill catalog as plain data —
 * enough for workflowToFlow() and getSkillCatalog() in the browser.
 */

const github = { id: "github", name: "GitHub", description: "Search code, manage issues and pull requests on GitHub", category: "git", config: {}, tools: [{ name: "github_search_code", description: "Search for code in a GitHub repository" }, { name: "github_get_issue", description: "Get details of a GitHub issue" }, { name: "github_search_issues", description: "Search issues and pull requests" }, { name: "github_create_issue", description: "Create a new GitHub issue" }, { name: "github_add_comment", description: "Add a comment to a GitHub issue or pull request" }, { name: "github_create_pr", description: "Create a pull request" }, { name: "github_list_recent_commits", description: "List recent commits on a branch" }, { name: "github_get_file", description: "Get a file's contents from a repository" }] };
const linear = { id: "linear", name: "Linear", description: "Create, search, and update issues in Linear", category: "tasks", config: {}, tools: [{ name: "linear_create_issue", description: "Create a new Linear issue" }, { name: "linear_search_issues", description: "Search Linear issues by text query" }, { name: "linear_add_comment", description: "Add a comment to a Linear issue" }, { name: "linear_get_issue", description: "Get a Linear issue by ID or identifier" }, { name: "linear_list_teams", description: "List Linear teams" }, { name: "linear_update_issue", description: "Update an existing Linear issue" }] };
const slack = { id: "slack", name: "Slack", description: "Send messages and notifications to Slack channels", category: "notification", config: {}, tools: [{ name: "slack_send_message", description: "Send a message to a Slack channel via webhook or API" }, { name: "slack_send_thread_reply", description: "Reply to an existing Slack message thread" }] };
const sentry = { id: "sentry", name: "Sentry", description: "Query errors, issues, and performance data from Sentry", category: "observability", config: {}, tools: [{ name: "sentry_list_issues", description: "List recent issues for a Sentry project" }, { name: "sentry_get_issue", description: "Get detailed information about a Sentry issue" }, { name: "sentry_get_issue_events", description: "Get recent events for a Sentry issue" }, { name: "sentry_search_events", description: "Search events across a project" }] };
const datadog = { id: "datadog", name: "Datadog", description: "Query logs, metrics, and monitors from Datadog", category: "observability", config: {}, tools: [{ name: "datadog_search_logs", description: "Search logs in Datadog" }, { name: "datadog_query_metrics", description: "Query time-series metrics from Datadog" }, { name: "datadog_list_monitors", description: "List Datadog monitors" }] };
const betterstack = { id: "betterstack", name: "BetterStack", description: "Query logs and manage telemetry sources in BetterStack", category: "observability", config: {}, tools: [{ name: "betterstack_list_sources", description: "List available telemetry sources" }, { name: "betterstack_get_source", description: "Get full details for a telemetry source" }, { name: "betterstack_get_source_fields", description: "Get queryable fields for a source table" }, { name: "betterstack_query", description: "Execute a read-only ClickHouse SQL query" }] };
const notification = { id: "notification", name: "Notification", description: "Send notifications via webhook, Discord, Teams, or email", category: "notification", config: {}, tools: [{ name: "notify_webhook", description: "Send a JSON payload to a webhook URL" }, { name: "notify_discord", description: "Send a message to Discord via webhook" }, { name: "notify_teams", description: "Send a message to Microsoft Teams via webhook" }] };
const supabase = { id: "supabase", name: "Supabase", description: "Query, insert, update data and invoke edge functions on a Supabase project", category: "general", config: {}, tools: [{ name: "supabase_query", description: "Query rows from a Supabase table" }, { name: "supabase_count", description: "Count rows in a table" }, { name: "supabase_insert", description: "Insert one or more rows into a table" }, { name: "supabase_update", description: "Update rows matching filters" }, { name: "supabase_delete", description: "Delete rows matching filters" }, { name: "supabase_rpc", description: "Call a Supabase RPC" }, { name: "supabase_invoke_function", description: "Invoke a Supabase Edge Function" }, { name: "supabase_list_users", description: "List auth users" }, { name: "supabase_list_tables", description: "List all public tables with row counts" }] };

export { github, linear, slack, sentry, datadog, betterstack, notification, supabase };

export const builtinSkills = [github, linear, slack, sentry, datadog, betterstack, notification, supabase];

export function createSkillMap(skills) {
  const map = new Map();
  for (const skill of skills) map.set(skill.id, skill);
  return map;
}

export function allSkills() {
  return createSkillMap(builtinSkills);
}

export function isSkillConfigured() { return false; }
export function configuredSkills() { return []; }
export function loadCustomSkills() { return []; }
export function validateWorkflowSkills() {
  return { configured: [], missing: [], errors: [], warnings: [] };
}
