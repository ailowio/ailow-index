// Cruza o `fato_site` (#NNN) do claims.csv da bancada com o `status_fato` do site e lista divergências (ADR 006, V10).
// Uso: npm run conferir-fatos -- <caminho do claims.csv> [--prs <pasta>]   (padrão da pasta: src/content/prs)
// Relatório em stdout. Sai com 0 sempre que gerar o relatório e com 2 em erro de leitura. Local: o CI nunca lê a bancada.
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { conciliar, lerClaims, lerEntradaMd, relatorio } from "../src/changelog/fatos.ts";

const args = process.argv.slice(2);
const iPrs = args.indexOf("--prs");
const pastaPrs = resolve(iPrs >= 0 && args[iPrs + 1] ? args[iPrs + 1] : "src/content/prs");
const csv = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--prs");

if (!csv) {
  console.error("uso: npm run conferir-fatos -- <caminho do claims.csv> [--prs <pasta>]");
  process.exit(2);
}

try {
  const { claims, temColunaFatoSite } = lerClaims(readFileSync(resolve(csv), "utf8"));
  const fatos = readdirSync(pastaPrs)
    .filter((n) => n.endsWith(".md"))
    .map((n) => lerEntradaMd(readFileSync(join(pastaPrs, n), "utf8")))
    .filter((f) => f !== null);
  if (!temColunaFatoSite) console.error("aviso: o CSV não tem a coluna fato_site; tudo cai em 'sem fato_site'.");
  const md = relatorio(conciliar(claims, fatos), {
    origem: csv,
    entradas: fatos.length,
    geradoEm: new Date().toISOString().slice(0, 10),
  });
  process.stdout.write(md);
} catch (e) {
  console.error(`erro de leitura: ${(e as Error).message}`);
  process.exit(2);
}
