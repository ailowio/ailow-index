# Diário — arquivo (S04)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S04 — Fundações: Pulso de produto — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: tokens em rem (escuro padrão, claro derivado), layout `Base.astro` (tema sem flash, botão `aria-pressed`, `@view-transition`, logo oficial em máscara), fontes `@fontsource` 5.3.0 (OFL), contraste em Vitest, `scripts/peso.mjs` + `orcamentos-peso.json` no `verify`, Playwright 1.65.1 + axe 4.14.0, job `e2e` no CI. A `/` é só um placeholder (home é a S05).
Números: testes 148 → 165; E2E 28 verdes (2 projetos). `/`: JS 0,42 KiB gz, total 3,85 KiB gz (orçamento 10 e 60).
Decisões: logo = cópia byte a byte do Cloud servida via `mask-image` (cor por tema: `#07bdd5` escuro, `#067284` claro, 4,8:1); trava por assinatura SHA-256 dos 5 `d`, não por bytes (eol do Git). Orçamento `padrao` 150 KiB para rotas sem número no ADR; chaves `/apresentacao` e `/cartao` provisórias. Playwright 1.65.1 (não 1.65.0) para o `playwright-core` do axe deduplicar. Job `e2e` separado, ainda não obrigatório. Sem SHA verificado de `upload-artifact`, não há upload de relatório.
Canários (revertidos): `--texto-2` do claro = amarelo reprovou o contraste; largura de 2000 px + imagem externa + amarelo sobre estudio reprovaram scroll, requisição externa e axe; orçamento `/` = 1 KiB reprovou o peso (exit 1).
Pendências para a próxima: S05 (home como app). O job `e2e` precisa rodar no GitHub (nunca rodou em ubuntu). Revisão visual do tema claro pelo Pedro, em lote.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s04/`.
