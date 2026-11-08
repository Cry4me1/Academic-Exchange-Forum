# Vercel CI Details

Facts the [Vercel CI documentation](https://vercel.com/docs/ci) doesn't cover.

If the documentation is unavailable, say so in the pull request and use these: Turborepo must be 2.11.7 or later, and tasks opt in with `"tags": ["ci"]` in the root `turbo.json`, or in a package's `turbo.json` (with `"extends": ["//"]`) for that package only.

## Repository settings

Read the settings. The repository is enabled when `ciEnabledAt` is present.

```bash
vercel api "/v1/vercel-ci/repository-settings?provider=github&organizationId=<owner>&repository=<repo>" --scope <team> --raw
```

To enable it, run `vercel ci enable --remote <remote> --scope <team>`. If `vercel ci enable --help` shows your CLI doesn't have that command, send a `PATCH` instead:

```bash
printf '%s\n' '{"ciEnabled":true}' | vercel api "/v1/vercel-ci/repository-settings?provider=github&organizationId=<owner>&repository=<repo>" --scope <team> --method PATCH --input - --raw
```

Then read the settings again to confirm.

## Finding the run

Runs are created asynchronously after the push, so poll briefly:

```bash
vercel ci list --branch <branch> --commit <sha> --scope <team> --json
```

A run's dashboard URL is `https://vercel.com/<team-slug>/~/ci/<invocation-id>`. Read a run's logs with `vercel ci logs <invocation-id> --scope <team>`.
