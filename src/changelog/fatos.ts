// Conciliação bancada x site (ADR 006, V10). Funções puras: o CLI (`scripts/conferir-fatos.ts`) só lê arquivos.
// Roda na máquina do Pedro; o CI só a exercita com fixture sintético e nunca lê a bancada.
import type { StatusFato } from "./tipos.ts";

/**
 * `status_declarado` do claims.csv -> `status_fato` do site (PLANO §4 da bancada).
 * "Em implantação" não está na tabela do PLANO: é alias de "construindo" (decisão V10, registrada no diário).
 * O que não está aqui (Fato, A verificar, "Em produção / em andamento"...) não é comparável.
 */
const MAPA_STATUS: Record<string, StatusFato> = {
  "em producao": "uso",
  "validado em mvp": "validado",
  "em teste": "testando",
  "em desenvolvimento": "construindo",
  planejado: "proximo",
  "em implantacao": "construindo",
};

const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** "Em implantação (diretor 2026-11-06)" -> "em implantacao". */
export function statusEsperado(statusDeclarado: string): StatusFato | undefined {
  return MAPA_STATUS[semAcento(statusDeclarado.replace(/\(.*\)/, "")).trim()];
}

/** CSV com BOM, aspas, aspas escapadas ("") e quebra de linha dentro de aspas. Erro = aspas não fechadas. */
export function lerCsv(texto: string): string[][] {
  const t = texto.startsWith("﻿") ? texto.slice(1) : texto;
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  const fechaLinha = () => {
    linha.push(campo);
    campo = "";
    if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
    linha = [];
  };
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") fechaLinha();
    else if (c !== "\r") campo += c;
  }
  if (aspas) throw new Error("CSV malformado: aspas não fechadas");
  if (campo !== "" || linha.length > 0) fechaLinha();
  return linhas;
}

export interface Claim {
  id: string;
  afirmacao: string;
  statusDeclarado: string;
  /** Números das entradas citadas em `fato_site` (#NNN). */
  fatos: number[];
}

export function lerClaims(texto: string): { claims: Claim[]; temColunaFatoSite: boolean } {
  const [cab, ...corpo] = lerCsv(texto);
  if (!cab) throw new Error("CSV vazio");
  const col = (nome: string) => cab.indexOf(nome);
  for (const obrigatoria of ["id", "afirmacao", "status_declarado"]) {
    if (col(obrigatoria) < 0) throw new Error(`CSV sem a coluna ${obrigatoria}`);
  }
  const iFato = col("fato_site");
  const claims = corpo.map((l): Claim => {
    const id = l[col("id")] ?? "";
    const bruto = (iFato >= 0 ? (l[iFato] ?? "") : "").trim();
    const fatos: number[] = [];
    for (const parte of bruto.split(/[\s,;]+/).filter(Boolean)) {
      if (!/^#\d{3}$/.test(parte)) throw new Error(`fato_site inválido em ${id}: "${parte}" (use #NNN)`);
      fatos.push(Number(parte.slice(1)));
    }
    return { id, afirmacao: l[col("afirmacao")] ?? "", statusDeclarado: l[col("status_declarado")] ?? "", fatos };
  });
  return { claims, temColunaFatoSite: iFato >= 0 };
}

export interface FatoSite {
  numero: number;
  titulo: string;
  status_fato?: StatusFato;
}

/** Lê só 3 linhas do frontmatter (sem dependência de YAML); null se não for uma entrada. */
export function lerEntradaMd(md: string): FatoSite | null {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)?.[1];
  if (!fm) return null;
  const numero = Number(/^numero:\s*(\d+)/m.exec(fm)?.[1]);
  if (!numero) return null;
  const titulo = /^titulo:\s*"?(.*?)"?\s*$/m.exec(fm)?.[1] ?? "";
  const status = /^status_fato:\s*(\w+)/m.exec(fm)?.[1] as StatusFato | undefined;
  return status ? { numero, titulo, status_fato: status } : { numero, titulo };
}

export interface Item {
  claim: Claim;
  fato: number;
}
export interface Divergencia extends Item {
  esperado: StatusFato;
  site: StatusFato;
}
export interface NaoComparavel extends Item {
  motivo: string;
}
export interface SemFato {
  claim: Claim;
  sugestao?: number;
}
export interface Resultado {
  consistentes: Item[];
  divergentes: Divergencia[];
  inexistentes: Item[];
  naoComparaveis: NaoComparavel[];
  semFato: SemFato[];
}

const PARADAS = new Set(["para", "como", "com", "uma", "que", "dos", "das", "nos", "nas", "pela", "pelo", "estou", "desde"]);
const palavras = (t: string) =>
  new Set(semAcento(t).match(/[a-z0-9]{4,}/g)?.filter((p) => !PARADAS.has(p)) ?? []);

/** Só sugere quando >= 3 palavras do título (sem o prefixo tipo(escopo):) aparecem no claim e cobrem >= metade dele, com um único melhor. */
function sugerir(claim: Claim, fatos: FatoSite[]): number | undefined {
  const doClaim = palavras(claim.afirmacao);
  const placar = fatos
    .map((f) => {
      const tit = palavras(f.titulo.replace(/^[a-z]+\([a-z0-9-]+\)!?:/, ""));
      const comuns = [...tit].filter((p) => doClaim.has(p)).length;
      return { numero: f.numero, comuns, cobertura: tit.size ? comuns / tit.size : 0 };
    })
    .filter((p) => p.comuns >= 3 && p.cobertura >= 0.5)
    .sort((a, b) => b.comuns - a.comuns);
  const [melhor, segundo] = placar;
  return melhor && melhor.comuns !== segundo?.comuns ? melhor.numero : undefined;
}

export function conciliar(claims: Claim[], fatos: FatoSite[]): Resultado {
  const porNumero = new Map(fatos.map((f) => [f.numero, f]));
  const r: Resultado = { consistentes: [], divergentes: [], inexistentes: [], naoComparaveis: [], semFato: [] };
  for (const claim of claims) {
    if (claim.fatos.length === 0) {
      const sugestao = sugerir(claim, fatos);
      r.semFato.push(sugestao ? { claim, sugestao } : { claim });
      continue;
    }
    const esperado = statusEsperado(claim.statusDeclarado);
    for (const fato of claim.fatos) {
      const entrada = porNumero.get(fato);
      if (!entrada) r.inexistentes.push({ claim, fato });
      else if (!esperado)
        r.naoComparaveis.push({ claim, fato, motivo: `"${claim.statusDeclarado}" não tem verbo no PLANO §4` });
      else if (!entrada.status_fato)
        r.naoComparaveis.push({ claim, fato, motivo: "a entrada do site ainda não tem status_fato" });
      else if (entrada.status_fato === esperado) r.consistentes.push({ claim, fato });
      else r.divergentes.push({ claim, fato, esperado, site: entrada.status_fato });
    }
  }
  return r;
}

const rot = (n: number) => `#${String(n).padStart(3, "0")}`;
const curto = (t: string) => (t.length > 90 ? `${t.slice(0, 87)}...` : t);

export function relatorio(r: Resultado, meta: { origem: string; entradas: number; geradoEm: string }): string {
  const L: string[] = [
    `# Conciliação de fatos: bancada x site (${meta.geradoEm})`,
    "",
    `Origem: \`${meta.origem}\` · entradas do site lidas: ${meta.entradas} · só relata, nada foi alterado (ADR 006 item 5).`,
    "",
    `Resumo: ${r.divergentes.length} divergências · ${r.inexistentes.length} ids inexistentes · ` +
      `${r.naoComparaveis.length} não comparáveis · ${r.consistentes.length} consistentes · ${r.semFato.length} sem fato_site.`,
    "",
    `## Divergências (${r.divergentes.length})`,
    "",
  ];
  for (const d of r.divergentes)
    L.push(`- ${d.claim.id} -> ${rot(d.fato)}: a bancada declara "${d.claim.statusDeclarado}" (${d.esperado}), o site diz ${d.site}. "${curto(d.claim.afirmacao)}"`);
  L.push("", `## Ids inexistentes no site (${r.inexistentes.length})`, "");
  for (const i of r.inexistentes) L.push(`- ${i.claim.id} cita ${rot(i.fato)}, que não existe em src/content/prs/`);
  L.push("", `## Não comparáveis (${r.naoComparaveis.length})`, "");
  for (const n of r.naoComparaveis) L.push(`- ${n.claim.id} -> ${rot(n.fato)}: ${n.motivo}`);
  L.push("", `## Consistentes (${r.consistentes.length})`, "");
  for (const c of r.consistentes) L.push(`- ${c.claim.id} -> ${rot(c.fato)}`);
  L.push("", `## Sem fato_site (${r.semFato.length})`, "");
  for (const s of r.semFato)
    L.push(`- ${s.claim.id} (${s.claim.statusDeclarado}): "${curto(s.claim.afirmacao)}"${s.sugestao ? ` · sugestão: ${rot(s.sugestao)} (só sugestão, confira)` : ""}`);
  return `${L.join("\n")}\n`;
}
