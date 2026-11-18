import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import jsQR from "jsqr";

const TEMAS = ["escuro", "claro"] as const;
const ROTA = "/cartao/";
const URL_ESPERADA = "https://ailow.com.br/apresentacao";
const SAUDACAO = "Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição.";
const TEXTO = `${SAUDACAO} ${URL_ESPERADA}`;
const NUMERO_DIGITADO = "(85) 99999-9999";
const NUMERO_FINAL = "5585999999999";

async function abrir(page: Page, tema: string) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ailow-tema", t);
    } catch {}
  }, tema);
  await page.goto(ROTA);
  await expect(page.locator("html")).toHaveAttribute("data-tema", tema);
  await page.evaluate(() => document.fonts.ready);
}

for (const tema of TEMAS) {
  test.describe(`${ROTA} (${tema})`, () => {
    test.beforeEach(async ({ page }) => {
      await abrir(page, tema);
    });

    test("o QR decodifica para a URL da apresentação", async ({ page }) => {
      const imagem = await page.evaluate(async () => {
        const svg = document.querySelector(".qr-ladrilho svg") as SVGElement;
        const xml = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
        await img.decode();
        const lado = 320;
        const c = document.createElement("canvas");
        c.width = lado;
        c.height = lado;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, lado, lado);
        return { lado, dados: Array.from(ctx.getImageData(0, 0, lado, lado).data) };
      });
      const r = jsQR(Uint8ClampedArray.from(imagem.dados), imagem.lado, imagem.lado);
      expect(r?.data).toBe(URL_ESPERADA);
    });

    test("sem scroll horizontal e sem JS de QR no cliente", async ({ page }) => {
      const m = await page.evaluate(() => {
        const c = document.querySelector(".conteudo") as HTMLElement;
        return { w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, cW: c.scrollWidth, cCW: c.clientWidth };
      });
      expect(m.w).toBeLessThanOrEqual(m.cw);
      expect(m.cW).toBeLessThanOrEqual(m.cCW);
      const html = await page.content();
      expect(html).not.toMatch(/uqr|renderSVG/);
    });

    test("axe limpo, também com o aviso de número inválido", async ({ page }) => {
      let r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      await page.route("https://wa.me/**", (rota) => rota.fulfill({ status: 204 }));
      await page.locator("#numero-wa").fill("abc");
      await page.getByRole("button", { name: "Enviar" }).click();
      await expect(page.getByRole("alert")).toContainText("Número inválido");
      r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });

    test("campo de telefone: tel, inputmode e sem autocompletar", async ({ page }) => {
      const c = page.locator("#numero-wa");
      await expect(c).toHaveAttribute("type", "tel");
      await expect(c).toHaveAttribute("inputmode", "tel");
      await expect(c).toHaveAttribute("autocomplete", "off");
      await expect(page.getByLabel("WhatsApp do contato")).toHaveCount(1);
      const b = await page.getByRole("button", { name: "Enviar" }).boundingBox();
      expect(b?.height).toBeGreaterThanOrEqual(47.5);
    });

    test("digitar e tocar Enviar abre o wa.me certo em até 2 toques", async ({ page }) => {
      await page.exposeFunction("registrarToque", () => {
        toques++;
      });
      let toques = 0;
      await page.evaluate(() => {
        addEventListener("pointerdown", () => (window as unknown as { registrarToque: () => void }).registrarToque(), true);
      });
      const pedidos: string[] = [];
      await page.route("https://wa.me/**", (rota) => {
        pedidos.push(rota.request().url());
        return rota.fulfill({ status: 204 });
      });
      await page.locator("#numero-wa").click(); // toque 1: focar
      await page.locator("#numero-wa").pressSequentially(NUMERO_DIGITADO);
      await page.getByRole("button", { name: "Enviar" }).click(); // toque 2: enviar
      await expect.poll(() => pedidos.length).toBe(1);
      expect(pedidos[0]).toBe(`https://wa.me/${NUMERO_FINAL}?text=${encodeURIComponent(TEXTO)}`);
      expect(toques).toBeLessThanOrEqual(2);
      await expect(page.locator("#numero-wa")).toHaveValue("");
    });

    test("número inválido mostra aviso acessível e não navega", async ({ page }) => {
      const pedidos: string[] = [];
      await page.route("https://wa.me/**", (rota) => {
        pedidos.push(rota.request().url());
        return rota.fulfill({ status: 204 });
      });
      for (const ruim of ["12345", "85 9999-ABCD", ""]) {
        await page.locator("#numero-wa").fill(ruim);
        await page.getByRole("button", { name: "Enviar" }).click();
        await expect(page.getByRole("alert")).toContainText("Número inválido");
        await expect(page.locator("#numero-wa")).toHaveAttribute("aria-invalid", "true");
        expect(new URL(page.url()).pathname).toBe(ROTA);
      }
      await page.waitForTimeout(200);
      expect(pedidos).toEqual([]);
    });

    test("depois do envio o número não está em storage, cookie, IndexedDB nem cache", async ({ page }) => {
      await page.route("https://wa.me/**", (rota) => rota.fulfill({ status: 204 }));
      await page.locator("#numero-wa").fill(NUMERO_DIGITADO);
      await page.getByRole("button", { name: "Enviar" }).click();
      await expect(page.locator("#numero-wa")).toHaveValue("");
      const estado = await page.evaluate(async () => {
        const ls = Object.fromEntries(Object.entries(localStorage));
        const ss = Object.fromEntries(Object.entries(sessionStorage));
        const bancos = (await indexedDB.databases()).map((d) => d.name);
        const nomes = await caches.keys();
        const urls: string[] = [];
        for (const n of nomes) for (const r of await (await caches.open(n)).keys()) urls.push(r.url);
        return { ls, ss, bancos, cookie: document.cookie, urls };
      });
      expect(JSON.stringify(estado)).not.toMatch(/99999|9999-9999|5585/);
      expect(Object.keys(estado.ls)).toEqual(["ailow-tema"]);
      expect(estado.ss).toEqual({});
      expect(estado.bancos).toEqual([]);
      expect(estado.cookie).toBe("");
    });
  });
}

test.describe("compartilhar", () => {
  test.use({ serviceWorkers: "block" });

  const MATERIAL =
    "[{&quot;nome&quot;:&quot;Teste&quot;,&quot;caminho&quot;:&quot;/cartao/teste.pdf&quot;,&quot;tipo&quot;:&quot;application/pdf&quot;}]";

  async function prepararPagina(page: Page, o: { material: boolean; share: boolean; podeArquivos: boolean }) {
    await page.addInitScript((c) => {
      const w = window as unknown as { __chamadas: unknown[] };
      w.__chamadas = [];
      if (!c.share) {
        Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
        Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
        return;
      }
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: (d: ShareData) => (d.files ? c.podeArquivos : true),
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (d: ShareData) => {
          w.__chamadas.push({
            files: d.files?.map((f) => ({ nome: f.name, tipo: f.type, tamanho: f.size })),
            title: d.title,
            text: d.text,
            url: d.url,
          });
        },
      });
    }, o);
    if (o.material) {
      await page.route("**/cartao/", async (rota) => {
        const resp = await rota.fetch();
        const corpo = (await resp.text()).replace('data-material="[]"', `data-material="${MATERIAL}"`);
        await rota.fulfill({ response: resp, body: corpo });
      });
      await page.route("**/cartao/teste.pdf", (rota) =>
        rota.fulfill({ status: 200, contentType: "application/pdf", body: "%PDF-1.4 teste" }),
      );
    }
    await page.goto(ROTA);
  }

  const chamadas = (page: Page) => page.evaluate(() => (window as unknown as { __chamadas: unknown[] }).__chamadas);

  test("com material e canShare({files}) verdadeiro: compartilha os arquivos", async ({ page }) => {
    await prepararPagina(page, { material: true, share: true, podeArquivos: true });
    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect.poll(() => chamadas(page)).toEqual([
      { files: [{ nome: "teste.pdf", tipo: "application/pdf", tamanho: 14 }], text: TEXTO },
    ]);
  });

  test("com material e canShare({files}) falso: compartilha o link", async ({ page }) => {
    await prepararPagina(page, { material: true, share: true, podeArquivos: false });
    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect.poll(() => chamadas(page)).toEqual([{ title: "Pedro Fernandes, Ailow", text: SAUDACAO, url: URL_ESPERADA }]);
  });

  test("sem material (como está hoje): compartilha o link, nunca arquivos", async ({ page }) => {
    await prepararPagina(page, { material: false, share: true, podeArquivos: true });
    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect.poll(() => chamadas(page)).toEqual([{ title: "Pedro Fernandes, Ailow", text: SAUDACAO, url: URL_ESPERADA }]);
  });

  test("sem navigator.share: o botão não aparece e o link fica visível", async ({ page }) => {
    await prepararPagina(page, { material: false, share: false, podeArquivos: false });
    await expect(page.locator("#botao-compartilhar")).toBeHidden();
    const link = page.getByRole("link", { name: "ailow.com.br/apresentacao" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/apresentacao");
  });
});

test.describe("PWA do cartão", () => {
  test("manifest válido, ícones carregam e o link existe só no cartão", async ({ page, request }) => {
    await page.goto(ROTA);
    const href = await page.locator("link[rel=manifest]").getAttribute("href");
    expect(href).toBe("/cartao/manifest.webmanifest");
    const resp = await request.get(href as string);
    expect(resp.status()).toBe(200);
    const m = await resp.json();
    expect(m).toMatchObject({ start_url: "/cartao/", scope: "/cartao/", display: "standalone" });
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    for (const i of m.icons) {
      const r = await request.get(i.src);
      expect(r.status(), i.src).toBe(200);
      expect(r.headers()["content-type"], i.src).toContain("image/png");
    }
    for (const outra of ["/", "/apresentacao", "/pedro"]) {
      await page.goto(outra);
      await expect(page.locator("link[rel=manifest]")).toHaveCount(0);
    }
  });

  test("o service worker registra com escopo /cartao/ e o cartão abre offline", async ({ page, context, baseURL }) => {
    await page.goto(ROTA);
    const escopo = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.scope));
    expect(escopo).toBe(`${baseURL}/cartao/`);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.reload();
    await page.waitForLoadState("networkidle");
    const controlado = await page.evaluate(() => !!navigator.serviceWorker.controller);
    expect(controlado).toBe(true);
    const nomes = await page.evaluate(() => caches.keys());
    expect(nomes).toEqual(["cartao-v1"]);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedro Fernandes");
    await expect(page.locator(".qr-ladrilho svg")).toBeVisible();
    const estilo = await page.evaluate(() => getComputedStyle(document.querySelector(".qr-ladrilho") as Element).borderTopWidth);
    expect(estilo).toBe("4px");
    await context.setOffline(false);
  });

  // O Chromium headless não dispara `beforeinstallprompt` de forma confiável; não fingimos o evento.
  // A prova de instalabilidade aqui é manifest + service worker (testes acima). A instalação em HTTPS real fica na S12.
});

test.describe("rota escondida", () => {
  test("é noindex e nenhuma página do dist (além dela) liga ou cita /cartao", async ({ page }) => {
    await page.goto(ROTA);
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);

    const dist = join(process.cwd(), "dist");
    const achados: string[] = [];
    const nomes: string[] = [];
    const andar = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) {
          if (p === join(dist, "cartao")) continue;
          andar(p);
        } else {
          nomes.push(n);
          if (/\.(html|json|xml|txt|webmanifest)$/.test(n) && /\/cartao\b/.test(readFileSync(p, "utf8"))) achados.push(p);
        }
      }
    };
    andar(dist);
    expect(achados).toEqual([]);
    expect(nomes.filter((n) => /sitemap/i.test(n))).toEqual([]);
  });

  test("zero requisição a terceiros ao carregar o cartão", async ({ page, baseURL }) => {
    const origem = new URL(baseURL ?? "http://localhost").origin;
    const externas: string[] = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.startsWith("data:") || u.startsWith("blob:")) return;
      if (new URL(u).origin !== origem) externas.push(u);
    });
    await page.goto(ROTA);
    await page.waitForLoadState("networkidle");
    expect(externas).toEqual([]);
  });

  test("o Voltar não sai do cartão depois de um gesto", async ({ page }) => {
    await page.goto(ROTA);
    await page.locator("h1").click();
    expect(await page.evaluate(() => history.state?.t)).toBe(1);
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe(ROTA);
  });
});
