// Gera os ícones do app a partir da logo oficial (public/logo.svg, intocada): o A em amarelo (--amarelo)
// sobre o grafite (--grafite), as cores do app. Saídas: public/favicon.svg, public/favicon-32.png,
// public/apple-touch-icon.png e os 3 ícones do PWA do cartão. Rodar à mão quando a logo ou os tokens mudarem:
//   node scripts/icones.mjs
// Usa o sharp que já vem com o Astro (dependência opcional dele); o resultado é commitado e conferido por
// test/icones.test.ts, que não depende do sharp.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const raiz = join(import.meta.dirname, "..");
const tokens = readFileSync(join(raiz, "src/styles/tokens.css"), "utf8");
const token = (nome) => tokens.match(new RegExp(`--${nome}:\\s*(#[0-9a-f]{6})`, "i"))[1].toLowerCase();
const AMARELO = token("amarelo");
const GRAFITE = token("grafite");

const logo = readFileSync(join(raiz, "public/logo.svg"), "utf8");
const caminhos = [...logo.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
if (caminhos.length !== 5) throw new Error(`a logo oficial tem 5 paths; achei ${caminhos.length}`);

// Caixa do desenho dentro do viewBox 0..10000: rasteriza a 1000 px e apara o transparente.
// O tamanho vai no próprio SVG: o sharp aplica o trim antes do resize, seja qual for a ordem das chamadas.
const logo1000 = logo.replace("<svg ", '<svg width="1000" height="1000" ');
const { info } = await sharp(Buffer.from(logo1000)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const caixa = {
  x: -info.trimOffsetLeft * 10,
  y: -info.trimOffsetTop * 10,
  l: info.width * 10,
  a: info.height * 10,
};

/** SVG quadrado de lado 1000: fundo grafite (raio opcional) e o A ocupando `fracao` do lado, centrado. */
function svgIcone(fracao, raio = 0) {
  const escala = (1000 * fracao) / Math.max(caixa.l, caixa.a);
  const tx = (1000 - caixa.l * escala) / 2 - caixa.x * escala;
  const ty = (1000 - caixa.a * escala) / 2 - caixa.y * escala;
  const paths = caminhos.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect width="1000" height="1000" rx="${raio}" fill="${GRAFITE}"/><g fill="${AMARELO}" transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${escala.toFixed(5)})">${paths}</g></svg>\n`;
}

async function png(svg, lado, destino) {
  await sharp(Buffer.from(svg), { density: 72 * Math.max(1, lado / 1000) * 4 })
    .resize(lado, lado)
    .flatten({ background: GRAFITE })
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(raiz, destino));
  console.log(`ok ${destino} ${lado}px`);
}

// Favicon: cantos arredondados (aba do navegador nos 2 temas); PNG 32 como reserva.
const favicon = svgIcone(0.72, 180);
writeFileSync(join(raiz, "public/favicon.svg"), favicon);
console.log("ok public/favicon.svg");
await png(svgIcone(0.74), 32, "public/favicon-32.png");
// iOS e Android arredondam sozinhos: quadrado cheio.
await png(svgIcone(0.66), 180, "public/apple-touch-icon.png");
await png(svgIcone(0.66), 192, "public/cartao/icone-192.png");
await png(svgIcone(0.66), 512, "public/cartao/icone-512.png");
// Maskable: o A cabe no círculo de 40% do lado (zona segura de 80% de diâmetro).
await png(svgIcone(0.5), 512, "public/cartao/icone-maskable-512.png");
