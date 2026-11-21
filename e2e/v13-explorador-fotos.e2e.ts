import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { urlCanonica } from "../src/config/indexacao";
import { carregarFotos } from "../src/fotos/carregar";

/**
 * V13 (2026-11-20; ADR 008, revisão "fotos estáticas do Explorador"): o modo foto do Explorador. Pontos tocáveis
 * posicionados por % sobre a imagem; tocar (ou Enter) abre o painel com "o que é" e o detalhe técnico; Esc fecha e
 * devolve o foco; "Ver como lista" tem tudo. Em 360 px nenhum ponto sai da imagem, e o painel não cobre o ponto ativo.
 */

const fotos = carregarFotos();
const TEMAS = ["escuro", "claro"] as const;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

const semViolacaoGrave = async (page: Page) => {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
};

test.describe("/explorar (índice): fotos ao lado dos fluxos", () => {
  test("lista as 2 fotos, com link para cada página", async ({ page }) => {
    await page.goto("/explorar");
    const links = page.locator(".lista-fotos a.cartao-foto");
    await expect(links).toHaveCount(fotos.length);
    for (const [i, f] of fotos.entries()) {
      await expect(links.nth(i)).toHaveAttribute("href", `/explorar/${f.slug}/`);
      await expect(links.nth(i)).toContainText(f.titulo);
      await expect(links.nth(i)).toContainText(`${f.pontos.length} pontos`);
    }
  });
});

for (const f of fotos) {
  const ROTA = `/explorar/${f.slug}`;

  test.describe(ROTA, () => {
    test("responde 200, é indexável, tem canonical, título e está no sitemap", async ({ page, request }) => {
      const r = await page.goto(ROTA);
      expect(r?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
      await expect(page).toHaveTitle(new RegExp(`^${f.titulo}`));
      const xml = await (await request.get("/sitemap.xml")).text();
      expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
    });

    test("a imagem carrega, com texto alternativo e dimensões declaradas; um botão por ponto", async ({ page }) => {
      await page.goto(ROTA);
      const img = page.locator(".foto-quadro img");
      await expect(img).toHaveAttribute("alt", f.alt);
      await expect(img).toHaveAttribute("width", String(f.imagem.largura));
      await expect(img).toHaveAttribute("height", String(f.imagem.altura));
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(f.imagem.largura);
      await expect(page.locator(".foto-quadro .ponto")).toHaveCount(f.pontos.length);
      for (const [i, p] of f.pontos.entries()) {
        await expect(page.locator(".foto-quadro .ponto").nth(i)).toHaveAccessibleName(`${i + 1}. ${p.rotulo}`);
      }
    });

    test("tocar num ponto abre o painel com o que é e o detalhe técnico; Esc fecha e devolve o foco", async ({ page }) => {
      await page.goto(ROTA);
      const painel = page.locator(".painel-no");
      await expect(painel).toBeHidden();
      for (const [i, p] of f.pontos.entries()) {
        const botao = page.locator(".foto-quadro .ponto").nth(i);
        await botao.click();
        await expect(painel).toBeVisible();
        await expect(painel.locator("h3")).toHaveText(p.rotulo);
        await expect(painel.locator(".oqf")).toHaveText(p.oQueE);
        await expect(painel.locator(".tec")).toContainText(p.detalhe);
        await expect(botao).toHaveAttribute("aria-expanded", "true");
      }
      const ultimo = page.locator(".foto-quadro .ponto").last();
      await page.keyboard.press("Escape");
      await expect(painel).toBeHidden();
      await expect(ultimo).toBeFocused();
      await expect(ultimo).toHaveAttribute("aria-expanded", "false");
    });

    test("pelo teclado: Tab percorre os pontos em ordem, com foco visível, e Enter abre o painel", async ({ page }) => {
      await page.goto(ROTA);
      const pontos = page.locator(".foto-quadro .ponto");
      await pontos.first().focus();
      await page.keyboard.press("Tab");
      await expect(pontos.nth(1)).toBeFocused();
      const contorno = await pontos.nth(1).evaluate((b) => {
        const s = getComputedStyle(b);
        return { estilo: s.outlineStyle, largura: Number.parseFloat(s.outlineWidth) };
      });
      expect(contorno.estilo).not.toBe("none");
      expect(contorno.largura).toBeGreaterThanOrEqual(2);
      await page.keyboard.press("Enter");
      await expect(page.locator(".painel-no h3")).toHaveText(f.pontos[1].rotulo);
      await page.locator(".painel-no [data-fechar]").click();
      await expect(page.locator(".painel-no")).toBeHidden();
    });

    test("'Ver como lista' tem cada ponto, em ordem, com o que é e o detalhe técnico", async ({ page }) => {
      await page.goto(ROTA);
      await page.locator(".lista-nos summary").click();
      const itens = page.locator(".lista-nos li");
      await expect(itens).toHaveCount(f.pontos.length);
      for (const [i, p] of f.pontos.entries()) {
        await expect(itens.nth(i)).toContainText(p.rotulo);
        await expect(itens.nth(i)).toContainText(p.oQueE);
        await expect(itens.nth(i)).toContainText(p.detalhe);
      }
    });

    test("nenhum ponto sai da imagem (medido contra o contêiner que recorta)", async ({ page }) => {
      await page.goto(ROTA);
      const fora = await page.locator(".foto-quadro").evaluate((fig) => {
        const c = fig.getBoundingClientRect();
        return [...fig.querySelectorAll(".ponto")]
          .map((b) => ({ r: b.getBoundingClientRect(), n: b.getAttribute("aria-label") }))
          .filter(({ r }) => r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5)
          .map(({ n }) => n);
      });
      expect(fora).toEqual([]);
    });

    test("o painel aberto não cobre o ponto ativo", async ({ page }) => {
      await page.goto(ROTA);
      // O ponto mais baixo é o que o painel (folha de baixo no celular) cobriria.
      const indice = f.pontos.reduce((m, p, i, t) => (p.y > t[m].y ? i : m), 0);
      const botao = page.locator(".foto-quadro .ponto").nth(indice);
      await botao.click();
      await expect(page.locator(".painel-no")).toBeVisible();
      await expect
        .poll(async () => {
          const b = await botao.boundingBox();
          const p = await page.locator(".painel-no").boundingBox();
          if (!b || !p) return "sem caixa";
          const sobrepoe = b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y;
          return sobrepoe ? "coberto" : "livre";
        })
        .toBe("livre");
    });

    test("sem rolagem horizontal em 360 e em 1440", async ({ page }) => {
      for (const largura of [360, 1440]) {
        await page.setViewportSize({ width: largura, height: largura === 360 ? 640 : 900 });
        await page.goto(ROTA);
        const m = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(m[0], `${largura}px`).toBeLessThanOrEqual(m[1]);
      }
    });

    for (const tema of TEMAS) {
      test(`axe sem violação serious ou critical (tema ${tema}, painel aberto)`, async ({ page }) => {
        await comTema(page, tema);
        await page.goto(ROTA);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        expect(await semViolacaoGrave(page)).toEqual([]);
        await page.locator(".foto-quadro .ponto").first().click();
        expect(await semViolacaoGrave(page)).toEqual([]);
      });
    }

    test("o pulso dos pontos anima e, com movimento reduzido, para", async ({ page }) => {
      await page.goto(ROTA);
      const nome = () =>
        page.locator(".foto-quadro .ponto").first().evaluate((b) => getComputedStyle(b, "::after").animationName);
      expect(await nome()).not.toBe("none");
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await nome()).toBe("none");
    });

    test("liga às entradas do Diário de obra e não faz requisição a terceiros", async ({ page, baseURL }) => {
      const origem = new URL(baseURL ?? "http://localhost").origin;
      const externas: string[] = [];
      page.on("request", (r) => {
        const u = r.url();
        if (!u.startsWith("data:") && new URL(u).origin !== origem) externas.push(u);
      });
      await page.goto(ROTA);
      await page.waitForLoadState("networkidle");
      expect(externas).toEqual([]);
      const num = String(f.pr).padStart(3, "0");
      await expect(page.locator(`.cabeca a[href="/pedro#pr-${num}"]`)).toBeVisible();
      await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/explorar");
    });
  });
}
