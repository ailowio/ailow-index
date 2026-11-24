import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { urlCanonica } from "../src/config/indexacao";
import { DESTAQUES, MARCOS } from "../src/data/trajetoria";

/**
 * V18 (2026-11-23, pedido do Pedro): /trajetoria, a linha do tempo que se desenha com a rolagem (nativa: nada de
 * sequestrar roda do mouse ou toque). Sem JS ou com movimento reduzido: tudo visível e o traço inteiro. Com CSS
 * scroll-driven: a rolagem desenha o traço e revela as paradas; sem ele, o IntersectionObserver faz o mesmo.
 * Mobile: traço à esquerda; >= 1280 px: traço no centro e paradas alternando os lados.
 */

const ROTA = "/trajetoria";
const TEMAS = ["escuro", "claro"] as const;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

/** Força o caminho sem CSS scroll-driven (o do Firefox e do Safari antigo) no Chromium. */
async function semScrollDriven(page: Page) {
  await page.addInitScript(() => {
    const original = CSS.supports.bind(CSS);
    CSS.supports = ((...a: [string, string?]) =>
      a.join(":").includes("animation-timeline") ? false : original(...(a as [string]))) as typeof CSS.supports;
  });
}

/** Estado medido: traço desenhado (0–100), paradas reveladas (clip-path sem %) e o contador. */
async function medir(page: Page) {
  return page.evaluate(() => {
    const traco = document.querySelector("[data-traco]") as SVGPathElement;
    // Revelada = sem recorte, ou recorte cuja parte em % (a que esconde o cartão de baixo para cima) já é 0.
    // No fim da animação o Chrome serializa "calc(0% - 12px)": o 0% conta como revelado.
    const revelada = (p: Element) => {
      const c = getComputedStyle(p.querySelector(".cartao") as Element).clipPath;
      const pct = /(-?\d+(?:\.\d+)?)%/.exec(c);
      return c === "none" || !pct || Number(pct[1]) === 0;
    };
    const paradas = [...document.querySelectorAll(".parada")];
    return {
      desenhado: 100 - Number.parseFloat(getComputedStyle(traco).strokeDashoffset),
      ultima: revelada(paradas.at(-1) as Element),
      reveladas: paradas.filter(revelada).length,
      total: paradas.length,
      contador: (document.querySelector("[data-contador-n]") as HTMLElement).textContent,
      classe: (document.querySelector("[data-trajetoria]") as HTMLElement).className,
    };
  });
}

async function rolarAoFim(page: Page) {
  // Rola em passos, como a pessoa (a rolagem é a nativa do contêiner).
  for (let i = 0; i < 60; i++) {
    const fim = await page.locator(".conteudo").evaluate((c) => {
      c.scrollBy(0, c.clientHeight * 0.8);
      return c.scrollTop + c.clientHeight >= c.scrollHeight - 1;
    });
    await page.waitForTimeout(30);
    if (fim) break;
  }
  await page.waitForTimeout(500);
}

test.describe("/trajetoria: página e navegação", () => {
  test("responde 200, é indexável, tem canonical, título próprio e está no sitemap", async ({ page, request }) => {
    const r = await page.goto(ROTA);
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
    await expect(page).toHaveTitle(/^Trajetória: .+ \| Ailow$/);
    await expect(page.locator(".app-titulo")).toHaveText("Trajetória");
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
  });

  test("o tile da home leva à rota em 1 toque", async ({ page }) => {
    await page.goto("/");
    await page.locator(`a.app[href="${ROTA}"]`).click();
    await expect(page).toHaveURL(/\/trajetoria\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Trajetória" })).toBeVisible();
  });

  test("a /apresentacao, o /sobre e o Diário de obra levam à Trajetória", async ({ page }) => {
    for (const [rota, seletor] of [
      ["/apresentacao", ".caminho"],
      ["/sobre", ".provas"],
      ["/pedro", ".perfil"],
    ] as const) {
      await page.goto(rota);
      await page.locator(`${seletor} a[href="${ROTA}"]`).click();
      await expect(page, rota).toHaveURL(/\/trajetoria\/?$/);
    }
  });

  test("zero requisição a terceiros, do topo ao fim da rolagem", async ({ page, baseURL }) => {
    const origem = new URL(baseURL as string).origin;
    const externas: string[] = [];
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return;
      if (u.origin !== origem) externas.push(req.url());
    });
    await page.goto(ROTA, { waitUntil: "networkidle" });
    await rolarAoFim(page);
    expect(externas).toEqual([]);
  });
});

test.describe("/trajetoria: o caminho", () => {
  test("marcos, destaques e ferramentas do feed estão no caminho (HeyGen e ElevenLabs entre elas)", async ({ page }) => {
    await page.goto(ROTA);
    await expect(page.locator(".parada.marco")).toHaveCount(MARCOS.length);
    await expect(page.locator(".parada.destaque")).toHaveCount(DESTAQUES.length);
    for (const id of ["heygen", "elevenlabs", "n8n", "supabase", "cursor", "claude-code"]) {
      await expect(page.locator(`.tj-chip[data-ferramenta="${id}"]`), id).toHaveCount(1);
    }
    await expect(page.locator('.destaque:has(a[href="/pedro#pr-071"]) .tj-chip[data-ferramenta="heygen"]')).toHaveCount(1);
    await expect(page.locator('.destaque:has(a[href="/pedro#pr-082"]) .tj-chip[data-ferramenta="elevenlabs"]')).toHaveCount(1);
    const total = await page.locator("[data-total]").textContent();
    expect(await page.locator(".tj-chip").count()).toBe(Number(total));
    await expect(page.locator("main")).not.toContainText(/R\$|\d\s*%|ilo\./);
  });

  test("os anos estão em ordem e cada parada tem data", async ({ page }) => {
    await page.goto(ROTA);
    const anos = await page.locator(".ano-rotulo").allTextContents();
    const n = anos.map((a) => Number(a.trim()));
    expect(n).toEqual([...n].sort((a, b) => a - b));
    expect(n[0]).toBe(2014);
    const datas = await page.locator(".parada time").evaluateAll((ts) => ts.map((t) => t.getAttribute("datetime") ?? ""));
    expect(datas.length).toBe(await page.locator(".parada").count());
    const chave = (d: string) => (d.length === 4 ? `${d}-00` : d);
    expect(datas.map(chave)).toEqual([...datas.map(chave)].sort());
  });

  test("os links levam a páginas que existem e as âncoras do Diário de obra existem", async ({ page, request }) => {
    await page.goto(ROTA);
    const hrefs = [...new Set(await page.locator(".caminho a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? "")))];
    const ancoras = new Set<string>();
    for (const h of hrefs) {
      expect(h, h).toMatch(/^\/[a-z]/);
      const [caminho, ancora] = h.split("#");
      if (ancora) ancoras.add(ancora);
      else expect((await request.get(caminho as string)).status(), h).toBe(200);
    }
    await page.goto("/pedro");
    for (const a of ancoras) await expect(page.locator(`[id="${a}"]`), a).toHaveCount(1);
  });

  test("rolar revela as paradas, o traço avança e o contador acompanha (CSS scroll-driven)", async ({ page }) => {
    await page.goto(ROTA);
    await page.waitForTimeout(300);
    const topo = await medir(page);
    expect(topo.classe).toContain("nativo");
    // No topo a 1ª parada ainda está entrando pela borda de baixo (360 px): o que vale é haver parada escondida.
    expect(topo.reveladas).toBeLessThan(topo.total);
    expect(topo.ultima).toBe(false);
    await rolarAoFim(page);
    const fim = await medir(page);
    expect(fim.ultima).toBe(true);
    expect(fim.reveladas).toBe(fim.total);
    expect(fim.desenhado).toBeGreaterThan(topo.desenhado + 50);
    expect(fim.desenhado).toBeGreaterThan(99);
    expect(Number(fim.contador)).toBeGreaterThan(Number(topo.contador));
    expect(fim.contador).toBe(await page.locator("[data-total]").textContent());
  });

  test("sem CSS scroll-driven, o IntersectionObserver revela as paradas e leva o traço adiante", async ({ page }) => {
    await semScrollDriven(page);
    await page.goto(ROTA);
    await page.waitForTimeout(500);
    const topo = await medir(page);
    expect(topo.classe).toContain("anima");
    expect(topo.classe).not.toContain("nativo");
    // No topo a 1ª parada ainda está entrando pela borda de baixo (360 px): o que vale é haver parada escondida.
    expect(topo.reveladas).toBeLessThan(topo.total);
    expect(topo.ultima).toBe(false);
    await rolarAoFim(page);
    const fim = await medir(page);
    expect(fim.ultima).toBe(true);
    expect(fim.reveladas).toBe(fim.total);
    expect(fim.desenhado).toBeGreaterThan(topo.desenhado + 50);
    expect(fim.contador).toBe(await page.locator("[data-total]").textContent());
  });

  test("prefers-reduced-motion: tudo visível, traço inteiro, nada anima", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROTA);
    const m = await medir(page);
    expect(m.reveladas).toBe(m.total);
    expect(m.desenhado).toBe(100);
    const animados = await page.evaluate(() =>
      [...document.querySelectorAll(".trajetoria *")]
        .filter((el) => {
          const s = getComputedStyle(el);
          return (s.animationName !== "" && s.animationName !== "none") || Number.parseFloat(s.transitionDuration) > 0.001 || s.translate !== "none" || s.scale !== "none";
        })
        .map((el) => `${el.tagName}.${el.getAttribute("class")}`),
    );
    expect(animados).toEqual([]);
    const rolagem = await page.locator(".conteudo").evaluate((c) => [getComputedStyle(c).scrollBehavior, getComputedStyle(c).scrollSnapType]);
    expect(rolagem).toEqual(["auto", "none"]);
  });

  test.describe("sem JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("tudo visível, traço inteiro e o contador escondido (ele só faz sentido com a rolagem)", async ({ page }) => {
      await page.goto(ROTA);
      const m = await medir(page);
      expect(m.reveladas).toBe(m.total);
      expect(m.desenhado).toBe(100);
      await expect(page.locator("[data-contador]")).toBeHidden();
    });
  });
});

test.describe("/trajetoria: layout, teclado e acessibilidade", () => {
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

    for (const [largura, altura] of [
      [360, 640],
      [1440, 900],
    ]) {
      test(`tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner nem fica sob o rodapé`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: altura });
        await comTema(page, tema);
        await page.goto(ROTA);
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const c = document.querySelector(".conteudo") as HTMLElement;
          const caixa = c.getBoundingClientRect();
          const fora = [...c.querySelectorAll(".trajetoria *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5);
            })
            .map((el) => `${el.tagName}.${el.getAttribute("class")}`);
          const transbordam = [...c.querySelectorAll(".trajetoria *")]
            .filter((el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
            .map((el) => `${el.tagName}.${el.getAttribute("class")}`);
          const textos = [...c.querySelectorAll(".parada-titulo, .tj-chip, .parada-meta")]
            .filter((el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1)
            .map((el) => el.textContent);
          c.scrollTop = c.scrollHeight;
          const ultimo = [...document.querySelectorAll(".tj-links a")].pop() as HTMLElement;
          const rodape = document.querySelector(".rodape");
          const topoRodape = rodape ? rodape.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
          return {
            w: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            cW: c.scrollWidth,
            cCW: c.clientWidth,
            fora,
            transbordam,
            textos,
            fimUltimo: ultimo.getBoundingClientRect().bottom,
            limite: Math.min(topoRodape, caixa.bottom),
          };
        });
        expect(m.w).toBeLessThanOrEqual(m.cw);
        expect(m.cW).toBeLessThanOrEqual(m.cCW);
        expect(m.fora).toEqual([]);
        expect(m.transbordam).toEqual([]);
        expect(m.textos).toEqual([]);
        expect(m.fimUltimo).toBeLessThanOrEqual(m.limite + 0.5);
        const titulo = await page.locator(".app-titulo").evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(titulo).toBeLessThanOrEqual(0);
      });
    }
  }

  test("360 px: o traço fica à esquerda e todas as paradas à direita dele; 1440 px: no centro, lados alternados", async ({ page }) => {
    const medirLados = () =>
      page.evaluate(() => {
        const t = (document.querySelector(".trilha") as Element).getBoundingClientRect();
        const eixo = t.left + t.width / 2;
        return {
          eixo,
          centro: (document.querySelector(".caminho") as Element).getBoundingClientRect(),
          paradas: [...document.querySelectorAll(".parada")].map((p) => {
            const r = p.getBoundingClientRect();
            const pt = (p.querySelector(".ponto") as Element).getBoundingClientRect();
            return { esq: r.left, dir: r.right, ponto: pt.left + pt.width / 2, lado: p.getAttribute("data-lado") };
          }),
        };
      });
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const m = await medirLados();
    for (const p of m.paradas) {
      expect(p.esq).toBeGreaterThan(m.eixo);
      expect(Math.abs(p.ponto - m.eixo)).toBeLessThan(1.5);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROTA);
    const g = await medirLados();
    expect(Math.abs(g.eixo - (g.centro.left + g.centro.width / 2))).toBeLessThan(2);
    for (const p of g.paradas) {
      if (p.lado === "esq") expect(p.dir).toBeLessThan(g.eixo);
      else expect(p.esq).toBeGreaterThan(g.eixo);
      expect(Math.abs(p.ponto - g.eixo)).toBeLessThan(1.5);
    }
    expect(new Set(g.paradas.map((p) => p.lado))).toEqual(new Set(["esq", "dir"]));
  });

  test("links com alvo de toque de 48 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const alturas = await page.locator(".trajetoria a").evaluateAll((as) => as.map((a) => [a.textContent, a.getBoundingClientRect().height] as const));
    for (const [texto, h] of alturas) expect(h, texto ?? "").toBeGreaterThanOrEqual(47.5);
  });

  for (const modo of ["scroll-driven", "IntersectionObserver"] as const) {
  test(`teclado (${modo}): o Tab chega a todos os links, em ordem, com foco visível, sem ficar sob o contador nem recortado`, async ({ page }) => {
    if (modo === "IntersectionObserver") await semScrollDriven(page);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const esperados = await page.locator(".trajetoria a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const vistos: string[] = [];
    for (let i = 0; i < esperados.length + 12 && vistos.length < esperados.length; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a?.closest(".trajetoria")) return null;
        const s = getComputedStyle(a);
        const r = a.getBoundingClientRect();
        const cont = (document.querySelector("[data-contador]") as HTMLElement).getBoundingClientRect();
        const c = (document.querySelector(".conteudo") as HTMLElement).getBoundingClientRect();
        const cartao = a.closest(".cartao");
        const clip = cartao ? getComputedStyle(cartao).clipPath : "none";
        return {
          href: a.getAttribute("href"),
          contorno: Number.parseFloat(s.outlineWidth),
          estilo: s.outlineStyle,
          topo: r.top,
          base: r.bottom,
          baseContador: cont.bottom,
          baseConteudo: c.bottom,
          recortado: clip !== "none" && Number(/(-?\d+(?:\.\d+)?)%/.exec(clip)?.[1] ?? 0) !== 0,
        };
      });
      if (!f) continue;
      vistos.push(f.href ?? "");
      const rotulo = f.href ?? "";
      expect(f.estilo, rotulo).not.toBe("none");
      expect(f.contorno, rotulo).toBeGreaterThanOrEqual(2);
      expect(f.topo, rotulo).toBeGreaterThanOrEqual(f.baseContador - 0.5);
      expect(f.base, rotulo).toBeLessThanOrEqual(f.baseConteudo + 0.5);
      expect(f.recortado, rotulo).toBe(false);
    }
    expect(vistos).toEqual(esperados);
    // Voltando (Shift+Tab), o link sobe pela borda de cima: é aí que o contador fixo poderia cobri-lo.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Shift+Tab");
      const v = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a?.closest(".caminho")) return null;
        const cont = (document.querySelector("[data-contador]") as HTMLElement).getBoundingClientRect();
        return { href: a.getAttribute("href"), topo: a.getBoundingClientRect().top, baseContador: cont.bottom };
      });
      if (v) expect(v.topo, `Shift+Tab ${v.href}`).toBeGreaterThanOrEqual(v.baseContador - 0.5);
    }
  });
  }
});
