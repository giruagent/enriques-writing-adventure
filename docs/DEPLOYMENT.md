# Deployment runbook

The site is published at **https://giruagent.github.io/enriques-writing-adventure/**
from a static Next.js export. GitHub Pages serves the files; a GitHub Actions workflow
builds and deploys them after changes are merged into `main`.

## How the pipeline works

`.github/workflows/ci.yml` verifies pushes to task branches and pull requests targeting
`main`. It runs lint, typecheck, unit tests, Playwright installation and the full E2E
suite; it never deploys. `.github/workflows/pages.yml` runs on `push` to `main` and on
manual dispatch:

1. `npm ci` on Node 22.
2. `npm run build` with `NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure`.
   The base path must match the repository name, because every asset URL is
   root-relative and the export is served from `https://giruagent.github.io/<repo>/`.
3. `actions/upload-pages-artifact` packages `out/`.
4. `actions/deploy-pages` publishes it to Pages through OIDC.

The repository's Pages source is **GitHub Actions** (`build_type: workflow`). Do not
switch it back to a branch: a branch source ignores this workflow and the deployment
step fails.

## Normal release

```sh
# Start from an up-to-date main and create a task branch before editing.
git switch main
git pull --ff-only origin main
git switch -c feat/short-description

# Make and push reviewable increments on the task branch.
npm ci
npm run lint && npm run typecheck && npm test
npm run test:e2e
git push -u origin feat/short-description

# Open/update the pull request; each branch push is verified by GitHub Actions.
gh pr create --base main --fill
gh pr checks --watch

# After review and green checks, merge through the pull request.
gh pr merge --squash --delete-branch
# The merge to main triggers the Pages deployment.
gh run watch
```

Never push commits directly to `main`. Keep the pull request open while making
incremental changes so reviewers can follow the branch diff and CI results. Commit
messages are imperative with a conventional prefix (`feat:`, `fix:`, `docs:`,
`chore:`). A release also bumps `package.json`, the footer version string in
`components/Game.tsx`, the `CACHE` name in `public/sw.js`, and adds a
`## Version X.Y.Z` section to `README.md`. See `AGENTS.md` for the full checklist.

## Re-deploying without a code change

```sh
gh workflow run pages.yml --ref main
gh run list --workflow=pages.yml --limit 3
```

## Verify a deployment

Do not trust the workflow's green checkmark alone. Verify the bytes and the worker
version that the CDN is actually serving:

```sh
BASE=https://giruagent.github.io/enriques-writing-adventure/

# 1. The new service worker cache name is live
curl -s "$BASE"sw.js | head -1

# 2. The served worker matches the committed worker byte for byte
sha256sum public/sw.js
curl -fsS "$BASE"sw.js | sha256sum

# 3. The shell mentions the expected version and screens
curl -s "$BASE" | grep -o 'v1\.[0-9]*\.[0-9]*' | sort -u

# 4. The deployment run succeeded
gh run list --workflow=pages.yml --limit 1
```

A hash mismatch right after a deploy is usually CDN propagation (a few seconds) or a
stale `sw.js` in the browser. Re-request with a cache-busting query before assuming a
failure.

## Rollback

Revert through a task branch and pull request so the release history stays reviewable:

```sh
git switch main
git pull --ff-only origin main
git switch -c fix/revert-bad-release
git revert --no-edit <bad-commit>
git push -u origin fix/revert-bad-release
gh pr create --base main --fill
gh pr checks --watch
gh pr merge --squash --delete-branch
gh run watch
```

If the build itself is broken and you need the previous site immediately, restore the
last known-good tree on a task branch and merge it through a pull request:

```sh
git switch main
git pull --ff-only origin main
git switch -c fix/restore-version-x-y-z
git checkout <good-commit> -- .        # keep history, stage the old tree
git commit -m "fix: restore version X.Y.Z"
git push -u origin fix/restore-version-x-y-z
gh pr create --base main --fill
gh pr checks --watch
gh pr merge --squash --delete-branch
```

Avoid hand-editing files in `out/`: it is generated and git-ignored.

## Local preview of the production build

```sh
NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure npm run build
npx serve out        # or: PYTHONPATH= node scripts/serve-export.mjs
```

Open `http://localhost:3000/enriques-writing-adventure/` (the exact base path is
required — serving `out/` at the server root produces 404s for `_next` assets and
images). `npm run test:e2e` does this automatically on port 4173.

## Troubleshooting

- **404s for `_next/*`, images or `manifest.webmanifest`** — the build was made
  without the base path, or the path does not match the repository name. Rebuild with
  `NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure`.
- **Deployment job fails with "Pages site not found" / OIDC errors** — the Pages
  source is no longer `GitHub Actions`, or the `pages`/`id-token` permissions were
  removed from the workflow.
- **Site still serves old artwork or an old version after a deploy** — `public/sw.js`
  was not bumped, so installed clients keep the cached app shell. Bump `CACHE`,
  redeploy, then close and reopen the app online.
- **A stage image is missing offline** — it is absent from the precache list in
  `public/sw.js`.
- **`npm ci` fails in CI but works locally** — `package-lock.json` was not committed
  with `package.json`, or Node differs from 22.
- **Fonts/icons look wrong on Pages** — Jekyll processing; `public/.nojekyll` must
  exist in the export (it does; do not delete it).

## History note

Until v1.7.0 the site was published by committing the export to a `gh-pages` branch
(`deploy: version X.Y.Z` commits) and letting Pages serve that branch. That branch has
been deleted: it duplicated the build output and invited edits to generated files. The
only publishing path is now the workflow, which builds from source.

Do not recreate a publish branch. If an earlier version has to be served again, revert
the offending commit on `main` and let the workflow rebuild it, so the deployed files
always correspond to a commit in the repository history.
