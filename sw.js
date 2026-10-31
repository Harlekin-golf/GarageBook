const V = 'sk-pub-1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'logo.webp', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
// cache:'reload' — не брать устаревшие копии из HTTP-кэша (GitHub Pages разрешает кэшировать файлы до 10 минут)
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'reload'}))))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // app files: cache first, refresh in background
    e.respondWith(caches.match(r, {ignoreSearch: true}).then(hit => {
      const net = fetch(r.url, {cache: 'no-cache'}).then(res => { if (res.ok) caches.open(V).then(c => c.put(r, res.clone())); return res; }).catch(() => hit);
      return hit || net.then(res => res || caches.match('index.html'));
    }).catch(() => caches.match('index.html')));
  } else if (u.hostname.endsWith('googleapis.com') || u.hostname.endsWith('gstatic.com')) {
    // fonts: remember after first load
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
  }
});
