import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { hashesDoDist } from "../scripts/csp.mjs";
import { linkContato } from "../src/config/contato";
import { urlCanonica } from "../src/config/indexacao";
import { ancoraPR } from "../src/data/consultoria";
import { NIVEIS, SETORES, usosDoSetor } from "../src/data/ia-no-seu-negocio";

/**
 * V14 (2026-11-20, ADR 007 itens 2, 5 e 7; brainstorm v2 §5.5 S3): IA no seu negócio. Índice com a escolha de setor
 * (links, sem JS) e uma página indexável por setor, com 3 usos em cada um dos 3 níveis da escada; cada uso com o fato
 * (#NNN ou fluxo do /explorar) e a sugestão marcada; no fim, /educacao e /consultoria + WhatsApp com a origem do setor.
 */

const TEMAS_COR = ["escuro", "claro"] as const;
const raiz = resolve(import.meta.dirname, "..");
const ROTAS = ["/ia-no-seu-negocio", ...SETORES.map((s) => `/ia-no-seu-negocio/${s.slug}`)];

async function comTema(page: Page, tema: (typeof TEMAS_COR)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

test.describe("IA no seu negócio: índice", () => {
  test("responde 200, é indexável, tem canonical e leva aos 4 setores por link", async ({ page }) => {
    const r = await page.goto("/ia-no-seu-negocio");
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica("/ia-no-seu-negocio"));
    await expect(page).toHaveTitle("IA no seu negócio: usos de IA por setor | Ailow");
    const links = page.locator(".ia-setores a");
    await expect(links.locator(".ia-setor-nome")).toHaveText(SETORES.map((s) => s.nome));
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(
      SETORES.map((s) => `/ia-no-seu-negocio/${s.slug}`),
    );
    await expect(page.locator(".ia-niveis h3")).toHaveText(NIVEIS.map((n) => n.nome));
  });

  test("escolher o setor é seguir um link (sem JavaScript também funciona)", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/ia-no-seu-negocio");
    await page.getByRole("link", { name: /Comércio/ }).click();
    await expect(page).toHaveURL(/\/ia-no-seu-negocio\/comercio\/?$/);
    await expect(page.locator(".ia-uso")).toHaveCount(9);
    await ctx.close();
  });

  test("o índice e os 4 setores estão no sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const r of ROTAS) expect(xml).toContain(`<loc>${urlCanonica(r)}</loc>`);
  });

  test("a escada da /educacao e da /consultoria leva ao índice", async ({ page }) => {
    for (const p of ["/educacao", "/consultoria"]) {
      await page.goto(p);
      const secao = page.locator("section", { has: page.locator(".escada") });
      await expect(secao.getByRole("link", { name: "Ver usos de IA para o seu setor" })).toHaveAttribute(
        "href",
        "/ia-no-seu-negocio",
      );
    }
  });
});

for (const setor of SETORES) {
  const rota = `/ia-no-seu-negocio/${setor.slug}`;

  test.describe(`IA no seu negócio: ${setor.nome}`, () => {
    test("200, indexável, título próprio; 3 níveis × 3 usos na ordem da escada", async ({ page }) => {
      const r = await page.goto(rota);
      expect(r?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(rota));
      await expect(page).toHaveTitle(`${setor.tituloPagina} | Ailow`);
      const niveis = page.locator(".ia-nivel");
      await expect(niveis).toHaveCount(3);
      const grupos = usosDoSetor(setor);
      for (const [i, g] of grupos.entries()) {
        await expect(niveis.nth(i).locator(".ia-degrau")).toHaveText(g.nivel.degrau);
        await expect(niveis.nth(i).locator(".ia-uso h3")).toHaveText(g.usos.map((u) => u.titulo));
      }
    });

    test("cada uso tem a prova (#NNN ou fluxo) e a sugestão marcada", async ({ page }) => {
      await page.goto(rota);
      const usos = page.locator(".ia-uso");
      await expect(usos).toHaveCount(9);
      for (let i = 0; i < 9; i++) {
        const u = usos.nth(i);
        expect(await u.locator(".ia-provas a").count()).toBeGreaterThan(0);
        await expect(u.locator(".ia-sugestao .ia-selo")).toHaveText(`Sugestão ${setor.noSetor}`);
      }
      // A sugestão nunca tem número (não tem prova).
      const sugestoes = await page.locator(".ia-sugestao").allTextContents();
      for (const s of sugestoes) expect(s).not.toMatch(/\d|%/);
    });

    test("os links de prova são válidos: a âncora existe no Diário de obra e o fluxo abre", async ({ page, request }) => {
      await page.goto(rota);
      const hrefs = await page.locator(".ia-provas a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
      const pedro = readFileSync(join(raiz, "dist", "pedro", "index.html"), "utf8");
      for (const h of new Set(hrefs)) {
        if (h.startsWith("/pedro/#")) {
          expect(pedro, h).toContain(`id="${h.split("#")[1]}"`);
        } else {
          expect(h).toMatch(/^\/explorar\/[a-z0-9-]+$/);
          expect((await request.get(h)).status(), h).toBe(200);
        }
      }
      const esperados = usosDoSetor(setor).flatMap((g) => g.usos.flatMap((u) => u.prs.map((n) => `/pedro/#${ancoraPR(n)}`)));
      for (const e of esperados) expect(hrefs).toContain(e);
    });

    test("termina com os dois caminhos e o WhatsApp com a origem do setor", async ({ page }) => {
      await page.goto(rota);
      const ultima = page.locator(".ia-negocio > section").last();
      await expect(ultima).toHaveClass(/ia-caminhos/);
      expect(await ultima.locator(".ia-caminho-link").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
        "/educacao",
        "/consultoria",
      ]);
      const botao = ultima.locator(".botao-acao");
      await expect(botao).toHaveCount(1);
      await expect(botao).toHaveAttribute("href", linkContato(setor.origem));
      const texto = new URL((await botao.getAttribute("href")) ?? "").searchParams.get("text") ?? "";
      expect(texto).toMatch(new RegExp(`\\[ia-no-seu-negocio · ${setor.nome.toLowerCase()}\\]$`));
    });

    test("o seletor de setor marca o atual e leva aos outros", async ({ page }) => {
      await page.goto(rota);
      const atual = page.locator('.ia-trocar a[aria-current="page"]');
      await expect(atual).toHaveText(setor.nome);
      await expect(page.locator(".ia-trocar a")).toHaveCount(SETORES.length);
    });
  });
}

test.describe("IA no seu negócio: sem terceiros, sem script, sem número sem prova", () => {
  for (const rota of ROTAS) {
    test(`${rota}: ao carregar, nenhuma requisição sai do próprio site; nenhum script próprio`, async ({ page }) => {
      const pedidos: string[] = [];
      page.on("request", (r) => pedidos.push(r.url()));
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const base = new URL(page.url()).origin;
      expect(pedidos.filter((u) => !u.startsWith(base) && !u.startsWith("data:"))).toEqual([]);
      const scripts = await page.locator("main script").evaluateAll((s) => s.map((el) => el.textContent ?? ""));
      expect(scripts.every((s) => s.includes("data-voltar")), `${scripts.length} script(s)`).toBe(true);
      const texto = (await page.locator("main").textContent()) ?? "";
      expect(texto).not.toMatch(/R\$|pre[çc]o|garantid|%/i);
    });
  }
});

test.describe("IA no seu negócio: layout, acessibilidade e movimento", () => {
  for (const rota of ROTAS) {
    for (const tema of TEMAS_COR) {
      test(`${rota}, tema ${tema}: axe limpo`, async ({ page }) => {
        await comTema(page, tema);
        await page.goto(rota);
        await page.evaluate(() => document.fonts.ready);
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
        expect(graves).toEqual([]);
      });

      for (const largura of [360, 375, 1440]) {
        test(`${rota}, tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner`, async ({ page }) => {
          await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 900 });
          await comTema(page, tema);
          await page.goto(rota);
          await page.evaluate(() => document.fonts.ready);
          const m = await page.evaluate(() => {
            const c = document.querySelector(".conteudo") as HTMLElement;
            const caixa = c.getBoundingClientRect();
            const fora = [...c.querySelectorAll("*")]
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && (r.right > caixa.right + 0.5 || r.left < caixa.left - 0.5);
              })
              .map((el) => `${el.tagName}.${(el as HTMLElement).className}`);
            return {
              doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              conteudo: c.scrollWidth - c.clientWidth,
              fora,
            };
          });
          expect(m.doc, JSON.stringify(m)).toBeLessThanOrEqual(0);
          expect(m.conteudo, JSON.stringify(m)).toBeLessThanOrEqual(0);
          expect(m.fora).toEqual([]);
        });
      }
    }
  }

  test("360x640: rolando até o fim, o WhatsApp fica inteiro acima do rodapé", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/ia-no-seu-negocio/grafica");
    const m = await page.evaluate(() => {
      const c = document.querySelector(".conteudo") as HTMLElement;
      c.scrollTop = c.scrollHeight;
      const b = (document.querySelector(".ia-caminhos .botao-acao") as HTMLElement).getBoundingClientRect();
      const caixa = c.getBoundingClientRect();
      const rodape = (document.querySelector(".rodape") as HTMLElement).getBoundingClientRect();
      return { baseBotao: b.bottom, topoBotao: b.top, topoConteudo: caixa.top, baseConteudo: caixa.bottom, topoRodape: rodape.top };
    });
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.baseConteudo);
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.topoRodape);
    expect(m.topoBotao, JSON.stringify(m)).toBeGreaterThanOrEqual(m.topoConteudo);
  });

  test("360 px: o título do cabeçalho cabe inteiro (sem reticências)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const rota of ["/ia-no-seu-negocio", "/ia-no-seu-negocio/comercio"]) {
      await page.goto(rota);
      await page.evaluate(() => document.fonts.ready);
      const m = await page.locator(".app-titulo").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
      expect(m.sw, `${rota} ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.cw);
    }
  });

  test("360 px: alvos de toque (setores, provas, seletor, caminhos) com 48 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const rota of ["/ia-no-seu-negocio", "/ia-no-seu-negocio/textil"]) {
      await page.goto(rota);
      const alturas = await page
        .locator(".ia-setor, .ia-provas a, .ia-trocar a, .ia-caminho-link, .ia-caminhos .botao-acao")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(alturas.length).toBeGreaterThan(0);
      for (const h of alturas) expect(h, rota).toBeGreaterThanOrEqual(47.5);
    }
  });

  test("movimento reduzido: nenhuma animação nem transição na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const rota of ["/ia-no-seu-negocio", "/ia-no-seu-negocio/servico"]) {
      await page.goto(rota);
      const m = await page.evaluate(() => {
        const dur = (v: string) => v.split(",").some((x) => Number.parseFloat(x) > 0.001);
        const animados = [...document.querySelectorAll("main *")].filter((el) => {
          const s = getComputedStyle(el);
          return (s.animationName !== "none" && dur(s.animationDuration)) || dur(s.transitionDuration);
        });
        const rodando = document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 1);
        return { animados: animados.map((el) => el.className), rodando: rodando.length };
      });
      expect(m, rota).toEqual({ animados: [], rodando: 0 });
    }
  });
});

test.describe("IA no seu negócio sob a CSP de produção", () => {
  const conf = readFileSync(join(raiz, "ops/web/seguranca.conf"), "utf8");
  const modelo = /add_header Content-Security-Policy "([^"]+)" always;/.exec(conf)?.[1] ?? "";
  const csp = modelo.replace("$csp_script_hashes", hashesDoDist(join(raiz, "dist")).join(" "));

  for (const rota of ["/ia-no-seu-negocio", "/ia-no-seu-negocio/comercio"]) {
    test(`${rota}: 0 violações`, async ({ page }) => {
      await page.route("**/*", async (route) => {
        if (route.request().resourceType() !== "document" || !route.request().url().startsWith("http://127.0.0.1"))
          return route.continue();
        const resposta = await route.fetch();
        await route.fulfill({ response: resposta, headers: { ...resposta.headers(), "content-security-policy": csp } });
      });
      await page.addInitScript(() => {
        const w = window as unknown as { __violacoes: string[] };
        w.__violacoes = [];
        document.addEventListener("securitypolicyviolation", (e) => w.__violacoes.push(`${e.violatedDirective} ${e.blockedURI}`));
      });
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const v = await page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
      expect(v).toEqual([]);
    });
  }
});
