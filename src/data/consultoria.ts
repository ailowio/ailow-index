/**
 * Conteúdo da /consultoria (V03, 2026-11-20; ADR 007 itens 2 e 5; brainstorm v2 §5.4 C1, C3, C4, C5).
 * Regra (test/v03-consultoria.test.ts): cada bloco cita entradas confirmadas do Diário de obra (#NNN) e todo
 * número do texto aparece no corpo de uma delas. Sem preço, prazo, contagem de clientes nem nome de cliente:
 * o Cloud aparece com "a loja piloto" (não há ok para publicar o nome nesta página). A #081 tem contradição em
 * aberto ("todas as máquinas", colheita de IoT §7): aqui o texto não diz "todas".
 */

export interface Etapa {
  id: string;
  nome: string;
  /** O que a etapa é, no método. */
  oQue: string;
  /** Como foi na Copel (cliente zero). */
  naCopel: string;
  prs: number[];
}

export const ETAPAS: Etapa[] = [
  {
    id: "diagnostico",
    nome: "Diagnóstico no chão de fábrica",
    oQue:
      "Começo olhando o processo como ele é, no lugar onde acontece e com quem faz. Processo que ninguém desenhou não se automatiza.",
    naCopel:
      "A fábrica passou por duas consultorias do Sebraetec, de layout industrial e de gestão de processos, e o mapeamento ajudou a reorganizar a operação. Num quadro de comando antigo, a segurança elétrica e mecânica veio antes de qualquer sensor.",
    prs: [48, 47, 67],
  },
  {
    id: "prototipo",
    nome: "Protótipo",
    oQue: "Uma versão pequena, testada na bancada e depois numa parte da operação, antes de levar para o resto.",
    naCopel:
      "O gateway foi testado na bancada mandando a contagem para um fluxo do n8n. O primeiro MVP de sensores contou a produção em oito teares e foi desmontado em agosto de 2026; o piloto seguinte foi montado do zero.",
    prs: [32, 62],
  },
  {
    id: "implantacao",
    nome: "Implantação",
    oQue: "Instalar em toda a operação e acompanhar no campo, porque o teste de bancada não pega tudo.",
    naCopel:
      "Em novembro de 2026, os sensores foram implantados nas máquinas da fábrica, com as caixas instaladas e rodando. No campo, a contagem ficou abaixo da média e o gateway entrou em reinício em loop; o firmware v1.9 foi gravado e está em validação.",
    prs: [81, 80],
  },
  {
    id: "operacao",
    nome: "Operação",
    oQue:
      "Não existe projeto sem operação: o sistema é uma assinatura e a operação contínua faz parte dela.",
    naCopel:
      "Desde janeiro de 2026, um agente de IA responde no Telegram sobre a produção dos teares. Desde julho de 2026, um fluxo ativo serve o resumo diário de gestão.",
    prs: [33, 54],
  },
];

export interface Degrau {
  id: string;
  nome: string;
  oQue: string;
  /** Qual oferta é: curso (/educacao) ou consultoria (esta página). */
  oferta: "Curso" | "Consultoria";
  href: string;
  rotuloLink: string;
  prs: number[];
}

export const ESCADA: Degrau[] = [
  {
    id: "aprender",
    nome: "Aprender",
    oQue: "Curso de IA para empresários e equipes: usar no dia a dia antes de automatizar.",
    oferta: "Curso",
    href: "/educacao",
    rotuloLink: "Ver os cursos",
    prs: [44],
  },
  {
    id: "automatizar",
    nome: "Automatizar",
    oQue: "Fluxos e agentes de IA que tiram da equipe o trabalho repetido.",
    oferta: "Consultoria",
    href: "/explorar",
    rotuloLink: "Ver fluxos reais",
    prs: [13, 33],
  },
  {
    id: "sistema",
    nome: "Sistema sob medida",
    oQue: "Um sistema feito para o processo da empresa, rodando na infraestrutura da Ailow.",
    oferta: "Consultoria",
    href: "/cloud",
    rotuloLink: "Ver um sistema no ar",
    prs: [69, 78],
  },
];

export interface Caso {
  id: string;
  nome: string;
  papel: string;
  texto: string;
  prs: number[];
  href?: string;
  rotuloLink?: string;
}

export const CASOS: Caso[] = [
  {
    id: "copel",
    nome: "Copel",
    papel: "Cliente zero, o laboratório",
    texto:
      "A fábrica de que sou sócio. O método foi testado lá primeiro: sensores de produção nas máquinas, o SGI com dez módulos na v2 e agentes de IA no planejamento da produção.",
    prs: [81, 69, 13],
  },
  {
    id: "cloud",
    nome: "Ailow Cloud",
    papel: "Com a loja piloto",
    texto:
      "O discovery foi de 26 a 29 de outubro de 2026, com visita à loja, e o primeiro rascunho da tela de venda foi feito no papel, junto com o cliente. A versão 1.0.0 entrou em produção em 13 de novembro de 2026, e a 1.4.0 trouxe eixos de grade a partir do que a loja piloto precisava.",
    prs: [70, 78, 79],
    href: "/cloud",
    rotuloLink: "Conhecer o Cloud",
  },
];

/** Âncora da entrada no Diário de obra (/pedro), igual ao id do CartaoPR. */
export const ancoraPR = (n: number): string => `pr-${String(n).padStart(3, "0")}`;
export const rotuloPR = (n: number): string => `#${String(n).padStart(3, "0")}`;
