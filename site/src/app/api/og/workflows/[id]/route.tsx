import { ImageResponse } from "next/og";
import { getWorkflowById } from "@/lib/workflows";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = getWorkflowById(id);
  if (!workflow) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#050505",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.2), transparent 50%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.12), transparent 50%)",
          padding: "72px",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#3b82f6",
            marginBottom: 20,
            fontFamily: "monospace",
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          {`// ${workflow.source} · ${workflow.category}`}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: 24,
            lineHeight: 1.05,
          }}
        >
          {workflow.name}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            lineHeight: 1.4,
            maxWidth: 960,
          }}
        >
          {workflow.description}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 22,
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#fafafa", fontWeight: 600 }}>SWEny Workflows</span>
          <span>·</span>
          <span>{workflow.nodeCount} nodes</span>
          <span>·</span>
          <span>{workflow.skills.slice(0, 3).join(" · ")}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
