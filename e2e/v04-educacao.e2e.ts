import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { hashesDoDist } from "../scripts/csp.mjs";
import { linkContato } from "../src/config/contato";
import { urlCanonica } from "../src/config/indexacao";
import { ancoraPR } from "../src/data/consultoria";
import { ESCADA_EDUCACAO, FORMACAO, FORMATOS, PALCOS, TEMAS } from "../src/data/educacao";

/**
 * V04 (2026-11-20, ADR 007 itens 2, 5 e 7): /educacao, "Levar para minha instituição". IA para empresários e
 * Sistema S em linguagem de analista: palco e mídia (só confirmados), formatos como PROPOSTA, áreas temáticas,
 * kit do analista e a escada com o "Aprender" em destaque. Página estática: nenhum script próprio.
 */

const TEMAS_COR = ["escuro", "claro"] as const;
const raiz = resolve(import.meta.dirname, "..");

async function comTema(page: Page, tema: (typeof TEMAS_COR)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

test.describe("/educacao: página indexável", () => {
  test("responde 200, é indexável, tem canonical, título e descrição próprios", async ({ page }) => {
    const r = await page.goto("/educacao");
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica("/educacao"));
    await expect(page).toHaveTitle("IA para empresários: palestra e oficina para instituições | Ailow");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Sistema S/);
    await expect(page.locator(".construcao")).toHaveCount(0);
  });

  test("está no sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica("/educacao")}</loc>`);
  });

  test("360x640: a ação principal é o WhatsApp com a origem [educação], visível sem rolar", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/educacao");
    const botao = page.locator(".educacao-topo .botao-acao");
    await expect(botao).toHaveAttribute("href", linkContato("educacao"));
    await expect(botao).toBeInViewport({ ratio: 1 });
    // O kit também tem o contato, com a mesma origem.
    await expect(page.locator(".kit .botao-acao")).toHaveAttribute("href", linkContato("educacao"));
  });

  test("ao carregar, nenhuma requisição sai do próprio site", async ({ page }) => {
    const pedidos: string[] = [];
    page.on("request", (r) => pedidos.push(r.url()));
    await page.goto("/educacao");
    await page.waitForLoadState("networkidle");
    const base = new URL(page.url()).origin;
    expect(pedidos.filter((u) => !u.startsWith(base) && !u.startsWith("data:"))).toEqual([]);
  });
});

test.describe("/educacao: conteúdo", () => {
  test("palco e mídia: só os confirmados, cada um com a entrada do Diário de obra", async ({ page }) => {
    await page.goto("/educacao");
    const itens = page.locator(".palcos > li");
    await expect(itens).toHaveCount(PALCOS.length);
    for (const [i, p] of PALCOS.entries()) {
      await expect(itens.nth(i).locator(".palco-tipo")).toHaveText(p.tipo);
      await expect(itens.nth(i).locator(".provas-pr a").first()).toHaveAttribute("href", `/pedro/#${ancoraPR(p.prs[0])}`);
    }
  });

  test("toda entrada citada existe no Diário de obra (âncora presente no /pedro)", async ({ page }) => {
    await page.goto("/educacao");
    const hrefs = await page.locator('a[href^="/pedro/#pr-"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    const pedro = readFileSync(join(raiz, "dist", "pedro", "index.html"), "utf8");
    for (const h of new Set(hrefs)) {
      expect(pedro, h as string).toContain(`id="${(h as string).split("#")[1]}"`);
    }
  });

  test("os 3 formatos aparecem marcados como proposta, sem duração nem preço", async ({ page }) => {
    await page.goto("/educacao");
    await expect(page.locator(".formatos > li h3")).toHaveText(FORMATOS.map((f) => f.nome));
    await expect(page.locator(".formatos > li .selo-proposta")).toHaveCount(FORMATOS.length);
    await expect(page.locator(".aviso-proposta")).toContainText(/^Proposta/);
    const texto = (await page.locator(".formatos").textContent()) ?? "";
    expect(texto).not.toMatch(/\d/);
  });

  test("áreas temáticas e formação do kit vêm das listas do site", async ({ page }) => {
    await page.goto("/educacao");
    await expect(page.locator(".temas > li h3")).toHaveText(TEMAS.map((t) => t.nome));
    await expect(page.locator(".kit .formacao > li")).toHaveCount(FORMACAO.length);
  });

  test("a escada tem o Aprender em destaque e o degrau seguinte leva à /consultoria", async ({ page }) => {
    await page.goto("/educacao");
    const degraus = page.locator(".escada > li");
    await expect(degraus.locator("h3")).toHaveText(ESCADA_EDUCACAO.map((d) => d.nome));
    await expect(degraus.first()).toHaveClass(/degrau-destaque/);
    await expect(degraus.first()).toContainText("Você está aqui");
    await expect(degraus.nth(1).getByRole("link", { name: "Ver a consultoria" })).toHaveAttribute("href", "/consultoria");
    // Destaque não depende só da cor: o degrau do curso tem o rótulo e borda mais grossa.
    const bordas = await degraus.evaluateAll((els) => els.map((el) => Number.parseFloat(getComputedStyle(el).borderTopWidth)));
    expect(bordas[0], JSON.stringify(bordas)).toBeGreaterThan(bordas[1]);
  });

  test("sem preço, carga horária, credenciamento afirmado ou série sem episódio publicado", async ({ page }) => {
    await page.goto("/educacao");
    const texto = (await page.locator("main").textContent()) ?? "";
    expect(texto).not.toMatch(/R\$|reais|pre[çc]o|\d+\s*(h|horas?|min|minutos?|encontros?)\b/i);
    expect(texto).not.toMatch(/\bcredenciad[oa]s?\b/i);
    expect(texto).not.toMatch(/ensinando ia/i);
    await expect(page.locator(".kit")).toContainText(/consulte a sua institui[çc][ãa]o/i);
    await expect(page.locator("main video, main iframe")).toHaveCount(0);
    // O único script dentro do main é o da seta de voltar do layout (App.astro); a página não tem script próprio.
    const scripts = await page.locator("main script").evaluateAll((s) => s.map((el) => el.textContent ?? ""));
    expect(scripts.every((s) => s.includes("data-voltar")), `${scripts.length} script(s)`).toBe(true);
  });
});

test.describe("/educacao: layout, acessibilidade e movimento", () => {
  for (const tema of TEMAS_COR) {
    test(`tema ${tema}: axe limpo`, async ({ page }) => {
      await comTema(page, tema);
      await page.goto("/educacao");
      await page.evaluate(() => document.fonts.ready);
      const r = await new AxeBuilder({ page }).analyze();
      const graves = r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(graves).toEqual([]);
    });

    for (const largura of [360, 375, 1440]) {
      test(`tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 900 });
        await comTema(page, tema);
        await page.goto("/educacao");
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const c = document.querySelector(".conteudo") as HTMLElement;
          const caixa = c.getBoundingClientRect();
          const fora = [...c.querySelectorAll("*")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.right > caixa.right + 0.5 || r.left < caixa.left - 0.5);
            })
            .map((el) => `${el.tagName}.${(el as HTMLElement).className}`);
          return {
            doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            conteudo: c.scrollWidth - c.clientWidth,
            fora,
          };
        });
        expect(m.doc, JSON.stringify(m)).toBeLessThanOrEqual(0);
        expect(m.conteudo, JSON.stringify(m)).toBeLessThanOrEqual(0);
        expect(m.fora).toEqual([]);
      });
    }
  }

  test("360 px: as ações do topo ficam empilhadas e os alvos têm 48 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/educacao");
    const topo = await page.locator(".educacao-topo .botao-acao, .educacao-topo .ir-kit").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      }),
    );
    expect(topo.length).toBe(2);
    expect(topo[1].top, JSON.stringify(topo)).toBeGreaterThanOrEqual(topo[0].bottom - 0.5);
    for (const t of topo) expect(t.height, JSON.stringify(topo)).toBeGreaterThanOrEqual(48);
  });

  test("360x640: rolando até o fim, o contato do kit fica inteiro acima do rodapé", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/educacao");
    const m = await page.evaluate(() => {
      const c = document.querySelector(".conteudo") as HTMLElement;
      c.scrollTop = c.scrollHeight;
      const b = (document.querySelector(".kit .botao-acao") as HTMLElement).getBoundingClientRect();
      const caixa = c.getBoundingClientRect();
      const rodape = (document.querySelector(".rodape") as HTMLElement).getBoundingClientRect();
      return { baseBotao: b.bottom, topoBotao: b.top, topoConteudo: caixa.top, baseConteudo: caixa.bottom, topoRodape: rodape.top };
    });
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.baseConteudo);
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.topoRodape);
    expect(m.topoBotao, JSON.stringify(m)).toBeGreaterThanOrEqual(m.topoConteudo);
  });

  test("movimento reduzido: nenhuma animação nem transição na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/educacao");
    const m = await page.evaluate(() => {
      const dur = (v: string) => v.split(",").some((x) => Number.parseFloat(x) > 0.001);
      const animados = [...document.querySelectorAll("main *")].filter((el) => {
        const s = getComputedStyle(el);
        return (s.animationName !== "none" && dur(s.animationDuration)) || dur(s.transitionDuration);
      });
      const rodando = document.getAnimations().filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 1);
      return { animados: animados.map((el) => el.className), rodando: rodando.length };
    });
    expect(m).toEqual({ animados: [], rodando: 0 });
  });
});

test.describe("/educacao sob a CSP de produção", () => {
  const conf = readFileSync(join(raiz, "ops/web/seguranca.conf"), "utf8");
  const modelo = /add_header Content-Security-Policy "([^"]+)" always;/.exec(conf)?.[1] ?? "";
  const csp = modelo.replace("$csp_script_hashes", hashesDoDist(join(raiz, "dist")).join(" "));

  test("0 violações", async ({ page }) => {
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document" || !route.request().url().startsWith("http://127.0.0.1"))
        return route.continue();
      const resposta = await route.fetch();
      await route.fulfill({ response: resposta, headers: { ...resposta.headers(), "content-security-policy": csp } });
    });
    await page.addInitScript(() => {
      const w = window as unknown as { __violacoes: string[] };
      w.__violacoes = [];
      document.addEventListener("securitypolicyviolation", (e) => w.__violacoes.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto("/educacao");
    await page.waitForLoadState("networkidle");
    const v = await page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
    expect(v).toEqual([]);
  });
});
