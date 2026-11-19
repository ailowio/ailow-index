# ailow-index

Site institucional da Ailow em `ailow.com.br`. Tem as páginas da marca (`/`, `/pulse`, `/cloud`) e o
portfólio do Pedro em `/pedro`, contado como um changelog em feed de PRs.

- **Tier:** A (site público estático, sem login, sem formulário, sem dado de terceiro). Ver `D:\apps\harness\PROTOCOLO.md` §3.
- **Estado:** em construção (S01 de 7). Plano: `docs/execucao/plano.md`.
- **Decisões:** `docs/adr/` (001 stack, 002 modelo do changelog).

## Rodando localmente

Requer Node 22 (ver `.nvmrc`; o Astro 7.4.x exige ≥ 22.23.4, ver ADR 001).

```bash
npm ci
npm run dev        # http://localhost:4321
```

## Testes e qualidade

```bash
npm run verify     # lint (Biome) + tipos (astro check) + testes (Vitest) + build + peso — igual ao CI
npm test           # só os testes
npm run build      # gera dist/ (HTML estático)
npm run peso       # orçamento de JS e de peso gzip por rota sobre o dist/ (scripts/orcamentos-peso.json); já entra no verify
npx playwright install chromium   # uma vez por máquina
npm run e2e        # Playwright + axe sobre build + preview (porta 4329): 360x640 e 1280x800, 2 temas, 0 requisição externa
npm run preview    # serve o dist/ localmente
```

## Changelog (`/pedro`)

- Uma entrada por arquivo em `src/content/prs/NNN-slug.md` (formato no ADR 002). Só `verificacao: confirmado` é publicado.
- Catálogos: `src/data/ferramentas.json` e `src/data/soft-skills.json`.
- O build **falha** com: número repetido, número fora da ordem das datas, ferramenta/soft skill fora do catálogo,
  data fora de `AAAA`/`AAAA-MM`, prova ausente, ou texto bloqueado (IP, token, fatura, grafia `ilo.`).
- Nomes que não podem aparecer: um por linha em `conteudo-bloqueado.local.txt` (ignorado pelo git; nunca commitar).
- O changelog em dados sai em `/pedro/feed.json`.

## Variáveis de ambiente

Nenhuma em produção. Os testes de build usam `AILOW_PRS_DIR`, `AILOW_OUT_DIR` e `AILOW_CACHE_DIR` (`.env.example` explica).

## Harness: o que foi adotado e o que foi pulado

Checks obrigatórios do CI: `verify`, `seguranca-sca`, `seguranca-sast`, `seguranca-segredos`. Mapa completo em
[`docs/harness-adoption.md`](docs/harness-adoption.md); também [threat model](docs/seguranca/threat-model.md),
[auditoria](docs/auditoria/), [uso de IA](docs/ia.md), [`SECURITY.md`](SECURITY.md), [`CHANGELOG.md`](CHANGELOG.md).

| Prática | Situação |
|---|---|
| `verify` único, CI com permissões mínimas, actions por SHA, lockfile | adotado |
| Secret scan (gitleaks) e SCA (`npm audit`) no CI | adotado |
| ADR para decisões estruturais | adotado (001, 002) |
| Testes unitários nas regras do changelog, canário por gate | adotado (S02: unitários + build real com feeds de exemplo em `test/fixtures/feeds/`) |
| E2E (Playwright) + axe, sem scroll horizontal em 360/1280 nos 2 temas | S04 |
| Logs JSON (nginx), imagem não-root | S11 (`Dockerfile`, `ops/web/`) |
| UXM-* (UX mobile de app/PWA) | **não se aplica**: é site de conteúdo, não app |
| OpenAPI, banco, RLS, k6 | **não se aplica**: sem API nem banco |
| Formulário de contato | **fora de propósito**: subiria o tier para B (dado de terceiro); contato por link |

## Operação

## Deploy

Imagem nginx estática atrás do Traefik do servidor, por pipeline com aprovação (ADR 004): tag `vX.Y.Z` na `main`
publica a imagem (`Publicar imagem`); o workflow `Deploy` (manual) para no approval do Environment `producao`.
Rollback: rodar o `Deploy` com a tag anterior. Passo a passo, bootstrap do servidor, secrets e DNS:
[`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) e [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md).
Testes do pipeline sem servidor: `bash scripts/deploy-test.sh` e `bash scripts/deploy-test.sh canario`.
Deploy e DNS só com pedido explícito do Pedro.

## Versionamento

SemVer + Conventional Commits.
