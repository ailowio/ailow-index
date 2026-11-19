# ADR 004 — Pipeline de deploy do site: GitHub Actions por SSH com aprovação, comando forçado e reversão automática

- **Status:** Aceito em 2026-11-18. **Decisor:** Claude Opus 5.5 (orquestrador), por delegação do Pedro ("o Pedro pediu o site no ar e delegou as decisões"). O Pedro mantém o clique de Approve do deploy. **Tier:** A (acima do piso: a reversão e a aprovação seguem o modelo do Tier B). **Regras:** OPS-04/05, AUD-24/27/96, SEC-*, CI-07/18. **Lições:** L-0005, L-0006, L-0021, L-0027.
- **Escopo do texto:** o repositório é público; sem IP, usuário ou hostname do servidor.

## Contexto
- O harness exige deploy por pipeline (OPS-04, AUD-24). O site é estático (nginx sem root, S11) e roda no Swarm de nó único de um host compartilhado com outros sistemas, atrás do Traefik do host. Já existe um pipeline equivalente no ailow-cloud (ADR 012 daquele repositório, Tier B), em produção.
- Um único humano (EX-01: aprovação ≠ autor dispensada). O site não tem dado, segredo nem banco: o pior caso de um deploy ruim é indisponibilidade ou conteúdo errado, e ambos se desfazem reimplantando a tag anterior.

## Decisão
Mesmo modelo do ADR 012 do Cloud, simplificado para um site estático, com **acesso próprio** do ailow-index:
1. `publicar.yml`: em tag `vX.Y.Z` (commit na `main`), build, scan Trivy (CRITICAL/HIGH com correção barram) e push para `ghcr.io/ailowio/ailow-index-web:<tag>`; digest no resumo do run.
2. `deploy.yml`: `workflow_dispatch` com a tag; `validar a tag` (formato, existe, na `main`, imagem acessível **sem credencial**); `implantar em producao` no Environment `producao` com revisor obrigatório. Secrets só nesse Environment: `DEPLOY_SSH_KEY`, `DEPLOY_HOST_KEY` (known_hosts fixado), `DEPLOY_HOST`, `DEPLOY_USER`. Verificação de fora ao fim (health, `/`, HSTS, redirect do `www`).
3. **Chave SSH dedicada** com `command="/opt/ailow-index/bin/ssh-entrada.sh",restrict`: só aceita `deploy vX.Y.Z`; serializa com `flock`; confere de novo tag e `main`; executa o `deploy.sh` **daquela tag**. É a única parte instalada à mão (root, 0755).
4. `deploy.sh`: confere variáveis (só nomes) e imagem no registro, `docker stack deploy`, espera convergência (1/1, imagem na tag, sem tarefa `Failed` nova) **e 3 `/health` seguidos**; falhou, reimplanta a tag anterior (exit 20) ou sai 21 se a reversão não se confirma. Sem backup (nada a salvar). Primeira implantação que falha: sai 21 e **não apaga nada**.
5. **Saúde de dentro do container** (`docker exec ... wget`), e não pelo domínio: não puxa imagem extra, funciona antes do DNS e do certificado existirem, e testa o binário real. O caminho TLS/Traefik é conferido de fora pelo workflow.
6. Stack `ops/stack/index.yaml` com nomes de router/middleware prefixados `ailow-index-` (o Cloud usa `ailow-web` e `ailow-hsts` no mesmo Traefik). O serviço se chama `web`, igual ao do Cloud, mas em stack e labels distintos.
7. Testado sem servidor: `scripts/deploy-test.sh` (job `deploy-test` do CI, com canário) e `test/deploy-stack.test.ts`.

## Alternativas consideradas
| Alternativa | Por que não |
|---|---|
| Reaproveitar a chave e o `ssh-entrada.sh` do Cloud | Mistura acessos de dois sistemas (uma chave comprometida alcançaria os dois) e exigiria mudar um script de produção do Cloud. Descartada. |
| Deploy manual por SSH | Diverge de OPS-04 e AUD-24; sem aprovação separada nem evidência. Descartada. |
| Agente na VPS que busca a tag (timer) | Aprovação e log fracos (AUD-24/27). |
| Runner self-hosted no host | Executa código de workflow num host compartilhado; repositório público. |
| Saúde pelo domínio público | Depende de DNS, certificado e Traefik para o deploy "passar"; trata falha de rede como falha do site. |
| Saúde com imagem `curl` extra | Mais uma imagem de terceiro a puxar e fixar sem ganho. |

## Consequências e riscos residuais
- **Acesso novo** a inventariar (feito em `docs/auditoria/`): chave de deploy com comando forçado (dono Pedro) e 4 secrets no Environment. Rotina nova (workflows Publicar e Deploy) e interface nova (GHCR; servidor por SSH).
- A chave executa como o usuário de deploy, que precisa falar com o Docker (equivalente a root no host): o que a limita é o comando forçado, não o usuário. Por isso o `ssh-entrada.sh` é curto, testado e instalado à mão; mudá-lo é mudança manual registrada.
- Quem controla a conta GitHub do Pedro controla o deploy: mitigado por MFA (a ligar, pendente), revisor obrigatório e tag só de commit da `main`. Com a EX-01 o revisor é o próprio disparador; controle compensatório: log do run.
- O alias DNS `web` existe na rede do Traefik para os dois sistemas (Cloud e ailow-index). O Traefik roteia por labels e IDs, não por esse nome; se algo no host resolver `web` por DNS, a colisão apareceria. Não verificado no host.
- Pacote GHCR precisa ser público (servidor puxa sem credencial); o pacote é a mesma imagem estática que o site serve.
- SSH exposto na internet pelo host compartilhado: fora do escopo.
- Rever esta decisão se o site ganhar dado de terceiro, formulário ou API (sobe para tier B, e entra backup).
