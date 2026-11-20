import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { conciliar, lerClaims, lerCsv, lerEntradaMd, relatorio } from "../src/changelog/fatos";

/** V10 (2026-11-20, ADR 006 item 4): conciliação bancada x site. O CI só usa fixture sintético; nunca a bancada. */
const raiz = resolve(import.meta.dirname, "..");
const pastaFixture = join(raiz, "test", "fixtures", "fatos");
const csvFixture = join(pastaFixture, "claims.csv");
const prsFixture = join(pastaFixture, "prs");

describe("leitor de CSV", () => {
  it("ignora o BOM, lê aspas, vírgula dentro de aspas e aspas escapadas", () => {
    const linhas = lerCsv('﻿a,b\r\n"x, y","diz ""oi"""\r\n');
    expect(linhas).toEqual([
      ["a", "b"],
      ["x, y", 'diz "oi"'],
    ]);
  });

  it("aceita quebra de linha dentro de aspas e fim sem quebra", () => {
    expect(lerCsv('a,b\n"1\n2",3')).toEqual([
      ["a", "b"],
      ["1\n2", "3"],
    ]);
  });

  it("recusa aspas não fechadas", () => {
    expect(() => lerCsv('a,b\n"x,y')).toThrow(/aspas/);
  });
});

describe("leitura dos claims", () => {
  it("exige as colunas id, afirmacao e status_declarado", () => {
    expect(() => lerClaims("id,afirmacao\nC1,x\n")).toThrow(/status_declarado/);
  });

  it("sem a coluna fato_site avisa e trata tudo como sem fato", () => {
    const r = lerClaims("id,afirmacao,status_declarado\nC1,x,Em produção\n");
    expect(r.temColunaFatoSite).toBe(false);
    expect(r.claims[0]?.fatos).toEqual([]);
  });

  it("aceita vários ids e recusa formato inválido", () => {
    const ok = lerClaims("id,afirmacao,status_declarado,fato_site\nC1,x,Em produção,#001 #002\n");
    expect(ok.claims[0]?.fatos).toEqual([1, 2]);
    expect(() => lerClaims("id,afirmacao,status_declarado,fato_site\nC1,x,Em produção,20\n")).toThrow(/fato_site/);
  });
});

describe("leitura da entrada do site", () => {
  it("lê número, título e status_fato do frontmatter", () => {
    const e = lerEntradaMd(readFileSync(join(prsFixture, "002-emissor-de-notas.md"), "utf8"));
    expect(e).toMatchObject({ numero: 2, status_fato: "testando" });
    expect(e?.titulo).toMatch(/emissor/);
  });

  it("entrada sem status_fato fica sem o campo", () => {
    const e = lerEntradaMd(readFileSync(join(prsFixture, "003-relatorio-sem-status.md"), "utf8"));
    expect(e?.status_fato).toBeUndefined();
  });
});

function rodarFixture() {
  const { claims } = lerClaims(readFileSync(csvFixture, "utf8"));
  const fatos = ["001-sistema-de-pedidos", "002-emissor-de-notas", "003-relatorio-sem-status", "004-painel-de-estoque"].map(
    (n) => lerEntradaMd(readFileSync(join(prsFixture, `${n}.md`), "utf8")),
  );
  return conciliar(claims, fatos.filter((f) => f !== null));
}

describe("conciliação", () => {
  const r = rodarFixture();

  it("claim e site no mesmo status: consistente (inclui o alias 'Em implantação')", () => {
    expect(r.consistentes.map((c) => c.claim.id)).toEqual(["K01", "K08"]);
  });

  it("CANÁRIO: status diferente do site é divergência, com os dois lados", () => {
    expect(r.divergentes).toHaveLength(1);
    expect(r.divergentes[0]).toMatchObject({ fato: 2, esperado: "uso", site: "testando" });
    expect(r.divergentes[0]?.claim.id).toBe("K02");
  });

  it("CANÁRIO: id que não existe no site é listado", () => {
    expect(r.inexistentes.map((c) => [c.claim.id, c.fato])).toEqual([["K03", 999]]);
  });

  it("entrada sem status_fato ou claim sem verbo do PLANO §4 não é comparável", () => {
    expect(r.naoComparaveis.map((c) => c.claim.id)).toEqual(["K04", "K05"]);
  });

  it("sem fato_site: sugere só quando o texto obviamente corresponde", () => {
    const k06 = r.semFato.find((s) => s.claim.id === "K06");
    const k07 = r.semFato.find((s) => s.claim.id === "K07");
    expect(k06?.sugestao).toBe(4);
    expect(k07?.sugestao).toBeUndefined();
  });

  it("o relatório mostra as seções e os ids, sem expor o texto das entradas", () => {
    const md = relatorio(r, { origem: "claims.csv", entradas: 4, geradoEm: "2026-11-20" });
    expect(md).toMatch(/Divergências \(1\)/);
    expect(md).toMatch(/K02/);
    expect(md).toMatch(/#999/);
    expect(md).toMatch(/sugestão: #004/);
    expect(md).not.toMatch(/Fixture sintetica/);
  });
});

describe("comando conferir-fatos", () => {
  const rodar = (...args: string[]) =>
    spawnSync(process.execPath, ["--experimental-strip-types", "scripts/conferir-fatos.ts", ...args], {
      cwd: raiz,
      encoding: "utf8",
    });

  it("gera o relatório com divergência e sai com 0", () => {
    const r = rodar(csvFixture, "--prs", prsFixture);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/Divergências \(1\)/);
    expect(r.stdout).toMatch(/Ids inexistentes no site \(1\)/);
  });

  it("sai com 2 quando o arquivo não existe", () => {
    const r = rodar(join(pastaFixture, "nao-existe.csv"), "--prs", prsFixture);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/nao-existe/);
  });

  it("sai com 2 sem argumento e com CSV malformado", () => {
    expect(rodar().status).toBe(2);
    const tmp = mkdtempSync(join(tmpdir(), "fatos-"));
    try {
      const ruim = join(tmp, "ruim.csv");
      writeFileSync(ruim, 'id,afirmacao,status_declarado\nC1,"aberta,Em produção\n');
      expect(rodar(ruim, "--prs", prsFixture).status).toBe(2);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
