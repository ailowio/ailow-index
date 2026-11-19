import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Parser do CHANGELOG.md para a página /versoes (S12e). Roda só no build.
 * Não gera HTML: devolve dados e segmentos de texto; o Astro escapa tudo (sem set:html).
 */

export interface Grupo {
  nome: string;
  itens: string[];
}

export interface Versao {
  /** "1.2.0", ou "Não publicada" para um [Unreleased] com itens. */
  versao: string;
  /** AAAA-MM-DD; null na seção não publicada. */
  data: string | null;
  /** Texto de abertura da versão (antes dos grupos), se houver. */
  resumo: string;
  grupos: Grupo[];
}

export type Segmento = { tipo: "texto" | "codigo"; valor: string };

const CABECALHO_VERSAO = /^## \[(.+?)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/;
const CABECALHO_GRUPO = /^### (.+?)\s*$/;

/** Rotas escondidas (S10: o cartão de visita): nenhuma página do dist pode citá-las. Só o nome, sem a barra. */
const ROTAS_ESCONDIDAS = ["cartao"];

function ocultarRotasEscondidas(md: string): string {
  return ROTAS_ESCONDIDAS.reduce(
    (texto, nome) => texto.replace(new RegExp(` ?\`?/${nome}/?\`?`, "g"), ""),
    md,
  );
}

export function lerChangelog(mdBruto: string): Versao[] {
  const md = ocultarRotasEscondidas(mdBruto);
  const versoes: Versao[] = [];
  let atual: Versao | null = null;
  let grupo: Grupo | null = null;
  let ultimoItem = false;

  for (const linha of md.split(/\r?\n/)) {
    const v = CABECALHO_VERSAO.exec(linha);
    if (v) {
      const naoPublicada = v[1] === "Unreleased";
      atual = { versao: naoPublicada ? "Não publicada" : v[1], data: v[2] ?? null, resumo: "", grupos: [] };
      versoes.push(atual);
      grupo = null;
      ultimoItem = false;
      continue;
    }
    if (!atual) continue; // abertura do arquivo, antes da 1a versão
    if (linha.startsWith("## ")) {
      atual = null;
      continue;
    }
    const g = CABECALHO_GRUPO.exec(linha);
    if (g) {
      grupo = atual.grupos.find((x) => x.nome === g[1]) ?? null;
      if (!grupo) {
        grupo = { nome: g[1], itens: [] };
        atual.grupos.push(grupo);
      }
      ultimoItem = false;
      continue;
    }
    const item = /^[-*] (.*)$/.exec(linha);
    if (item && grupo) {
      grupo.itens.push(item[1].trim());
      ultimoItem = true;
      continue;
    }
    if (!linha.trim()) {
      ultimoItem = false;
      continue;
    }
    if (grupo && ultimoItem && /^\s+\S/.test(linha)) {
      grupo.itens[grupo.itens.length - 1] += ` ${linha.trim()}`;
    } else if (!grupo) {
      atual.resumo = atual.resumo ? `${atual.resumo} ${linha.trim()}` : linha.trim();
    }
  }

  // [Unreleased] vazio não aparece; com itens aparece como "Não publicada".
  return versoes.filter((x) => x.data !== null || x.grupos.some((g) => g.itens.length > 0));
}

/** `código` vira segmento de código; [texto](url) vira só o texto; o resto é texto cru (o Astro escapa). */
export function segmentos(texto: string): Segmento[] {
  const saida: Segmento[] = [];
  texto.split("`").forEach((parte, i) => {
    // Crase sem par no fim: o último pedaço ímpar volta como texto.
    if (i % 2 === 1 && i < texto.split("`").length - 1) {
      if (parte) saida.push({ tipo: "codigo", valor: parte });
      return;
    }
    const limpo = i % 2 === 1 ? `\`${parte}` : parte.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    if (!limpo) return;
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.tipo === "texto") ultimo.valor += limpo;
    else saida.push({ tipo: "texto", valor: limpo });
  });
  return saida;
}

export function carregarVersoes(): Versao[] {
  // O build roda na raiz do app (npm run build / Dockerfile WORKDIR).
  return lerChangelog(readFileSync(resolve(process.cwd(), "CHANGELOG.md"), "utf8"));
}
