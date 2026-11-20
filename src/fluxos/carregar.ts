import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Fluxo, esquemaFluxo } from "./esquema";

/**
 * Lê src/data/fluxos/*.json com node:fs (funciona no build do Astro, no Vitest e no Playwright; import.meta.glob
 * só existe no Vite). `raiz` = pasta do projeto (o build e os testes rodam nela).
 */
export function carregarFluxos(raiz = process.cwd()): Fluxo[] {
  const pasta = join(raiz, "src", "data", "fluxos");
  return readdirSync(pasta)
    .filter((n) => n.endsWith(".json"))
    .map((n) => {
      const r = esquemaFluxo.safeParse(JSON.parse(readFileSync(join(pasta, n), "utf8")));
      if (!r.success) throw new Error(`fluxo inválido em ${n}: ${r.error.message}`);
      return r.data;
    })
    .sort((a, b) => a.nos.length - b.nos.length || a.slug.localeCompare(b.slug));
}

/** Número da entrada do diário de obra -> slug do fluxo (para o link "Explorar o fluxo" no card). */
export function fluxoPorPr(raiz = process.cwd()): Map<number, string> {
  return new Map(carregarFluxos(raiz).map((f) => [f.pr, f.slug]));
}
