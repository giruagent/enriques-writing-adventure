const CACHE = 'enrique-v1.8.0-house-webp';
const base = new URL(self.registration.scope).pathname;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // The first page load happens before this worker controls the page. Read
    // the exported HTML during installation so its actual hashed assets are
    // available before the worker is considered ready.
    const response = await fetch(base);
    if (!response.ok) throw new Error('Could not cache app shell');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="([^"?#]*\/_next\/static\/[^"?#]+\.(?:js|css))"/g)]
      .map(match => new URL(match[1], self.registration.scope).href);
    if (!assets.some(url => url.endsWith('.js')) || !assets.some(url => url.endsWith('.css'))) throw new Error('App shell assets missing');
    await cache.put(base, response);
    await cache.addAll([...new Set(assets), `${base}manifest.webmanifest`, `${base}icon-192.png`, `${base}icon-512.png`, ...Array.from({length:10}, (_, i) => `${base}alien/alien_stage_${String(i+1).padStart(2,'0')}.png`), ...Array.from({length:10}, (_, i) => `${base}dragon/stage-${i+1}.png`), ...Array.from({length:10}, (_, i) => new Request(`${base}name-house/casa_nivel_${String(i+1).padStart(2,'0')}.webp`, {cache: 'reload'}))]);
  })());
});
// Keep older caches: an open page may still need its version's hashed assets.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(base) || url.pathname.startsWith(`${base}api/`)) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok && event.request.mode !== 'navigate') await (await caches.open(CACHE)).put(event.request, response.clone());
    return response;
  }).catch(async () => {
    const cached = await (await caches.open(CACHE)).match(event.request);
    if (cached) return cached;
    throw new Error('Offline resource unavailable');
  }));
});
