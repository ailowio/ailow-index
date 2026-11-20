import { tokensDoTema } from "./contraste.ts";

/**
 * Deriva entre a cópia versionada dos tokens do Pulso (`pulso-tokens.json`, vinda da bancada) e
 * `tokens.css` (ADR 008 item 4, V05). Sem imports sem extensão: o script de sincronização roda no Node puro.
 *
 * Só se comparam os tokens que existem dos dois lados (MAPA). O site usa rem; a bancada usa px de canvas
 * 1080x1920: a conversão é px / 16 = rem (mesma base do `tokens.css`).
 */

export interface Token {
  name: string;
  value: string;
}
export interface CopiaTokens {
  fonte: string;
  version: number;
  sincronizado_em?: string;
  color: { tokens: Token[] };
  type: { families: Record<string, string> };
  spacing: { tokens: Token[] };
  radius: { tokens: Token[] };
  duracao: { tokens: Token[] };
  easing: { tokens: Token[] };
  traco: { tokens: Token[] };
}

export interface Mapeamento {
  /** Variável do `tokens.css`. */
  css: string;
  /** `grupo.nome` na cópia (ex.: `color.amarelo`, `type.titulo`). */
  origem: string;
  conversao: "direto" | "px-rem";
  /** Divergência conhecida e aceita: o site tem de ter exatamente este valor, e ele tem de diferir da origem. */
  divergencia?: { site: string; motivo: string };
}

const direto = (css: string, origem: string): Mapeamento => ({ css, origem, conversao: "direto" });
const pxRem = (css: string, origem: string): Mapeamento => ({ css, origem, conversao: "px-rem" });

export const MAPA: Mapeamento[] = [
  direto("--grafite", "color.grafite"),
  direto("--grafite-800", "color.grafite-800"),
  direto("--linha", "color.linha"),
  direto("--aco", "color.aco"),
  direto("--branco", "color.branco"),
  direto("--estudio", "color.estudio"),
  direto("--tinta", "color.tinta"),
  direto("--tinta-2", "color.tinta-2"),
  direto("--amarelo", "color.amarelo"),
  direto("--sinal", "color.sinal"),
  {
    ...direto("--sinal-fraco", "color.sinal-fraco"),
    divergencia: {
      site: "#1b6fb0",
      motivo:
        "o site usa um azul um pouco mais escuro (4,58:1 contra 4,54:1 sobre estudio); o motivo não está registrado no ADR 003. Alinhar ou documentar é decisão do Pedro.",
    },
  },
  pxRem("--espaco-1", "spacing.space-1"),
  pxRem("--espaco-2", "spacing.space-2"),
  pxRem("--espaco-3", "spacing.space-3"),
  pxRem("--espaco-4", "spacing.space-4"),
  pxRem("--espaco-6", "spacing.space-6"),
  pxRem("--espaco-8", "spacing.space-8"),
  pxRem("--raio-0", "radius.raio-0"),
  pxRem("--raio-selo", "radius.raio-selo"),
  pxRem("--raio-card", "radius.raio-card"),
  pxRem("--traco-fino", "traco.traco-fino"),
  pxRem("--traco-borda", "traco.traco-borda"),
  direto("--dur-tique", "duracao.dur-tique"),
  direto("--dur-curta", "duracao.dur-curta"),
  direto("--dur-media", "duracao.dur-media"),
  direto("--ease-entra", "easing.ease-entra"),
  direto("--ease-move", "easing.ease-move"),
  direto("--fonte-titulo", "type.titulo"),
  direto("--fonte-corpo", "type.corpo"),
  {
    ...direto("--fonte-mono", "type.mono"),
    divergencia: {
      site: '"JetBrains Mono", ui-monospace, monospace',
      motivo: "a bancada lista IBM Plex Mono como reserva; o site só auto-hospeda JetBrains Mono (ADR 005: zero terceiros).",
    },
  },
];

const GRUPOS_COM_TOKENS = ["color", "spacing", "radius", "duracao", "easing", "traco"] as const;

/** Reduz o `tokens.json` da bancada ao que o site versiona: só nome e valor dos grupos mapeados. */
export function reduzirTokens(origem: {
  version?: number;
  type: { families: Record<string, string>; [outro: string]: unknown };
  [grupo: string]: unknown;
}): CopiaTokens {
  const pegar = (grupo: string): { tokens: Token[] } => {
    const g = origem[grupo] as { tokens?: Token[] } | undefined;
    return { tokens: (g?.tokens ?? []).map(({ name, value }) => ({ name, value })) };
  };
  const [color, spacing, radius, duracao, easing, traco] = GRUPOS_COM_TOKENS.map(pegar);
  return {
    fonte: "design-system-pulso/tokens.json (bancada)",
    version: origem.version ?? 1,
    color,
    type: { families: { ...origem.type.families } },
    spacing,
    radius,
    duracao,
    easing,
    traco,
  };
}

const compacto = (v: string) => v.replace(/\s+/g, "").toLowerCase();

function valorDaOrigem(copia: CopiaTokens, origem: string, profundidade = 0): string | undefined {
  const [grupo, ...resto] = origem.split(".");
  const nome = resto.join(".");
  let valor: string | undefined;
  if (grupo === "type") valor = copia.type.families[nome];
  else valor = (copia[grupo as (typeof GRUPOS_COM_TOKENS)[number]]?.tokens ?? []).find((t) => t.name === nome)?.value;
  // Referência `{outro}` dentro do mesmo grupo (ex.: tinta = {grafite}).
  const ref = valor && profundidade < 5 ? /^\{(.+)\}$/.exec(valor) : null;
  return ref ? valorDaOrigem(copia, `${grupo}.${ref[1]}`, profundidade + 1) : valor;
}

function paraRem(px: string): string | undefined {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(px.trim());
  if (!m) return undefined;
  const n = Number(m[1]) / 16;
  return n === 0 ? "0" : `${n}rem`;
}

/** Devolve uma linha por divergência; lista vazia = `tokens.css` e a cópia concordam no mapa. */
export function compararTokens(css: string, copia: CopiaTokens): string[] {
  const site = tokensDoTema(css, "escuro");
  const erros: string[] = [];
  for (const m of MAPA) {
    const noSite = site.get(m.css);
    const bruto = valorDaOrigem(copia, m.origem);
    if (noSite === undefined) {
      erros.push(`${m.css}: ausente no tokens.css (origem ${m.origem})`);
      continue;
    }
    if (bruto === undefined) {
      erros.push(`${m.css}: origem ${m.origem} ausente na cópia`);
      continue;
    }
    const esperado = m.conversao === "px-rem" ? (paraRem(bruto) ?? bruto) : bruto;
    const igual = compacto(noSite) === compacto(esperado);
    if (m.divergencia) {
      if (igual) {
        erros.push(`${m.css}: exceção obsoleta (o site já igualou a origem ${m.origem}); remova a divergência declarada`);
      } else if (compacto(noSite) !== compacto(m.divergencia.site)) {
        erros.push(
          `${m.css}: divergência declarada mudou (tokens.css "${noSite}", declarado "${m.divergencia.site}", origem "${esperado}")`,
        );
      } else if (compacto(m.divergencia.site) === compacto(esperado)) {
        erros.push(`${m.css}: exceção obsoleta (a origem passou a valer o valor declarado)`);
      }
      continue;
    }
    if (!igual) erros.push(`${m.css}: tokens.css "${noSite}" difere da cópia "${esperado}" (${m.origem})`);
  }
  return erros;
}
