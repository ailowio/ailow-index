import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Foto, esquemaFoto } from "./esquema";

/**
 * Lê src/data/fotos/*.json com node:fs (build do Astro, Vitest e Playwright), como os fluxos.
 * Ordem: pela entrada principal do Diário de obra (mais antiga primeiro).
 */
export function carregarFotos(raiz = process.cwd()): Foto[] {
  const pasta = join(raiz, "src", "data", "fotos");
  return readdirSync(pasta)
    .filter((n) => n.endsWith(".json"))
    .map((n) => {
      const r = esquemaFoto.safeParse(JSON.parse(readFileSync(join(pasta, n), "utf8")));
      if (!r.success) throw new Error(`foto inválida em ${n}: ${r.error.message}`);
      return r.data;
    })
    .sort((a, b) => a.pr - b.pr || a.slug.localeCompare(b.slug));
}
