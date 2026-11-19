import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const ferramentas: { categoria: string }[] = JSON.parse(
  readFileSync(new URL("../src/data/ferramentas.json", import.meta.url), "utf8"),
);

const TEMAS = ["escuro", "claro"] as const;
const ROTA = "/pedro/stack";
const TOTAL = ferramentas.length;
const CATEGORIAS = new Set(ferramentas.map((f) => f.categoria)).size;

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

    test("total exibido e itens listados = catálogo; categorias derivadas", async ({ page }) => {
      await expect(page.locator("[data-total-stack]")).toHaveText(String(TOTAL));
      await expect(page.locator("[data-total-categorias]")).toHaveText(String(CATEGORIAS));
      await expect(page.locator("li[data-ferramenta]")).toHaveCount(TOTAL);
      await expect(page.locator(".grupo-stack")).toHaveCount(CATEGORIAS);
    });

    test("com entrada tem link para a label; sem entrada, marcador e sem link", async ({ page }) => {
      const comLink = page.locator("li[data-ferramenta] a");
      expect(await comLink.count()).toBeGreaterThan(0);
      const sem = page.locator("li[data-ferramenta]", { hasText: "sem entrada no feed" });
      expect(await sem.count()).toBeGreaterThan(0);
      await expect(sem.locator("a")).toHaveCount(0);
      expect(await comLink.count() + (await sem.count())).toBe(TOTAL);
      const href = await comLink.first().getAttribute("href");
      expect(href).toMatch(/^\/pedro\/label\//);
      await expect(page.locator("li[data-ferramenta]", { hasText: /desde #\d{3}/ }).first()).toBeVisible();
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

    test("axe sem violações e noindex", async ({ page }) => {
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
    });

    test("o link 'Stack' aparece no /pedro sem abrir nada e leva à página", async ({ page }) => {
      await page.goto("/pedro");
      const link = page.locator('.perfil a[href="/pedro/stack"]');
      await expect(link).toBeVisible();
      await expect(link).toContainText(`Stack (${TOTAL})`);
      await link.click();
      await expect(page).toHaveURL(/\/pedro\/stack\/?$/);
    });
  });
}

test("aberta direto, a seta Voltar leva a /pedro", async ({ page }) => {
  await page.goto(ROTA);
  const voltar = page.locator("[data-voltar]");
  await expect(voltar).toHaveAttribute("href", "/pedro");
  await voltar.click();
  await expect(page).toHaveURL(/\/pedro\/?$/);
});

test("zero requisição a terceiros em /pedro/stack", async ({ page, baseURL }) => {
  const origem = new URL(baseURL ?? "http://localhost").origin;
  const externas: string[] = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.startsWith("data:") || u.startsWith("blob:")) return;
    if (new URL(u).origin !== origem) externas.push(u);
  });
  await page.goto(ROTA);
  await page.waitForLoadState("networkidle");
  expect(externas).toEqual([]);
  expect(await page.locator("a[href^='http']").count()).toBe(0);
});
