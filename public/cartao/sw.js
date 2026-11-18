/*
 * Service worker só do cartão (S10). Escopo /cartao/. Cache com versão no nome.
 * Offline: o próprio cartão e o que ele carrega (CSS, JS, fontes), guardados na 1ª visita controlada.
 * Nunca guarda nada fora de /cartao/ como página, e nunca vê o número digitado (só requisições GET).
 */
const VERSAO = "cartao-v1";
const NUCLEO = [
  "/cartao/",
  "/cartao/manifest.webmanifest",
  "/cartao/icone-192.png",
  "/cartao/icone-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(NUCLEO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("cartao-") && k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function guardar(req, resp) {
  if (resp && resp.status === 200 && resp.type === "basic") {
    const c = await caches.open(VERSAO);
    await c.put(req, resp.clone());
  }
  return resp;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    if (!url.pathname.startsWith("/cartao")) return;
    e.respondWith(
      fetch(req)
        .then((r) => guardar(new Request("/cartao/"), r))
        .catch(() => caches.match("/cartao/")),
    );
    return;
  }

  // Recursos da página do cartão (CSS, JS, fontes, imagens): do cache primeiro, atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      const rede = fetch(req).then((r) => guardar(req, r));
      if (hit) {
        rede.catch(() => {});
        return hit;
      }
      return rede;
    }),
  );
});
