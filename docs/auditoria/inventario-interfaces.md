# Inventário de interfaces e integrações — ailow-index   (AUD-60..69)

*Última atualização: 2026-11-20 (I-13, V05). O site em produção não tem integração (sem API, formulário, pagamento nem script de terceiro). As interfaces abaixo são de build e CI; as de produção estão planejadas.*

| ID | Interface | Origem → Destino | Dados trafegados (e classificação) | Método/protocolo | Frequência | Autenticação · escopo · rotação | Contrato/mapeamento | Dono | Criticidade |
|----|-----------|------------------|------------------------------------|------------------|-----------|---------------------------------|---------------------|------|-------------|
| I-01 | Registro npm | CI e máquina do autor → registro npm | pacotes públicos (código aberto) | HTTPS | a cada `npm ci` | anônima · leitura · n/a | `package-lock.json` (integridade por hash) | Pedro | Média |
| I-02 | GitHub Actions | GitHub → runner → `actions/*` | código do repositório (público) | HTTPS | a cada PR/push em `main` | `GITHUB_TOKEN` efêmero, `contents: read` · expira por run | `.github/workflows/ci.yml` (actions fixadas por SHA) | Pedro | Média |
| I-03 | Imagem do gitleaks no GHCR | runner → `ghcr.io/gitleaks/gitleaks` | imagem pública | HTTPS (pull) | a cada run do job `seguranca-segredos` | anônima · leitura · n/a | digest `sha256:c00b6bd0…` no `ci.yml` | Pedro | Média |
| I-04 | Semgrep (regras e pacote) | runner → PyPI (`pipx`) e registro de regras do Semgrep | pacote `semgrep==1.185.0`; regras `p/default`, `p/typescript`. Métricas desligadas (`--metrics=off`); o código analisado não é enviado | HTTPS | a cada run do job `seguranca-sast` | anônima · leitura · n/a | `ci.yml` (versão fixa). Se o download das regras exige conta ou envia dado: **não verificado** | Pedro | Baixa |
| I-05 | Dependabot e alertas | GitHub → repositório (PRs e alertas) | manifestos e lockfile (públicos) | plataforma GitHub | semanal (`.github/dependabot.yml`) | gerida pelo GitHub | `.github/dependabot.yml` | Pedro | Baixa |
| I-09 | Imagens base e Trivy (S11) | runner → Docker Hub (`node:22.23.4-alpine3.24`, `nginxinc/nginx-unprivileged:1.30.6-alpine3.24`) e banco do Trivy | imagens públicas; nada do site sai | HTTPS (pull) | a cada run do job `imagem` | anônima · leitura · n/a | tags exatas no `Dockerfile`; action do Trivy por SHA no `ci.yml` | Pedro | Média |
| I-06 | Deploy por SSH (S12) | runner do GitHub → servidor | só o comando `deploy vX.Y.Z` e a saída do servidor (sem dado de negócio) | SSH, chave dedicada, `command=...,restrict` | por release | chave ed25519 do Environment `producao`; host fixado em `DEPLOY_HOST_KEY` · escopo: só o comando forçado · rotação: a definir (revisão em 2027-02-18) | `ops/deploy/ssh-entrada.sh`, `.github/workflows/deploy.yml` | Pedro | Alta |
| I-07 | DNS de `ailow.com.br` (S12) | registrador → servidor com Traefik | registros A (raiz) e CNAME (`www`) | DNS | na criação | conta do registrador, MFA **não verificado** | `docs/runbooks/deploy.md` §3 | Pedro | Alta |
| I-10 | GHCR `ailow-index-web` (S12) | runner → GHCR (push); servidor → GHCR (pull) | imagem pública do site (sem segredo) | HTTPS | por release | push: `GITHUB_TOKEN` com `packages: write` só no `publicar.yml`; pull anônimo (pacote público) | `publicar.yml`; tag `vX.Y.Z` | Pedro | Alta |
| I-11 | Let's Encrypt via Traefik do host (S12) | Traefik do host → ACME | domínios `ailow.com.br` e `www` | HTTPS (ACME) | emissão e renovação | gerida pelo Traefik do host · **renovação não verificada** | labels em `ops/stack/index.yaml` | Pedro (host: quem administra o servidor) | Alta |
| I-08 | `wa.me` (cartão `/cartao/`, em produção quando houver deploy) | navegador do visitante → `https://wa.me/<número>?text=<saudação>` | número digitado pelo próprio visitante (dado pessoal): vai só na URL do clique, nunca é gravado (storage, cookie, IndexedDB, cache) nem enviado ao site | navegação do navegador | por clique em Enviar | n/a | `src/data/cartao.ts`; testes `test/cartao.test.ts` e `e2e/cartao.e2e.ts` | Pedro | Baixa |

| I-13 | Bancada → site (pacote de publicação, V05) | pasta `final/site/<slug>/` da bancada (`D:/videos`, fora do git) → máquina do Pedro → `public/midia/<slug>/` do repositório | vídeo ≤ 60 s, pôster, legendas `.vtt`, `site.json` (título, data, fatos `#NNN`, aprovação); dado de negócio só se estiver em tela (limite declarado: o linter não vê a imagem) | cópia local de arquivos por `npm run importar-midia`; o CI nunca vê a bancada | por peça publicada | sem conta nem token: acesso ao disco da máquina do Pedro; `aprovado_por`/`aprovado_em` no `site.json` | ADR 008, `docs/contratos/bancada-site.md`, `src/midia/pacote.ts` (schema Zod); testes `test/midia/` e `test/pulso-tokens.test.ts` | Pedro | Média |

## Controles de integridade por interface (AUD-62/63/65/66/67)
| ID | Completude/exatidão | Idempotência | Validação na entrada | Tratamento de erro | Conciliação | Log de execução |
|----|---------------------|--------------|----------------------|--------------------|-------------|-----------------|
| I-01 | hash de integridade no lockfile; `npm ci` falha se divergir | sim | lockfile | job vermelho bloqueia o merge | n/a | log do run do GitHub |
| I-02 | actions por SHA | sim | ruleset exige os checks | job vermelho bloqueia o merge | n/a | log do run do GitHub |
| I-03 | imagem por digest | sim | digest | job vermelho | n/a | log do run |
| I-04 | versão do Semgrep fixa | sim | `--error` em severidade ERROR | job vermelho | n/a | log do run |
| I-05 | PRs revisados por humano | n/a | checks obrigatórios | PR aberto até decisão | n/a | histórico de PRs |
| I-06 | comando forçado aceita só `deploy vX.Y.Z`; tag precisa estar na `main` | sim (reimplantar a mesma tag converge) | regex ancorada, `flock`, `merge-base` | códigos 2/3/4/5/10/11/20/21 (runbook) | `web=<imagem@digest>` no resumo | log do run + log JSON do `deploy.sh` no servidor |
| I-07, I-10, I-11 | verificação de fora no `deploy.yml` (health, `/`, HSTS, redirect do `www`) | sim | n/a | run vermelho | n/a | log do run |
| I-13 | tetos de peso, cabeçalho do arquivo, `.vtt` obrigatório com vídeo, pôster obrigatório | sim com `--substituir` (sem ele, slug existente é recusado) | schema Zod estrito, lista de extensões, linter de conteúdo (`site.json` e legendas) | pacote recusado inteiro, nada copiado, exit 1 com a lista de erros | o PR de importação mostra os arquivos que entraram | **PR de importação** (evidência, AUD-20) + saída do comando |

## Transformações e mapeamento de campos (AUD-61)
I-13 não transforma o conteúdo: copia byte a byte os arquivos aprovados (o teste compara os bytes). Os tokens do Pulso têm mapeamento próprio (`src/styles/pulso-deriva.ts`, `MAPA`). Nenhuma outra interface transforma dados de negócio. O build gera `dist/` e `/pedro/feed.json` a partir dos `.md` de `src/content/prs/`.

## Fornecedor / terceiro (AUD-68)
| Terceiro | Contrato/SLA | Onde ficam os dados | Atestado de segurança · validade | Plano de saída | Última reavaliação |
|----------|--------------|---------------------|-----------------------------------|----------------|--------------------|
| GitHub (repositório, Actions, GHCR) | termos de uso do serviço gratuito/público | código público | não verificado | o repositório é git: clonar e hospedar em outro lugar | 2026-11-18 (este documento) |
| Registro npm | serviço público | n/a (só leitura de pacotes públicos) | não verificado | espelho/cache do lockfile | 2026-11-18 |
| Registrador do domínio | não verificado | n/a | não verificado | não verificado | pendente (S12) |
| Host/VPS compartilhado (Traefik, Docker) | não verificado | servidor do Pedro/Copel | não verificado | reimplantar a imagem em outro host (runbook §1) | 2026-11-18 |
