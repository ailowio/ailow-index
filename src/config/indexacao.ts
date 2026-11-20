/**
 * Indexação (F0, 2026-11-20). As rotas públicas entram no Google e no sitemap.
 * Ficam fora (noindex, passado pela própria página): versões do site, /bio (página de campanha do Instagram),
 * as labels do feed (páginas finas) e a rota escondida do cartão.
 * Um E2E confere que as páginas sem noindex do dist são exatamente esta lista.
 */
import { carregarFluxos } from "../fluxos/carregar";
import { SITE } from "./site";

const ROTAS_FIXAS = [
  "/",
  "/sobre/",
  "/pulse/",
  "/cloud/",
  "/pedro/",
  "/pedro/entrevistas/",
  "/pedro/stack/",
  "/apresentacao/",
] as const;

/** F5: o Explorador (índice + uma página por fluxo) também é público e indexável. */
export const ROTAS_INDEXAVEIS: readonly string[] = [
  ...ROTAS_FIXAS,
  "/explorar/",
  ...carregarFluxos().map((f) => `/explorar/${f.slug}/`),
];

/** URL absoluta no domínio do site, sempre com barra final (o build gera diretórios). */
export function urlCanonica(caminho: string): string {
  const p = caminho.endsWith("/") ? caminho : `${caminho}/`;
  return `${SITE.url}${p}`;
}

export function sitemapXml(): string {
  const urls = ROTAS_INDEXAVEIS.map((r) => `  <url><loc>${urlCanonica(r)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
}
