// Orçamento de peso por rota sobre o dist/ (ADR 003, D3). Sem dependências.
// Uso: node scripts/peso.mjs [--dist dist] [--orcamentos scripts/orcamentos-peso.json]
// Sai com código 1 se alguma rota passar do orçamento de JS gzip ou de peso gzip.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const KIB = 1024;
// Fora do peso por rota: fontes, vídeo, legenda (ADR 003: "sem fontes e sem vídeo").
const IGNORADOS = new Set([".woff", ".woff2", ".ttf", ".otf", ".mp4", ".webm", ".vtt"]);

function argumento(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

function paginas(dist) {
  const saida = [];
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else if (nome.endsWith(".html")) saida.push(p);
    }
  };
  andar(dist);
  return saida;
}

function rotaDe(dist, arquivo) {
  const rel = relative(dist, arquivo).split("\\").join("/");
  const dir = rel === "index.html" ? "" : rel.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
  return `/${dir}`;
}

const gz = (buf) => gzipSync(buf, { level: 9 }).length;

/** Caminho local (no dist) referenciado por `ref` a partir de `base` (arquivo no dist); null se externo. */
function resolver(dist, baseArquivo, ref) {
  const limpo = ref.split("#")[0].split("?")[0];
  if (!limpo || /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:)/i.test(limpo)) return null;
  return limpo.startsWith("/")
    ? join(dist, limpo)
    : resolve(dirname(baseArquivo), limpo);
}

function existe(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Mede uma página: JS gzip e peso gzip, com a lista de arquivos contados. */
export function medirPagina(dist, arquivoHtml) {
  const html = readFileSync(arquivoHtml);
  const texto = html.toString("utf8");
  let jsBytes = 0;
  let pesoBytes = gz(html);
  const vistos = new Set();

  const contar = (caminho) => {
    if (vistos.has(caminho) || !existe(caminho)) return;
    vistos.add(caminho);
    const ext = extname(caminho).toLowerCase();
    if (IGNORADOS.has(ext)) return;
    const buf = readFileSync(caminho);
    const tam = gz(buf);
    pesoBytes += tam;
    if (ext === ".js" || ext === ".mjs") {
      jsBytes += tam;
      const fonte = buf.toString("utf8");
      for (const m of fonte.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.m?js)["']/g)) {
        contar(resolve(dirname(caminho), m[1]));
      }
    } else if (ext === ".css") {
      for (const m of buf.toString("utf8").matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        const alvo = resolver(dist, caminho, m[1]);
        if (alvo) contar(alvo);
      }
    }
  };

  // JS inline: <script> sem src e que não seja dado (JSON, JSON-LD).
  for (const m of texto.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']?(?:application\/(?:ld\+)?json|importmap)/i.test(attrs)) continue;
    jsBytes += gz(Buffer.from(m[2], "utf8"));
  }
  // Recursos locais referenciados no HTML (V07: o pôster do <video> também é imagem baixada pela página).
  for (const m of texto.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)) {
    const alvo = resolver(dist, arquivoHtml, m[1]);
    if (alvo && !alvo.endsWith(".html") && extname(alvo) !== "") contar(alvo);
  }
  return { jsGzKB: jsBytes / KIB, pesoGzKB: pesoBytes / KIB, arquivos: [...vistos] };
}

export function medir(dist, orcamentos) {
  const linhas = [];
  for (const arq of paginas(dist).sort()) {
    const rota = rotaDe(dist, arq);
    const lim = orcamentos.rotas?.[rota] ?? orcamentos.padrao;
    const m = medirPagina(dist, arq);
    const estouros = [];
    if (m.jsGzKB > lim.jsGzKB) estouros.push(`JS ${m.jsGzKB.toFixed(2)} > ${lim.jsGzKB} KiB`);
    if (m.pesoGzKB > lim.pesoGzKB) estouros.push(`peso ${m.pesoGzKB.toFixed(2)} > ${lim.pesoGzKB} KiB`);
    linhas.push({ rota, ...m, limite: lim, estouros });
  }
  return linhas;
}

function principal() {
  const dist = resolve(argumento("--dist", "dist"));
  const orc = resolve(argumento("--orcamentos", join(import.meta.dirname, "orcamentos-peso.json")));
  try {
    statSync(dist);
  } catch {
    console.error(`peso: pasta ${dist} não existe; rode o build antes.`);
    process.exit(1);
  }
  const orcamentos = JSON.parse(readFileSync(orc, "utf8"));
  const linhas = medir(dist, orcamentos);
  if (linhas.length === 0) {
    console.error("peso: nenhuma página .html no dist/.");
    process.exit(1);
  }
  for (const l of linhas) {
    const status = l.estouros.length ? "ESTOUROU" : "ok";
    console.log(
      `peso: ${l.rota.padEnd(24)} JS ${l.jsGzKB.toFixed(2)}/${l.limite.jsGzKB} KiB  total ${l.pesoGzKB.toFixed(2)}/${l.limite.pesoGzKB} KiB  ${status}`,
    );
    for (const e of l.estouros) console.error(`  ${l.rota}: ${e}`);
  }
  if (linhas.some((l) => l.estouros.length)) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) principal();
