import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { entrevistas } from "../src/data/entrevistas";

const raiz = join(import.meta.dirname, "..");
const dirPrs = join(raiz, "src", "content", "prs");
const LIMITE_IMAGEM = 80 * 1024;
const BLOQUEADOS = /cl[aá]udia|buhamra|viviane|bastos/i;

function lerPrs() {
  return readdirSync(dirPrs).map((nome) => {
    const txt = readFileSync(join(dirPrs, nome), "utf8");
    return {
      numero: Number(/^numero:\s*(\d+)/m.exec(txt)?.[1] ?? Number.NaN),
      confirmado: /^verificacao:\s*confirmado/m.test(txt),
      titulo: /^titulo:\s*"(.*)"/m.exec(txt)?.[1] ?? "",
    };
  });
}

/** Números das entradas confirmadas cujo título é `docs(talk)` de entrevista ou reportagem. */
function entrevistasDoFeed(): number[] {
  return lerPrs()
    .filter((p) => p.confirmado && /^docs\(talk\): (entrevista|reportagem)/.test(p.titulo))
    .map((p) => p.numero)
    .sort((a, b) => a - b);
}

describe("/pedro/entrevistas: dados", () => {
  it("a contagem é a das entradas confirmadas de entrevista/reportagem do feed (3)", () => {
    expect(entrevistasDoFeed()).toEqual([12, 14, 37]);
    expect(entrevistas.map((e) => e.feed).sort((a, b) => a - b)).toEqual(entrevistasDoFeed());
    expect(entrevistas).toHaveLength(3);
  });

  it("cada entrevista aponta para um número de feed publicado", () => {
    const publicados = new Set(lerPrs().filter((p) => p.confirmado).map((p) => p.numero));
    for (const e of entrevistas) expect(publicados.has(e.feed)).toBe(true);
  });

  it("ordem: mais recente primeiro", () => {
    const datas = entrevistas.map((e) => e.data);
    expect(datas).toEqual([...datas].sort().reverse());
  });

  it("nenhum texto cita entrevistador", () => {
    expect(JSON.stringify(entrevistas)).not.toMatch(BLOQUEADOS);
    const pagina = readFileSync(join(raiz, "src", "pages", "pedro", "entrevistas.astro"), "utf8");
    expect(pagina).not.toMatch(BLOQUEADOS);
  });

  it("o detector de nome reprova (canário permanente)", () => {
    expect("com a profa. Cláudia").toMatch(BLOQUEADOS);
    expect("Buhamra").toMatch(BLOQUEADOS);
  });
});

describe("/pedro/entrevistas: imagens", () => {
  it("cada imagem existe, é WebP e tem até 80 KB", () => {
    for (const e of entrevistas) {
      const arq = join(raiz, "public", e.imagem.replace(/^\//, ""));
      const tam = statSync(arq).size;
      expect(tam, e.imagem).toBeGreaterThan(0);
      expect(tam, e.imagem).toBeLessThanOrEqual(LIMITE_IMAGEM);
      expect(readFileSync(arq).subarray(8, 12).toString("ascii")).toBe("WEBP");
    }
  });

  it("alt descritivo e dimensões declaradas", () => {
    for (const e of entrevistas) {
      expect(e.alt.length).toBeGreaterThan(15);
      expect(e.largura).toBeGreaterThan(0);
      expect(e.altura).toBeGreaterThan(0);
    }
  });
});
