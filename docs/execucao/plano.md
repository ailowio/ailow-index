# Plano de execução — ailow-index

Origem (plano aprovado em 2026-11-17, leitura integral só se faltar contexto):
`C:\Users\pedro\.claude\plans\pasted-content-id-80dc-pensei-aqui-swirling-gem.md`.
Dossiê de entrada: `D:\apps\_scratch\ilo-index-discovery-2026-11-17.md` (gitignored, não commitar).

Resumo: site da Ailow em `ailow.com.br` (Astro estático, tier A). `/pedro` é o portfólio do Pedro
em formato de **changelog em feed de PRs** (marca Pulso); `/`, `/pulse`, `/cloud` usam a marca Ailow.
Decisões do Pedro: ADR 001 (stack) e ADR 002 (modelo do changelog) em `docs/adr/`.

## Contrato de toda sessão

1. **Abrir em camadas:** este Contrato + a linha da sessão + Estado de retomada, e a última entrada
   de `diario/ATUAL.md`. O resto (ADRs, dossiê, plano de origem) só sob demanda. Declarar o que leu.
2. **Gate do harness:** tier A; regras e lições listadas no ADR 001 e no `CLAUDE.md` do app.
3. **Estado real:** conferir `git -C D:/apps/ailow-index rev-parse --show-toplevel` = pasta do app
   (L-0010), `git status`, versão do Node, antes de escrever.
4. **Escopo fechado:** não adiantar a próxima sessão; respeitar o "não fazer".
5. **Test-first** nas regras do changelog; cada gate novo ganha um **canário** que tem de reprovar (L-0006).
6. **Verificar:** `npm run verify` (e `npm run e2e` a partir da S04), com a saída citada no diário.
7. **Commit/push/remoto/deploy:** só com pedido explícito do Pedro. Arquivos só com Write/Edit (L-0002).
8. **Conteúdo público:** nada de IP, segredo, número de fatura, nome de cliente/prospect, projeto pessoal privado,
   grafia `ilo.`, KPI sem claim confirmado, feature que não existe. Só entra entrada `confirmado`.
9. **Fechar:** diário curto + poda + Estado de retomada sobrescrito + prompt da próxima (ou portão).
10. Identificar a LLM no fim da resposta e na linha do diário.

## Sessões

| Sessão | Título | Escopo | Pronto quando | Não fazer |
|---|---|---|---|---|
| S01 | Scaffold | git próprio, `.gitignore`, README, `CLAUDE.md`, `.env.example`, Astro estático + Biome + Vitest + `astro check`, `verify`, CI (verify + gitleaks), PR template, ADR 001/002 | `npm run verify` verde local; `rev-parse` = pasta do app | conteúdo do feed, UI, remoto, commit sem ok |
| S02 | Modelo do changelog (TDD) | schema da collection `prs`, catálogos `ferramentas`/`soft-skills`, ordem número×data, diff derivado `+ferramenta`, filtro `confirmado`, linter de conteúdo (lista de bloqueio) | testes vermelhos→verdes; 1 canário por gate reprova; fixture `pendente` fora do `dist/` | páginas visuais, conteúdo real |
| S03 🚦 | Curadoria com o Pedro | gerar `docs/curadoria.md` com as sementes; o Pedro marca `confirmado`/`fora`, escreve cargo e #001, escolhe fluxos n8n, passa LinkedIn; conferir handles vivos da company page | lista aprovada pelo Pedro (portão humano) | publicar algo não marcado |
| S04 | `/pedro` (Pulso) | bloco "antes do primeiro commit", feed de PRs, `/pedro/label/<id>`, painel de ferramentas derivado, fontes auto-hospedadas (OFL conferida) | E2E: sem scroll horizontal 360/1280 nos 2 temas; axe sem serious/critical; zero requisição externa | home/produtos |
| S05 🚦 | Home, `/pulse`, `/cloud` (Ailow) | copy só da tese de mar/2026 e fatos confirmados; logo com hash do oficial (L-0028); link para `cloud.ailow.com.br` | E2E verde + texto aprovado pelo Pedro | tagline inventada |
| S06 | Endurecimento | imagem nginx não-root com log JSON, orçamento de JS (≤10 KB gz/página) e peso, E2E no ambiente do CI (L-0025) | `verify` + E2E verdes no CI | deploy |
| S07 🚦 | Deploy (só com pedido) | rota Traefik, DNS pelo Pedro, workflow de deploy parado no approval (L-0027), inventários de auditoria com evidência | site no ar + smoke test | aprovar o deploy pelo Pedro |

## Modelo do prompt de handoff

```text
Sessão SNN de 7 — <título> (plano "ailow-index").
Plano: D:/apps/ailow-index/docs/execucao/plano.md · Diário: D:/apps/ailow-index/docs/execucao/diario/ATUAL.md
Abra em camadas (NÃO leia o plano de origem inteiro): Contrato + linha da SNN + Estado de
retomada, e a última entrada do diário. Leia o resto só se precisar.
Skills/regras desta sessão: execucao-em-sessoes, <outras>.
Escopo: <da tabela>.
Pronto quando: <da tabela>.
Não fazer: <da tabela>.
Ao terminar: diário curto + poda + Estado de retomada; entregue o prompt da SNN+1 (ou portão).
```

### Estado de retomada

- **Data:** 2026-11-18 · **Última sessão:** S03 parte 1 (lista em `D:/apps/_scratch/ailow-index-curadoria.md`), aguardando as marcações do Pedro. Execução: um subagente Sonnet por sessão, orquestrado pelo Opus (pedido do Pedro em 2026-11-18).
- **Git:** `.git` próprio em `D:/apps/ailow-index`, branch `main`, **sem commit** (aguarda ok do Pedro). Sem remoto.
- **Ambiente:** Node local 22.14.0 → Astro provisório 7.3.8 (advisory XSS; `npm audit` 12 high). Atualizar o Node para ≥ 22.23.4 (winget `OpenJS.NodeJS.22` → 22.23.5) **com as outras sessões fechadas** (o instalador derruba Vite/Postgres/MCP em uso) e subir o astro para 7.4.12 (L-0030). TypeScript 6.0.3; `@types/node` 22.20.5.
- **Portão pendente:** S03 é curadoria com o Pedro. Antes: 1º commit autorizado e `conteudo-bloqueado.local.txt` criado por ele.
- **Pendências abertas:** `CHANGELOG.md` do sgi-copel com ano errado em v1.0.0/v1.1.0 (fora de escopo; PR próprio no SGI).
