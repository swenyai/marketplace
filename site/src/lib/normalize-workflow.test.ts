import { describe, it, expect } from "vitest";
import { normalizeWorkflow } from "./normalize-workflow";

describe("normalizeWorkflow", () => {
  const minimal = {
    id: "wf-1",
    entry: "a",
    nodes: {
      a: { instruction: "Do thing A", skills: ["git"] },
      b: { instruction: "Do thing B", skills: ["github"] },
    },
    edges: [{ from: "a", to: "b" }],
  };

  it("returns a valid workflow unchanged in shape", () => {
    const result = normalizeWorkflow(minimal);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("wf-1");
    expect(result!.entry).toBe("a");
    expect(Object.keys(result!.nodes)).toEqual(["a", "b"]);
    expect(result!.edges).toHaveLength(1);
  });

  it("returns null for non-object input", () => {
    expect(normalizeWorkflow(null)).toBeNull();
    expect(normalizeWorkflow(undefined)).toBeNull();
    expect(normalizeWorkflow("yaml string")).toBeNull();
    expect(normalizeWorkflow(42)).toBeNull();
    expect(normalizeWorkflow([])).toBeNull();
  });

  it("returns null when id is missing", () => {
    expect(normalizeWorkflow({ ...minimal, id: undefined })).toBeNull();
    expect(normalizeWorkflow({ ...minimal, id: 42 })).toBeNull();
  });

  it("returns null when entry is missing", () => {
    expect(normalizeWorkflow({ ...minimal, entry: undefined })).toBeNull();
  });

  it("returns null when nodes is not an object", () => {
    expect(normalizeWorkflow({ ...minimal, nodes: null })).toBeNull();
    expect(normalizeWorkflow({ ...minimal, nodes: "nodes" })).toBeNull();
    expect(normalizeWorkflow({ ...minimal, nodes: [] })).toBeNull();
  });

  it("returns null when the entry node is not in the nodes map", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "ghost",
      nodes: { a: { skills: [] } },
    });
    expect(result).toBeNull();
  });

  it("defaults skills to an empty array when missing (the main crash fix)", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { instruction: "Do A" },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.nodes.a.skills).toEqual([]);
  });

  it("defaults skills to an empty array when it's null or undefined", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: null },
        b: { skills: undefined },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.nodes.a.skills).toEqual([]);
    expect(result!.nodes.b.skills).toEqual([]);
  });

  it("defaults skills to an empty array when it's not an array", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: "git" },
      },
    });
    expect(result!.nodes.a.skills).toEqual([]);
  });

  it("filters non-string entries out of skills", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: ["git", 42, null, "github", { id: "x" }] },
      },
    });
    expect(result!.nodes.a.skills).toEqual(["git", "github"]);
  });

  it("drops invalid nodes rather than crashing", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: [] },
        b: null,
        c: "not an object",
        d: { skills: ["git"] },
      },
    });
    expect(result).not.toBeNull();
    expect(Object.keys(result!.nodes).sort()).toEqual(["a", "d"]);
  });

  it("defaults node name to the node id when missing", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "setup",
      nodes: { setup: { instruction: "Run setup" } },
    });
    expect(result!.nodes.setup.name).toBe("setup");
  });

  it("defaults node instruction to empty string when missing", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: { a: {} },
    });
    expect(result!.nodes.a.instruction).toBe("");
  });

  it("treats missing edges as an empty array", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: { a: { skills: [] } },
    });
    expect(result!.edges).toEqual([]);
  });

  it("drops edges with missing endpoints", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: [] },
        b: { skills: [] },
      },
      edges: [
        { from: "a", to: "b" },
        { from: "a", to: "ghost" }, // drop
        { from: 42, to: "b" }, // drop
        { from: "a" }, // drop
        null, // drop
      ],
    });
    expect(result!.edges).toEqual([{ from: "a", to: "b" }]);
  });

  it("preserves the 'when' condition on edges", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { skills: [] },
        b: { skills: [] },
      },
      edges: [{ from: "a", to: "b", when: "status == 'ok'" }],
    });
    expect(result!.edges[0].when).toBe("status == 'ok'");
  });

  it("falls back name to id when not provided", () => {
    const result = normalizeWorkflow({
      id: "my-wf",
      entry: "a",
      nodes: { a: { skills: [] } },
    });
    expect(result!.name).toBe("my-wf");
  });

  it("defaults description to empty string", () => {
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: { a: { skills: [] } },
    });
    expect(result!.description).toBe("");
  });

  it("handles the partial-streaming case where only some nodes have arrived", () => {
    // During streaming, the LLM may emit the entry node with fields
    // but the referenced second node hasn't been parsed yet.
    const result = normalizeWorkflow({
      id: "wf",
      entry: "a",
      nodes: {
        a: { instruction: "Step 1" }, // no skills field yet
      },
      edges: [{ from: "a", to: "b" }], // b not yet present
    });
    expect(result).not.toBeNull();
    expect(result!.nodes.a.skills).toEqual([]);
    // Edge to missing b is dropped rather than crashing the viewer.
    expect(result!.edges).toEqual([]);
  });
});
