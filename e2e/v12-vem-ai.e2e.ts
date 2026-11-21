import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { urlCanonica } from "../src/config/indexacao";
import { CARDS, COLUNAS } from "../src/data/vem-ai";

/**
 * V12 (2026-11-20; ADR 007 item 5, ADR 006 item 2): /vem-ai, o quadro Em uso · Em teste · Construindo · Próximo
 * passo, com a luz de estado do Pulso (cor, padrão e palavra juntos). Em 360 px vira lista por coluna, empilhada,
 * sem carrossel; em 1440 px, 4 colunas lado a lado. Sem JS próprio.
 */

const ROTA = "/vem-ai";
const TEMAS = ["escuro", "claro"] as const;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

test.describe("/vem-ai: página e navegação", () => {
  test("responde 200, é indexável, tem canonical, título próprio e está no sitemap", async ({ page, request }) => {
    const r = await page.goto(ROTA);
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
    await expect(page).toHaveTitle(/^Vem aí: .+ \| Ailow$/);
    await expect(page.locator(".app-titulo")).toHaveText("Vem aí");
    await expect(page.locator(".construcao")).toHaveCount(0);
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
  });

  test("o Diário de obra e o /pulse levam ao Vem aí; a seta volta ao início", async ({ page }) => {
    await page.goto("/pedro");
    await page.locator('.perfil a[href="/vem-ai"]').click();
    await expect(page).toHaveURL(/\/vem-ai\/?$/);
    await page.goto("/pulse");
    await page.locator('.institucional a[href="/vem-ai"]').click();
    await expect(page).toHaveURL(/\/vem-ai\/?$/);
    await page.goto(ROTA);
    await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/");
  });

  test("sem JS próprio: nenhum script externo nem módulo na página", async ({ page }) => {
    await page.goto(ROTA);
    await expect(page.locator("script[src], script[type='module']")).toHaveCount(0);
  });
});

test.describe("/vem-ai: o quadro", () => {
  test("4 colunas, em ordem, cada uma com título, luz de estado (cor, padrão e palavra) e contagem", async ({ page }) => {
    await page.goto(ROTA);
    const colunas = page.locator(".coluna");
    await expect(colunas).toHaveCount(4);
    for (const [i, c] of COLUNAS.entries()) {
      const col = colunas.nth(i);
      await expect(col).toHaveAttribute("data-status", c.status);
      await expect(col.locator("h2")).toContainText(c.titulo);
      await expect(col.locator(".luz")).toHaveAttribute("data-luz", c.luz);
      await expect(col.locator(".luz-palavra")).toHaveText(c.sinal);
      const n = await col.locator(".card").count();
      expect(n, c.titulo).toBeGreaterThanOrEqual(1);
      await expect(col.locator(".coluna-conta")).toContainText(String(n));
    }
  });

  test("cada card está na coluna do seu status e começa pelo verbo da coluna", async ({ page }) => {
    await page.goto(ROTA);
    const cards = page.locator(".card");
    await expect(cards).toHaveCount(CARDS.length);
    for (const c of COLUNAS) {
      const frases = await page.locator(`.coluna[data-status="${c.status}"] .card-frase`).allTextContents();
      for (const f of frases) expect(f.trim().startsWith(c.verbo), f).toBe(true);
      await expect(page.locator(`.coluna[data-status="${c.status}"] .card-frase .verbo`).first()).toHaveText(c.verbo);
    }
    await expect(page.locator("#card-sensores")).toHaveAttribute("data-status", "construindo");
    await expect(page.locator("#card-firmware-v19")).toHaveAttribute("data-status", "testando");
    await expect(page.locator("#card-software-pulse")).toHaveAttribute("data-status", "proximo");
    await expect(page.locator("main")).not.toContainText(/em breve|lançamento|até dezembro|20(2[7-9]|[3-9]\d)\b|R\$/i);
  });

  test("todo card tem prova; os links levam a páginas que existem e as âncoras existem", async ({ page, request }) => {
    await page.goto(ROTA);
    for (const k of CARDS) {
      await expect(page.locator(`#card-${k.id} .card-provas a`).first(), k.id).toBeVisible();
    }
    const hrefs = await page.locator(".quadro a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThanOrEqual(CARDS.length);
    const porPagina = new Map<string, Set<string>>();
    for (const h of hrefs) {
      expect(h, h).toMatch(/^\/[a-z]/);
      const [caminho, ancora] = h.split("#");
      const r = await request.get(caminho);
      expect(r.status(), h).toBe(200);
      if (ancora) {
        if (!porPagina.has(caminho)) porPagina.set(caminho, new Set());
        porPagina.get(caminho)?.add(ancora);
      }
    }
    for (const [caminho, ancoras] of porPagina) {
      await page.goto(caminho);
      for (const a of ancoras) await expect(page.locator(`[id="${a}"]`), `${caminho}#${a}`).toHaveCount(1);
    }
  });

  test("teclado: o Tab passa por todos os links do quadro, em ordem, com foco visível", async ({ page }) => {
    await page.goto(ROTA);
    const esperados = await page.locator(".painel a, .quadro a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const vistos: string[] = [];
    // Para no último link do quadro (depois dele o Tab sai pelo rodapé e volta ao topo da página).
    for (let i = 0; i < esperados.length + 12 && vistos.length < esperados.length; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a?.closest(".painel, .quadro")) return null;
        const s = getComputedStyle(a);
        return { href: a.getAttribute("href"), contorno: Number.parseFloat(s.outlineWidth), estilo: s.outlineStyle };
      });
      if (!f) continue;
      vistos.push(f.href ?? "");
      expect(f.estilo, f.href ?? "").not.toBe("none");
      expect(f.contorno, f.href ?? "").toBeGreaterThanOrEqual(2);
    }
    expect(vistos).toEqual(esperados);
  });

  test("o painel do topo leva a cada coluna", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    for (const c of COLUNAS) {
      await expect(page.locator(`.painel a[href="#coluna-${c.status}"]`)).toHaveCount(1);
      await expect(page.locator(`#coluna-${c.status}`)).toHaveCount(1);
    }
    // O rótulo cabe sem quebrar no meio da palavra (screenshot da V12 pegou "Construind/o").
    const estouros = await page.locator(".painel-titulo").evaluateAll((ts) =>
      ts.filter((t) => t.scrollWidth > t.clientWidth + 0.5 || getComputedStyle(t).overflowWrap !== "normal").map((t) => t.textContent),
    );
    expect(estouros).toEqual([]);
    await page.locator('.painel a[href="#coluna-proximo"]').click();
    await expect(page.locator("#coluna-proximo h2")).toBeInViewport();
  });
});

test.describe("/vem-ai: layout, acessibilidade e movimento", () => {
  for (const tema of TEMAS) {
    test(`tema ${tema}: axe sem violações graves`, async ({ page }) => {
      await comTema(page, tema);
      await page.goto(ROTA);
      await page.evaluate(() => document.fonts.ready);
      const r = await new AxeBuilder({ page }).analyze();
      const graves = r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(graves).toEqual([]);
    });

    for (const largura of [360, 375, 1440]) {
      test(`tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner nem fica sob o rodapé`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 900 });
        await comTema(page, tema);
        await page.goto(ROTA);
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const c = document.querySelector(".conteudo") as HTMLElement;
          const caixa = c.getBoundingClientRect();
          const fora = [...c.querySelectorAll(".vem-ai *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5);
            })
            .map((el) => `${el.tagName}.${el.className}`);
          const transbordam = [...c.querySelectorAll(".vem-ai *")]
            .filter((el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
            .map((el) => `${el.tagName}.${el.className}`);
          c.scrollTop = c.scrollHeight;
          const ultimo = [...document.querySelectorAll(".card-provas a")].pop() as HTMLElement;
          const rodape = document.querySelector("footer, .rodape");
          const topoRodape = rodape ? rodape.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
          return {
            w: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            cW: c.scrollWidth,
            cCW: c.clientWidth,
            fora,
            transbordam,
            fimUltimo: ultimo.getBoundingClientRect().bottom,
            limite: Math.min(topoRodape, caixa.bottom),
          };
        });
        expect(m.w).toBeLessThanOrEqual(m.cw);
        expect(m.cW).toBeLessThanOrEqual(m.cCW);
        expect(m.fora).toEqual([]);
        expect(m.transbordam, "nenhum carrossel nem rolagem lateral dentro do quadro").toEqual([]);
        expect(m.fimUltimo).toBeLessThanOrEqual(m.limite + 0.5);
        const titulo = await page.locator(".app-titulo").evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(titulo).toBeLessThanOrEqual(0);
      });
    }
  }

  test("360 px: as colunas empilham (lista por coluna); 1440 px: as 4 lado a lado", async ({ page }) => {
    const topos = async () =>
      page.locator(".coluna").evaluateAll((cs) => cs.map((c) => ({ topo: c.getBoundingClientRect().top, fim: c.getBoundingClientRect().bottom, esq: c.getBoundingClientRect().left })));
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const p = await topos();
    for (let i = 1; i < p.length; i++) {
      expect(p[i].topo).toBeGreaterThanOrEqual(p[i - 1].fim - 0.5);
      expect(Math.abs(p[i].esq - p[0].esq)).toBeLessThan(1);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROTA);
    const g = await topos();
    for (let i = 1; i < g.length; i++) {
      expect(Math.abs(g[i].topo - g[0].topo)).toBeLessThan(1);
      expect(g[i].esq).toBeGreaterThan(g[i - 1].esq);
    }
  });

  test("links do painel e das provas com alvo de toque de 48 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const alturas = await page.locator(".painel a, .card-provas a").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height));
    expect(alturas.length).toBeGreaterThanOrEqual(COLUNAS.length + CARDS.length);
    for (const h of alturas) expect(h).toBeGreaterThanOrEqual(47.5);
  });

  test("prefers-reduced-motion: nada anima na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROTA);
    const animados = await page.evaluate(() =>
      [...document.querySelectorAll(".vem-ai *")]
        .filter((el) => {
          const s = getComputedStyle(el);
          return (s.animationName !== "" && s.animationName !== "none") || Number.parseFloat(s.transitionDuration) > 0.001;
        })
        .map((el) => `${el.tagName}.${el.className}`),
    );
    expect(animados).toEqual([]);
    const rolagem = await page.locator(".conteudo").evaluate((c) => getComputedStyle(c).scrollBehavior);
    expect(rolagem).not.toBe("smooth");
  });
});
