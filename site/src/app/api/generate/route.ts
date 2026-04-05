import { builtinSkills, workflowJsonSchema } from "@sweny-ai/core";
import { parseWorkflow, validateWorkflow } from "@sweny-ai/core/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now >= entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) {
    return Response.json(
      { error: "Rate limited. Try again in an hour." },
      { status: 429 }
    );
  }

  const { prompt, existingWorkflow } = await request.json();
  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return Response.json({ error: "Invalid prompt" }, { status: 400 });
  }

  const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
  if (!token) {
    return Response.json({ error: "AI not configured" }, { status: 500 });
  }

  const skillList = builtinSkills
    .map((s) => `- ${s.id}: ${s.description}`)
    .join("\n");
  const systemPrompt = [
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

  const userMessage = existingWorkflow
    ? `Refine this existing workflow based on the following instruction:\n\nInstruction: ${prompt}\n\nExisting workflow:\n\`\`\`yaml\n${existingWorkflow}\n\`\`\``
    : `Create a SWEny workflow for the following description:\n\n${prompt}\n\nInclude marketplace metadata fields: author (use "community"), category, tags, version (use "1.0.0"), icon, and color.`;

  const response = await fetch("https://ai-gateway.vercel.sh/v1/messages", {
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

  if (!response.ok) {
    const err = await response.text();
    console.error("AI Gateway error:", err);
    return Response.json({ error: "AI generation failed" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
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
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
