// Lighthouse CI (V16, ADR 009): orçamento mobile sobre o build estático (dist/), sem servidor LHCI e sem upload
// público (upload.target = filesystem; nada sai do runner). Mobile é o perfil padrão do Lighthouse (emulação de
// celular + rede 4G lenta simulada). 3 execuções por rota; a nota passa se a MELHOR das 3 cumprir a meta (agregação
// "optimistic", o padrão do lhci): absorve o ruído de CPU do runner (o /pedro oscilou de 0,89 a 0,99 na mesma máquina),
// e uma regressão real derruba as 3. Orçamento de recurso e acessibilidade não oscilam.
// Os orçamentos de recurso vêm de scripts/orcamentos-peso.json (a mesma fonte do `npm run peso`).
const orcamentos = require("./scripts/orcamentos-peso.json");

// As 6 rotas principais do plano. `staticDistDir` serve o dist/ com compressão (gzip), como o nginx da produção.
const ROTAS = ["/", "/consultoria/", "/educacao/", "/trajetoria/", "/pedro/", "/explorar/"];

const KIB = 1024;

// Metas de categoria (ADR 009). Acessibilidade = 1: o axe do E2E já exige 0 violações, então nota menor é regressão.
const CATEGORIAS = {
  "categories:performance": ["error", { minScore: 0.9 }],
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 0.95 }],
  "categories:seo": ["error", { minScore: 0.95 }],
};

function orcamentoDa(rota) {
  const chave = rota === "/" ? "/" : rota.replace(/\/$/, "");
  return orcamentos.rotas[chave] ?? orcamentos.padrao;
}

// Coerência com o orçamento de peso: o JS transferido (gzip) não passa do `jsGzKB` da rota e nada de terceiros.
// O peso total do Lighthouse inclui fontes (que o `npm run peso` exclui de propósito), por isso o teto do total é
// o `pesoGzKB` da rota + uma folga fixa para as fontes auto-hospedadas (FOLGA_FONTES_KIB, medida e justificada no ADR 009).
const FOLGA_FONTES_KIB = 96;

const assertMatrix = ROTAS.map((rota) => {
  const o = orcamentoDa(rota);
  const padrao = rota === "/" ? "^https?://[^/]+/(index\\.html)?$" : `^https?://[^/]+${rota.replace(/\/$/, "")}/(index\\.html)?$`;
  return {
    matchingUrlPattern: padrao,
    assertions: {
      ...CATEGORIAS,
      "resource-summary:script:size": ["error", { maxNumericValue: o.jsGzKB * KIB }],
      "resource-summary:third-party:count": ["error", { maxNumericValue: 0 }],
      "resource-summary:total:size": ["error", { maxNumericValue: (o.pesoGzKB + FOLGA_FONTES_KIB) * KIB }],
    },
  };
});

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ROTAS.map((r) => `${r}index.html`),
      numberOfRuns: 3,
      // Sem `preset`: o padrão do Lighthouse é o perfil mobile. Flags: runner sem interface e sem sandbox (container).
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: { assertMatrix },
    upload: { target: "filesystem", outputDir: ".lighthouseci/relatorios" },
  },
};
