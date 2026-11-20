// Gera public/og/ailow.png (1200x630), a imagem do preview de links (F0).
// Uso: node scripts/og.mjs   (precisa do Chromium do Playwright: npx playwright install chromium)
// Usa só arquivos locais: as fontes do @fontsource, a foto e a logo oficial (recolorida para o amarelo do Pulso,
// sem alterar public/logo.svg). Zero rede. O PNG é versionado; test/og.test.ts confere tamanho e dimensões.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const raiz = join(import.meta.dirname, "..");
// Fontes embutidas em data URI: o Chromium bloqueia fonte por file:// numa página sem origem.
const fonte = (pacote, arquivo) =>
  `data:font/woff2;base64,${readFileSync(join(raiz, "node_modules", "@fontsource", pacote, "files", arquivo)).toString("base64")}`;
const dataUri = (tipo, caminho) => `data:${tipo};base64,${readFileSync(join(raiz, caminho)).toString("base64")}`;

const AMARELO = "#ffc400";
const GRAFITE = "#111214";
const GRAFITE_800 = "#1c1e21";
const ACO = "#9aa1a8";

const logo = readFileSync(join(raiz, "public", "logo.svg"), "utf8").replace(/fill="#07BDD5"/gi, `fill="${AMARELO}"`);
const logoUri = `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`;
const foto = dataUri("image/webp", "public/pedro-foto/pedro-480.webp");

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:"Barlow Condensed";font-weight:700;src:url(${fonte("barlow-condensed", "barlow-condensed-latin-700-normal.woff2")})}
@font-face{font-family:"Barlow";font-weight:400;src:url(${fonte("barlow", "barlow-latin-400-normal.woff2")})}
@font-face{font-family:"JetBrains Mono";font-weight:500;src:url(${fonte("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff2")})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${GRAFITE};color:#fff;font-family:"Barlow",sans-serif;position:relative;overflow:hidden}
.pulso{position:absolute;left:0;right:0;bottom:70px;width:1200px;height:160px;fill:none;stroke-width:4}
.pulso .base{stroke:#4a5057}.pulso .luz{stroke:${AMARELO};stroke-dasharray:14 14;opacity:.6}
.conteudo{position:absolute;inset:64px 72px auto 72px;display:grid;grid-template-columns:1fr 300px;gap:56px;align-items:start}
.marca{display:flex;align-items:center;gap:16px;font-family:"Barlow Condensed";font-size:40px;letter-spacing:.04em}
.marca img{width:64px;height:64px;background:${GRAFITE_800};padding:8px;border-radius:8px}
h1{font-family:"Barlow Condensed";font-weight:700;font-size:76px;line-height:1.02;margin-top:36px;text-transform:uppercase}
p{font-size:30px;line-height:1.35;color:${ACO};margin-top:22px;max-width:700px}
.foto{width:300px;height:300px;border-radius:50%;border:8px solid ${AMARELO};object-fit:cover;margin-top:40px}
.rodape{position:absolute;left:72px;bottom:36px;font-family:"JetBrains Mono";font-size:26px;color:${ACO};letter-spacing:.04em}
.rodape b{color:${AMARELO};font-weight:500}
</style></head><body>
<svg class="pulso" viewBox="0 0 360 96" preserveAspectRatio="none"><path class="base" d="M0 48h220l16-32 24 64 20-48 12 16h68"/><path class="luz" d="M0 48h220l16-32 24 64 20-48 12 16h68"/></svg>
<div class="conteudo"><div>
<div class="marca"><img src="${logoUri}" alt="">AILOW</div>
<h1>Digitalizei e sensorizei a minha fábrica.</h1>
<p>Agora levo isso para outras empresas, com consultoria e cursos de IA para empresários.</p>
</div><img class="foto" src="${foto}" alt=""></div>
<div class="rodape"><b>Pedro Fernandes</b> · ailow.com.br</div>
</body></html>`;

const saida = join(raiz, "public", "og", "ailow.png");
mkdirSync(join(raiz, "public", "og"), { recursive: true });
console.log("passo 1/2: abrindo o Chromium local");
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pagina.setContent(html, { waitUntil: "load" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: saida, type: "png" });
await navegador.close();
console.log(`passo 2/2: OK, ${saida}`);
