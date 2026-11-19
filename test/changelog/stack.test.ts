import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import ferramentas from "../../src/data/ferramentas.json";
import softSkills from "../../src/data/soft-skills.json";
import { labelsDoFeed, stackCompleta } from "../../src/changelog/labels";
import { comNovidades } from "../../src/changelog/regras";
import type { Catalogos } from "../../src/changelog/tipos";
import { pr } from "./fabrica";

const catalogos = { ferramentas, softSkills } as Catalogos;
const raiz = resolve(import.meta.dirname, "../..");

const feed = comNovidades([
  pr({ numero: 1, titulo: "feat(infra): servidor", ferramentas: ["docker", "postgres"] }),
  pr({ numero: 2, titulo: "feat(sgi): tela", ferramentas: ["react", "postgres"] }),
]);

describe("stack completa (/pedro/stack)", () => {
  const stack = stackCompleta(feed, catalogos);
  const linhas = stack.grupos.flatMap((g) => g.linhas);

  it("o total é o do catálogo, sem duplicata, e o de categorias é derivado", () => {
    expect(stack.total).toBe(catalogos.ferramentas.length);
    expect(linhas).toHaveLength(catalogos.ferramentas.length);
    expect(new Set(linhas.map((l) => l.id)).size).toBe(linhas.length);
    expect(stack.categorias).toBe(new Set(catalogos.ferramentas.map((f) => f.categoria)).size);
    expect(stack.grupos).toHaveLength(stack.categorias);
  });

  it("ferramenta usada tem nº de PRs, 'desde' e um link para a label que existe", () => {
    const slugs = new Set(labelsDoFeed(feed, catalogos).map((l) => l.slug));
    const postgres = linhas.find((l) => l.id === "postgres");
    expect(postgres).toMatchObject({ prs: 2, desde: 1, slug: "postgres" });
    for (const l of linhas.filter((x) => x.prs > 0)) {
      expect(l.slug).not.toBeNull();
      expect(slugs.has(l.slug as string)).toBe(true);
    }
  });

  it("ferramenta sem entrada aparece sem link e sem 'desde'", () => {
    const sem = linhas.filter((l) => l.prs === 0);
    expect(sem.length).toBeGreaterThan(0);
    for (const l of sem) expect(l).toMatchObject({ slug: null, desde: null });
  });

  it("agrupa por categoria do catálogo, na ordem em que ela aparece", () => {
    const ordem = [...new Set(catalogos.ferramentas.map((f) => f.categoria))];
    expect(stack.grupos.map((g) => g.categoria)).toEqual(ordem);
  });
});

describe("entrada #080 (firmware v1.9)", () => {
  const dir = join(raiz, "src", "content", "prs");
  const arquivo = readdirSync(dir).filter((n) => n.startsWith("080-"));
  const texto = readFileSync(join(dir, arquivo[0] ?? "x"), "utf8");

  it("continua uma só, #80, aberta e confirmada", () => {
    expect(arquivo).toHaveLength(1);
    expect(texto).toMatch(/^numero: 80$/m);
    expect(texto).toMatch(/^estado: open$/m);
    expect(texto).toMatch(/^verificacao: confirmado$/m);
  });

  it("não traz números de contagem: só datas e versões v1.x", () => {
    const corpo = texto.split(/^---$/m)[2] ?? "";
    const sem = corpo
      .replace(/\b\d{1,2} de [a-zç]+( de \d{4})?\b/gi, "")
      .replace(/\b\d{1,2}\/\d{1,2}(\/\d{4})?\b/g, "")
      .replace(/\bv\d+\.\d+\b/g, "");
    expect(sem).not.toMatch(/\d/);
    expect(corpo).not.toMatch(/pulsos?\s+por|mediana\s+de/i);
  });
});
