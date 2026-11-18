import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lista local de termos bloqueados (nomes de clientes, prospects, pessoas, marcas em disputa).
 * Fica FORA do git (`*.local.txt` no .gitignore): versionar a lista já seria publicá-la.
 * Uma linha por termo; `#` comenta. Ausente (ex.: CI) = só os padrões estruturais valem.
 */
export const ARQUIVO_TERMOS_LOCAIS = "conteudo-bloqueado.local.txt";

export function carregarTermosLocais(raiz = process.cwd()): string[] {
  const caminho = join(raiz, ARQUIVO_TERMOS_LOCAIS);
  if (!existsSync(caminho)) return [];
  return readFileSync(caminho, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}
