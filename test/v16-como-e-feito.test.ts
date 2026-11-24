import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appPorId } from "../src/config/apps";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { ADRS, GATES, type Gate, REPO, TOPO, url } from "../src/data/como-e-feito";
import { lerContagens } from "../src/data/como-e-feito-contagens";

/**
 * V16 (2026-11-24): a página "Como este site é feito" só afirma o que o repositório prova. Cada portão cita arquivos
 * que existem, e o job citado existe em ci.yml; os links de saída apontam para arquivos que existem; número só vem
 * do build. Canários no fim: o detector reprova arquivo inexistente, job inexistente e número digitado.
 */

const raiz = join(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const ci = ler(".github/workflows/ci.yml");

const ID_DO_ARQUIVO = (href: string): string => href.replace(`${REPO}/blob/main/`, "");

/** Devolve os problemas de um conjunto de portões (vazio = ok). */
function problemas(gates: readonly Gate[], ciYml: string, existe: (rel: string) => boolean): string[] {
  const erros: string[] = [];
  for (const g of gates) {
    for (const p of g.prova) if (!existe(p)) erros.push(`${g.id}: prova inexistente ${p}`);
    if (g.job && !new RegExp(`^ {2}${g.job}:\\n {4}name: ${g.job}$`, "m").test(ciYml)) {
      erros.push(`${g.id}: job ${g.job} não existe em ci.yml`);
    }
    for (const l of g.links) {
      if (!l.href.startsWith(`${REPO}/blob/main/`)) erros.push(`${g.id}: link fora do repositório ${l.href}`);
      else if (!existe(ID_DO_ARQUIVO(l.href))) erros.push(`${g.id}: link para arquivo inexistente ${l.href}`);
    }
    // Número só vem do build: o texto não traz algarismo (exceto os 2 tamanhos de tela do Playwright, 360 e 1280).
    const semTelas = g.texto.replace(/\b(360|1280) px\b/g, "").replace(/\bE2E\b/g, "");
    if (/\d/.test(semTelas)) erros.push(`${g.id}: número digitado no texto`);
  }
  return erros;
}

const existeNoDisco = (rel: string) => existsSync(join(raiz, rel));

describe("/como-e-feito: só fato conferido no repositório", () => {
  it("todo portão tem prova e link que existem, e o job citado existe no ci.yml", () => {
    expect(problemas(GATES, ci, existeNoDisco)).toEqual([]);
  });

  it("os 9 portões do plano estão na página, cada um uma vez", () => {
    expect(GATES.map((g) => g.id)).toEqual([
      "verify",
      "e2e",
      "axe",
      "peso",
      "terceiros",
      "seguranca",
      "imagem",
      "deploy",
      "lighthouse",
    ]);
  });

  it("o Lighthouse aparece como informativo até o Pedro decidir torná-lo obrigatório", () => {
    const l = GATES.find((g) => g.id === "lighthouse");
    expect(l?.informativo).toBe(true);
    expect(l?.texto).toMatch(/informativo/);
    expect(ci).toMatch(/^ {2}lighthouse:\n {4}name: lighthouse$/m);
  });

  it("os links dos ADRs e dos workflows apontam para arquivos que existem", () => {
    for (const a of ADRS) expect(existeNoDisco(`docs/adr/${a.arquivo}`), a.arquivo).toBe(true);
    for (const w of ["ci.yml", "deploy.yml", "publicar.yml"]) {
      expect(url.workflow(w)).toBe(`${REPO}/blob/main/.github/workflows/${w}`);
      expect(existeNoDisco(`.github/workflows/${w}`), w).toBe(true);
    }
  });

  it("todos os ADRs do repositório estão listados", () => {
    const listados = ADRS.map((a) => a.arquivo).sort();
    const noDisco = readdirAdr();
    expect(listados).toEqual(noDisco);
  });

  it("sem IP, segredo, nome de pessoa nem grafia errada da marca no texto público", () => {
    const tudo = JSON.stringify({ GATES, ADRS, TOPO });
    expect(tudo).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b|ssh-|secret|senha|token|@[a-z]+\.[a-z]/i);
    expect(tudo).not.toMatch(/\bilo\./);
    expect(tudo).not.toMatch(/\b(Pedro|Marcant|Copel)\b/);
  });

  it("as contagens da página vêm de arquivos reais, não de número digitado", () => {
    const c = lerContagens(raiz);
    expect(c.arquivosVitest).toBeGreaterThan(30);
    expect(c.arquivosE2E).toBeGreaterThan(20);
    const orc = JSON.parse(ler("scripts/orcamentos-peso.json"));
    expect(c.rotasComTeto).toBe(Object.keys(orc.rotas).length);
    expect(c.tetoJsPadraoKiB).toBe(orc.padrao.jsGzKB);
    expect(c.tetoPesoPadraoKiB).toBe(orc.padrao.pesoGzKB);
    const pagina = ler("src/pages/como-e-feito.astro");
    expect(pagina).not.toMatch(/<dd[^>]*>\s*\d/);
  });
});

describe("/como-e-feito: rota", () => {
  it("está no sitemap, tem selo de seção e orçamento de peso explícito", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/como-e-feito/");
    expect(appPorId("como-e-feito").rota).toBe("/como-e-feito");
    const orc = JSON.parse(ler("scripts/orcamentos-peso.json"));
    expect(orc.rotas["/como-e-feito"]).toEqual({ jsGzKB: 2, pesoGzKB: 60 });
  });

  it("o /sobre tem o link", () => {
    expect(ler("src/pages/sobre.astro")).toContain('href="/como-e-feito"');
  });

  it("não tem script próprio", () => {
    expect(ler("src/pages/como-e-feito.astro")).not.toMatch(/<script/);
  });
});

describe("CANÁRIO (L-0006): o detector reprova o que a página não pode afirmar", () => {
  const base: Gate = { id: "x", titulo: "x", texto: "texto sem número", prova: ["package.json"], links: [] };

  it("reprova prova inexistente", () => {
    expect(problemas([{ ...base, prova: ["nao/existe.ts"] }], ci, existeNoDisco)).toHaveLength(1);
  });

  it("reprova job que não está no ci.yml", () => {
    expect(problemas([{ ...base, job: "job-fantasma" }], ci, existeNoDisco)).toHaveLength(1);
  });

  it("reprova link de arquivo inexistente e link fora do repositório", () => {
    const g = { ...base, links: [{ rotulo: "a", href: url.arquivo("nao/existe.md") }] };
    expect(problemas([g], ci, existeNoDisco)).toHaveLength(1);
    const h = { ...base, links: [{ rotulo: "a", href: "https://exemplo.com/x" }] };
    expect(problemas([h], ci, existeNoDisco)).toHaveLength(1);
  });

  it("reprova número digitado no texto, mas aceita as telas de 360 e 1280 px", () => {
    expect(problemas([{ ...base, texto: "cobre 97% das rotas" }], ci, existeNoDisco)).toHaveLength(1);
    expect(problemas([{ ...base, texto: "em 360 px e em 1280 px" }], ci, existeNoDisco)).toEqual([]);
  });
});

function readdirAdr(): string[] {
  return readdirSync(join(raiz, "docs", "adr"))
    .filter((n) => /^\d{3}-.+\.md$/.test(n))
    .sort();
}
