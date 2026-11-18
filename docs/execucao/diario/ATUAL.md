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

### S02b — Repositório e governança + Aprimoramento A1 — 2026-11-18 — Claude Opus 5.5 (orquestrador) + subagente Sonnet 5.5 (docs)
Feito: Node 22.23.5 e Astro 7.4.12 (XSS resolvido; EX-02 para o picomatch sem correção). Bootstrap `d018c9d` no repo público `ailowio/ailow-index`. Ruleset `proteger-main`, secret scanning, push protection e Dependabot ligados. PR #1 (`.gitkeep`; o 1º CI da `main` falhou com ENOENT, L-0025 recorrência 2). PR #2: governança (Semgrep, Dependabot, threat model, auditoria, harness-adoption, CONTRIBUTORS, SECURITY, `docs/ia.md`, CHANGELOG), escrita pelo subagente e revisada pelo diff. Aprimoramento A1 ("Ailow como app", cartão de visita, apresentação) registrado no plano; S04–S07 suspensas até o ADR 003.
Números: CI 3 → 4 jobs. Gitleaks local 8.30.1: sem vazamento.
Decisões do Pedro: merge dos PRs #1 e #2; licença do repositório; confirmar MFA (GitHub e registrador); ligar o "private vulnerability reporting" (o `SECURITY.md` depende disso); ADR 003 depois da S03b.
Pendências para a próxima: S03b (discovery do A1 + ADR 003 proposto). Depois do merge do PR #2, `seguranca-sast` entra no ruleset.
Verificação: CI do PR #1 verde (`verify`, `seguranca-sca`, `seguranca-segredos`); subagente: verify verde com a pasta do PR #1, YAML validado com o pacote `yaml`, gitleaks sem achados. O `dependabot.yml` foi conferido pelo orquestrador contra a doc oficial.

### S03 (parte 1) — Lista de curadoria — 2026-11-18 — subagente Sonnet 5.5, orquestrado por Claude Opus 5.5
Feito: lista privada em `D:/apps/_scratch/ailow-index-curadoria.md` (fora do git, 43 KB): 63 itens numerados (#001–#063) e 2 sem mês (MBA e um estudo de negócio). Cada item traz evidência conferida, prova sugerida, risco e caixa confirmado/fora. Três vagas de fluxo n8n estão reservadas (#022, #030, #039): no disco só há templates da comunidade.
Números: 12 conflitos de data apontados. Exemplos: Vitest entra em 16/03, não em 13/01; Playwright só em 28/10; a "v2.0 com Ant Design" é do módulo Comercial Têxtil, não do SGI.
Decisões do Pedro: marcar a lista; responder as perguntas (VPS #001, fluxos n8n, LinkedIn, ferramentas principais, autorização de clientes e eventos, meses faltantes). Dois achados de higiene em outros repositórios ficaram registrados na lista privada para decisão do Pedro; nada foi alterado.
Pendências para a próxima: S03 parte 2 grava em `src/content/prs/` só os itens confirmados (mais ids novos no catálogo, se aprovados).
Verificação (orquestrador): varredura do arquivo sem IP, fatura, token ou nome de cliente; `git status` do app igual ao da S02 (nada escrito no app).

