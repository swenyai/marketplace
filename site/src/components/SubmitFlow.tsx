"use client";

interface SubmitFlowProps {
  workflowId: string;
  workflowYaml: string;
  workflowName: string;
  disabled?: boolean;
}

const REPO = "swenyai/marketplace";

export function SubmitFlow({
  workflowId,
  workflowYaml,
  workflowName,
  disabled,
}: SubmitFlowProps) {
  // GitHub's "create new file" URL pre-populates the editor with our YAML.
  // When the user commits, GitHub auto-forks (if needed) and offers to open a PR.
  // No tokens, no OAuth — just the user's own github.com session.
  const filename = `${workflowId}.yml`;
  const url = `https://github.com/${REPO}/new/main/workflows/community?filename=${encodeURIComponent(
    filename
  )}&value=${encodeURIComponent(workflowYaml)}`;

  return (
    <a
      href={disabled ? undefined : url}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      className={`block w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      Submit &ldquo;{workflowName}&rdquo; to Marketplace
    </a>
  );
}
