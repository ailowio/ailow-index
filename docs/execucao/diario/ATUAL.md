# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S03c — ADR 003 aceito + plano S04+ — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: ADR 003 com status Aceito e as 13 decisões do Pedro (áudio de 18/11) registradas; exceções: UXM-01 fica, UXM-03 removida (o Voltar nunca sai do site), UXM-08 trocada pelo Pulso. Plano: Contrato 7 (delegação de merge ao orquestrador), tabela S03d–S13, Estado sobrescrito, A1 reduzido a 1 linha. `roteiro-pitch.md` virou o prompt do pitch.
Referências citadas no ADR (só leitura): UXM-03 em `harness/practices/ux-mobile.md:16`; Voltar do Cloud em `ailow-cloud/apps/web/src/componentes/navegacao.tsx:14-45`; `uqr` 0.1.3 nos `package.json` do Cloud.
Decisões: nenhuma nova do agente. Interpretações: "Material" lido como "mesmas diretrizes de parecer app do Cloud, sem imitar Material à risca"; custo de JS do Voltar (≤ 1 KB gz) é estimativa a medir na S05.
Pendências para a próxima: S03d (feed parte 3, sem UI). LinkedIn, os 75 fluxos n8n e o Instagram já foram lidos pelo orquestrador (insumos no Estado de retomada).
Verificação: `npm run verify` verde pelo orquestrador (ver PR).

### S03d — Feed parte 3 — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: respostas do Pedro aplicadas. Feed 67 → 82 entradas (81 publicadas, 1 `fora`): 19 pendentes resolvidas, #027 virou `fora`, 15 novas (9 fluxos n8n, 4 certificações do LinkedIn, quadro NR-10/12, Conta Azul desfeita, nº 72, release 2.425.2 do SGI de 20/10/2026). Vercel anexada ao nº 27 (Netlify ~10 dias em jan/2026, depois Vercel). Catálogo 78 → 88 ferramentas (nenhuma `principal`).
Renumeração: permitida só porque nada foi publicado (ordem número × data). **A partir do deploy (S12), o feed vira append-only.**
Decisões e interpretações (números novos): #062 (MVP desligado) = 28/08/2026 pelo acervo de vídeo (o Pedro disse "por volta de setembro"); #063 (firmware v1.8) datado de 31/08 (cabeçalho) com binário de 21/10; #032 (webhook do gateway): o sketch v1.0 usa cliente HTTP (endereço HTTPS). Sem evidência verificável: Cloudflare (só no catálogo), hospedagem do Outline e do Jessica.
Verificação: `npm run verify` verde (148 testes; `feed: 82 entradas, 81 publicadas`). Canário: entrada #083 com data de 2025-01 reprovou o build ("#083 (2025-01) é anterior a #082"); removida, build verde. Grep em `src/content/prs/` e `src/data/` sem IP, R$, @, `ilo.`, INPI, credencial, telefone nem nomes de terceiros.

### S04 — Fundações: Pulso de produto — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: tokens em rem (escuro padrão, claro derivado), layout `Base.astro` (tema sem flash, botão `aria-pressed`, `@view-transition`, logo oficial em máscara), fontes `@fontsource` 5.3.0 (OFL), contraste em Vitest, `scripts/peso.mjs` + `orcamentos-peso.json` no `verify`, Playwright 1.65.1 + axe 4.14.0, job `e2e` no CI. A `/` é só um placeholder (home é a S05).
Números: testes 148 → 165; E2E 28 verdes (2 projetos). `/`: JS 0,42 KiB gz, total 3,85 KiB gz (orçamento 10 e 60).
Decisões: logo = cópia byte a byte do Cloud servida via `mask-image` (cor por tema: `#07bdd5` escuro, `#067284` claro, 4,8:1); trava por assinatura SHA-256 dos 5 `d`, não por bytes (eol do Git). Orçamento `padrao` 150 KiB para rotas sem número no ADR; chaves `/apresentacao` e `/cartao` provisórias. Playwright 1.65.1 (não 1.65.0) para o `playwright-core` do axe deduplicar. Job `e2e` separado, ainda não obrigatório. Sem SHA verificado de `upload-artifact`, não há upload de relatório.
Canários (revertidos): `--texto-2` do claro = amarelo reprovou o contraste; largura de 2000 px + imagem externa + amarelo sobre estudio reprovaram scroll, requisição externa e axe; orçamento `/` = 1 KiB reprovou o peso (exit 1).
Pendências para a próxima: S05 (home como app). O job `e2e` precisa rodar no GitHub (nunca rodou em ubuntu). Revisão visual do tema claro pelo Pedro, em lote.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s04/`.

