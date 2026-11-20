/**
 * Fonte única de /na-tv (V07, 2026-11-20; ADR 007 item 5, ADR 005).
 * O arco UFC -> Record -> afiliada Globo como escada. Fatos só de src/data/entrevistas.ts e das entradas
 * confirmadas do Diário de obra (#012, #014, #037); nada de nome de entrevistador nem de marca de emissora
 * (o nome em texto pode).
 *
 * Teasers: pacotes da bancada já importados (ADR 008) em public/midia/<slug>/. O degrau de cada teaser é o da
 * conversa de onde a fala saiu (o selo do próprio pôster): P1 e P2 são falas da UFC. O P3 (afiliada Globo) foi
 * retirado pelo orquestrador na V06 (dado em tela): aquele degrau aparece sem vídeo.
 *
 * Chips: cada pergunta leva o player ao segundo em que a resposta começa. `inicio` é o início EXATO de um cue
 * do legenda.vtt do teaser e `trecho` é o começo do texto desse cue (test/v07-na-tv.test.ts confere os dois).
 *
 * `youtubeId`: entrevista completa no YouTube com fachada (ADR 005). Hoje nenhuma tem; sem id, nada aparece
 * (nem "em breve") e a CSP não muda.
 */
import { entrevistas } from "./entrevistas";

export interface ChipPergunta {
  pergunta: string;
  /** Segundos; início de um cue do .vtt. */
  inicio: number;
  /** Começo do texto do cue que começa em `inicio`. */
  trecho: string;
}

export interface TeaserNaTv {
  slug: string;
  /** Igual ao começo do `titulo` do site.json do pacote. */
  titulo: string;
  chips: ChipPergunta[];
}

export interface DegrauNaTv {
  /** Número da entrada confirmada no Diário de obra (o mesmo de entrevistas.ts). */
  feed: number;
  /** Onde a história chegou nesse degrau. */
  alcance: string;
  teasers: TeaserNaTv[];
  /** Id de 11 caracteres do vídeo no YouTube (não listado), ou null. */
  youtubeId: string | null;
}

export const TOPO = {
  sobretitulo: "Entrevistas e reportagens",
  titulo: "A história ficou maior a cada entrevista.",
  tese: "Da universidade à TV aberta: três conversas, em ordem, cada uma com a prova no Diário de obra.",
} as const;

/** Em ordem de subida: o primeiro degrau é o mais antigo. */
export const DEGRAUS: readonly DegrauNaTv[] = [
  {
    feed: 12,
    alcance: "Universidade",
    youtubeId: null,
    teasers: [
      {
        slug: "teaser-p1-improvisar-sob-pressao",
        titulo: "Improvisar sob pressão",
        chips: [
          { pergunta: "O que a música trouxe?", inicio: 0, trecho: "A música me trouxe segurança" },
          { pergunta: "Como isso vale na empresa?", inicio: 7.42, trecho: "improvisar sob pressão. Dá pra" },
          { pergunta: "E quando se perde o tom?", inicio: 38.234, trecho: "perder o tom. E se perder" },
          { pergunta: "Como se aprende a improvisar?", inicio: 43.571, trecho: "improvisando. Na primeira vez" },
        ],
      },
      {
        slug: "teaser-p2-teoria-na-pratica",
        titulo: "A teoria na prática",
        chips: [
          { pergunta: "Como é a teoria na prática?", inicio: 6.58, trecho: "acredito que o segredo" },
          { pergunta: "Como foi a aquisição?", inicio: 15.34, trecho: "agora, no finalzinho do ano passado" },
          { pergunta: "Que contas foram feitas?", inicio: 24.12, trecho: "feito todo um estudo" },
          { pergunta: "Comprar porque está barato?", inicio: 41.872, trecho: "aquela coisa que você fala" },
        ],
      },
    ],
  },
  { feed: 14, alcance: "TV aberta", youtubeId: null, teasers: [] },
  { feed: 37, alcance: "Afiliada Globo", youtubeId: null, teasers: [] },
];

/** A entrevista (fatos publicados) de um degrau. */
export function entrevistaDoDegrau(d: DegrauNaTv) {
  const e = entrevistas.find((x) => x.feed === d.feed);
  if (!e) throw new Error(`degrau sem entrevista publicada: #${d.feed}`);
  return e;
}

export const arquivosTeaser = (slug: string) => ({
  mp4: `/midia/${slug}/video-720p.mp4`,
  poster: `/midia/${slug}/poster.webp`,
  vtt: `/midia/${slug}/legenda.vtt`,
});

/** 0 -> "0:00"; 43.571 -> "0:43". */
export function tempoTexto(s: number): string {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
