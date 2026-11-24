import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { urlCanonica } from "../src/config/indexacao";
import { ADRS, GATES, REPO } from "../src/data/como-e-feito";
import { lerContagens } from "../src/data/como-e-feito-contagens";

/**
 * V16 (2026-11-24): /como-e-feito, "Como este site é feito". Os portões vêm de src/data/como-e-feito.ts (cada um
 * provado por arquivo do repositório, conferido em test/v16-como-e-feito.test.ts). Sem JS próprio, 0 terceiros.
 */

const ROTA = "/como-e-feito";
const TEMAS = ["escuro", "claro"] as const;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

test.describe("/como-e-feito: página e navegação", () => {
  test("responde 200, é indexável, tem canonical, título próprio e está no sitemap", async ({ page, request }) => {
    const r = await page.goto(ROTA);
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
    await expect(page).toHaveTitle(/^Como este site é feito: .+ \| Ailow$/);
    await expect(page.locator(".app-titulo")).toHaveText("Como é feito");
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
  });

  test("o /sobre leva à página e a seta volta ao /sobre quando aberta direto", async ({ page }) => {
    await page.goto("/sobre");
    await page.locator('.institucional a[href="/como-e-feito"]').click();
    await expect(page).toHaveURL(/\/como-e-feito\/?$/);
    await page.goto(ROTA);
    await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/sobre");
  });

  test("sem JS próprio: nenhum script externo nem módulo na página", async ({ page }) => {
    await page.goto(ROTA);
    await expect(page.locator("script[src], script[type='module']")).toHaveCount(0);
  });
});

test.describe("/como-e-feito: conteúdo", () => {
  test("os 9 portões aparecem em ordem, cada um com título, texto e link para o código", async ({ page }) => {
    await page.goto(ROTA);
    const gates = page.locator(".cf-gate");
    await expect(gates).toHaveCount(GATES.length);
    for (const [i, g] of GATES.entries()) {
      const li = gates.nth(i);
      await expect(li).toHaveAttribute("data-gate", g.id);
      await expect(li.locator("h3")).toHaveText(g.titulo);
      await expect(li.locator(".cf-links a").first()).toBeVisible();
      if (g.job) await expect(li.locator(".cf-job code")).toHaveText(g.job);
    }
    await expect(page.locator('[data-gate="lighthouse"] .cf-selo')).toHaveText("informativo");
  });

  test("os números são os lidos do repositório e os links de saída são do repositório público", async ({ page }) => {
    await page.goto(ROTA);
    const n = lerContagens();
    await expect(page.locator('[data-contagem="vitest"]')).toHaveText(String(n.arquivosVitest));
    await expect(page.locator('[data-contagem="e2e"]')).toHaveText(String(n.arquivosE2E));
    await expect(page.locator('[data-contagem="rotas"]')).toHaveText(String(n.rotasComTeto));
    const hrefs = await page.locator(".como-feito a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThanOrEqual(GATES.length + ADRS.length);
    for (const h of hrefs) expect(h.startsWith(REPO), h).toBe(true);
  });

  test("links internos do cabeçalho e do rodapé respondem 200 (a página não tem link interno quebrado)", async ({ page, request }) => {
    await page.goto(ROTA);
    const internos = await page
      .locator("a[href^='/']")
      .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href") ?? ""))]);
    for (const h of internos) {
      const r = await request.get(h.split("#")[0]);
      expect(r.status(), h).toBe(200);
    }
  });

  test("0 requisição a terceiros ao abrir a página (ADR 005)", async ({ page, baseURL }) => {
    const origem = new URL(baseURL ?? "http://127.0.0.1:4329").origin;
    const fora: string[] = [];
    page.on("request", (rq) => {
      const u = rq.url();
      if (!u.startsWith(origem) && !u.startsWith("data:") && !u.startsWith("blob:")) fora.push(u);
    });
    await page.goto(ROTA);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(fora).toEqual([]);
  });
});

test.describe("/como-e-feito: layout e acessibilidade", () => {
  for (const tema of TEMAS) {
    test(`tema ${tema}: axe sem violações graves`, async ({ page }) => {
      await comTema(page, tema);
      await page.goto(ROTA);
      await page.evaluate(() => document.fonts.ready);
      const r = await new AxeBuilder({ page }).analyze();
      const graves = r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(graves).toEqual([]);
    });

    for (const largura of [360, 1280]) {
      test(`tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner nem fica sob o rodapé`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 800 });
        await comTema(page, tema);
        await page.goto(ROTA);
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const c = document.querySelector(".conteudo") as HTMLElement;
          const caixa = c.getBoundingClientRect();
          const fora = [...c.querySelectorAll(".como-feito *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5);
            })
            .map((el) => `${el.tagName}.${el.className}`);
          c.scrollTop = c.scrollHeight;
          const ultimo = [...document.querySelectorAll(".cf-adrs a")].pop() as HTMLElement;
          const rodape = document.querySelector("footer, .rodape");
          const topoRodape = rodape ? rodape.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
          return {
            w: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            cW: c.scrollWidth,
            cCW: c.clientWidth,
            fora,
            fimUltimo: ultimo.getBoundingClientRect().bottom,
            limite: Math.min(topoRodape, caixa.bottom),
          };
        });
        expect(m.w).toBeLessThanOrEqual(m.cw);
        expect(m.cW).toBeLessThanOrEqual(m.cCW);
        expect(m.fora).toEqual([]);
        expect(m.fimUltimo).toBeLessThanOrEqual(m.limite + 0.5);
        const titulo = await page.locator(".app-titulo").evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(titulo).toBeLessThanOrEqual(0);
      });
    }
  }

  test("alvo de toque dos links de saída tem pelo menos 44 px de altura", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const baixos = await page
      .locator(".cf-links a, .cf-adrs a")
      .evaluateAll((as) => as.filter((a) => a.getBoundingClientRect().height < 44).map((a) => a.textContent));
    expect(baixos).toEqual([]);
  });
});
