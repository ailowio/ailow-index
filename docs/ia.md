# Uso de IA — ailow-index

IA é usada como **par de programação**, dentro do protocolo do harness (`D:\apps\harness`): gate antes de agir, teste antes do código, ADR para decisão estrutural, humano aprova e faz o merge.

## O que a IA faz
- Rascunhos de código, testes, documentação e ADRs; alternativas para decisões (nunca "a única").
- Comenta e propõe em PR. Pode usar **sub-agentes** para partes delimitadas do trabalho (por exemplo, a governança do repositório), em área de trabalho isolada, com regras duras no prompt (sem alterar testes existentes, sem commit/push, sem mexer fora do escopo). Quem integra confere o diff, não só o relatório.

## O que a IA não faz
- Não aprova PR nem faz merge.
- Não faz commit, push, deploy, DNS ou mudança em produção sem pedido explícito.
- Não lê nem cola `.env`, segredos ou dados pessoais.
- Não decide escopo, licença nem exceções; não cria acessos, rotinas ou integrações sem pedido.
- Não publica conteúdo que não esteja `confirmado` com prova (ADR 002).

## O que o humano faz
Escolha de escopo, ADRs e exceções, revisão linha a linha do que entra na `main`, aprovação do deploy. Código que o autor não souber explicar não conta como entregue.

## Evidência
[`CONTRIBUTORS.md`](../CONTRIBUTORS.md) (coautoria nos commits) · [`docs/harness-adoption.md`](harness-adoption.md) · histórico de PRs em `ailowio/ailow-index` · diário em `docs/execucao/diario/`.
