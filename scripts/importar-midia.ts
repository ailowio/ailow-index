// Importa um pacote da bancada para public/midia/<slug>/ (ADR 008, V05).
// Uso: npm run importar-midia -- <pasta-do-pacote> [--substituir] [--destino <pasta>]
// Sai com 0 (importado), 1 (pacote recusado, nada copiado) ou 2 (uso incorreto).
import { resolve } from "node:path";
import { carregarTermosLocais } from "../src/changelog/carregar-termos.ts";
import { importarPacote } from "../src/midia/validar.ts";

const args = process.argv.slice(2);
const substituir = args.includes("--substituir");
const iDestino = args.indexOf("--destino");
const destino = resolve(iDestino >= 0 && args[iDestino + 1] ? args[iDestino + 1] : "public/midia");
const pasta = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--destino");

if (!pasta) {
  console.error("uso: npm run importar-midia -- <pasta-do-pacote> [--substituir] [--destino <pasta>]");
  process.exit(2);
}

const r = importarPacote(pasta, { destino, substituir, termosLocais: carregarTermosLocais() });
if (r.erros.length) {
  console.error(`pacote RECUSADO (nada foi copiado): ${pasta}`);
  for (const e of r.erros) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`pacote importado: ${r.slug} (${r.copiados.length} arquivos) -> ${resolve(destino, r.slug ?? "")}`);
console.log("próximo passo: abrir PR com a importação (é a evidência da interface I-13).");
