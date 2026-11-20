import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { linkContato, WHATSAPP } from "../src/config/contato";
import { ROTAS_INDEXAVEIS, urlCanonica } from "../src/config/indexacao";
import { SITE } from "../src/config/site";

// F0 (trilha rápida, 2026-11-20): indexação, preview, contato, /bio, correções de fato e Voltar livre na home.

const dist = join(process.cwd(), "dist");

/** Rota de cada index.html do dist ("/", "/pedro/", ...). */
function paginasDoDist(): { rota: string; html: string }[] {
  const saida: { rota: string; html: string }[] = [];
  const andar = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) andar(p);
      else if (n === "index.html") {
        const rel = relative(dist, dir).split(sep).join("/");
        saida.push({ rota: rel ? `/${rel}/` : "/", html: readFileSync(p, "utf8") });
      }
    }
  };
  andar(dist);
  return saida;
}

const temNoindex = (html: string) => /<meta name="robots" content="[^"]*noindex/.test(html);

test.describe("indexação", () => {
  test("as páginas indexáveis do dist são exatamente as do sitemap", async ({ request }) => {
    const paginas = paginasDoDist();
    expect(paginas.length).toBeGreaterThan(90);
    const indexaveis = paginas.filter((p) => !temNoindex(p.html)).map((p) => p.rota).sort();
    expect(indexaveis).toEqual([...ROTAS_INDEXAVEIS].sort());

    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    expect(locs).toEqual(indexaveis.map((r) => urlCanonica(r)).sort());
  });

  test("ficam fora do Google: versões, /bio e as labels", async () => {
    const fora = paginasDoDist().filter((p) => temNoindex(p.html)).map((p) => p.rota);
    expect(fora).toContain("/versoes/");
    expect(fora).toContain("/bio/");
    expect(fora.filter((r) => r.startsWith("/pedro/label/")).length).toBeGreaterThanOrEqual(80);
  });

  test("robots.txt e sitemap.xml respondem 200", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
  });

  test("toda página indexável tem canonical absoluto para ela mesma", async ({ page }) => {
    for (const rota of ROTAS_INDEXAVEIS) {
      await page.goto(rota);
      await expect(page.locator('link[rel="canonical"]'), rota).toHaveAttribute("href", urlCanonica(rota));
    }
  });

  test("títulos sem repetição: nenhuma página indexável repete o título de outra nem diz 'Ailow | Ailow'", async () => {
    const titulos = paginasDoDist()
      .filter((p) => !temNoindex(p.html))
      .map((p) => /<title>([^<]*)<\/title>/.exec(p.html)?.[1] ?? "");
    for (const t of titulos) expect(t).not.toBe("Ailow | Ailow");
    expect(new Set(titulos).size).toBe(titulos.length);
  });
});

test.describe("preview (Open Graph)", () => {
  for (const rota of ["/", "/apresentacao", "/bio"]) {
    test(`${rota} tem título, descrição, imagem e URL do preview`, async ({ page }) => {
      await page.goto(rota);
      const meta = (p: string) => page.locator(`meta[property="${p}"]`);
      await expect(meta("og:title")).toHaveAttribute("content", /\S/);
      await expect(meta("og:description")).toHaveAttribute("content", /\S/);
      await expect(meta("og:image")).toHaveAttribute("content", `${SITE.url}/og/ailow.png`);
      await expect(meta("og:image:width")).toHaveAttribute("content", "1200");
      await expect(meta("og:image:height")).toHaveAttribute("content", "630");
      await expect(meta("og:locale")).toHaveAttribute("content", "pt_BR");
      await expect(meta("og:url")).toHaveAttribute("content", urlCanonica(rota));
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    });
  }

  test("a imagem do preview é servida pelo próprio site", async ({ request }) => {
    const r = await request.get("/og/ailow.png");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("contato por WhatsApp", () => {
  const casos = [
    { rota: "/", origem: "site" as const },
    { rota: "/apresentacao", origem: "apresentacao" as const },
    { rota: "/bio", origem: "instagram" as const },
  ];
  for (const { rota, origem } of casos) {
    test(`${rota}: botão "Falar no WhatsApp" com o número e a mensagem de origem certos, alvo ≥ 48 px`, async ({ page }) => {
      await page.goto(rota);
      const botao = page.getByRole("link", { name: /Falar no WhatsApp/ });
      await expect(botao).toHaveCount(1);
      await expect(botao).toHaveAttribute("href", linkContato(origem));
      expect(await botao.getAttribute("href")).toContain(`wa.me/${WHATSAPP}`);
      const caixa = await botao.boundingBox();
      expect(caixa?.height).toBeGreaterThanOrEqual(48);
      await expect(botao).toBeInViewport();
    });
  }

  test("o e-mail não é publicado enquanto o domínio não recebe e-mail (sem MX em 2026-11-20)", async () => {
    for (const p of paginasDoDist()) expect(p.html, p.rota).not.toContain("mailto:");
  });
});

test.describe("apresentação e /bio", () => {
  for (const rota of ["/apresentacao", "/bio"]) {
    test(`${rota}: quem é o Pedro aparece sem abrir a foto`, async ({ page }) => {
      await page.goto(rota);
      const bio = page.locator(".quem-sou");
      await expect(bio).toBeVisible();
      await expect(bio).toContainText("Produtos Digitais e Operações");
      await expect(bio).toContainText("chão de fábrica");
    });

    test(`${rota}: axe sem violação serious ou critical`, async ({ page }) => {
      await page.goto(rota);
      const r = await new AxeBuilder({ page }).analyze();
      const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(graves.map((v) => v.id)).toEqual([]);
    });
  }
});

test.describe("home", () => {
  // A frase e o botão da F0 aumentaram o topo; o teste antigo (fim do ícone ≤ altura da janela) não via o rodapé
  // cobrindo a 2ª fileira. Aqui: todo ícone e rótulo inteiro dentro da área visível do conteúdo e acima do rodapé.
  // V02 · 2026-11-20 · ADR 007: a grade desceu para baixo das portas (o topo agora é medido em v02-home.e2e.ts).
  // O critério daqui continua igual, depois de rolar o conteúdo até a grade: ícones inteiros e acima do rodapé.
  test("em 360x640, os 6 ícones e rótulos ficam inteiros, visíveis e acima do rodapé", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    await page.waitForTimeout(700);
    await page.locator("li:last-child a.app").scrollIntoViewIfNeeded();
    const m = await page.evaluate(() => {
      const conteudo = (document.querySelector(".conteudo") as HTMLElement).getBoundingClientRect();
      const rodape = document.querySelector(".rodape")?.getBoundingClientRect();
      const apps = [...document.querySelectorAll("a.app")].map((a) => a.getBoundingClientRect().bottom);
      return { maiorBase: Math.max(...apps), limiteConteudo: conteudo.bottom, topoRodape: rodape?.top ?? Infinity };
    });
    expect(m.maiorBase, JSON.stringify(m)).toBeLessThanOrEqual(m.limiteConteudo);
    expect(m.maiorBase, JSON.stringify(m)).toBeLessThanOrEqual(m.topoRodape);
  });

  // No desktop a home é uma moldura de celular: o mesmo critério vale dentro dela.
  // V02 · 2026-11-20 · ADR 007: idem na moldura do desktop (rola o conteúdo até a grade antes de medir).
  test("em 1280x800 (moldura), os 6 ícones e rótulos ficam inteiros e acima do rodapé", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForTimeout(700);
    await page.locator("li:last-child a.app").scrollIntoViewIfNeeded();
    const m = await page.evaluate(() => {
      const conteudo = (document.querySelector(".conteudo") as HTMLElement).getBoundingClientRect();
      const rodape = document.querySelector(".rodape")?.getBoundingClientRect();
      const apps = [...document.querySelectorAll("a.app")].map((a) => a.getBoundingClientRect().bottom);
      return { maiorBase: Math.max(...apps), limiteConteudo: conteudo.bottom, topoRodape: rodape?.top ?? Infinity };
    });
    expect(m.maiorBase, JSON.stringify(m)).toBeLessThanOrEqual(m.limiteConteudo);
    expect(m.maiorBase, JSON.stringify(m)).toBeLessThanOrEqual(m.topoRodape);
  });

  test("diz o que o Pedro faz no título principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Digitalizei e sensorizei a minha fábrica");
    await expect(page.locator(".home")).toContainText("consultoria");
    await expect(page.locator(".home")).toContainText("cursos de IA");
  });

  test("o Voltar do navegador sai da home para a página de onde a pessoa veio", async ({ page }) => {
    await page.goto("/pulse");
    await page.goto("/");
    await page.mouse.click(5, 5);
    await page.goBack();
    await expect(page).toHaveURL(/\/pulse\/?$/);
  });

  test("a home não carrega mais a trava do Voltar", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain("popstate");
  });
});

test.describe("correções de fato", () => {
  test("/pedro: sócio da Copel desde mai/2015", async ({ page }) => {
    await page.goto("/pedro");
    await expect(page.locator("body")).toContainText("mai/2015");
    await expect(page.locator("body")).not.toContainText("jan/2015");
  });

  test("/sobre não promete alertas e dashboards que o Pulse ainda não tem", async ({ page }) => {
    await page.goto("/sobre");
    await expect(page.locator("body")).not.toContainText("alertas e dashboards");
  });

  // V11 · 2026-11-20 · ok do orquestrador (X9, colheita de IoT §7): a implantação está em andamento, não em "todas as máquinas".
  test("/pulse diz o estado real: implantação em andamento, dois gateways, v1.9 em validação", async ({ page }) => {
    await page.goto("/pulse");
    const corpo = page.locator("body");
    await expect(corpo).not.toContainText("ainda sem validação com os sensores em campo");
    await expect(corpo).not.toContainText("todas as máquinas");
    await expect(corpo).toContainText("em andamento");
    await expect(corpo).toContainText("dois gateways");
    await expect(corpo).toContainText("v1.9");
  });
});
