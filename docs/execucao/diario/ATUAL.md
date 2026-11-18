# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

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

### S02 — Modelo do changelog (TDD) — 2026-11-17 — Claude Opus 5.5
Feito: `src/changelog/` (tipos, esquemas Zod, regras, linter, carregador) e a collection `prs` em `src/content.config.ts`. Endpoint `/pedro/feed.json`: faz todo build validar o feed. Catálogos reais em `src/data/` (63 ferramentas, 10 soft skills; nenhuma `principal`, isso é do Pedro). Lista local de nomes bloqueados em `conteudo-bloqueado.local.txt` (gitignored).
Números: 3 → 66 testes. Os unitários cobrem título, ordem, duplicado, catálogo, publicáveis, diff e painel. Mais 10 testes de build real com feeds de exemplo: 1 válido e 6 canários que reprovam (duplicado, ordem, ferramenta, bloqueio, bloqueio em pendente, data).
Decisões: o Node **não** foi atualizado. Havia ~25 processos `node.exe` do sistema, incluindo o Vite :5173 e o Postgres :54329 da outra sessão. Astro continua 7.3.8. Adicionado `@types/node` 22.20.5. Escopos do feed: infra, sgi, iot, pulse, cloud, n8n, ia, video, harness, brand, negocio, talk, learn, side (o Pedro pode ampliar). O schema e os catálogos tiveram teste escrito junto com o código (sem vermelho antes); o resto foi vermelho → verde.
Pendências para a próxima: (1) Node ≥ 22.23.4 → astro 7.4.12, zerar os `high` do audit; (2) ok do Pedro para o 1º commit; (3) o Pedro cria `conteudo-bloqueado.local.txt` com os nomes reais (clientes, prospects, marca em disputa, projeto privado).
Verificação: `npm run verify` → biome 37 ok · astro check 0/0/0 · vitest 66/66 · build ok (`feed: 0 entradas`). Mutação no filtro `confirmado` → 5 testes reprovaram (incluindo o do `dist/`); revertida.
