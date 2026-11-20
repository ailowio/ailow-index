import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { APPS } from "../src/config/apps";
import { urlCanonica } from "../src/config/indexacao";
import { entrevistas } from "../src/data/entrevistas";
import { DEGRAUS } from "../src/data/na-tv";

/**
 * V07 (2026-11-20, ADR 007 item 5; ADR 005): /na-tv. Escada UFC -> Record -> afiliada Globo em tarjas de TV,
 * teasers P1 e P2 no degrau da UFC, chips que levam o player ao início da resposta, legenda grande fora do quadro,
 * 0 byte de vídeo antes do toque e o 301 de /pedro/entrevistas.
 */

const ROTA = "/na-tv";
const TEMAS = ["escuro", "claro"] as const;
const P2 = "teaser-p2-teoria-na-pratica";
const chipsP2 = DEGRAUS[0].teasers.find((t) => t.slug === P2)?.chips ?? [];

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

type Vigia = { __t: number | null; __leg: string | null };

/** Guarda, na página, o currentTime no primeiro `playing` depois do toque e a primeira fala da legenda grande. */
async function vigiarPlaying(page: Page, id: string) {
  await page.evaluate((idv) => {
    const w = window as unknown as Vigia;
    const v = document.getElementById(idv) as HTMLVideoElement;
    const caixa = document.querySelector(`[data-legenda="${idv}"]`) as HTMLElement;
    w.__t = null;
    w.__leg = null;
    v.addEventListener("playing", () => (w.__t = v.currentTime), { once: true });
    const obs = new MutationObserver(() => {
      if (w.__leg === null && caixa.textContent) {
        w.__leg = caixa.textContent;
        obs.disconnect();
      }
    });
    obs.observe(caixa, { childList: true, characterData: true, subtree: true });
  }, id);
}

const lidoNoPlaying = (page: Page) => page.evaluate(() => (window as unknown as Vigia).__t);
const primeiraFala = (page: Page) => page.evaluate(() => (window as unknown as Vigia).__leg);

test.describe("/na-tv: página e navegação", () => {
  test("responde 200, é indexável, tem canonical, título e descrição próprios, e está no sitemap", async ({ page, request }) => {
    const r = await page.goto(ROTA);
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
    await expect(page).toHaveTitle("Na TV: entrevistas e reportagens com Pedro Fernandes | Ailow");
    await expect(page.locator(".construcao")).toHaveCount(0);
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
    expect(xml).not.toContain("/pedro/entrevistas/");
  });

  test("/pedro/entrevistas leva a /na-tv (no build: meta refresh noindex; o 301 é do nginx)", async ({ page, request }) => {
    const html = await (await request.get("/pedro/entrevistas", { maxRedirects: 0 })).text();
    expect(html).toMatch(/<meta http-equiv="refresh" content="0;url=\/na-tv">/);
    expect(html).toContain('<meta name="robots" content="noindex">');
    await page.goto("/pedro/entrevistas");
    await expect(page).toHaveURL(/\/na-tv\/?$/);
    await expect(page.locator(".escada-tv")).toBeVisible();
  });

  test("o ícone de entrevista da home e o link do /pedro abrem /na-tv; a seta volta ao início", async ({ page }) => {
    const app = APPS.find((a) => a.id === "entrevistas");
    expect(app?.rota).toBe(ROTA);
    await page.goto("/pedro");
    await expect(page.locator('.perfil a[href="/na-tv"]')).toHaveCount(1);
    await page.goto("/");
    await page.locator('a.app[href="/na-tv"]').click();
    await expect(page).toHaveURL(/\/na-tv\/?$/);
    await expect(page.locator(".app-titulo")).toHaveText("Na TV");
    await page.goto(ROTA);
    await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/");
  });
});

test.describe("/na-tv: escada e tarjas", () => {
  test("3 degraus em ordem de subida, cada um com o veículo, a data e a prova no Diário de obra", async ({ page }) => {
    await page.goto(ROTA);
    const degraus = page.locator(".escada-tv > li");
    await expect(degraus).toHaveCount(3);
    for (const [i, d] of DEGRAUS.entries()) {
      const e = entrevistas.find((x) => x.feed === d.feed);
      const li = degraus.nth(i);
      await expect(li.locator(".gc-veiculo")).toHaveText(e?.veiculo ?? "");
      await expect(li.locator(".gc-chapeu")).toContainText(`Degrau ${i + 1} de 3`);
      await expect(li.locator("time")).toHaveAttribute("datetime", e?.data ?? "");
      await expect(li.locator("a.prova")).toHaveAttribute("href", `/pedro/#pr-${String(d.feed).padStart(3, "0")}`);
    }
  });

  test("sem logo de emissora: nenhuma imagem na escada; tarja só em texto", async ({ page }) => {
    await page.goto(ROTA);
    await expect(page.locator(".escada-tv img")).toHaveCount(0);
    const fontes = await page.locator("img").evaluateAll((is) => is.map((i) => (i as HTMLImageElement).src));
    expect(fontes.filter((s) => s.includes("/entrevistas/"))).toEqual([]);
  });

  test("teasers só no degrau da UFC; Record e afiliada Globo sem vídeo; sem iframe e sem 'em breve'", async ({ page }) => {
    await page.goto(ROTA);
    const degraus = page.locator(".escada-tv > li");
    await expect(degraus.nth(0).locator("video")).toHaveCount(2);
    await expect(degraus.nth(1).locator("video")).toHaveCount(0);
    await expect(degraus.nth(2).locator("video")).toHaveCount(0);
    await expect(page.locator("iframe, .fachada-youtube")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/em breve/i);
    for (const v of await page.locator("video").all()) {
      await expect(v).toHaveAttribute("preload", "none");
      await expect(v).toHaveAttribute("poster", /\/midia\/teaser-p[12]-[a-z-]+\/poster\.webp$/);
      await expect(v.locator('track[kind="captions"]')).toHaveAttribute("src", /legenda\.vtt$/);
    }
  });
});

test.describe("/na-tv: vídeo, chips e teclado", () => {
  test("0 byte de vídeo e 0 terceiros antes do toque (mesmo rolando a página toda)", async ({ page, baseURL }) => {
    const origem = new URL(baseURL ?? "http://localhost").origin;
    const videos: string[] = [];
    const terceiros: string[] = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/\.(mp4|webm)(\?|$)/i.test(u) || r.resourceType() === "media") videos.push(u);
      if (!u.startsWith("data:") && !u.startsWith("blob:") && new URL(u).origin !== origem) terceiros.push(u);
    });
    await page.goto(ROTA);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      const c = document.querySelector(".conteudo") as HTMLElement;
      c.scrollTop = c.scrollHeight;
    });
    await page.waitForTimeout(500);
    expect(videos, "nenhuma requisição de vídeo antes do toque").toEqual([]);
    expect(terceiros).toEqual([]);
  });

  for (const c of chipsP2) {
    test(`chip "${c.pergunta}" leva o player a ${c.inicio}s (± 0,5 s) e a legenda grande mostra a fala`, async ({ page }) => {
      await page.goto(ROTA);
      const id = `player-${P2}`;
      await vigiarPlaying(page, id);
      await page.locator(`button[data-alvo="${id}"][data-t="${c.inicio}"]`).click();
      await expect.poll(() => lidoNoPlaying(page), { timeout: 15_000 }).not.toBeNull();
      expect(Math.abs(((await lidoNoPlaying(page)) as number) - c.inicio)).toBeLessThanOrEqual(0.5);
      await expect.poll(() => primeiraFala(page), { timeout: 5000 }).not.toBeNull();
      expect(await primeiraFala(page)).toMatch(new RegExp(`^${c.trecho.split(" ")[0]}`));
    });
  }

  test("teclado: Tab chega ao chip com foco visível e Enter leva o player ao tempo certo", async ({ page }) => {
    await page.goto(ROTA);
    const id = `player-${P2}`;
    const alvo = chipsP2[1];
    const chip = page.locator(`button[data-alvo="${id}"][data-t="${alvo.inicio}"]`);
    // Do elemento anterior (último chip do P1, já focado pela página), um Tab por vez até o chip.
    await page.locator("button[data-alvo]").first().focus();
    for (let i = 0; i < 40 && !(await chip.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(chip).toBeFocused();
    const contorno = await chip.evaluate((el) => {
      const s = getComputedStyle(el);
      return { estilo: s.outlineStyle, largura: Number.parseFloat(s.outlineWidth), visivel: el.matches(":focus-visible") };
    });
    expect(contorno.visivel).toBe(true);
    expect(contorno.estilo).toBe("solid");
    expect(contorno.largura).toBeGreaterThanOrEqual(2);
    await vigiarPlaying(page, id);
    await page.keyboard.press("Enter");
    await expect.poll(() => lidoNoPlaying(page), { timeout: 15_000 }).not.toBeNull();
    expect(Math.abs(((await lidoNoPlaying(page)) as number) - alvo.inicio)).toBeLessThanOrEqual(0.5);
  });

  test("um vídeo por vez: tocar o P1 pausa o P2", async ({ page }) => {
    await page.goto(ROTA);
    const p2 = `player-${P2}`;
    await vigiarPlaying(page, p2);
    await page.locator(`button[data-alvo="${p2}"]`).first().click();
    await expect.poll(() => lidoNoPlaying(page), { timeout: 15_000 }).not.toBeNull();
    await page.locator('button[data-alvo="player-teaser-p1-improvisar-sob-pressao"]').first().click();
    await expect.poll(() => page.locator(`#${p2}`).evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
  });

  test("legenda grande: fonte ≥ 20 px e a nativa fica escondida (não cai sobre a legenda queimada)", async ({ page }) => {
    await page.goto(ROTA);
    const tam = await page.locator(".legenda-tv").first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(tam).toBeGreaterThanOrEqual(20);
    const modos = await page.locator("video").evaluateAll((vs) => vs.map((v) => (v as HTMLVideoElement).textTracks[0]?.mode));
    expect(modos).toEqual(["hidden", "hidden"]);
  });
});

test.describe("/na-tv: layout, acessibilidade e movimento", () => {
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
          const fora = [...c.querySelectorAll(".na-tv *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5);
            })
            .map((el) => `${el.tagName}.${el.className}`);
          // Último elemento rolado até o fim: tem de terminar acima do rodapé (o que fica por cima).
          c.scrollTop = c.scrollHeight;
          const ultimo = document.querySelector(".escada-tv > li:last-child .prova") as HTMLElement;
          const rodape = document.querySelector("footer, .rodape");
          const topoRodape = rodape ? rodape.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
          return {
            w: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            cW: c.scrollWidth,
            cCW: c.clientWidth,
            fora,
            fimUltimo: ultimo.getBoundingClientRect().bottom,
            limite: Math.min(topoRodape, caixa.bottom),
          };
        });
        expect(m.w).toBeLessThanOrEqual(m.cw);
        expect(m.cW).toBeLessThanOrEqual(m.cCW);
        expect(m.fora).toEqual([]);
        expect(m.fimUltimo).toBeLessThanOrEqual(m.limite + 0.5);
      });
    }
  }

  test("chips com alvo de toque de 48 px e empilhados em 360 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const caixas = await page.locator(".chip-tv").evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().toJSON()));
    expect(caixas.length).toBe(8);
    for (const c of caixas) expect(c.height).toBeGreaterThanOrEqual(47.5);
    const primeiroGrupo = caixas.slice(0, 4);
    for (let i = 1; i < primeiroGrupo.length; i++) expect(primeiroGrupo[i].top).toBeGreaterThan(primeiroGrupo[i - 1].top);
  });

  test("prefers-reduced-motion: nada anima na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROTA);
    const animados = await page.evaluate(() =>
      [...document.querySelectorAll(".na-tv *")]
        .filter((el) => {
          const s = getComputedStyle(el);
          // <source>/<track> não são renderizados: estilo computado vazio.
          return (s.animationName !== "" && s.animationName !== "none") || Number.parseFloat(s.transitionDuration) > 0.001;
        })
        .map((el) => `${el.tagName}.${el.className}: ${getComputedStyle(el).animationName} ${getComputedStyle(el).transitionDuration}`),
    );
    expect(animados).toEqual([]);
  });
});
