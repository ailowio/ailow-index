import type { EntradaComNovidades, LinhaPainel } from "./regras";
import { lerTitulo } from "./regras";
import type { Catalogos, Categoria } from "./tipos";

/** Nome de exibição de cada categoria do catálogo de ferramentas (painel "Ferramentas"). */
export const NOMES_CATEGORIA: Record<Categoria, string> = {
  front: "Front-end",
  back: "Back-end",
  dados: "Dados",
  infra: "Infraestrutura",
  qualidade: "Qualidade e entrega",
  iot: "IoT e firmware",
  "automacao-ia": "Automação e IA",
  integracoes: "Integrações",
  video: "Vídeo e design",
  gestao: "Gestão e documentação",
};

export interface Label {
  /** Parte final da rota: /pedro/label/<slug>. Ferramenta = id; escopo = "escopo-<id>" (o id "n8n" existe nos dois). */
  slug: string;
  tipo: "ferramenta" | "escopo";
  id: string;
  nome: string;
  /** Entradas da label, da mais recente para a mais antiga. */
  prs: EntradaComNovidades[];
  total: number;
  /** Número da entrada mais antiga da label ("desde #NNN"). */
  desde: number;
}

export const rotuloNumero = (n: number) => `#${String(n).padStart(3, "0")}`;

const decrescente = (prs: EntradaComNovidades[]) => [...prs].sort((a, b) => b.numero - a.numero);

function montar(
  tipo: Label["tipo"],
  id: string,
  nome: string,
  prs: EntradaComNovidades[],
): Label | null {
  if (prs.length === 0) return null;
  const ordenadas = decrescente(prs);
  const ultima = ordenadas[ordenadas.length - 1] as EntradaComNovidades;
  return {
    slug: tipo === "escopo" ? `escopo-${id}` : id,
    tipo,
    id,
    nome,
    prs: ordenadas,
    total: ordenadas.length,
    desde: ultima.numero,
  };
}

/**
 * Uma label por ferramenta e por escopo que tenha pelo menos uma entrada publicada.
 * Ferramenta sem PR e escopo sem PR não geram página.
 */
export function labelsDoFeed(prs: EntradaComNovidades[], catalogos: Catalogos): Label[] {
  const labels: Label[] = [];
  for (const f of catalogos.ferramentas) {
    const l = montar(
      "ferramenta",
      f.id,
      f.nome,
      prs.filter((p) => p.ferramentas.includes(f.id)),
    );
    if (l) labels.push(l);
  }
  const escopos = new Set<string>();
  for (const p of prs) {
    const t = lerTitulo(p.titulo);
    if (t) escopos.add(t.escopo);
  }
  for (const id of [...escopos].sort()) {
    const l = montar(
      "escopo",
      id,
      id,
      prs.filter((p) => lerTitulo(p.titulo)?.escopo === id),
    );
    if (l) labels.push(l);
  }
  return labels;
}

export interface GrupoPainel {
  categoria: Categoria;
  nome: string;
  linhas: LinhaPainel[];
}

/** Agrupa o painel derivado por categoria, mantendo a ordem em que o painel já vem. */
export function agruparPainel(linhas: LinhaPainel[]): GrupoPainel[] {
  const grupos = new Map<string, GrupoPainel>();
  for (const l of linhas) {
    const categoria = l.categoria as Categoria;
    let g = grupos.get(categoria);
    if (!g) {
      g = { categoria, nome: NOMES_CATEGORIA[categoria] ?? categoria, linhas: [] };
      grupos.set(categoria, g);
    }
    g.linhas.push(l);
  }
  return [...grupos.values()];
}
