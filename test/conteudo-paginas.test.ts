import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";

const raiz = resolve(import.meta.dirname, "..");

function arquivos(dir: string, extensoes: string[]): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) saida.push(...arquivos(p, extensoes));
    else if (extensoes.some((e) => nome.endsWith(e))) saida.push(p);
  }
  return saida;
}

describe("texto público das páginas e do conteúdo", () => {
  const termos = carregarTermosLocais(raiz);
  const alvos = [
    ...arquivos(join(raiz, "src", "pages"), [".astro", ".ts", ".md"]),
    ...arquivos(join(raiz, "src", "content"), [".md"]),
    ...arquivos(join(raiz, "src", "data"), [".json"]),
  ];

  it("encontra arquivos para conferir", () => {
    expect(alvos.length).toBeGreaterThan(0);
  });

  it.each(alvos.map((p) => [relative(raiz, p), p]))("%s passa no linter de conteúdo", (_r, p) => {
    expect(lintConteudo(readFileSync(p, "utf8"), termos)).toEqual([]);
  });
});
