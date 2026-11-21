/**
 * Conteúdo da "IA no seu negócio" (V14, 2026-11-20; ADR 007 itens 2 e 5; brainstorm v2 §5.5 S3).
 * Simulador ESTÁTICO: o setor se escolhe por link, sem API de IA e sem script.
 * Regras (test/v14-ia-no-seu-negocio.test.ts):
 * - cada uso é um fato da prática do Pedro, com a entrada confirmada do Diário de obra (#NNN) ou o fluxo do
 *   /explorar que o prova; todo número do fato está na fonte citada; o verbo segue a entrada ("em uso", "ativo",
 *   "implementei", "não afirmo uso");
 * - o equivalente no setor é SUGESTÃO, marcada como tal na página: sem número, sem caso, sem resultado;
 * - em lugar nenhum: "garantido", percentual, economia, aumento, redução, preço.
 * Gráfica e têxtil vêm direto da Copel; comércio e serviço só com usos cujo mecanismo já roda (na Copel ou no
 * Cloud). Fora de propósito: a LINA (#007, desligada: não deu conta), NF-e para comércio e serviço (nota de balcão
 * e nota de serviço são outro mecanismo) e qualquer uso sem entrada.
 */
import type { Origem } from "../config/contato";

export type NivelId = "celular" | "automacao" | "sistema";

export interface Nivel {
  id: NivelId;
  /** O degrau da escada (src/data/consultoria.ts, ESCADA). */
  degrau: "Aprender" | "Automatizar" | "Sistema sob medida";
  nome: string;
  oQue: string;
}

export const NIVEIS: readonly Nivel[] = [
  {
    id: "celular",
    degrau: "Aprender",
    nome: "No celular",
    oQue: "IA no dia a dia, direto do celular. É o primeiro degrau, o que se aprende no curso.",
  },
  {
    id: "automacao",
    degrau: "Automatizar",
    nome: "Automação",
    oQue: "Fluxos e agentes de IA que tiram da equipe o trabalho repetido.",
  },
  {
    id: "sistema",
    degrau: "Sistema sob medida",
    nome: "Sistema",
    oQue: "Um sistema feito para o processo da empresa, rodando na infraestrutura da Ailow.",
  },
];

export interface Uso {
  id: string;
  nivel: NivelId;
  titulo: string;
  /** Onde o fato acontece. */
  onde: "Na Copel" | "No Cloud";
  /** O fato, com o verbo da entrada. */
  fato: string;
  /** Entradas do Diário de obra que provam o fato. */
  prs: number[];
  /** Fluxo do /explorar que mostra o mecanismo (slug de src/data/fluxos). */
  fluxo?: string;
}

export const USOS: readonly Uso[] = [
  // ---------- No celular (Aprender) ----------
  {
    id: "pedir-bem",
    nivel: "celular",
    titulo: "Pedir bem à IA",
    onde: "Na Copel",
    fato:
      "Fiz um curso de engenharia de prompts, sobre como pedir bem à IA, em abril de 2025. Depois, escrevi o prompt de branding da Ailow.",
    prs: [4, 17],
  },
  {
    id: "gpt-proprio",
    nivel: "celular",
    titulo: "Um GPT próprio para o pedido",
    onde: "Na Copel",
    fato:
      "O planejamento da produção saiu do papel e passou por uma impressora térmica com um GPT próprio, antes de virar fluxo.",
    prs: [],
    fluxo: "pcp-no-asana",
  },
  {
    id: "audio-texto",
    nivel: "celular",
    titulo: "Falar em vez de digitar",
    onde: "Na Copel",
    fato:
      "Mando um áudio no Telegram e recebo o texto de volta. É o exemplo mais simples de IA útil na rotina, em uso desde outubro de 2025.",
    prs: [18],
    fluxo: "transcritor-de-audio",
  },
  // ---------- Automação (Automatizar) ----------
  {
    id: "pergunta-producao",
    nivel: "automacao",
    titulo: "Perguntar e a IA consulta o banco",
    onde: "Na Copel",
    fato:
      "Pergunto em português, pelo Telegram, e uma IA consulta o banco de produção dos teares e responde. Está ativo desde janeiro de 2026.",
    prs: [33],
    fluxo: "agente-producao-teares",
  },
  {
    id: "resumo-diario",
    nivel: "automacao",
    titulo: "Resumo diário de gestão",
    onde: "Na Copel",
    fato: "Uma automação entrega o resumo diário de gestão. Está ativa desde julho de 2026.",
    prs: [54],
  },
  {
    id: "boletos",
    nivel: "automacao",
    titulo: "Boletos conferidos por fluxo",
    onde: "Na Copel",
    fato: "Em outubro de 2025, montei um fluxo no n8n para gerenciar e conciliar os boletos do financeiro.",
    prs: [19],
  },
  {
    id: "pedido-tarefa",
    nivel: "automacao",
    titulo: "Pedido que vira tarefa",
    onde: "Na Copel",
    fato:
      "O pedido confirmado virava uma tarefa no Asana, com uma subtarefa por item, e a equipe era avisada. Foi a ponte entre o papel e o sistema, que depois assumiu essa parte.",
    prs: [29],
    fluxo: "pcp-no-asana",
  },
  {
    id: "comprovantes-folha",
    nivel: "automacao",
    titulo: "Comprovantes da folha",
    onde: "Na Copel",
    fato: "Em agosto de 2025, montei um fluxo no n8n que automatiza o envio dos comprovantes da folha de pagamento.",
    prs: [11],
  },
  // ---------- Sistema (Sistema sob medida) ----------
  {
    id: "orcamento",
    nivel: "sistema",
    titulo: "Cotação e orçamento no sistema",
    onde: "Na Copel",
    fato:
      "O módulo gráfico do SGI, o sistema da fábrica, tem cotação e orçamento desde a versão 1.5.0, de abril de 2026. A versão nova do módulo foi criada em setembro.",
    prs: [42, 64],
  },
  {
    id: "compras-estoque",
    nivel: "sistema",
    titulo: "Compras e estoque pela nota fiscal",
    onde: "Na Copel",
    fato:
      "No SGI, os módulos de compras e de estoque recebem a nota fiscal, e uma função lê a chave da NF-e por OCR. Foram entregues em junho de 2026.",
    prs: [51],
  },
  {
    id: "cobranca",
    nivel: "sistema",
    titulo: "Cobrança integrada",
    onde: "Na Copel",
    fato: "O módulo Comercial Têxtil do SGI tem integração de cobrança com o Asaas desde julho de 2026.",
    prs: [58],
  },
  {
    id: "nfe",
    nivel: "sistema",
    titulo: "Nota fiscal dentro do sistema",
    onde: "Na Copel",
    fato: "A NF-e é emitida dentro do SGI, pela API do Brasil NFe, e a emissão está em uso.",
    prs: [59],
  },
  {
    id: "producao-textil",
    nivel: "sistema",
    titulo: "Planejamento e produção no sistema",
    onde: "Na Copel",
    fato:
      "Implementei no SGI os módulos de planejamento e controle da produção (PCP) e de produção têxtil, em janeiro de 2026, e comecei o de produção de teares em fevereiro.",
    prs: [30, 35],
  },
  {
    id: "erp-celular",
    nivel: "sistema",
    titulo: "Um ERP no celular",
    onde: "No Cloud",
    fato:
      "O Cloud está no ar desde 13 de novembro de 2026. A grade configurável veio do que a loja piloto precisava.",
    prs: [78, 79],
  },
  {
    id: "portal-cliente",
    nivel: "sistema",
    titulo: "Portal do cliente",
    onde: "Na Copel",
    fato: "Fiz um portal do cliente para o SGI, com a versão 1.0.0 em junho de 2026. Ainda não afirmo uso por clientes.",
    prs: [50],
  },
];

export const usoPorId = (id: string): Uso => {
  const u = USOS.find((x) => x.id === id);
  if (!u) throw new Error(`uso desconhecido: ${id}`);
  return u;
};

export interface UsoNoSetor {
  uso: string;
  /** Como o mesmo mecanismo ficaria no setor. É sugestão: sem número, caso nem resultado. */
  sugestao: string;
}

export interface Setor {
  slug: "grafica" | "textil" | "comercio" | "servico";
  nome: string;
  /** "numa gráfica": usado no rótulo da sugestão. */
  noSetor: string;
  origem: Origem;
  /** copel = o setor é uma frente da Copel; mecanismo = só usos cujo mecanismo já roda. */
  fonte: "copel" | "mecanismo";
  /** Uma linha no índice. */
  chamada: string;
  abertura: string;
  tituloPagina: string;
  descricao: string;
  usos: UsoNoSetor[];
}

export const SETORES: readonly Setor[] = [
  {
    slug: "grafica",
    nome: "Gráfica",
    noSetor: "numa gráfica",
    origem: "ia-grafica",
    fonte: "copel",
    chamada: "Direto da frente gráfica da Copel.",
    abertura:
      "A Copel, a fábrica de que sou sócio, tem uma frente gráfica. Estes são usos que tenho lá, com a prova de cada um, e como eu levaria cada um para a sua gráfica.",
    tituloPagina: "IA para gráfica: do celular ao sistema sob medida",
    descricao:
      "Usos de IA para gráfica em três níveis, do celular ao sistema sob medida, tirados do que o Pedro usa na Copel, cada um com a prova no Diário de obra.",
    usos: [
      {
        uso: "pedir-bem",
        sugestao:
          "Pedir à IA o texto de uma proposta a partir das medidas e do acabamento do pedido, e conferir antes de mandar ao cliente.",
      },
      {
        uso: "gpt-proprio",
        sugestao:
          "Um GPT próprio com o jeito de a gráfica descrever cada serviço, para organizar o pedido que chega por mensagem.",
      },
      {
        uso: "audio-texto",
        sugestao: "O vendedor grava o pedido em áudio no balcão e recebe o texto para colar na ordem de serviço.",
      },
      {
        uso: "pedido-tarefa",
        sugestao: "A ordem aprovada vira tarefa para a produção, com uma subtarefa por item, e quem imprime é avisado.",
      },
      {
        uso: "resumo-diario",
        sugestao: "Um resumo dos pedidos do dia e do que está parado, entregue ao dono no começo da manhã.",
      },
      {
        uso: "boletos",
        sugestao: "Conferir os boletos recebidos contra os pedidos entregues, num fluxo que roda sozinho.",
      },
      {
        uso: "orcamento",
        sugestao: "A cotação e o orçamento saem do sistema, com as regras de cálculo que a sua gráfica já usa.",
      },
      {
        uso: "compras-estoque",
        sugestao: "Papel, tinta e chapa entram no estoque pela nota fiscal do fornecedor, com a chave lida da foto da nota.",
      },
      {
        uso: "cobranca",
        sugestao: "A cobrança do pedido sai do mesmo sistema do orçamento, integrada ao meio de pagamento.",
      },
    ],
  },
  {
    slug: "textil",
    nome: "Têxtil",
    noSetor: "numa indústria têxtil",
    origem: "ia-textil",
    fonte: "copel",
    chamada: "Direto da frente têxtil da Copel, dos teares ao comercial.",
    abertura:
      "A Copel, a fábrica de que sou sócio, tem uma frente têxtil, com teares. Estes são usos que tenho lá, com a prova de cada um, e como eu levaria cada um para a sua fábrica.",
    tituloPagina: "IA para indústria têxtil: do celular ao sistema sob medida",
    descricao:
      "Usos de IA para a indústria têxtil em três níveis, do celular ao sistema sob medida, tirados do que o Pedro usa na Copel, cada um com a prova no Diário de obra.",
    usos: [
      {
        uso: "pedir-bem",
        sugestao:
          "Pedir à IA a descrição de um artigo novo para o catálogo, a partir da ficha técnica, e revisar antes de publicar.",
      },
      {
        uso: "gpt-proprio",
        sugestao: "Um GPT próprio com a ficha de cada artigo, para organizar o pedido do cliente antes de ir para a produção.",
      },
      {
        uso: "audio-texto",
        sugestao: "O encarregado grava em áudio o que aconteceu no turno e recebe o texto pronto para registrar.",
      },
      {
        uso: "pergunta-producao",
        sugestao:
          "Perguntar pelo celular quanto cada máquina produziu, desde que a contagem das máquinas já chegue a um banco de dados.",
      },
      {
        uso: "resumo-diario",
        sugestao: "Um resumo da produção e dos pedidos, entregue ao dono antes do primeiro turno.",
      },
      {
        uso: "pedido-tarefa",
        sugestao: "O pedido confirmado vira tarefa para o planejamento, com uma subtarefa por artigo.",
      },
      {
        uso: "producao-textil",
        sugestao: "Planejamento e produção no mesmo sistema, máquina por máquina, no processo da sua fábrica.",
      },
      {
        uso: "cobranca",
        sugestao: "A cobrança do pedido sai do sistema comercial, integrada ao meio de pagamento.",
      },
      {
        uso: "nfe",
        sugestao: "A nota fiscal do pedido sai do mesmo sistema comercial em que o pedido foi feito.",
      },
    ],
  },
  {
    slug: "comercio",
    nome: "Comércio",
    noSetor: "numa loja",
    origem: "ia-comercio",
    fonte: "mecanismo",
    chamada: "Só o que tem o mesmo mecanismo já rodando, na Copel ou no Cloud.",
    abertura:
      "Aqui entram só usos cujo mecanismo já roda comigo, na Copel ou no Cloud. Como cada um ficaria numa loja é sugestão, e está marcado assim.",
    tituloPagina: "IA para comércio e loja: do celular ao sistema sob medida",
    descricao:
      "Usos de IA para comércio em três níveis, do celular ao sistema sob medida, com o mesmo mecanismo do que o Pedro já usa e a prova de cada um no Diário de obra.",
    usos: [
      {
        uso: "pedir-bem",
        sugestao:
          "Pedir à IA o texto de uma promoção ou de um post, com o produto e o público da loja, e conferir antes de publicar.",
      },
      {
        uso: "gpt-proprio",
        sugestao: "Um GPT próprio com a lista de produtos da loja, para tirar as dúvidas da equipe sobre o que tem e onde fica.",
      },
      {
        uso: "audio-texto",
        sugestao: "O vendedor grava em áudio a encomenda do cliente e recebe o texto para anotar no pedido.",
      },
      {
        uso: "pergunta-producao",
        sugestao: "Perguntar pelo celular quanto a loja vendeu no dia, com as vendas já registradas num sistema.",
      },
      {
        uso: "resumo-diario",
        sugestao: "Um resumo das vendas e do caixa do dia, entregue ao dono no fim do expediente.",
      },
      {
        uso: "boletos",
        sugestao: "Conferir os boletos de fornecedor a pagar e os recebidos, num fluxo que roda sozinho.",
      },
      {
        uso: "erp-celular",
        sugestao:
          "Vendas, produtos, compras, clientes e financeiro num só lugar, no celular de quem vende no balcão. É para isso que o Cloud existe.",
      },
      {
        uso: "compras-estoque",
        sugestao: "A mercadoria entra no estoque pela nota fiscal do fornecedor, com a chave lida da foto da nota.",
      },
      {
        uso: "cobranca",
        sugestao: "A cobrança da venda a prazo sai do sistema, integrada ao meio de pagamento.",
      },
    ],
  },
  {
    slug: "servico",
    nome: "Serviço",
    noSetor: "numa empresa de serviço",
    origem: "ia-servico",
    fonte: "mecanismo",
    chamada: "Só o que tem o mesmo mecanismo já rodando na Copel.",
    abertura:
      "Aqui entram só usos cujo mecanismo já roda comigo, na Copel. Como cada um ficaria numa empresa de serviço é sugestão, e está marcado assim.",
    tituloPagina: "IA para empresa de serviço: do celular ao sistema sob medida",
    descricao:
      "Usos de IA para empresas de serviço em três níveis, do celular ao sistema sob medida, com o mesmo mecanismo do que o Pedro já usa e a prova de cada um no Diário de obra.",
    usos: [
      {
        uso: "pedir-bem",
        sugestao:
          "Pedir à IA um rascunho de proposta ou de resposta ao cliente, com o contexto do serviço, e revisar antes de enviar.",
      },
      {
        uso: "gpt-proprio",
        sugestao:
          "Um GPT próprio com a lista dos seus serviços e o jeito de descrever cada um, para montar o pedido que chega por mensagem.",
      },
      {
        uso: "audio-texto",
        sugestao: "Depois da visita ao cliente, gravar em áudio o que foi visto e receber o texto para o relatório.",
      },
      {
        uso: "resumo-diario",
        sugestao: "Um resumo dos atendimentos do dia e do que ficou pendente, entregue no começo da manhã.",
      },
      {
        uso: "boletos",
        sugestao: "Conferir os boletos dos clientes que já pagaram e dos que ainda estão em aberto, num fluxo que roda sozinho.",
      },
      {
        uso: "comprovantes-folha",
        sugestao: "Enviar a cada pessoa da equipe o comprovante da folha, sem mandar um por um.",
      },
      {
        uso: "orcamento",
        sugestao: "O orçamento sai do sistema, montado com a sua lista de serviços e as suas regras de cálculo.",
      },
      {
        uso: "cobranca",
        sugestao: "A cobrança de cada serviço sai do sistema, integrada ao meio de pagamento.",
      },
      {
        uso: "portal-cliente",
        sugestao: "Um portal em que o cliente acompanha os próprios pedidos, sem precisar perguntar por mensagem.",
      },
    ],
  },
];

export const setorPorSlug = (slug: string): Setor => {
  const s = SETORES.find((x) => x.slug === slug);
  if (!s) throw new Error(`setor desconhecido: ${slug}`);
  return s;
};

/** Os usos do setor agrupados por nível, na ordem da escada. */
export function usosDoSetor(s: Setor): { nivel: Nivel; usos: (Uso & { sugestao: string })[] }[] {
  return NIVEIS.map((nivel) => ({
    nivel,
    usos: s.usos
      .map((x) => ({ ...usoPorId(x.uso), sugestao: x.sugestao }))
      .filter((u) => u.nivel === nivel.id),
  }));
}

export const LEGENDA = {
  fato: "O que eu uso, com a prova no Diário de obra ou no fluxo aberto.",
  sugestao: "Como o mesmo mecanismo ficaria no seu setor. É sugestão: não é caso nem resultado.",
};

export const INDICE = {
  tituloPagina: "IA no seu negócio: usos de IA por setor",
  descricao:
    "Escolha o setor (gráfica, têxtil, comércio ou serviço) e veja usos de IA em três níveis, do celular ao sistema sob medida, tirados da prática do Pedro, cada um com a prova.",
  titulo: "Escolha o seu setor.",
  tese:
    "Para cada setor, usos de IA em três níveis, do celular ao sistema sob medida. Cada um sai do que eu uso, com a prova, e o jeito de levar para o seu negócio vem marcado como sugestão.",
};

export interface Caminho {
  id: "aprender" | "fazer";
  titulo: string;
  texto: string;
  href: "/educacao" | "/consultoria";
  rotulo: string;
}

/** Os dois caminhos do fim de cada página de setor (ADR 007 item 2). */
export const CAMINHOS: readonly Caminho[] = [
  {
    id: "aprender",
    titulo: "Aprender",
    texto: "Palestra, oficina e trilha para começar pelo celular, com a sua equipe.",
    href: "/educacao",
    rotulo: "Ver os cursos",
  },
  {
    id: "fazer",
    titulo: "Fazer na sua empresa",
    texto: "Automação e sistema sob medida, do diagnóstico no chão da empresa até a operação.",
    href: "/consultoria",
    rotulo: "Ver a consultoria",
  },
];
