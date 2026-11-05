// Offline support: network-first for app files (so updates arrive), falling back to cache when offline.
const CACHE = 'lomdim-v9', AUDIO = 'lomdim-audio';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.json', 'icons/icon.svg', 'js/app.js', 'js/ui.js', 'js/store.js', 'js/quiz.js', 'js/audio.js', 'js/recog.js', 'js/hebrew.js', 'js/modules/mathx.js', 'js/content/stories.js',
  'audio/he/manifest.json', 'js/modules/math.js', 'js/modules/vocab.js', 'js/modules/speech.js', 'js/modules/parent.js', 'js/content/english.js', 'js/content/gemara.js'];

// Clips are downloaded in the background, never during install, so a slow connection can't hold up the app.
// Their file names are content hashes, so they live in their own cache and survive app updates.
// The page asks for this on every load: an interrupted download resumes where it stopped.
async function cacheAudio(extra = []) {
  const c = await caches.open(AUDIO);
  const m = await (await fetch('audio/he/manifest.json')).json();
  const urls = [...new Set([...Object.values(m), ...extra])].filter(f => /^[0-9a-f]{12}\.mp3$/.test(f)).map(f => 'audio/he/' + f);
  const missing = [];
  for (const u of urls) if (!await c.match(u)) missing.push(u);
  for (let i = 0; i < missing.length; i += 10) await Promise.allSettled(missing.slice(i, i + 10).map(u => c.add(u)));
}
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('message', e => { if (e.data?.cacheAudio) e.waitUntil(cacheAudio(e.data.cacheAudio).catch(() => {})); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.status === 200 && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
