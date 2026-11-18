import { describe, expect, it } from "vitest";
import ferramentas from "../../src/data/ferramentas.json";
import softSkills from "../../src/data/soft-skills.json";
import { NOMES_CATEGORIA, agruparPainel, labelsDoFeed } from "../../src/changelog/labels";
import { comNovidades, painelFerramentas } from "../../src/changelog/regras";
import { CATEGORIAS, type Catalogos } from "../../src/changelog/tipos";
import { pr } from "./fabrica";

// Catálogos reais do site; o feed é montado em memória com ids reais.
const catalogos = { ferramentas, softSkills } as Catalogos;

const feed = comNovidades([
  pr({ numero: 1, titulo: "feat(infra): servidor", ferramentas: ["docker", "postgres"] }),
  pr({ numero: 2, titulo: "feat(n8n): fluxo", ferramentas: ["n8n"] }),
  pr({ numero: 3, titulo: "feat(sgi): tela", ferramentas: ["react", "postgres"] }),
  pr({ numero: 4, titulo: "fix(sgi): ajuste", ferramentas: ["react"] }),
]);

describe("labels do feed", () => {
  const labels = labelsDoFeed(feed, catalogos);

  it("gera uma label por ferramenta usada e por escopo usado, nada além", () => {
    const ids = labels.map((l) => l.slug).sort();
    expect(ids).toEqual(
      ["docker", "escopo-infra", "escopo-n8n", "escopo-sgi", "n8n", "postgres", "react"].sort(),
    );
  });

  it("não deixa o id n8n colidir entre ferramenta e escopo", () => {
    const slugs = labels.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("lista as entradas da mais recente para a mais antiga e calcula 'desde' e total", () => {
    const react = labels.find((l) => l.slug === "react");
    expect(react?.prs.map((p) => p.numero)).toEqual([4, 3]);
    expect(react?.desde).toBe(3);
    expect(react?.total).toBe(2);
    const sgi = labels.find((l) => l.slug === "escopo-sgi");
    expect(sgi?.prs.map((p) => p.numero)).toEqual([4, 3]);
  });

  it("ferramenta sem nenhum PR não ganha label", () => {
    expect(labels.some((l) => l.slug === "vite")).toBe(false);
  });
});

describe("painel por categoria", () => {
  const grupos = agruparPainel(painelFerramentas(feed, catalogos));

  it("agrupa por categoria do catálogo e só traz ferramentas com PR", () => {
    const todas = grupos.flatMap((g) => g.linhas.map((l) => l.id)).sort();
    expect(todas).toEqual(["docker", "n8n", "postgres", "react"]);
    for (const g of grupos) {
      expect(g.linhas.every((l) => l.categoria === g.categoria)).toBe(true);
      expect(g.linhas.every((l) => l.prs >= 1)).toBe(true);
    }
  });

  it("traz nº de PRs e 'desde' de cada ferramenta", () => {
    const linha = grupos.flatMap((g) => g.linhas).find((l) => l.id === "postgres");
    expect(linha).toMatchObject({ prs: 2, desde: 1 });
  });

  it("toda categoria do catálogo tem nome de exibição", () => {
    for (const c of CATEGORIAS) expect(NOMES_CATEGORIA[c]).toBeTruthy();
  });
});
