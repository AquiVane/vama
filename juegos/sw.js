/* Verano en Juego — service worker.
   - Guarda la app y sus tipografías para jugar sin internet (estrategia: primero lo guardado, y se actualiza en segundo plano).
   - NUNCA toca /api/*: ningún pedido a la API se cachea ni se intercepta.
   - Solo maneja /juegos/jugar/ y sus recursos; la landing y el checkout siempre van a la red.
   - Subir VERSION en cada release; los avances del usuario viven en localStorage y no se tocan nunca. */
const VERSION = 'vej-v1';
const SHELL = ['/juegos/jugar/', '/juegos/manifest.webmanifest', '/juegos/icons/icon-192.png', '/juegos/icons/icon-512.png', '/juegos/icons/icon-maskable-512.png', '/juegos/icons/apple-touch-icon.png', '/juegos/fonts/bricolage.woff2', '/juegos/fonts/figtree.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));   // sin skipWaiting: la versión nueva entra en la próxima apertura, nunca a mitad de una partida
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('vej-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;      // otro origen (la API vive en otro dominio): no se toca
  if (url.pathname.includes('/api/')) return;                                   // regla dura: nunca cachear /api/*
  const propio = url.pathname.startsWith('/juegos/jugar/') || SHELL.includes(url.pathname);
  if (!propio) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const guardado = await cache.match(req, { ignoreSearch: true });
    const red = fetch(req).then((r) => { if (r && r.ok && r.type === 'basic') cache.put(url.pathname.endsWith('/') || url.pathname.endsWith('.html') ? new Request(url.origin + url.pathname) : req, r.clone()); return r; }).catch(() => null);
    if (guardado) { e.waitUntil(red); return guardado; }
    return (await red) || new Response('Sin conexión y la app todavía no se guardó. Abrila una vez con internet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
