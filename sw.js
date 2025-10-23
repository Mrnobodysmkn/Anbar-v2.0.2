const CACHE_NAME = 'warehouse-cache-v9.0'; // --- نسخه جدید
const LOCAL_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// --- افزودن کتابخانه‌ها به کش ---
const CDN_FILES = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  // --- رفع باگ تقویم: افزودن فایل‌های تقویم به کش ---
  'https://cdn.jsdelivr.net/npm/d-calendar@latest/dist/d-calendar.picker.css',
  'https://cdn.jsdelivr.net/npm/d-calendar@latest/dist/d-calendar.picker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return Promise.all([
          cache.addAll(LOCAL_FILES),
          cache.addAll(CDN_FILES).catch(err => console.log('CDN caching failed, will cache on fetch.', err))
        ]);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(err => {
          console.error('Fetch failed:', err);
        });
      })
  );
});
