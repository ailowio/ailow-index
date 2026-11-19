import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

/*
 * Ícones do app (favicon, apple-touch-icon e PWA do cartão): o A oficial da marca na cor de acento
 * do app (amarelo do Pulso) sobre o grafite, nunca o ciano da marca. Gerados por `scripts/icones.mjs`.
 */
const raiz = join(import.meta.dirname, "..");
const tokens = readFileSync(join(raiz, "src/styles/tokens.css"), "utf8");
const token = (nome: string) => {
  const m = tokens.match(new RegExp(`--${nome}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`token --${nome} ausente`);
  return m[1].toLowerCase();
};
const AMARELO = token("amarelo");
const GRAFITE = token("grafite");
const CIANO_MARCA = "#07bdd5";

const hexRgb = (h: string) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
/** Compara só RGB (o pixel pode trazer o alfa na 4a posição). */
const perto = (a: number[], b: number[], tol = 24) => b.every((v, i) => Math.abs(a[i] - v) <= tol);

/** Decodifica PNG 8 bits RGB/RGBA sem entrelaçamento (o que o gerador produz) em pixels RGBA. */
function lerPng(arquivo: string) {
  const b = readFileSync(arquivo);
  expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
  let p = 8;
  let largura = 0;
  let altura = 0;
  let tipo = 0;
  const dados: Buffer[] = [];
  while (p < b.length) {
    const tam = b.readUInt32BE(p);
    const nome = b.subarray(p + 4, p + 8).toString("ascii");
    const corpo = b.subarray(p + 8, p + 8 + tam);
    if (nome === "IHDR") {
      largura = corpo.readUInt32BE(0);
      altura = corpo.readUInt32BE(4);
      expect(corpo[8], "profundidade 8 bits").toBe(8);
      tipo = corpo[9];
      expect(corpo[12], "sem entrelaçamento").toBe(0);
    }
    if (nome === "IDAT") dados.push(corpo);
    p += 12 + tam;
  }
  expect([2, 6], "RGB ou RGBA").toContain(tipo);
  const bpp = tipo === 6 ? 4 : 3;
  const cru = inflateSync(Buffer.concat(dados));
  const linha = largura * bpp;
  const px = Buffer.alloc(altura * linha);
  for (let y = 0; y < altura; y++) {
    const filtro = cru[y * (linha + 1)];
    for (let x = 0; x < linha; x++) {
      const v = cru[y * (linha + 1) + 1 + x];
      const a = x >= bpp ? px[y * linha + x - bpp] : 0;
      const c = y > 0 ? px[(y - 1) * linha + x] : 0;
      const d = x >= bpp && y > 0 ? px[(y - 1) * linha + x - bpp] : 0;
      let r = v;
      if (filtro === 1) r = v + a;
      else if (filtro === 2) r = v + c;
      else if (filtro === 3) r = v + ((a + c) >> 1);
      else if (filtro === 4) {
        const pa = Math.abs(c - d);
        const pb = Math.abs(a - d);
        const pc = Math.abs(a + c - 2 * d);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? c : d);
      }
      px[y * linha + x] = r & 0xff;
    }
  }
  const cor = (x: number, y: number) => {
    const i = y * linha + x * bpp;
    return [px[i], px[i + 1], px[i + 2], bpp === 4 ? px[i + 3] : 255];
  };
  return { largura, altura, cor };
}

/** Conta pixels opacos por família de cor (amarelo, grafite, ciano). */
function contarCores(arquivo: string) {
  const { largura, altura, cor } = lerPng(arquivo);
  const n = { amarelo: 0, grafite: 0, ciano: 0, total: largura * altura };
  for (let y = 0; y < altura; y++)
    for (let x = 0; x < largura; x++) {
      const c = cor(x, y);
      if (c[3] < 200) continue;
      if (perto(c, hexRgb(AMARELO))) n.amarelo++;
      else if (perto(c, hexRgb(GRAFITE))) n.grafite++;
      else if (perto(c, hexRgb(CIANO_MARCA), 40)) n.ciano++;
    }
  return { ...n, largura, altura, cor };
}

const pngs: [string, number][] = [
  ["public/favicon-32.png", 32],
  ["public/apple-touch-icon.png", 180],
  ["public/cartao/icone-192.png", 192],
  ["public/cartao/icone-512.png", 512],
  ["public/cartao/icone-maskable-512.png", 512],
];

describe("ícones do app: A oficial em amarelo sobre grafite", () => {
  it("o favicon SVG usa os 5 paths oficiais da logo, na cor amarela, sobre o grafite", () => {
    const fav = readFileSync(join(raiz, "public/favicon.svg"), "utf8");
    const logo = readFileSync(join(raiz, "public/logo.svg"), "utf8");
    const caminhos = [...logo.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
    expect(caminhos).toHaveLength(5);
    for (const d of caminhos) expect(fav, "path oficial").toContain(d);
    expect(fav.toLowerCase()).toContain(`fill="${AMARELO}"`);
    expect(fav.toLowerCase()).toContain(`fill="${GRAFITE}"`);
    expect(fav.toLowerCase()).not.toContain(CIANO_MARCA);
  });

  for (const [arquivo, lado] of pngs) {
    it(`${arquivo}: ${lado}x${lado}, opaco, grafite no fundo e o A amarelo (sem ciano)`, () => {
      expect(existsSync(join(raiz, arquivo)), arquivo).toBe(true);
      const n = contarCores(join(raiz, arquivo));
      expect([n.largura, n.altura]).toEqual([lado, lado]);
      expect(perto(n.cor(1, 1), hexRgb(GRAFITE)), "canto em grafite (instalado não fica transparente)").toBe(true);
      expect(n.cor(1, 1)[3]).toBe(255);
      expect(n.amarelo / n.total, "A amarelo visível").toBeGreaterThan(0.08);
      expect(n.grafite / n.total, "fundo grafite").toBeGreaterThan(0.3);
      expect(n.ciano, "nenhum pixel no ciano da marca").toBe(0);
    });
  }

  it("o maskable deixa o A dentro da zona segura (círculo de 40% do lado)", () => {
    const { largura, altura, cor } = lerPng(join(raiz, "public/cartao/icone-maskable-512.png"));
    const cx = largura / 2;
    const cy = altura / 2;
    for (let y = 0; y < altura; y += 2)
      for (let x = 0; x < largura; x += 2) {
        if (Math.hypot(x - cx, y - cy) <= largura * 0.4) continue;
        expect(perto(cor(x, y), hexRgb(GRAFITE)), `pixel fora da zona segura em ${x},${y}`).toBe(true);
      }
  });

  it("o layout base declara favicon SVG, PNG 32 e apple-touch-icon em todas as páginas", () => {
    const base = readFileSync(join(raiz, "src/layouts/Base.astro"), "utf8");
    expect(base).toMatch(/<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/);
    expect(base).toMatch(/<link rel="icon" href="\/favicon-32\.png" sizes="32x32" type="image\/png" \/>/);
    expect(base).toMatch(/<link rel="apple-touch-icon" href="\/apple-touch-icon\.png" \/>/);
  });
});
