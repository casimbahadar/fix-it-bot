/* Fix-It Bot — offline helper. The page is cached as './' because Cloudflare redirects index.html to '/'. Caches the app's own files only; never touches other sites.
   Bump VERSION whenever any file changes so phones pick up the new build. */
var VERSION = 'fixitbot-1.0.1';
var FILES = [
  './', 'styles.css', 'engine.js', 'levels.js', 'art.js', 'voice.js', 'store.js',
  'app.js', 'studio.js', 'print.js', 'parent.js', 'main.js',
  'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('fixitbot-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first so updates arrive; fall back to the cached copy when offline.
  e.respondWith(fetch(e.request).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./'); }); }));
});
