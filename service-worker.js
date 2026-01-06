const CACHE_NAME = 'agenda-medica-v4'; // <--- IMPORTANTE: Mude este número (v4, v5, v6...) a cada alteração no código!

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

// 1. INSTALAÇÃO: Força a entrada imediata
self.addEventListener('install', (event) => {
  console.log('👷 SW: Instalando nova versão:', CACHE_NAME);
  
  // O skipWaiting() faz o novo SW "furar a fila" e não esperar o usuário fechar o app
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 SW: Caching arquivos...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ATIVAÇÃO: Limpeza agressiva de caches antigos e toma o controle
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Ativando e limpando caches antigos...');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // Se o cache não for exatamente o da versão atual, APAGA SEM DÓ!
          if (key !== CACHE_NAME) {
            console.log('🧹 SW: Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // O clients.claim() diz: "Ei, abas abertas, eu sou o chefe agora!"
      console.log('👑 SW: Assumindo controle das páginas abertas.');
      return self.clients.claim();
    })
  );
});

// 3. INTERCEPTAÇÃO: Estratégia "Cache First" (rápido), mas confiando na atualização do passo 2
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se achou no cache, retorna ele. Se não, busca na rede.
      return response || fetch(event.request);
    })
  );
});
