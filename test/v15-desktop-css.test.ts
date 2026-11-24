import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * V15 (2026-11-23): desktop por rota sem tocar no celular aprovado. Todo o CSS de desktop da V15 mora em
 * src/styles/desktop/, um arquivo por rota (ou par de rotas), e cada arquivo é UM bloco `@media (min-width: 80rem)`
 * e nada mais: uma regra solta fora dele alcançaria o 360 px. Cada arquivo é importado só pelas páginas da sua rota.
 * (A prova de geometria no navegador fica em e2e/v15-desktop.e2e.ts; esta guarda pega o erro antes do build.)
 */

const PASTA = join(process.cwd(), "src", "styles", "desktop");
const MEDIA = "@media (min-width: 80rem)";

/** Arquivo de desktop -> páginas que o importam (e só elas). */
const IMPORTADORES: Record<string, string[]> = {
  "home.css": ["src/pages/index.astro"],
  "ofertas.css": ["src/pages/consultoria.astro", "src/pages/educacao.astro"],
  "na-tv.css": ["src/pages/na-tv.astro"],
  "diario.css": ["src/pages/pedro/index.astro"],
  "explorar.css": ["src/pages/explorar/index.astro"],
  "trajetoria.css": ["src/pages/trajetoria.astro"],
};

function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * true se o CSS (sem comentários) é exatamente um bloco `@media (min-width: 80rem) { ... }`: começa nele, as chaves
 * fecham no último caractere e nada fica antes nem depois.
 */
function soBlocoDesktop(css: string): boolean {
  const t = semComentarios(css).trim();
  if (!t.startsWith(`${MEDIA} {`)) return false;
  let nivel = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "{") nivel++;
    else if (t[i] === "}") {
      nivel--;
      if (nivel === 0) return i === t.length - 1;
    }
  }
  return false;
}

function arquivosFonte(dir: string): string[] {
  const saida: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) saida.push(...arquivosFonte(p));
    else if (/\.(astro|ts|css|mjs)$/.test(e.name)) saida.push(p);
  }
  return saida;
}

describe("V15: o CSS de desktop fica atrás de 80 rem", () => {
  const arquivos = readdirSync(PASTA).filter((n) => n.endsWith(".css"));

  it("a pasta tem os 6 arquivos das 7 rotas do escopo (as 2 ofertas dividem um), nem mais nem menos", () => {
    expect(arquivos.sort()).toEqual(Object.keys(IMPORTADORES).sort());
  });

  for (const nome of Object.keys(IMPORTADORES)) {
    it(`${nome} é um único bloco ${MEDIA}`, () => {
      expect(soBlocoDesktop(readFileSync(join(PASTA, nome), "utf8"))).toBe(true);
    });
  }

  it("cada arquivo é importado só pelas páginas da sua rota", () => {
    const fontes = arquivosFonte(join(process.cwd(), "src"));
    const achados: Record<string, string[]> = {};
    for (const f of fontes) {
      const texto = readFileSync(f, "utf8");
      for (const m of texto.matchAll(/styles\/desktop\/([a-z-]+\.css)/g)) {
        const rel = relative(process.cwd(), f).split("\\").join("/");
        if (!achados[m[1]]) achados[m[1]] = [];
        achados[m[1]].push(rel);
      }
    }
    for (const lista of Object.values(achados)) lista.sort();
    const esperado = Object.fromEntries(Object.entries(IMPORTADORES).map(([k, v]) => [k, [...v].sort()]));
    expect(achados).toEqual(esperado);
  });

  // Canários permanentes (L-0006): a guarda reprova o que deixaria o desktop escapar para o celular.
  describe("canários da guarda", () => {
    it("reprova regra solta antes do bloco", () => {
      expect(soBlocoDesktop(`.x { color: red; }\n${MEDIA} { .y { color: red; } }`)).toBe(false);
    });
    it("reprova regra solta depois do bloco", () => {
      expect(soBlocoDesktop(`${MEDIA} { .y { color: red; } }\n.x { color: red; }`)).toBe(false);
    });
    it("reprova outro ponto de quebra", () => {
      expect(soBlocoDesktop("@media (min-width: 40rem) { .y { color: red; } }")).toBe(false);
    });
    it("reprova dois blocos", () => {
      expect(soBlocoDesktop(`${MEDIA} { .y { color: red; } }\n${MEDIA} { .z { color: red; } }`)).toBe(false);
    });
    it("aceita um bloco com comentários antes, dentro e depois", () => {
      expect(soBlocoDesktop(`/* a */\n${MEDIA} {\n  /* b */\n  .y { color: red; }\n}\n/* c */\n`)).toBe(true);
    });
  });
});
