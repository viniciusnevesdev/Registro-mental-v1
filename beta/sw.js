/* Registro Mental 1.2.0-beta.44 — Service Worker aposentado */
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('registro-beta-v1-')).map(k => caches.delete(k)));
    } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => client.postMessage({ type: 'REGISTRO_SW_RETIRED', release: '1.2.0-beta.44' }));
    } catch (_) {}
  })());
});
