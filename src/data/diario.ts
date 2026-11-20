/**
 * Conteúdo do Diário de obra (/pedro), V09 (2026-11-20; ADR 007 itens 3 e 4).
 * O feed de PRs ganha nome de gente ("Diário de obra"), fica secundário (a URL /pedro não muda) e ganha a lente
 * "Para empresários / Para técnicos". Regras em test/v09-diario.test.ts.
 */
export { RESUMO_MAX } from "../changelog/tipos";

export const TOPO = {
  titulo: "Diário de obra",
  subtitulo: "cada entrega, com data e prova",
  descricao: "Diário de obra do Pedro Fernandes: cada entrega, com data e prova, em leitura para empresários e para técnicos.",
} as const;

export const LENTE = {
  rotulo: "Leitura",
  dono: "Para empresários",
  tecnico: "Para técnicos",
  /** Rótulo do resumo no cartão quando as duas leituras aparecem juntas (sem JS e nas labels). */
  rotuloResumo: "Para empresários:",
} as const;

/**
 * "Os 3 que eu mostraria numa visita" (decisão do orquestrador por delegação, 2026-11-20).
 * Critério: uma entrada por frente de trabalho, confirmada e `merged`, fora da fila de correção da V10/V11
 * (#056, #063, #080, #081), e que dá para mostrar na hora numa visita: o quadro de comando no chão de fábrica
 * (iot), o sistema de gestão da fábrica (sgi) e o produto em produção para a loja piloto (cloud).
 */
export const VISITA = {
  titulo: "Os 3 que eu mostraria numa visita",
  criterio:
    "Uma por frente (chão de fábrica, sistema da fábrica e produto para cliente), todas confirmadas e entregues, fora das que ainda estão em validação.",
  numeros: [47, 69, 78],
} as const;
