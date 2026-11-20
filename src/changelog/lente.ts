/**
 * V09 (ADR 007 item 4): a lente do Diário de obra. "tecnico" = a entrada como está (changelog); "dono" = o
 * `resumo_dono` em frase simples. Sem JS a página fica na leitura técnica e o resumo aparece rotulado no cartão.
 */
export const LENTES = ["dono", "tecnico"] as const;
export type Lente = (typeof LENTES)[number];

export const LENTE_PADRAO: Lente = "tecnico";

/** Chave do sessionStorage: a escolha vale só nesta sessão do navegador (sem cookie). */
export const CHAVE_LENTE = "ailow-lente";

/** Valor guardado (ou nada) -> lente válida; qualquer outra coisa cai na padrão. */
export function lerLente(valor: string | null | undefined): Lente {
  return (LENTES as readonly string[]).includes(valor ?? "") ? (valor as Lente) : LENTE_PADRAO;
}
