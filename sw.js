self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Базовая передача запросов в сеть
  event.respondWith(
    fetch(event.request).catch(() => {
      // Здесь можно добавить офлайн-страницу, если пропадет интернет
    })
  );
});