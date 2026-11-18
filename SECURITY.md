# Política de segurança

## Como reportar uma vulnerabilidade
Use o relato privado do GitHub: aba **Security** do repositório → **Report a vulnerability** (security advisories privados). Não abra issue pública nem PR com o detalhe da falha.

Inclua o que for possível: página ou arquivo afetado, passos para reproduzir e o impacto que você enxerga. Não envie segredos nem dados de terceiros.

## O que esperar
Este é um projeto mantido por uma pessoa. Não há SLA formal; a intenção é confirmar o recebimento e responder com uma avaliação. A correção entra por PR, com os checks do CI.

## Escopo
O site estático `ailow.com.br` e este repositório (código, CI, dependências). O site não tem login, formulário, cookie nem dado de terceiro. Fora do escopo: o produto Ailow Cloud e serviços de terceiros.

Modelo de ameaças: [`docs/seguranca/threat-model.md`](docs/seguranca/threat-model.md).
