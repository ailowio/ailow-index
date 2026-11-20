# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V09 — Diário de obra — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, V09, retomada, V08; ADR 002, 007 itens 3–4; brainstorm §4; `src/changelog/`; as 26 de vitrine.
Feito: `/pedro` vira "Diário de obra" (cabeçalho, aba, OG, subtítulo; "Todas as entregas"); /apresentacao, /cloud, /pulse, labels, stack e /explorar sem "portfólio"/"feed". Lente "Para empresários / Para técnicos" (2 botões `aria-pressed`, `src/scripts/lente.ts`, sessionStorage com try/catch). `resumo_dono` opcional no Zod (10–220 car., linter) e preenchido nas 26 de vitrine. "Os 3 que eu mostraria numa visita": #047, #069, #078. Versão 1.11.0.
Decisões (delegação): sem JS = leitura técnica, seletor escondido e o resumo rotulado "Para empresários:" no cartão; sem resumo, no modo empresário = título sem o prefixo `tipo(escopo):` + prova (corpo, ferramentas e skills somem); técnica é a padrão também com JS; visita = uma por frente (iot, sgi, cloud), `merged`, fora da fila V10/V11; ícone da home "Diário" (1 palavra; o link "Diário de obra" segue único); #081 resumida sem "todas as máquinas" nem "concluída" (lista da V08), #069 com o glossário "o sistema da fábrica".
Testes antigos alterados (comentário "V09 · 2026-11-20 · ADR 007 item 3"): `pedro-feed.e2e.ts` e `voltar-regressao.e2e.ts` (H2) ("Todo o feed" → "Todo o Diário de obra"), `stack.e2e.ts` ("sem entrada no feed").
Canários (L-0006): resumo com IPv4 fora do linter (build verde → vermelho); "30" e "todas as máquinas" no resumo da #081 (2 Vitest vermelhos); CSS da lente sem esconder o técnico (E2E vermelho). Revertidos.
Falhas no caminho: título cortado em 360 px (E2E pegou; fonte por `data-app`); erro nos builds de fixture sem #047/#069/#078 (agora filtra; o teste garante as 3); busca de "Todo o feed" cortada por `head`: 8 E2E vermelhos na 1ª rodada.
Números: Vitest 544 → 574; E2E 776 → 814 passed; `/pedro` JS 1,03/10 KiB, peso 29,4/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v09/`.

### V10 — Fonte única de fatos — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: Contrato, V10, retomada, V09; ADR 006 inteiro; `esquemas.ts`, `tipos.ts`; claims.csv e PLANO §4 da bancada (só leitura, salvo a coluna autorizada).
Feito: `status_fato` opcional (uso · validado · testando · construindo · proximo) no Zod; preenchido só em 7 entradas de vitrine que o sustentam: #033, #054, #078 = uso; #032, #076, #080, #081 = testando. `npm run conferir-fatos -- <claims.csv> [--prs <pasta>]` (`scripts/conferir-fatos.ts` + `src/changelog/fatos.ts`, sem dependência): divergências, ids inexistentes, não comparáveis, consistentes e "sem fato_site" com sugestão; exit 0 com relatório, 2 em erro de leitura. Coluna `fato_site` no claims.csv (backup `claims.csv.bak-2026-11-20`, diff confirma só a coluna nova): C02 #005, C04 #020, C08 #061, C11 #059, C13 #039, C14 #062, C16 #081, C17 #047, C23 #044.
Resultado: divergente por script = C16 -> #081 (construindo x testando). C04 e C11 não são comparáveis pelo script (#020 e #059 fora da vitrine, sem `status_fato`); leitura manual: C11 diverge (claim "testando", #059 "em uso" segundo o Pedro); C04 bate na data, diverge na origem (template Lovable x planilha). Relatório local em `docs/execucao/v2/`.
Decisões (delegação): "Em implantação" = alias de construindo (não está no PLANO §4); #081 = testando (o site já a mostra "em validação"; o corpo ainda diz "concluída", V11); #069 e #079 sem status (a entrada não diz se está em uso); #059 e #020 não preenchidas (fora do escopo de vitrine); sem bump de versão (ferramenta interna, nada visível).
Canários (L-0006): trocar `=== esperado` por "qualquer status" deixou 4 Vitest vermelhos (revertido); fixture sintético tem divergência (K02) e id inexistente (K03).
Números: Vitest 574 → 603; E2E ver PR.
Para a V11: C16/#081, C11/#059 (preencher `status_fato: uso` ou corrigir o claim), C04/#020, C05 (#053 x #072 desfeita); C09, C12, C20 sem entrada óbvia.

### V11 — Correções do feed (IoT) — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: regras do subagente, Contrato, V11, retomada, V10; colheita de IoT §3, §6, §7 e COLHEITA X7-X10; #056, #063, #080, #081.
Decisão (ok do orquestrador por delegação do Pedro, 2026-11-20): corrigir só para mais preciso ou mais fraco, com a prova (arquivo:linha de IOT-COLHEITA.md) no campo `prova`.
Feito: #063 (25 entradas em 2/9, 17 em 31/8; v1.8 só no gw1, gw2 com a v1.7; sem "Modbus", ferramenta e título); #056 (v1.6 escrita, nunca gravada); #081 (em andamento, parte das máquinas, mapa em conferência; `status_fato: construindo`, estado open, resumo_dono ajustado; /pulse e roteiro-pitch alinhados); #080 (conferência formal pendente, leituras "com apoio parcial"). Novas candidatas #083 e #084 pendentes (data 2026-11 pela regra de ordem). C11/#059 e C04/#020 intocadas (decisão do Pedro).
Testes antigos alterados: `e2e/f0-trilha-rapida.e2e.ts` (/pulse não diz mais "todas as máquinas", comentário V11); `v08-chao-de-fabrica.test.ts` (canário com a string antiga da #081 congelada, decisão do orquestrador).
Canários (L-0006): `v11-correcoes-feed.test.ts` nasceu 17/17 vermelho antes das correções; frases proibidas seguem valendo.
conferir-fatos: C16 divergente (construindo x testando) -> consistente; 0 divergências (1 consistente, 8 não comparáveis).
Falhas no caminho: resumo da #081 com 221 caracteres (teste da V09 pegou); "rodando"/"aceite" no texto novo batem nas frases proibidas (reescrito); E2E do /pulse antigo exigia "todas as máquinas".
Números: Vitest 603 → 622; E2E 814 passed (812 + 2 do /pulse relidos após a correção); versão 1.11.1.
