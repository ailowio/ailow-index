# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S03d — Feed parte 3 — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: respostas do Pedro aplicadas. Feed 67 → 82 entradas (81 publicadas, 1 `fora`): 19 pendentes resolvidas, #027 virou `fora`, 15 novas (9 fluxos n8n, 4 certificações do LinkedIn, quadro NR-10/12, Conta Azul desfeita, nº 72, release 2.425.2 do SGI de 20/10/2026). Vercel anexada ao nº 27 (Netlify ~10 dias em jan/2026, depois Vercel). Catálogo 78 → 88 ferramentas (nenhuma `principal`).
Renumeração: permitida só porque nada foi publicado (ordem número × data). **A partir do deploy (S12), o feed vira append-only.**
Decisões e interpretações (números novos): #062 (MVP desligado) = 28/08/2026 pelo acervo de vídeo (o Pedro disse "por volta de setembro"); #063 (firmware v1.8) datado de 31/08 (cabeçalho) com binário de 21/10; #032 (webhook do gateway): o sketch v1.0 usa cliente HTTP (endereço HTTPS). Sem evidência verificável: Cloudflare (só no catálogo), hospedagem do Outline e do Jessica.
Verificação: `npm run verify` verde (148 testes; `feed: 82 entradas, 81 publicadas`). Canário: entrada #083 com data de 2025-01 reprovou o build ("#083 (2025-01) é anterior a #082"); removida, build verde. Grep em `src/content/prs/` e `src/data/` sem IP, R$, @, `ilo.`, INPI, credencial, telefone nem nomes de terceiros.

### S05 — Home como app + Voltar — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/` é a tela inicial (widget Ailow, grade 3x2 de 6 ícones SVG, halo amarelo e pulso de fundo, barra de gesto); `App.astro` + 6 rotas "em construção" `noindex`; transição `@view-transition` com `view-transition-name: app-<id>` (ícone↔selo do cabeçalho), "abrir" 0,94→1 e "fechar" 1,05→1 (`:root:has(.tela-home)`), desligada em movimento reduzido; trava do Voltar inline (script < 1 KB gz).
Números: testes 165→171; E2E 28→138. Home: JS 0,67 KiB gz, total 5,89 KiB (orç. 10 e 60).
Decisões: desktop = moldura de aparelho (24 rem) centralizada, não grade ampla (uma só experiência, sem scroll); tokens novos `--moldura`, `--icone-fundo`, `--icone-traco` (par no teste de contraste); hora omitida (exigiria JS); "Contato" = rótulo da rota `/apresentacao`; seta das internas: `history.back()` se o referrer é do site, senão link ao pai. Voltar: pushState de reserva no 1º gesto; `popstate` sem a marca → `forward()`. Limitação: sem gesto o navegador pode sair (igual ao Cloud).
Canário (L-0006): sem o pushState de reserva, E2E (a), (b) e (b2) reprovaram; restaurado, verdes. A transição só foi vista por regras CSS, screenshot e vídeo (webm no `_scratch`); Firefox não testado.
Pendências para a próxima: S06. Revisão visual do Pedro em lote (tema claro, transição).
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots/vídeo em `D:/apps/_scratch/ailow-index-s05/`.

### S04 — Fundações: Pulso de produto — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: tokens em rem (escuro padrão, claro derivado), layout `Base.astro` (tema sem flash, botão `aria-pressed`, `@view-transition`, logo oficial em máscara), fontes `@fontsource` 5.3.0 (OFL), contraste em Vitest, `scripts/peso.mjs` + `orcamentos-peso.json` no `verify`, Playwright 1.65.1 + axe 4.14.0, job `e2e` no CI. A `/` é só um placeholder (home é a S05).
Números: testes 148 → 165; E2E 28 verdes (2 projetos). `/`: JS 0,42 KiB gz, total 3,85 KiB gz (orçamento 10 e 60).
Decisões: logo = cópia byte a byte do Cloud servida via `mask-image` (cor por tema: `#07bdd5` escuro, `#067284` claro, 4,8:1); trava por assinatura SHA-256 dos 5 `d`, não por bytes (eol do Git). Orçamento `padrao` 150 KiB para rotas sem número no ADR; chaves `/apresentacao` e `/cartao` provisórias. Playwright 1.65.1 (não 1.65.0) para o `playwright-core` do axe deduplicar. Job `e2e` separado, ainda não obrigatório. Sem SHA verificado de `upload-artifact`, não há upload de relatório.
Canários (revertidos): `--texto-2` do claro = amarelo reprovou o contraste; largura de 2000 px + imagem externa + amarelo sobre estudio reprovaram scroll, requisição externa e axe; orçamento `/` = 1 KiB reprovou o peso (exit 1).
Pendências para a próxima: S05 (home como app). O job `e2e` precisa rodar no GitHub (nunca rodou em ubuntu). Revisão visual do tema claro pelo Pedro, em lote.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s04/`.

