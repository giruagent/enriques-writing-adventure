# Deployment runbook

The site is published at **https://giruagent.github.io/enriques-writing-adventure/**
from a static Next.js export. GitHub Pages serves the files; a GitHub Actions workflow
builds them on every push to `main`.

## How the pipeline works

`.github/workflows/pages.yml` runs on `push` to `main` and on manual dispatch:

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
# from a clean main
npm ci
npm run lint && npm run typecheck && npm test
npm run test:e2e
git push origin main          # triggers the workflow
gh run watch                  # or: gh run list --limit 3
```

Commit messages are imperative with a conventional prefix (`feat:`, `fix:`, `docs:`,
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

# 2. A changed asset matches the local build byte for byte
sha256sum public/name-house/casa_nivel_10.png
curl -s "$BASE"name-house/casa_nivel_10.png | sha256sum

# 3. The shell mentions the expected version and screens
curl -s "$BASE" | grep -o 'v1\.[0-9]*\.[0-9]*' | sort -u

# 4. The deployment run succeeded
gh run list --workflow=pages.yml --limit 1
```

A hash mismatch right after a deploy is usually CDN propagation (a few seconds) or a
stale `sw.js` in the browser. Re-request with a cache-busting query before assuming a
failure.

## Rollback

Fastest option — revert the commit and let the pipeline republish:

```sh
git revert --no-edit <bad-commit>
git push origin main
gh run watch
```

If the build itself is broken and you need the previous site immediately, publish the
last known-good tree:

```sh
git checkout <good-commit> -- .        # keep history, stage the old tree
git commit -m "fix: restore version X.Y.Z"
git push origin main
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
(`deploy: version X.Y.Z` commits) and letting Pages serve that branch. That branch is
kept only as an archive of previous builds. New deployments must go through the
workflow so the build is reproducible from source.
