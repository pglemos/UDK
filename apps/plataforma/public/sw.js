const CACHE_NAME = "udk-platform-v3";
const RSC_CACHE_NAME = "udk-platform-rsc-v1";
const PUBLIC_SHELL = ["/", "/offline.html", "/udk.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![CACHE_NAME, RSC_CACHE_NAME].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function rscCacheKey(url) {
  return new Request(`${url.origin}${url.pathname}?__udk_rsc_shell=1`);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".svg")) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const write = caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          event.waitUntil(write);
        }
        return response;
      }),
    );
    return;
  }

  if (url.searchParams.has("_rsc")) {
    const cacheKey = rscCacheKey(url);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.headers.get("content-type")?.includes("text/x-component")) {
            const write = caches.open(RSC_CACHE_NAME).then((cache) => cache.put(cacheKey, response.clone()));
            event.waitUntil(write);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(cacheKey);
          return (
            cached ||
            new Response("", {
              status: 503,
              headers: {
                "content-type": "text/x-component",
                "x-udk-offline": "1",
              },
            })
          );
        }),
    );
    return;
  }

  if (request.mode !== "navigate") return;

  if (url.pathname.startsWith("/painel") || url.pathname.startsWith("/auth")) {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => (await caches.match(request)) || (await caches.match("/offline.html"))),
  );
});
