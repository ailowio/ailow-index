import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TEMAS = ["escuro", "claro"] as const;
const ROTA = "/apresentacao";
const SAUDACAO = "Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição.";

for (const tema of TEMAS) {
  test.describe(`${ROTA} (${tema})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("ailow-tema", t);
        } catch {}
      }, tema);
      await page.goto(ROTA);
      await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
      await page.evaluate(() => document.fonts.ready);
    });

    test("saudação visível, 5 links internos, sem scroll horizontal", async ({ page }) => {
      await expect(page.getByText(SAUDACAO, { exact: true })).toBeVisible();
      for (const h of ["/pedro", "/pedro/entrevistas", "/sobre", "/pulse", "/cloud"]) {
        await expect(page.locator(`.caminho a[href='${h}']`)).toHaveCount(1);
      }
      const m = await page.evaluate(() => {
        const c = document.querySelector(".conteudo") as HTMLElement;
        return {
          w: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          conteudoW: c.scrollWidth,
          conteudoCW: c.clientWidth,
        };
      });
      expect(m.w).toBeLessThanOrEqual(m.cw);
      expect(m.conteudoW).toBeLessThanOrEqual(m.conteudoCW);
    });

    test("a página rola (conteúdo mais alto que a janela ou rola sem erro)", async ({ page }) => {
      const r = await page.evaluate(() => {
        const c = document.querySelector(".conteudo") as HTMLElement;
        c.scrollTop = 100000;
        return { overflow: getComputedStyle(c).overflowY };
      });
      expect(["auto", "scroll"]).toContain(r.overflow);
    });

    test("contatos com alvo de 48 px e rótulo", async ({ page }) => {
      const links = page.locator(".contatos a");
      await expect(links).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        const l = links.nth(i);
        await expect(l).toHaveAttribute("aria-label", /.+/);
        const b = await l.boundingBox();
        expect(b?.width).toBeGreaterThanOrEqual(47.5);
        expect(b?.height).toBeGreaterThanOrEqual(47.5);
      }
    });

    test("axe sem violações com o dialog fechado e aberto", async ({ page }) => {
      let r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      await page.locator("#avatar-gatilho").click();
      await expect(page.locator("#avatar-dialogo")).toBeVisible();
      r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });

    test("avatar abre por toque, Esc fecha e o foco volta ao gatilho", async ({ page }) => {
      const gatilho = page.locator("#avatar-gatilho");
      const dialogo = page.locator("#avatar-dialogo");
      await gatilho.click();
      await expect(dialogo).toBeVisible();
      const img = dialogo.locator("img");
      await expect.poll(() => img.evaluate((e) => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(dialogo).toContainText("Pedro Fernandes");
      await expect(dialogo).toContainText("Produtos Digitais e Operações");
      const fechar = dialogo.locator("[data-fechar]");
      await expect(fechar).toHaveAttribute("aria-label", /.+/);
      const b = await fechar.boundingBox();
      expect(b?.width).toBeGreaterThanOrEqual(47.5);
      expect(b?.height).toBeGreaterThanOrEqual(47.5);
      await page.keyboard.press("Escape");
      await expect(dialogo).toBeHidden();
      await expect(gatilho).toBeFocused();
    });

    test("avatar abre por teclado (Enter), foco preso no dialog, botão fechar devolve o foco", async ({ page }) => {
      const gatilho = page.locator("#avatar-gatilho");
      const dialogo = page.locator("#avatar-dialogo");
      await gatilho.focus();
      await page.keyboard.press("Enter");
      await expect(dialogo).toBeVisible();
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Tab");
        const dentro = await page.evaluate(() => !!document.activeElement?.closest("#avatar-dialogo"));
        expect(dentro).toBe(true);
      }
      await dialogo.locator("[data-fechar]").click();
      await expect(dialogo).toBeHidden();
      await expect(gatilho).toBeFocused();
    });
  });
}

test("zero requisição a terceiros e nenhuma mídia de vídeo no carregamento", async ({ page, baseURL }) => {
  const origem = new URL(baseURL ?? "http://localhost").origin;
  const externas: string[] = [];
  const videos: string[] = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.startsWith("data:") || u.startsWith("blob:")) return;
    if (new URL(u).origin !== origem) externas.push(u);
    if (/\.(mp4|webm)(\?|$)/i.test(u) || req.resourceType() === "media") videos.push(u);
  });
  await page.goto(ROTA);
  await page.waitForLoadState("networkidle");
  expect(externas).toEqual([]);
  expect(videos).toEqual([]);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/em breve|a produzir|em construção/i);
  const hrefs = await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => new URL((a as HTMLAnchorElement).href).hostname));
  expect(hrefs.sort()).toEqual(["github.com", "www.instagram.com", "www.linkedin.com"]);
});

test("é noindex", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
});
