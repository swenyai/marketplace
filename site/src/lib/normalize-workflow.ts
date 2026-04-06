/**
 * Normalizes a workflow-like object parsed from streaming LLM YAML so
 * it can be safely handed to `@sweny-ai/studio`'s viewer.
 *
 * The studio's `workflowToFlow` transform assumes every node has a
 * `skills` array and every edge has `from`/`to`/`when`. Models
 * reliably omit these, which crashes the viewer mid-stream. This
 * function fills in the blanks without hiding real schema errors —
 * it returns null unless the workflow has the minimum viable shape
 * (an id, an entry, and at least one node that exists in `nodes`).
 */

import type { Workflow, Node, Edge } from "@sweny-ai/core";

/** Return true when value is a non-null object (excluding arrays). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNode(id: string, raw: unknown): Node | null {
  if (!isRecord(raw)) return null;
  const skills = Array.isArray(raw.skills)
    ? raw.skills.filter((s): s is string => typeof s === "string")
    : [];
  const name = typeof raw.name === "string" ? raw.name : id;
  const instruction =
    typeof raw.instruction === "string" ? raw.instruction : "";
  const node: Node = { name, instruction, skills };
  if (isRecord(raw.output)) {
    node.output = raw.output;
  }
  return node;
}

function normalizeEdge(raw: unknown): Edge | null {
  if (!isRecord(raw)) return null;
  const from = raw.from;
  const to = raw.to;
  if (typeof from !== "string" || typeof to !== "string") return null;
  const edge: Edge = { from, to };
  if (typeof raw.when === "string") edge.when = raw.when;
  if (typeof raw.max_iterations === "number") {
    edge.max_iterations = raw.max_iterations;
  }
  return edge;
}

/**
 * Best-effort normalization of a parsed YAML workflow. Returns null
 * when the workflow lacks a renderable minimum (id, entry, at least
 * one node matching entry).
 */
export function normalizeWorkflow(parsed: unknown): Workflow | null {
  if (!isRecord(parsed)) return null;

  const id = typeof parsed.id === "string" ? parsed.id : null;
  const entry = typeof parsed.entry === "string" ? parsed.entry : null;
  if (!id || !entry) return null;

  if (!isRecord(parsed.nodes)) return null;

  const nodes: Record<string, Node> = {};
  for (const [nodeId, raw] of Object.entries(parsed.nodes)) {
    const n = normalizeNode(nodeId, raw);
    if (n) nodes[nodeId] = n;
  }

  // The entry node must exist, otherwise the viewer has no root to
  // render and ELK will fail with a confusing error.
  if (!nodes[entry]) return null;

  const edgesRaw = Array.isArray(parsed.edges) ? parsed.edges : [];
  const edges: Edge[] = [];
  for (const raw of edgesRaw) {
    const e = normalizeEdge(raw);
    // Only keep edges whose endpoints exist in the normalized node set.
    if (e && nodes[e.from] && nodes[e.to]) edges.push(e);
  }

  return {
    id,
    name: typeof parsed.name === "string" ? parsed.name : id,
    description:
      typeof parsed.description === "string" ? parsed.description : "",
    entry,
    nodes,
    edges,
  };
}
