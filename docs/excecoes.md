# Exceções às regras do harness (PROTOCOLO §7)

Cada exceção é local, tem motivo, risco aceito e data de revisão. Quem revisa confere se a justificativa ainda vale.

| ID | Regra | Exceção | Motivo | Risco aceito | Revisar em |
|---|---|---|---|---|---|
| EX-01 | CI-08, AUD-22 (aprovação por pessoa ≠ autor) | O ruleset da `main` exige PR e checks verdes, mas **0 aprovações** | Time de uma pessoa: o Pedro é o único humano. A IA comenta, não aprova (IA-*). Mesma exceção do ailow-cloud. | Um erro do Pedro não tem segundo par de olhos humano; mitigado pelos checks obrigatórios e pela auto-revisão com o template de PR. | 2027-02-18 ou quando entrar uma 2ª pessoa |
| EX-02 | SEC-10 (0 achado alto em dependências) | O check `seguranca-sca` bloqueia só dependências de produção (`--omit=dev`); a auditoria completa é informativa | `picomatch` ≤ 4.0.7 (GHSA-fc5q-39xc-vjpf, ReDoS) **sem versão corrigida publicada** (conferido em 2026-11-18). Ele só roda no build (Astro, Vite, Vitest), com globs escritos por nós; o site publicado é HTML estático, sem Node em produção. | ReDoS no build local/CI com padrão malicioso; não há entrada de terceiro nos globs. | 2026-12-18, ou antes se o Dependabot abrir a correção |
