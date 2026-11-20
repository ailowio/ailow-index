import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintConteudo } from "../src/changelog/bloqueio";
import { carregarTermosLocais } from "../src/changelog/carregar-termos";
import { linkContato, mensagemContato } from "../src/config/contato";
import {
  AVISO_PROPOSTA,
  CREDENCIAMENTO,
  ESCADA_EDUCACAO,
  FONTES_CREDENCIAMENTO_LIDAS,
  FORMACAO,
  FORMATOS,
  KIT,
  PALCOS,
  SISTEMA_S,
  TEMAS,
  TOPO,
} from "../src/data/educacao";

// V04 (2026-11-20, ADR 007 itens 2 e 5; brainstorm v2 §5.5 S1 e S4): /educacao, "Levar para minha instituição".
// Regras: todo fato cita entradas confirmadas do Diário de obra (#NNN) e todo número dele está numa delas;
// os formatos são PROPOSTA e não têm número nenhum (nada de carga horária, preço ou contagem inventados);
// credenciamento do Sistema S: nada de requisito sem fonte oficial lida, e nunca "credenciado".
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

/** Números do texto (datas, versões, quantidades): "29", "2026", "4.0", o "1" de "1º". */
const numerosDe = (texto: string) => [...texto.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0]);

/** Todo número do texto aparece no corpo de alguma entrada citada: número sem prova não entra. */
function numerosSemProva(texto: string, prs: number[], feed: Map<number, Entrada>): string[] {
  const fontes = prs.map((n) => feed.get(n)?.corpo ?? "").join("\n");
  const daFonte = new Set(numerosDe(fontes));
  return numerosDe(texto).filter((n) => !daFonte.has(n));
}

/** Carga horária, duração, preço ou contagem de turma: nunca na página, nem com prova (o "12 h" da #008 é de um curso que o Pedro fez). */
const CARGA_OU_PRECO =
  /R\$|reais|pre[çc]o|\bvalor(es)?\s+de\s+\d|\d+\s*(h|hs|horas?|min|minutos?|encontros?|aulas?|m[óo]dulos?|vagas?|alunos?|participantes?|turmas?)\b|carga hor[áa]ria\s*(de\s*)?\d/i;

/** Afirmar credenciamento (ou requisito de edital) sem fonte oficial lida. */
const AFIRMA_CREDENCIADO = /\bcredenciad[oa]s?\b/i;
const REQUISITO = /\bedital\b|\beditais\b|atestado|\bCNPJ\b|requisito|habilita[çc][ãa]o|cadastro nacional/i;

const feed = entradasDoFeed();

const FATOS = [
  { id: "kit quem", texto: KIT.quem.texto, prs: KIT.quem.prs },
  { id: "sistema S", texto: SISTEMA_S.texto, prs: SISTEMA_S.prs },
  ...PALCOS.map((p) => ({ id: `palco ${p.id}`, texto: `${p.tipo} ${p.titulo} ${p.texto}`, prs: p.prs })),
  ...FORMACAO.map((f) => ({ id: `formação ${f.id}`, texto: `${f.nome} ${f.onde}`, prs: f.prs })),
  ...TEMAS.map((t) => ({ id: `tema ${t.id}`, texto: `${t.nome} ${t.texto}`, prs: t.prs })),
  ...ESCADA_EDUCACAO.map((d) => ({ id: `degrau ${d.id}`, texto: `${d.nome} ${d.oQue}`, prs: d.prs })),
];

const PROPOSTAS = [
  ...FORMATOS.map((f) => ({ id: `formato ${f.id}`, texto: `${f.nome} ${f.oQue} ${f.paraQuem} ${f.saiCom}` })),
  { id: "aviso", texto: AVISO_PROPOSTA },
  { id: "topo", texto: `${TOPO.sobretitulo} ${TOPO.titulo} ${TOPO.tese}` },
  { id: "kit duração", texto: KIT.duracao },
  { id: "credenciamento", texto: CREDENCIAMENTO },
];

const TUDO = [...FATOS, ...PROPOSTAS].map((b) => b.texto).join("\n");

describe("/educacao: fatos só com prova no Diário de obra (V04)", () => {
  it.each(FATOS.map((b) => [b.id, b]))("%s cita ao menos uma entrada, e todas existem e estão confirmadas", (_id, b) => {
    expect(b.prs.length).toBeGreaterThan(0);
    for (const n of b.prs) {
      expect(feed.get(n), `#${n} existe`).toBeDefined();
      expect(feed.get(n)?.confirmada, `#${n} confirmada`).toBe(true);
    }
  });

  it.each(FATOS.map((b) => [b.id, b]))("%s: todo número do texto está na entrada citada", (_id, b) => {
    expect(numerosSemProva(b.texto, b.prs, feed)).toEqual([]);
  });

  it("palcos são só os confirmados: a palestra na Sindigráfica, a visita do Sebraetec, a Record e a UFC", () => {
    expect(PALCOS.map((p) => p.prs[0])).toEqual([44, 48, 14, 12]);
    // Só a #044 é palestra; entrevista e reportagem não viram "aula" nem "palestra".
    expect(PALCOS.filter((p) => /palestra/i.test(p.tipo)).map((p) => p.id)).toEqual(["sindigrafica"]);
  });

  it("canário: número que não está na entrada citada é pego", () => {
    expect(numerosSemProva("para 40 empresários", [44], feed)).toEqual(["40"]);
  });
});

describe("/educacao: formatos como proposta, sem número inventado (V04)", () => {
  it("os formatos são palestra, oficina e trilha, nesta ordem", () => {
    expect(FORMATOS.map((f) => f.nome)).toEqual(["Palestra", "Oficina", "Trilha"]);
  });

  it("o aviso diz que é proposta e que se ajusta com a instituição", () => {
    expect(AVISO_PROPOSTA).toMatch(/^Proposta/);
    expect(AVISO_PROPOSTA).toMatch(/institui[çc][ãa]o/i);
  });

  it.each(PROPOSTAS.map((b) => [b.id, b]))("%s não tem número nenhum (proposta não tem prova)", (_id, b) => {
    expect(numerosDe(b.texto)).toEqual([]);
  });

  it("nada de carga horária, duração, preço ou tamanho de turma em lugar nenhum da página", () => {
    expect(TUDO).not.toMatch(CARGA_OU_PRECO);
  });

  it("canário: carga horária, duração e preço seriam pegos", () => {
    for (const s of ["oficina de 4 h", "palestra de 60 min", "trilha de 3 encontros", "a partir de R$ 900", "carga horária de 8"]) {
      expect(s).toMatch(CARGA_OU_PRECO);
    }
    expect(numerosDe("Oficina de 4 horas")).toEqual(["4"]);
  });
});

describe("/educacao: credenciamento do Sistema S (V04)", () => {
  it("nenhuma fonte oficial foi lida por inteiro: o texto não cita requisito e manda consultar a instituição", () => {
    // V04 (2026-11-20): páginas do Sebrae renderizadas por JS e editais em PDF sem camada de texto legível
    // nesta sessão. Status: não verificado (URLs tentadas no PR). Quando uma fonte for lida, ela entra aqui.
    expect(FONTES_CREDENCIAMENTO_LIDAS).toEqual([]);
    expect(CREDENCIAMENTO).toMatch(/consulte a sua institui[çc][ãa]o/i);
    expect(CREDENCIAMENTO).not.toMatch(REQUISITO);
  });

  it("a página nunca diz que o Pedro é credenciado", () => {
    expect(TUDO).not.toMatch(AFIRMA_CREDENCIADO);
  });

  it("canário: credenciado e requisito de edital seriam pegos", () => {
    expect("Sou credenciado no Sebraetec").toMatch(AFIRMA_CREDENCIADO);
    expect("exige 2 atestados e CNPJ ativo").toMatch(REQUISITO);
  });
});

describe("/educacao: escada, contato e texto (V04)", () => {
  it("a escada é Aprender → Automatizar → Sistema sob medida, com o Aprender em destaque", () => {
    expect(ESCADA_EDUCACAO.map((d) => d.nome)).toEqual(["Aprender", "Automatizar", "Sistema sob medida"]);
    expect(ESCADA_EDUCACAO.map((d) => d.destaque)).toEqual([true, false, false]);
  });

  it("o degrau seguinte (Automatizar) leva à /consultoria", () => {
    expect(ESCADA_EDUCACAO[1].href).toBe("/consultoria");
  });

  it("a mensagem do WhatsApp é a da educação, com a marca [educação]", () => {
    expect(mensagemContato("educacao")).toMatch(/\[educação\]$/);
    expect(new URL(linkContato("educacao")).searchParams.get("text")).toBe(mensagemContato("educacao"));
  });

  it("a formação vem do Diário de obra: MBA e IA aplicada a negócios (FGV), IEL e FIEC, FullCycle", () => {
    expect(FORMACAO.map((f) => f.prs[0])).toEqual([5, 6, 8, 67, 82]);
  });

  it("sem a série Ensinando IA (nenhum episódio publicado em 2026-11-20) e sem termo bloqueado", () => {
    expect(TUDO).not.toMatch(/ensinando ia/i);
    expect(lintConteudo(TUDO, carregarTermosLocais(raiz))).toEqual([]);
  });

  it("a página não tem script (nada a medir, nada a enviar)", () => {
    const pagina = readFileSync(join(raiz, "src", "pages", "educacao.astro"), "utf8");
    expect(pagina).not.toMatch(/<script/);
  });
});
