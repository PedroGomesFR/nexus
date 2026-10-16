/* NEXUS — service worker : application installable et lecture hors ligne.
 *
 * Réseau d'abord : en ligne, la page reçoit toujours la dernière version du site (jamais une copie
 * périmée après une mise à jour) ; la copie gardée ici ne sert que sans connexion. Les articles,
 * eux, sont déjà enregistrés dans le navigateur par app.js. Le relais (/api/…) n'est jamais mis en cache.
 */
const CACHE = 'nexus-site';
const SITE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/sources.js', 'js/games.js', 'js/apps.js', 'js/themes.js', 'js/changelog.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  // Un fichier manquant ne doit pas empêcher l'installation : chacun est mis en cache séparément.
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(SITE.map((url) => cache.add(url).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })
        .then((hit) => hit || (request.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});

// Clic sur une notification d'alerte : l'article (autre site) dans un nouvel onglet,
// ou NEXUS (#alertes) dans l'onglet déjà ouvert s'il y en a un.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((tabs) => {
    const own = new URL(url).origin === self.location.origin;
    const tab = own && tabs.find((t) => new URL(t.url).origin === self.location.origin);
    if (tab) return tab.focus().then((t) => t.navigate?.(url) ?? t);
    return self.clients.openWindow(url);
  }));
});
