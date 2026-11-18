import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TEMAS = ["escuro", "claro"] as const;
const ROTAS = ["/sobre", "/pulse", "/cloud"];

for (const rota of ROTAS) {
  for (const tema of TEMAS) {
    test.describe(`${rota} (${tema})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((t) => {
          try {
            localStorage.setItem("ailow-tema", t);
          } catch {}
        }, tema);
        await page.goto(rota);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
      });

      test("sem scroll horizontal na página nem no conteúdo (L-0015)", async ({ page }) => {
        const m = await page.evaluate(() => {
          const c = document.querySelector(".conteudo") as HTMLElement | null;
          return {
            w: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            conteudoW: c?.scrollWidth ?? 0,
            conteudoCW: c?.clientWidth ?? 0,
          };
        });
        expect(m.w).toBeLessThanOrEqual(m.cw);
        expect(m.conteudoW).toBeLessThanOrEqual(m.conteudoCW);
      });

      test("axe sem violações", async ({ page }) => {
        const r = await new AxeBuilder({ page }).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      });

      test("tem prova no feed e não está em construção", async ({ page }) => {
        const links = await page.locator(".institucional a[href^='/pedro']").count();
        expect(links).toBeGreaterThanOrEqual(1);
        await expect(page.locator("body")).not.toContainText("Em construção");
        await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
      });

      test("só o Cloud aponta para fora do site", async ({ page }) => {
        const externos = await page
          .locator("a[href^='http']")
          .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
        if (rota === "/cloud") {
          expect(externos).toContain("https://cloud.ailow.com.br/");
        } else {
          expect(externos).toEqual([]);
        }
      });
    });
  }
}

test("zero requisição a terceiros em /sobre, /pulse e /cloud", async ({ page, baseURL }) => {
  const origem = new URL(baseURL ?? "http://localhost").origin;
  const externas: string[] = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.startsWith("data:") || u.startsWith("blob:")) return;
    if (new URL(u).origin !== origem) externas.push(u);
  });
  for (const rota of ROTAS) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
  }
  expect(externas).toEqual([]);
});
