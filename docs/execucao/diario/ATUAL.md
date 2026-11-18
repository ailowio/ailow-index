# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S04 — Fundações: Pulso de produto — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: tokens em rem (escuro padrão, claro derivado), layout `Base.astro` (tema sem flash, botão `aria-pressed`, `@view-transition`, logo oficial em máscara), fontes `@fontsource` 5.3.0 (OFL), contraste em Vitest, `scripts/peso.mjs` + `orcamentos-peso.json` no `verify`, Playwright 1.65.1 + axe 4.14.0, job `e2e` no CI. A `/` é só um placeholder (home é a S05).
Números: testes 148 → 165; E2E 28 verdes (2 projetos). `/`: JS 0,42 KiB gz, total 3,85 KiB gz (orçamento 10 e 60).
Decisões: logo = cópia byte a byte do Cloud servida via `mask-image` (cor por tema: `#07bdd5` escuro, `#067284` claro, 4,8:1); trava por assinatura SHA-256 dos 5 `d`, não por bytes (eol do Git). Orçamento `padrao` 150 KiB para rotas sem número no ADR; chaves `/apresentacao` e `/cartao` provisórias. Playwright 1.65.1 (não 1.65.0) para o `playwright-core` do axe deduplicar. Job `e2e` separado, ainda não obrigatório. Sem SHA verificado de `upload-artifact`, não há upload de relatório.
Canários (revertidos): `--texto-2` do claro = amarelo reprovou o contraste; largura de 2000 px + imagem externa + amarelo sobre estudio reprovaram scroll, requisição externa e axe; orçamento `/` = 1 KiB reprovou o peso (exit 1).
Pendências para a próxima: S05 (home como app). O job `e2e` precisa rodar no GitHub (nunca rodou em ubuntu). Revisão visual do tema claro pelo Pedro, em lote.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s04/`.

### S05 — Home como app + Voltar — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/` é a tela inicial (widget Ailow, grade 3x2 de 6 ícones SVG, halo amarelo e pulso de fundo, barra de gesto); `App.astro` + 6 rotas "em construção" `noindex`; transição `@view-transition` com `view-transition-name: app-<id>` (ícone↔selo do cabeçalho), "abrir" 0,94→1 e "fechar" 1,05→1 (`:root:has(.tela-home)`), desligada em movimento reduzido; trava do Voltar inline (script < 1 KB gz).
Números: testes 165→171; E2E 28→138. Home: JS 0,67 KiB gz, total 5,89 KiB (orç. 10 e 60).
Decisões: desktop = moldura de aparelho (24 rem) centralizada, não grade ampla (uma só experiência, sem scroll); tokens novos `--moldura`, `--icone-fundo`, `--icone-traco` (par no teste de contraste); hora omitida (exigiria JS); "Contato" = rótulo da rota `/apresentacao`; seta das internas: `history.back()` se o referrer é do site, senão link ao pai. Voltar: pushState de reserva no 1º gesto; `popstate` sem a marca → `forward()`. Limitação: sem gesto o navegador pode sair (igual ao Cloud).
Canário (L-0006): sem o pushState de reserva, E2E (a), (b) e (b2) reprovaram; restaurado, verdes. A transição só foi vista por regras CSS, screenshot e vídeo (webm no `_scratch`); Firefox não testado.
Pendências para a próxima: S06. Revisão visual do Pedro em lote (tema claro, transição).
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots/vídeo em `D:/apps/_scratch/ailow-index-s05/`.

### S06 — `/pedro` (feed) no Pulso — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/pedro` com nome, cargo "Produtos Digitais e Operações", apresentação só com fatos, links (LinkedIn, Instagram, Entrevistas), bloco "Antes do primeiro commit", filtro por frente, painel "Ferramentas" derivado (por categoria, nº de PRs e "desde #NNN"; `<details>` fechado) e feed de 81 cartões de PR (#082 no topo; selo merged/open/closed, data AAAA-MM, `+ferramenta` na 1ª aparição, soft skills, prova pública como link e privada como texto). 87 páginas `/pedro/label/<slug>` (ferramenta = id; frente = `escopo-<id>`, porque `n8n` é ferramenta e escopo). Corpo renderizado com `render()` do Astro. Código: `src/changelog/labels.ts`, `CartaoPR.astro`, `feed.css`.
Números: testes 171 -> 179; E2E 138 -> 184 (`e2e/pedro-feed.e2e.ts`: 3 rotas x 2 temas x 2 viewports). `/pedro` 20,4 KiB gz (JS 0,62); labels 7-9 KiB; orçamento padrão 150 (labels usam o `padrao`; o script não tem curinga).
Decisões: rola só o `main` (exceção UXM-01), a página não; painel recolhido para o feed aparecer logo; chips com alvo de 48 px; sem ícone nem embed de terceiros.
Canário (L-0006): um cartão extra injetado em `/pedro` reprovou a contagem (esperado 81, recebido 82); removido. Pendentes/`fora` conferidos contra o disco.
Pendências para a próxima: S07. Revisão visual do Pedro em lote.
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots em `D:/apps/_scratch/ailow-index-s06/`.
