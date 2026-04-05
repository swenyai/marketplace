# Contributing Workflows

Thanks for contributing to the SWEny Workflow Marketplace!

## Quick Start

1. **Use the AI creator** at [marketplace.sweny.ai/create](https://marketplace.sweny.ai/create) — describe your workflow in plain English and submit directly.

2. **Or submit manually:**
   - Fork this repo
   - Add your workflow YAML to `workflows/community/`
   - Open a PR

## Workflow Format

```yaml
id: my-workflow                       # Unique, URL-safe (a-z, 0-9, hyphens)
name: My Workflow                     # Display name
description: What this workflow does  # 10-300 characters
author: your-github-username          # Your GitHub username
category: security                    # One of: triage, security, devops, code-review, testing, content, ops
tags: [tag1, tag2]                    # 1-10 searchable tags
version: 1.0.0                        # Semver
sweny_version: ">=4.0.0"              # Optional: engine compatibility

entry: first_node
nodes:
  first_node:
    name: First Step
    instruction: What Claude should do at this step
    skills: [github]                  # Available skills: github, linear, slack, sentry, datadog, betterstack, supabase
edges:
  - from: first_node
    to: second_node
```

## Validation

CI automatically validates your workflow on PR:
- YAML structure and DAG integrity
- Required metadata fields
- No duplicate IDs
- A rendered DAG diagram is posted as a PR comment

## Guidelines

- Keep workflows focused — one clear purpose per workflow
- Write clear, specific node instructions
- Test your workflow locally with `sweny workflow run your-file.yml` before submitting
- Use descriptive tags for discoverability
