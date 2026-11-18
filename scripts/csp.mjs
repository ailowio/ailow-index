// CSP por hash (S11): todo <script> inline do dist/ entra na `script-src` pelo seu sha256.
// Uso (Dockerfile): node scripts/csp.mjs <dist> <saida.conf>
// A saída é um trecho de nginx (`set $csp_script_hashes "..."`) incluído pelo servidor; a política
// em si fica em ops/web/seguranca.conf. Sem dependências.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;

/** Conteúdo de cada <script> inline executável (sem `src`; JSON de dados não executa e fica de fora). */
export function scriptsInline(html) {
  const saida = [];
  for (const m of html.matchAll(SCRIPT)) {
    const atributos = m[1] ?? "";
    if (/\ssrc\s*=/i.test(` ${atributos}`)) continue;
    const tipo = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(` ${atributos}`)?.[1]?.toLowerCase();
    if (tipo && tipo !== "module" && tipo !== "text/javascript") continue;
    saida.push(m[2]);
  }
  return saida;
}

export const hashDe = (conteudo) => `'sha256-${createHash("sha256").update(conteudo, "utf8").digest("base64")}'`;

function htmls(dist) {
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

/** Hashes únicos e ordenados de todos os scripts inline de todas as páginas do dist. */
export function hashesDoDist(dist) {
  const todos = new Set();
  for (const arquivo of htmls(dist)) {
    for (const s of scriptsInline(readFileSync(arquivo, "utf8"))) todos.add(hashDe(s));
  }
  return [...todos].sort();
}

export function confDeHashes(hashes) {
  return `# Gerado por scripts/csp.mjs a partir do dist/. Não editar.\nset $csp_script_hashes "${hashes.join(" ")}";\n`;
}

/** Scripts inline do HTML cujo hash não está na `script-src` do cabeçalho (lista vazia = tudo coberto). */
export function scriptsSemHash(html, cabecalhoCsp) {
  const diretiva = cabecalhoCsp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
  return scriptsInline(html).filter((s) => !diretiva.includes(hashDe(s)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [dist, saida] = process.argv.slice(2);
  if (!dist || !saida) {
    console.error("uso: node scripts/csp.mjs <dist> <saida.conf>");
    process.exit(2);
  }
  const hashes = hashesDoDist(dist);
  if (hashes.length === 0) {
    console.error("csp: nenhum script inline encontrado; dist vazio ou errado?");
    process.exit(1);
  }
  writeFileSync(saida, confDeHashes(hashes), "utf8");
  console.log(`csp: ${hashes.length} hashes de script inline gravados em ${saida}`);
}
