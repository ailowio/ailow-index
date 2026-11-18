# ailow-index

**Tier:** A · **Stack:** Astro 7 (estático) · TypeScript 6 · Biome · Vitest · (Playwright + axe a partir da S04) · **Comando de verificação:** `npm run verify`

## Harness (obrigatório)
Este app herda `D:\apps\harness`. Antes de qualquer trabalho:
1. Leia `D:\apps\harness\PROTOCOLO.md` (gate de leitura, tiers, ciclo de vida, DoD).
2. Declare tarefa → tipo → tier → IDs de regra aplicáveis → critérios de aceite mensuráveis.
3. Siga `D:\apps\harness\checklists\` correspondente.
4. Plano de execução: `docs/execucao/plano.md`; diário: `docs/execucao/diario/ATUAL.md`.
   **Abra em camadas:** Contrato + linha da sessão + Estado de retomada + última entrada do diário.

## Regras do projeto (verificáveis)
- Test-first nas regras do changelog; nunca mude expectativa de teste para passar; gate novo ganha canário que reprova (L-0006).
- Marca **Ailow**, domínio **ailow.com.br** (ADR 001, travado em `test/site.test.ts`). Nunca a grafia `ilo.`.
- O changelog segue o ADR 002: um `.md` por PR em `src/content/prs/`, só `verificacao: confirmado` entra no build, número publicado nunca muda.
- Nenhum histórico git retrodatado: os PRs do feed são conteúdo.
- Testes em `test/` ou ao lado do código (`*.test.ts`); nome descreve a regra.
- Não adicionar dependência sem verificar versão e `engines` no registro; versões fixadas exatas.
- Zero requisição a terceiros: fontes e imagens auto-hospedadas.

## Conteúdo público (o que nunca entra)
IP, segredo, certificado, tópico MQTT, número de fatura, id de projeto Supabase, JSON de fluxo n8n,
nome de cliente/prospect sem ok, projeto pessoal privado, KPI do SGI sem claim confirmado, feature que não existe
(venda por voz, UI do Pulse), episódio de vídeo "a produzir". Material do `_scratch/` e do acervo do Cloud não é copiado.

## Segurança
- `.env` real nunca é lido nem colado; o site não usa variáveis (ver `.env.example`).
- Push, criação de remoto, deploy e DNS só com pedido explícito. Deploy para no approval (L-0027).
- Nada commitado sem pedido explícito.

## Fluxo de entrega
Conventional Commits · PR pequena com template · CI verde (`verify`, `seguranca-sca`, `seguranca-segredos`) · revisão humana (IA comenta, não aprova) · SemVer + CHANGELOG.

## Handoff
Ao encerrar a sessão: entrada curta no diário, Estado de retomada sobrescrito no plano, prompt da próxima no chat.
