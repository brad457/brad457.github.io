const dirprefix = '/a2hs';

self.addEventListener('install', function(e) {
 e.waitUntil(
   caches.open('fox-store').then(function(cache) {
     return cache.addAll([
       dirprefix + '/',
       dirprefix + '/index.html',
       dirprefix + '/index.js',
       dirprefix + '/style.css',
       dirprefix + '/images/fox1.jpg',
       dirprefix + '/images/fox2.jpg',
       dirprefix + '/images/fox3.jpg',
       dirprefix + '/images/fox4.jpg'
     ]);
   })
 );
});

self.addEventListener('fetch', function(e) {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
