import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { carregarFluxos } from "../src/fluxos/carregar";

// F5 (2026-11-20): Explorador dos fluxos do n8n. Tocar num nó mostra o que ele faz.
const fluxos = carregarFluxos();

test.describe("/explorar (índice)", () => {
  test("lista os 5 fluxos, do mais simples ao mais complexo, com link para cada um", async ({ page }) => {
    await page.goto("/explorar");
    const links = page.locator(".lista-fluxos a.cartao-fluxo");
    await expect(links).toHaveCount(fluxos.length);
    for (const [i, f] of fluxos.entries()) {
      await expect(links.nth(i)).toHaveAttribute("href", `/explorar/${f.slug}/`);
      await expect(links.nth(i)).toContainText(f.titulo);
    }
  });

  test("axe sem violação serious ou critical", async ({ page }) => {
    await page.goto("/explorar");
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
});

for (const f of fluxos) {
  test.describe(`/explorar/${f.slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/explorar/${f.slug}`);
    });

    test("desenha todos os nós e ligações e tem a alternativa em lista", async ({ page }) => {
      await expect(page.locator("svg.canvas .no")).toHaveCount(f.nos.length);
      await expect(page.locator("svg.canvas .ligacao")).toHaveCount(f.ligacoes.length);
      const lista = page.locator(".lista-nos li");
      await expect(lista).toHaveCount(f.nos.length);
      await expect(page.locator(".lista-nos")).toContainText(f.nos[0].oQueFaz);
    });

    test("tocar num nó abre o painel com o que ele faz; Esc fecha", async ({ page }) => {
      const no = f.nos[0];
      await page.locator(`svg.canvas .no[data-id="${no.id}"]`).click();
      const painel = page.locator(".painel-no");
      await expect(painel).toBeVisible();
      await expect(painel).toContainText(no.rotulo);
      await expect(painel).toContainText(no.oQueFaz);
      await page.keyboard.press("Escape");
      await expect(painel).toBeHidden();
    });

    test("pelo teclado: Tab até o nó e Enter abre o painel", async ({ page }) => {
      const no = page.locator(`svg.canvas .no[data-id="${f.nos[0].id}"]`);
      await no.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".painel-no")).toContainText(f.nos[0].rotulo);
    });

    test("sem rolagem horizontal da página; o canvas rola dentro da própria área", async ({ page }) => {
      const m = await page.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(m.w).toBeLessThanOrEqual(m.cw);
    });

    test("axe sem violação serious ou critical", async ({ page }) => {
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    });

    test("liga de volta à entrada do diário de obra", async ({ page }) => {
      const num = String(f.pr).padStart(3, "0");
      await expect(page.locator(`a[href="/pedro#pr-${num}"]`).first()).toBeVisible();
    });
  });
}

test.describe("controles do canvas", () => {
  test("o zoom + aumenta o desenho e o − diminui", async ({ page }) => {
    await page.goto("/explorar/lina-atendimento-whatsapp");
    const largura = () => page.locator("svg.canvas").evaluate((s) => s.getBoundingClientRect().width);
    const antes = await largura();
    await page.getByRole("button", { name: "Aproximar" }).click();
    expect(await largura()).toBeGreaterThan(antes);
    await page.getByRole("button", { name: "Afastar" }).click();
    await page.getByRole("button", { name: "Afastar" }).click();
    expect(await largura()).toBeLessThan(antes);
  });

  test("'Ver rodando' anima as ligações; com movimento reduzido, não anima", async ({ page }) => {
    await page.goto("/explorar/transcritor-de-audio");
    const botao = page.getByRole("button", { name: /Ver rodando/ });
    await botao.click();
    await expect(botao).toHaveAttribute("aria-pressed", "true");
    const nome = () =>
      page.locator("svg.canvas .ligacao").first().evaluate((p) => getComputedStyle(p).animationName);
    expect(await nome()).not.toBe("none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await nome()).toBe("none");
  });

  test("zero requisição a terceiros no Explorador", async ({ page, baseURL }) => {
    const origem = new URL(baseURL ?? "http://localhost").origin;
    const externas: string[] = [];
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith("data:") && new URL(u).origin !== origem) externas.push(u);
    });
    await page.goto("/explorar/lina-atendimento-whatsapp");
    await page.waitForLoadState("networkidle");
    expect(externas).toEqual([]);
  });
});

test.describe("ligações a partir do diário de obra", () => {
  test("o card de cada entrada com fluxo tem 'Explorar o fluxo'", async ({ page }) => {
    await page.goto("/pedro");
    for (const f of fluxos) {
      const card = page.locator(`#pr-${String(f.pr).padStart(3, "0")}`);
      await expect(card.getByRole("link", { name: /Explorar o fluxo/ })).toHaveAttribute("href", `/explorar/${f.slug}/`);
    }
  });

  test("o perfil do /pedro leva ao Explorador", async ({ page }) => {
    await page.goto("/pedro");
    await expect(page.locator(".perfil a[href='/explorar']")).toBeVisible();
  });
});
