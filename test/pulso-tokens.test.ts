import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { type CopiaTokens, MAPA, compararTokens, reduzirTokens } from "../src/styles/pulso-deriva";

/**
 * V05 · ADR 008 item 4: `src/styles/pulso-tokens.json` é a cópia versionada dos tokens do Pulso
 * (origem: D:/videos/design-system-pulso/tokens.json, só leitura). Este teste reprova se
 * `src/styles/tokens.css` divergir dela nos tokens que existem dos dois lados (MAPA).
 */
const raiz = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(raiz, "src/styles/tokens.css"), "utf8");
const copia = JSON.parse(readFileSync(resolve(raiz, "src/styles/pulso-tokens.json"), "utf8")) as CopiaTokens;
const ORIGEM_LOCAL = process.env.PULSO_TOKENS_ORIGEM ?? "D:/videos/design-system-pulso/tokens.json";

describe("deriva dos tokens do Pulso (cópia da bancada × tokens.css)", () => {
  it("tokens.css não diverge da cópia versionada", () => {
    expect(compararTokens(css, copia)).toEqual([]);
  });

  it("o mapa cobre cores, espaçamento, raio, traço, duração, easing e famílias de fonte", () => {
    const grupos = new Set(MAPA.map((m) => m.origem.split(".")[0]));
    expect([...grupos].sort()).toEqual(["color", "duracao", "easing", "radius", "spacing", "traco", "type"]);
    expect(MAPA.length).toBeGreaterThanOrEqual(30);
  });

  it("toda divergência declarada é real e tem motivo (exceção não pode apodrecer)", () => {
    const declaradas = MAPA.filter((m) => m.divergencia);
    expect(declaradas.map((m) => m.css).sort()).toEqual(["--fonte-mono", "--sinal-fraco"]);
    for (const m of declaradas) expect(m.divergencia?.motivo.length, m.css).toBeGreaterThan(20);
  });

  it("reprova uma exceção obsoleta (o site já igualou a origem)", () => {
    const igualado = css.replace("--sinal-fraco: #1b6fb0;", "--sinal-fraco: #2a6fae;");
    expect(compararTokens(igualado, copia).join("\n")).toMatch(/--sinal-fraco.*exceção obsoleta|--sinal-fraco.*divergência declarada/);
  });

  describe("canários (L-0006): token mudado de um lado só é reprovado", () => {
    it("cor alterada no tokens.css", () => {
      const ruim = css.replace("--amarelo: #ffc400;", "--amarelo: #ffc401;");
      expect(ruim).not.toBe(css);
      expect(compararTokens(ruim, copia).join("\n")).toMatch(/--amarelo/);
    });

    it("duração, raio, espaçamento, traço e easing alterados", () => {
      for (const [de, para, token] of [
        ["--dur-curta: 200ms;", "--dur-curta: 250ms;", "--dur-curta"],
        ["--raio-card: 0.5rem;", "--raio-card: 0.75rem;", "--raio-card"],
        ["--espaco-3: 1.5rem;", "--espaco-3: 1.25rem;", "--espaco-3"],
        ["--traco-borda: 0.25rem;", "--traco-borda: 0.3rem;", "--traco-borda"],
        ["--ease-entra: cubic-bezier(0.16, 1, 0.3, 1);", "--ease-entra: ease-out;", "--ease-entra"],
      ] as const) {
        const ruim = css.replace(de, para);
        expect(ruim, token).not.toBe(css);
        expect(compararTokens(ruim, copia).join("\n"), token).toMatch(new RegExp(token));
      }
    });

    it("token removido do tokens.css", () => {
      const ruim = css.replace(/^\s*--sinal: #3aa6ff;\n/m, "");
      expect(compararTokens(ruim, copia).join("\n")).toMatch(/--sinal\b.*ausente/);
    });

    it("cor alterada na cópia (lado da bancada)", () => {
      const outra = structuredClone(copia);
      const t = outra.color.tokens.find((x) => x.name === "grafite");
      expect(t).toBeDefined();
      if (t) t.value = "#121212";
      expect(compararTokens(css, outra).join("\n")).toMatch(/--grafite/);
    });

    it("tinta, que na origem é referência a grafite, acompanha a mudança do grafite", () => {
      const outra = structuredClone(copia);
      const t = outra.color.tokens.find((x) => x.name === "grafite");
      if (t) t.value = "#121212";
      const msg = compararTokens(css, outra).join("\n");
      expect(msg).toMatch(/--tinta\b/);
    });
  });

  it("a cópia não leva texto de uso/notas da bancada (só nome e valor)", () => {
    const texto = JSON.stringify(copia);
    expect(texto).not.toMatch(/"usage"|"note"/);
  });

  // Só roda na máquina do Pedro (a bancada não existe no CI): a cópia tem de ser a redução fiel da origem.
  it.skipIf(!existsSync(ORIGEM_LOCAL))("a cópia é a redução fiel de tokens.json da bancada (local)", () => {
    const origem = JSON.parse(readFileSync(ORIGEM_LOCAL, "utf8"));
    const esperado = reduzirTokens(origem);
    const { sincronizado_em: _a, ...atual } = copia as CopiaTokens & { sincronizado_em?: string };
    const { sincronizado_em: _b, ...ref } = esperado as CopiaTokens & { sincronizado_em?: string };
    expect(atual).toEqual(ref);
  });
});

describe("reduzirTokens", () => {
  it("guarda só nome e valor dos grupos mapeados e descarta o resto", () => {
    const r = reduzirTokens({
      name: "x",
      color: { note: "n", tokens: [{ name: "a", value: "#fff", usage: "u" }] },
      type: { families: { titulo: "T", corpo: "C", mono: "M" }, groups: [1] },
      spacing: { tokens: [] },
      radius: { tokens: [] },
      duracao: { tokens: [] },
      easing: { tokens: [] },
      traco: { tokens: [] },
      canvas: { tokens: [{ name: "w", value: "1px" }] },
    });
    expect(r.color.tokens).toEqual([{ name: "a", value: "#fff" }]);
    expect(r.type.families).toEqual({ titulo: "T", corpo: "C", mono: "M" });
    expect(Object.keys(r)).not.toContain("canvas");
  });
});
