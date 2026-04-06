/**
 * Input validation for the generate endpoint. Extracted so the rules
 * can be unit-tested without spinning up Next's request pipeline.
 */

export const MAX_PROMPT_LENGTH = 8000;
export const MAX_EXISTING_WORKFLOW_LENGTH = 50_000;

export type ValidatedInput = {
  prompt: string;
  existingWorkflow: string | null;
};

export type ValidationResult =
  | { ok: true; value: ValidatedInput }
  | { ok: false; error: string };

export function validateGenerateInput(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be an object" };
  }
  const record = body as Record<string, unknown>;

  const { prompt, existingWorkflow } = record;

  if (typeof prompt !== "string") {
    return { ok: false, error: "Invalid prompt" };
  }
  if (prompt.trim().length === 0) {
    return { ok: false, error: "Invalid prompt" };
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`,
    };
  }

  let existing: string | null = null;
  if (existingWorkflow != null) {
    if (typeof existingWorkflow !== "string") {
      return { ok: false, error: "existingWorkflow must be a string" };
    }
    if (existingWorkflow.length > MAX_EXISTING_WORKFLOW_LENGTH) {
      return {
        ok: false,
        error: `existingWorkflow too long (max ${MAX_EXISTING_WORKFLOW_LENGTH} characters)`,
      };
    }
    existing = existingWorkflow;
  }

  return { ok: true, value: { prompt, existingWorkflow: existing } };
}
