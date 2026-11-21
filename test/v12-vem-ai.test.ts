import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { lerEntradaMd } from "../src/changelog/fatos";
import { APPS, appPorId } from "../src/config/apps";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { frasesProibidas } from "../src/data/chao-de-fabrica";
import {
  CARDS,
  COLUNAS,
  type Card,
  type EntradaQuadro,
  FORA_DO_QUADRO,
  montarQuadro,
  promessas,
  TOPO,
  textoPublico,
} from "../src/data/vem-ai";

/**
 * V12 (2026-11-20; ADR 007 item 5, ADR 006 item 2): /vem-ai, o quadro Em uso · Em teste · Construindo · Próximo
 * passo. O status de cada card vem do `status_fato` da entrada do Diário de obra (não é repetido no card); só o
 * card sem entrada com status (o próximo passo) cita, ao pé da letra, o trecho da entrada que o sustenta. Cada card
 * começa pelo verbo do PLANO §4 da bancada, não promete data nem preço e tem fonte. Canários abaixo.
 */

const raiz = join(import.meta.dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const pasta = join(raiz, "src", "content", "prs");

/** As entradas publicáveis (verificacao: confirmado), como o build as entrega ao quadro. */
function entradasPublicadas(): EntradaQuadro[] {
  return readdirSync(pasta)
    .filter((n) => n.endsWith(".md"))
    .map((n) => readFileSync(join(pasta, n), "utf8"))
    .filter((md) => /^verificacao:\s*confirmado\s*$/m.test(md))
    .map((md) => {
      const e = lerEntradaMd(md);
      if (!e) throw new Error("entrada ilegível");
      return { numero: e.numero, status_fato: e.status_fato, corpo: md.split("---").slice(2).join("---") };
    });
}

const ENTRADAS = entradasPublicadas();
const HOJE = new Date("2026-11-20T12:00:00-03:00");
const quadro = () => montarQuadro(CARDS, ENTRADAS, HOJE);
const comCard = (c: Card) => montarQuadro([...CARDS, c], ENTRADAS, HOJE).erros;
const base = (extra: Partial<Card>): Card => ({
  id: "canario",
  titulo: "Canário",
  frase: "Estou testando a v1.9 do firmware.",
  fato: 80,
  provas: [{ pr: 80 }],
  ...extra,
});

describe("/vem-ai: as 4 colunas", () => {
  it("Em uso · Em teste · Construindo · Próximo passo, nessa ordem, com o verbo do PLANO §4", () => {
    expect(COLUNAS.map((c) => [c.status, c.titulo, c.verbo])).toEqual([
      ["uso", "Em uso", "Uso"],
      ["testando", "Em teste", "Estou testando"],
      ["construindo", "Construindo", "Estou construindo"],
      ["proximo", "Próximo passo", "O próximo passo é"],
    ]);
  });

  it("o quadro real monta sem erro e toda coluna tem ao menos um card", () => {
    const q = quadro();
    expect(q.erros).toEqual([]);
    for (const c of q.colunas) expect(c.cards.length, c.coluna.titulo).toBeGreaterThanOrEqual(1);
  });

  it("os candidatos com fonte entram na coluna certa: sensores (#081) construindo, v1.9 (#080) em teste, software do Pulse no próximo passo", () => {
    const onde = Object.fromEntries(quadro().colunas.flatMap((c) => c.cards.map((k) => [k.id, c.coluna.status])));
    expect(onde.sensores).toBe("construindo");
    expect(onde["firmware-v19"]).toBe("testando");
    expect(onde["software-pulse"]).toBe("proximo");
  });
});

describe("/vem-ai: coerência card × entrada (ADR 006)", () => {
  it("card com entrada não repete o status: a coluna é o status_fato da entrada", () => {
    const porNumero = new Map(ENTRADAS.map((e) => [e.numero, e]));
    for (const c of quadro().colunas) {
      for (const k of c.cards) {
        if (k.fato === undefined) continue;
        expect(porNumero.get(k.fato)?.status_fato, k.id).toBe(c.coluna.status);
        expect(Object.keys(k)).not.toContain("status_fato");
      }
    }
  });

  it("canário: se a entrada mudar de status, o card cai noutra coluna e o verbo antigo reprova", () => {
    const mudadas = ENTRADAS.map((e) => (e.numero === 80 ? { ...e, status_fato: "uso" as const } : e));
    const r = montarQuadro(CARDS, mudadas, HOJE);
    expect(r.erros.join("\n")).toMatch(/firmware-v19.*verbo/);
  });

  it("canário: card que cita entrada sem status_fato, inexistente ou não publicada reprova", () => {
    expect(comCard(base({ fato: 69, provas: [{ pr: 69 }], frase: "Uso os módulos." })).join("\n")).toMatch(/sem status_fato/);
    expect(comCard(base({ fato: 999, provas: [{ pr: 999 }] })).join("\n")).toMatch(/999/);
    expect(comCard(base({ fato: 83, provas: [{ pr: 83 }] })).join("\n")).toMatch(/#083/);
  });

  it("canário: card com status próprio quando a entrada já tem status (duplicaria o fato) reprova", () => {
    const c = base({ semFato: { status: "testando", citacao: { pr: 80, trecho: "v1.9" } } });
    expect(comCard(c).join("\n")).toMatch(/fato e semFato/);
  });

  it("o próximo passo cita, ao pé da letra, o corpo da entrada que o sustenta; canário com trecho inventado", () => {
    const k = CARDS.find((c) => c.id === "software-pulse");
    expect(k?.fato).toBeUndefined();
    expect(k?.semFato?.citacao.pr).toBe(81);
    const errado = base({
      id: "canario-citacao",
      fato: undefined,
      frase: "O próximo passo é a tela.",
      semFato: { status: "proximo", citacao: { pr: 81, trecho: "Próximo passo: lançar o app" } },
      provas: [{ pr: 81 }],
    });
    expect(comCard(errado).join("\n")).toMatch(/citação/);
  });
});

describe("/vem-ai: verbo, fonte, promessa (gates com canário)", () => {
  it("cada card começa pelo verbo da sua coluna; canário com verbo errado", () => {
    for (const c of quadro().colunas) for (const k of c.cards) expect(k.frase.startsWith(c.coluna.verbo), k.id).toBe(true);
    expect(comCard(base({ frase: "Uso a v1.9 do firmware." })).join("\n")).toMatch(/canario.*verbo/);
  });

  it("card sem fonte não entra: sem provas, sem entrada e sem citação reprova (canários)", () => {
    expect(comCard(base({ provas: [] })).join("\n")).toMatch(/sem fonte/);
    expect(comCard(base({ fato: undefined, provas: [{ rota: "/pulse", rotulo: "Pulse" }] })).join("\n")).toMatch(/sem fonte/);
    expect(comCard(base({ provas: [{ rota: "/pulse", rotulo: "Pulse" }] })).join("\n")).toMatch(/#080/);
  });

  it("link para rota que não existe reprova (canário)", () => {
    expect(comCard(base({ provas: [{ pr: 80 }, { rota: "/roadmap", rotulo: "Roadmap" }] })).join("\n")).toMatch(/\/roadmap/);
  });

  it("o detector reprova data, prazo e promessa (canários)", () => {
    for (const t of [
      "Fica pronto em breve.",
      "Entrego até dezembro.",
      "O lançamento é na semana que vem.",
      "Previsto para o próximo mês.",
      "O próximo passo é em 2027.",
      "Começa em 5 de janeiro de 2027.",
      "Vai sair em março.",
      "Custa R$ 99 por mês.",
      "Com prazo definido.",
    ]) {
      expect(promessas(t, HOJE), t).not.toEqual([]);
    }
    expect(comCard(base({ frase: "Estou testando a v1.9, pronta até dezembro." })).join("\n")).toMatch(/promessa/);
  });

  it("não confunde data passada, a versão v1.9 e o verbo 'o próximo passo é'", () => {
    expect(promessas("Uso desde janeiro de 2026, gravada em 18 de novembro de 2026.", HOJE)).toEqual([]);
    expect(promessas("O próximo passo é atualizar a plataforma de monitoramento.", HOJE)).toEqual([]);
    expect(promessas("Estou testando a v1.9 do firmware.", HOJE)).toEqual([]);
  });

  it("o texto público inteiro (topo, colunas, cards, página) não promete data nem preço", () => {
    expect(promessas(textoPublico() + ler("src/pages/vem-ai.astro"), new Date())).toEqual([]);
  });

  it("todo número de um card aparece no corpo da entrada que ele cita", () => {
    const porNumero = new Map(ENTRADAS.map((e) => [e.numero, e.corpo]));
    for (const k of CARDS) {
      const n = k.fato ?? k.semFato?.citacao.pr;
      const corpo = porNumero.get(n as number) ?? "";
      for (const num of k.frase.match(/\d+(?:\.\d+)?/g) ?? []) expect(corpo, `${k.id}: ${num}`).toContain(num);
    }
  });

  it("frases fortes da colheita, termos bloqueados e dado sensível não entram", () => {
    const tudo = textoPublico() + ler("src/pages/vem-ai.astro");
    expect(frasesProibidas(tudo)).toEqual([]);
    expect(lintConteudo(tudo, carregarTermosLocais())).toEqual([]);
    expect(tudo).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b|mqtt:\/\/|\bilo\.|gw0\d|Marcant/i);
  });
});

describe("/vem-ai: o que ficou de fora", () => {
  it("os candidatos sem fonte pública estão listados com o motivo e não viram card", () => {
    const ids = FORA_DO_QUADRO.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["fabrica-no-celular", "engenharia-de-produtos", "ensinando-ia"]));
    for (const f of FORA_DO_QUADRO) expect(f.motivo.length, f.id).toBeGreaterThan(20);
    const titulos = JSON.stringify(CARDS);
    expect(titulos).not.toMatch(/f[aá]brica no celular|engenharia de produtos|ensinando ia/i);
  });

  it("o topo diz o que é o quadro sem prometer", () => {
    expect(TOPO.titulo.length).toBeGreaterThan(10);
  });
});

describe("/vem-ai: rota e navegação (ADR 007 item 5)", () => {
  it("é uma seção com selo próprio (fora da grade de 6 apps da home)", () => {
    expect(appPorId("vem-ai").rota).toBe("/vem-ai");
    expect(appPorId("vem-ai").titulo).toBe("Vem aí");
    expect(APPS.map((a) => a.id)).not.toContain("vem-ai");
  });

  it("está no sitemap e tem orçamento de peso com JS mínimo (2 KiB)", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/vem-ai/");
    const orc = JSON.parse(ler("scripts/orcamentos-peso.json"));
    expect(orc.rotas["/vem-ai"]).toEqual({ jsGzKB: 2, pesoGzKB: 60 });
  });

  it("o Diário de obra (/pedro) e o /pulse levam ao Vem aí; a home não muda", () => {
    expect(ler("src/pages/pedro/index.astro")).toContain('href="/vem-ai"');
    expect(ler("src/pages/pulse.astro")).toContain('href="/vem-ai"');
    expect(ler("src/pages/index.astro")).not.toContain("/vem-ai");
  });

  it("a página não carrega script próprio (JS zero além do layout)", () => {
    expect(ler("src/pages/vem-ai.astro")).not.toMatch(/<script/);
  });
});
