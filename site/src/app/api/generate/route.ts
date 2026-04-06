import { builtinSkills, workflowJsonSchema } from "@sweny-ai/core";
import { parseWorkflow, validateWorkflow } from "@sweny-ai/core/schema";
import { createRateLimiter, extractClientIp } from "./rate-limit";
import { validateGenerateInput } from "./validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const rateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

function jsonError(status: number, error: string, extraHeaders?: HeadersInit) {
  return Response.json({ error }, { status, headers: extraHeaders });
}

function buildSystemPrompt(): string {
  const skillList = builtinSkills
    .map((s) => `- ${s.id}: ${s.description}`)
    .join("\n");
  return [
    "You generate SWEny workflow definitions as YAML.",
    "",
    "## Workflow JSON Schema",
    "```json",
    JSON.stringify(workflowJsonSchema, null, 2),
    "```",
    "",
    "## Available Skills",
    skillList,
    "",
    "## Rules",
    "- Every workflow needs: id, name, description, entry, nodes, edges",
    "- Node instructions should be detailed and specific",
    "- Use only skills from the Available Skills list above",
    "- Include marketplace metadata: author, category, tags, version",
    "",
    "Respond with ONLY the YAML workflow definition. No markdown fences, no explanation, just the raw YAML.",
  ].join("\n");
}

function buildUserMessage(
  prompt: string,
  existingWorkflow: string | null
): string {
  return existingWorkflow
    ? `Refine this existing workflow based on the following instruction:\n\nInstruction: ${prompt}\n\nExisting workflow:\n\`\`\`yaml\n${existingWorkflow}\n\`\`\``
    : `Create a SWEny workflow for the following description:\n\n${prompt}\n\nInclude marketplace metadata fields: author (use "community"), category, tags, version (use "1.0.0"), icon, and color.`;
}

export async function POST(request: Request) {
  const ip = extractClientIp(request.headers);
  const rl = rateLimiter.check(ip);
  if (!rl.allowed) {
    return jsonError(429, "Rate limited. Try again in an hour.", {
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.floor(rl.resetAt / 1000)),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON");
  }

  const validation = validateGenerateInput(body);
  if (!validation.ok) {
    return jsonError(400, validation.error);
  }
  const { prompt, existingWorkflow } = validation.value;

  const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
  if (!token) {
    return jsonError(500, "AI not configured");
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(prompt, existingWorkflow);

  let response: Response;
  try {
    response = await fetch("https://ai-gateway.vercel.sh/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch {
    // Network-level failure reaching the gateway.
    return jsonError(502, "AI gateway unreachable");
  }

  if (!response.ok) {
    // Intentionally do NOT log the response body — it may echo auth
    // headers or token fragments from upstream.
    console.error(`AI Gateway error: status=${response.status}`);
    return jsonError(502, "AI generation failed");
  }

  if (!response.body) {
    return jsonError(502, "AI gateway returned empty response");
  }

  const upstreamBody = response.body;
  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.text) {
                const text = event.delta.text;
                fullText += text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "token", content: text })}\n\n`
                  )
                );
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }

        let valid = false;
        let errors: string[] = [];
        try {
          const { parse } = await import("yaml");
          const parsed = parse(fullText);
          const workflow = parseWorkflow(parsed);
          const validationErrors = validateWorkflow(workflow);
          if (validationErrors.length === 0) {
            valid = true;
          } else {
            errors = validationErrors.map((e) => e.message);
          }
        } catch (err) {
          errors = [err instanceof Error ? err.message : "Parse error"];
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "complete", yaml: fullText, valid, errors })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Stream error" })}\n\n`
          )
        );
        controller.close();
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // reader already released
        }
      }
    },
    async cancel(reason) {
      // Client disconnected — stop pulling from upstream.
      try {
        await upstreamBody.cancel(reason);
      } catch {
        // ignore
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(Math.floor(rl.resetAt / 1000)),
    },
  });
}
