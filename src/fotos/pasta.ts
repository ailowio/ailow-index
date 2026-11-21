import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { PREFIXO_FOTOS, TETO_FOTO_BYTES } from "./esquema";
import { dimensoesWebp } from "./webp";

/**
 * Lista de permissões de public/explorar (V13; ADR 008, revisão das fotos estáticas): só `fotos/<slug>.webp`,
 * cada uma ≤ 80 KB, WebP de verdade e referenciada por uma foto; toda referência existe.
 * `base` = a pasta public/explorar; `referenciados` = caminhos públicos (`/explorar/fotos/x.webp`).
 * Devolve o que está fora da regra (lista vazia = ok).
 */
export function violacoesPastaFotos(base: string, referenciados: readonly string[]): string[] {
  const v: string[] = [];
  const achados = new Set<string>();
  const andar = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) {
        andar(p);
        continue;
      }
      const rel = relative(base, p).split("\\").join("/");
      const publico = `/explorar/${rel}`;
      if (!/^fotos\/[a-z0-9-]+\.webp$/.test(rel)) {
        v.push(`${rel}: fora da lista de permissões (só fotos/<slug>.webp)`);
        continue;
      }
      achados.add(publico);
      const bytes = statSync(p).size;
      if (bytes > TETO_FOTO_BYTES) v.push(`${rel}: ${bytes} B acima de ${TETO_FOTO_BYTES} B`);
      try {
        dimensoesWebp(readFileSync(p));
      } catch {
        v.push(`${rel}: não é WebP`);
      }
      if (!referenciados.includes(publico)) v.push(`${rel}: não referenciado por nenhuma foto`);
    }
  };
  andar(base);
  for (const r of referenciados) {
    if (!r.startsWith(PREFIXO_FOTOS)) v.push(`${r}: referência fora de ${PREFIXO_FOTOS}`);
    else if (!achados.has(r)) v.push(`${r.slice("/explorar/".length)}: referenciado e ausente`);
  }
  return v;
}
