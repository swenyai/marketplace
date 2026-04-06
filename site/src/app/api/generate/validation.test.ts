import { describe, it, expect } from "vitest";
import {
  validateGenerateInput,
  MAX_PROMPT_LENGTH,
  MAX_EXISTING_WORKFLOW_LENGTH,
} from "./validation";

describe("validateGenerateInput", () => {
  it("rejects a null body", () => {
    const result = validateGenerateInput(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/object/);
  });

  it("rejects a non-object body", () => {
    const result = validateGenerateInput("hello");
    expect(result.ok).toBe(false);
  });

  it("rejects a missing prompt", () => {
    const result = validateGenerateInput({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid prompt");
  });

  it("rejects a non-string prompt", () => {
    const result = validateGenerateInput({ prompt: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid prompt");
  });

  it("rejects an empty prompt", () => {
    const result = validateGenerateInput({ prompt: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects a whitespace-only prompt", () => {
    const result = validateGenerateInput({ prompt: "   \n\t  " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid prompt");
  });

  it("accepts a minimal valid prompt", () => {
    const result = validateGenerateInput({ prompt: "Hello" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.prompt).toBe("Hello");
      expect(result.value.existingWorkflow).toBeNull();
    }
  });

  it("accepts a prompt at exactly the max length", () => {
    const prompt = "x".repeat(MAX_PROMPT_LENGTH);
    const result = validateGenerateInput({ prompt });
    expect(result.ok).toBe(true);
  });

  it("rejects a prompt over the max length", () => {
    const prompt = "x".repeat(MAX_PROMPT_LENGTH + 1);
    const result = validateGenerateInput({ prompt });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too long/);
  });

  it("treats an absent existingWorkflow as null", () => {
    const result = validateGenerateInput({ prompt: "Hello" });
    if (result.ok) expect(result.value.existingWorkflow).toBeNull();
  });

  it("accepts a string existingWorkflow", () => {
    const result = validateGenerateInput({
      prompt: "Refine",
      existingWorkflow: "id: foo\nnodes: {}",
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.existingWorkflow).toBe("id: foo\nnodes: {}");
  });

  it("rejects a non-string existingWorkflow", () => {
    const result = validateGenerateInput({
      prompt: "Refine",
      existingWorkflow: 42,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long existingWorkflow", () => {
    const result = validateGenerateInput({
      prompt: "Refine",
      existingWorkflow: "x".repeat(MAX_EXISTING_WORKFLOW_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
  });

  it("accepts an existingWorkflow at exactly the max length", () => {
    const result = validateGenerateInput({
      prompt: "Refine",
      existingWorkflow: "x".repeat(MAX_EXISTING_WORKFLOW_LENGTH),
    });
    expect(result.ok).toBe(true);
  });
});
