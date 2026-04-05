const REPO_OWNER = "swenyai";
const REPO_NAME = "marketplace";

/** Fork the marketplace repo (idempotent — returns existing fork if already forked) */
export async function forkRepo(token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/forks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok && res.status !== 202) {
    throw new Error(`Fork failed: ${res.status}`);
  }

  const fork = await res.json();
  return fork.full_name;
}

/** Create a branch, commit a file, and open a PR */
export async function submitWorkflow(
  token: string,
  forkFullName: string,
  workflowId: string,
  workflowYaml: string,
  workflowName: string
): Promise<string> {
  const [owner] = forkFullName.split("/");
  const branch = `add-${workflowId}`;
  const filePath = `workflows/community/${workflowId}.yml`;

  // Get the default branch SHA
  const mainRef = await fetch(
    `https://api.github.com/repos/${forkFullName}/git/ref/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  const mainData = await mainRef.json();
  const sha = mainData.object.sha;

  // Create branch
  await fetch(`https://api.github.com/repos/${forkFullName}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });

  // Create/update file
  await fetch(
    `https://api.github.com/repos/${forkFullName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add workflow: ${workflowName}`,
        content: btoa(unescape(encodeURIComponent(workflowYaml))),
        branch,
      }),
    }
  );

  // Open PR
  const prRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `Add: ${workflowName}`,
        body: `## New Workflow: ${workflowName}\n\nSubmitted via [marketplace.sweny.ai/create](https://marketplace.sweny.ai/create).\n\nPlease review the workflow YAML and DAG for correctness.`,
        head: `${owner}:${branch}`,
        base: "main",
      }),
    }
  );

  if (!prRes.ok) {
    const err = await prRes.json();
    throw new Error(err.message ?? "Failed to create PR");
  }

  const pr = await prRes.json();
  return pr.html_url;
}
