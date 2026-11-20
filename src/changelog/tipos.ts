/** Modelo do changelog do Pedro (ADR 002). Sem dependência do Astro: testável em Node puro. */

export const TIPOS = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "test",
  "ci",
  "build",
  "docs",
  "chore",
  "revert",
] as const;

/** Frentes do feed. Ampliar aqui (e no ADR 002) quando surgir uma frente nova. */
export const ESCOPOS = [
  "infra",
  "sgi",
  "iot",
  "pulse",
  "cloud",
  "n8n",
  "ia",
  "video",
  "harness",
  "brand",
  "negocio",
  "talk",
  "learn",
  "side",
] as const;

export const ESTADOS = ["merged", "open", "closed"] as const;
export const VERIFICACOES = ["confirmado", "pendente", "fora"] as const;
export const CATEGORIAS = [
  "front",
  "back",
  "dados",
  "infra",
  "qualidade",
  "iot",
  "automacao-ia",
  "integracoes",
  "video",
  "gestao",
] as const;

/** V09: tamanho máximo do `resumo_dono` (uma ou duas frases curtas). */
export const RESUMO_MAX = 220;

/**
 * V10 (ADR 006 item 2): verbo × status do PLANO da bancada. uso = "uso, roda"; validado = "validei num piloto";
 * testando = "estou testando"; construindo = "estou construindo"; proximo = "o próximo passo é".
 */
export const STATUS_FATO = ["uso", "validado", "testando", "construindo", "proximo"] as const;
export type StatusFato = (typeof STATUS_FATO)[number];

export type Tipo = (typeof TIPOS)[number];
export type Escopo = (typeof ESCOPOS)[number];
export type Categoria = (typeof CATEGORIAS)[number];

export type Prova = { publica: string } | { privada: string };

export interface EntradaPR {
  /** Nome do arquivo sem extensão, ex.: "001-vps". */
  id: string;
  numero: number;
  titulo: string;
  /** "AAAA" ou "AAAA-MM". */
  data: string;
  estado: (typeof ESTADOS)[number];
  ferramentas: string[];
  soft_skills: string[];
  prova: Prova;
  verificacao: (typeof VERIFICACOES)[number];
  /** Texto Markdown da entrada (o "corpo do PR"). */
  corpo: string;
  /** V09: leitura "Para empresários" (só nas entradas de vitrine). */
  resumo_dono?: string;
  /** V10: verbo × status do fato (ADR 006). Só onde a própria entrada sustenta. */
  status_fato?: StatusFato;
}

export interface Ferramenta {
  id: string;
  nome: string;
  categoria: Categoria;
  /** Marcado pelo Pedro; o resto do painel é derivado do feed. */
  principal?: boolean;
}

export interface SoftSkill {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Catalogos {
  ferramentas: Ferramenta[];
  softSkills: SoftSkill[];
}
