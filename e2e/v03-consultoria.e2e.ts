import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";
import { hashesDoDist } from "../scripts/csp.mjs";
import { linkContato, linkRaioX, mensagemContato, mensagemRaioX, WHATSAPP } from "../src/config/contato";
import { urlCanonica } from "../src/config/indexacao";
import { ancoraPR, CASOS, ESCADA, ETAPAS } from "../src/data/consultoria";

/**
 * V03 (2026-11-20, ADR 007 itens 2, 5 e 7): /consultoria, "Faz aqui na minha". Método em 4 etapas com a Copel
 * como exemplo, a escada, os casos e o raio-x de 5 perguntas que monta a mensagem do WhatsApp sem requisição.
 */

const TEMAS = ["escuro", "claro"] as const;
const raiz = resolve(import.meta.dirname, "..");

async function comTema(page: Page, tema: (typeof TEMAS)[number]) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
}

const RESPOSTAS = {
  processo: "Apontamento da produção no papel, com retrabalho 😀",
  medicao: "Planilha",
  pessoas: "21 a 50",
  turnos: "3",
  sistema: "ERP antigo + planilhas",
};

async function preencher(page: Page) {
  const form = page.locator("form.raio-x");
  await form.getByLabel("Que processo mais dói hoje?").fill(RESPOSTAS.processo);
  // O rádio nativo cobre o chip inteiro (toque em qualquer ponto marca): o teste toca o próprio rádio.
  const marcar = (grupo: string, opcao: string) =>
    form.getByRole("radiogroup", { name: grupo }).getByRole("radio", { name: opcao, exact: true }).click();
  await marcar("Como vocês medem isso hoje?", RESPOSTAS.medicao);
  await marcar("Quantas pessoas trabalham nesse processo?", RESPOSTAS.pessoas);
  await marcar("Quantos turnos por dia?", RESPOSTAS.turnos);
  await form.getByLabel("Que sistema usam hoje?").fill(RESPOSTAS.sistema);
}

test.describe("/consultoria: página indexável", () => {
  test("responde 200, é indexável, tem canonical, título e descrição próprios", async ({ page }) => {
    const r = await page.goto("/consultoria");
    expect(r?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica("/consultoria"));
    await expect(page).toHaveTitle("Consultoria sob medida para empresas | Ailow");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Copel/);
    await expect(page.locator(".construcao")).toHaveCount(0);
  });

  test("está no sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${urlCanonica("/consultoria")}</loc>`);
  });

  test("a ação principal é o WhatsApp com a origem [consultoria], visível sem rolar", async ({ page }) => {
    await page.goto("/consultoria");
    const botao = page.locator(".consultoria-topo .botao-acao");
    await expect(botao).toHaveAttribute("href", linkContato("consultoria"));
    await expect(botao).toBeInViewport();
  });
});

test.describe("/consultoria: método, escada e casos", () => {
  test("as 4 etapas, na ordem, cada uma com a Copel como exemplo e entradas do Diário de obra", async ({ page }) => {
    await page.goto("/consultoria");
    const etapas = page.locator(".metodo > li");
    await expect(etapas).toHaveCount(4);
    for (const [i, e] of ETAPAS.entries()) {
      const li = etapas.nth(i);
      await expect(li.locator("h3")).toHaveText(e.nome);
      await expect(li.locator(".na-copel")).toContainText("Na Copel");
      const provas = li.locator(".provas-pr a");
      await expect(provas).toHaveCount(e.prs.length);
      for (const [j, n] of e.prs.entries()) {
        await expect(provas.nth(j)).toHaveAttribute("href", `/pedro/#${ancoraPR(n)}`);
      }
    }
  });

  test("toda entrada citada existe no Diário de obra (âncora presente no /pedro)", async ({ page }) => {
    await page.goto("/consultoria");
    const hrefs = await page.locator('a[href^="/pedro/#pr-"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const citadas = [...new Set([...ETAPAS, ...ESCADA, ...CASOS].flatMap((b) => b.prs))];
    expect(hrefs.length).toBeGreaterThanOrEqual(citadas.length);
    const pedro = readFileSync(join(raiz, "dist", "pedro", "index.html"), "utf8");
    for (const h of new Set(hrefs)) {
      const id = (h as string).split("#")[1];
      expect(pedro, h as string).toContain(`id="${id}"`);
    }
  });

  test("a escada Aprender → Automatizar → Sistema sob medida; o Aprender leva a /educacao", async ({ page }) => {
    await page.goto("/consultoria");
    const degraus = page.locator(".escada > li");
    await expect(degraus.locator("h3")).toHaveText(["Aprender", "Automatizar", "Sistema sob medida"]);
    await expect(degraus.first().getByRole("link", { name: "Ver os cursos" })).toHaveAttribute("href", "/educacao");
  });

  test("a escada sobe: no celular cada degrau recua; a partir de 640 px cada degrau começa mais alto", async ({
    page,
  }) => {
    for (const largura of [360, 1440]) {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto("/consultoria");
      const c = await page
        .locator(".escada > li")
        .evaluateAll((els) => els.map((el) => ({ left: el.getBoundingClientRect().left, top: el.getBoundingClientRect().top })));
      if (largura < 640) {
        expect(c[1].left, JSON.stringify(c)).toBeGreaterThan(c[0].left);
        expect(c[2].left, JSON.stringify(c)).toBeGreaterThan(c[1].left);
      } else {
        expect(c[1].top, JSON.stringify(c)).toBeLessThan(c[0].top);
        expect(c[2].top, JSON.stringify(c)).toBeLessThan(c[1].top);
      }
    }
  });

  test("casos: Copel como cliente zero e o Cloud com a loja piloto, sem nome de cliente", async ({ page }) => {
    await page.goto("/consultoria");
    const casos = page.locator(".casos > li");
    await expect(casos).toHaveCount(2);
    await expect(casos.nth(0)).toContainText("Copel");
    await expect(casos.nth(0)).toContainText(/cliente zero/i);
    await expect(casos.nth(1)).toContainText("loja piloto");
    const texto = ((await page.locator("main").textContent()) ?? "").toLowerCase();
    expect(texto).not.toMatch(/r\$|preço|prazo/);
    // Nome da loja piloto lido do título da #070 (o repositório é público: o teste não repete o nome).
    const pr070 = readFileSync(join(raiz, "src", "content", "prs", "070-discovery-com-loja-piloto-do-cloud.md"), "utf8");
    const loja = /loja piloto do Cloud, a ([^"\n]+)"/.exec(pr070)?.[1]?.trim().toLowerCase() ?? "";
    expect(loja.length).toBeGreaterThan(2);
    expect(texto).not.toContain(loja);
  });

  test("sem vídeo até a V06: nenhum <video>, <iframe> ou slot vazio aparente", async ({ page }) => {
    await page.goto("/consultoria");
    await expect(page.locator("main video, main iframe, main .video")).toHaveCount(0);
  });
});

test.describe("/consultoria: raio-x de 5 perguntas", () => {
  test("monta a mensagem certa no wa.me, com 0 requisição ao preencher e só o WhatsApp ao enviar", async ({
    page,
  }) => {
    await page.goto("/consultoria");
    await page.waitForLoadState("networkidle");
    const pedidos: string[] = [];
    page.on("request", (r) => pedidos.push(r.url()));
    const abertos: string[] = [];
    await page.route("https://wa.me/**", (route) => {
      abertos.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>" });
    });

    await page.locator("form.raio-x").scrollIntoViewIfNeeded();
    await preencher(page);
    const esperada = mensagemRaioX(RESPOSTAS);
    await expect(page.locator(".raio-x-previa")).toHaveText(esperada);
    expect(pedidos, "nenhuma requisição ao preencher").toEqual([]);

    await page.getByRole("button", { name: "Enviar pelo WhatsApp" }).click();
    await expect.poll(() => abertos.length).toBe(1);
    const u = new URL(abertos[0]);
    expect(u.origin + u.pathname).toBe(`https://wa.me/${WHATSAPP}`);
    expect(u.searchParams.get("text")).toBe(esperada);
    expect(abertos[0]).toBe(linkRaioX(RESPOSTAS));
    expect(esperada.split("\n").at(-1)).toBe("[consultoria]");
    // A única requisição de todo o caminho é a abertura do WhatsApp.
    expect(pedidos.filter((p) => !p.startsWith("https://wa.me/"))).toEqual([]);
  });

  test("sem responder nada, envia a mensagem de sempre da consultoria", async ({ page }) => {
    await page.goto("/consultoria");
    const abertos: string[] = [];
    await page.route("https://wa.me/**", (route) => {
      abertos.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/html", body: "ok" });
    });
    await expect(page.locator(".raio-x-previa")).toHaveText(mensagemContato("consultoria"));
    await page.getByRole("button", { name: "Enviar pelo WhatsApp" }).click();
    await expect.poll(() => abertos.length).toBe(1);
    expect(new URL(abertos[0]).searchParams.get("text")).toBe(mensagemContato("consultoria"));
  });

  test("diz que nada vai a servidor e não grava nada no aparelho", async ({ page }) => {
    await page.goto("/consultoria");
    await expect(page.locator(".raio-x")).toContainText("Nada vai para um servidor");
    await preencher(page);
    const guardado = await page.evaluate(() => {
      const chaves: string[] = [];
      for (let i = 0; i < localStorage.length; i++) chaves.push(localStorage.key(i) as string);
      return { local: chaves.filter((k) => k !== "ailow-tema"), sessao: sessionStorage.length, cookie: document.cookie };
    });
    expect(guardado).toEqual({ local: [], sessao: 0, cookie: "" });
  });
});

test.describe("/consultoria: layout, acessibilidade e movimento", () => {
  for (const tema of TEMAS) {
    test(`tema ${tema}: axe limpo, preenchido ou não`, async ({ page }) => {
      await comTema(page, tema);
      await page.goto("/consultoria");
      await page.evaluate(() => document.fonts.ready);
      const graves = async () => {
        const r = await new AxeBuilder({ page }).analyze();
        return r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      };
      expect(await graves()).toEqual([]);
      await preencher(page);
      expect(await graves()).toEqual([]);
    });

    for (const largura of [360, 375, 1440]) {
      test(`tema ${tema}, ${largura} px: sem rolagem horizontal; nada passa do contêiner`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: largura < 1000 ? 640 : 900 });
        await comTema(page, tema);
        await page.goto("/consultoria");
        await page.evaluate(() => document.fonts.ready);
        await preencher(page);
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

  test("360 px: os botões e links de ação ficam empilhados, nunca lado a lado", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/consultoria");
    const caixas = async (sel: string) =>
      page.locator(sel).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }),
      );
    const topo = await caixas(".consultoria-topo .botao-acao, .consultoria-topo .ir-raio-x");
    expect(topo.length).toBe(2);
    expect(topo[1].top, JSON.stringify(topo)).toBeGreaterThanOrEqual(topo[0].bottom - 0.5);
    // O enviar ocupa a largura do formulário (nada ao lado dele).
    const [enviar] = await caixas(".raio-x .botao-acao");
    const [form] = await caixas("form.raio-x");
    expect(enviar.right - enviar.left, JSON.stringify({ enviar, form })).toBeGreaterThanOrEqual(form.right - form.left - 64);
    for (const sel of [".consultoria-topo .botao-acao", ".raio-x .botao-acao"]) {
      const alvo = await page.locator(sel).boundingBox();
      expect(alvo?.height, sel).toBeGreaterThanOrEqual(48);
    }
  });

  test("360x640: rolando até o fim, o botão de enviar fica inteiro acima do rodapé", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/consultoria");
    const m = await page.evaluate(() => {
      const c = document.querySelector(".conteudo") as HTMLElement;
      c.scrollTop = c.scrollHeight;
      const b = (document.querySelector(".raio-x .botao-acao") as HTMLElement).getBoundingClientRect();
      const caixa = c.getBoundingClientRect();
      const rodape = (document.querySelector(".rodape") as HTMLElement).getBoundingClientRect();
      return { baseBotao: b.bottom, topoBotao: b.top, baseConteudo: caixa.bottom, topoRodape: rodape.top };
    });
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.baseConteudo);
    expect(m.baseBotao, JSON.stringify(m)).toBeLessThanOrEqual(m.topoRodape);
  });

  test("movimento reduzido: nenhuma animação nem transição na página", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/consultoria");
    await preencher(page);
    const m = await page.evaluate(() => {
      const animados = [...document.querySelectorAll("main *")].filter((el) => {
        const s = getComputedStyle(el);
        // Estilo computado vem em segundos; o global.css zera para 0,01 ms (1e-05s) com movimento reduzido.
        const dur = (v: string) => v.split(",").some((x) => Number.parseFloat(x) > 0.001);
        return (s.animationName !== "none" && dur(s.animationDuration)) || dur(s.transitionDuration);
      });
      // Conta só o que se move de verdade: as transições de 0,01 ms do global.css podem estar "rodando" no
      // instante da medida (o CI pegou 7) sem mover nada na tela.
      const rodando = document
        .getAnimations()
        .filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 1)
        .map((a) => {
          const alvo = (a.effect as KeyframeEffect | null)?.target as HTMLElement | null;
          return `${alvo?.tagName ?? "?"}.${alvo?.className ?? ""} ${a.effect?.getComputedTiming().duration} ms`;
        });
      return { animados: animados.map((el) => el.className), rodando: rodando.length, quais: rodando };
    });
    expect(m).toEqual({ animados: [], rodando: 0, quais: [] });
  });
});

test.describe("/consultoria sob a CSP de produção", () => {
  const conf = readFileSync(join(raiz, "ops/web/seguranca.conf"), "utf8");
  const modelo = /add_header Content-Security-Policy "([^"]+)" always;/.exec(conf)?.[1] ?? "";
  const csp = modelo.replace("$csp_script_hashes", hashesDoDist(join(raiz, "dist")).join(" "));

  test("0 violações e o raio-x continua montando a mensagem", async ({ page }) => {
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
    await page.goto("/consultoria");
    await preencher(page);
    await expect(page.locator(".raio-x-previa")).toHaveText(mensagemRaioX(RESPOSTAS));
    const v = await page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
    expect(v).toEqual([]);
  });
});
