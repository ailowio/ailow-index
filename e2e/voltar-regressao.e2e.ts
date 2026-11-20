import { type Page, expect, test } from "@playwright/test";

// S12c: matriz de cenários do "Voltar às vezes não funciona" (ADR 003, item 4). Cada cenário prova a causa
// com history.length / history.state e com o caminho real (pathname + hash), nos 2 projetos do Playwright.

const caminho = (page: Page) => {
  const u = new URL(page.url());
  return u.pathname.replace(/\/$/, "") + u.hash || "/";
};
const base = (page: Page) => caminho(page).replace(/\/$/, "") || "/";
const seta = (page: Page) => page.getByRole("link", { name: /Voltar/ });
const noPortfolio = (p: string) => /^\/pedro$/.test(p) || p.startsWith("/pedro#");

async function assentar(page: Page) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(350);
}

test.describe("Voltar: matriz de regressão", () => {
  // V07 · 2026-11-20 · ADR 007 item 5: as entrevistas agora são /na-tv (a rota antiga responde 301). Mesmo cenário.
  test("H1: 'Prova no feed' abre /pedro#pr-NNN; a seta e o Voltar do sistema voltam às entrevistas", async ({ page }) => {
    await page.goto("/na-tv");
    const antes = await page.evaluate(() => history.length);
    await page.locator("a.prova").first().click();
    await expect(page).toHaveURL(/\/pedro\/?#pr-\d{3}$/);
    await assentar(page);
    // Uma entrada nova, nunca duas (âncora não pode empilhar histórico a mais).
    expect(await page.evaluate(() => history.length)).toBe(antes + 1);
    await seta(page).click();
    await expect(page).toHaveURL(/\/na-tv\/?$/);
    // Pelo sistema também.
    await page.locator("a.prova").first().click();
    await expect(page).toHaveURL(/#pr-\d{3}$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/na-tv\/?$/);
  });

  test("H1b: dentro do feed, o Voltar do sistema depois de um hash volta à tela anterior (não só troca o hash)", async ({ page }) => {
    await page.goto("/");
    // V07 · 2026-11-20 · ADR 007 item 5: o ícone de entrevista abre /na-tv.
    await page.locator('a.app[href="/na-tv"]').click();
    await page.locator("a.prova").first().click();
    await expect(page).toHaveURL(/#pr-\d{3}$/);
    await assentar(page);
    await page.goBack();
    expect(base(page)).toBe("/na-tv");
    await page.goBack();
    expect(base(page)).toBe("/");
  });

  test("H2: seta de /pedro depois de passar pela label ('Todo o feed') volta à home, não entra em laço com a label", async ({ page }) => {
    await page.goto("/");
    await page.locator('a.app[href="/pedro"]').click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await page.locator("a.chip").first().click();
    await expect(page).toHaveURL(/\/pedro\/label\//);
    await page.getByRole("link", { name: "Todo o feed" }).click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await assentar(page);
    await seta(page).click();
    await assentar(page);
    // A seta de /pedro tem de levar ao pai (a home), nunca de volta à label de onde acabou de sair.
    expect(base(page)).toBe("/");
  });

  test("H2b: recarregar a página interna e apertar a seta ainda volta uma tela", async ({ page }) => {
    await page.goto("/");
    await page.locator('a.app[href="/sobre"]').click();
    await expect(page).toHaveURL(/\/sobre\/?$/);
    await page.reload();
    await seta(page).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("H2c: página aberta em aba nova (referrer do site, sem histórico) usa o link ao pai", async ({ page, context }) => {
    await page.goto("/pedro");
    const [nova] = await Promise.all([
      context.waitForEvent("page"),
      page.locator("a.chip").first().click({ modifiers: ["Control"] }),
    ]);
    await nova.waitForLoadState("load");
    expect(await nova.evaluate(() => history.length)).toBe(1);
    await seta(nova).click();
    await expect.poll(() => base(nova)).toBe("/pedro");
  });

  test("H3: pai das subpáginas aponta a rota canônica e não cai em redirect", async ({ page, request }) => {
    // V07 · 2026-11-20 · ADR 007 item 5: /pedro/entrevistas virou /na-tv, rota de primeiro nível (pai = início).
    for (const rota of ["/pedro/stack", "/pedro/label/escopo-sgi"]) {
      await page.goto(rota);
      const href = await seta(page).getAttribute("href");
      expect(href, rota).toBe("/pedro");
      const r = await request.get(href as string, { maxRedirects: 0 });
      expect(r.status(), `${rota} -> ${href}`).toBe(200);
    }
    for (const rota of ["/pulse", "/cloud", "/sobre", "/apresentacao", "/pedro", "/na-tv"]) {
      await page.goto(rota);
      const href = await seta(page).getAttribute("href");
      expect(href, rota).toBe("/");
    }
  });

  // F0 (2026-11-20, decisão do Pedro): a home não tem mais trava; o resto do H4 (não prender nem pular tela) continua.
  test("H4: ir e voltar várias vezes na home nunca prende nem pula tela", async ({ page }) => {
    await page.goto("/");
    await page.mouse.click(5, 5);
    for (const rota of ["/sobre", "/pulse", "/cloud", "/pedro"]) {
      await page.locator(`a.app[href="${rota}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${rota}/?$`));
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("a.app")).toHaveCount(6);
    }
    // E ainda dá para abrir outro ícone e voltar pela seta.
    await page.locator('a.app[href="/cloud"]').click();
    await expect(page).toHaveURL(/\/cloud\/?$/);
    await seta(page).click();
    await expect(page).toHaveURL(/\/$/);
  });

  // F0: sem trava, a home restaurada do bfcache segue o histórico normal (volta uma tela, sem pular).
  test("H4b: home restaurada do bfcache volta exatamente uma tela", async ({ page }) => {
    // /pulse faz o papel da página de onde a pessoa veio antes da home (o Instagram, por exemplo).
    await page.goto("/pulse");
    await page.goto("/");
    await page.mouse.click(5, 5);
    await page.locator('a.app[href="/sobre"]').click();
    await expect(page).toHaveURL(/\/sobre\/?$/);
    await seta(page).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goBack();
    await page.waitForTimeout(300);
    expect(base(page)).toBe("/pulse");
  });

  test("H5: home -> Portfólio -> label -> Stack... cada Voltar do sistema volta exatamente uma tela", async ({ page }) => {
    await page.goto("/");
    await page.mouse.click(5, 5);
    await page.locator('a.app[href="/pedro"]').click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await page.locator("a.chip").first().click();
    await expect(page).toHaveURL(/\/pedro\/label\//);
    await seta(page).click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await page.getByRole("link", { name: /Ver a stack completa/ }).click();
    await expect(page).toHaveURL(/\/pedro\/stack\/?$/);
    await page.goBack();
    expect(base(page)).toBe("/pedro");
    // A label saiu do histórico quando a seta voltou e a Stack entrou no lugar dela.
    await page.goBack();
    expect(base(page)).toBe("/");
    // F0 (2026-11-20, decisão do Pedro): sem trava na home, o próximo Voltar sai do site (aqui, para a aba em branco).
    await page.goBack();
    await page.waitForTimeout(300);
    expect(page.url()).toBe("about:blank");
  });

  test("H6: Voltar do sistema com o dialog do avatar aberto fecha o dialog e fica na página", async ({ page }) => {
    await page.goto("/apresentacao");
    await page.locator("#avatar-gatilho").click();
    await expect(page.locator("#avatar-dialogo")).toHaveJSProperty("open", true);
    await page.goBack();
    await page.waitForTimeout(300);
    expect(base(page), "o Voltar tirou o usuário da página com o dialog aberto").toBe("/apresentacao");
    await expect(page.locator("#avatar-dialogo")).toHaveJSProperty("open", false);
  });

  test("H7: toque duplo na seta anda só uma tela", async ({ page }) => {
    await page.goto("/");
    await page.mouse.click(5, 5);
    await page.locator('a.app[href="/pedro"]').click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
    await page.locator("a.chip").first().click();
    await expect(page).toHaveURL(/\/pedro\/label\//);
    await assentar(page);
    await seta(page).dblclick();
    await assentar(page);
    await page.waitForTimeout(500);
    expect(noPortfolio(base(page)), `parou em ${page.url()} (esperado /pedro)`).toBe(true);
  });
});
