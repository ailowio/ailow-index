# ADR 001: Construir o site da Ailow como site estático em Astro

- **Status:** aceito (escolha do Pedro em 2026-11-17, entre as alternativas abaixo)
- **Data:** 2026-11-17
- **Decisores:** Pedro (dono do produto); proposta preparada pelo agente
- **Tier do app:** A
- **Regras do harness relacionadas:** PROC-03, ARQ-08/09, ENV-19, CI-01, SEC-05/10, DOC-02

## Contexto

A Ailow precisa de um site institucional na raiz de `ailow.com.br`. O ERP continua em `cloud.ailow.com.br`.
O site tem páginas da marca (`/`, `/pulse`, `/cloud`) e o portfólio do Pedro em `/pedro`, escrito como
um changelog em feed de PRs (ADR 002). O conteúdo é texto e dados que mudam por PR; não há login,
formulário nem dado de terceiro. Quem mantém é uma pessoa só, com agente de IA.

Nome e domínio: a discovery travou entre "ILO" (como na fala) e "Ailow" (como em todo artefato).
O Pedro cravou **Ailow** e **ailow.com.br** em 2026-11-17. O teste `test/site.test.ts` trava essa decisão.

## Atributos de qualidade afetados

| Atributo | Meta | Efeito desta decisão |
|---|---|---|
| JS enviado por página | ≤ 10 KB gzip (meta: zero) | Astro não envia JS por padrão |
| Requisições a terceiros no carregamento | 0 | fontes e imagens auto-hospedadas |
| Layout em 360 px e 1280 px, claro e escuro | sem scroll horizontal | medido por E2E (S04) |
| Acessibilidade | axe sem `serious`/`critical` | medido por E2E (S04) |

## Decisão

- Astro em `output: "static"`, com content collections e schema Zod para o changelog.
- Biome (lint), `astro check` (tipos), Vitest (regras do conteúdo), Playwright + axe (E2E, a partir da S04).
- `npm run verify` = lint + check + testes + build, igual local e no CI.
- Hospedagem prevista (S07, só com pedido): imagem nginx estática na VPS atrás do Traefik existente.
- Repositório git próprio em `D:\apps\ailow-index` (o `D:\apps` não tem commits; L-0010).

## Alternativas consideradas

1. **Vite + React + Mantine (mesma stack do web do Cloud)** — descartada porque um SPA precisa de
   prerender para SEO e envia o runtime do React em toda página, sem ganho para um site de conteúdo.
   O ganho (tokens e fontes prontos) se obtém copiando os tokens CSS.
2. **Next.js em export estático (usado no jac)** — descartada porque traz mais framework do que um
   site de conteúdo precisa e o export estático tem restrições que não compensam aqui.

## Consequências

- **Positivas:** HTML puro e rápido; o changelog vira arquivos `.md` validados no build; nada para operar
  além de um nginx.
- **Negativas / custo:** stack nova no monorepo; Biome só enxerga o frontmatter dos `.astro`
  (por isso `noUnusedImports`/`noUnusedVariables` estão desligados nesses arquivos; o `astro check` cobre os tipos).
- **Versões (ENV-19, conferidas no registro npm em 2026-11-17):**
  - `astro` latest = 7.4.12, que exige Node ≥ 22.23.4. O Node local é 22.14.0.
  - Na S01 ficou provisoriamente em 7.3.8 (última que aceita Node 22.12), que tinha advisory de XSS
    (≤ 7.4.4) (lição L-0030). Em 2026-11-18 o Node local foi para 22.23.5 e o Astro para **7.4.12**.
  - Resta o `picomatch` (GHSA-fc5q-39xc-vjpf, ReDoS, sem versão corrigida publicada), só em ferramentas
    de build. Exceção **EX-02** em `docs/excecoes.md`; o check obrigatório segue a política do Cloud
    (`npm audit --omit=dev`).
  - `@astrojs/check` 0.9.12 aceita TypeScript 5/6, por isso TypeScript **6.0.3** (o Cloud usa 7).
- **Como saberemos que deu certo:** `verify` verde; critérios de aceite do plano (`docs/execucao/plano.md`).
- **Revisão em:** 2026-12-18 (junto com a EX-02) ou na próxima major do Astro.
