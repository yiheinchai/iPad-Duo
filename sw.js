// Offline cache so the "phone" boots instantly with no network.
const VERSION = 'duo-v3';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/duo.css',
  'css/apps.css',
  'js/main.js',
  'js/os.js',
  'js/fold.js',
  'js/util.js',
  'js/icons.js',
  'js/wallpaper.js',
  'js/widgets.js',
  'js/keyboard.js',
  'js/data.js',
  'js/apps/registry.js',
  'js/apps/ui.js',
  'js/apps/generic.js',
  'js/apps/settings.js',
  'js/apps/camera.js',
  'js/apps/photos.js',
  'js/apps/calculator.js',
  'js/apps/clock.js',
  'js/apps/weather.js',
  'js/apps/notes.js',
  'js/apps/messages.js',
  'js/apps/safari.js',
  'js/apps/music.js',
  'js/apps/phone.js',
  'js/apps/calendar.js',
  'js/apps/facetime.js',
  'assets/icon-180.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates land), cache fallback (so it works offline).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
