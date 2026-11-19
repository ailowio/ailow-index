# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/). Nenhuma tag foi criada ainda.

## [Unreleased]

### Corrigido
- CI: versiona a pasta da collection `prs` (PR #1).
- Dependabot: ignora major de `typescript` (o `@astrojs/check` 0.9.12 aceita só `^5 || ^6`) e de `@types/node` (segue o Node 22).
- `@types/node` volta de 26.6.6 para 22.20.5 (o #3 subiu o major antes do `ignore`; os tipos seguem o Node 22 do `.nvmrc`).

### Adicionado
- S06, `/pedro` no Pulso: perfil, bloco "Antes do primeiro commit", feed de cartões de PR (só `confirmado`, mais recente no topo, `+ferramenta` derivado), painel "Ferramentas" derivado e 87 páginas estáticas `/pedro/label/<slug>` (ferramenta ou `escopo-<frente>`). Código em `src/changelog/labels.ts`, `src/components/CartaoPR.astro`, `src/styles/feed.css`; testes em `test/changelog/labels.test.ts` e `e2e/pedro-feed.e2e.ts`.
- S05, home como app + Voltar (ADR 003): `/` vira a tela inicial de celular (grade de 6 ícones SVG, papel de parede Pulso, moldura de aparelho no desktop), páginas internas mínimas "em construção" (`/pedro`, `/pedro/entrevistas`, `/pulse`, `/cloud`, `/sobre`, `/apresentacao`, todas `noindex`) com layout `App.astro`, transição nativa "abrir/fechar app" (`view-transition-name` ícone↔selo, zero JS) e trava do Voltar (≤ 1 KB gz) que nunca deixa o navegador sair da home. E2E em `e2e/home-app.e2e.ts`; rotas novas em `scripts/orcamentos-peso.json`.
- S04, fundações do Pulso de produto (ADR 003): tokens em rem com tema escuro (padrão) e claro derivado (`src/styles/`), fontes Barlow, Barlow Condensed e JetBrains Mono auto-hospedadas (`@fontsource`, OFL), layout base com tema sem flash, botão de tema, `@view-transition` e logo oficial em máscara (`src/layouts/Base.astro`, `public/logo.svg`).
- Playwright + axe (`npm run e2e`, pasta `e2e/`): sem scroll horizontal em 360 e 1280 px nos 2 temas, axe sem serious/critical, zero requisição externa, tema persistente, logo com a assinatura oficial.
- Teste de contraste dos tokens (`test/contraste.test.ts`) e orçamento de peso por rota (`scripts/peso.mjs`, `scripts/orcamentos-peso.json`, dentro do `verify`).
- Job `e2e` no CI.
- Job `seguranca-sast` (Semgrep 1.185.0) no CI.
- `.github/dependabot.yml` (npm e GitHub Actions, semanal, minor/patch agrupados).
- Threat model, matriz de acessos, inventários de interfaces e de rotinas (`docs/seguranca/`, `docs/auditoria/`).
- `docs/harness-adoption.md`, `docs/ia.md`, `CONTRIBUTORS.md`, `SECURITY.md` e este `CHANGELOG.md`.

## [1.0.0] - 2026-11-18

Primeira versão publicável do site `ailow.com.br` (a tag `v1.0.0` é criada depois do merge).

### Adicionado
- S12, deploy: stack Swarm `ops/stack/index.yaml` (Traefik, HSTS de 1 ano, `www` redireciona para o apex), `ops/deploy/ssh-entrada.sh` e `deploy.sh` (comando forçado, saúde de dentro do container, reversão automática), workflows `Publicar imagem` e `Deploy` (approval no Environment `producao`), `scripts/deploy-test.sh` com canário e job `deploy-test` no CI, `test/deploy-stack.test.ts`, runbooks de deploy e rollback, ADR 004 e inventários de auditoria atualizados.
- S11, endurecimento: imagem nginx sem root, log JSON, CSP por hash, job `imagem` (Trivy), orçamentos de peso e de JS.
- S10, cartão de visita `/cartao/` (rota escondida, PWA, QR gerado no build, `wa.me`).
- S09, `/apresentacao` com avatar em pop-up e espaço para o vídeo.
- S08, `/pedro/entrevistas`.
- S07, páginas institucional, `/pulse` e `/cloud`.
- S06, `/pedro`: feed de PRs, rótulos derivados e painel de ferramentas.
- S05, home como app com transição nativa e trava do Voltar.
- S04, fundações do Pulso de produto (tokens, tema claro e escuro, fontes auto-hospedadas) e E2E com axe.
- S03, curadoria do feed (82 entradas, 81 confirmadas).
- S02, modelo do changelog (ADR 002) e linter de conteúdo público; S02b, governança do repositório (threat model, inventários, Dependabot, SAST).
- S01, scaffold Astro estático com `verify` e CI.

## [0.1.0] - 2026-11-18

Bootstrap do app (tier A).

### Adicionado
- S01: scaffold do site estático em Astro (ADR 001), Biome, Vitest, CI com `verify`, `seguranca-sca` e `seguranca-segredos`, template de PR, `CLAUDE.md` e `README.md`.
- S02: modelo do changelog do portfólio (ADR 002): esquema das entradas, regras de ordem e catálogos, linter de conteúdo público, feed em `/pedro/feed.json`.
- Exceções EX-01 e EX-02 em `docs/excecoes.md`.
