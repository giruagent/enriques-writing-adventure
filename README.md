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

Complete worlds in order. Guided letters use hand-authored single-line trajectories and compare sampled coverage and proximity; they are a tolerant practice aid, not handwriting recognition. Numbered labels point to stroke starts; follow the arrows and dotted paths. The hidden letters and independent name always require explicit adult approval and are recorded as such. The dragon can be repeated. Hold the gear for two seconds to open the grown-up corner, where adults can change language, difficulty, tolerance, pencil thickness, sound and speech, open worlds directly, inspect history, and reset progress. Adult validation is mandatory for independent work. Stars represent completed worlds, not a grade. Direct world access is an adult override.

The service worker caches the loaded static app and same-origin static resources for offline use. Open the app online at least once and allow the service worker to install before going offline. A resource never loaded or unavailable during installation may not be available offline. Service workers require HTTPS or localhost. API requests are never cached. Updates use a versioned cache; increment the cache name in `public/sw.js` when releasing changes.

## Physical device checks

Not verified on a physical iPad or Apple Pencil in this environment. On iPad Safari, test finger and Pencil input, multi-stroke writing, palm rejection, orientation changes during and after drawing, undo/clear, the long-press gate, sound after a gesture, Spanish speech availability, add to Home Screen, then reload online and test offline after installation. Browser speech voices and Pencil/palm behavior depend on the device. The geometric evaluator uses tolerant stroke order, direction, continuity, coverage, and proximity checks, but cannot guarantee a correctly formed letter or reliably assess the direction of very short strokes; adult involvement remains useful.

## Music and voice

The Sound button in the header mutes all game audio. The grown-up corner has separate background music and spoken feedback switches and a music volume slider; these preferences are saved alongside existing progress. Music defaults to a moderate level and is an original synthesized melody generated on the device, without an audio download. Spoken feedback defaults on and can be changed in the grown-up corner. It provides encouragement, hints, review prompts and victory feedback as well as the instruction button. A new instruction replaces any speech already playing.

Music begins only after a tap or key press and pauses when the page is hidden. After returning, tap again to resume. iPad Safari may also require a fresh gesture after an interruption or setting change. Voice uses the device's Web Speech voices: speech may be unavailable, may require a user gesture, and may not work offline even when the game and synthesized music do. The visible feedback remains available without speech. Offline use still requires the initial service-worker installation described above; verify audio on the actual iPad and with its silent mode and volume settings.

## Version 1.2.0 release notes

The game now includes Name Adventure, Alphabet (uppercase and lowercase), and Numbers (0–9), all using ordered hand-drawn centerline guides and the same geometric tracing checks. Choose a character from its section. Hidden letters and independent writing still require a grown-up's judgment; the game does not recognize free writing. Name Adventure scales to the selected name, with title, uppercase, or lowercase practice. A grown-up can hold the gear and enter a name of 1–20 letters A–Z or Ñ; other accented letters, spaces and other characters are not supported. Spanish alphabet practice includes Ñ after N. Confirming a different name resets only Name Adventure worlds and history, while settings remain. Existing data migrates as Enrique. Data remains local to this browser.

That release displayed v1.2.0. To receive an update, connect to the internet, close all open copies of the app, and reopen it; reload again if the old version still appears. The new service worker waits for old pages to close, so an active game is not replaced mid-session. Old version caches are retained to protect active pages and may consume storage; clearing website data removes both caches and progress. Open the app online once before using it offline.

Music uses an on-device synthesized signal and begins after a user gesture. The Sound button mutes both voice and music; music and speech can also be controlled separately in the grown-up corner. Music pauses during speech. If playback cannot start, check device volume and silent mode, then tap Sound again. Device and browser restrictions can still prevent audio or speech.

The guides use one selected print-letter formation; handwriting curricula and individual letter forms vary. E, F, P, R, M, N and n use separate strokes beginning at the top, but the guides have not received a pedagogical professional review and are not a substitute for a teacher’s guidance.

## Version 1.3.0

Each section now has ten sequential levels. Alphabet and Numbers also retain their free-practice character pickers; free practice does not build the mansion. Alphabet levels use the selected uppercase or lowercase mode. Name Adventure keeps the original five worlds and adds five guided name-writing worlds. Adult controls can open any level directly. Each completed level contributes once to the mansion, even when replayed; its illustrated progress is saved locally. Independent name exercises still require an adult's explicit review.

The first level in each section includes replayable English and Spanish visual and spoken drawing instructions and a more forgiving tracing check. Follow the numbered starts in order, lift between strokes, and use Check or Clear to retry. Other levels retain the existing geometric checks. These checks are practice aids, not handwriting recognition.

Existing v1.2 saves remain under the same local storage key. Completed name worlds and history are retained; completing the original fifth world unlocks the sixth. New Alphabet and Numbers levels start uncompleted. No backup or server copy exists, so clearing browser storage still removes local data. The v1.3.0 service worker installs a new cache while retaining old caches for open pages, and the existing close/reopen refresh instructions still apply.

## Version 1.3.1: grown-up access

Hold Grown-ups for two seconds, or tap it (or activate it with a keyboard or screen reader) and answer the simple 3 + 4 check. This is a child barrier, not security. Cancel or Escape closes the check without changing progress; reset still requires a separate confirmation. Selection remains available in the name field and elsewhere.

The previous button started a timer on pointer down and cleared it on pointer up, leave, or cancel. Although it prevented the `contextmenu` event, its label and gear remained selectable and had no WebKit touch-callout suppression. On iOS the native long-press selection/callout can take over and interrupt the pointer sequence before two seconds. The button and its descendants now disable selection and the WebKit callout locally; normal page scrolling remains enabled. Cancellation and leaving still clear the timer. A tap provides an alternative if the operating system interrupts a hold.

The browser regression checks computed selection styles (including WebKit's callout property when running WebKit), synthetic pointer cancellation/leave and hold, touch activation, keyboard activation, both languages, and reset cancellation. Synthetic pointer events and desktop Playwright WebKit cannot reproduce iOS's native selection UI, touch arbitration, VoiceOver, or installed Home Screen behavior. Playwright WebKit was downloaded but could not launch on this host because its system libraries are missing. No physical iPhone or iPad was available: verify a real finger hold, scrolling away, interruption, tap challenge, VoiceOver, and an online update followed by offline reload on iOS. The release retains the existing localStorage key and older caches; close old app windows online and reopen to activate the new worker, then reload if needed. Clearing website data deletes progress.

## Version 1.4.0

Alphabet practice has a separate, replayable Hear letter button for the current letter, including Spanish Ñ and language-specific W names. It respects Sound and spoken feedback settings. The device voice may require a gesture, may pronounce names differently, and may be unavailable offline; the button does not guarantee speech. Guided tracing uses slightly wider difficulty tolerances while retaining ordered, continuous multi-stroke geometry. Level 1 remains more forgiving.

Alphabet levels grow a dragon using the user-supplied sprite artwork, stored locally in `public/dragon/`. The original image is retained as `supplied-sprite.jpg`; the ten PNGs are crops of that image, scaled from the supplied 1983 × 793 coordinates to its actual 1280 × 511 pixels. No additional creator attribution was supplied. An egg represents zero completed alphabet levels; completing each level reveals its corresponding stage. Replays and free practice do not add growth, and older saves retain their existing alphabet level completions. Name and Numbers continue to show the mansion.

Every completed level has a bilingual celebration and a Continue button, including replays; progress is awarded only once. Spoken praise respects Sound and spoken feedback settings. Reduced-motion preferences disable the celebration animations. The service worker precaches all ten dragon crops for offline use after installation.

After an unsuccessful guided check, a drawing with movement can be submitted for a grown-up review. The grown-up answers the arithmetic challenge, looks at the unchanged drawing, and explicitly decides whether it is a good attempt. The app does not recognize or judge the drawing for this fallback; the history records “Adult reviewed.” Blank marks and taps cannot be submitted. The arithmetic challenge is child-resistant, not a security boundary, and an adult must supervise the decision. Guided automatic checks still require the selected stroke order and formation. That release retained existing progress and displayed v1.4.0.

## Version 1.5.0

Name Adventure now grows the supplied ten-stage house artwork. Before the first completed level a seed marks the beginning; each distinct completed Name level reveals one stage. Older completed Name worlds and current Name levels are combined without counting duplicates, and replaying a level adds no stage. Changing the child's name resets Name progress as before; resetting all progress resets every section. Alphabet's dragon and the Numbers mansion retain their existing behavior.

The ten individual 512 × 384 images are stored in `public/name-house/` and are precached for offline use when the new service worker installs. The worker retains older caches and waits for existing clients to close as before. Screen, section and level changes use a brief, non-blocking transition; reduced-motion preferences disable it. No audio autoplay behavior has changed.

Guided exercises show the number of pen strokes, numbered start labels connected to the actual starting points, and arrowheads aligned with the authored path segments. Lift your finger between numbered strokes. The Watch how to write button replays the pen strokes in order without blocking the writing pad. With reduced motion, the demonstration appears fully drawn; use the numbered starts for the order. Guides and demonstrations do not change tracing validation or saved progress. Short strokes still have a direction, but their arrows can be close to the start; the replay provides another view. Labels and arrows use the same SVG coordinate space as the paths and resize with the pad.
