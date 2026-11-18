import { getCollection, render } from "astro:content";
import ferramentas from "../data/ferramentas.json";
import softSkills from "../data/soft-skills.json";
import { lintConteudo } from "./bloqueio";
import { carregarTermosLocais } from "./carregar-termos";
import { esquemaCatalogos } from "./esquemas";
import { agruparPainel, labelsDoFeed } from "./labels";
import { comNovidades, painelFerramentas, publicaveis, validarFeed } from "./regras";
import type { Catalogos, EntradaPR } from "./tipos";

async function montar() {
  const catalogos: Catalogos = esquemaCatalogos.parse({ ferramentas, softSkills });
  const colecao = await getCollection("prs");
  const entradas: EntradaPR[] = colecao.map((e) => ({
    id: e.id,
    ...e.data,
    corpo: e.body ?? "",
  }));

  const erros = validarFeed(entradas, catalogos);
  // Todas as entradas são lintadas, inclusive `pendente` e `fora`: o repositório é público.
  const termos = carregarTermosLocais();
  for (const e of entradas) {
    const texto = [e.titulo, e.corpo, JSON.stringify(e.prova)].join("\n");
    for (const m of lintConteudo(texto, termos)) {
      erros.push(`#${String(e.numero).padStart(3, "0")}: ${m}`);
    }
  }
  if (erros.length > 0) {
    throw new Error(`Feed do changelog inválido:\n- ${erros.join("\n- ")}`);
  }

  const publicadas = publicaveis(entradas);
  console.log(`[ailow-index] feed: ${entradas.length} entradas, ${publicadas.length} publicadas`);
  // Corpo em Markdown renderizado só das publicadas (o Astro cuida do HTML).
  const ids = new Set(publicadas.map((e) => e.id));
  const conteudos = new Map<string, Awaited<ReturnType<typeof render>>["Content"]>();
  for (const e of colecao) {
    if (ids.has(e.id)) conteudos.set(e.id, (await render(e)).Content);
  }
  const prs = comNovidades(publicadas);
  const painel = painelFerramentas(publicadas, catalogos);
  return {
    prs,
    painel,
    grupos: agruparPainel(painel),
    labels: labelsDoFeed(prs, catalogos),
    conteudos,
    catalogos,
  };
}

let cache: ReturnType<typeof montar> | undefined;

/** Valida e monta o feed uma vez por build. Qualquer erro derruba o build (ADR 002). */
export function carregarFeed() {
  cache ??= montar();
  return cache;
}
