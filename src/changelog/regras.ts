import { type Catalogos, ESCOPOS, type EntradaPR, type Escopo, TIPOS, type Tipo } from "./tipos";

export interface Titulo {
  tipo: Tipo;
  escopo: Escopo;
  quebra: boolean;
  descricao: string;
}

const PADRAO_TITULO = /^([a-z]+)\(([a-z0-9-]+)\)(!)?: (\S.*)$/;

/** Lê "tipo(escopo)!: descrição". Devolve null se o tipo ou o escopo não forem do feed. */
export function lerTitulo(titulo: string): Titulo | null {
  const m = PADRAO_TITULO.exec(titulo);
  if (!m) return null;
  const [, tipo = "", escopo = "", quebra, descricao = ""] = m;
  if (!(TIPOS as readonly string[]).includes(tipo)) return null;
  if (!(ESCOPOS as readonly string[]).includes(escopo)) return null;
  return { tipo: tipo as Tipo, escopo: escopo as Escopo, quebra: quebra === "!", descricao };
}

const rotulo = (n: number) => `#${String(n).padStart(3, "0")}`;

/** "2025" ordena antes de "2025-01". */
const chaveData = (data: string) => (data.length === 4 ? `${data}-00` : data);

/**
 * Regras do feed inteiro (inclui entradas não publicadas: a numeração é global e append-only).
 * Devolve a lista de erros; vazia = feed válido.
 */
export function validarFeed(entradas: EntradaPR[], catalogos: Catalogos): string[] {
  const erros: string[] = [];
  const ferramentas = new Set(catalogos.ferramentas.map((f) => f.id));
  const skills = new Set(catalogos.softSkills.map((s) => s.id));
  const vistos = new Set<number>();

  for (const e of entradas) {
    const r = rotulo(e.numero);
    if (vistos.has(e.numero)) erros.push(`${r} duplicado`);
    vistos.add(e.numero);

    const prefixo = String(e.numero).padStart(3, "0");
    if (!e.id.startsWith(`${prefixo}-`)) {
      erros.push(`${r}: arquivo ${e.id} deveria começar com "${prefixo}-"`);
    }
    if (!lerTitulo(e.titulo)) {
      erros.push(`${r}: título fora do padrão "tipo(escopo): descrição": ${e.titulo}`);
    }
    for (const f of e.ferramentas) {
      if (!ferramentas.has(f)) erros.push(`${r}: ferramenta desconhecida: ${f}`);
    }
    for (const s of e.soft_skills) {
      if (!skills.has(s)) erros.push(`${r}: soft skill desconhecida: ${s}`);
    }
  }

  const ordenadas = [...entradas].sort((a, b) => a.numero - b.numero);
  for (let i = 1; i < ordenadas.length; i++) {
    const antes = ordenadas[i - 1];
    const agora = ordenadas[i];
    if (antes && agora && chaveData(agora.data) < chaveData(antes.data)) {
      erros.push(
        `${rotulo(agora.numero)} (${agora.data}) é anterior a ${rotulo(antes.numero)} (${antes.data})`,
      );
    }
  }
  return erros;
}

/** Só `confirmado` vai para o site, em ordem de número. */
export function publicaveis(entradas: EntradaPR[]): EntradaPR[] {
  return entradas
    .filter((e) => e.verificacao === "confirmado")
    .sort((a, b) => a.numero - b.numero);
}

export type EntradaComNovidades = EntradaPR & { novas: string[] };

/** `novas` = ferramentas que aparecem pela 1ª vez no feed publicado (o "+ ferramenta" do PR). */
export function comNovidades(publicadas: EntradaPR[]): EntradaComNovidades[] {
  const vistas = new Set<string>();
  return publicadas.map((e) => {
    const novas = e.ferramentas.filter((f) => !vistas.has(f));
    for (const f of novas) vistas.add(f);
    return { ...e, novas };
  });
}

export interface LinhaPainel {
  id: string;
  nome: string;
  categoria: string;
  principal: boolean;
  prs: number;
  desde: number;
}

/** Ferramentas usadas no feed publicado, por categoria (ordem do catálogo) e por uso. */
export function painelFerramentas(publicadas: EntradaPR[], catalogos: Catalogos): LinhaPainel[] {
  const uso = new Map<string, { prs: number; desde: number }>();
  for (const e of publicadas) {
    for (const f of new Set(e.ferramentas)) {
      const atual = uso.get(f);
      if (atual) atual.prs += 1;
      else uso.set(f, { prs: 1, desde: e.numero });
    }
  }
  const ordemCategoria = new Map<string, number>();
  for (const f of catalogos.ferramentas) {
    if (!ordemCategoria.has(f.categoria)) ordemCategoria.set(f.categoria, ordemCategoria.size);
  }
  return catalogos.ferramentas
    .filter((f) => uso.has(f.id))
    .map((f) => {
      const u = uso.get(f.id) ?? { prs: 0, desde: 0 };
      return {
        id: f.id,
        nome: f.nome,
        categoria: f.categoria,
        principal: f.principal ?? false,
        prs: u.prs,
        desde: u.desde,
      };
    })
    .sort(
      (a, b) =>
        (ordemCategoria.get(a.categoria) ?? 0) - (ordemCategoria.get(b.categoria) ?? 0) ||
        b.prs - a.prs ||
        a.desde - b.desde,
    );
}
