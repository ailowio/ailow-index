/**
 * Fonte única de /chao-de-fabrica (V08, 2026-11-20; ADR 007 item 5, ADR 006, ADR 005).
 *
 * A série da bancada, episódio por episódio. Os textos só repetem o que está nas entradas confirmadas do Diário de
 * obra que cada episódio cita (`fatos`) e o que o próprio vídeo aprovado diz (legenda.vtt do pacote). Nenhum número
 * fora dessas fontes (test/v08-chao-de-fabrica.test.ts confere).
 *
 * Datas: #1 é o lote de vídeo de 10/11/2026 citado na prova da #081; #2 é o dia seguinte (o vídeo abre com
 * "Ontem os quadros foram pra parede"); #3 é o dia da gravação da v1.9 nos dois gateways (#080). São as mesmas
 * datas das pastas dos episódios na bancada.
 *
 * Status: a colheita de IoT (local, fora do git) contradiz duas frases fortes do feed: a implantação "em todas as
 * máquinas" (#081) e o fechamento da v1.9 (#080). Aqui as duas aparecem como "em validação" e FRASES_PROIBIDAS
 * barra a versão forte. Corrigir as entradas do feed é da V11, não daqui.
 *
 * #3 não tem vídeo: é um relatório de campo em texto (sintoma, hipótese, o que era, decisão, estado).
 */

export const ETAPAS_RELATORIO = ["Sintoma", "Hipótese", "O que era", "Decisão", "Estado"] as const;
export type EtapaRelatorio = (typeof ETAPAS_RELATORIO)[number];

export interface VideoEpisodio {
  /** Pasta do pacote importado em public/midia/ (ADR 008). */
  pacote: string;
  /** Igual ao `duracao_s` do site.json. */
  duracaoS: number;
  /** Igual ao `selo_ia` do site.json: a narração usa voz gerada por IA. */
  seloIa: boolean;
}

export interface ItemEstado {
  /** `feito`: o que o episódio mostra. `em-validacao`: o que ainda não fechou. */
  tipo: "feito" | "em-validacao";
  texto: string;
  /** Entrada do Diário de obra que trata desse ponto. */
  fato?: number;
}

export interface Episodio {
  numero: 1 | 2 | 3;
  titulo: string;
  /** AAAA-MM-DD: o dia do que o episódio mostra. */
  data: string;
  /** Rótulo curto do formato. */
  formato: string;
  resumo: string;
  video: VideoEpisodio | null;
  estado: ItemEstado[];
  relatorio?: { etapa: EtapaRelatorio; texto: string }[];
  /** Números das entradas confirmadas do Diário de obra (#NNN). */
  fatos: number[];
}

export const TOPO = {
  sobretitulo: "Série · Chão de Fábrica",
  titulo: "A implantação dos sensores, episódio por episódio.",
  tese: "O que aconteceu no chão da fábrica, na ordem em que aconteceu. Cada episódio tem a prova no Diário de obra, e o que ainda não fechou aparece como em validação.",
} as const;

export const EPISODIOS: readonly Episodio[] = [
  {
    numero: 1,
    titulo: "Dois quadros na parede",
    data: "2026-11-10",
    formato: "Vídeo",
    resumo:
      "Os quadros de sensores saíram da bancada e foram para a parede: um no primeiro galpão e outro no segundo, cada um com a sua etiqueta de identificação. A conexão ficou para o dia seguinte.",
    video: { pacote: "chao-1-dois-quadros", duracaoS: 46, seloIa: true },
    estado: [{ tipo: "feito", texto: "Os dois quadros fixados na parede, ainda sem ligação." }],
    fatos: [81, 62],
  },
  {
    numero: 2,
    titulo: "O sinal chegou",
    data: "2026-11-11",
    formato: "Vídeo",
    resumo:
      "As duas caixas ligadas ao cabo de cada máquina e os dois gateways na internet: o sinal chegou. Um deles já trouxe de volta os sensores das máquinas do projeto piloto. Faltava a outra ponta, o sensor em cada máquina.",
    video: { pacote: "chao-2-sinal-chegou", duracaoS: 54, seloIa: true },
    estado: [
      { tipo: "feito", texto: "Infraestrutura pronta: quadros ligados e sinal chegando." },
      {
        tipo: "em-validacao",
        texto: "O sensor em cada máquina: em validação, máquina por máquina.",
        fato: 81,
      },
    ],
    fatos: [81, 76],
  },
  {
    numero: 3,
    titulo: "Firmware v1.9",
    data: "2026-11-18",
    formato: "Relatório de campo",
    resumo: "O teste de bancada não pegou o problema. Ele só apareceu depois de dias com os gateways no chão de fábrica.",
    video: null,
    estado: [
      {
        tipo: "em-validacao",
        texto: "A v1.9 está gravada nos dois gateways e segue em validação em campo.",
        fato: 80,
      },
    ],
    relatorio: [
      {
        etapa: "Sintoma",
        texto: "Depois de dias com os gateways no chão de fábrica, a contagem ficou abaixo da média que o MVP recebia.",
      },
      { etapa: "Hipótese", texto: "A primeira suspeita foi perda de pulsos antes de chegarem ao gateway." },
      {
        etapa: "O que era",
        texto:
          "A comparação entre o código anterior e o novo apontou fragilidades dentro do próprio firmware. Com quatro ou cinco dias de operação, o gateway entrou em reinício em loop e parou de enviar.",
      },
      {
        etapa: "Decisão",
        texto:
          "Revisar o código várias vezes e gravar a v1.9 nos dois gateways da fábrica, em 18 de novembro de 2026, no fim do expediente.",
      },
      {
        etapa: "Estado",
        texto:
          "Em validação. As primeiras leituras voltaram à faixa de antes; a validação em campo começou em 19 de novembro de 2026 e o item segue aberto.",
      },
    ],
    fatos: [80, 81],
  },
];

/** Arquivos do pacote de um episódio (os mesmos nomes do contrato da V05). */
export const arquivosEpisodio = (pacote: string) => ({
  mp4: `/midia/${pacote}/video-720p.mp4`,
  poster: `/midia/${pacote}/poster.webp`,
  vtt: `/midia/${pacote}/legenda.vtt`,
});

/** "2026-11-10" -> "10 nov 2026". */
export function dataCurta(iso: string): string {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} ${meses[m - 1]} ${a}`;
}

/**
 * Frases fortes que a colheita de IoT contradiz ou que o site não pode prometer. A página e os dados não podem
 * contê-las; o canário do teste mostra que o texto atual da #081 seria reprovado.
 */
export const FRASES_PROIBIDAS: readonly RegExp[] = [
  /todas as m[aá]quinas/i,
  /\bconclu[ií]d[ao]s?\b/i,
  /\b(validad|aprovad|aceit)[ao]s?\b|\baceite\b/i,
  /\brodando\b/i,
  /\b(resolvid|corrigid)[ao]s?\b/i,
  /100\s?%/,
  /manuten[cç][aã]o preditiva/i,
  /em breve|a produzir|pr[oó]ximo epis[oó]dio/i,
];

/** As frases proibidas encontradas no texto (vazio = ok). */
export function frasesProibidas(texto: string): string[] {
  return FRASES_PROIBIDAS.flatMap((re) => {
    const m = texto.match(re);
    return m ? [m[0]] : [];
  });
}

/** Todo o texto publicado pela página a partir destes dados (para os testes de conteúdo). */
export const textoPublico = (): string => JSON.stringify({ TOPO, EPISODIOS });
