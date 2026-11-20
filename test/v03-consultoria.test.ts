import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import {
  linkRaioX,
  mensagemContato,
  mensagemRaioX,
  PERGUNTAS_RAIO_X,
  type RespostasRaioX,
  WHATSAPP,
} from "../src/config/contato";
import { CASOS, ESCADA, ETAPAS } from "../src/data/consultoria";

// V03 (2026-11-20, ADR 007 itens 2 e 5): /consultoria. O raio-x monta a mensagem do WhatsApp no aparelho
// (nada vai a servidor) e todo texto da página cita entradas confirmadas do Diário de obra (#NNN).
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

/** Números do texto (datas, versões, quantidades): "18", "2026", "1.9", "1.0.0", o "2" de "v2". */
const numerosDe = (texto: string) => [...texto.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0]);

/** Todo número do texto aparece no corpo de alguma entrada citada: número sem prova não entra. */
function numerosSemProva(texto: string, prs: number[], feed: Map<number, Entrada>): string[] {
  const fontes = prs.map((n) => feed.get(n)?.corpo ?? "").join("\n");
  const daFonte = new Set(numerosDe(fontes));
  return numerosDe(texto).filter((n) => !daFonte.has(n));
}

const COMPLETO: RespostasRaioX = {
  processo: "Apontamento da produção no papel",
  medicao: "Caderno",
  pessoas: "6 a 20",
  turnos: "2",
  sistema: "Planilha e um ERP antigo",
};

describe("raio-x de 5 perguntas (V03)", () => {
  it("são as 5 perguntas do escopo, nesta ordem", () => {
    expect(PERGUNTAS_RAIO_X.map((p) => p.id)).toEqual(["processo", "medicao", "pessoas", "turnos", "sistema"]);
  });

  it("com tudo respondido, a mensagem tem uma linha por pergunta e termina com a marca [consultoria]", () => {
    expect(mensagemRaioX(COMPLETO)).toBe(
      [
        "Oi, Pedro! Fiz o raio-x da consultoria no site.",
        "Processo que dói: Apontamento da produção no papel",
        "Como mede hoje: Caderno",
        "Pessoas: 6 a 20",
        "Turnos: 2",
        "Sistema atual: Planilha e um ERP antigo",
        "[consultoria]",
      ].join("\n"),
    );
  });

  it("sem nenhuma resposta, cai na mensagem de sempre da consultoria", () => {
    expect(mensagemRaioX({})).toBe(mensagemContato("consultoria"));
    expect(mensagemRaioX({ processo: "   ", sistema: "\n\t" })).toBe(mensagemContato("consultoria"));
  });

  it("pergunta sem resposta fica de fora; as respondidas mantêm a ordem", () => {
    const m = mensagemRaioX({ turnos: "3", processo: "Estoque" });
    expect(m.split("\n")).toEqual([
      "Oi, Pedro! Fiz o raio-x da consultoria no site.",
      "Processo que dói: Estoque",
      "Turnos: 3",
      "[consultoria]",
    ]);
  });

  it("texto livre: espaços e quebras de linha viram um espaço só e o tamanho é limitado", () => {
    const m = mensagemRaioX({ processo: "  linha 1\n\nlinha   2\r\n " });
    expect(m).toContain("Processo que dói: linha 1 linha 2\n");
    const longo = mensagemRaioX({ sistema: "x".repeat(500) });
    expect(longo).toContain(`Sistema atual: ${"x".repeat(200)}\n`);
    expect(longo).not.toContain("x".repeat(201));
  });

  it("acento e emoji passam inteiros (o corte não parte caractere)", () => {
    const emoji = "😀".repeat(250);
    const m = mensagemRaioX({ processo: emoji });
    expect(m).toContain(`Processo que dói: ${"😀".repeat(200)}\n`);
    expect(m).not.toMatch(/�/);
    expect(new URL(linkRaioX({ processo: "Ação 😀" })).searchParams.get("text")).toContain("Ação 😀");
  });

  it("resposta de múltipla escolha fora das opções é ignorada", () => {
    expect(mensagemRaioX({ medicao: "<script>", turnos: "99" })).toBe(mensagemContato("consultoria"));
  });

  it("o link é o wa.me do número autorizado com a mensagem codificada", () => {
    const u = new URL(linkRaioX(COMPLETO));
    expect(u.origin + u.pathname).toBe(`https://wa.me/${WHATSAPP}`);
    expect(u.searchParams.get("text")).toBe(mensagemRaioX(COMPLETO));
  });

  it("canário: uma linha a mais seria pega pela comparação exata", () => {
    expect(`${mensagemRaioX(COMPLETO)}\nextra`).not.toBe(mensagemRaioX(COMPLETO));
  });
});

describe("conteúdo de /consultoria só com fatos do Diário de obra (V03)", () => {
  const feed = entradasDoFeed();
  const blocos = [
    ...ETAPAS.map((e) => ({ id: `etapa ${e.id}`, texto: `${e.nome} ${e.oQue} ${e.naCopel}`, prs: e.prs })),
    ...ESCADA.map((d) => ({ id: `degrau ${d.id}`, texto: `${d.nome} ${d.oQue}`, prs: d.prs })),
    ...CASOS.map((c) => ({ id: `caso ${c.id}`, texto: `${c.nome} ${c.papel} ${c.texto}`, prs: c.prs })),
  ];

  it("o método tem as 4 etapas do escopo, nesta ordem", () => {
    expect(ETAPAS.map((e) => e.nome)).toEqual([
      "Diagnóstico no chão de fábrica",
      "Protótipo",
      "Implantação",
      "Operação",
    ]);
  });

  it("a escada é Aprender → Automatizar → Sistema sob medida, e o Aprender leva aos cursos", () => {
    expect(ESCADA.map((d) => d.nome)).toEqual(["Aprender", "Automatizar", "Sistema sob medida"]);
    expect(ESCADA[0].href).toBe("/educacao");
  });

  it("os casos são a Copel (cliente zero) e o Cloud com a loja piloto", () => {
    expect(CASOS.map((c) => c.id)).toEqual(["copel", "cloud"]);
    expect(CASOS[0].papel).toMatch(/cliente zero/i);
    expect(CASOS[1].papel).toMatch(/loja piloto/i);
  });

  it.each(blocos.map((b) => [b.id, b]))("%s cita ao menos uma entrada, e todas existem e estão confirmadas", (_id, b) => {
    expect(b.prs.length).toBeGreaterThan(0);
    for (const n of b.prs) {
      expect(feed.get(n), `#${n} existe`).toBeDefined();
      expect(feed.get(n)?.confirmada, `#${n} confirmada`).toBe(true);
    }
  });

  it.each(blocos.map((b) => [b.id, b]))("%s: todo número do texto está na entrada citada", (_id, b) => {
    expect(numerosSemProva(b.texto, b.prs, feed)).toEqual([]);
  });

  // O nome da loja piloto é lido do título da #070 (o repositório é público: o teste não repete o nome).
  const lojaPiloto = /loja piloto do Cloud, a ([^"\n]+)"/.exec(feed.get(70)?.corpo ?? "")?.[1]?.trim() ?? "";
  const citaLojaPiloto = (texto: string) => texto.toLowerCase().includes(lojaPiloto.toLowerCase());

  it("nada de preço, prazo, contagem de clientes ou nome de cliente", () => {
    const tudo = blocos.map((b) => b.texto).join("\n");
    expect(tudo).not.toMatch(/R\$|reais|pre[çc]o|prazo|or[çc]amento|\bclientes\b|garant/i);
    expect(lojaPiloto.length).toBeGreaterThan(2);
    expect(citaLojaPiloto(tudo)).toBe(false);
    // A #081 diz "todas as máquinas", mas a colheita de IoT (20/11) achou máquinas sem cabeamento: não repetir.
    expect(tudo).not.toMatch(/todas as m[áa]quinas/i);
    expect(lintConteudo(tudo, carregarTermosLocais(raiz))).toEqual([]);
  });

  it("canário: número que não está na entrada citada é pego", () => {
    expect(numerosSemProva("em 30 dias", [81], feed)).toEqual(["30"]);
  });

  it("canário: nome de cliente e preço seriam pegos", () => {
    expect(citaLojaPiloto(`Caso da ${lojaPiloto.toUpperCase()}`)).toBe(true);
    expect("a partir de R$ 500").toMatch(/R\$|reais|pre[çc]o|prazo/i);
  });
});

describe("/consultoria não manda nada a servidor (V03)", () => {
  const pagina = readFileSync(join(raiz, "src", "pages", "consultoria.astro"), "utf8");
  const contato = readFileSync(join(raiz, "src", "config", "contato.ts"), "utf8");
  const PROIBIDO = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie/;

  it("o script da página e o contato não usam rede nem armazenamento", () => {
    expect(pagina).toMatch(/<script>/);
    expect(pagina).not.toMatch(PROIBIDO);
    expect(contato).not.toMatch(PROIBIDO);
  });

  it("canário: um fetch seria pego", () => {
    expect('await fetch("/api", { method: "POST" })').toMatch(PROIBIDO);
  });
});
