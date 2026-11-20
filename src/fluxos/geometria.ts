/**
 * Geometria do canvas do Explorador: as posições vêm do editor do n8n (canto superior esquerdo do nó).
 * Funções puras, testadas em test/fluxos.test.ts.
 */
export const LADO = 72;
export const MARGEM = 72;
/** Espaço abaixo do nó para o rótulo (até 3 linhas). */
export const ALTURA_ROTULO = 56;

export interface Ponto {
  x: number;
  y: number;
}

export function caixaDoCanvas(nos: Ponto[]): { largura: number; altura: number } {
  const maxX = Math.max(...nos.map((n) => n.x));
  const maxY = Math.max(...nos.map((n) => n.y));
  return { largura: maxX + LADO + MARGEM * 2, altura: maxY + LADO + ALTURA_ROTULO + MARGEM * 2 };
}

/**
 * Ligação "fluxo": da direita da origem à esquerda do destino (curva horizontal, como no n8n).
 * Ligação "ia" (modelo, memória, ferramenta presos ao agente): do topo do sub-nó à base do agente, tracejada no CSS.
 */
export function caminhoLigacao(de: Ponto, para: Ponto, tipo: "fluxo" | "ia"): string {
  const m = MARGEM;
  if (tipo === "ia") {
    const x1 = de.x + m + LADO / 2;
    const y1 = de.y + m;
    const x2 = para.x + m + LADO / 2;
    // Sai abaixo da 1ª linha do rótulo do agente, para a linha tracejada não passar por cima do texto.
    const y2 = para.y + m + LADO + 26;
    const dy = Math.max(40, Math.abs(y1 - y2) / 2);
    return `M${x1} ${y1} C${x1} ${y1 - dy} ${x2} ${y2 + dy} ${x2} ${y2}`;
  }
  const x1 = de.x + m + LADO;
  const y1 = de.y + m + LADO / 2;
  const x2 = para.x + m;
  const y2 = para.y + m + LADO / 2;
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

/** Quebra o rótulo em linhas de até `max` caracteres, sem cortar palavras. */
export function linhasDoRotulo(rotulo: string, max = 18): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of rotulo.split(/\s+/)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length > max && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}
