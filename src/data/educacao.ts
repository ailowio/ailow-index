/**
 * Conteúdo da /educacao (V04, 2026-11-20; ADR 007 itens 2 e 5; brainstorm v2 §5.5 S1 e S4).
 * Regras (test/v04-educacao.test.ts):
 * - fato (palco, formação, tema, bio, degrau) cita entradas confirmadas do Diário de obra (#NNN), e todo número
 *   do texto aparece no corpo de uma delas;
 * - formato é PROPOSTA (o Pedro ajusta com cada instituição): sem número nenhum, ou seja, sem carga horária,
 *   duração, preço ou tamanho de turma;
 * - credenciamento do Sistema S: só requisito lido em fonte oficial (lista abaixo, hoje vazia) e nunca
 *   "credenciado".
 * Fora por falta de confirmação (pendências no diário da V04): "ensinei minha equipe a usar o ChatGPT"
 * (só no áudio de 19/11, transcrição sem revisão humana), CNPJ, ementa em PDF e a série Ensinando IA
 * (nenhum episódio publicado em 2026-11-20).
 */
import { ESCADA } from "./consultoria";

export const TOPO = {
  sobretitulo: "Educação corporativa em IA",
  titulo: "Ensino IA do jeito que uso na fábrica.",
  tese:
    "Palestra, oficina e trilha para empresários e equipes, levadas à sua instituição: Sistema S, sindicatos e associações que capacitam empresas.",
};

export interface Palco {
  id: string;
  /** Palestra, entrevista, reportagem: o que foi de fato (entrevista não vira "aula"). */
  tipo: string;
  titulo: string;
  texto: string;
  prs: number[];
}

export const PALCOS: Palco[] = [
  {
    id: "sindigrafica",
    tipo: "Palestra",
    titulo: "Sindigráfica-CE",
    texto:
      "Na reunião de associados, em 29 de abril de 2026: como alinhar tecnologia e processo produtivo, com o monitoramento de máquinas por sensores, IoT e software.",
    prs: [44],
  },
  {
    id: "sebraetec",
    tipo: "Gravação",
    titulo: "Sebrae e SENAI na fábrica",
    texto: "Em 1º de junho de 2026, o Sebrae e o SENAI visitaram a fábrica para gravar o vídeo institucional do Sebraetec.",
    prs: [48],
  },
  {
    id: "record",
    tipo: "Reportagem",
    titulo: "TV Record",
    texto: "Participação na reportagem sobre a Feira do Empreendedor, do Sebrae, em 3 de outubro de 2025.",
    prs: [14],
  },
  {
    id: "ufc",
    tipo: "Entrevista",
    titulo: "UFC",
    texto: "Entrevista no programa Experiências Inspiradoras, gravada em 5 de setembro de 2025.",
    prs: [12],
  },
];

/** Do outro lado da mesa: o Sistema S como aluno e como empresa atendida. */
export const SISTEMA_S = {
  texto:
    "Conheço o Sistema S como empresa atendida e como aluno: a fábrica passou por duas consultorias do Sebraetec, de layout industrial e de gestão de processos, e fiz cursos no IEL, na FIEC e no Sebrae.",
  prs: [48, 8, 67, 9],
};

export interface Formato {
  id: string;
  nome: string;
  oQue: string;
  paraQuem: string;
  saiCom: string;
}

export const AVISO_PROPOSTA =
  "Proposta: formato, duração, público e conteúdo são ajustados com a instituição, de acordo com o programa dela.";

export const FORMATOS: Formato[] = [
  {
    id: "palestra",
    nome: "Palestra",
    oQue: "Uma conversa para muitos: o que a IA já faz numa fábrica de verdade e por onde uma empresa pode começar.",
    paraQuem: "Empresários e gestores, em evento, reunião de associados ou abertura de programa.",
    saiCom: "Exemplos tirados da fábrica e um primeiro uso para testar no dia seguinte.",
  },
  {
    id: "oficina",
    nome: "Oficina",
    oQue: "Mão na massa: cada participante usa IA, no próprio celular, numa tarefa do seu trabalho.",
    paraQuem: "Empresários e equipes, em turma pequena. Traga o celular.",
    saiCom: "Pedidos à IA que funcionam no trabalho de cada um e o cuidado de conferir o que ela devolve.",
  },
  {
    id: "trilha",
    nome: "Trilha",
    oQue: "Encontros em sequência, do uso de IA no dia a dia ao primeiro processo automatizado.",
    paraQuem: "Uma empresa, ou um grupo de empresas, que quer sair com algo rodando.",
    saiCom: "Um processo mapeado e a primeira automação desenhada para ele.",
  },
];

export interface Tema {
  id: string;
  nome: string;
  texto: string;
  prs: number[];
}

/** Áreas temáticas: só o que o Pedro pratica, com a entrada que prova. */
export const TEMAS: Tema[] = [
  {
    id: "dia-a-dia",
    nome: "IA no trabalho de todo dia",
    texto: "Pedir bem à IA (engenharia de prompts) e conferir o que ela devolve antes de usar.",
    prs: [4, 6],
  },
  {
    id: "processo",
    nome: "Processo antes da ferramenta",
    texto: "Mapear o processo antes de automatizar: processo que ninguém desenhou não se automatiza.",
    prs: [67],
  },
  {
    id: "agentes",
    nome: "Automação e agentes de IA",
    texto: "Fluxos no n8n e agentes de IA no administrativo, no planejamento da produção e no Telegram da fábrica.",
    prs: [13, 33],
  },
  {
    id: "chao",
    nome: "Dados do chão de fábrica",
    texto: "Sensores de produção e IoT: o caminho do dado, da máquina até a tela de quem decide.",
    prs: [44, 81],
  },
  {
    id: "sistema",
    nome: "Do processo ao sistema",
    texto: "Quando a automação vira sistema: o SGI da Copel, feito para o processo da fábrica.",
    prs: [69],
  },
];

export interface ItemFormacao {
  id: string;
  nome: string;
  onde: string;
  prs: number[];
}

export const FORMACAO: ItemFormacao[] = [
  { id: "mba", nome: "MBA em Gestão Empresarial", onde: "FGV, 2025", prs: [5] },
  { id: "ia-negocios", nome: "Inteligência Artificial Aplicada a Negócios", onde: "FGV, 2025", prs: [6] },
  { id: "ia-graficas", nome: "IA aplicada à agilidade nas gráficas", onde: "FIEC e IEL, 2025", prs: [8] },
  { id: "processos", nome: "Mapeamento de Processos e Automação Inteligente", onde: "IEL Ceará, 2026", prs: [67] },
  { id: "fullcycle", nome: "Curso FullCycle 4.0", onde: "Projeto Final entregue em 2026", prs: [82] },
];

/** Kit do analista: o que quem precisa justificar a contratação dentro da instituição procura primeiro. */
export const KIT = {
  quem: {
    texto:
      "Pedro Fernandes. Sócio da Copel, a fábrica onde aplico primeiro o que ensino, e fundador da Ailow, em outubro de 2025.",
    prs: [16],
  },
  duracao: "Combinados com a instituição, para cada formato.",
};

export const CREDENCIAMENTO =
  "Cada entidade tem as próprias regras para contratar palestra, oficina ou consultoria. Consulte a sua instituição sobre o que ela pede e me diga do que precisa.";

/**
 * Fontes oficiais lidas por inteiro sobre credenciamento (URL + data). Vazia em 2026-11-20: as páginas do Sebrae
 * tentadas renderizam o conteúdo por JS e os editais em PDF não tinham texto legível nesta sessão (lista no PR).
 * Enquanto vazia, a página não cita requisito nenhum (teste).
 */
export const FONTES_CREDENCIAMENTO_LIDAS: { url: string; lidaEm: string }[] = [];

export interface DegrauEducacao {
  id: string;
  nome: string;
  oQue: string;
  oferta: string;
  destaque: boolean;
  href: string;
  rotuloLink: string;
  prs: number[];
}

/** A mesma escada da /consultoria, vista daqui: o Aprender em destaque e o degrau seguinte leva à consultoria. */
export const ESCADA_EDUCACAO: DegrauEducacao[] = ESCADA.map((d) => {
  if (d.id === "aprender") return { ...d, destaque: true, href: "#formatos", rotuloLink: "Ver os formatos" };
  if (d.id === "automatizar") return { ...d, destaque: false, href: "/consultoria", rotuloLink: "Ver a consultoria" };
  return { ...d, destaque: false };
});
