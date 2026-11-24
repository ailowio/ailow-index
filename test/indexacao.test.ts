import { describe, expect, it } from "vitest";
import { ROTAS_INDEXAVEIS, robotsTxt, sitemapXml, urlCanonica } from "../src/config/indexacao";
import { SITE } from "../src/config/site";

// F0 (2026-11-20): o site sai do noindex global. Indexa as rotas públicas; ficam fora o cartão,
// as versões, o /bio (página de campanha) e as 87 labels (páginas finas).
describe("indexação (F0)", () => {
  // F5 (2026-11-20): o Explorador entra como rota pública (índice + 5 fluxos), em ordem do mais simples ao mais complexo.
  it("as rotas indexáveis são as públicas, com barra final e sem rota escondida ou fina", () => {
    expect([...ROTAS_INDEXAVEIS]).toEqual([
      "/",
      "/sobre/",
      "/pulse/",
      "/cloud/",
      "/pedro/",
      // V07 · 2026-11-20 · ADR 007 item 5: /pedro/entrevistas virou 301 para /na-tv e sai daqui.
      "/pedro/stack/",
      "/apresentacao/",
      // V03 · 2026-11-20 · ADR 007 item 5: /consultoria ganha conteúdo e sai do noindex do placeholder da V02.
      "/consultoria/",
      // V04 · 2026-11-20 · ADR 007 item 5: /educacao ganha conteúdo e sai do noindex do placeholder da V02.
      "/educacao/",
      // V07 · 2026-11-20 · ADR 007 item 5: /na-tv entra no lugar de /pedro/entrevistas.
      "/na-tv/",
      // V08 · 2026-11-20 · ADR 007 item 5: /chao-de-fabrica entra (rota nova da série).
      "/chao-de-fabrica/",
      // V12 · 2026-11-20 · ADR 007 item 5: /vem-ai entra (rota nova do quadro).
      "/vem-ai/",
      // V18 · 2026-11-23 · pedido do Pedro: /trajetoria entra (rota nova da linha do tempo).
      "/trajetoria/",
      // V14 · 2026-11-20 · ADR 007 item 5: IA no seu negócio entra (o índice e uma página por setor).
      "/ia-no-seu-negocio/",
      "/ia-no-seu-negocio/grafica/",
      "/ia-no-seu-negocio/textil/",
      "/ia-no-seu-negocio/comercio/",
      "/ia-no-seu-negocio/servico/",
      "/explorar/",
      "/explorar/transcritor-de-audio/",
      "/explorar/agente-producao-teares/",
      "/explorar/gateway-producao-teares/",
      "/explorar/pcp-no-asana/",
      "/explorar/lina-atendimento-whatsapp/",
      // V13 · 2026-11-20 · ADR 007 item 5 e ADR 008 (revisão das fotos estáticas): as 2 fotos do Explorador entram.
      "/explorar/quadro-de-comando/",
      "/explorar/caixa-do-gateway/",
    ]);
    for (const r of ROTAS_INDEXAVEIS) {
      expect(r).not.toMatch(/versoes|label|bio|cart/);
    }
  });

  it("a URL canônica é absoluta no domínio do site e sempre termina em barra", () => {
    expect(urlCanonica("/")).toBe(`${SITE.url}/`);
    expect(urlCanonica("/pedro")).toBe(`${SITE.url}/pedro/`);
    expect(urlCanonica("/pedro/")).toBe(`${SITE.url}/pedro/`);
    expect(urlCanonica("/pedro/entrevistas")).toBe(`${SITE.url}/pedro/entrevistas/`);
  });

  it("o sitemap lista cada rota indexável uma vez, em URL absoluta", () => {
    const xml = sitemapXml();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(ROTAS_INDEXAVEIS.map((r) => urlCanonica(r)));
  });

  it("o robots.txt libera o site e aponta o sitemap", () => {
    const txt = robotsTxt();
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Allow: /");
    expect(txt).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
    expect(txt).not.toMatch(/Disallow:\s*\/\S/);
  });

  it("canário: uma rota de label no sitemap seria pega pela regra", () => {
    expect("/pedro/label/react/").toMatch(/versoes|label|bio|cart/);
  });
});
