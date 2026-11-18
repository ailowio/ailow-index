/**
 * Fonte única do cartão de visita (S10, R4). Rota escondida: sem link em nenhuma página.
 *
 * Como plugar o PDF: copie o arquivo para public/cartao/ e acrescente em `material`
 * `{ nome: "Apresentação", caminho: "/cartao/apresentacao.pdf", tipo: "application/pdf" }`.
 * Enquanto `material` for vazio, o botão Compartilhar envia só o link da apresentação.
 */
import { SITE } from "../config/site";
import { apresentacao } from "./apresentacao";

export interface Material {
  nome: string;
  caminho: string;
  tipo: string;
}

export const cartao: { titulo: string; material: Material[] } = {
  titulo: "Cartão de visita",
  material: [],
};

export const URL_APRESENTACAO = `${SITE.url}/apresentacao`;

/**
 * Número digitado -> dígitos no formato internacional, ou null se inválido.
 * `+` inicial ou `00` inicial = código do país já digitado; `0` inicial (DDD) é removido;
 * 10 ou 11 dígitos sem país ganham `55`; 12 ou 13 dígitos começando em `55` já são completos.
 */
export function normalizarNumero(entrada: string): string | null {
  const t = entrada.replace(/[\s().-]/g, "");
  if (t === "") return null;
  const internacional = t.startsWith("+");
  const corpo = internacional ? t.slice(1) : t;
  if (!/^\d+$/.test(corpo)) return null;
  const ok = (d: string) => d.length >= 10 && d.length <= 15;

  if (internacional) return ok(corpo) ? corpo : null;
  if (corpo.startsWith("00")) {
    const d = corpo.slice(2);
    return ok(d) ? d : null;
  }
  const d = corpo.startsWith("0") ? corpo.slice(1) : corpo;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

export function textoWhatsapp(): string {
  return `${apresentacao.saudacao} ${URL_APRESENTACAO}`;
}

export function urlWhatsapp(numero: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(textoWhatsapp())}`;
}

export type RamoCompartilhar = "arquivos" | "url" | "link";

/** arquivos: share com files; url: share com título/texto/url; link: sem Web Share (só o link visível). */
export function ramoCompartilhar(o: { material: Material[]; podeArquivos: boolean; temShare: boolean }): RamoCompartilhar {
  if (!o.temShare) return "link";
  return o.material.length > 0 && o.podeArquivos ? "arquivos" : "url";
}
