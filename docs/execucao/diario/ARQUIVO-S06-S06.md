# Diário — arquivo (S06)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S06 — `/pedro` (feed) no Pulso — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/pedro` com nome, cargo "Produtos Digitais e Operações", apresentação só com fatos, links (LinkedIn, Instagram, Entrevistas), bloco "Antes do primeiro commit", filtro por frente, painel "Ferramentas" derivado (por categoria, nº de PRs e "desde #NNN"; `<details>` fechado) e feed de 81 cartões de PR (#082 no topo; selo merged/open/closed, data AAAA-MM, `+ferramenta` na 1ª aparição, soft skills, prova pública como link e privada como texto). 87 páginas `/pedro/label/<slug>` (ferramenta = id; frente = `escopo-<id>`, porque `n8n` é ferramenta e escopo). Corpo renderizado com `render()` do Astro. Código: `src/changelog/labels.ts`, `CartaoPR.astro`, `feed.css`.
Números: testes 171 -> 179; E2E 138 -> 184 (`e2e/pedro-feed.e2e.ts`: 3 rotas x 2 temas x 2 viewports). `/pedro` 20,4 KiB gz (JS 0,62); labels 7-9 KiB; orçamento padrão 150 (labels usam o `padrao`; o script não tem curinga).
Decisões: rola só o `main` (exceção UXM-01), a página não; painel recolhido para o feed aparecer logo; chips com alvo de 48 px; sem ícone nem embed de terceiros.
Canário (L-0006): um cartão extra injetado em `/pedro` reprovou a contagem (esperado 81, recebido 82); removido. Pendentes/`fora` conferidos contra o disco.
Pendências para a próxima: S07. Revisão visual do Pedro em lote.
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots em `D:/apps/_scratch/ailow-index-s06/`.
