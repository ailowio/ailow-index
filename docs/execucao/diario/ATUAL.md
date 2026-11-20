# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V06 — Pacotes de vídeo — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: Contrato, linha V06, retomada, V05; ADR 005/008; STATUS e PUBLICAR da bancada.
Feito: 5 pacotes importados (6 prontos na bancada; P3 retirado, ver abaixo) em `final/site/<slug>/` da bancada (só essa pasta), importados com `npm run importar-midia`: `teaser-p1-improvisar-sob-pressao`, `teaser-p2-teoria-na-pratica`, `fixado-00-o-que-eu-faco`, `chao-1-dois-quadros`, `chao-2-sinal-chegou`. 720x1280, 5,2–6,9 MB; pôster 15–67 KB; `.vtt` pela AssemblyAI (chave lida dentro do script, nunca impressa). `/apresentacao` e `/bio` ganham o Fixado 00 no slot (`preload="none"`, aviso "parte da imagem e da voz é gerada por IA"). Versão 1.8.0.
Decisões (delegação): E6 (v5, 76 s, sem teaser) NÃO importado: pendência "subir no YouTube"; Fixado 00 como pitch (aprovado v8; é clone e voz de IA, `selo_ia` true; o pitch "gravado por ele" do ADR 003 segue possível depois); `aprovado_em` = 2026-11-19 (data do STATUS, que não traz data por peça); `fatos` vazio (V08 liga #080/#081); `selo_ia` true também nos 2 Chão (tarja "VOZ IA"); teasers sem selo (entrevista real).
Revisão de tela (1 frame a cada 3 s, 6 derivados olhados): sem CNPJ, NF, IP, placa nem nome de cliente. Ressalva: no P3 (t≈27–36 s) aparece, desfocada, uma tela do ERP com colunas "R$" ilegíveis e a marca de emissora no rodapé borrado; o orquestrador viu o frame de 31 s (datas legíveis, "R$" parcial) e RETIROU o P3 do PR (pacote segue em `final/site/` da bancada; pendência do Pedro: vetar ou liberar, e reimportar se liberar).
Testes antigos alterados (comentário V06): `e2e/apresentacao.e2e.ts`, "zero requisição…": `video` count 0 → 1 com `preload="none"` (mesma prova de 0 mídia antes do toque).
Canários (L-0006): `preload="auto"` deixou 4 E2E vermelhos (revertido); `violacoes()` reprova arquivo > 8 MB, vídeo sem `.vtt` e sem pôster (teste com pasta temporária).
Falhas no caminho: Biome proíbe `export` em teste; no Chromium headless o 1º toque no pôster só mostra controles (o E2E clica e chama `play()`); o `.vtt` (1 KB) baixa no carregamento por causa do `<track default>`, não é vídeo.
Números: Vitest 498 → 504; E2E 684 → 686 passed; `/apresentacao` JS 1,01/10 KiB, peso 28,65/150; `public/midia` 30,1 MB somados (5 pacotes; eram 36,3 com o P3) (5 pacotes; só o Fixado 00 é servido por página até a V07/V08), a imagem do nginx cresce o mesmo.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v06/`.

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
