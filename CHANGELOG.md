# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/). Nenhuma tag foi criada ainda.

## [Unreleased]

### Corrigido
- CI: versiona a pasta da collection `prs` (PR #1).

### Adicionado
- Job `seguranca-sast` (Semgrep 1.185.0) no CI.
- `.github/dependabot.yml` (npm e GitHub Actions, semanal, minor/patch agrupados).
- Threat model, matriz de acessos, inventários de interfaces e de rotinas (`docs/seguranca/`, `docs/auditoria/`).
- `docs/harness-adoption.md`, `docs/ia.md`, `CONTRIBUTORS.md`, `SECURITY.md` e este `CHANGELOG.md`.

## [0.1.0] - 2026-11-18

Bootstrap do app (tier A).

### Adicionado
- S01: scaffold do site estático em Astro (ADR 001), Biome, Vitest, CI com `verify`, `seguranca-sca` e `seguranca-segredos`, template de PR, `CLAUDE.md` e `README.md`.
- S02: modelo do changelog do portfólio (ADR 002): esquema das entradas, regras de ordem e catálogos, linter de conteúdo público, feed em `/pedro/feed.json`.
- Exceções EX-01 e EX-02 em `docs/excecoes.md`.
