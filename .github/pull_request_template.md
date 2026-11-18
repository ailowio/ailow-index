## O quê e por quê
<!-- 1–3 frases. O PORQUÊ (o código já mostra o quê). Sessão do plano: SNN. -->

## Tipo · Tier
- Tipo: feat / fix / refactor / perf / docs / test / chore / ci / content
- Tier do app: A

## Como testar
`npm run verify` (+ `npm run e2e` a partir da S04)

## Conteúdo público (se o PR mexe em `src/content/` ou em texto de página)
- [ ] só entram entradas `verificacao: confirmado`, com `prova`
- [ ] sem IP, segredo, número de fatura, nome de cliente/prospect, grafia `ilo.`
- [ ] nada anunciado que ainda não existe (venda por voz, UI do Pulse, episódio "a produzir")
- [ ] aprovado pelo Pedro (portão de curadoria)

## Risco e produção
- **O que pode quebrar em produção?**
- **Rollback:** revert do PR + novo deploy da tag anterior

## Checklist do autor
- [ ] `verify` verde localmente · [ ] testes novos (vermelho→verde) · [ ] canário reprova (L-0006)
- [ ] sem segredo/PII no diff · [ ] docs vivas atualizadas (README/ADR/plano)
- [ ] consigo explicar cada linha (inclusive o que foi gerado por IA)

## Para a revisão de IA (se usada — comenta, **não aprova**)
