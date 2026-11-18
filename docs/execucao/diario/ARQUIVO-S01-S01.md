# Diário — arquivo (S01)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S01 — Scaffold — 2026-11-17 — Claude Opus 5.5
Feito: git próprio em `ailow-index` (`main`, sem commit). Astro estático, Biome, `astro check`, Vitest e `verify`. CI com 3 jobs (`verify`, `seguranca-sca`, `seguranca-segredos`; actions e gitleaks fixados por SHA, iguais ao Cloud). README, CLAUDE.md, `.env.example`, template de PR, ADR 001 (stack) e ADR 002 (changelog). Home é placeholder `noindex`.
Números: 0 → 3 testes (identidade Ailow/ailow.com.br travada). `verify` verde.
Decisões: Astro **7.3.8** provisório. O Node local é 22.14.0, e o 7.4.12 exige ≥ 22.23.4. A 7.3.8 tem advisory de XSS, e o `npm audit` mostra 12 high (Astro, picomatch via vitest/vite). O job `seguranca-sca` vai reprovar até a troca. Lição L-0030 registrada. TS 6.0.3, porque o `@astrojs/check` não aceita TS 7. Biome desliga `noUnused*` em `.astro` (só vê o frontmatter). O teste foi escrito junto com a config, não antes; o TDD de verdade começa na S02.
Pendências para a próxima: (1) o Pedro atualiza o Node; subir `astro` para 7.4.12 e zerar os `high` (picomatch pode exigir `overrides`); (2) autorizar o 1º commit; remoto `ailowio/ailow-index` só com pedido; (3) a telemetria do Astro está ligada localmente (`npx astro telemetry disable` se quiser).
Verificação: `npm run verify` → biome 8 arquivos ok · astro check 0/0/0 · vitest 3/3 · build 1 página. Canário: domínio trocado para ilo.com.br → 2 testes reprovaram; revertido.
