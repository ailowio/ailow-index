# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S03b — Discovery do A1 + ADR 003 proposto — 2026-11-18 — subagente Sonnet 5.5, orquestrado por Claude Opus 5.5
Feito: `docs/execucao/brief-app.md` (H1–H5 contra doc oficial; R1–R5 com critério mensurável), `docs/adr/003-navegacao-app-pwa-e-tema-pulso.md` (status Proposto; 3 alternativas de navegação e decisões D1–D6 separadas; tabela S04+ proposta) e `docs/execucao/roteiro-pitch.md` (rascunho para o Pedro).
Números: hipóteses verificadas: wa.me `?text=`, manifest e HTTPS, escopo do SW, View Transitions (Chrome 126; Safari 18.2; Firefox não). Não verificadas: anexo pelo `wa.me`, `share({files})` por versão em Chrome Android e Safari iOS, peso do ClientRouter, direitos das imagens.
Decisões: nenhuma é do agente. Recomendação: B (home como app, páginas normais com transição nativa), vídeo auto-hospedado, PWA só no cartão. Achados: o Pulso não é DS de produto (sem tema claro nem componentes); o repo público expõe a rota do cartão; o UXM-03 não se cumpre na raiz.
Pendências para a próxima: o Pedro decide o ADR 003 (10 perguntas nele); S03 parte 2.
Verificação: ver relatório do orquestrador (`npm run verify`); varredura manual dos 3 arquivos sem IP, e-mail, telefone, token nem nomes de terceiros.

### S03 (parte 2) — Gravação do feed do changelog — 2026-11-18 — subagente Sonnet 5.5, orquestrado por Claude Opus 5.5
Feito: 67 entradas em `src/content/prs/` (47 `confirmado`, 20 `pendente`), renumeradas em ordem cronológica; 16 ids novos em `src/data/ferramentas.json`. Aplicadas as decisões do Pedro de 18/11 (fundação em 2025-10, MBA em 2025-04, entrevista da TV Verdes Mares, broker em 2026-07, Cloud v1.0.0 em 13/11, firmware v1.9 `open`, MVP de sensores `closed` pendente, implantação atual como entrada nova).
Números: feed 0 → 67 entradas, 47 publicadas; catálogo 63 → 79 ferramentas. Estudo da aquisição e formatura não viram entrada (bloco "antes do primeiro commit", S06 do ADR 003).
Decisões: IoT por data de arquivo, 3 fluxos n8n, roadmap, KPI/outbox, discovery da loja, logo e design system ficaram `pendente`. Nenhuma ferramenta marcada `principal`.
Pendências para a próxima: o Pedro passa a lista de fluxos n8n, o LinkedIn e as datas em aberto; decide o ADR 003.
Verificação: `npm run verify` verde (133 testes; `feed: 67 entradas, 47 publicadas`). Canários: número duplicado e ferramenta inexistente reprovam o build; revertidos. Grep de conteúdo proibido sem achados.

### S03c — ADR 003 aceito + plano S04+ — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: ADR 003 com status Aceito e as 13 decisões do Pedro (áudio de 18/11) registradas; exceções: UXM-01 fica, UXM-03 removida (o Voltar nunca sai do site), UXM-08 trocada pelo Pulso. Plano: Contrato 7 (delegação de merge ao orquestrador), tabela S03d–S13, Estado sobrescrito, A1 reduzido a 1 linha. `roteiro-pitch.md` virou o prompt do pitch.
Referências citadas no ADR (só leitura): UXM-03 em `harness/practices/ux-mobile.md:16`; Voltar do Cloud em `ailow-cloud/apps/web/src/componentes/navegacao.tsx:14-45`; `uqr` 0.1.3 nos `package.json` do Cloud.
Decisões: nenhuma nova do agente. Interpretações: "Material" lido como "mesmas diretrizes de parecer app do Cloud, sem imitar Material à risca"; custo de JS do Voltar (≤ 1 KB gz) é estimativa a medir na S05.
Pendências para a próxima: S03d (feed parte 3, sem UI). LinkedIn, os 75 fluxos n8n e o Instagram já foram lidos pelo orquestrador (insumos no Estado de retomada).
Verificação: `npm run verify` verde pelo orquestrador (ver PR).

