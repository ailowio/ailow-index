import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// V07 · 2026-11-20 · ADR 007 item 5: a página de entrevistas virou /na-tv (/pedro/entrevistas responde 301).
// As garantias deste arquivo seguem valendo na rota nova; mudou só o que a V07 mudou de propósito (marcado abaixo).
const TEMAS = ["escuro", "claro"] as const;
const ROTA = "/na-tv";
const BLOQUEADOS = /cl[aá]udia|buhamra|viviane|bastos/i;

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

    // V07: as fotos saíram (traziam logo/tarja da emissora; o plano da V07 pede "sem marca de emissora").
    test("3 cartões, cada um com prova no feed", async ({ page }) => {
      const cartoes = page.locator(".degrau-tv");
      await expect(cartoes).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        const c = cartoes.nth(i);
        await expect(c.locator("a[href^='/pedro/#pr-']")).toHaveCount(1);
      }
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

    // F0 (2026-11-20, decisão do Pedro): indexável.
    test("não está em construção, é indexável e não cita entrevistador", async ({ page }) => {
      await expect(page.locator("body")).not.toContainText("Em construção");
      await expect(page.locator("meta[name=robots]")).toHaveCount(0);
      const html = await page.content();
      expect(html).not.toMatch(BLOQUEADOS);
    });

    // V07: /na-tv é rota de primeiro nível (ADR 007 item 5); o pai é a home.
    test("a seta Voltar leva ao início", async ({ page }) => {
      await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/");
    });
  });
}

test("o link de prova abre o cartão do feed", async ({ page }) => {
  await page.goto(ROTA);
  // V07: o link usa a forma canônica /pedro/#pr-NNN (como /consultoria e /educacao).
  await page.locator(".degrau-tv a[href='/pedro/#pr-012']").click();
  await expect(page).toHaveURL(/\/pedro\/?#pr-012$/);
  await expect(page.locator("#pr-012")).toHaveCount(1);
});

test("zero requisição a terceiros em /na-tv", async ({ page, baseURL }) => {
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
