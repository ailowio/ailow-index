# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V02 — Home v2 — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V02, retomada, V01; ADR 007; ADR 003 (home).
Feito: home com a frase da F0 + duas portas de mesmo peso (`PORTAS` em `src/config/apps.ts`: "Fazer na minha empresa" → `/consultoria`, "Levar para minha instituição" → `/educacao`), WhatsApp, "Conhecer a história" (`/apresentacao`, menor) e "Diário de obra" (`/pedro`); grade de apps abaixo, sob a linha de pulso (saiu do fundo: cruzava os links). Pulso no toque (`.batida`, anel + onda no ponto tocado, atrás do conteúdo). Placeholders `/consultoria` e `/educacao` (App + "Em construção" + oferta + WhatsApp `[consultoria]`/`[educação]`). Versão 1.5.0.
Decisões (delegação): placeholders com noindex até a V03/V04; frase da F0 mantida inteira (o teste da F0 exige "cursos de IA"); margem lateral da home 24 → 16 px; em 360x640 a grade não aparece sem rolar (só o conteúdo rola).
Testes antigos alterados (comentário "V02 · 2026-11-20 · ADR 007"): home-app "360x640 não rola e os 6 ícones…" e "estado de toque" (rolar até a grade antes); f0 "360x640" e "1280x800" dos ícones (idem). Critérios iguais.
Falhas no caminho: (1) o minificador fundiu `.app` e `.batida` numa regra só e o teste antigo do movimento reduzido (regex do `cssText`) ficou vermelho: bloco próprio para a `.batida`; (2) no desktop o pulso nascia 8 px fora (borda da moldura): `clientLeft/Top`; (3) dois canários de CSS juntos se anularam (título menor encolheu as portas): refeitos um a um.
Canários (L-0006): fonte diferente numa porta → "mesmo peso" vermelho; +2rem acima da história → 607,9 > 584; sem reduced-motion da `.batida` → vermelho; `/consultoria` indexável → vermelho; JS da home 0,5 KiB → `peso` estourou. Revertidos e conferidos.
Números: Vitest 363 → 367; E2E 558 → 608 passed; peso `/` 12,5/60 KiB (JS 0,67/10), `/consultoria` e `/educacao` 11,8/150 (JS 0,70).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v02/`.

### V03 — `/consultoria` — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V03, retomada, V02; ADR 007; brainstorm §1/§5.4; colheita de IoT §7 (#081).
Feito: método em 4 etapas com "Na Copel" e as entradas que provam; escada (Aprender → `/educacao`); casos Copel e Cloud "com a loja piloto"; raio-x de 5 perguntas em forma de OS (`mensagemRaioX`/`linkRaioX` em `contato.ts`, prévia da mensagem, envio abre o `wa.me`). Textos em `src/data/consultoria.ts`; teste exige entrada confirmada por bloco e todo número presente numa delas. Rota indexável, no sitemap. Versão 1.6.0.
Decisões (delegação): sem nome do cliente do Cloud (o feed #070 e o `/cloud` já citam: fica para o Pedro); "todas as máquinas" da #081 não é repetido (contradição em aberto na colheita); sem foto/clipe por etapa e sem slot de vídeo até a V05/V06; botão de enviar desligado sem JS (o form não manda nada ao servidor nem sem JS).
Testes antigos alterados (comentário "V03 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (lista ganha `/consultoria/`) e o placeholder do `v02-home.e2e.ts` (fica só `/educacao`).
Falhas no caminho: (1) o rádio invisível sobre o chip intercepta o clique no texto (o teste passou a tocar o rádio); (2) o `astro preview` de screenshot na 4330 impediu o webServer do Playwright na 4329 ("another preview running"): parado e porta conferida (L-0012); (3) a escada do desktop não subia (`align-items: end`): virou teste; (4) no CI o `getAnimations()` pegou 7 transições de 0,01 ms do reduced-motion global: conta só duração > 1 ms (canário `animate()` de 5 s reprova).
Canários (L-0006): "em 30 dias" no texto, `/consultoria/` fora da lista, `sessionStorage` no script (Vitest vermelho); pixel `/px` ao digitar, `turnos` trocado no envio, escada com `end` (E2E vermelho). Revertidos.
Números: Vitest 367 → 402; E2E 608 → 648 passed; `/consultoria` JS 1,63/10 KiB, peso 16,3/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v03/` (360 e 1440, 2 temas, página inteira).

### V04 — `/educacao` — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V04, retomada, V03; ADR 007; brainstorm §1/§5.5; ESTRATEGIA §3.4/§4 e TRAJETORIA §1/§3 (bancada); README da série Ensinando IA.
Feito: formatos (palestra, oficina, trilha) com selo "Proposta" e sem número; áreas temáticas; palco e mídia (#044, #048, #014, #012) com o tipo real; "do outro lado da mesa" (Sebraetec, IEL, FIEC, Sebrae); kit do analista em ficha; escada com o Aprender em destaque e o Automatizar → `/consultoria`. Textos em `src/data/educacao.ts`. Sem script. Indexável, no sitemap. Versão 1.7.0.
Decisões (delegação): "ensinei a equipe a usar o ChatGPT" fora (só no áudio, sem revisão); sem CNPJ, ementa, duração ou valor; credenciamento: páginas do Sebrae por JS e editais PDF ilegíveis aqui, então "não verificado" e só "consulte a sua instituição"; sem citar a série (IA-00 só em 23/11).
Testes antigos alterados (comentário "V04 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/educacao/`); `v02-home.e2e.ts` perde o bloco de placeholder (sem rota).
Falhas no caminho: (1) "Exemplos reais" caiu no filtro de preço (`reais`): texto trocado; (2) meu E2E "sem script no main" pegou o script da seta do layout: passou a aceitar só ele (a regra "sem script próprio" fica no Vitest).
Canários (L-0006): "oficina de 4 h", "Para 40 empresários", "Sou credenciado… edital" (Vitest vermelho); destaque só pela cor (E2E vermelho). Revertidos.
Números: Vitest 402 → 462; E2E 648 → 684 passed; `/educacao` JS 0,70/10 KiB, peso 15,5/150.
Pendências: ver "Pendências do Pedro" na retomada (itens da V04).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v04/`.
