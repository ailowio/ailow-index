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

### S03 (parte 1) — Lista de curadoria — 2026-11-18 — subagente Sonnet 5.5, orquestrado por Claude Opus 5.5
Feito: lista privada em `D:/apps/_scratch/ailow-index-curadoria.md` (fora do git, 43 KB): 63 itens numerados (#001–#063) e 2 sem mês (MBA e um estudo de negócio). Cada item traz evidência conferida, prova sugerida, risco e caixa confirmado/fora. Três vagas de fluxo n8n estão reservadas (#022, #030, #039): no disco só há templates da comunidade.
Números: 12 conflitos de data apontados. Exemplos: Vitest entra em 16/03, não em 13/01; Playwright só em 28/10; a "v2.0 com Ant Design" é do módulo Comercial Têxtil, não do SGI.
Decisões do Pedro: marcar a lista; responder as perguntas (VPS #001, fluxos n8n, LinkedIn, ferramentas principais, autorização de clientes e eventos, meses faltantes). Dois achados de higiene em outros repositórios ficaram registrados na lista privada para decisão do Pedro; nada foi alterado.
Pendências para a próxima: S03 parte 2 grava em `src/content/prs/` só os itens confirmados (mais ids novos no catálogo, se aprovados).
Verificação (orquestrador): varredura do arquivo sem IP, fatura, token ou nome de cliente; `git status` do app igual ao da S02 (nada escrito no app).

### S03 (parte 2) — Gravação do feed do changelog — 2026-11-18 — subagente Sonnet 5.5, orquestrado por Claude Opus 5.5
Feito: 67 entradas em `src/content/prs/` (47 `confirmado`, 20 `pendente`), renumeradas em ordem cronológica; 16 ids novos em `src/data/ferramentas.json`. Aplicadas as decisões do Pedro de 18/11 (fundação em 2025-10, MBA em 2025-04, entrevista da TV Verdes Mares, broker em 2026-07, Cloud v1.0.0 em 13/11, firmware v1.9 `open`, MVP de sensores `closed` pendente, implantação atual como entrada nova).
Números: feed 0 → 67 entradas, 47 publicadas; catálogo 63 → 79 ferramentas. Estudo da aquisição e formatura não viram entrada (bloco "antes do primeiro commit", S06 do ADR 003).
Decisões: IoT por data de arquivo, 3 fluxos n8n, roadmap, KPI/outbox, discovery da loja, logo e design system ficaram `pendente`. Nenhuma ferramenta marcada `principal`.
Pendências para a próxima: o Pedro passa a lista de fluxos n8n, o LinkedIn e as datas em aberto; decide o ADR 003.
Verificação: `npm run verify` verde (133 testes; `feed: 67 entradas, 47 publicadas`). Canários: número duplicado e ferramenta inexistente reprovam o build; revertidos. Grep de conteúdo proibido sem achados.

