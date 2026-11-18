// Smoke da imagem em execução (S11, job `imagem` do CI). Uso: node scripts/smoke-imagem.mjs http://127.0.0.1:8080
// Confere rotas, cabeçalhos de segurança, content-type do manifest, cache do sw.js, 404 e
// que TODO script inline servido tem o hash na CSP da própria resposta.
import { scriptsSemHash } from "./csp.mjs";

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base) {
  console.error("uso: node scripts/smoke-imagem.mjs <url-base>");
  process.exit(2);
}

const falhas = [];
const conferir = (ok, msg) => {
  console.log(`${ok ? "ok   " : "FALHA"} ${msg}`);
  if (!ok) falhas.push(msg);
};

async function pegar(caminho) {
  return fetch(`${base}${caminho}`, { redirect: "manual" });
}

for (const rota of ["/", "/pedro/", "/cartao/", "/apresentacao/", "/pulse/", "/cloud/", "/pedro/entrevistas/"]) {
  const r = await pegar(rota);
  conferir(r.status === 200, `${rota} -> ${r.status}`);
  const csp = r.headers.get("content-security-policy") ?? "";
  conferir(csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"), `${rota} tem CSP estrita`);
  conferir(r.headers.get("x-content-type-options") === "nosniff", `${rota} tem nosniff`);
  conferir(r.headers.get("x-frame-options") === "DENY", `${rota} tem X-Frame-Options DENY`);
  conferir(/no-cache/.test(r.headers.get("cache-control") ?? ""), `${rota} revalida (no-cache)`);
  conferir(!r.headers.has("server") || !/\d/.test(r.headers.get("server")), `${rota} não expõe a versão do nginx`);
  const html = await r.text();
  const sem = scriptsSemHash(html, csp);
  conferir(sem.length === 0, `${rota}: todo script inline tem hash na CSP (${sem.length} sem)`);
}

const redirecionamento = await pegar("/pedro");
conferir(
  redirecionamento.status === 301 && redirecionamento.headers.get("location") === "/pedro/",
  `/pedro -> ${redirecionamento.status} ${redirecionamento.headers.get("location")}`,
);

const saude = await pegar("/health");
conferir(saude.status === 200 && (await saude.text()).trim() === "ok", `/health -> ${saude.status}`);

const sw = await pegar("/cartao/sw.js");
conferir(sw.status === 200, `/cartao/sw.js -> ${sw.status}`);
conferir(sw.headers.get("cache-control") === "no-cache", `sw.js Cache-Control = ${sw.headers.get("cache-control")}`);

const manifest = await pegar("/cartao/manifest.webmanifest");
conferir(manifest.status === 200, `manifest -> ${manifest.status}`);
conferir(
  (manifest.headers.get("content-type") ?? "").startsWith("application/manifest+json"),
  `manifest Content-Type = ${manifest.headers.get("content-type")}`,
);

const home = await (await pegar("/")).text();
const css = /href="(\/_astro\/[^"]+\.css)"/.exec(home)?.[1];
conferir(Boolean(css), "home referencia um CSS em /_astro/");
if (css) {
  const r = await pegar(css);
  conferir(/immutable/.test(r.headers.get("cache-control") ?? ""), `${css} é immutable`);
}

const inexistente = await pegar("/nao-existe-s11/");
conferir(inexistente.status === 404, `rota inexistente -> ${inexistente.status}`);

const metodo = await fetch(`${base}/`, { method: "POST", body: "x" });
conferir(metodo.status === 405, `POST / -> ${metodo.status}`);

if (falhas.length > 0) {
  console.error(`\n${falhas.length} falha(s) no smoke.`);
  process.exit(1);
}
console.log("\nsmoke ok");
