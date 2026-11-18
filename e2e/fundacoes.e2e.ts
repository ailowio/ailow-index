import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { LOGO_ASSINATURA, LOGO_PATHS, assinaturaDaLogo } from "../src/config/logo";

const TEMAS = ["escuro", "claro"] as const;
// Rotas do site que existem como página. Cada sessão de conteúdo acrescenta a sua aqui.
const ROTAS = ["/"];

/** Fixa a escolha de tema antes de qualquer script da página (como se o usuário já tivesse escolhido). */
async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

for (const rota of ROTAS) {
  for (const tema of TEMAS) {
    test.describe(`${rota} no tema ${tema}`, () => {
      test.beforeEach(async ({ page }) => {
        await comTema(page, tema);
        await page.goto(rota);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        await page.evaluate(() => document.fonts.ready);
      });

      test("sem scroll horizontal (scrollWidth <= clientWidth)", async ({ page }) => {
        const m = await page.evaluate(() => ({
          htmlScroll: document.documentElement.scrollWidth,
          htmlClient: document.documentElement.clientWidth,
          bodyScroll: document.body.scrollWidth,
          bodyClient: document.body.clientWidth,
        }));
        expect(m.htmlScroll, JSON.stringify(m)).toBeLessThanOrEqual(m.htmlClient);
        expect(m.bodyScroll, JSON.stringify(m)).toBeLessThanOrEqual(m.bodyClient);
      });

      test("axe sem violação serious ou critical", async ({ page }) => {
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([]);
      });

      test("botão de tema tem alvo de toque de 48 px e foco visível", async ({ page }) => {
        const botao = page.getByRole("button", { name: "Tema claro" });
        const caixa = await botao.boundingBox();
        expect(caixa?.width).toBeGreaterThanOrEqual(48);
        expect(caixa?.height).toBeGreaterThanOrEqual(48);
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await expect(botao).toBeFocused();
        const contorno = await botao.evaluate((el) => getComputedStyle(el).outlineStyle);
        expect(contorno).toBe("solid");
      });
    });
  }
}

test("zero requisição para fora da origem", async ({ page, baseURL }) => {
  const origem = new URL(baseURL as string).origin;
  const externas: string[] = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.protocol === "data:" || u.protocol === "blob:") return;
    if (u.origin !== origem) externas.push(req.url());
  });
  for (const rota of ROTAS) {
    await page.goto(rota, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
  }
  expect(externas).toEqual([]);
});

test("as fontes do Pulso vêm da própria origem e carregam", async ({ page }) => {
  const fontes: string[] = [];
  page.on("response", (res) => {
    if (/\.woff2?$/.test(new URL(res.url()).pathname)) fontes.push(res.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const usadas = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
  );
  expect(usadas.join(" ")).toMatch(/Barlow/);
  expect(fontes.length).toBeGreaterThan(0);
});

test("tema persiste após recarregar (1 toque troca e grava)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
  const botao = page.getByRole("button", { name: "Tema claro" });
  await expect(botao).toHaveAttribute("aria-pressed", "false");
  await botao.click();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
  await expect(botao).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
  await expect(botao).toHaveAttribute("aria-pressed", "true");
  await botao.click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
});

test("sem escolha salva, o tema segue o sistema", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
});

test("sem flash: o tema já está definido antes da primeira pintura", async ({ page }) => {
  await comTema(page, "claro");
  await page.goto("/", { waitUntil: "commit" });
  // O script do <head> é síncrono: no DOMContentLoaded o atributo já é o da escolha.
  await page.waitForLoadState("domcontentloaded");
  const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fundo).toBe("rgb(238, 238, 235)");
});

test("funciona com localStorage bloqueado (try/catch)", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("bloqueado");
      },
    });
  });
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-tema", /^(escuro|claro)$/);
  await page.getByRole("button", { name: "Tema claro" }).click();
  expect(erros).toEqual([]);
});

test("a logo servida é a oficial (5 paths, mesma assinatura) e pinta com a cor do tema", async ({
  page,
  request,
}) => {
  const res = await request.get("/logo.svg");
  expect(res.ok()).toBe(true);
  const a = assinaturaDaLogo(await res.text());
  expect(a.paths).toBe(LOGO_PATHS);
  expect(a.hash).toBe(LOGO_ASSINATURA);

  await comTema(page, "claro");
  await page.goto("/");
  const claro = await page
    .locator(".logo")
    .evaluate((el) => ({ cor: getComputedStyle(el).backgroundColor, mascara: getComputedStyle(el).maskImage }));
  expect(claro.mascara).toContain("/logo.svg");
  expect(claro.cor).toBe("rgb(6, 114, 132)");
  await page.getByRole("button", { name: "Tema claro" }).click();
  const escuro = await page.locator(".logo").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(escuro).toBe("rgb(7, 189, 213)");
});

test("a transição entre páginas usa @view-transition e respeita movimento reduzido", async ({ page }) => {
  await page.goto("/");
  const regra = await page.evaluate(() =>
    [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join("\n"),
  );
  expect(regra).toMatch(/@view-transition/);
  expect(regra).toMatch(/prefers-reduced-motion/);
});
