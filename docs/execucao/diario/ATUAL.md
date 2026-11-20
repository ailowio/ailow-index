# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V01 — Decisões (ADRs 005–008) — 2026-11-20 — Claude Opus 5.5 (orquestrador)
Leu: Contrato, linha V01, Estado de retomada, última entrada; brainstorm §1–§6, §8–§11; transcrição de 19/11 (trechos de YouTube e do feed); ADR 002/003; `claims.csv` (C04, C11, C16); CSP do nginx.
Feito: ADR 005 (teaser ≤ 60 s/8 MB auto-hospedado; longo no YouTube só por fachada, iframe `youtube-nocookie` criado no toque, `frame-src` só nas rotas com fachada); ADR 006 (site mestre, `status_fato` nas entradas de vitrine, coluna `fato_site` no CSV, script de conciliação local, CI nunca lê a bancada); ADR 007 (duas portas iguais + "Conhecer a história" abaixo, escada, feed = "Diário de obra" secundário com `/pedro` mantido, rotas novas por sessão, stories para o backlog); ADR 008 (pacote `final/site/<slug>/` com `site.json` Zod, tetos, importador local, bancada sem git, tokens com teste de deriva, interface I-13 na V05). CLAUDE.md: regra "zero terceiros antes do toque".
Decisões: as de mérito são do Pedro (19/11: YouTube aceito, duas portas + escada, fonte = site, feed secundário). Nome "Diário de obra", URL `/pedro` mantida, bancada sem git, `/historia` fora do v2 e os tetos foram decididos pelo orquestrador por delegação (18/11 e 20/11), registrados nos ADRs.
Pendências: o Pedro sobe as entrevistas longas no YouTube (não listado) e passa os ids; até lá a V07 usa só teasers.
Verificação: `npm run verify` exit 0 (só docs mudaram).

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
Leu: Contrato, linha V03, retomada, V02; ADR 007; brainstorm §1 e §5.4; colheita de IoT §6–§7 (só a #081).
Feito: método em 4 etapas com "Na Copel" e as entradas que provam; escada (Aprender → `/educacao`); casos Copel e Cloud "com a loja piloto"; raio-x de 5 perguntas em forma de OS (`mensagemRaioX`/`linkRaioX` em `contato.ts`, prévia da mensagem, envio abre o `wa.me`). Textos em `src/data/consultoria.ts`; teste exige entrada confirmada por bloco e todo número presente numa delas. Rota indexável, no sitemap. Versão 1.6.0.
Decisões (delegação): sem nome do cliente do Cloud (o feed #070 e o `/cloud` já citam: fica para o Pedro); "todas as máquinas" da #081 não é repetido (contradição em aberto na colheita); sem foto/clipe por etapa e sem slot de vídeo até a V05/V06; botão de enviar desligado sem JS (o form não manda nada ao servidor nem sem JS).
Testes antigos alterados (comentário "V03 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (lista ganha `/consultoria/`) e o placeholder do `v02-home.e2e.ts` (fica só `/educacao`).
Falhas no caminho: (1) o rádio invisível sobre o chip intercepta o clique no texto (o teste passou a tocar o rádio); (2) o `astro preview` de screenshot na 4330 impediu o webServer do Playwright na 4329 ("another preview running"): parado e porta conferida (L-0012); (3) a escada do desktop não subia (`align-items: end`): virou teste.
Canários (L-0006): "em 30 dias" no texto, `/consultoria/` fora da lista, `sessionStorage` no script (Vitest vermelho); pixel `/px` ao digitar, `turnos` trocado no envio, escada com `end` (E2E vermelho). Revertidos.
Números: Vitest 367 → 402; E2E 608 → 648 passed; `/consultoria` JS 1,63/10 KiB, peso 16,3/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v03/` (360 e 1440, 2 temas, página inteira).
