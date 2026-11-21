# Enrique’s Writing Adventure

An iPad-first, local-only writing game. No accounts, analytics, or server-side data. Strokes are held in memory; settings, sessions, completed worlds, and validated exercise history are stored in localStorage on this browser/device. Clearing browser data removes progress. Storage may be unavailable in some private browsing or restricted environments.

## Run and verify

Requires Node 22.12+ (Node 22 LTS recommended).

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The build creates `out/`. By default it targets the domain root, including for Docker: `docker build -t enrique .` then `docker run --rm -p 8080:80 enrique`.

For GitHub Pages, build with `NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure npm run build` and publish the contents of `out/` to the configured `gh-pages` branch. The resulting site is intended for `https://<owner>.github.io/enriques-writing-adventure/`. Change the base path if the repository path changes. The export includes `.nojekyll` so GitHub serves Next.js `_next` assets.

To build the same project-path export locally, run `NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure npm run build`. Serve `out/` under that path, not at the server root. `npm run test:e2e` builds and serves that production export and exercises it with Playwright, including offline reload. To run the same tests for a root export, use `NEXT_PUBLIC_BASE_PATH='' npm run test:e2e`. The base path must be empty for root or start with `/` and have no trailing slash.

## How to play

Complete worlds in order. Guided letters use hand-authored single-line trajectories and compare sampled coverage and proximity; they are a tolerant practice aid, not handwriting recognition. Orange dots and numbers mark stroke starts; follow the dotted paths. The hidden letters and independent name always require explicit adult approval and are recorded as such. The dragon can be repeated. Hold the gear for two seconds to open the grown-up corner, where adults can change language, difficulty, tolerance, pencil thickness, sound and speech, open worlds directly, inspect history, and reset progress. Adult validation is mandatory for independent work. Stars represent completed worlds, not a grade. Direct world access is an adult override.

The service worker caches the loaded static app and same-origin static resources for offline use. Open the app online at least once and allow the service worker to install before going offline. A resource never loaded or unavailable during installation may not be available offline. Service workers require HTTPS or localhost. API requests are never cached. Updates use a versioned cache; increment the cache name in `public/sw.js` when releasing changes.

## Physical device checks

Not verified on a physical iPad or Apple Pencil in this environment. On iPad Safari, test finger and Pencil input, multi-stroke writing, palm rejection, orientation changes during and after drawing, undo/clear, the long-press gate, sound after a gesture, Spanish speech availability, add to Home Screen, then reload online and test offline after installation. Browser speech voices and Pencil/palm behavior depend on the device. The geometric evaluator uses tolerant stroke order, direction, continuity, coverage, and proximity checks, but cannot guarantee a correctly formed letter or reliably assess the direction of very short strokes; adult involvement remains useful.
