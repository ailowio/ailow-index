import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { APPS } from "../src/config/apps";

const TEMAS = ["escuro", "claro"] as const;
const ROTAS = ["/", ...APPS.map((a) => a.rota)];

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

// Rotas da home e das páginas internas, nos 2 temas (e nos 2 viewports, pelos 2 projetos do Playwright).
for (const rota of ROTAS) {
  for (const tema of TEMAS) {
    test.describe(`${rota} (${tema})`, () => {
      test.beforeEach(async ({ page }) => {
        await comTema(page, tema);
        await page.goto(rota);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        await page.evaluate(() => document.fonts.ready);
        // Deixa a entrada escalonada dos ícones terminar antes de medir.
        await page.waitForTimeout(700);
      });

      test("sem scroll horizontal e sem scroll de página", async ({ page }) => {
        const m = await page.evaluate(() => ({
          w: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          h: document.documentElement.scrollHeight,
          ch: document.documentElement.clientHeight,
          bw: document.body.scrollWidth,
          bcw: document.body.clientWidth,
        }));
        expect(m.w, JSON.stringify(m)).toBeLessThanOrEqual(m.cw);
        expect(m.bw, JSON.stringify(m)).toBeLessThanOrEqual(m.bcw);
        // UXM-01: a tela tem altura fixa; nada rola a página.
        expect(m.h, JSON.stringify(m)).toBeLessThanOrEqual(m.ch);
      });

      test("axe sem violação serious ou critical", async ({ page }) => {
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([]);
      });

      // F0 (2026-11-20, decisão do Pedro): o deploy decidiu, as rotas públicas passam a ser indexáveis.
      test("a página é indexável (F0)", async ({ page }) => {
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      });
    });
  }
}

test.describe("home como tela inicial", () => {
  test("mostra a grade de 6 apps com alvos de 48 px e rótulo", async ({ page }) => {
    await page.goto("/");
    const apps = page.locator("a.app");
    await expect(apps).toHaveCount(6);
    for (const app of APPS) {
      const link = page.locator(`a.app[href="${app.rota}"]`);
      await expect(link).toContainText(app.rotulo);
      const caixa = await link.boundingBox();
      expect(caixa?.width, app.id).toBeGreaterThanOrEqual(48);
      expect(caixa?.height, app.id).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator(".logo")).toHaveCount(1);
  });

  // V02 · 2026-11-20 · ADR 007: a grade de apps desceu para baixo das portas. A página continua sem rolar
  // (UXM-01); os ícones ficam ao alcance rolando só o conteúdo, e o último chega inteiro à tela.
  test("home em 360x640 não rola e os 6 ícones ficam inteiros na tela", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    await page.waitForTimeout(700);
    await page.locator("li:last-child a.app").scrollIntoViewIfNeeded();
    const m = await page.evaluate(() => {
      const el = document.documentElement;
      const ultimo = document.querySelector("a.app:last-child, li:last-child a.app") as HTMLElement;
      return {
        sobra: el.scrollHeight - el.clientHeight,
        base: ultimo.getBoundingClientRect().bottom,
        altura: el.clientHeight,
      };
    });
    expect(m.sobra).toBeLessThanOrEqual(0);
    expect(m.base).toBeLessThanOrEqual(m.altura);
  });

  test("os ícones têm foco visível por teclado", async ({ page }) => {
    await page.goto("/");
    const primeiro = page.locator("a.app").first();
    await primeiro.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(primeiro).toBeFocused();
    const contorno = await primeiro.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(contorno).toBe("solid");
  });

  test("estado de toque: o ícone pressionado muda de escala", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(700);
    const tile = page.locator("a.app").first().locator(".app-tile");
    // V02 · 2026-11-20 · ADR 007: a grade fica abaixo das portas; traz o ícone para a tela antes de pressionar.
    await tile.scrollIntoViewIfNeeded();
    const caixa = await tile.boundingBox();
    if (!caixa) throw new Error("sem caixa");
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    const t = await tile.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.move(1, 1);
    await page.mouse.up();
    expect(t).not.toBe("none");
  });

  test("1 toque do ícone ao conteúdo, para cada app", async ({ page }) => {
    for (const app of APPS) {
      await page.goto("/");
      await page.locator(`a.app[href="${app.rota}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${app.rota}/?$`));
      await expect(page.getByRole("heading", { level: 1, name: app.titulo })).toBeVisible();
    }
  });

  test("zero requisição externa na home e nas páginas internas", async ({ page, baseURL }) => {
    const origem = new URL(baseURL as string).origin;
    const externas: string[] = [];
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return;
      if (u.origin !== origem) externas.push(req.url());
    });
    for (const rota of ROTAS) await page.goto(rota, { waitUntil: "networkidle" });
    expect(externas).toEqual([]);
  });
});

test.describe("transição nativa entre home e app", () => {
  test("ícone e selo do cabeçalho compartilham o view-transition-name", async ({ page }) => {
    for (const app of APPS) {
      await page.goto("/");
      const nomeTile = await page
        .locator(`a.app[href="${app.rota}"] .app-tile`)
        .evaluate((el) => getComputedStyle(el).getPropertyValue("view-transition-name"));
      await page.goto(app.rota);
      const nomeSelo = await page
        .locator(".app-badge")
        .evaluate((el) => getComputedStyle(el).getPropertyValue("view-transition-name"));
      expect(nomeTile).toBe(`app-${app.id}`);
      expect(nomeSelo).toBe(nomeTile);
    }
  });

  test("com movimento reduzido, a transição não anima", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const anim = await page.evaluate(() => {
      const regras = [...document.styleSheets].flatMap((s) => [...s.cssRules]);
      return regras
        .filter((r): r is CSSMediaRule => r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.conditionText))
        .flatMap((r) => [...r.cssRules].map((c) => c.cssText))
        .join("\n");
    });
    // O navegador reserializa `animation: none` como "auto ease 0s 1 normal none running none".
    expect(anim).toMatch(/::view-transition-old\(\*\)[^}]*none running none/);
    expect(anim).toMatch(/tela-home[^}]*::view-transition-new\(root\)[^}]*none running none/);
    expect(anim).toMatch(/\.app \{ animation: auto ease 0s 1 normal none running none/);
  });
});

// ADR 003 item 4, revisto na F0 (2026-11-20, decisão do Pedro): a trava saiu da home (quem chega por link
// precisa conseguir voltar ao Instagram/WhatsApp) e ficou só no cartão instalado. Exceção EX-03 à UXM-03.
test.describe("Voltar (ADR 003 item 4, revisto na F0)", () => {
  test("(a) na home, depois de um gesto, o Voltar do navegador volta para a página anterior", async ({ page }) => {
    await page.goto("/sobre");
    await page.goto("/");
    await page.mouse.click(5, 5);
    await page.goBack();
    await expect(page).toHaveURL(/\/sobre\/?$/);
  });

  test("(b) home -> ícone -> página interna -> Voltar volta para a home", async ({ page }) => {
    await page.goto("/");
    await page.locator('a.app[href="/pedro"]').click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("a.app")).toHaveCount(6);
  });

  test("(b2) a seta da página volta à home quando veio dela", async ({ page }) => {
    await page.goto("/");
    await page.locator('a.app[href="/sobre"]').click();
    await expect(page).toHaveURL(/\/sobre\/?$/);
    await page.getByRole("link", { name: /Voltar/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("(c) página interna aberta direto: a seta leva ao pai", async ({ page }) => {
    await page.goto("/pulse");
    const seta = page.getByRole("link", { name: /Voltar/ });
    const caixa = await seta.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(48);
    expect(caixa?.height).toBeGreaterThanOrEqual(48);
    await seta.click();
    await expect(page).toHaveURL(/\/$/);

    // V07 · 2026-11-20 · ADR 007 item 5: a subpágina de exemplo era /pedro/entrevistas, que virou /na-tv
    // (primeiro nível, pai = início). /pedro/stack segue como subpágina com pai /pedro.
    await page.goto("/pedro/stack");
    await page.getByRole("link", { name: /Voltar/ }).click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
  });

  // A trava continua no cartão instalado; o orçamento de 1 KB vale lá.
  test("o script do Voltar pesa até 1 KB gzip", async ({ page, request }) => {
    const res = await request.get(["", "cartao", ""].join("/"));
    const html = await res.text();
    const m = html.match(/<script>([^<]*popstate[^<]*)<\/script>/);
    expect(m, "script do Voltar não encontrado").not.toBeNull();
    const { gzipSync } = await import("node:zlib");
    expect(gzipSync(Buffer.from((m as RegExpMatchArray)[1])).length).toBeLessThanOrEqual(1024);
    void page;
  });
});
