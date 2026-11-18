/**
 * Linter do conteúdo público (dossiê de discovery §8).
 * Padrões estruturais ficam aqui (versionados). Nomes de pessoas, clientes, prospects e marcas
 * que não podem aparecer ficam numa lista LOCAL, fora do git (ver `carregarTermosLocais`),
 * porque versioná-los já seria publicá-los.
 */

const PADROES: Array<[string, RegExp]> = [
  ["endereço IPv4", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ["grafia ILO (a marca é Ailow)", /(?<![a-z])ilo(?:\.(?:com|io)\b|-?(?:cloud|pulse|index)\b)/i],
  ["número de fatura", /\bH_\d{6,}\b/],
  ["chave de API", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["token do GitHub", /\bgh[pousr]_[A-Za-z0-9]{20,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./],
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["chave AWS", /\bAKIA[0-9A-Z]{16}\b/],
  ["URL de projeto Supabase", /\b[a-z0-9]{20}\.supabase\.co\b/i],
];

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Devolve um erro por ocorrência encontrada; lista vazia = texto liberado. */
export function lintConteudo(texto: string, termosExtras: string[] = []): string[] {
  const erros: string[] = [];
  for (const [nome, re] of PADROES) {
    if (re.test(texto)) erros.push(`padrão bloqueado: ${nome}`);
  }
  const alvo = normalizar(texto);
  for (const termo of termosExtras) {
    const t = normalizar(termo.trim());
    if (!t) continue;
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escapar(t)}(?![\\p{L}\\p{N}])`, "u").test(alvo)) {
      // O termo não é repetido na mensagem: o log do CI é público.
      erros.push("termo bloqueado da lista local");
    }
  }
  return erros;
}
