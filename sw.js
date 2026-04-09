var CACHE_VERSION = "basabasa-news-v2-20260409b";
var CACHE_FILES = [
  "/basabasa-news/",
  "/basabasa-news/index.html",
  "/basabasa-news/manifest.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(CACHE_FILES).catch(function () {
        // Ignore cache failures on install (dev environment may not have base path)
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_VERSION;
          })
          .map(function (key) {
            return caches.delete(key);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Network-first strategy
self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Cache successful responses
        if (response && response.status === 200 && response.type === "basic") {
          var responseClone = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function () {
        // Fallback to cache when network fails
        return caches.match(event.request);
      }),
  );
});

// 5-minute interval update check
setInterval(
  function () {
    self.clients.matchAll().then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: "UPDATE_CHECK" });
      });
    });
  },
  5 * 60 * 1000,
);
