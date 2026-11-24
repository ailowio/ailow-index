import { type Page, expect, test } from "@playwright/test";

/**
 * V02 (2026-11-20, ADR 007 item 1): a home v2. Duas portas de mesmo peso, "Conhecer a história" abaixo e menor,
 * contato, link secundário "Diário de obra", grade de apps abaixo e um fundo de pulso que bate onde o dedo tocou.
 * As rotas /consultoria e /educacao começaram como placeholder honesto (o conteúdo veio na V03 e na V04).
 */

const TEMAS = ["escuro", "claro"] as const;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

const PORTAS = [
  { href: "/consultoria", texto: "Fazer na minha empresa" },
  { href: "/educacao", texto: "Levar para minha instituição" },
];

test.describe("home v2: as portas", () => {
  test("duas portas, para /consultoria e /educacao, com o mesmo peso (tamanho, fonte e fundo)", async ({ page }) => {
    await page.goto("/");
    const portas = page.locator("a.porta");
    await expect(portas).toHaveCount(2);
    for (const [i, p] of PORTAS.entries()) {
      await expect(portas.nth(i)).toHaveAttribute("href", p.href);
      await expect(portas.nth(i)).toContainText(p.texto);
    }
    const m = await portas.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        const titulo = el.querySelector(".porta-titulo") as HTMLElement;
        const cs = getComputedStyle(el);
        return {
          w: r.width,
          h: r.height,
          fonte: getComputedStyle(titulo).fontSize,
          peso: getComputedStyle(titulo).fontWeight,
          fundo: cs.backgroundColor,
          borda: cs.borderInlineStartColor,
        };
      }),
    );
    expect(Math.abs(m[0].w - m[1].w), JSON.stringify(m)).toBeLessThanOrEqual(1);
    expect(Math.abs(m[0].h - m[1].h), JSON.stringify(m)).toBeLessThanOrEqual(1);
    expect(m[0].h).toBeGreaterThanOrEqual(48);
    expect(m[0].fonte).toBe(m[1].fonte);
    expect(m[0].peso).toBe(m[1].peso);
    expect(m[0].fundo).toBe(m[1].fundo);
    expect(m[0].borda).toBe(m[1].borda);
  });

  test('"Conhecer a história" fica abaixo das portas, é menor e leva ao /apresentacao', async ({ page }) => {
    await page.goto("/");
    const historia = page.getByRole("link", { name: "Conhecer a história" });
    await expect(historia).toHaveCount(1);
    await expect(historia).toHaveAttribute("href", "/apresentacao");
    const m = await page.evaluate(() => {
      const portas = [...document.querySelectorAll("a.porta")].map((el) => el.getBoundingClientRect());
      const h = document.querySelector("a.historia") as HTMLElement;
      const r = h.getBoundingClientRect();
      const fontePorta = getComputedStyle(document.querySelector(".porta-titulo") as HTMLElement).fontSize;
      return {
        topoHistoria: r.top,
        alturaHistoria: r.height,
        baseUltimaPorta: Math.max(...portas.map((p) => p.bottom)),
        alturaPorta: portas[0].height,
        fonteHistoria: Number.parseFloat(getComputedStyle(h).fontSize),
        fontePorta: Number.parseFloat(fontePorta),
      };
    });
    expect(m.topoHistoria, JSON.stringify(m)).toBeGreaterThanOrEqual(m.baseUltimaPorta);
    expect(m.alturaHistoria, JSON.stringify(m)).toBeLessThan(m.alturaPorta);
    expect(m.alturaHistoria, JSON.stringify(m)).toBeGreaterThanOrEqual(48);
    expect(m.fonteHistoria, JSON.stringify(m)).toBeLessThan(m.fontePorta);
  });

  test('o "Diário de obra" é um link secundário para /pedro, abaixo das portas', async ({ page }) => {
    await page.goto("/");
    const diario = page.locator(".home").getByRole("link", { name: "Diário de obra" });
    await expect(diario).toHaveCount(1);
    await expect(diario).toHaveAttribute("href", "/pedro");
    const topo = await diario.evaluate((el) => el.getBoundingClientRect().top);
    const base = await page.locator("a.porta").last().evaluate((el) => el.getBoundingClientRect().bottom);
    expect(topo).toBeGreaterThanOrEqual(base);
    const caixa = await diario.boundingBox();
    expect(caixa?.height).toBeGreaterThanOrEqual(48);
  });

  test("a grade de apps continua, abaixo das portas e do contato", async ({ page }) => {
    await page.goto("/");
    // V18 · 2026-11-23 · pedido do Pedro: a grade passa a 7 ícones (Trajetória).
    await expect(page.locator("a.app")).toHaveCount(7);
    const m = await page.evaluate(() => ({
      topoGrade: (document.querySelector(".grade-apps") as HTMLElement).getBoundingClientRect().top,
      baseContato: (document.querySelector(".home .botao-acao") as HTMLElement).getBoundingClientRect().bottom,
      basePortas: Math.max(...[...document.querySelectorAll("a.porta")].map((p) => p.getBoundingClientRect().bottom)),
    }));
    expect(m.topoGrade, JSON.stringify(m)).toBeGreaterThan(m.basePortas);
    expect(m.topoGrade, JSON.stringify(m)).toBeGreaterThan(m.baseContato);
  });

  test("cada porta leva à sua página em 1 toque", async ({ page }) => {
    for (const p of PORTAS) {
      await page.goto("/");
      await page.locator(`a.porta[href="${p.href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${p.href}/?$`));
    }
  });
});

/** Mede portas, contato e "Conhecer a história" contra o contêiner que recorta (.conteudo) e o rodapé. */
async function medirTopo(page: Page) {
  return page.evaluate(() => {
    const conteudo = document.querySelector(".conteudo") as HTMLElement;
    const c = conteudo.getBoundingClientRect();
    const rodape = (document.querySelector(".rodape") as HTMLElement).getBoundingClientRect();
    const alvos = [
      ...document.querySelectorAll("a.porta"),
      document.querySelector(".home .botao-acao"),
      document.querySelector("a.historia"),
    ] as HTMLElement[];
    const el = document.documentElement;
    return {
      rolagemConteudo: conteudo.scrollTop,
      sobraPagina: el.scrollHeight - el.clientHeight,
      sobraLargura: el.scrollWidth - el.clientWidth,
      topoConteudo: c.top,
      baseConteudo: c.bottom,
      topoRodape: rodape.top,
      alvos: alvos.map((a) => ({ cls: a.className, topo: a.getBoundingClientRect().top, base: a.getBoundingClientRect().bottom })),
    };
  });
}

for (const vp of [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  for (const tema of TEMAS) {
    test(`home ${vp.width}x${vp.height} (${tema}): sem rolagem, portas, contato e história inteiros acima do rodapé`, async ({
      page,
    }) => {
      await comTema(page, tema);
      await page.setViewportSize(vp);
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      const m = await medirTopo(page);
      const msg = JSON.stringify(m);
      expect(m.sobraPagina, msg).toBeLessThanOrEqual(0);
      expect(m.sobraLargura, msg).toBeLessThanOrEqual(0);
      expect(m.rolagemConteudo, msg).toBe(0);
      expect(m.alvos.length, msg).toBe(4);
      for (const a of m.alvos) {
        expect(a.topo, msg).toBeGreaterThanOrEqual(m.topoConteudo);
        expect(a.base, msg).toBeLessThanOrEqual(m.baseConteudo);
        expect(a.base, msg).toBeLessThanOrEqual(m.topoRodape);
      }
    });
  }
}

test.describe("home v2: fundo de pulso", () => {
  test("o pulso bate onde o dedo tocou", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(700);
    const alvo = await page.locator(".widget h1").boundingBox();
    if (!alvo) throw new Error("sem h1");
    const x = Math.round(alvo.x + alvo.width / 2);
    const y = Math.round(alvo.y + alvo.height / 2);
    await page.mouse.click(x, y);
    const m = await page.locator(".batida").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        anima: getComputedStyle(el).animationName,
        bate: el.classList.contains("bate"),
      };
    });
    expect(m.bate).toBe(true);
    expect(m.anima).not.toBe("none");
    expect(Math.abs(m.cx - x), JSON.stringify(m)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.cy - y), JSON.stringify(m)).toBeLessThanOrEqual(2);
  });

  test("o pulso é decorativo: escondido do leitor de tela e não captura o toque", async ({ page }) => {
    await page.goto("/");
    const b = page.locator(".batida");
    await expect(b).toHaveAttribute("aria-hidden", "true");
    expect(await b.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  });

  test("com movimento reduzido, o pulso e a entrada dos ícones não animam (estilo computado)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.mouse.click(180, 200);
    const nomes = await page.evaluate(() =>
      [
        document.querySelector(".batida") as HTMLElement,
        ...document.querySelectorAll(".batida *"),
        ...document.querySelectorAll("a.app"),
      ].map((el) => getComputedStyle(el as Element).animationName),
    );
    expect(nomes.length).toBeGreaterThan(6);
    expect(new Set(nomes)).toEqual(new Set(["none"]));
  });

  test("o JS inline da home cabe em 10 KB gzip (inclui o fundo)", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("");
    expect(scripts).toContain("pointerdown");
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/);
    const { gzipSync } = await import("node:zlib");
    expect(gzipSync(Buffer.from(scripts)).length).toBeLessThanOrEqual(10 * 1024);
  });
});

// V03 · 2026-11-20 · ADR 007 item 5: /consultoria deixou de ser placeholder (e2e/v03-consultoria.e2e.ts).
// V04 · 2026-11-20 · ADR 007 item 5: /educacao também deixou de ser placeholder (conteúdo, indexação, WhatsApp
// [educação], axe e 360 px provados em e2e/v04-educacao.e2e.ts). O teste de placeholder ficou sem rota e saiu.
