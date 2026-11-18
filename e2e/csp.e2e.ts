import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { hashesDoDist } from "../scripts/csp.mjs";

/**
 * S11: a CSP de produção (ops/web/seguranca.conf) aplicada às páginas do build de verdade.
 * O preview do Astro não manda cabeçalhos; aqui o Playwright injeta a mesma política nas
 * respostas de documento e confere que nada é bloqueado e que o JS do site continua funcionando.
 */
const raiz = resolve(import.meta.dirname, "..");
const conf = readFileSync(join(raiz, "ops/web/seguranca.conf"), "utf8");
const modelo = /add_header Content-Security-Policy "([^"]+)" always;/.exec(conf)?.[1] ?? "";
const csp = modelo.replace("$csp_script_hashes", hashesDoDist(join(raiz, "dist")).join(" "));

const ROTAS = ["/", "/pedro/", "/pedro/entrevistas/", "/apresentacao/", "/pulse/", "/cloud/", "/sobre/", "/cartao/"];

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const resposta = await route.fetch();
    await route.fulfill({
      response: resposta,
      headers: { ...resposta.headers(), "content-security-policy": csp },
    });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __violacoes: string[] };
    w.__violacoes = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__violacoes.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
});

test("a política existe e não libera inline em script nem terceiros", () => {
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("'sha256-");
  expect(csp).not.toContain("$csp_script_hashes");
  expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
});

for (const rota of ROTAS) {
  test(`${rota} roda sob a CSP: 0 violações e o botão de tema funciona`, async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) erros.push(m.text());
    });
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
    const antes = await page.locator("html").getAttribute("data-tema");
    await page.locator("#botao-tema").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-tema", antes ?? "");
    const violacoes = await page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
    expect(violacoes).toEqual([]);
    expect(erros).toEqual([]);
  });
}

test("o service worker do cartão registra sob a CSP", async ({ page }) => {
  await page.goto("/cartao/");
  const pronto = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.scope.endsWith("/cartao/");
  });
  expect(pronto).toBe(true);
});
