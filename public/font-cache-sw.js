const CACHE_NAME = "bayt-al-hamd-fonts-v1";
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com", "verses.quran.foundation"]);

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.protocol !== "https:" || !FONT_HOSTS.has(url.hostname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
