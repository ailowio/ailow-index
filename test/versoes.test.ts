import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { VERSAO } from "../src/config/versao";
import { carregarVersoes, lerChangelog, segmentos } from "../src/data/versoes";

/**
 * S12e: o rodapé mostra a versão do package.json e /versoes mostra o CHANGELOG.
 * A versão do pacote é a fonte única; o CHANGELOG tem de acompanhar (e a tag, no workflow Publicar).
 */
const raiz = resolve(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const changelog = ler("CHANGELOG.md");
const pkg = JSON.parse(ler("package.json")) as { version: string };

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const CABECALHO = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\s*$/gm;

function dataValida(s: string): boolean {
  const [a, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const cmp = (x: string, y: string) => {
  const a = x.split(".").map(Number);
  const b = y.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

describe("versão única: package.json = CHANGELOG", () => {
  const secoes = [...changelog.matchAll(CABECALHO)].map((m) => ({ versao: m[1], data: m[2] }));

  it("a versão do package.json é SemVer e igual à primeira seção publicada do CHANGELOG (ignora [Unreleased])", () => {
    expect(pkg.version).toMatch(SEMVER);
    expect(secoes.length).toBeGreaterThan(0);
    expect(pkg.version).toBe(secoes[0].versao);
  });

  it("todo cabeçalho publicado é `## [x.y.z] - AAAA-MM-DD`, SemVer, com data de calendário válida", () => {
    const publicados = changelog.split(/\r?\n/).filter((l) => /^## \[/.test(l) && !/^## \[Unreleased\]\s*$/.test(l));
    expect(publicados.length).toBe(secoes.length);
    for (const s of secoes) {
      expect(s.versao, s.versao).toMatch(SEMVER);
      expect(dataValida(s.data), `${s.versao} ${s.data}`).toBe(true);
    }
  });

  it("as seções estão em ordem decrescente de versão e as datas não crescem", () => {
    for (let i = 1; i < secoes.length; i++) {
      expect(cmp(secoes[i - 1].versao, secoes[i].versao), `${secoes[i - 1].versao} antes de ${secoes[i].versao}`).toBeGreaterThan(0);
      expect(secoes[i - 1].data >= secoes[i].data, `${secoes[i - 1].data} >= ${secoes[i].data}`).toBe(true);
    }
  });

  it("o código lê a mesma versão do package.json", () => {
    expect(VERSAO).toBe(pkg.version);
  });
});

describe("lerChangelog (parser do CHANGELOG para /versoes)", () => {
  const amostra = [
    "# Changelog",
    "",
    "Texto de abertura. Tags publicadas: `v1.0.0`.",
    "",
    "## [Unreleased]",
    "",
    "## [1.1.0] - 2026-11-18",
    "",
    "### Adicionado",
    "- Primeiro item com `codigo` e [um link](https://exemplo.com/x).",
    "",
    "### Corrigido",
    "- Conserto A.",
    "",
    "### Adicionado",
    "- Segundo item de adicionado.",
    "",
    "### Corrigido",
    "- Conserto B.",
    "",
    "## [1.0.0] - 2026-11-17",
    "",
    "Primeira versão publicável.",
    "",
    "### Adicionado",
    "- Tudo.",
    "  continuação do item.",
    "",
    "## [0.1.0] - 2026-11-16",
    "",
    "Bootstrap do app.",
  ].join("\n");

  it("devolve só as versões publicadas, mais recente primeiro, com número e data", () => {
    const v = lerChangelog(amostra);
    expect(v.map((x) => x.versao)).toEqual(["1.1.0", "1.0.0", "0.1.0"]);
    expect(v.map((x) => x.data)).toEqual(["2026-11-18", "2026-11-17", "2026-11-16"]);
  });

  it("omite [Unreleased] vazio e mostra quando tem item", () => {
    expect(lerChangelog(amostra).some((x) => x.versao === "Unreleased")).toBe(false);
    const com = lerChangelog(amostra.replace("## [Unreleased]\n", "## [Unreleased]\n\n### Alterado\n- Algo novo.\n"));
    expect(com[0].versao).toBe("Não publicada");
    expect(com[0].data).toBeNull();
    expect(com[0].grupos[0].itens).toHaveLength(1);
  });

  it("mescla seções repetidas do mesmo tipo dentro da versão, na ordem da primeira aparição", () => {
    const v = lerChangelog(amostra)[0];
    expect(v.grupos.map((g) => g.nome)).toEqual(["Adicionado", "Corrigido"]);
    expect(v.grupos[0].itens).toHaveLength(2);
    expect(v.grupos[1].itens).toHaveLength(2);
  });

  it("guarda o texto de abertura da versão e junta a continuação do item", () => {
    const v = lerChangelog(amostra);
    expect(v[1].resumo).toBe("Primeira versão publicável.");
    expect(v[2].resumo).toBe("Bootstrap do app.");
    expect(v[2].grupos).toEqual([]);
    expect(v[1].grupos[0].itens[0]).toBe("Tudo. continuação do item.");
  });

  it("não deixa o texto de abertura do arquivo (antes da 1a versão) virar item de versão", () => {
    const v = lerChangelog(amostra);
    expect(JSON.stringify(v)).not.toContain("Texto de abertura");
  });
});

describe("segmentos (texto seguro de um item)", () => {
  it("`código` vira segmento de código; o resto é texto", () => {
    expect(segmentos("Use `npm run verify` agora")).toEqual([
      { tipo: "texto", valor: "Use " },
      { tipo: "codigo", valor: "npm run verify" },
      { tipo: "texto", valor: " agora" },
    ]);
  });

  it("link markdown vira só o texto do link (a URL some)", () => {
    expect(segmentos("veja [o PR](https://x.test/pr/1) já")).toEqual([{ tipo: "texto", valor: "veja o PR já" }]);
  });

  it("não interpreta HTML: o valor sai cru para o Astro escapar", () => {
    expect(segmentos("<script>alert(1)</script> e `<b>`")).toEqual([
      { tipo: "texto", valor: "<script>alert(1)</script> e " },
      { tipo: "codigo", valor: "<b>" },
    ]);
  });

  it("link dentro de código não é desmontado", () => {
    expect(segmentos("`[a](b)`")).toEqual([{ tipo: "codigo", valor: "[a](b)" }]);
  });
});

describe("rota escondida do cartão não vaza em /versoes", () => {
  it("a rota /cartao some do texto, em código ou solta (e2e do cartão: nenhuma página cita /cartao)", () => {
    const md = "## [1.0.0] - 2026-11-18\n\n### Adicionado\n- S10, cartão de visita `/cartao/` (rota escondida).\n- Fora de /cartao/ e do `/cartao`.\n";
    const texto = JSON.stringify(lerChangelog(md));
    expect(texto).not.toMatch(/\/cartao/);
    expect(texto).toContain("cartão de visita (rota escondida)");
  });

  it("o CHANGELOG real, depois do parser, não cita /cartao", () => {
    expect(JSON.stringify(carregarVersoes())).not.toMatch(/\/cartao/);
  });
});

describe("carregarVersoes (lê o CHANGELOG real)", () => {
  it("devolve uma entrada por seção publicada, com a atual primeiro", () => {
    const esperadas = [...changelog.matchAll(CABECALHO)].length;
    const v = carregarVersoes();
    expect(v.filter((x) => x.data !== null)).toHaveLength(esperadas);
    expect(v[0].versao).toBe(pkg.version);
  });

  it("a 1.1.0 real junta os dois `Corrigido` e os dois `Adicionado`", () => {
    const v = carregarVersoes().find((x) => x.versao === "1.1.0");
    expect(v).toBeDefined();
    const nomes = (v?.grupos ?? []).map((g) => g.nome);
    expect(nomes.filter((n) => n === "Corrigido")).toHaveLength(1);
    expect(nomes.filter((n) => n === "Adicionado")).toHaveLength(1);
  });
});
