import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { lerLente, LENTE_PADRAO } from "../src/changelog/lente";
import { lerTitulo } from "../src/changelog/regras";
import { APPS } from "../src/config/apps";
import * as chao from "../src/data/chao-de-fabrica";
import { frasesProibidas } from "../src/data/chao-de-fabrica";
import * as consultoria from "../src/data/consultoria";
import { RESUMO_MAX, TOPO, VISITA } from "../src/data/diario";
import * as educacao from "../src/data/educacao";
import * as naTv from "../src/data/na-tv";
import principal from "./fixtures/v09-feed-main.json";

/**
 * V09 (2026-11-20; ADR 007 itens 3 e 4, ADR 002): o feed do /pedro vira "Diário de obra", com a lente
 * "Para empresários / Para técnicos". O campo opcional `resumo_dono` existe só nas entradas de vitrine (as que
 * /consultoria, /educacao, /chao-de-fabrica e /na-tv citam, mais as 3 da visita) e só diz o que a própria entrada
 * diz: nenhum número fora dela, nenhuma frase forte que o campo não confirma (lista da V08).
 */
const raiz = resolve(import.meta.dirname, "..");
const pastaPRs = join(raiz, "src", "content", "prs");

interface Entrada {
  numero: number;
  titulo: string;
  confirmada: boolean;
  estado: string;
  resumo: string | null;
  /** Arquivo inteiro, sem a linha do próprio resumo. */
  fonte: string;
}

function entradas(): Map<number, Entrada> {
  const mapa = new Map<number, Entrada>();
  for (const nome of readdirSync(pastaPRs).filter((n) => n.endsWith(".md"))) {
    const md = readFileSync(join(pastaPRs, nome), "utf8");
    const numero = Number(/^numero:\s*(\d+)/m.exec(md)?.[1]);
    mapa.set(numero, {
      numero,
      titulo: /^titulo:\s*"(.*)"\s*$/m.exec(md)?.[1] ?? "",
      confirmada: /^verificacao:\s*confirmado\s*$/m.test(md),
      estado: /^estado:\s*(\w+)/m.exec(md)?.[1] ?? "",
      resumo: /^resumo_dono:\s*"(.*)"\s*$/m.exec(md)?.[1] ?? null,
      fonte: md.replace(/^resumo_dono:.*$/m, ""),
    });
  }
  return mapa;
}

/** Números citados nos dados das páginas de vitrine: chaves `prs`, `fatos` (listas) e `feed` (número). */
function citados(...modulos: object[]): Set<number> {
  const achados = new Set<number>();
  const andar = (v: unknown, chave?: string) => {
    if (Array.isArray(v)) {
      if ((chave === "prs" || chave === "fatos") && v.every((x) => typeof x === "number")) {
        for (const n of v) achados.add(n);
        return;
      }
      for (const x of v) andar(x);
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) andar(x, k);
    } else if (chave === "feed" && typeof v === "number") {
      achados.add(v);
    }
  };
  for (const m of modulos) andar(m);
  return achados;
}

const numerosDe = (texto: string) => [...texto.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0]);
const escopo = (titulo: string) => lerTitulo(titulo)?.escopo;

const feed = entradas();
const vitrine = citados(consultoria, educacao, chao, naTv);
const comResumo = [...feed.values()].filter((e) => e.resumo !== null);

describe("Diário de obra: nome e lugar (ADR 007 item 3)", () => {
  it("o /pedro se chama Diário de obra, com o subtítulo do ADR, e a URL não muda", () => {
    const app = APPS.find((a) => a.id === "pedro");
    expect(app?.rota).toBe("/pedro");
    expect(app?.titulo).toBe("Diário de obra");
    expect(app?.rotulo).toBe("Diário");
    expect(TOPO.subtitulo).toBe("cada entrega, com data e prova");
  });

  it("nenhum texto visível das páginas chama o /pedro de feed ou portfólio", () => {
    const paginas = [
      "src/pages/pedro/index.astro",
      "src/pages/pedro/stack.astro",
      "src/pages/pedro/label/[id].astro",
      "src/pages/explorar/index.astro",
      "src/pages/cloud.astro",
      "src/pages/pulse.astro",
      "src/data/apresentacao.ts",
      "src/config/apps.ts",
    ];
    for (const p of paginas) {
      // Só o que vai para a tela: texto entre tags e valores de atributos e de rótulos (comentários fora).
      const texto = readFileSync(join(raiz, p), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/import .*$/gm, "")
        .replace(/feed\.css|carregarFeed|data-total-feed|feed-titulo|class="feed"|const feed|feed\.(map|length)/g, "");
      expect(texto, p).not.toMatch(/portf[oó]lio/i);
      expect(texto, p).not.toMatch(/\bfeed\b/i);
    }
  });
});

describe("a contagem do feed não muda (comparada com a main)", () => {
  it("as mesmas entradas publicadas da main, na mesma ordem", () => {
    const publicadas = [...feed.values()]
      .filter((e) => e.confirmada)
      .map((e) => e.numero)
      .sort((a, b) => a - b);
    expect(publicadas).toEqual(principal.publicadas);
    expect(publicadas).toHaveLength(81);
  });
});

describe("resumo_dono: só nas entradas de vitrine", () => {
  it("as páginas de vitrine citam entradas (a coleta não está vazia)", () => {
    expect(vitrine.size).toBeGreaterThanOrEqual(20);
    for (const n of [12, 14, 37, 81, 80, 62, 76, 44, 69]) expect(vitrine.has(n), `#${n}`).toBe(true);
  });

  it("toda entrada citada por /consultoria, /educacao, /chao-de-fabrica, /na-tv e pela visita tem resumo_dono", () => {
    const faltam = [...vitrine, ...VISITA.numeros].filter((n) => !feed.get(n)?.resumo);
    expect(faltam).toEqual([]);
  });

  it("nenhuma entrada fora da vitrine tem resumo_dono", () => {
    const vitrineToda = new Set([...vitrine, ...VISITA.numeros]);
    expect(comResumo.map((e) => e.numero).filter((n) => !vitrineToda.has(n))).toEqual([]);
  });

  it("só entradas confirmadas ganham resumo", () => {
    expect(comResumo.filter((e) => !e.confirmada).map((e) => e.numero)).toEqual([]);
  });

  it(`resumo curto: até ${RESUMO_MAX} caracteres`, () => {
    for (const e of comResumo) expect((e.resumo ?? "").length, `#${e.numero}`).toBeLessThanOrEqual(RESUMO_MAX);
  });

  it("todo número do resumo está na própria entrada", () => {
    for (const e of comResumo) {
      const daEntrada = new Set(numerosDe(e.fonte));
      expect(
        numerosDe(e.resumo ?? "").filter((n) => !daEntrada.has(n)),
        `#${e.numero}`,
      ).toEqual([]);
    }
  });

  it("canário: um número que não está na entrada é pego", () => {
    const e = feed.get(81) as Entrada;
    const daEntrada = new Set(numerosDe(e.fonte));
    expect(numerosDe("30 máquinas").filter((n) => !daEntrada.has(n))).toEqual(["30"]);
  });

  it("nenhum resumo usa as frases fortes que o campo não confirma (lista da V08)", () => {
    for (const e of comResumo) expect(frasesProibidas(e.resumo ?? ""), `#${e.numero}`).toEqual([]);
    expect(frasesProibidas("todas as máquinas, rodando")).not.toEqual([]);
  });

  it("nenhum resumo cai no linter de conteúdo", () => {
    const termos = carregarTermosLocais();
    for (const e of comResumo) expect(lintConteudo(e.resumo ?? "", termos), `#${e.numero}`).toEqual([]);
  });

  it("o resumo não repete o prefixo técnico do título", () => {
    for (const e of comResumo) expect(e.resumo, `#${e.numero}`).not.toMatch(/^[a-z]+\([a-z0-9-]+\)!?:/);
  });
});

describe("os 3 que eu mostraria numa visita", () => {
  it("são 3 entradas confirmadas, merged, de frentes diferentes, com critério escrito", () => {
    expect(VISITA.numeros).toHaveLength(3);
    const frentes = VISITA.numeros.map((n) => escopo(feed.get(n)?.titulo ?? ""));
    expect(new Set(frentes).size).toBe(3);
    for (const n of VISITA.numeros) {
      expect(feed.get(n)?.confirmada, `#${n}`).toBe(true);
      expect(feed.get(n)?.estado, `#${n}`).toBe("merged");
    }
    expect(VISITA.criterio.length).toBeGreaterThan(40);
  });

  it("nenhuma das 3 está na fila de correção (V10/V11: #056, #063, #080, #081)", () => {
    for (const n of [56, 63, 80, 81]) expect(VISITA.numeros).not.toContain(n);
  });
});

describe("lente: leitura guardada na sessão", () => {
  it("a leitura técnica é a padrão", () => {
    expect(LENTE_PADRAO).toBe("tecnico");
  });

  it.each([
    ["dono", "dono"],
    ["tecnico", "tecnico"],
    [null, "tecnico"],
    ["", "tecnico"],
    ["empresario", "tecnico"],
    ["DONO", "tecnico"],
  ])("lerLente(%j) = %j", (valor, esperado) => {
    expect(lerLente(valor)).toBe(esperado);
  });
});
