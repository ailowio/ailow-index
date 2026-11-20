import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { urlCanonica } from "../src/config/indexacao";
import { EPISODIOS, ETAPAS_RELATORIO } from "../src/data/chao-de-fabrica";

/**
 * V08 (2026-11-20; ADR 007 item 5, ADR 005, ADR 006): /chao-de-fabrica. Episódios #1 e #2 com vídeo (0 byte antes
 * do toque, pôster, .vtt, selo de voz gerada por IA), #3 como relatório de campo, links para as entradas do Diário
 * de obra e "em validação" onde a colheita contradiz. Inclui o detalhe da caixa de legenda (também na /na-tv):
 * antes do play ela não reserva duas linhas vazias.
 */

const ROTA = "/chao-de-fabrica";
const TEMAS = ["escuro", "claro"] as const;
const rotulo = (n: number) => `#${String(n).padStart(3, "0")}`;

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

/** Altura da primeira caixa de legenda e o mínimo de 2 linhas da fala (2 × line-height). */
async function medirLegenda(page: Page) {
  return page.locator(".legenda-tv").first().evaluate((el) => {
    const s = getComputedStyle(el);
    const lh = Number.parseFloat(s.lineHeight);
    return { altura: el.getBoundingClientRect().height, duasLinhas: 2 * lh };
  });
}

test.describe("/chao-de-fabrica: página e navegação", () => {
  test("responde 200, é indexável, tem canonical, título próprio e está no sitemap", async ({ page, request }) => {
    const r = await page.goto(ROTA);
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica(ROTA));
    await expect(page).toHaveTitle(/^Chão de Fábrica: .+ \| Ailow$/);
    await expect(page.locator(".app-titulo")).toHaveText("Chão de Fábrica");
    await expect(page.locator(".construcao")).toHaveCount(0);
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica(ROTA)}</loc>`);
  });

  test("o Diário de obra e a /na-tv levam ao Chão de Fábrica; a seta volta ao início", async ({ page }) => {
    await page.goto("/pedro");
    await page.locator('.perfil a[href="/chao-de-fabrica"]').click();
    await expect(page).toHaveURL(/\/chao-de-fabrica\/?$/);
    await page.goto("/na-tv");
    await expect(page.locator('a[href="/chao-de-fabrica"]')).toHaveCount(1);
    await page.goto(ROTA);
    await expect(page.locator("[data-voltar]")).toHaveAttribute("href", "/");
  });
});

test.describe("/chao-de-fabrica: episódios", () => {
  test("3 episódios em ordem, com número, título e data; sumário leva a cada um", async ({ page }) => {
    await page.goto(ROTA);
    const eps = page.locator(".episodio");
    await expect(eps).toHaveCount(3);
    for (const [i, e] of EPISODIOS.entries()) {
      const ep = eps.nth(i);
      await expect(ep).toHaveAttribute("id", `ep-${e.numero}`);
      await expect(ep.locator(".ep-titulo")).toHaveText(e.titulo);
      await expect(ep.locator(".ep-numero")).toContainText(`#${e.numero}`);
      await expect(ep.locator("time").first()).toHaveAttribute("datetime", e.data);
      await expect(page.locator(`.sumario a[href="#ep-${e.numero}"]`)).toHaveCount(1);
    }
    await expect(page.locator("main")).not.toContainText(/em breve|#\s?4\b/i);
  });

  test("#1 e #2 com vídeo (preload none, pôster, .vtt) e selo de voz gerada por IA; #3 sem vídeo", async ({ page }) => {
    await page.goto(ROTA);
    const eps = page.locator(".episodio");
    for (const i of [0, 1]) {
      const ep = eps.nth(i);
      const pacote = EPISODIOS[i].video?.pacote;
      const v = ep.locator("video");
      await expect(v).toHaveCount(1);
      await expect(v).toHaveAttribute("preload", "none");
      await expect(v).toHaveAttribute("poster", `/midia/${pacote}/poster.webp`);
      await expect(v.locator('track[kind="captions"]')).toHaveAttribute("src", `/midia/${pacote}/legenda.vtt`);
      await expect(ep.locator(".selo-ia")).toContainText(/voz gerada por IA/);
    }
    await expect(eps.nth(2).locator("video")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("#3 é relatório de campo: sintoma, hipótese, o que era, decisão, estado (em ordem)", async ({ page }) => {
    await page.goto(ROTA);
    const etapas = page.locator("#ep-3 .relatorio dt");
    await expect(etapas).toHaveText([...ETAPAS_RELATORIO]);
    await expect(page.locator("#ep-3 .relatorio dd").last()).toContainText(/em validação/i);
  });

  test("'em validação' onde a colheita contradiz: a implantação (#2) e a v1.9 (#3)", async ({ page }) => {
    await page.goto(ROTA);
    for (const id of ["#ep-2", "#ep-3"]) {
      await expect(page.locator(`${id} .estado-em-validacao`).first()).toBeVisible();
      await expect(page.locator(`${id} .estado-em-validacao`).first()).toContainText(/em validação/i);
    }
    await expect(page.locator("main")).not.toContainText(/todas as máquinas|implantação (está )?concluída/i);
  });

  test("cada episódio liga às suas entradas do Diário de obra, e as âncoras existem no /pedro", async ({ page }) => {
    await page.goto(ROTA);
    const alvos = new Set<string>();
    for (const e of EPISODIOS) {
      for (const n of e.fatos) {
        const href = `/pedro/#pr-${String(n).padStart(3, "0")}`;
        const link = page.locator(`#ep-${e.numero} .provas a[href="${href}"]`);
        await expect(link, href).toHaveCount(1);
        await expect(link).toContainText(rotulo(n));
        alvos.add(`pr-${String(n).padStart(3, "0")}`);
      }
    }
    expect([...alvos]).toEqual(expect.arrayContaining(["pr-080", "pr-081"]));
    await page.goto("/pedro/");
    for (const a of alvos) await expect(page.locator(`[id="${a}"]`), a).toHaveCount(1);
  });
});

test.describe("/chao-de-fabrica: vídeo e legenda", () => {
  test("0 byte de vídeo e 0 terceiros antes do toque (rolando até o fim); o toque baixa o mp4 do próprio site", async ({ page, baseURL }) => {
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
    await page.locator("#ep-1 video").scrollIntoViewIfNeeded();
    await page.locator("#ep-1 video").evaluate((v: HTMLVideoElement) => v.play().catch(() => {}));
    await expect.poll(() => videos.some((u) => new URL(u).pathname === "/midia/chao-1-dois-quadros/video-720p.mp4")).toBe(true);
    expect(terceiros).toEqual([]);
  });

  test("legenda grande fora do quadro: nativa escondida (o vídeo já tem a queimada) e a fala chega à caixa", async ({ page }) => {
    await page.goto(ROTA);
    const modos = await page.locator("video").evaluateAll((vs) => vs.map((v) => (v as HTMLVideoElement).textTracks[0]?.mode));
    expect(modos).toEqual(["hidden", "hidden"]);
    await page.locator("#ep-2 video").evaluate((v: HTMLVideoElement) => {
      v.muted = true;
      return v.play().catch(() => {});
    });
    await expect(page.locator("#ep-2 .legenda-tv")).not.toBeEmpty({ timeout: 15_000 });
  });

  for (const rota of [ROTA, "/na-tv"]) {
    test(`${rota}: antes do play a caixa de legenda não reserva 2 linhas vazias; depois do play reserva (nada pula entre falas)`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto(rota);
      await page.evaluate(() => document.fonts.ready);
      const antes = await medirLegenda(page);
      expect(antes.altura).toBeLessThanOrEqual(40);
      await page.locator("video").first().evaluate((v: HTMLVideoElement) => {
        v.muted = true;
        return v.play().catch(() => {});
      });
      await expect
        .poll(
          async () => {
            const m = await medirLegenda(page);
            return m.altura >= m.duasLinhas;
          },
          { timeout: 15_000 },
        )
        .toBe(true);
    });
  }
});

test.describe("/chao-de-fabrica: layout, acessibilidade e movimento", () => {
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
          const fora = [...c.querySelectorAll(".chao *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5);
            })
            .map((el) => `${el.tagName}.${el.className}`);
          c.scrollTop = c.scrollHeight;
          const ultimo = document.querySelector(".episodio:last-child .provas a:last-child") as HTMLElement;
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
        // O título do cabeçalho cabe inteiro (sem reticências).
        const titulo = await page.locator(".app-titulo").evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(titulo).toBeLessThanOrEqual(0);
      });
    }
  }

  test("links do sumário e das provas com alvo de toque de 48 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(ROTA);
    const alturas = await page.locator(".sumario a, .provas a").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height));
    expect(alturas.length).toBeGreaterThanOrEqual(3 + EPISODIOS.reduce((s, e) => s + e.fatos.length, 0));
    for (const h of alturas) expect(h).toBeGreaterThanOrEqual(47.5);
  });

  test("prefers-reduced-motion: nada anima na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROTA);
    const animados = await page.evaluate(() =>
      [...document.querySelectorAll(".chao *")]
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
