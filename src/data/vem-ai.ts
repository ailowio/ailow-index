/**
 * Fonte única de /vem-ai (V12, 2026-11-20; ADR 007 item 5, ADR 006 item 2; brainstorm v2 §5.7).
 *
 * O quadro Em uso · Em teste · Construindo · Próximo passo. Regras (test/v12-vem-ai.test.ts, com canários):
 * - o status de um card vem do `status_fato` da entrada do Diário de obra que ele cita em `fato`; o card não
 *   repete o status (ADR 006: um fato, um status, um lugar). Se a entrada mudar de status, o card muda de coluna e
 *   o verbo antigo reprova o build;
 * - só o card cujo fato não tem entrada própria com status usa `semFato`: o status e um trecho copiado, ao pé da
 *   letra, do corpo da entrada que o sustenta (hoje só o software do Pulse, "Próximo passo: ..." da #081);
 * - a frase começa pelo verbo do PLANO §4 da bancada ("Uso", "Estou testando", "Estou construindo", "O próximo
 *   passo é"); nada de data futura, prazo, promessa ou preço; todo número da frase está no corpo da entrada citada;
 * - card sem fonte não entra: toda prova é uma entrada publicada (#NNN) ou uma rota indexável do site.
 *
 * Fora do quadro (FORA_DO_QUADRO): candidatos do brainstorm sem fonte pública em 2026-11-20.
 */
import { STATUS_FATO, type StatusFato } from "../changelog/tipos";
import { ROTAS_INDEXAVEIS } from "../config/indexacao";

export const COLUNAS = [
  { status: "uso", titulo: "Em uso", verbo: "Uso", luz: "acesa", sinal: "Luz acesa" },
  { status: "testando", titulo: "Em teste", verbo: "Estou testando", luz: "meia", sinal: "Meia luz" },
  { status: "construindo", titulo: "Construindo", verbo: "Estou construindo", luz: "obra", sinal: "Fita de obra" },
  { status: "proximo", titulo: "Próximo passo", verbo: "O próximo passo é", luz: "apagada", sinal: "Luz apagada" },
] as const satisfies readonly { status: StatusFato; titulo: string; verbo: string; luz: string; sinal: string }[];

export type Coluna = (typeof COLUNAS)[number];
export type StatusQuadro = Coluna["status"];

/** Uma entrada publicada do Diário de obra (#NNN) ou uma página do site. */
export type Prova = { pr: number } | { rota: string; rotulo: string };

export interface Card {
  id: string;
  titulo: string;
  /** Uma frase, começando pelo verbo da coluna. */
  frase: string;
  /** Entrada do Diário de obra que dá o status (`status_fato`). */
  fato?: number;
  /** Só quando nenhuma entrada tem o status deste fato: o status e o trecho literal que o sustenta. */
  semFato?: { status: StatusQuadro; citacao: { pr: number; trecho: string } };
  provas: Prova[];
}

/** O que o quadro precisa de uma entrada publicada (verificacao: confirmado). */
export interface EntradaQuadro {
  numero: number;
  status_fato?: StatusFato;
  corpo: string;
}

export const TOPO = {
  sobretitulo: "Vem aí",
  titulo: "O que eu uso, o que estou testando e o que estou construindo.",
  tese: "Cada cartão diz em que pé a coisa está, com o verbo certo e a prova no Diário de obra. O que ainda não começou aparece como próximo passo, sem data.",
} as const;

export const CARDS: readonly Card[] = [
  {
    id: "cloud",
    titulo: "Cloud, o ERP no celular",
    frase: "Uso em produção desde 13 de novembro de 2026; a versão seguinte já saiu pelo pipeline, com aprovação.",
    fato: 78,
    provas: [{ pr: 78 }, { rota: "/cloud", rotulo: "Página do Cloud" }],
  },
  {
    id: "agente-teares",
    titulo: "Agente de Produção dos teares",
    frase: "Uso desde janeiro de 2026: um agente de IA consulta o banco de produção e responde no Telegram sobre os teares.",
    fato: 33,
    provas: [{ pr: 33 }, { rota: "/explorar/agente-producao-teares", rotulo: "Ver o fluxo" }],
  },
  {
    id: "resumo-diario",
    titulo: "Resumo diário de gestão",
    frase: "Uso desde julho de 2026: um fluxo do n8n serve o resumo diário de gestão.",
    fato: 54,
    provas: [{ pr: 54 }],
  },
  {
    id: "firmware-v19",
    titulo: "Firmware v1.9 dos gateways",
    frase: "Estou testando a v1.9, gravada nos dois gateways da fábrica em 18 de novembro de 2026; a conferência formal segue pendente.",
    fato: 80,
    provas: [{ pr: 80 }, { rota: "/chao-de-fabrica#ep-3", rotulo: "Relatório de campo" }],
  },
  {
    id: "coletor",
    titulo: "Coletor do Pulse",
    frase: "Estou testando o coletor que grava no banco o que os gateways enviam; falta a validação com os sensores em campo.",
    fato: 76,
    provas: [{ pr: 76 }, { rota: "/pulse", rotulo: "Página do Pulse" }],
  },
  {
    id: "sensores",
    titulo: "Sensores de produção na fábrica",
    frase: "Estou construindo a implantação: há caixas instaladas em parte das máquinas, e o mapa de cada canal para a sua máquina está em conferência.",
    fato: 81,
    provas: [{ pr: 81 }, { rota: "/chao-de-fabrica", rotulo: "Série Chão de Fábrica" }],
  },
  {
    id: "software-pulse",
    titulo: "Plataforma de monitoramento do Pulse",
    frase: "O próximo passo é atualizar a plataforma de monitoramento. Hoje o Pulse só coleta e guarda os dados: ainda não tem tela, painel nem alerta.",
    semFato: {
      status: "proximo",
      citacao: { pr: 81, trecho: "Próximo passo: atualizar a plataforma de monitoramento" },
    },
    provas: [{ pr: 81 }, { rota: "/pulse", rotulo: "O que o Pulse ainda não tem" }],
  },
];

/** Candidatos do brainstorm (§5.7) que não entram: sem fonte pública confirmada em 2026-11-20. */
export const FORA_DO_QUADRO: readonly { id: string; nome: string; motivo: string }[] = [
  {
    id: "fabrica-no-celular",
    nome: "A fábrica no celular",
    motivo: "Só na estratégia interna da bancada (vídeo planejado para quando o software rodar); sem entrada no Diário de obra nem página pública.",
  },
  {
    id: "engenharia-de-produtos",
    nome: "Engenharia de Produtos v2",
    motivo: "Só no áudio de 19/11 e na colheita local; a #069 não nomeia os módulos e não há entrada sobre a implantação das fichas.",
  },
  {
    id: "ensinando-ia",
    nome: "Cursos de IA (série Ensinando IA)",
    motivo: "Nenhum episódio publicado em 2026-11-20; a /educacao só cita a série depois do primeiro (regra da V04).",
  },
  {
    id: "modulos-cloud",
    nome: "Novos módulos do Cloud",
    motivo: "Citados no brainstorm sem nome, entrada ou estado; nada para mostrar como fato.",
  },
];

const MESES = "janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";
const NUM_MES: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  março: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

/** Data, prazo, promessa e preço: o quadro não tem nenhum (Não fazer da V12). */
const PROMESSAS: readonly RegExp[] = [
  /em breve/i,
  /\blan[cç]a(r|mento|mentos|remos|rei|do|da)?\b/i,
  new RegExp(`\\bat[eé] (o (fim|final) de )?(${MESES})\\b`, "i"),
  /\bprevist[oa]s?\b|\bprevis[aã]o\b/i,
  /\bprazos?\b/i,
  /\bdata de (entrega|lan[cç]amento|estreia)\b/i,
  /\b(pr[oó]xim[oa]|neste|nesse|este|esse|nesta|nessa|esta|essa) (m[eê]s|ano|semestre|trimestre|semana)\b/i,
  /\bsemana que vem\b|\bano que vem\b|\bm[eê]s que vem\b/i,
  /\bvai (sair|ficar|chegar|estar|lan[cç]ar)\b|\b(ficar|estar)[aá] pront/i,
  /\bestreia\b/i,
  /** Mês sem ano é data solta (quase sempre futura). */
  new RegExp(`\\b(${MESES})\\b(?!\\s+de\\s+\\d{4})`, "i"),
  /R\$|\bpre[cç]os?\b|\bgr[aá]tis\b|\bdesconto\b/i,
];

/** As promessas encontradas no texto (vazio = ok): frases da lista, ano futuro e data completa futura. */
export function promessas(texto: string, hoje: Date): string[] {
  const achados = PROMESSAS.flatMap((re) => {
    const m = texto.match(re);
    return m ? [m[0]] : [];
  });
  for (const m of texto.matchAll(/\b(20\d{2})\b/g)) {
    if (Number(m[1]) > hoje.getFullYear()) achados.push(m[0]);
  }
  const datas = new RegExp(`\\b(\\d{1,2}) de (${MESES}) de (\\d{4})\\b`, "gi");
  for (const m of texto.matchAll(datas)) {
    const d = new Date(Number(m[3]), NUM_MES[m[2].toLowerCase()] ?? 0, Number(m[1]));
    if (d.getTime() > hoje.getTime()) achados.push(m[0]);
  }
  return achados;
}

const rot = (n: number) => `#${String(n).padStart(3, "0")}`;
const espacos = (t: string) => t.replace(/\s+/g, " ");

export interface CardMontado extends Card {
  status: StatusQuadro;
}

export interface Quadro {
  colunas: { coluna: Coluna; cards: CardMontado[] }[];
  erros: string[];
}

/**
 * Monta o quadro a partir das entradas publicadas. Não lança: devolve os erros (o build lança se houver algum;
 * os testes leem a lista).
 */
export function montarQuadro(cards: readonly Card[], entradas: readonly EntradaQuadro[], hoje: Date): Quadro {
  const erros: string[] = [];
  const porNumero = new Map(entradas.map((e) => [e.numero, e]));
  const porStatus = new Map<StatusQuadro, CardMontado[]>(COLUNAS.map((c) => [c.status, []]));
  const ids = new Set<string>();
  const statusDoQuadro = new Set<string>(COLUNAS.map((c) => c.status));

  for (const k of cards) {
    if (ids.has(k.id)) erros.push(`${k.id}: id repetido`);
    ids.add(k.id);
    const prs = k.provas.filter((p): p is { pr: number } => "pr" in p).map((p) => p.pr);

    if (k.provas.length === 0) erros.push(`${k.id}: card sem fonte (nenhuma prova)`);
    for (const p of k.provas) {
      if ("pr" in p) {
        if (!porNumero.has(p.pr)) erros.push(`${k.id}: a prova ${rot(p.pr)} não está publicada no Diário de obra`);
      } else {
        const caminho = p.rota.split("#")[0];
        const barra = caminho.endsWith("/") ? caminho : `${caminho}/`;
        if (!ROTAS_INDEXAVEIS.includes(barra)) erros.push(`${k.id}: a rota ${p.rota} não é uma página pública do site`);
      }
    }

    let status: StatusQuadro | undefined;
    if (k.fato !== undefined && k.semFato) {
      erros.push(`${k.id}: tem fato e semFato (o status viria de dois lugares)`);
      continue;
    }
    if (k.fato !== undefined) {
      const e = porNumero.get(k.fato);
      if (!e) erros.push(`${k.id}: a entrada ${rot(k.fato)} não existe ou não está publicada`);
      else if (!e.status_fato) erros.push(`${k.id}: a entrada ${rot(k.fato)} está sem status_fato`);
      else if (!statusDoQuadro.has(e.status_fato))
        erros.push(`${k.id}: o status "${e.status_fato}" de ${rot(k.fato)} não é coluna do quadro`);
      else status = e.status_fato as StatusQuadro;
      if (!prs.includes(k.fato)) erros.push(`${k.id}: as provas não incluem a entrada ${rot(k.fato)}`);
    } else if (k.semFato) {
      const { pr, trecho } = k.semFato.citacao;
      const e = porNumero.get(pr);
      if (!e) erros.push(`${k.id}: a citação aponta para ${rot(pr)}, que não está publicada`);
      else if (!espacos(e.corpo).includes(espacos(trecho)))
        erros.push(`${k.id}: a citação "${trecho}" não está no corpo de ${rot(pr)}`);
      if (!prs.includes(pr)) erros.push(`${k.id}: as provas não incluem a entrada citada ${rot(pr)}`);
      if (!(STATUS_FATO as readonly string[]).includes(k.semFato.status)) erros.push(`${k.id}: status inválido`);
      else status = k.semFato.status;
    } else {
      erros.push(`${k.id}: card sem fonte (nem entrada com status nem citação)`);
    }
    if (!status) continue;

    const coluna = COLUNAS.find((c) => c.status === status) as Coluna;
    if (!k.frase.startsWith(coluna.verbo))
      erros.push(`${k.id}: o verbo da coluna "${coluna.titulo}" é "${coluna.verbo}" e a frase não começa por ele`);
    const p = promessas(`${k.titulo} ${k.frase}`, hoje);
    if (p.length > 0) erros.push(`${k.id}: promessa de data, prazo ou preço (${p.join(", ")})`);
    porStatus.get(status)?.push({ ...k, status });
  }

  return { colunas: COLUNAS.map((coluna) => ({ coluna, cards: porStatus.get(coluna.status) ?? [] })), erros };
}

/** Todo o texto publicado pela página a partir destes dados (para os testes de conteúdo). */
export const textoPublico = (): string => JSON.stringify({ TOPO, COLUNAS, CARDS });
