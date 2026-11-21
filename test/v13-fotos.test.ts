import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { lerEntradaMd } from "../src/changelog/fatos";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { frasesProibidas } from "../src/data/chao-de-fabrica";
import { carregarFluxos } from "../src/fluxos/carregar";
import { achadosSaneamento } from "../src/fluxos/esquema";
import { carregarFotos } from "../src/fotos/carregar";
import { esquemaFoto, TETO_FOTO_BYTES } from "../src/fotos/esquema";
import { violacoesPastaFotos } from "../src/fotos/pasta";
import { dimensoesWebp } from "../src/fotos/webp";
import { TETOS } from "../src/midia/pacote";

/**
 * V13 (2026-11-20; ADR 008, revisão "fotos estáticas do Explorador"): o Explorador ganha o modo foto. Duas fotos
 * reais do chão de fábrica (quadros de vídeo do acervo da bancada, recortados e revisados um a um) com pontos
 * tocáveis. Regras: WebP ≤ 80 KB, só na pasta permitida, toda foto referenciada e todo arquivo referenciado existe;
 * cada ponto dentro da imagem; textos passam no linter, no saneamento e nas frases proibidas; nada de
 * "conforme a NR" (sem laudo, #047). Canários no fim.
 */

const raiz = join(import.meta.dirname, "..");
const fotos = carregarFotos(raiz);
const publico = join(raiz, "public");
const pastaPrs = join(raiz, "src", "content", "prs");

/** Número -> { status_fato, confirmado } das entradas do Diário de obra. */
function entradas(): Map<number, { confirmado: boolean; status?: string }> {
  const m = new Map<number, { confirmado: boolean; status?: string }>();
  for (const n of readdirSync(pastaPrs).filter((a) => a.endsWith(".md"))) {
    const md = readFileSync(join(pastaPrs, n), "utf8");
    const e = lerEntradaMd(md);
    if (e) m.set(e.numero, { confirmado: /^verificacao:\s*confirmado\s*$/m.test(md), status: e.status_fato });
  }
  return m;
}

/** Afirmar conformidade com norma sem laudo é proibido (bancada, gate 7; #047 diz "não é laudo nem certificação"). */
const CONFORMIDADE = /\bconforme\s+(?:[àa]s?\s+)?NR|\bem conformidade\b|\bcertificad[oa]s?\b(?! nem)|\blaudo aprovado\b/i;

const textoDe = (f: (typeof fotos)[number]) =>
  [f.titulo, f.alt, f.resumo, f.historia, f.credito, ...f.pontos.flatMap((p) => [p.rotulo, p.oQueE, p.detalhe])].join("\n");

describe("fotos do Explorador (V13): conteúdo", () => {
  it("são as duas fotos do escopo: quadro de comando (#047) e caixa do gateway (#081), nessa ordem", () => {
    expect(fotos.map((f) => [f.slug, f.pr])).toEqual([
      ["quadro-de-comando", 47],
      ["caixa-do-gateway", 81],
    ]);
  });

  it("cada foto cita só entradas publicadas (confirmado) do Diário de obra, e a principal está entre elas", () => {
    const e = entradas();
    for (const f of fotos) {
      expect(f.fatos, f.slug).toContain(f.pr);
      for (const n of f.fatos) expect(e.get(n)?.confirmado, `${f.slug} #${n}`).toBe(true);
    }
  });

  it("o slug não colide com o de um fluxo (as duas famílias dividem /explorar/<slug>)", () => {
    const fluxos = new Set(carregarFluxos(raiz).map((f) => f.slug));
    for (const f of fotos) expect(fluxos.has(f.slug), f.slug).toBe(false);
  });

  it("tem de 3 a 8 pontos, ids e rótulos únicos, cada um dentro da imagem (0 < x, y < 100)", () => {
    for (const f of fotos) {
      expect(f.pontos.length).toBeGreaterThanOrEqual(3);
      expect(f.pontos.length).toBeLessThanOrEqual(8);
      expect(new Set(f.pontos.map((p) => p.id)).size).toBe(f.pontos.length);
      expect(new Set(f.pontos.map((p) => p.rotulo)).size).toBe(f.pontos.length);
      for (const p of f.pontos) {
        expect(p.x, `${f.slug}/${p.id}`).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(100);
        expect(p.y, `${f.slug}/${p.id}`).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(100);
      }
    }
  });

  it("texto alternativo descreve a cena (sem começar por 'foto de' ou 'imagem de')", () => {
    for (const f of fotos) {
      expect(f.alt.length, f.slug).toBeGreaterThanOrEqual(60);
      expect(f.alt, f.slug).not.toMatch(/^(foto|imagem|figura) d[eo]/i);
    }
  });

  it("os textos passam no linter de conteúdo, no saneamento, nas frases proibidas e não afirmam conformidade", () => {
    const termos = carregarTermosLocais(raiz);
    for (const f of fotos) {
      const t = textoDe(f);
      expect(lintConteudo(t, termos), f.slug).toEqual([]);
      expect(achadosSaneamento(t), f.slug).toEqual([]);
      expect(frasesProibidas(t), f.slug).toEqual([]);
      expect(t, f.slug).not.toMatch(CONFORMIDADE);
    }
  });

  it("a caixa do gateway fala da implantação com o verbo do status da #081 (construindo), nunca 'em uso'", () => {
    const e = entradas();
    expect(e.get(81)?.status).toBe("construindo");
    const t = textoDe(fotos[1]);
    expect(t).toMatch(/em andamento|estou construindo/i);
    expect(t).not.toMatch(/\bem uso\b|\bem produção\b/i);
  });

  it("as páginas das fotos são indexáveis (sitemap)", () => {
    for (const f of fotos) expect(ROTAS_INDEXAVEIS).toContain(`/explorar/${f.slug}/`);
  });
});

describe("fotos do Explorador (V13): arquivos", () => {
  it("o teto é o do pôster do ADR 008 (80 KB)", () => {
    expect(TETO_FOTO_BYTES).toBe(TETOS.posterBytes);
    expect(TETO_FOTO_BYTES).toBe(80_000);
  });

  it("cada imagem existe, é WebP, tem ≤ 80 KB e as dimensões declaradas (width/height) são as do arquivo", () => {
    for (const f of fotos) {
      const caminho = join(publico, f.imagem.arquivo);
      const bytes = statSync(caminho).size;
      expect(bytes, f.slug).toBeLessThanOrEqual(TETO_FOTO_BYTES);
      expect(dimensoesWebp(readFileSync(caminho)), f.slug).toEqual({ largura: f.imagem.largura, altura: f.imagem.altura });
    }
  });

  it("public/explorar só tem as fotos referenciadas (lista de permissões: fotos/*.webp)", () => {
    expect(violacoesPastaFotos(join(publico, "explorar"), fotos.map((f) => f.imagem.arquivo))).toEqual([]);
  });
});

describe("fotos do Explorador (V13): canários", () => {
  /** WebP mínimo válido (VP8L 1x1) com `extra` bytes de enchimento num chunk desconhecido. */
  function webp(extra = 0): Buffer {
    const vp8l = Buffer.from([0x2f, 0x00, 0x00, 0x00, 0x00, 0x88, 0x88, 0x08, 0x00]);
    const chunk = Buffer.concat([Buffer.from("VP8L"), Buffer.from([vp8l.length, 0, 0, 0]), vp8l, Buffer.alloc(1)]);
    const enchimento = extra > 0 ? Buffer.concat([Buffer.from("XTRA"), u32(extra), Buffer.alloc(extra)]) : Buffer.alloc(0);
    const corpo = Buffer.concat([Buffer.from("WEBP"), chunk, enchimento]);
    return Buffer.concat([Buffer.from("RIFF"), u32(corpo.length), corpo]);
  }
  function u32(n: number): Buffer {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n);
    return b;
  }

  it("o leitor de WebP lê 1x1 e recusa o que não é WebP", () => {
    expect(dimensoesWebp(webp())).toEqual({ largura: 1, altura: 1 });
    expect(() => dimensoesWebp(Buffer.from("\x89PNG\r\n\x1a\n0000000000000000000000"))).toThrow(/WebP/);
  });

  it("a pasta reprova arquivo acima do teto, extensão fora da lista, pasta fora de fotos/, arquivo órfão e referência ausente", () => {
    const dir = mkdtempSync(join(tmpdir(), "v13-fotos-"));
    try {
      mkdirSync(join(dir, "fotos"));
      mkdirSync(join(dir, "outra"));
      writeFileSync(join(dir, "fotos", "ok.webp"), webp());
      writeFileSync(join(dir, "fotos", "grande.webp"), webp(TETO_FOTO_BYTES));
      writeFileSync(join(dir, "fotos", "bruta.png"), "x");
      writeFileSync(join(dir, "fotos", "orfa.webp"), webp());
      writeFileSync(join(dir, "fotos", "falsa.webp"), "não é webp");
      writeFileSync(join(dir, "outra", "x.webp"), webp());
      const v = violacoesPastaFotos(dir, [
        "/explorar/fotos/ok.webp",
        "/explorar/fotos/grande.webp",
        "/explorar/fotos/falsa.webp",
        "/explorar/fotos/sumiu.webp",
      ]).join("\n");
      expect(v).toMatch(/grande\.webp: .*acima de 80000/);
      expect(v).toMatch(/bruta\.png: fora da lista/);
      expect(v).toMatch(/orfa\.webp: não referenciad/);
      expect(v).toMatch(/falsa\.webp: não é WebP/);
      expect(v).toMatch(/outra\/x\.webp: fora da lista/);
      expect(v).toMatch(/sumiu\.webp: referenciad[ao] e ausente/);
      expect(v).not.toMatch(/ok\.webp/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("o esquema recusa ponto fora da imagem, imagem fora da pasta e campo a mais", () => {
    const base = structuredClone(fotos[0]);
    expect(esquemaFoto.safeParse(base).success).toBe(true);
    expect(esquemaFoto.safeParse({ ...base, pontos: [{ ...base.pontos[0], x: 120 }, ...base.pontos.slice(1)] }).success).toBe(
      false,
    );
    expect(esquemaFoto.safeParse({ ...base, imagem: { ...base.imagem, arquivo: "/midia/x.webp" } }).success).toBe(false);
    expect(esquemaFoto.safeParse({ ...base, imagem: { ...base.imagem, arquivo: "/explorar/fotos/x.png" } }).success).toBe(
      false,
    );
    expect(esquemaFoto.safeParse({ ...base, exif: "x" }).success).toBe(false);
    expect(esquemaFoto.safeParse({ ...base, fatos: [999] }).success).toBe(false);
  });

  it("o detector de conformidade pega 'conforme a NR-10' e deixa passar 'não é laudo nem certificação'", () => {
    expect("Quadro conforme a NR-10").toMatch(CONFORMIDADE);
    expect("Quadro em conformidade com a norma").toMatch(CONFORMIDADE);
    expect("Não é laudo nem certificação.").not.toMatch(CONFORMIDADE);
  });
});
