// V18 (2026-11-23, pedido do Pedro): /trajetoria, a linha do tempo que se desenha com a rolagem. Funções puras
// (testáveis em Node, sem Astro). Duas camadas:
// (a) MARCOS: vida e negócio, escritos à mão, curtos, cada um com fonte: entrada confirmada do Diário de obra
//     ({ pr }) ou a marca mm:ss do áudio de 19/11/2026 (transcrição local, fora do git; só fatos curtos reescritos).
// (b) ferramentas no caminho: derivadas do feed publicado. Cada ferramenta vira chip na entrada em que aparece pela
//     primeira vez; a entrada com ferramenta nova (ou que está em DESTAQUES) vira ponto. Entrada nova no feed = ponto
//     novo sem editar a página.
import { lintConteudo } from "../changelog/bloqueio";
import { lerTitulo } from "../changelog/regras";

/** O único áudio aceito como fonte: o relato de 19/11/2026 (32:16), curado em TRAJETORIA.md §1 da bancada. */
export const AUDIO = "2026-11-19" as const;
const DURACAO_AUDIO_S = 32 * 60 + 16;

export type Fonte = { pr: number } | { audio: typeof AUDIO; marca: string };

export interface Marco {
  id: string;
  /** "AAAA", "AAAA-MM" ou "AAAA-MM-DD". */
  data: string;
  titulo: string;
  texto: string;
  fonte: Fonte;
}

/**
 * Fora, por decisão da V18 (diário): saúde, cirurgia, relacionamento, a fase de 2021–2023, contas, nomes da equipe e
 * dos consultores, valores, percentuais (o "40%" do layout só com o relatório), nome da concorrente e do banco.
 * Os cursos da No Code Startup ficam como entradas do feed (#002, #004): o áudio não dá a data do curso de Supabase.
 */
export const MARCOS: readonly Marco[] = [
  {
    id: "primeiro-emprego",
    data: "2014",
    titulo: "Primeiro emprego, numa gráfica digital",
    texto: "Para aprender o processo e levar para a gráfica de embalagens da família.",
    fonte: { audio: AUDIO, marca: "01:31" },
  },
  {
    id: "entra-na-empresa",
    data: "2015-05",
    titulo: "Entra na empresa da família",
    texto: "Começa como suporte no dia a dia da fábrica, perto da equipe e dos pagamentos.",
    fonte: { audio: AUDIO, marca: "01:46" },
  },
  {
    id: "formatura",
    data: "2021",
    titulo: "Formado em Administração",
    texto: "Na UFC, depois de anos dividindo o dia entre a empresa e a faculdade.",
    fonte: { audio: AUDIO, marca: "03:00" },
  },
  {
    id: "mba",
    data: "2023",
    titulo: "MBA em Gestão Empresarial",
    texto: "Na FGV. A lição que fica: a melhor maneira de aprender é pôr em prática.",
    fonte: { audio: AUDIO, marca: "04:03" },
  },
  {
    id: "compra-concorrente",
    data: "2024-11",
    titulo: "Compra de uma concorrente",
    texto: "Decidida com um estudo de viabilidade feito com o que aprendeu no MBA.",
    fonte: { audio: AUDIO, marca: "07:43" },
  },
  {
    id: "novo-layout",
    data: "2025-07",
    titulo: "Novo layout da fábrica",
    texto: "Mudança feita com a consultoria do Sebrae e do SENAI: os dois galpões trocam de função.",
    fonte: { audio: AUDIO, marca: "13:16" },
  },
  {
    id: "conhece-cursor",
    data: "2025-11",
    titulo: "Conhece o Cursor",
    texto: "Num curso da No Code Startup, quando precisava de uma interface e não sabia criar uma.",
    fonte: { audio: AUDIO, marca: "24:34" },
  },
  {
    id: "ideia-sensores",
    data: "2026-01",
    titulo: "A ideia dos sensores",
    texto: "Nasce num jantar com o pai. Daí aprende eletrônica do zero: sensor, firmware, caixa e solda.",
    fonte: { audio: AUDIO, marca: "28:38" },
  },
  {
    id: "v2-modulos",
    data: "2026-07",
    titulo: "Começa a v2 dos módulos do SGI",
    texto: "A partir de julho, módulo por módulo, começando pelo Comercial Têxtil.",
    fonte: { pr: 57 },
  },
  {
    id: "banco",
    data: "2026-11-19",
    titulo: "Integração direta com o banco",
    texto: "Homologação concluída: o SGI passa a falar com o banco principal por API, para a conciliação automática.",
    fonte: { audio: AUDIO, marca: "30:59" },
  },
];

/** Entradas do Diário de obra que são marco de verdade: viram ponto grande (as outras só entram com ferramenta nova). */
export const DESTAQUES: readonly number[] = [1, 2, 7, 16, 20, 34, 46, 71, 74, 78, 81, 82];

export const TOPO = {
  sobretitulo: "Trajetória · de 2014 até hoje",
  titulo: "O caminho até aqui",
  tese: "Da gráfica da família aos sensores nas máquinas. Cada ponto tem data e fonte, e cada ferramenta entra no caminho na primeira vez que aparece no Diário de obra.",
  fim: "Até aqui",
} as const;

/** Rótulo da fonte de áudio, como a página mostra. */
export const ROTULO_AUDIO = "Relato do Pedro, áudio de 19/11/2026";

// ---------- Lista proibida (o que nunca entra no texto da página) ----------

const PROIBIDOS: Array<[string, RegExp]> = [
  ["valor em reais", /R\$/],
  ["percentual", /\d\s*%|por\s*cento/i],
  ["saúde", /sa[uú]de|doen[cç]a|trombose|cirurgi|hospital|interna[cç][aã]o/i],
  ["vida pessoal", /relacionamento|namor|ocios|misturad/i],
  ["grafia errada da marca", /(?<![\p{L}])ilo\./iu],
];

/** Nomes próprios permitidos no meio da frase. Qualquer outra palavra com maiúscula fora do início reprova (nomes). */
const NOMES_PERMITIDOS = new Set([
  "Administração",
  "Ailow",
  "API",
  "Code",
  "Comercial",
  "Copel",
  "Cursor",
  "Diário",
  "Empresarial",
  "FGV",
  "Gestão",
  "MBA",
  "No",
  "Pedro",
  "Sebrae",
  "SENAI",
  "SGI",
  "Startup",
  "Têxtil",
  "UFC",
]);

/** Devolve um erro por problema; o termo não é repetido na mensagem (o log do CI é público). */
export function proibidos(texto: string, termosLocais: string[] = []): string[] {
  const erros: string[] = [];
  for (const [nome, re] of PROIBIDOS) if (re.test(texto)) erros.push(`proibido: ${nome}`);
  erros.push(...lintConteudo(texto, termosLocais));
  for (const frase of texto.split(/(?<=[.!?:;])\s+|\n/)) {
    const palavras = frase.match(/\p{L}[\p{L}\p{N}-]*/gu) ?? [];
    for (const p of palavras.slice(1)) {
      if (/^\p{Lu}/u.test(p) && !NOMES_PERMITIDOS.has(p)) erros.push("proibido: nome próprio fora da lista de permitidos");
    }
  }
  return erros;
}

/** Todo o texto escrito à mão que a página publica (uma linha por campo: o início de cada campo é início de frase). */
export const textoPublico = (marcos: readonly Marco[] = MARCOS): string =>
  [TOPO.sobretitulo, TOPO.titulo, TOPO.tese, TOPO.fim, ROTULO_AUDIO, ...marcos.flatMap((m) => [m.titulo, m.texto])].join("\n");

// ---------- Montagem ----------

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const PADRAO_DATA = /^\d{4}(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/;
const rotuloPR = (n: number) => `#${String(n).padStart(3, "0")}`;
/** "2025" ordena antes de "2025-01"; "2026-11" antes de "2026-11-19". */
const chave = (data: string) => (data.length === 4 ? `${data}-00` : data);

/** "2014" -> "2014"; "2025-02" -> "fev 2025"; "2026-11-19" -> "19 nov 2026". */
export function rotuloData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  if (!mes) return ano ?? data;
  const m = MESES[Number(mes) - 1] ?? mes;
  return dia ? `${Number(dia)} ${m} ${ano}` : `${m} ${ano}`;
}

/** O que a trajetória precisa de cada entrada publicada (verificacao: confirmado). */
export interface EntradaCaminho {
  numero: number;
  data: string;
  titulo: string;
  ferramentas: string[];
}

export interface Chip {
  id: string;
  nome: string;
  /** /pedro/label/<id> quando a label existe; null quando não existe. */
  href: string | null;
}

interface Base {
  data: string;
  rotulo: string;
  titulo: string;
  chips: Chip[];
  /** Ferramentas distintas até esta parada, inclusive. */
  acumulado: number;
}

export type Parada =
  | (Base & {
      tipo: "marco";
      id: string;
      texto: string;
      fonte: { tipo: "pr"; numero: number; href: string } | { tipo: "audio"; marca: string };
    })
  | (Base & { tipo: "entrada"; numero: number; destaque: boolean; href: string });

export interface Ano {
  ano: string;
  paradas: Parada[];
}

export interface Trajetoria {
  anos: Ano[];
  /** Ferramentas distintas no feed publicado. */
  total: number;
  erros: string[];
}

const ancora = (n: number) => `/pedro#pr-${String(n).padStart(3, "0")}`;

function validarMarcos(marcos: readonly Marco[], porNumero: Map<number, EntradaCaminho>, termos: string[]): string[] {
  const erros: string[] = [];
  const ids = new Set<string>();
  let anterior = "";
  for (const m of marcos) {
    if (ids.has(m.id)) erros.push(`marco ${m.id}: id duplicado`);
    ids.add(m.id);
    if (!PADRAO_DATA.test(m.data)) erros.push(`marco ${m.id}: data fora do formato AAAA, AAAA-MM ou AAAA-MM-DD`);
    if (chave(m.data) < anterior) erros.push(`marco ${m.id}: fora da ordem cronológica`);
    anterior = chave(m.data);
    if ("pr" in m.fonte) {
      const e = porNumero.get(m.fonte.pr);
      if (!e) erros.push(`marco ${m.id}: ${rotuloPR(m.fonte.pr)} não existe ou não está confirmada`);
      else if (!m.data.startsWith(e.data) && !e.data.startsWith(m.data)) {
        erros.push(`marco ${m.id}: data ${m.data} diferente da ${rotuloPR(m.fonte.pr)} (${e.data})`);
      }
    } else {
      if (m.fonte.audio !== AUDIO) erros.push(`marco ${m.id}: só o áudio de ${AUDIO} é fonte`);
      const r = /^(\d{2}):([0-5]\d)$/.exec(m.fonte.marca);
      if (!r || Number(r[1]) * 60 + Number(r[2]) > DURACAO_AUDIO_S) {
        erros.push(`marco ${m.id}: marca do áudio fora de mm:ss ou depois dos 32:16`);
      }
    }
    for (const p of proibidos(`${m.titulo}\n${m.texto}`, termos)) erros.push(`marco ${m.id}: ${p}`);
  }
  return erros;
}

/**
 * Monta a trajetória: marcos + entradas publicadas, em ordem cronológica (empate: o marco vem antes), agrupada por ano.
 * `nomes` = catálogo de ferramentas; `labels` = ids de ferramenta com página /pedro/label/<id>.
 * O marco que cita uma entrada ({ pr }) recebe os chips dela, e a entrada não vira ponto separado.
 */
export function montarTrajetoria(
  marcos: readonly Marco[],
  entradas: readonly EntradaCaminho[],
  nomes: ReadonlyMap<string, string>,
  labels: ReadonlySet<string>,
  termos: string[] = [],
): Trajetoria {
  const ordenadas = [...entradas].sort((a, b) => a.numero - b.numero);
  const porNumero = new Map(ordenadas.map((e) => [e.numero, e]));
  const erros = validarMarcos(marcos, porNumero, termos);
  for (const n of DESTAQUES) if (!porNumero.has(n)) erros.push(`destaque ${rotuloPR(n)} sem entrada publicada`);

  const chip = (id: string): Chip => ({
    id,
    nome: nomes.get(id) ?? id,
    href: labels.has(id) ? `/pedro/label/${id}` : null,
  });

  // Primeira aparição de cada ferramenta, em ordem de número (o feed já garante que a data não volta no tempo).
  const vistas = new Set<string>();
  const novasPor = new Map<number, Chip[]>();
  for (const e of ordenadas) {
    const novas = e.ferramentas.filter((f) => !vistas.has(f));
    for (const f of novas) vistas.add(f);
    novasPor.set(e.numero, novas.map(chip));
  }

  type Item = { k: string; ordem: number; parada: Parada };
  const itens: Item[] = [];
  const citadas = new Set<number>();
  marcos.forEach((m, i) => {
    let fonte: Extract<Parada, { tipo: "marco" }>["fonte"];
    let chips: Chip[] = [];
    if ("pr" in m.fonte) {
      if (!porNumero.has(m.fonte.pr)) return;
      citadas.add(m.fonte.pr);
      chips = novasPor.get(m.fonte.pr) ?? [];
      fonte = { tipo: "pr", numero: m.fonte.pr, href: ancora(m.fonte.pr) };
    } else {
      fonte = { tipo: "audio", marca: m.fonte.marca };
    }
    const parada: Parada = {
      tipo: "marco",
      id: m.id,
      data: m.data,
      rotulo: rotuloData(m.data),
      titulo: m.titulo,
      texto: m.texto,
      fonte,
      chips,
      acumulado: 0,
    };
    itens.push({ k: chave(m.data), ordem: i, parada });
  });
  const destaques = new Set(DESTAQUES);
  for (const e of ordenadas) {
    const chips = novasPor.get(e.numero) ?? [];
    if (citadas.has(e.numero) || (chips.length === 0 && !destaques.has(e.numero))) continue;
    itens.push({
      k: chave(e.data),
      ordem: 1000 + e.numero,
      parada: {
        tipo: "entrada",
        numero: e.numero,
        destaque: destaques.has(e.numero),
        data: e.data,
        rotulo: rotuloData(e.data),
        titulo: lerTitulo(e.titulo)?.descricao ?? e.titulo,
        href: ancora(e.numero),
        chips,
        acumulado: 0,
      },
    });
  }
  itens.sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : a.ordem - b.ordem));

  const anos: Ano[] = [];
  let acumulado = 0;
  for (const { parada } of itens) {
    acumulado += parada.chips.length;
    parada.acumulado = acumulado;
    const ano = parada.data.slice(0, 4);
    const ultimo = anos.at(-1);
    if (ultimo?.ano === ano) ultimo.paradas.push(parada);
    else anos.push({ ano, paradas: [parada] });
  }
  return { anos, total: vistas.size, erros };
}
