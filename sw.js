const CACHE_NAME = 'chess-kids-v24';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/i18n.js',
  './js/chess.js',
  './js/pieces.js',
  './js/skin-classic.js',
  './js/skin-hellocarbot.js',
  './js/missions.js',
  './js/app-core.js',
  './js/app-home.js',
  './js/app-adventure.js',
  './js/app-puzzle.js',
  './js/app-play.js',
  './js/mini-menu.js',
  './js/mini-knight-tour.js',
  './js/mini-survival.js',
  './js/mini-collector.js',
  './js/mini-bomb.js',
  './js/mini-defense.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
