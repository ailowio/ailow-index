import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const TEMAS = ["escuro", "claro"] as const;
// Uma frente e uma ferramenta que também é frente (o id n8n existe nos dois), mais uma ferramenta comum.
const ROTAS = ["/pedro", "/pedro/label/escopo-sgi", "/pedro/label/n8n"];

interface PRFeed {
  numero: number;
  titulo: string;
  ferramentas: string[];
  novas: string[];
}

const pastaPRs = join(import.meta.dirname, "..", "src", "content", "prs");

/** Verificação de cada entrada lida do disco (fonte independente do build). */
function verificacoesDoDisco() {
  const mapa = new Map<number, string>();
  for (const nome of readdirSync(pastaPRs).filter((n) => n.endsWith(".md"))) {
    const texto = readFileSync(join(pastaPRs, nome), "utf8");
    const numero = Number(/^numero:\s*(\d+)/m.exec(texto)?.[1]);
    const verificacao = /^verificacao:\s*(\w+)/m.exec(texto)?.[1] ?? "";
    mapa.set(numero, verificacao);
  }
  return mapa;
}

async function lerFeed(page: Page): Promise<PRFeed[]> {
  const res = await page.request.get("/pedro/feed.json");
  return (await res.json()).prs as PRFeed[];
}

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

const numerosNaPagina = (page: Page) =>
  page.locator("article.pr").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-pr"))));

for (const rota of ROTAS) {
  for (const tema of TEMAS) {
    test.describe(`${rota} (${tema})`, () => {
      test.beforeEach(async ({ page }) => {
        await comTema(page, tema);
        await page.goto(rota);
        await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
      });

      test("sem scroll horizontal na página nem dentro dos cartões (L-0015)", async ({ page }) => {
        const m = await page.evaluate(() => ({
          w: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          bw: document.body.scrollWidth,
          bcw: document.body.clientWidth,
          conteudo: (() => {
            const c = document.querySelector("main") as HTMLElement;
            return { sw: c.scrollWidth, cw: c.clientWidth };
          })(),
          largos: [...document.querySelectorAll("main *")]
            .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5)
            .map((el) => `${el.tagName}.${el.className}`)
            .slice(0, 5),
        }));
        expect(m.w, JSON.stringify(m)).toBeLessThanOrEqual(m.cw);
        expect(m.bw, JSON.stringify(m)).toBeLessThanOrEqual(m.bcw);
        expect(m.conteudo.sw, JSON.stringify(m)).toBeLessThanOrEqual(m.conteudo.cw);
        expect(m.largos, JSON.stringify(m)).toEqual([]);
      });

      test("axe sem violação serious ou critical", async ({ page }) => {
        // Abre o painel para o axe também olhar os links de dentro.
        const painel = page.locator(".painel details");
        if (await painel.count()) await painel.evaluate((d) => ((d as HTMLDetailsElement).open = true));
        const r = await new AxeBuilder({ page }).analyze();
        const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([]);
      });
    });
  }
}

test.describe("/pedro: conteúdo do feed", () => {
  test("a contagem de cartões é a de entradas confirmadas (feed.json e disco), mais recente no topo", async ({
    page,
  }) => {
    await page.goto("/pedro");
    const feed = await lerFeed(page);
    const disco = verificacoesDoDisco();
    const confirmadasNoDisco = [...disco].filter(([, v]) => v === "confirmado").map(([n]) => n);
    expect(feed.length).toBe(confirmadasNoDisco.length);

    const nos = await numerosNaPagina(page);
    expect(nos.length).toBe(feed.length);
    await expect(page.locator("[data-total-feed]")).toHaveText(String(feed.length));
    expect(nos).toEqual([...confirmadasNoDisco].sort((a, b) => b - a));
  });

  test("nenhuma entrada pendente ou fora aparece, nem no feed nem nas labels", async ({ page, request }) => {
    const fora = [...verificacoesDoDisco()].filter(([, v]) => v !== "confirmado").map(([n]) => n);
    expect(fora.length).toBeGreaterThan(0);
    for (const rota of ROTAS) {
      await page.goto(rota);
      const nos = await numerosNaPagina(page);
      for (const n of fora) expect(nos, `${rota} #${n}`).not.toContain(n);
    }
    void request;
  });

  test("+ferramenta aparece uma única vez por ferramenta, na primeira entrada em que ela surge", async ({
    page,
  }) => {
    await page.goto("/pedro");
    const feed = await lerFeed(page);
    const marcas = await page.locator("[data-nova]").evaluateAll((els) => els.map((e) => e.getAttribute("data-nova")));
    expect(new Set(marcas).size).toBe(marcas.length);
    const usadas = new Set(feed.flatMap((p) => p.ferramentas));
    expect(new Set(marcas)).toEqual(usadas);
    // A marca fica na entrada de menor número que usa a ferramenta.
    for (const f of usadas) {
      const primeira = Math.min(...feed.filter((p) => p.ferramentas.includes(f)).map((p) => p.numero));
      await expect(page.locator(`[data-pr="${primeira}"] [data-nova="${f}"]`)).toHaveCount(1);
    }
  });

  test("topo: nome, cargo, links e bloco 'antes do primeiro commit'", async ({ page }) => {
    await page.goto("/pedro");
    await expect(page.getByRole("heading", { level: 2, name: "Pedro Fernandes" })).toBeVisible();
    await expect(page.getByText("Produtos Digitais e Operações", { exact: true })).toBeVisible();
    await expect(page.locator('.perfil a[href="https://www.linkedin.com/in/pedro-fernand/"]')).toHaveCount(1);
    await expect(page.locator('.perfil a[href="https://www.instagram.com/pedro_fernand/"]')).toHaveCount(1);
    await expect(page.locator('.perfil a[href="/pedro/entrevistas"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Antes do primeiro commit" })).toBeVisible();
    await expect(page.locator(".antes")).toContainText("UFC");
    await expect(page.locator(".antes")).toContainText("Sebrae");
    await expect(page.locator(".antes")).toContainText("Copel");
  });

  test("o conteúdo rola dentro da tela (exceção UXM-01) e a página não", async ({ page }) => {
    await page.goto("/pedro");
    const m = await page.evaluate(() => {
      const c = document.querySelector("main") as HTMLElement;
      const el = document.documentElement;
      return { interno: c.scrollHeight - c.clientHeight, pagina: el.scrollHeight - el.clientHeight };
    });
    expect(m.interno).toBeGreaterThan(0);
    expect(m.pagina).toBeLessThanOrEqual(0);
  });

  test("o painel de ferramentas só lista ferramentas com PR, com contagem e 'desde'", async ({ page }) => {
    await page.goto("/pedro");
    const feed = await lerFeed(page);
    const usadas = new Set(feed.flatMap((p) => p.ferramentas));
    await page.locator(".painel details").evaluate((d) => ((d as HTMLDetailsElement).open = true));
    const itens = page.locator(".painel li");
    await expect(itens).toHaveCount(usadas.size);
    const f = [...usadas][0] as string;
    const prs = feed.filter((p) => p.ferramentas.includes(f));
    const desde = Math.min(...prs.map((p) => p.numero));
    const texto = await page.locator(`.painel a[href="/pedro/label/${f}"]`).locator("xpath=..").textContent();
    expect(texto).toContain(`${prs.length} ${prs.length === 1 ? "PR" : "PRs"}`);
    expect(texto).toContain(`desde #${String(desde).padStart(3, "0")}`);
  });

  test("do painel à label e da label ao feed", async ({ page }) => {
    await page.goto("/pedro");
    await page.locator(".painel details").evaluate((d) => ((d as HTMLDetailsElement).open = true));
    await page.locator('.painel a[href="/pedro/label/react"]').click();
    await expect(page).toHaveURL(/\/pedro\/label\/react\/?$/);
    await page.getByRole("link", { name: "Todo o feed" }).click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
  });
});

test.describe("/pedro/label/*", () => {
  test("a label de uma ferramenta lista exatamente as entradas que a usam, com total", async ({ page }) => {
    await page.goto("/pedro");
    const feed = await lerFeed(page);
    for (const id of ["react", "n8n"]) {
      const esperadas = feed
        .filter((p) => p.ferramentas.includes(id))
        .map((p) => p.numero)
        .sort((a, b) => b - a);
      await page.goto(`/pedro/label/${id}`);
      expect(await numerosNaPagina(page)).toEqual(esperadas);
      await expect(page.locator("[data-total-label]")).toHaveText(String(esperadas.length));
      await expect(page.locator(".resumo")).toContainText(
        `desde #${String(Math.min(...esperadas)).padStart(3, "0")}`,
      );
    }
  });

  test("a label de uma frente lista as entradas daquele escopo", async ({ page }) => {
    await page.goto("/pedro");
    const feed = await lerFeed(page);
    const esperadas = feed
      .filter((p) => p.titulo.includes("(sgi)"))
      .map((p) => p.numero)
      .sort((a, b) => b - a);
    await page.goto("/pedro/label/escopo-sgi");
    expect(await numerosNaPagina(page)).toEqual(esperadas);
  });

  test("a seta da label volta ao portfólio quando aberta direto", async ({ page }) => {
    await page.goto("/pedro/label/escopo-sgi");
    await page.getByRole("link", { name: /Voltar/ }).click();
    await expect(page).toHaveURL(/\/pedro\/?$/);
  });
});

test("zero requisição externa em /pedro e nas labels", async ({ page, baseURL }) => {
  const origem = new URL(baseURL as string).origin;
  const externas: string[] = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.protocol === "data:" || u.protocol === "blob:") return;
    if (u.origin !== origem) externas.push(req.url());
  });
  for (const rota of ROTAS) await page.goto(rota, { waitUntil: "networkidle" });
  expect(externas).toEqual([]);
});
