---
name: vercel-ci
description: Set up Vercel CI for a private GitHub Turborepo linked to Vercel and open the pull request that turns it on. Use when asked to set up, onboard, enable, or add Vercel CI for a repository, to choose which Turborepo tasks Vercel CI runs, or to upgrade Turborepo for Vercel CI.
---

# Vercel CI Setup

Open one pull request that gets this repository's checks running on Vercel CI. Use whatever tools you have.

The [Vercel CI documentation](https://vercel.com/docs/ci) is the source of truth; read it first. Fall back on [references/vercel-ci.md](references/vercel-ci.md) for what the documentation does not cover, or when it is unavailable.

## Steps

1. Find the repository. It must be a private GitHub repository linked to a Vercel project on the team, and it must use Turborepo. If not, stop and explain why.
2. If a setup pull request from an earlier run is still open, report it instead of opening another.
3. Choose tasks, as described below.
4. Make the change: upgrade Turborepo if it is below the documented minimum, opt the chosen tasks in to Vercel CI while keeping existing task properties and comments, and run them.
5. Enable Vercel CI, then publish the branch and open one pull request titled "Set up Vercel CI".
6. Report the pull request, the tasks you enabled, the tasks you left out and why, and the Vercel CI run once it appears.

## Choosing tasks

- Select a task unless there is evidence that it needs secrets, deployments, or running services. When unsure, select it and say so.
- Select a build only when GitHub Actions already runs it without secrets; builds often read environment variables that Turborepo never declares.
- Decide per package. A shared task can qualify in one package and not in another.
- Keep a task that already fails on the default branch, and flag it.
- List the selected tasks and the ones you left out, with reasons, in the pull request, and in your plan if you make one, so the user can ask for more.

## Rules

- Vercel CI must be enabled before the setup branch reaches GitHub, because the first push creates the first run. If you cannot enable it, do not publish.
- If publishing fails, leave Vercel CI enabled.
- If the Vercel CI run fails for a reason you did not already flag, read the failed tasks' logs and explain the cause and the fix. Fix it in the pull request only when the setup caused it, such as a missing tag or environment variable declaration; report anything else, such as a bug in the code under test.
- Never opt in a persistent task, such as a dev server, even when asked. It never exits, so the run never finishes; explain this and suggest a short task that starts it, checks it, and exits.
- Never hand-edit a lockfile, change GitHub Actions workflows, or merge the pull request.
- If nobody can answer questions, do not wait for a reply: use these defaults, or stop and explain the blocker.
