# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V07 — Na TV (entrevistas) — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, V07, retomada, V06; ADR 005, 007 item 5; brainstorm §5.2; `.vtt` dos teasers; roteiro da série (bancada).
Feito: `/na-tv` com a escada UFC → Record → afiliada Globo em tarjas de TV (GC) no Pulso, só com o nome em texto; P1 e P2 no degrau da UFC com 4 chips cada (tempo = início de um cue do `.vtt`) e legenda grande fora do quadro (a nativa fica `hidden`: os teasers já têm legenda queimada). Fachada do YouTube (`FachadaYoutube.astro` + `fachada-youtube.ts`, cliente 1 KB) só com `youtubeId`: hoje nenhum, nada renderiza, CSP intacta; I-12 no inventário como inativa. `/pedro/entrevistas` → 301 `/na-tv/` no nginx (+ meta refresh noindex do build); ícone "Na TV" na home; sitemap. `peso.mjs` passa a contar `poster=`. Versão 1.9.0.
Decisões (delegação): P2 no degrau da UFC, não da Record (o pôster traz o selo "UFC · Experiências Inspiradoras" e a fala é da UFC); fotos das emissoras fora (têm bug/logo; arquivos e dados de `entrevistas.ts` ficam); `/na-tv` com orçamento 150 (os 400 do ADR 003 eram das fotos); pai da seta = início.
Testes antigos alterados (comentário "V07 · 2026-11-20 · ADR 007 item 5"): `entrevistas.e2e.ts`, `voltar-regressao.e2e.ts` (H1, H1b, H3), `home-app.e2e.ts` (c), `csp.e2e.ts`, `pedro-feed.e2e.ts`, `apresentacao.e2e.ts`, `entrevistas.test.ts`, `indexacao.test.ts`, `apresentacao.test.ts`, `peso.test.ts`, `scripts/smoke-imagem.mjs`.
Canários (L-0006): chip fora do cue, iframe no HTML, iframe no carregamento, 302 no nginx (Vitest vermelho); `preload="auto"` e seek +2 s (E2E vermelho); pôster acima do teto (peso). Revertidos.
Falhas no caminho: preview na 4330 esquecido travou o `webServer` do Playwright (L-0012); estilo computado de `<source>`/`<track>` vem vazio.
Números: Vitest 504 → 529; E2E 686 → 734 passed; `/na-tv` JS 1,09/10 KiB, peso 60,7/150; `/apresentacao` e `/bio` 28,65 → 50,2 (pôster passou a contar).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v07/`.

### V08 — Chão de Fábrica — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, V08, retomada, V07; ADR 006, 007 item 5; brainstorm §5.6; colheita de IoT §5 e §7; #080, #081 e vizinhas; READMEs dos episódios na bancada (só leitura).
Feito: `/chao-de-fabrica` com a série presa a um "cabo" (borne amarelo por episódio); #1 (10/11) e #2 (11/11) com os pacotes da V06 (`preload="none"`, pôster, `.vtt`, "Narração com voz gerada por IA"), reaproveitando CSS e script da `/na-tv`; #3 "Firmware v1.9" como relatório de campo (sintoma → hipótese → o que era → decisão → estado) só com o texto da #080. Provas: #081, #062, #076, #080. Fita "em validação" no sensor em cada máquina (#081) e na v1.9 (#080). Links no `/pedro` e na `/na-tv`; sitemap; selo em `SECOES` (home intacta). Caixa de legenda: antes do play só a dica (68 → ~36 px), 2 linhas no primeiro play. Versão 1.10.0.
Decisões (delegação): datas = pastas da bancada (10/11 está na prova da #081; #2 = "ontem" no vídeo); `fatos` dos `site.json` seguem `[]` (ligação no `src/data`, sem mexer no pacote); sem link na home (grade de 6 e 360×640 da V02); "#3" sem vídeo e sem "em breve" (brief da bancada: "estou validando").
Testes antigos alterados (comentário "V08 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/chao-de-fabrica/`).
Canários (L-0006): "todas as máquinas, rodando" e "30 máquinas" (Vitest vermelho); `preload="auto"` (2 E2E vermelhos); caixa de legenda com 68 px (4 E2E vermelhos antes do CSS). Revertidos.
Falhas no caminho: o teste de números passou com "30" (os tempos do `.vtt` contavam): passou a ler só a fala e o número inteiro; título do cabeçalho com reticências em 360 px (visto no screenshot): fonte reduzida só nesta página + E2E.
Números: Vitest 529 → 544; E2E 734 → 776 passed; `/chao-de-fabrica` JS 1,16/10 KiB, peso 111,4/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v08/`.

### V09 — Diário de obra — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, V09, retomada, V08; ADR 002, 007 itens 3–4; brainstorm §4; `src/changelog/`; as 26 de vitrine.
Feito: `/pedro` vira "Diário de obra" (cabeçalho, aba, OG, subtítulo; "Todas as entregas"); /apresentacao, /cloud, /pulse, labels, stack e /explorar sem "portfólio"/"feed". Lente "Para empresários / Para técnicos" (2 botões `aria-pressed`, `src/scripts/lente.ts`, sessionStorage com try/catch). `resumo_dono` opcional no Zod (10–220 car., linter) e preenchido nas 26 de vitrine. "Os 3 que eu mostraria numa visita": #047, #069, #078. Versão 1.11.0.
Decisões (delegação): sem JS = leitura técnica, seletor escondido e o resumo rotulado "Para empresários:" no cartão; sem resumo, no modo empresário = título sem o prefixo `tipo(escopo):` + prova (corpo, ferramentas e skills somem); técnica é a padrão também com JS; visita = uma por frente (iot, sgi, cloud), `merged`, fora da fila V10/V11; ícone da home "Diário" (1 palavra; o link "Diário de obra" segue único); #081 resumida sem "todas as máquinas" nem "concluída" (lista da V08), #069 com o glossário "o sistema da fábrica".
Testes antigos alterados (comentário "V09 · 2026-11-20 · ADR 007 item 3"): `pedro-feed.e2e.ts` e `voltar-regressao.e2e.ts` (H2) ("Todo o feed" → "Todo o Diário de obra"), `stack.e2e.ts` ("sem entrada no feed").
Canários (L-0006): resumo com IPv4 fora do linter (build verde → vermelho); "30" e "todas as máquinas" no resumo da #081 (2 Vitest vermelhos); CSS da lente sem esconder o técnico (E2E vermelho). Revertidos.
Falhas no caminho: título cortado em 360 px (E2E pegou; fonte por `data-app`); erro nos builds de fixture sem #047/#069/#078 (agora filtra; o teste garante as 3); busca de "Todo o feed" cortada por `head`: 8 E2E vermelhos na 1ª rodada.
Números: Vitest 544 → 574; E2E 776 → 814 passed; `/pedro` JS 1,03/10 KiB, peso 29,4/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v09/`.
