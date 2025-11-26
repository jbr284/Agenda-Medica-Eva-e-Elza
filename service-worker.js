const CACHE_NAME = 'agenda-cache-v2'; // Mude v2 para v3, v4... sempre que atualizar o código!
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://npmcdn.com/flatpickr/dist/l10n/pt.js'
];

// 1. Instalação: Baixa os arquivos e força a atualização imediata
self.addEventListener('install', function(event) {
  // Força o SW a ativar imediatamente, sem esperar o usuário fechar o app
  self.skipWaiting(); //

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Abrindo cache e salvando arquivos...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Limpa caches antigos e assume o controle
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Se o cache não for o atual (v2), apaga ele!
          if (cacheName !== CACHE_NAME) {
            console.log('Apagando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Força o SW a controlar todas as abas/janelas abertas agora
      return self.clients.claim(); //
    })
  );
});

// 3. Interceptação (Fetch): Serve arquivos do cache se houver, ou busca na rede
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response;
      }
      // Se não tem no cache, busca na rede
      return fetch(event.request);
    })
  );
});
