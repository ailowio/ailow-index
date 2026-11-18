import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { apresentacao } from "../src/data/apresentacao";
import {
  cartao,
  normalizarNumero,
  ramoCompartilhar,
  textoWhatsapp,
  URL_APRESENTACAO,
  urlWhatsapp,
} from "../src/data/cartao";

const raiz = join(import.meta.dirname, "..");

describe("cartão: normalização do número", () => {
  const validos: [string, string][] = [
    ["+55 85 99999-9999", "5585999999999"],
    ["+55 (85) 9999-9999", "558599999999"],
    ["(85) 99999-9999", "5585999999999"],
    ["85 9999-9999", "558599999999"],
    ["85.99999.9999", "5585999999999"],
    ["85999999999", "5585999999999"],
    ["8599999999", "558599999999"],
    ["085 99999-9999", "5585999999999"],
    ["085 9999-9999", "558599999999"],
    ["0055 85 99999-9999", "5585999999999"],
    ["00 1 415 555 2671", "14155552671"],
    ["+1 (415) 555-2671", "14155552671"],
    ["+351 912 345 678", "351912345678"],
    ["5585999999999", "5585999999999"],
    ["  +55-85-99999-9999  ", "5585999999999"],
  ];
  for (const [entrada, saida] of validos) {
    it(`"${entrada}" -> ${saida}`, () => {
      expect(normalizarNumero(entrada)).toBe(saida);
    });
  }

  const invalidos: [string, string][] = [
    ["", "vazio"],
    ["   ", "só espaços"],
    ["12345", "curto"],
    ["99999-9999", "9 dígitos sem DDD"],
    ["8599999999999999", "longo demais"],
    ["+55 85 99999-9999 1234567", "longo demais com +"],
    ["85 9999-ABCD", "com letras"],
    ["abc", "só letras"],
    ["85+99999999", "+ no meio"],
    ["+", "só o +"],
    ["+55", "só o país"],
    ["00", "só o 00"],
    ["8599999999 ext 12", "texto extra"],
    ["85/99999999", "barra"],
  ];
  for (const [entrada, motivo] of invalidos) {
    it(`inválido (${motivo}): "${entrada}"`, () => {
      expect(normalizarNumero(entrada)).toBeNull();
    });
  }
});

describe("cartão: wa.me", () => {
  it("a URL de apresentação vem do domínio travado do site", () => {
    expect(URL_APRESENTACAO).toBe("https://ailow.com.br/apresentacao");
  });

  it("o texto é a saudação exata da apresentação + espaço + link", () => {
    expect(textoWhatsapp()).toBe(`${apresentacao.saudacao} https://ailow.com.br/apresentacao`);
  });

  it("a URL tem o número normalizado e o texto codificado", () => {
    const esperado =
      "https://wa.me/5585999999999?text=" +
      encodeURIComponent(
        "Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição. https://ailow.com.br/apresentacao",
      );
    expect(urlWhatsapp("5585999999999")).toBe(esperado);
    expect(esperado).toContain("Muito%20prazer%2C%20meu%20nome%20%C3%A9%20Pedro.");
    expect(esperado).toContain("%3B%20fico%20%C3%A0%20disposi%C3%A7%C3%A3o.");
    expect(esperado).toContain("https%3A%2F%2Failow.com.br%2Fapresentacao");
  });
});

describe("cartão: compartilhar", () => {
  const arq = { nome: "Apresentação", caminho: "/cartao/apresentacao.pdf", tipo: "application/pdf" };

  it("a fonte do material está vazia por enquanto (o Pedro acrescenta o PDF)", () => {
    expect(cartao.material).toEqual([]);
  });

  it("sem material e sem navigator.share: só o link", () => {
    expect(ramoCompartilhar({ material: [], podeArquivos: false, temShare: false })).toBe("link");
  });

  it("sem material com navigator.share: compartilha o link", () => {
    expect(ramoCompartilhar({ material: [], podeArquivos: true, temShare: true })).toBe("url");
  });

  it("com material e canShare({files}) verdadeiro: compartilha os arquivos", () => {
    expect(ramoCompartilhar({ material: [arq], podeArquivos: true, temShare: true })).toBe("arquivos");
  });

  it("com material mas canShare({files}) falso: cai no link do share", () => {
    expect(ramoCompartilhar({ material: [arq], podeArquivos: false, temShare: true })).toBe("url");
  });

  it("com material e nada de share: só o link", () => {
    expect(ramoCompartilhar({ material: [arq], podeArquivos: false, temShare: false })).toBe("link");
  });

  it("o material configurado aponta para arquivos que existem", () => {
    for (const m of cartao.material) expect(existsSync(join(raiz, "public", m.caminho)), m.caminho).toBe(true);
  });
});

describe("cartão: escondido", () => {
  const AUTORIZADOS = new Set([
    "src/pages/cartao.astro",
    "src/data/cartao.ts",
    "src/styles/cartao.css",
    "public/cartao/sw.js",
    "public/cartao/manifest.webmanifest",
    "scripts/orcamentos-peso.json",
  ]);

  function arquivos(dir: string): string[] {
    const saida: string[] = [];
    for (const nome of readdirSync(dir)) {
      if (nome === "node_modules" || nome === "dist" || nome === ".astro" || nome === ".git" || nome.startsWith(".tmp")) continue;
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) saida.push(...arquivos(p));
      else saida.push(p);
    }
    return saida;
  }

  it("nenhum arquivo de src/ ou public/ aponta para /cartao além dos do próprio cartão", () => {
    const achados: string[] = [];
    for (const base of ["src", "public"]) {
      for (const p of arquivos(join(raiz, base))) {
        if (!/\.(astro|ts|css|json|md|svg|js|webmanifest|html)$/.test(p)) continue;
        const rel = relative(raiz, p).split("\\").join("/");
        if (AUTORIZADOS.has(rel)) continue;
        if (/\/cartao\b/.test(readFileSync(p, "utf8"))) achados.push(rel);
      }
    }
    expect(achados).toEqual([]);
  });

  it("não há sitemap nem robots.txt listando o cartão", () => {
    expect(existsSync(join(raiz, "public", "sitemap.xml"))).toBe(false);
    const cfg = readFileSync(join(raiz, "astro.config.mjs"), "utf8");
    // Hoje não há sitemap. Se um dia houver, o cartão tem de ser excluído (filter) e este teste revisto.
    expect(cfg).not.toMatch(/@astrojs\/sitemap/);
  });
});

describe("cartão: manifest", () => {
  const raizCartao = join(raiz, "public", "cartao");
  const manifest = JSON.parse(readFileSync(join(raizCartao, "manifest.webmanifest"), "utf8"));

  it("tem os campos exigidos e o escopo só do cartão", () => {
    expect(manifest.name).toMatch(/.+/);
    expect(manifest.short_name).toMatch(/.+/);
    expect(manifest.start_url).toBe("/cartao/");
    expect(manifest.scope).toBe("/cartao/");
    expect(manifest.id).toBe("/cartao/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("pt-BR");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  function tamanhoPng(arquivo: string): [number, number] {
    const b = readFileSync(arquivo);
    expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  }

  it("os ícones existem nos tamanhos declarados (192 e 512; um maskable)", () => {
    const icones: { src: string; sizes: string; type: string; purpose?: string }[] = manifest.icons;
    const tamanhos = new Set(icones.map((i) => i.sizes));
    expect(tamanhos.has("192x192")).toBe(true);
    expect(tamanhos.has("512x512")).toBe(true);
    expect(icones.some((i) => i.purpose === "maskable")).toBe(true);
    expect(icones.some((i) => (i.purpose ?? "any") === "any")).toBe(true);
    for (const i of icones) {
      expect(i.type).toBe("image/png");
      expect(i.src.startsWith("/cartao/")).toBe(true);
      const arquivo = join(raiz, "public", i.src);
      expect(existsSync(arquivo), i.src).toBe(true);
      const [l, a] = i.sizes.split("x").map(Number);
      expect(tamanhoPng(arquivo), i.src).toEqual([l, a]);
    }
  });
});
