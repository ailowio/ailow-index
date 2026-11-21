import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { linkContato, mensagemContato } from "../src/config/contato";
import { ROTAS_INDEXAVEIS } from "../src/config/indexacao";
import { ESCADA } from "../src/data/consultoria";
import {
  CAMINHOS,
  INDICE,
  LEGENDA,
  NIVEIS,
  SETORES,
  type Uso,
  USOS,
  usoPorId,
  usosDoSetor,
} from "../src/data/ia-no-seu-negocio";
import { carregarFluxos } from "../src/fluxos/carregar";

// V14 (2026-11-20, ADR 007 itens 2 e 5; brainstorm v2 §5.5 S3): "IA no seu negócio", simulador estático por setor.
// Regras: cada uso cita a entrada confirmada do Diário de obra (#NNN) ou o fluxo do /explorar que o prova, e todo
// número do fato está na fonte citada; o equivalente no setor é SUGESTÃO: sem número nenhum. Em lugar nenhum:
// "garantido", percentual ou resultado (economia, aumento, redução...) que a página não pode provar.
const raiz = resolve(import.meta.dirname, "..");

interface Entrada {
  numero: number;
  confirmada: boolean;
  corpo: string;
}

function entradasDoFeed(): Map<number, Entrada> {
  const dir = join(raiz, "src", "content", "prs");
  const mapa = new Map<number, Entrada>();
  for (const nome of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
    const md = readFileSync(join(dir, nome), "utf8");
    const numero = Number(/^numero:\s*(\d+)/m.exec(md)?.[1]);
    const confirmada = /^verificacao:\s*confirmado\s*$/m.test(md);
    mapa.set(numero, { numero, confirmada, corpo: md });
  }
  return mapa;
}

const feed = entradasDoFeed();
const fluxos = new Map(carregarFluxos(raiz).map((f) => [f.slug, f]));

/** Números do texto (datas, versões, quantidades): "13", "2026", "1.5.0". */
const numerosDe = (texto: string) => [...texto.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0]);

const PERCENTUAL = /%|por\s*cento|percent/i;
const GARANTIA = /garant/i;
/** Resultado que a página não prova: economia, ganho, redução, "mais rápido", "sem erro"... */
const RESULTADO =
  /\b(economi\w*|poup\w*|reduz\w*|redu[çc][ãa]o|aument\w*|dobr\w*|triplic\w*|multiplic\w*|lucr\w*|fatur(a|ar|ou|amento)\b|retorno|ROI|produtividade|ganh\w*|mais\s+r[áa]pid\w*|mais\s+vend\w*|vend\w*\s+mais|menos\s+(tempo|erro|custo|retrabalho)\w*|sem\s+erros?|zero\s+(erro|retrabalho)\w*|elimin\w*|nunca\s+mais|resolv\w*\s+de\s+vez)\b/i;

/** Problemas de qualquer texto da página (fato, sugestão, abertura). */
function problemasDeTexto(texto: string): string[] {
  const p: string[] = [];
  if (PERCENTUAL.test(texto)) p.push("percentual");
  if (GARANTIA.test(texto)) p.push("garantia");
  const r = RESULTADO.exec(texto);
  if (r) p.push(`resultado sem prova: ${r[0]}`);
  return p;
}

/** Texto das fontes de um uso: o corpo das entradas citadas e, se houver fluxo, o JSON público dele + a entrada dele. */
function fontesDoUso(u: Pick<Uso, "prs" | "fluxo">): string {
  const f = u.fluxo ? fluxos.get(u.fluxo) : undefined;
  return [
    ...u.prs.map((n) => feed.get(n)?.corpo ?? ""),
    f ? JSON.stringify(f) : "",
    f ? (feed.get(f.pr)?.corpo ?? "") : "",
  ].join("\n");
}

function problemasDoUso(u: Pick<Uso, "titulo" | "fato" | "prs" | "fluxo">): string[] {
  const p: string[] = [];
  if (u.prs.length === 0 && !u.fluxo) p.push("sem prova (#NNN ou fluxo)");
  for (const n of u.prs) {
    const e = feed.get(n);
    if (!e) p.push(`#${n} não existe`);
    else if (!e.confirmada) p.push(`#${n} não está confirmada`);
  }
  if (u.fluxo && !fluxos.has(u.fluxo)) p.push(`fluxo ${u.fluxo} não existe`);
  const texto = `${u.titulo} ${u.fato}`;
  const daFonte = new Set(numerosDe(fontesDoUso(u)));
  for (const n of numerosDe(texto)) if (!daFonte.has(n)) p.push(`número sem prova: ${n}`);
  p.push(...problemasDeTexto(texto));
  return p;
}

/** A sugestão não tem prova: nenhum número, nenhum resultado. */
function problemasDaSugestao(s: string): string[] {
  return [...numerosDe(s).map((n) => `número em sugestão: ${n}`), ...problemasDeTexto(s)];
}

const SLUGS = ["grafica", "textil", "comercio", "servico"];

describe("IA no seu negócio: cada uso tem prova (V14)", () => {
  it.each(USOS.map((u) => [u.id, u]))("%s cita #NNN confirmada ou fluxo do /explorar, e todo número está na fonte", (_id, u) => {
    expect(problemasDoUso(u)).toEqual([]);
  });

  it("todo uso definido aparece em ao menos um setor (nada solto)", () => {
    const usados = new Set(SETORES.flatMap((s) => s.usos.map((x) => x.uso)));
    expect(USOS.map((u) => u.id).filter((id) => !usados.has(id))).toEqual([]);
  });

  it("canário: uso sem #NNN nem fluxo é pego", () => {
    expect(problemasDoUso({ titulo: "Atendimento", fato: "Uso um agente no WhatsApp.", prs: [] })).toContain(
      "sem prova (#NNN ou fluxo)",
    );
  });

  it("canário: entrada inexistente, entrada pendente e fluxo inexistente são pegos", () => {
    expect(problemasDoUso({ titulo: "X", fato: "Algo.", prs: [999] })).toContain("#999 não existe");
    // #083 está com verificacao: pendente (V11): não prova nada no site.
    expect(problemasDoUso({ titulo: "X", fato: "Algo.", prs: [83] })).toContain("#83 não está confirmada");
    expect(problemasDoUso({ titulo: "X", fato: "Algo.", prs: [], fluxo: "nao-existe" })).toContain(
      "fluxo nao-existe não existe",
    );
  });

  it("canário: número que não está na fonte citada é pego (também no título)", () => {
    expect(problemasDoUso({ titulo: "Resumo diário", fato: "Atende 40 lojas desde julho de 2026.", prs: [54] })).toEqual([
      "número sem prova: 40",
    ]);
    expect(problemasDoUso({ titulo: "Boletos em 3 cliques", fato: "Fluxo de outubro de 2025.", prs: [19] })).toEqual([
      "número sem prova: 3",
    ]);
  });

  it("canário: garantia, percentual e resultado sem prova são pegos mesmo com a entrada citada", () => {
    expect(problemasDoUso({ titulo: "X", fato: "Resultado garantido.", prs: [54] })).toContain("garantia");
    expect(problemasDoUso({ titulo: "X", fato: "Corta 30% do trabalho.", prs: [54] })).toEqual([
      "número sem prova: 30",
      "percentual",
    ]);
    expect(problemasDoUso({ titulo: "X", fato: "Economiza o tempo da equipe.", prs: [54] })).toEqual([
      "resultado sem prova: Economiza",
    ]);
  });
});

describe("IA no seu negócio: sugestão é sugestão (V14)", () => {
  const SUGESTOES = SETORES.flatMap((s) => s.usos.map((x) => [`${s.slug} · ${x.uso}`, x.sugestao] as const));

  it.each(SUGESTOES)("%s: sem número, garantia, percentual nem resultado", (_id, s) => {
    expect(s.length).toBeGreaterThan(20);
    expect(problemasDaSugestao(s)).toEqual([]);
  });

  it("a legenda diz que a sugestão não é caso nem resultado", () => {
    expect(LEGENDA.sugestao).toMatch(/n[ãa]o [ée] caso nem resultado/i);
    expect(LEGENDA.fato).toMatch(/prova/i);
  });

  it("canário: número, percentual, garantia e resultado numa sugestão são pegos", () => {
    expect(problemasDaSugestao("Em 2 dias a loja vende mais.")).toEqual(["número em sugestão: 2", "resultado sem prova: vende mais"]);
    expect(problemasDaSugestao("Metade do trabalho, por cento garantido.")).toEqual(["percentual", "garantia"]);
    expect(problemasDaSugestao("Reduz o retrabalho no balcão.")).toEqual(["resultado sem prova: Reduz"]);
  });
});

describe("IA no seu negócio: setores, níveis e usos (V14)", () => {
  it("os 4 setores, nesta ordem, cada um com página própria", () => {
    expect(SETORES.map((s) => s.slug)).toEqual(SLUGS);
    expect(SETORES.map((s) => s.nome)).toEqual(["Gráfica", "Têxtil", "Comércio", "Serviço"]);
  });

  it("os 3 níveis são os degraus da escada: celular (Aprender), automação (Automatizar), sistema (Sistema sob medida)", () => {
    expect(NIVEIS.map((n) => n.id)).toEqual(["celular", "automacao", "sistema"]);
    expect(NIVEIS.map((n) => n.degrau)).toEqual(ESCADA.map((d) => d.nome));
  });

  it.each(SETORES.map((s) => [s.slug, s]))("%s: 3 níveis × 3 usos, na ordem da escada, sem repetir", (_slug, s) => {
    expect(s.usos).toHaveLength(9);
    expect(new Set(s.usos.map((x) => x.uso)).size).toBe(9);
    const grupos = usosDoSetor(s);
    expect(grupos.map((g) => g.nivel.id)).toEqual(["celular", "automacao", "sistema"]);
    for (const g of grupos) {
      expect(g.usos).toHaveLength(3);
      for (const u of g.usos) expect(u.nivel).toBe(g.nivel.id);
    }
  });

  it("todo uso citado por um setor existe", () => {
    for (const s of SETORES) for (const x of s.usos) expect(() => usoPorId(x.uso)).not.toThrow();
    expect(() => usoPorId("nao-existe")).toThrow();
  });

  it("gráfica e têxtil vêm direto da Copel; comércio e serviço só com mecanismo já provado", () => {
    expect(SETORES.map((s) => s.fonte)).toEqual(["copel", "copel", "mecanismo", "mecanismo"]);
    for (const s of SETORES.filter((x) => x.fonte === "mecanismo")) {
      expect(s.abertura).toMatch(/sugest[ãa]o/i);
      // Produção de teares e NF-e de produto são da fábrica: nota de serviço e nota de balcão são outro mecanismo.
      expect(s.usos.map((x) => x.uso)).not.toContain("producao-textil");
      expect(s.usos.map((x) => x.uso)).not.toContain("nfe");
    }
  });

  it("o fato diz onde roda (Copel ou Cloud), e o Cloud só cita a loja piloto sem nome", () => {
    for (const u of USOS) expect(["Na Copel", "No Cloud"]).toContain(u.onde);
    const tudo = JSON.stringify({ USOS, SETORES });
    expect(tudo).not.toMatch(/marcant/i);
  });
});

describe("IA no seu negócio: caminhos e contato (V14)", () => {
  it.each(SETORES.map((s) => [s.slug, s]))("%s: WhatsApp com a origem [ia-no-seu-negocio · setor]", (_slug, s) => {
    const m = mensagemContato(s.origem);
    expect(m).toMatch(new RegExp(`\\[ia-no-seu-negocio · ${s.nome.toLowerCase()}\\]$`));
    expect(new URL(linkContato(s.origem)).searchParams.get("text")).toBe(m);
  });

  it("cada página termina com os dois caminhos: aprender (/educacao) e fazer (/consultoria)", () => {
    expect(CAMINHOS.map((c) => c.href)).toEqual(["/educacao", "/consultoria"]);
  });

  it("o índice e as páginas de setor estão no sitemap", () => {
    expect(ROTAS_INDEXAVEIS).toContain("/ia-no-seu-negocio/");
    for (const s of SLUGS) expect(ROTAS_INDEXAVEIS).toContain(`/ia-no-seu-negocio/${s}/`);
  });

  it("orçamento de peso explícito para o índice e cada setor", () => {
    const orc = JSON.parse(readFileSync(join(raiz, "scripts", "orcamentos-peso.json"), "utf8"));
    expect(orc.rotas["/ia-no-seu-negocio"]).toBeDefined();
    for (const s of SLUGS) expect(orc.rotas[`/ia-no-seu-negocio/${s}`]).toBeDefined();
  });

  it("a /educacao e a /consultoria levam ao índice a partir do bloco da escada", () => {
    for (const p of ["educacao", "consultoria"]) {
      const pagina = readFileSync(join(raiz, "src", "pages", `${p}.astro`), "utf8");
      const escada = /<ol class="escada">[\s\S]*?<\/section>/.exec(pagina)?.[0] ?? "";
      expect(escada, p).toContain('href="/ia-no-seu-negocio"');
    }
  });
});

describe("IA no seu negócio: texto público (V14)", () => {
  const textos = [
    ...USOS.map((u) => `${u.titulo} ${u.fato}`),
    ...SETORES.flatMap((s) => [s.nome, s.chamada, s.abertura, s.tituloPagina, s.descricao, ...s.usos.map((x) => x.sugestao)]),
    ...NIVEIS.map((n) => `${n.nome} ${n.oQue}`),
    ...CAMINHOS.map((c) => `${c.titulo} ${c.texto} ${c.rotulo}`),
    INDICE.titulo,
    INDICE.tese,
    INDICE.tituloPagina,
    INDICE.descricao,
    LEGENDA.fato,
    LEGENDA.sugestao,
  ];
  const tudo = textos.join("\n");

  it("aberturas, níveis, caminhos e índice: sem número, garantia, percentual nem resultado", () => {
    const gerais = textos.slice(USOS.length);
    for (const t of gerais) {
      expect(numerosDe(t), t).toEqual([]);
      expect(problemasDeTexto(t), t).toEqual([]);
    }
  });

  it("nada de preço, valor, API de IA nem termo bloqueado", () => {
    expect(tudo).not.toMatch(/R\$|reais|pre[çc]os?\b|mensalidade|\bvalor(es)?\b/i);
    expect(lintConteudo(tudo, carregarTermosLocais(raiz))).toEqual([]);
  });

  it("as páginas não têm script (a escolha de setor são links)", () => {
    for (const p of ["index.astro", "[setor].astro"]) {
      const pagina = readFileSync(join(raiz, "src", "pages", "ia-no-seu-negocio", p), "utf8");
      expect(pagina).not.toMatch(/<script/);
    }
  });
});
