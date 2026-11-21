### V11 — Correções do feed (IoT) — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: regras do subagente, Contrato, V11, retomada, V10; colheita de IoT §3, §6, §7 e COLHEITA X7-X10; #056, #063, #080, #081.
Decisão (ok do orquestrador por delegação do Pedro, 2026-11-20): corrigir só para mais preciso ou mais fraco, com a prova (arquivo:linha de IOT-COLHEITA.md) no campo `prova`.
Feito: #063 (25 entradas em 2/9, 17 em 31/8; v1.8 só no gw1, gw2 com a v1.7; sem "Modbus", ferramenta e título); #056 (v1.6 escrita, nunca gravada); #081 (em andamento, parte das máquinas, mapa em conferência; `status_fato: construindo`, estado open, resumo_dono ajustado; /pulse e roteiro-pitch alinhados); #080 (conferência formal pendente, leituras "com apoio parcial"). Novas candidatas #083 e #084 pendentes (data 2026-11 pela regra de ordem). C11/#059 e C04/#020 intocadas (decisão do Pedro).
Testes antigos alterados: `e2e/f0-trilha-rapida.e2e.ts` (/pulse não diz mais "todas as máquinas", comentário V11); `v08-chao-de-fabrica.test.ts` (canário com a string antiga da #081 congelada, decisão do orquestrador).
Canários (L-0006): `v11-correcoes-feed.test.ts` nasceu 17/17 vermelho antes das correções; frases proibidas seguem valendo.
conferir-fatos: C16 divergente (construindo x testando) -> consistente; 0 divergências (1 consistente, 8 não comparáveis).
Falhas no caminho: resumo da #081 com 221 caracteres (teste da V09 pegou); "rodando"/"aceite" no texto novo batem nas frases proibidas (reescrito); E2E do /pulse antigo exigia "todas as máquinas".
Números: Vitest 603 → 622; E2E 814 passed (812 + 2 do /pulse relidos após a correção); versão 1.11.1.
