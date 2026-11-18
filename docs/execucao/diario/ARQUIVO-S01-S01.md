# Diário — arquivo (S01)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S01 — Scaffold — 2026-11-17 — Claude Opus 5.5
Feito: git próprio em `ailow-index` (`main`, sem commit). Astro estático, Biome, `astro check`, Vitest e `verify`. CI com 3 jobs (`verify`, `seguranca-sca`, `seguranca-segredos`; actions e gitleaks fixados por SHA, iguais ao Cloud). README, CLAUDE.md, `.env.example`, template de PR, ADR 001 (stack) e ADR 002 (changelog). Home é placeholder `noindex`.
Números: 0 → 3 testes (identidade Ailow/ailow.com.br travada). `verify` verde.
Decisões: Astro **7.3.8** provisório. O Node local é 22.14.0, e o 7.4.12 exige ≥ 22.23.4. A 7.3.8 tem advisory de XSS, e o `npm audit` mostra 12 high (Astro, picomatch via vitest/vite). O job `seguranca-sca` vai reprovar até a troca. Lição L-0030 registrada. TS 6.0.3, porque o `@astrojs/check` não aceita TS 7. Biome desliga `noUnused*` em `.astro` (só vê o frontmatter). O teste foi escrito junto com a config, não antes; o TDD de verdade começa na S02.
Pendências para a próxima: (1) o Pedro atualiza o Node; subir `astro` para 7.4.12 e zerar os `high` (picomatch pode exigir `overrides`); (2) autorizar o 1º commit; remoto `ailowio/ailow-index` só com pedido; (3) a telemetria do Astro está ligada localmente (`npx astro telemetry disable` se quiser).
Verificação: `npm run verify` → biome 8 arquivos ok · astro check 0/0/0 · vitest 3/3 · build 1 página. Canário: domínio trocado para ilo.com.br → 2 testes reprovaram; revertido.

### S02 — Modelo do changelog (TDD) — 2026-11-17 — Claude Opus 5.5
Feito: `src/changelog/` (tipos, esquemas Zod, regras, linter, carregador) e a collection `prs` em `src/content.config.ts`. Endpoint `/pedro/feed.json`: faz todo build validar o feed. Catálogos reais em `src/data/` (63 ferramentas, 10 soft skills; nenhuma `principal`, isso é do Pedro). Lista local de nomes bloqueados em `conteudo-bloqueado.local.txt` (gitignored).
Números: 3 → 66 testes. Os unitários cobrem título, ordem, duplicado, catálogo, publicáveis, diff e painel. Mais 10 testes de build real com feeds de exemplo: 1 válido e 6 canários que reprovam (duplicado, ordem, ferramenta, bloqueio, bloqueio em pendente, data).
Decisões: o Node **não** foi atualizado. Havia ~25 processos `node.exe` do sistema, incluindo o Vite :5173 e o Postgres :54329 da outra sessão. Astro continua 7.3.8. Adicionado `@types/node` 22.20.5. Escopos do feed: infra, sgi, iot, pulse, cloud, n8n, ia, video, harness, brand, negocio, talk, learn, side (o Pedro pode ampliar). O schema e os catálogos tiveram teste escrito junto com o código (sem vermelho antes); o resto foi vermelho → verde.
Pendências para a próxima: (1) Node ≥ 22.23.4 → astro 7.4.12, zerar os `high` do audit; (2) ok do Pedro para o 1º commit; (3) o Pedro cria `conteudo-bloqueado.local.txt` com os nomes reais (clientes, prospects, marca em disputa, projeto privado).
Verificação: `npm run verify` → biome 37 ok · astro check 0/0/0 · vitest 66/66 · build ok (`feed: 0 entradas`). Mutação no filtro `confirmado` → 5 testes reprovaram (incluindo o do `dist/`); revertida.
