import { readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const principal: { publicadas: number[] } = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "test", "fixtures", "v09-feed-main.json"), "utf8"),
);

/**
 * V09 (2026-11-20; ADR 007 itens 3 e 4): o /pedro vira "Diário de obra", com a lente "Para empresários / Para
 * técnicos" e "os 3 que eu mostraria numa visita". Sem JS: leitura técnica, seletor escondido, resumo rotulado.
 */
const TEMAS = ["escuro", "claro"] as const;
const VITRINE = 81; // tem resumo_dono (citada por /consultoria, /educacao e /chao-de-fabrica)
const SEM_RESUMO = 1; // fora da vitrine
const PAGINAS_VITRINE = ["/consultoria", "/educacao", "/chao-de-fabrica", "/na-tv"];

const ancora = (n: number) => `#pr-${String(n).padStart(3, "0")}`;
const botao = (page: Page, nome: "Para empresários" | "Para técnicos") =>
  page.locator(".lente").getByRole("button", { name: nome, exact: true });

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

async function abrir(page: Page) {
  await page.goto("/pedro");
  await page.evaluate(() => document.fonts.ready);
}

test.describe("nome, subtítulo e links", () => {
  test("título visível, subtítulo, aba e preview dizem Diário de obra; a URL é /pedro", async ({ page }) => {
    await abrir(page);
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await expect(page.locator("h1.app-titulo")).toHaveText("Diário de obra");
    await expect(page.locator(".diario-subtitulo")).toHaveText("cada entrega, com data e prova");
    await expect(page).toHaveTitle("Diário de obra | Ailow");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Diário de obra | Ailow");
    await expect(page.locator("#feed-titulo")).toContainText("Todas as entregas");
    await expect(page.locator("main")).not.toContainText(/portf[oó]lio/i);
  });

  test("o título do cabeçalho cabe inteiro, sem reticências", async ({ page }) => {
    await abrir(page);
    const m = await page.locator("h1.app-titulo").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(m.sw, JSON.stringify(m)).toBeLessThanOrEqual(m.cw);
  });

  test("os links para o /pedro dizem Diário de obra (home, /apresentacao, /cloud, label)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a.app[href="/pedro"]')).toHaveText("Diário");
    await page.goto("/apresentacao");
    await expect(page.locator('main a[href="/pedro"]').first()).toHaveText("Diário de obra");
    await page.goto("/cloud");
    await expect(page.getByRole("link", { name: "Diário de obra completo" })).toHaveAttribute("href", "/pedro");
    await expect(page.locator("main")).not.toContainText(/portf[oó]lio|\bfeed\b/i);
    await page.goto("/pedro/label/escopo-iot");
    await expect(page.getByRole("link", { name: "Todo o Diário de obra" })).toHaveAttribute("href", "/pedro");
    await expect(page).toHaveTitle("iot no Diário de obra | Ailow");
  });
});

test.describe("a contagem do feed não muda", () => {
  test("mesmas entradas publicadas da main (f7c881a), mesma ordem, mais recente no topo", async ({ page }) => {
    await abrir(page);
    const nos = await page
      .locator("article.pr")
      .evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-pr"))));
    expect(nos).toEqual([...principal.publicadas].reverse());
    await expect(page.locator("[data-total-feed]")).toHaveText(String(principal.publicadas.length));
    const json = await (await page.request.get("/pedro/feed.json")).json();
    expect(json.prs.map((p: { numero: number }) => p.numero)).toEqual(principal.publicadas);
  });
});

test.describe("os 3 que eu mostraria numa visita", () => {
  test("3 entradas de frentes diferentes, fora do feed (não são cartões), cada uma leva à sua entrada", async ({
    page,
  }) => {
    await abrir(page);
    await expect(page.getByRole("heading", { name: "Os 3 que eu mostraria numa visita" })).toBeVisible();
    const itens = page.locator(".visita-item");
    await expect(itens).toHaveCount(3);
    await expect(page.locator(".visita article.pr")).toHaveCount(0);
    const frentes = await page.locator(".visita-frente").allTextContents();
    expect(new Set(frentes).size).toBe(3);
    for (const href of await page.locator(".visita-link").evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      await expect(page.locator(`article.pr${href}`)).toHaveCount(1);
      await expect(page.locator(`article.pr${href} [data-resumo-dono]`)).toHaveCount(1);
    }
    // A visita fica antes do perfil e do feed (topo).
    const topo = await page.evaluate(() => {
      const y = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect().top;
      const x = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect().left;
      return {
        largura: window.innerWidth,
        lente: y(".diario-topo"),
        visita: y(".visita"),
        perfil: y(".perfil"),
        feed: y(".feed"),
        xLente: x(".diario-topo"),
        xVisita: x(".visita"),
        xPerfil: x(".perfil"),
        xFeed: x(".feed"),
      };
    });
    if (topo.largura < 1280) {
      expect(topo.lente).toBeLessThan(topo.visita);
      expect(topo.visita).toBeLessThan(topo.perfil);
      expect(topo.perfil).toBeLessThan(topo.feed);
    } else {
      // V15 · 2026-11-23 · desktop por rota (ADR 007, revisão V15): em >= 1280 px o Diário tem 2 colunas. A visita
      // segue no topo, ao lado da lente (coluna da direita); o perfil fica abaixo da lente e o feed abaixo da visita.
      // O celular continua com a ordem vertical de antes (ramo acima, sem mudança).
      const msg = JSON.stringify(topo);
      expect(Math.abs(topo.lente - topo.visita), msg).toBeLessThanOrEqual(1);
      expect(topo.xLente, msg).toBeLessThan(topo.xVisita);
      expect(topo.lente, msg).toBeLessThan(topo.perfil);
      expect(topo.visita, msg).toBeLessThan(topo.feed);
      expect(topo.xPerfil, msg).toBe(topo.xLente);
      expect(topo.xFeed, msg).toBe(topo.xVisita);
    }
  });

  test("toda entrada citada por /consultoria, /educacao, /chao-de-fabrica e /na-tv tem resumo para empresários", async ({
    page,
  }) => {
    const citadas = new Set<string>();
    for (const rota of PAGINAS_VITRINE) {
      await page.goto(rota);
      const hrefs = await page
        .locator('a[href^="/pedro/#pr-"], a[href^="/pedro#pr-"]')
        .evaluateAll((els) => els.map((e) => (e.getAttribute("href") ?? "").replace(/^\/pedro\/?/, "")));
      expect(hrefs.length, rota).toBeGreaterThan(0);
      for (const h of hrefs) citadas.add(h);
    }
    await abrir(page);
    for (const h of citadas) await expect(page.locator(`article.pr${h} [data-resumo-dono]`), h).toHaveCount(1);
  });
});

test.describe("lente com JS", () => {
  test("começa em Para técnicos; Para empresários troca a mesma entrada para o resumo e volta", async ({ page }) => {
    await abrir(page);
    const vitrine = page.locator(`article.pr${ancora(VITRINE)}`);
    const comum = page.locator(`article.pr${ancora(SEM_RESUMO)}`);
    await expect(page.locator(".lente")).toBeVisible();
    await expect(botao(page, "Para técnicos")).toHaveAttribute("aria-pressed", "true");
    await expect(botao(page, "Para empresários")).toHaveAttribute("aria-pressed", "false");
    await expect(vitrine.locator(".pr-corpo")).toBeVisible();
    await expect(vitrine.locator(".pr-dono")).toBeHidden();
    await expect(page.locator(".visita-tecnico").first()).toBeVisible();
    await expect(page.locator(".visita-dono").first()).toBeHidden();

    await botao(page, "Para empresários").click();
    await expect(botao(page, "Para empresários")).toHaveAttribute("aria-pressed", "true");
    await expect(botao(page, "Para técnicos")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("[data-diario]")).toHaveAttribute("data-lente", "dono");
    // Entrada de vitrine: o resumo no lugar do texto técnico, das ferramentas e do prefixo.
    await expect(vitrine.locator(".pr-dono")).toBeVisible();
    await expect(vitrine.locator(".pr-dono-rotulo")).toBeHidden();
    await expect(vitrine.locator(".pr-corpo")).toBeHidden();
    await expect(vitrine.locator(".chips")).toBeHidden();
    await expect(vitrine.locator(".pr-tipo")).toBeHidden();
    await expect(vitrine.locator(".pr-prova")).toBeVisible();
    // Entrada sem resumo: só o título sem o prefixo técnico (e a prova); o corpo técnico some.
    await expect(comum.locator(".pr-dono")).toHaveCount(0);
    await expect(comum.locator(".pr-tipo")).toBeHidden();
    await expect(comum.locator(".pr-descricao")).toBeVisible();
    await expect(comum.locator(".pr-corpo")).toBeHidden();
    await expect(comum.locator(".pr-prova")).toBeVisible();
    await expect(page.locator(".visita-dono").first()).toBeVisible();
    await expect(page.locator(".visita-tecnico").first()).toBeHidden();
    // A contagem não depende da lente.
    await expect(page.locator("article.pr")).toHaveCount(principal.publicadas.length);

    await botao(page, "Para técnicos").click();
    await expect(botao(page, "Para técnicos")).toHaveAttribute("aria-pressed", "true");
    await expect(vitrine.locator(".pr-corpo")).toBeVisible();
    await expect(vitrine.locator(".pr-dono")).toBeHidden();
    await expect(comum.locator(".pr-tipo")).toBeVisible();
  });

  test("teclado: Tab chega aos botões, com foco visível, e Espaço e Enter trocam a lente", async ({ page }) => {
    await abrir(page);
    let chegou = false;
    for (let i = 0; i < 8 && !chegou; i++) {
      await page.keyboard.press("Tab");
      chegou = await page.evaluate(() => document.activeElement?.getAttribute("data-lente-botao") === "dono");
    }
    expect(chegou).toBe(true);
    const contorno = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
    expect(contorno).not.toBe("none");
    await page.keyboard.press("Space");
    await expect(botao(page, "Para empresários")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`article.pr${ancora(VITRINE)} .pr-dono`)).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-lente-botao"))).toBe("tecnico");
    await page.keyboard.press("Enter");
    await expect(botao(page, "Para técnicos")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`article.pr${ancora(VITRINE)} .pr-dono`)).toBeHidden();
  });

  test("a escolha vale na sessão do navegador (sessionStorage), sem cookie; outra sessão começa técnica", async ({
    page,
    browser,
  }) => {
    await abrir(page);
    await botao(page, "Para empresários").click();
    await page.reload();
    await expect(botao(page, "Para empresários")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`article.pr${ancora(VITRINE)} .pr-dono`)).toBeVisible();
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem("ailow-lente"))).toBe("dono");

    const outra = await browser.newContext();
    const p2 = await outra.newPage();
    await p2.goto("/pedro");
    await expect(botao(p2, "Para técnicos")).toHaveAttribute("aria-pressed", "true");
    await outra.close();
  });

  test("com o sessionStorage bloqueado a lente ainda troca", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new Error("bloqueado");
        },
      });
    });
    await abrir(page);
    await expect(botao(page, "Para técnicos")).toHaveAttribute("aria-pressed", "true");
    await botao(page, "Para empresários").click();
    await expect(page.locator(`article.pr${ancora(VITRINE)} .pr-dono`)).toBeVisible();
  });
});

test.describe("lente sem JS", () => {
  test.use({ javaScriptEnabled: false });

  test("leitura técnica é a da página, o seletor some e o resumo para empresários fica rotulado no cartão", async ({
    page,
  }) => {
    await page.goto("/pedro");
    await expect(page.locator(".lente")).toBeHidden();
    const vitrine = page.locator(`article.pr${ancora(VITRINE)}`);
    await expect(vitrine.locator(".pr-corpo")).toBeVisible();
    await expect(vitrine.locator(".pr-tipo")).toBeVisible();
    await expect(vitrine.locator(".pr-dono")).toBeVisible();
    await expect(vitrine.locator(".pr-dono-rotulo")).toHaveText("Para empresários:");
    await expect(page.locator(`article.pr${ancora(SEM_RESUMO)} .pr-corpo`)).toBeVisible();
    await expect(page.locator(".visita-dono").first()).toBeVisible();
    await expect(page.locator("article.pr")).toHaveCount(principal.publicadas.length);
  });
});

for (const tema of TEMAS) {
  for (const lente of ["Para empresários", "Para técnicos"] as const) {
    test.describe(`${lente} (${tema})`, () => {
      test.beforeEach(async ({ page }) => {
        await comTema(page, tema);
        await abrir(page);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        await botao(page, lente).click();
        await expect(botao(page, lente)).toHaveAttribute("aria-pressed", "true");
      });

      test("axe sem violação serious ou critical", async ({ page }) => {
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([]);
      });

      test("360, 375 e 1440: sem rolagem horizontal; seletor e visita dentro do contêiner", async ({ page }) => {
        for (const largura of [360, 375, 1440]) {
          await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 900 });
          await page.waitForTimeout(100);
          const m = await page.evaluate(() => {
            const de = document.documentElement;
            const main = document.querySelector("main") as HTMLElement;
            const lente = document.querySelector(".lente") as HTMLElement;
            const caixa = lente.getBoundingClientRect();
            const pagina = (document.querySelector(".pagina") as HTMLElement).getBoundingClientRect();
            const botoes = [...lente.querySelectorAll("button")].map((b) => ({
              fora: b.getBoundingClientRect().right > caixa.right + 0.5 || b.getBoundingClientRect().left < caixa.left - 0.5,
              transborda: b.scrollWidth > b.clientWidth,
            }));
            const visita = [...document.querySelectorAll(".visita-item")].map(
              (el) => el.getBoundingClientRect().right > pagina.right + 0.5,
            );
            return {
              w: de.scrollWidth,
              cw: de.clientWidth,
              mainSw: main.scrollWidth,
              mainCw: main.clientWidth,
              lenteFora: caixa.right > main.getBoundingClientRect().right + 0.5,
              botoes,
              visita,
            };
          });
          expect(m.w, `${largura}: ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.cw);
          expect(m.mainSw, `${largura}: ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.mainCw);
          expect(m.lenteFora, `${largura}`).toBe(false);
          expect(m.botoes, `${largura}`).toEqual([
            { fora: false, transborda: false },
            { fora: false, transborda: false },
          ]);
          expect(m.visita, `${largura}`).toEqual([false, false, false]);
        }
      });
    });
  }
}
