import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/**
 * V15 (2026-11-23): desktop por rota. Layout próprio em >= 80 rem (1280 px) para a home, /consultoria, /educacao,
 * /na-tv, Diário de obra (/pedro), /explorar e /trajetoria; o celular aprovado não muda.
 *
 * Regressão visual por geometria (decisão da V15, registrada no diário e no PR): o CI roda em Linux e imagens base
 * geradas no Windows não batem (fonte e antialiasing). Em vez de comparar pixels, cada rota afirma a intenção do
 * layout, que não depende da fonte: (1) colunas lado a lado em 1280 e 1440 e empilhadas em 360; (2) largura de
 * leitura de cada parágrafo <= 72 ch; (3) nada passa do contêiner que recorta (.conteudo), nem na horizontal;
 * (4) o fim do conteúdo alcança a rolagem acima do rodapé; (5) 0 rolagem horizontal nos 2 temas.
 * Os screenshots de referência (1280 e 1440, 2 temas) ficam fora do repo: D:/apps/.playwright-mcp/auditoria/v15/.
 */

const TEMAS = ["escuro", "claro"] as const;
type Tema = (typeof TEMAS)[number];

const DESKTOP = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

/** Pares [A, B] que ficam lado a lado no desktop (A à esquerda de B, alturas sobrepostas) e empilhados no celular. */
interface Rota {
  rota: string;
  pares: [string, string][];
}

const ROTAS: Rota[] = [
  {
    rota: "/",
    pares: [
      ["a.porta:nth-of-type(1)", "a.porta:nth-of-type(2)"],
      [".widget h1", ".widget .proposta"],
      [".home .contato-home", ".secundarios .diario"],
      [".grade-apps li:nth-child(1)", ".grade-apps li:nth-child(7)"],
    ],
  },
  {
    rota: "/consultoria",
    pares: [
      ["#topo-titulo", ".consultoria-topo .tese"],
      ["#metodo-titulo", ".metodo"],
      [".metodo > li:first-child h3", ".metodo > li:first-child .na-copel"],
      ["#casos-titulo", ".casos"],
      [".raio-x .campo:first-of-type", ".raio-x .previa"],
    ],
  },
  {
    rota: "/educacao",
    pares: [
      ["#edu-topo-titulo", ".educacao-topo .tese"],
      // O título da seção na trilha da esquerda, ao lado do 1º bloco de conteúdo dela.
      ["#formatos-titulo", "#formatos > :nth-child(2)"],
      ["#temas-titulo", "#temas > :nth-child(2)"],
      ["#kit-titulo", "#kit > :nth-child(2)"],
      [".palcos > li:nth-child(1)", ".palcos > li:nth-child(2)"],
    ],
  },
  {
    rota: "/na-tv",
    pares: [
      ["#natv-titulo", ".na-tv-topo .tese"],
      [".degrau-tv:first-child .gc-barra", ".degrau-tv:first-child .teasers"],
    ],
  },
  {
    rota: "/pedro",
    pares: [
      [".diario-topo", ".visita"],
      [".perfil", ".feed"],
      [".filtros", ".feed"],
    ],
  },
  {
    rota: "/explorar",
    pares: [
      [".explorar .cabeca:first-child", ".lista-fluxos"],
      [".lista-fluxos > li:nth-child(1)", ".lista-fluxos > li:nth-child(2)"],
    ],
  },
  {
    rota: "/trajetoria",
    // O 1º par vizinho esq -> dir do mesmo ano: no desktop, lado a lado (densidade); no celular, um embaixo do outro.
    pares: [
      [".parada[data-lado='esq']:has(+ .parada[data-lado='dir'])", ".parada[data-lado='esq'] + .parada[data-lado='dir']"],
      [".tj-topo h2", ".tj-topo .tj-tese"],
    ],
  },
];

async function comTema(page: Page, tema: Tema) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

async function abrir(page: Page, rota: string) {
  await page.goto(rota);
  await page.evaluate(() => document.fonts.ready);
  // A home anima a entrada dos ícones (450 ms + escalonamento): mede depois de parar.
  await page.waitForTimeout(rota === "/" ? 900 : 100);
}

/** Retângulos de A e B (o 1º elemento de cada seletor que tem tamanho). */
async function medirPar(page: Page, a: string, b: string) {
  return page.evaluate(
    ([sa, sb]) => {
      const rect = (s: string) => {
        const el = [...document.querySelectorAll(s)].find((e) => e.getBoundingClientRect().width > 0);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom };
      };
      return { a: rect(sa), b: rect(sb) };
    },
    [a, b] as const,
  );
}

test.describe("V15 · desktop (1280 e 1440, 2 temas)", () => {
  test.skip(() => test.info().project.name !== "desktop-1280", "mede viewports próprios: roda uma vez, no projeto desktop");

  for (const { rota, pares } of ROTAS) {
    for (const vp of DESKTOP) {
      for (const tema of TEMAS) {
        test(`${rota} ${vp.width}x${vp.height} (${tema}): colunas lado a lado, leitura <= 72 ch, nada fora do contêiner nem sob o rodapé`, async ({
          page,
        }) => {
          await page.setViewportSize(vp);
          await comTema(page, tema);
          await abrir(page, rota);

          for (const [a, b] of pares) {
            const m = await medirPar(page, a, b);
            const msg = `${a} | ${b}: ${JSON.stringify(m)}`;
            expect(m.a, msg).not.toBeNull();
            expect(m.b, msg).not.toBeNull();
            if (!m.a || !m.b) continue;
            // Lado a lado: A termina antes de B começar, e as alturas se cruzam (mesma faixa da tela).
            expect(m.a.r, msg).toBeLessThanOrEqual(m.b.l + 0.5);
            expect(m.a.t, msg).toBeLessThan(m.b.b);
            expect(m.b.t, msg).toBeLessThan(m.a.b);
          }

          const g = await page.evaluate(() => {
            const c = document.querySelector(".conteudo") as HTMLElement;
            const caixa = c.getBoundingClientRect();
            const recortadoDentro = (el: Element) => {
              for (let p = el.parentElement; p && p !== c; p = p.parentElement) {
                if (getComputedStyle(p).overflowX !== "visible") return true;
              }
              return false;
            };
            const fora = [...c.querySelectorAll("*")]
              .filter((el) => {
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0 || recortadoDentro(el)) return false;
                return r.left < caixa.left - 0.5 || r.right > caixa.right + 0.5;
              })
              .map((el) => `${el.tagName}.${el.getAttribute("class")}`);

            // Largura de leitura: cada parágrafo de texto corrido cabe em 72 ch da própria fonte.
            const sonda = document.createElement("span");
            sonda.textContent = "0000000000";
            sonda.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
            const largos = [...c.querySelectorAll("p")]
              .filter((p) => getComputedStyle(p).display === "block" && (p.textContent ?? "").trim().length > 80)
              .map((p) => {
                p.appendChild(sonda);
                const ch = sonda.getBoundingClientRect().width / 10;
                sonda.remove();
                const s = getComputedStyle(p);
                const largura = p.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
                return { texto: (p.textContent ?? "").trim().slice(0, 40), chs: Math.round(largura / ch) };
              })
              .filter((x) => x.chs > 72);

            const el = document.documentElement;
            const cab = (document.querySelector(".cabecalho") as HTMLElement).getBoundingClientRect();
            const rodape = document.querySelector(".rodape")?.getBoundingClientRect();
            c.scrollTop = c.scrollHeight;
            const ultimo = (c.lastElementChild as HTMLElement).getBoundingClientRect();
            return {
              sobraPagina: el.scrollWidth - el.clientWidth,
              sobraConteudo: c.scrollWidth - c.clientWidth,
              fora,
              largos,
              topoConteudo: caixa.top,
              baseCabecalho: cab.bottom,
              baseConteudo: caixa.bottom,
              topoRodape: rodape?.top ?? Number.POSITIVE_INFINITY,
              fimUltimo: ultimo.bottom,
            };
          });
          const msg = JSON.stringify(g);
          expect(g.sobraPagina, msg).toBeLessThanOrEqual(0);
          expect(g.sobraConteudo, msg).toBeLessThanOrEqual(0);
          expect(g.fora, msg).toEqual([]);
          expect(g.largos, msg).toEqual([]);
          // A barra de cima e o rodapé ficam fora do contêiner que rola: nada do conteúdo passa por baixo deles.
          expect(g.topoConteudo, msg).toBeGreaterThanOrEqual(g.baseCabecalho - 0.5);
          expect(g.baseConteudo, msg).toBeLessThanOrEqual(g.topoRodape + 0.5);
          expect(g.fimUltimo, msg).toBeLessThanOrEqual(Math.min(g.baseConteudo, g.topoRodape) + 0.5);
        });
      }
    }

    test(`${rota} 1440 (2 temas): axe sem violação séria ou crítica`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const tema of TEMAS) {
        await comTema(page, tema);
        await abrir(page, rota);
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${tema} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
        expect(graves).toEqual([]);
      }
    });
  }

  test("home 1280: os 7 apps numa fileira só, abaixo das portas e do contato (ADR 007 item 1)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await abrir(page, "/");
    const m = await page.evaluate(() => ({
      topos: [...document.querySelectorAll("a.app")].map((a) => Math.round(a.getBoundingClientRect().top)),
      basePortas: Math.max(...[...document.querySelectorAll("a.porta")].map((p) => p.getBoundingClientRect().bottom)),
      moldura: getComputedStyle(document.querySelector(".aparelho") as Element).borderTopWidth,
    }));
    expect(new Set(m.topos).size, JSON.stringify(m)).toBe(1);
    expect(m.topos[0], JSON.stringify(m)).toBeGreaterThan(m.basePortas);
    expect(m.moldura).toBe("0px");
  });
});

test.describe("V15 · o celular não muda (360 px)", () => {
  test.skip(() => test.info().project.name !== "celular-360", "roda no projeto do celular");

  // Canário permanente: uma regra de desktop que escape para 360 põe os pares lado a lado e reprova aqui.
  for (const { rota, pares } of ROTAS) {
    test(`${rota} 360: os pares do desktop continuam empilhados`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await abrir(page, rota);
      for (const [a, b] of pares) {
        const m = await medirPar(page, a, b);
        const msg = `${a} | ${b}: ${JSON.stringify(m)}`;
        if (!m.a || !m.b) throw new Error(`sem elemento: ${msg}`);
        // Empilhados: um começa depois que o outro termina (na ordem que for).
        const separados = m.b.t >= m.a.b - 0.5 || m.a.t >= m.b.b - 0.5;
        expect(separados, msg).toBe(true);
      }
    });
  }

  // L-0015 ação 7 (retomada da V18): o título do cabeçalho cabe inteiro em 360 px em todas as páginas com cabeçalho de app.
  test("título do cabeçalho cabe em 360 px em todas as páginas do sitemap", async ({ page, request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const rotas = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
    expect(rotas.length).toBeGreaterThan(10);
    await page.setViewportSize({ width: 360, height: 640 });
    const cortados: string[] = [];
    for (const rota of rotas) {
      await page.goto(rota);
      await page.evaluate(() => document.fonts.ready);
      const sobra = await page.evaluate(() => {
        const t = document.querySelector(".app-titulo") as HTMLElement | null;
        return t ? t.scrollWidth - t.clientWidth : 0;
      });
      if (sobra > 0) cortados.push(`${rota} (+${sobra}px)`);
    }
    expect(cortados).toEqual([]);
  });
});
