# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/). Tags publicadas: `v1.0.0` e `v1.1.0` (2026-11-18); `v1.1.1` (2026-11-19).

## [Unreleased]

## [1.3.0] - 2026-11-20

### Adicionado
- F0 (trilha rápida): o site entra no Google. As rotas públicas ficam indexáveis, com `robots.txt`, `sitemap.xml` e `link rel="canonical"` (`src/config/indexacao.ts`). Ficam de fora (noindex) as versões, o `/bio`, as labels do feed e o cartão. E2E confere que as páginas sem noindex do `dist/` são exatamente as do sitemap.
- F0: preview de links (Open Graph e Twitter card) em todas as páginas, com a imagem `public/og/ailow.png` (1200x630, 148 KB), gerada por `scripts/og.mjs` só com arquivos locais (fontes do site, foto e logo oficial recolorida).
- F0: contato por WhatsApp autorizado pelo Pedro (`src/config/contato.ts`, fonte única). Botão "Falar no WhatsApp" na home, na `/apresentacao` e no `/bio`, com mensagem pronta que diz a origem (`[site]`, `[apresentação]`, `[instagram]`). O e-mail ainda não é publicado: o domínio não tinha registro MX em 2026-11-20.
- F0: `/bio`, destino do link da bio do Instagram (mesmo conteúdo da apresentação, fora do Google).

### Alterado
- F0: a home diz o que o Pedro faz ("Digitalizei e sensorizei a minha fábrica." + consultoria e cursos de IA para empresários) no lugar do cartão "AILOW / ailow.com.br"; espaçamentos compactos em telas baixas e título de tamanho fixo dentro da moldura do desktop, com E2E de que os 6 ícones ficam acima do rodapé em 360x640 e 1280x800.
- F0: a `/apresentacao` mostra quem é o Pedro sem precisar abrir a foto; a apresentação vira componente (`src/components/Apresentacao.astro`), usado também pelo `/bio`.
- F0: a trava do Voltar sai da home e fica só no cartão instalado (ADR 003 item 4 revisto; exceção EX-03 à UXM-03). Quem chega por link volta à origem.
- F0: títulos das abas sem repetição ("Sobre a empresa", "Versões do site", "Stack de ferramentas", "Apresentação de Pedro Fernandes").

### Corrigido
- F0: sócio da Copel desde **mai/2015** (o `/pedro` dizia jan/2015; confirmado pelo Pedro em 2026-11-20).
- F0: `/sobre` não promete mais "alertas e dashboards" (o Pulse ainda não tem painel); `/pulse` diz o estado real: sensores em todas as máquinas, dois gateways, firmware v1.9 em validação em campo desde 19/11/2026.

## [1.2.0] - 2026-11-19

### Adicionado
- S12e: a versão do site (`v1.2.0`, lida do `package.json`) no rodapé da home e das páginas internas, como link para `/versoes`, que mostra o histórico de todas as versões publicadas lendo este `CHANGELOG.md` no build. O cartão de visita fica sem o rodapé. Como o cartão é rota escondida, a página de versões omite a rota dele ao ler este arquivo.
- Workflow `Publicar imagem`: passo que falha se a tag `vX.Y.Z` não for igual à versão do `package.json`.

### Alterado
- S12e: a logo das páginas passa do ciano para o amarelo canário (`--amarelo`); no tema claro ela fica sobre uma pastilha grafite (`--logo-fundo`), porque amarelo sobre o papel `estudio` dá 1,4:1.

## [1.1.1] - 2026-11-19

### Corrigido
- Ícones alinhados ao app: o A oficial em amarelo (`--amarelo`) sobre o grafite, no lugar do ciano da marca, nos 3 ícones do PWA do cartão. Site inteiro ganha favicon (`/favicon.svg` e `/favicon-32.png`) e `apple-touch-icon`. Gerados por `scripts/icones.mjs` a partir de `public/logo.svg` (intocada) e travados por `test/icones.test.ts`: cores, tamanhos, opacidade e zona segura do maskable; canário com o ícone antigo reprova.

## [1.1.0] - 2026-11-18

### Adicionado
- S12b: `/pedro/stack` com as 88 ferramentas do catálogo em 10 categorias (com e sem entrada no feed) e link "Stack (88)" no perfil do `/pedro`.

### Alterado
- S12b: entrada #080 (firmware v1.9, segue aberta) com o relato de 18/11/2026: v1.9 gravada nos dois gateways, validação em campo a partir de 19/11. #081 coerente.

### Corrigido
- S12c: seta Voltar em laço (label ↔ `/pedro`), Voltar do sistema com o dialog do avatar aberto saindo da página e toque duplo andando 2 telas; E2E de regressão com 11 cenários (PR #21).

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
