# Repository guide for people and agents

This file is the entry point for anyone — human or automated — who has to change this
project. It describes what the app is, where the code lives, which rules must not be
broken, and how to verify and ship a change.

If you are an agent: read this file completely before editing, then follow the
*Verification* and *Release checklist* sections literally. Do not infer behaviour from
the README release-notes section alone; the notes are a changelog, this file is the
operating manual.

## What the app is

An iPad-first, local-only writing game for a young child. Three adventures teach the
child's own name, the alphabet and the numbers 0–9. Everything runs in the browser:
no accounts, no backend, no analytics, no network requests at runtime.

Constraints that shape every decision:

- **Static export only.** `next.config.ts` sets `output: 'export'`; the site is plain
  HTML/JS/CSS in `out/`. There is no server, so no API routes, no server actions, no
  middleware and no runtime image optimisation (`images.unoptimized: true`).
- **Progress lives in `localStorage`** under the single key `enrique-adventure-v1`.
  There is no backup and no sync. Clearing site data destroys progress.
- **The target device is an iPad in Safari**, often installed to the Home Screen and
  used offline. Touch, palm and orientation behaviour matters more than desktop.
- **A child uses it unsupervised**, so every grown-up action sits behind a child
  barrier and the game never pretends to grade handwriting.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript, static export.
- Plain CSS in `app/style.css` — no CSS framework, no CSS-in-JS, no Tailwind.
- Vitest for unit tests, Playwright (Chromium) for end-to-end tests.
- GitHub Pages for hosting, GitHub Actions for CI/CD.

## Branch and pull request workflow

**Never make project changes directly on `main` or push commits directly to it.**
Before editing, check the current branch and working tree. If the current branch is
`main`, create a task branch from the latest `origin/main` first. Use a descriptive
prefix such as `feat/`, `fix/`, `docs/` or `chore/`.

Commit coherent, reviewable increments on that branch and push the branch so the user
can follow progress. Open or update a pull request targeting `main`; branch pushes and
pull requests run `.github/workflows/ci.yml`. Resolve failures and review the final diff
before merging the pull request into `main`. GitHub Pages deploys only after that merge.
Do not use a direct push to `main` as a shortcut. If a change must be abandoned, close
the pull request and delete its task branch after confirming it contains no needed work.

Repository instructions cannot enforce GitHub permissions. To make this rule mandatory
for all collaborators, configure `main` branch protection or a ruleset to require the
`Verify branch` check and disallow direct pushes and force pushes.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Mounts the game shell. |
| `app/layout.tsx`, `app/manifest.ts` | Document metadata and the PWA manifest. |
| `app/style.css` | All styling, including responsive and reduced-motion rules. |
| `components/Game.tsx` | The screen state machine: home map, play, victory, settings, album, trophies. Holds every user-facing bilingual string for these screens. |
| `components/Pad.tsx` | Pointer input, stroke capture, tolerance and the writing surface. |
| `components/StrokeDemo.tsx` | Animated "Watch how to write" replay. |
| `components/Album.tsx` | Evolution album and trophy book screens. |
| `lib/game.ts` | Guide paths, `evaluate`, the `Progress` model, storage load/save, level and stage derivation. |
| `lib/album.ts` | `albumStage` and `achievements` — pure derivations from `Progress`. |
| `lib/guides.ts` | Turns authored strokes into numbered, arrowed guides. |
| `lib/audio.ts` | `GameAudio`: synthesized music, speech, audio settings. |
| `lib/dragon.ts` | Dragon sprite crop metadata. |
| `public/` | Stage artwork, icons, manifest assets and `sw.js`. |
| `scripts/serve-export.mjs` | Static server used by the Playwright web server. |
| `tests/*.test.ts` | Unit tests (game logic, guides, audio, albums). |
| `tests/e2e/*.spec.ts` | End-to-end tests against the production export. |
| `.github/workflows/ci.yml` | Branch and pull request verification; never deploys. |
| `.github/workflows/pages.yml` | Build and deploy to GitHub Pages. |

## Section hero and map design

Name, Alphabet and Numbers share a single first-screen pattern: the app's existing
mint split hero, personalized greeting, short adventure-specific sentence, one clear
"Let's play"/"¡A jugar!" action and a large illustration of that section's progression.
Name uses the growing house; Alphabet uses the dragon; Numbers uses the alien. Keep the
hero copy and image specific to its adventure instead of showing Name copy in the other
sections. The `Dragon` and `Alien` progress widgets stay the single source of the image,
caption and section stage. The level and free-practice controls follow beneath the hero.

When adjusting this layout, verify it at 1280 px, 768 px and 390 px widths in both
languages; preserve sensible stacking on phones, the stage-specific progress pill,
keyboard focus visibility, and no horizontal overflow. The hero CTA is an in-page anchor
to the level list, not a new game action.

## Data model and invariants

`Progress` (in `lib/game.ts`) is the only persisted state:

- `name`, `caseMode` — the child's name and its display casing.
- `unlocked`, `completed` — legacy Name Adventure worlds (five original worlds).
- `levels: {name, alphabet, numbers}` — the ten sequenced levels of each section.
- `history` — every recorded exercise, tagged with `section`, `method`
  (`guided` or `adult`) and an optional `free` flag.
- `settings` — language, difficulty, sensitivity, thickness, mute, speech, music
  volume and `manualValidation`. `load()` validates and repairs every field.

Rules that must not regress:

1. **Each distinct completed level contributes once** to its section's stage, album
   and badges. Replays never add a stage or a level.
2. **Free practice never grants levels or badges**, except that the very first
   recorded exercise badge may count a free-practice entry.
3. **Name stages merge legacy worlds and section levels without double counting**
   (`nameHouseStage`).
4. **Locked stages never reveal artwork.** Previewing any stage grants nothing.
5. **Changing the name resets Name progress only**; settings survive.
   **Resetting all progress resets every section.**
6. **Badges derive from stored data at read time.** They are not persisted, so they
   must stay reconstructible from `levels`, `completed` and `history`.
7. `load()` must keep accepting older saves. New fields need a default in
   `initial()` and a guard in `load()`; never migrate by discarding the key.

## Artwork pipeline

All artwork is user-supplied and stored locally. Nothing is fetched at runtime.

- `public/name-house/casa_nivel_01.webp` … `casa_nivel_10.webp` — ten row-major panels
  cropped from the supplied 4460 × 1524 sheet (panel bounds 5 columns × 2 rows, each
  838 × 694 px), in ascending evolution order (cabin → mansion with pool). Transparency
  outside the rounded card is preserved; the crop must stay inside each panel's own
  frame so no neighbouring panel leaks in.
- `public/dragon/stage-1.png` … `stage-10.png` — crops of `supplied-sprite.jpg`
  (source coordinates in `lib/dragon.ts`).
- `public/alien/alien_stage_01.png` … `alien_stage_10.png` — supplied images, unchanged.

Invariants for artwork:

- **Never rename or reorder the stage numbers.** Number, folder and stage order are the
  contract between saved progress, the album, the service worker and the deployed cache.
- The Name house set is WebP (quality 88, method 6, `alpha_quality=100`): about 110 KiB
  per panel and 1.1 MB for the ten, at three times the resolution of the previous PNG
  set. Re-encoding that set must keep every panel at 838 × 694 so `width`/`height` in
  `components/Game.tsx` and the assertions in the e2e suite stay true; if the size
  changes, update both in the same commit.
- A replacement sprite must keep the illustration recognisable at 320–420 CSS px.
- When artwork changes, bump the cache (see below) or installed clients keep the old
  bytes indefinitely.

## Service worker and offline rules

`public/sw.js` implements an app-shell cache with a versioned cache name
(`enrique-v1.10.1-adventure-books-nav` today).

- **Any change to a precached asset or to the shell requires a new cache name.**
  Keeping the same name means installed clients never receive the change.
- The precache list must include all 30 stage images, the manifest and both icons.
  A missing entry means that stage is unavailable offline.
- Changed artwork is requested with `{cache: 'reload'}` so the HTTP cache cannot serve
  stale bytes during install.
- **Old caches are intentionally retained** so an open page keeps working across an
  update; the new worker waits for existing clients to close. Do not "fix" this by
  deleting old caches on activate.
- The worker must never cache cross-origin requests.

## Localization

Every visible string exists twice, inside the component that renders it
(`components/Game.tsx` uses `help`, `extra`, `strings` dictionaries; `Album.tsx` has
its own `names` map). There is no i18n library and no locale files.

- Add English and Spanish at the same time, in the same commit.
- Spanish uses `tú`-free, neutral phrasing addressed to the child, with correct
  accents (Álbum, evolución, Etapa, Números, Dragón).
- The `<html lang>` and manifest language follow the saved setting.
- Never machine-translate a new string without checking that it fits the button or
  card it lands in on a 768 × 1024 viewport.

## Accessibility

The app is used by a child and often by an adult reading it aloud.

- Screen changes move focus to the new heading (`tabIndex={-1}`); closing a book
  returns focus to the button that opened it.
- Stage changes are announced through a `role="status" aria-live="polite"` region.
- Interactive targets stay at least 44 × 44 CSS px; touch targets are not shrunk for
  density.
- `prefers-reduced-motion` disables the celebration, transitions and demo animation;
  the demo then renders fully drawn.
- Colour is never the only signal for locked/unlocked, earned/unearned or pass/fail.

## Verification

```sh
npm ci
npm run lint          # eslint, must stay at 0 errors
npm run typecheck     # tsc --noEmit
npm test              # vitest: game, guides, audio, album
npx playwright install chromium
npm run test:e2e      # builds + serves the real export, 58 specs today
npm run build         # static export into out/
```

Notes:

- The 4 `@next/next/no-img-element` warnings are expected: the export cannot use
  `next/image`. Do not silence them by switching components to `<Image />`.
- `npm run test:e2e` builds with `NEXT_PUBLIC_BASE_PATH=/enriques-writing-adventure`
  by default (see `playwright.config.ts`) and serves `out/` under that path. A root
  build is tested with `NEXT_PUBLIC_BASE_PATH=''`.
- Behaviour changes need a spec in `tests/e2e/` **and**, where the logic is pure, a
  unit test. Tests assert real rendered output, not mock calls.
- When verifying a deployed build, compare bytes, not page text: `sha256sum` a local
  asset against `curl` of the live URL, and check the `CACHE` constant in the live
  `sw.js`.

## Release checklist

1. Implement the change; keep asset paths and the storage key stable.
2. Bump `version` in `package.json` and the hardcoded `v…` string in the footer of
   `components/Game.tsx` (both exist; they must match).
3. Bump the cache name in `public/sw.js` if any precached asset or the shell changed.
4. Add a `## Version X.Y.Z` section to `README.md` describing behaviour, storage and
   offline consequences, and any manual device verification still pending.
5. Run the full verification sequence above; the e2e suite must be green.
6. Commit on the task branch with an imperative subject (`feat:`, `fix:`, `docs:`,
   `chore:`), push it and open/update a pull request to `main`. Never push directly to
   `main`.
7. Wait for `Verify branch` to pass, review the diff, then merge the pull request.
   The Pages workflow builds and deploys the merge on `main`.
8. Wait for the Pages workflow to succeed, then verify the live site as described in
   [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#verify-a-deployment).

## Known limitations

- Never verified on a physical iPad or with an Apple Pencil. Review the "Physical
  device checks" section of the README before claiming touch behaviour is proven.
- The tracing evaluator is a tolerant geometric comparison of coverage, proximity,
  stroke count and direction. It is **not** handwriting recognition and must never be
  described as grading.
- The grown-up gate (hold the gear, or answer `3 + 4`) is a child barrier, not a
  security control. Do not present it as authentication.
- Playwright WebKit cannot launch on the current CI host, so iOS-specific browser
  behaviour is untested.
