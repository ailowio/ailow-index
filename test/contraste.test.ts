import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { type Par, razao, tokensDoTema, verificarPares } from "../src/styles/contraste";

const raiz = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(raiz, "src/styles/tokens.css"), "utf8");
const { pares } = JSON.parse(
  readFileSync(resolve(raiz, "src/styles/pares-contraste.json"), "utf8"),
) as { pares: Par[] };

describe("contraste dos tokens do Pulso (ADR 003, D5)", () => {
  it("calcula a razão WCAG como o DS mede (branco/grafite 18,7; amarelo/estudio 1,4)", () => {
    expect(razao("#ffffff", "#111214")).toBeCloseTo(18.7, 0);
    expect(razao("#ffc400", "#eeeeeb")).toBeLessThan(1.5);
    expect(razao("#4a5057", "#111214")).toBeLessThan(2.4);
  });

  for (const tema of ["escuro", "claro"] as const) {
    it(`todo par declarado atinge o mínimo no tema ${tema}`, () => {
      const ruins = verificarPares(tokensDoTema(css, tema), pares, tema);
      expect(ruins.map((v) => `${v.par.texto}/${v.par.fundo}=${v.razao.toFixed(2)}`)).toEqual([]);
    });
  }

  it("todo token de texto (--texto*) aparece em algum par declarado", () => {
    const tokens = tokensDoTema(css, "escuro");
    const declarados = new Set(pares.map((p) => p.texto));
    // Papéis de cor de texto: --texto e --texto-<dígito> (os --texto-base/-pequeno etc. são tamanhos).
    const soltos = [...tokens.keys()].filter((k) => /^--texto(-\d+)?$/.test(k) && !declarados.has(k));
    expect(soltos).toEqual([]);
  });

  it("os pares proibidos do DS reprovam (amarelo sobre estudio, linha sobre grafite como texto)", () => {
    const ruim = new Map([
      ["--texto", "#ffc400"],
      ["--fundo", "#eeeeeb"],
    ]);
    const v = verificarPares(ruim, [{ texto: "--texto", fundo: "--fundo", min: 4.5 }], "claro");
    expect(v).toHaveLength(1);
    expect(v[0].razao).toBeLessThan(1.5);
  });

  it("o tema claro nunca usa amarelo ou linha como cor de texto", () => {
    const claro = tokensDoTema(css, "claro");
    for (const nome of ["--texto", "--texto-2", "--dado", "--foco"]) {
      expect(claro.get(nome)?.toLowerCase()).not.toBe("#ffc400");
      expect(claro.get(nome)?.toLowerCase()).not.toBe("#4a5057");
    }
  });
});
