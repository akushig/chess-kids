importScripts('./js/version.js');
const CACHE_NAME = 'chess-kids-' + CHESS_BUILD;
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/version.js",
  "./js/i18n.js",
  "./js/app-storage.js",
  "./js/chess.js",
  "./js/chess-ai.js",
  "./js/pieces.js",
  "./js/skin-classic.js",
  "./js/skin-hellocarbot.js",
  "./js/skin-dino.js",
  "./js/skin-tiniping.js",
  "./js/skin-robot.js",
  "./js/skin-baemin.js",
  "./js/missions.js",
  "./js/content-curriculum.js",
  "./js/lesson-levels.js",
  "./js/lesson-content.js",
  "./js/lesson-rules.js",
  "./js/lesson-explain.js",
  "./js/lesson-gen.js",
  "./js/course-rules.js",
  "./js/course-gen.js",
  "./js/course-levels.js",
  "./js/store.js",
  "./js/course-content.js",
  "./js/app-core.js",
  "./js/app-session.js",
  "./js/app-home.js",
  "./js/app-profiles.js",
  "./js/app-adventure.js",
  "./js/app-puzzle.js",
  "./js/app-play.js",
  "./js/mini-menu.js",
  "./js/mini-knight-solver.js",
  "./js/knight-puzzles.js",
  "./js/mini-knight-tour.js",
  "./js/mini-survival.js",
  "./js/path-games.js",
  "./js/mini-collector.js",
  "./js/mini-bomb.js",
  "./js/mini-defense.js",
  "./js/play-content.js",
  "./js/mini-solo.js",
  "./js/mini-challenge.js",
  "./js/app-lessons.js",
  "./js/app-course.js",
  "./js/app-coach.js",
  "./js/app-workshop.js",
  "./js/app-accessibility.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon.svg",
  "./icons/favicon-32.png",
  "./icons/favicon-180.png"
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chess-kids-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
    const cached=await cache.match(request);if(cached)return cached;
    try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone()).catch(()=>{});return response;}
    catch(error){if(request.mode==='navigate'){const index=await cache.match('./index.html');if(index)return index;}return Response.error();}
  }));
});
