// Offline support: network-first for app files (so updates arrive), falling back to cache when offline.
const CACHE = 'lomdim-v8';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.json', 'icons/icon.svg', 'js/app.js', 'js/ui.js', 'js/store.js', 'js/quiz.js', 'js/audio.js', 'js/recog.js', 'js/hebrew.js', 'js/modules/mathx.js', 'js/content/stories.js',
  'js/modules/math.js', 'js/modules/vocab.js', 'js/modules/speech.js', 'js/modules/parent.js', 'js/content/english.js', 'js/content/gemara.js'];

// One failed clip must not block the install: it falls back to the runtime cache the first time it plays online.
async function cacheAudio(c) {
  const m = await (await fetch('audio/he/manifest.json')).json();
  const urls = ['audio/he/manifest.json', ...Object.values(m).map(f => 'audio/he/' + f)];
  for (let i = 0; i < urls.length; i += 20) await Promise.allSettled(urls.slice(i, i + 20).map(u => c.add(u)));
}
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(async c => { await c.addAll(FILES); await cacheAudio(c).catch(() => {}); })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.status === 200 && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
