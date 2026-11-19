# Inventário de sistemas — ailow-index   (AUD-01/40)

*Última atualização: 2026-11-18 (S12).*

| ID | Sistema | Finalidade | Dono | Onde roda | Dados | Tier | Criticidade | Acessos | Rotinas/interfaces | Runbooks |
|----|---------|-----------|------|-----------|-------|------|-------------|---------|--------------------|----------|
| S-01 | Site `ailow.com.br` (stack `ailow-index`, serviço `site`) | site institucional e portfólio do Pedro; cartão de visita em `/cartao/` | Pedro | servidor com Swarm e Traefik do host; imagem `ghcr.io/ailowio/ailow-index-web:<tag>` | públicos; nenhum dado de terceiro armazenado (o número digitado no cartão nunca é gravado) | A | Média | `matriz-acessos.md` | R-04, R-06, R-07; I-06, I-07, I-10, I-11 | `docs/runbooks/deploy.md`, `docs/runbooks/rollback.md` |
| S-02 | Repositório `ailowio/ailow-index` e CI | código, conteúdo e pipeline | Pedro | GitHub | públicos | A | Alta | `matriz-acessos.md` | R-01, R-02, R-03, R-05 | `README.md` |

Status do S-01: **mecanismo de deploy entregue; ainda não implantado** (a 1a implantação é feita pelo orquestrador com o Pedro; registrar a data aqui).
