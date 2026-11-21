# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

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

### V12 — Vem aí — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V12, retomada, V11; ADR 006, 007 item 5; brainstorm §5.7; COLHEITA K14; entradas com status; /pulse, /cloud; STATUS e ESTRATEGIA da bancada.
Feito: `/vem-ai` com 4 colunas (Em uso · Em teste · Construindo · Próximo passo) e luz de estado do Pulso (acesa, meia, fita de obra, apagada: cor + padrão + palavra); painel do topo leva a cada coluna; 360 px = listas empilhadas, ≥ 72 rem = 4 lado a lado; sem JS próprio. 7 cards: #078, #033, #054 (uso); #080, #076 (testando); #081 (construindo); plataforma de monitoramento do Pulse (próximo passo, citação literal da #081). Status derivado do `status_fato` (`montarQuadro`; o build cai com o feed real). Links no `/pedro` e no `/pulse`; sitemap; selo em `SECOES`. Versão 1.12.0.
Decisões (delegação): fora por falta de fonte pública: "A fábrica no celular" (só estratégia da bancada), Engenharia de Produtos v2 (só áudio/colheita), Ensinando IA (nenhum episódio publicado), novos módulos do Cloud; #032 (testando, bancada de jan/2026) fora do quadro. Em uso preenchido com as 3 entradas `uso` (nenhum candidato estava em uso).
Testes antigos alterados (comentário "V12 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/vem-ai/`), `v08-chao-de-fabrica.test.ts` (SECOES = chão + vem-ai).
Canários (L-0006): verbo errado, sem fonte, entrada sem status/inexistente/pendente, status duplicado, citação inventada, rota inexistente, 9 promessas (Vitest); card com #069 derruba o build; CSS em carrossel e sem foco (6 E2E vermelhos); rótulo do painel quebrando (E2E vermelho). Revertidos.
Falhas no caminho: teste de Tab dava a volta na página (parar no último link); fixture builds sem as entradas (erro só com o feed real); "Construind/o" no painel em 360 px (visto no screenshot; agora E2E).
Números: Vitest 622 → 645; E2E 814 → 852 passed; `/vem-ai` JS 0,70/2 KiB, peso 14,2/60.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v12/`.
