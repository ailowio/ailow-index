# Adoção do harness no ailow-index (tier A, com gates do B que cabem num site estático)

*Rev. 2026-11-18. Como as práticas de `D:\apps\harness` aparecem neste repositório, com o arquivo ou comando que prova cada uma, e o que ainda falta. O que não conferi está marcado.*

## O que o repositório faz
| Prática (regra) | Evidência |
|-----------------|-----------|
| Protocolo, gate e tier declarados (PROTOCOLO §1/§3) | `CLAUDE.md` (tier A, stack, `npm run verify`); `docs/execucao/plano.md` (sessões S01…S07) |
| `verify` único (CI-01) | `npm run verify` = Biome + `astro check` + Vitest + build; job `verify` em `.github/workflows/ci.yml` |
| Test-first e canário que reprova (TEST-06..08, L-0006) | testes em `test/` e `*.test.ts` ao lado do código; diário em `docs/execucao/diario/` |
| ADR para decisão estrutural (ARQ-08/09) | `docs/adr/001` (Astro estático) e `002` (portfólio como changelog) |
| Exceções locais com data (PROTOCOLO §7) | `docs/excecoes.md`: EX-01 aprovação ≠ autor; EX-02 picomatch |
| CI com permissões mínimas, actions por SHA, lockfile (CI-05/07) | `ci.yml` (`permissions: contents: read`, `npm ci`) |
| Secret scan (SEC-05) | job `seguranca-segredos` (gitleaks por digest); secret scanning e push protection do GitHub |
| SCA e Dependabot (SEC-10) | job `seguranca-sca`; `.github/dependabot.yml` |
| SAST (SEC-10, CI-11) | job `seguranca-sast` (Semgrep 1.185.0, mesma política do ailow-cloud) |
| Branch protection com checks obrigatórios (CI-08) | ruleset `proteger-main` (id 27518794): PR, conversas resolvidas, checks `verify`/`seguranca-*`, sem force-push/exclusão/bypass. **Conferido pelo orquestrador via API em 2026-11-18**; não é versionado no repositório |
| Conteúdo público sem vazamento (SEC-16, risco principal) | `src/changelog/bloqueio.ts`; só `confirmado` publica (`src/changelog/regras.ts`); lista local fora do git (`.gitignore`) |
| Threat model (SEC-02) | `docs/seguranca/threat-model.md` |
| Auditoria (AUD) | `docs/auditoria/matriz-acessos.md`, `inventario-interfaces.md`, `inventario-rotinas.md` |
| Documentação viva (DOC-*) | `README.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTORS.md`, `docs/ia.md` |
| IA comenta, humano aprova (IA-*) | `docs/ia.md`; `CLAUDE.md` (sem commit, push ou deploy sem pedido) |

## O que ainda falta
| Lacuna | Regra | Quando |
|--------|-------|--------|
| E2E (Playwright) com axe sem `serious`/`critical`, sem scroll horizontal em 360/1280 nos 2 temas, zero requisição a terceiros (antes do toque, ADR 005) | TEST-13, UX | S04 |
| Cabeçalhos de segurança e CSP no nginx, imagem não-root, logs JSON, orçamento de JS (≤ 10 KB gz) e peso, E2E no ambiente do CI | SEC-*, OBS-*, PERF-* | S06 |
| Deploy por workflow parado no approval, rollback ensaiado, smoke test, inventários com evidência de produção | OPS-*, AUD-24/27 | S07 |
| Aprovação por pessoa ≠ autor | CI-08, AUD-22 | exceção EX-01, revisar em 2027-02-18 |
| MFA da conta GitHub e do DNS | AUD-01/03 | **não verificado**; Pedro confirma |
| Gate de cobertura não-regressiva | TEST-14, CI-04 | tier A: observar; não há configuração de `coverage` conferida |
| Licença do repositório público | — | decisão do Pedro (não existe `LICENSE`) |
| Resultado do último run do CI | — | não verificado aqui |

## Práticas que não se aplicam
| Prática | Por quê |
|---------|---------|
| OpenAPI / contrato de API | não há API |
| Banco, migração, RLS | não há banco nem dado de usuário |
| Carga (k6) e SLO de API | não há serviço dinâmico; a disponibilidade é a do nginx estático (a medir na S07) |
| UXM-* (UX de app/PWA) | site de conteúdo, não app |
| Formulário de contato | fora de propósito: subiria o tier para B (dado de terceiro) |
