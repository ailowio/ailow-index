/** Contraste WCAG 2.x sobre os tokens de src/styles/tokens.css (sem dependência). */

export type Par = { texto: string; fundo: string; min: number };
export type Violacao = { tema: string; par: Par; razao: number };

const HEX = /^#([0-9a-f]{6})$/i;

export function luminancia(hex: string): number {
  const m = HEX.exec(hex);
  if (!m) throw new Error(`cor inválida (só #rrggbb): ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function razao(a: string, b: string): number {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Lê as declarações `--nome: valor;` de um bloco de CSS. */
function declaracoes(corpo: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) mapa.set(m[1], m[2].trim());
  return mapa;
}

function blocos(css: string, seletor: RegExp): string[] {
  const sem = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const saida: string[] = [];
  for (const m of sem.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (seletor.test(m[1].trim())) saida.push(m[2]);
  }
  return saida;
}

/** Tokens resolvidos (var(--x) seguido até um #rrggbb) de um tema: paleta bruta + papéis do tema. */
export function tokensDoTema(css: string, tema: "escuro" | "claro"): Map<string, string> {
  const base = new Map<string, string>();
  for (const b of blocos(css, /^:root$/)) for (const [k, v] of declaracoes(b)) base.set(k, v);
  const papeis =
    tema === "escuro"
      ? blocos(css, /^:root,\s*:root\[data-tema="escuro"\]$/)
      : blocos(css, /^:root\[data-tema="claro"\]$/);
  for (const b of papeis) for (const [k, v] of declaracoes(b)) base.set(k, v);

  const resolvido = new Map<string, string>();
  for (const [nome] of base) {
    let v = base.get(nome) as string;
    for (let i = 0; i < 5; i++) {
      const ref = /^var\((--[\w-]+)\)$/.exec(v);
      if (!ref) break;
      v = base.get(ref[1]) ?? v;
    }
    resolvido.set(nome, v);
  }
  return resolvido;
}

export function verificarPares(
  tokens: Map<string, string>,
  pares: Par[],
  tema: string,
): Violacao[] {
  const ruins: Violacao[] = [];
  for (const par of pares) {
    const t = tokens.get(par.texto);
    const f = tokens.get(par.fundo);
    if (!t || !f) throw new Error(`token ausente no tema ${tema}: ${par.texto} ou ${par.fundo}`);
    const r = razao(t, f);
    if (r < par.min) ruins.push({ tema, par, razao: r });
  }
  return ruins;
}
