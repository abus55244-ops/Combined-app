/* Heritage Unified — সার্ভিস ওয়ার্কার
   শুধুমাত্র PWA ইনস্টলযোগ্যতার জন্য প্রয়োজনীয় ন্যূনতম ক্যাশিং।
   অ্যাপের ডেটা (Firebase থেকে) কখনো ক্যাশ করা হয় না — শুধু স্ট্যাটিক শেল ফাইল। */
const CACHE_NAME = "heritage-unified-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// নেটওয়ার্ক-প্রথম, ব্যর্থ হলে ক্যাশ থেকে (অফলাইনেও অ্যাপ খুলবে, কিন্তু ডেটা লাইভ Firebase থেকেই আসে)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
