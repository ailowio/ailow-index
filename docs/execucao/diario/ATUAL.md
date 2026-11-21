# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V11 — Correções do feed (IoT) — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: regras do subagente, Contrato, V11, retomada, V10; colheita de IoT §3, §6, §7 e COLHEITA X7-X10; #056, #063, #080, #081.
Decisão (ok do orquestrador por delegação do Pedro, 2026-11-20): corrigir só para mais preciso ou mais fraco, com a prova (arquivo:linha de IOT-COLHEITA.md) no campo `prova`.
Feito: #063 (25 entradas em 2/9, 17 em 31/8; v1.8 só no gw1, gw2 com a v1.7; sem "Modbus", ferramenta e título); #056 (v1.6 escrita, nunca gravada); #081 (em andamento, parte das máquinas, mapa em conferência; `status_fato: construindo`, estado open, resumo_dono ajustado; /pulse e roteiro-pitch alinhados); #080 (conferência formal pendente, leituras "com apoio parcial"). Novas candidatas #083 e #084 pendentes (data 2026-11 pela regra de ordem). C11/#059 e C04/#020 intocadas (decisão do Pedro).
Testes antigos alterados: `e2e/f0-trilha-rapida.e2e.ts` (/pulse não diz mais "todas as máquinas", comentário V11); `v08-chao-de-fabrica.test.ts` (canário com a string antiga da #081 congelada, decisão do orquestrador).
Canários (L-0006): `v11-correcoes-feed.test.ts` nasceu 17/17 vermelho antes das correções; frases proibidas seguem valendo.
conferir-fatos: C16 divergente (construindo x testando) -> consistente; 0 divergências (1 consistente, 8 não comparáveis).
Falhas no caminho: resumo da #081 com 221 caracteres (teste da V09 pegou); "rodando"/"aceite" no texto novo batem nas frases proibidas (reescrito); E2E do /pulse antigo exigia "todas as máquinas".
Números: Vitest 603 → 622; E2E 814 passed (812 + 2 do /pulse relidos após a correção); versão 1.11.1.

### V12 — Vem aí — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V12, retomada, V11; ADR 006, 007 item 5; brainstorm §5.7; COLHEITA K14; entradas com status; /pulse, /cloud; STATUS e ESTRATEGIA da bancada.
Feito: `/vem-ai` com 4 colunas (Em uso · Em teste · Construindo · Próximo passo) e luz de estado do Pulso (acesa, meia, fita de obra, apagada: cor + padrão + palavra); painel do topo leva a cada coluna; 360 px = listas empilhadas, ≥ 72 rem = 4 lado a lado; sem JS próprio. 7 cards: #078, #033, #054 (uso); #080, #076 (testando); #081 (construindo); plataforma de monitoramento do Pulse (próximo passo, citação literal da #081). Status derivado do `status_fato` (`montarQuadro`; o build cai com o feed real). Links no `/pedro` e no `/pulse`; sitemap; selo em `SECOES`. Versão 1.12.0.
Decisões (delegação): fora por falta de fonte pública: "A fábrica no celular" (só estratégia da bancada), Engenharia de Produtos v2 (só áudio/colheita), Ensinando IA (nenhum episódio publicado), novos módulos do Cloud; #032 (testando, bancada de jan/2026) fora do quadro. Em uso preenchido com as 3 entradas `uso` (nenhum candidato estava em uso).
Testes antigos alterados (comentário "V12 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/vem-ai/`), `v08-chao-de-fabrica.test.ts` (SECOES = chão + vem-ai).
Canários (L-0006): verbo errado, sem fonte, entrada sem status/inexistente/pendente, status duplicado, citação inventada, rota inexistente, 9 promessas (Vitest); card com #069 derruba o build; CSS em carrossel e sem foco (6 E2E vermelhos); rótulo do painel quebrando (E2E vermelho). Revertidos.
Falhas no caminho: teste de Tab dava a volta na página (parar no último link); fixture builds sem as entradas (erro só com o feed real); "Construind/o" no painel em 360 px (visto no screenshot; agora E2E).
Números: Vitest 622 → 645; E2E 814 → 852 passed; `/vem-ai` JS 0,70/2 KiB, peso 14,2/60.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v12/`.

### V13 — Explorador de fotos — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V13, retomada, V12; ADR 008; brainstorm §5.3; Explorador (Fluxo.astro, explorar.css, e2e); catálogo da bancada (quadro, gateway, sensoriza), PLANO da série §3 e §9 e claims C14, C16, C17 (só leitura).
Feito: modo foto em `/explorar/<slug>` (`Foto.astro`, `src/fotos/`, `src/data/fotos/*.json`): pontos `<button>` por % com clamp, painel do fluxo (o que é + detalhe técnico), Esc devolve o foco, "Ver como lista", pulso com movimento reduzido. Fotos: V156 t=0,5 s (botoeira e quadro do tear, #047; recorte tira caixa de papelão) e V385 t=3 s (caixa de sensores do piloto, #081; marcas DR, disjuntor, gateway e cabo borradas), WebP 720 px, 62,8 e 64,5 KB, sem metadados. Índice do /explorar ganha "Fotos do chão de fábrica"; sitemap. ADR 008 ganha a revisão "fotos estáticas" (PR + teto 80 KB + lista de permissões de pasta). Versão 1.13.0.
Decisões (delegação): V149–V153 fora (gate 7 do PLANO da série: só depois de D6); quadro = V156 (C17 cita V146–V156 como prova da #047); caixa = V385 (C16 cita V384–V435, caixas do piloto); V442 fora (etiqueta com código de barras); antena sem ponto (função não confirmada); nada de "conforme NR".
Testes antigos alterados: `indexacao.test.ts` (+2 rotas, comentário V13 · ADR 007 item 5 e ADR 008).
Canários (L-0006): foto de 156 KB (2 Vitest vermelhos); clamp tirado + ponto em x=99 (E2E "sai da imagem" vermelho; com clamp, verde); sem a rolagem do ponto (2 vermelhos "painel cobre"); sem a regra de movimento reduzido (2 vermelhos); revertidos. Canários permanentes de pasta, WebP, esquema e conformidade.
Números: Vitest 645 → 662; E2E 852 → 902 passed; fotos JS 1,18/2 KiB, peso 76,8 e 78,7/100 KiB.
Pendência: a #047 diz 25/05; o vídeo do acervo (V156) é de 14/05 (a página diz só a data do vídeo).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v13/`.
