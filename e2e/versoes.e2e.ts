import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const TEMAS = ["escuro", "claro"] as const;
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
// Contagem derivada do arquivo (não constante): cada `## [x.y.z] - data` é uma versão publicada.
const PUBLICADAS = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\s*$/gm)].map((m) => m[1]);

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

for (const tema of TEMAS) {
  test.describe(`logo amarela e versão no rodapé (${tema})`, () => {
    test.beforeEach(async ({ page }) => {
      await comTema(page, tema);
    });

    test("o logo do cabeçalho é canário (amarelo) e, no claro, fica sobre a pastilha grafite", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
      const logo = page.locator(".logo");
      await expect(logo).toHaveCount(1);
      expect(await logo.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 196, 0)");
      const pastilha = await logo.evaluate((el) => {
        const p = el.parentElement as HTMLElement;
        const cs = getComputedStyle(p);
        return { cls: p.className, fundo: cs.backgroundColor, raio: cs.borderTopLeftRadius };
      });
      expect(pastilha.cls).toContain("logo-pastilha");
      if (tema === "claro") {
        expect(pastilha.fundo).toBe("rgb(17, 18, 20)");
        expect(Number.parseFloat(pastilha.raio)).toBeGreaterThan(0);
      } else {
        expect(pastilha.fundo).toBe("rgb(17, 18, 20)"); // = --fundo do escuro: pastilha invisível
      }
    });

    test("a versão do rodapé é a do package.json e abre /versoes; Voltar volta ao /pedro", async ({ page }) => {
      await page.goto("/pedro");
      await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
      const link = page.locator("footer.rodape a");
      await expect(link).toHaveText(`v${pkg.version}`);
      await expect(link).toHaveAttribute("aria-label", `v${pkg.version}: ver histórico de versões`);
      await link.click();
      await expect(page).toHaveURL(/\/versoes\/?$/);
      await expect(page.getByRole("heading", { level: 2, name: "Versões" })).toBeVisible();
      await page.getByRole("link", { name: /Voltar/ }).click();
      await expect(page).toHaveURL(/\/pedro\/?$/);
    });

    test("/versoes lista todas as versões publicadas do CHANGELOG, a mais recente aberta", async ({ page }) => {
      await page.goto("/versoes");
      const itens = page.locator("[data-versao]");
      await expect(itens).toHaveCount(PUBLICADAS.length);
      const numeros = await itens.evaluateAll((els) => els.map((e) => e.getAttribute("data-versao")));
      expect(numeros).toEqual(PUBLICADAS);
      expect(numeros[0]).toBe(pkg.version);
      await expect(itens.first()).toHaveJSProperty("open", true);
      await expect(itens.nth(1)).toHaveJSProperty("open", false);
      // Grupos e itens da versão aberta aparecem; `código` inline vira <code>.
      await expect(itens.first().locator("h4").first()).toBeVisible();
      expect(await itens.first().locator("li").count()).toBeGreaterThan(0);
      expect(await page.locator("[data-versao] li code").count()).toBeGreaterThan(0);
      // Abrir uma versão antiga mostra o conteúdo dela.
      await itens.last().locator("summary").click();
      await expect(itens.last()).toHaveJSProperty("open", true);
    });

    test("/versoes sem scroll horizontal e com a versão do rodapé também presente", async ({ page }) => {
      await page.goto("/versoes");
      await page.evaluate(() => document.fonts.ready);
      for (const d of await page.locator("[data-versao]").all()) {
        if (!(await d.evaluate((e) => (e as HTMLDetailsElement).open))) await d.locator("summary").click();
      }
      const m = await page.evaluate(() => {
        const c = document.querySelector(".conteudo") as HTMLElement;
        return {
          doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          conteudo: c.scrollWidth - c.clientWidth,
        };
      });
      expect(m.doc).toBeLessThanOrEqual(0);
      expect(m.conteudo).toBeLessThanOrEqual(0);
      await expect(page.locator("footer.rodape a")).toHaveText(`v${pkg.version}`);
    });

    for (const rota of ["/", "/pedro", "/versoes"]) {
      test(`axe sem serious/critical em ${rota}`, async ({ page }) => {
        await page.goto(rota);
        await page.evaluate(() => document.fonts.ready);
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      });
    }

    test("a home mostra a versão discreta e não rola em 360x640", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto("/");
      await page.waitForTimeout(700);
      await expect(page.locator("footer.rodape a")).toHaveText(`v${pkg.version}`);
      const m = await page.evaluate(() => {
        const el = document.documentElement;
        const r = (document.querySelector("footer.rodape a") as HTMLElement).getBoundingClientRect();
        return { sobra: el.scrollHeight - el.clientHeight, base: r.bottom, altura: el.clientHeight };
      });
      expect(m.sobra).toBeLessThanOrEqual(0);
      expect(m.base).toBeLessThanOrEqual(m.altura);
    });

    test("/cartao/ (cartão de visita) não tem o rodapé de versão", async ({ page }) => {
      await page.goto("/cartao/");
      await expect(page.locator("footer.rodape")).toHaveCount(0);
      expect(await page.content()).not.toContain(`v${pkg.version}`);
    });
  });
}
