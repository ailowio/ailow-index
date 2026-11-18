# Inventário de interfaces e integrações — ailow-index   (AUD-60..69)

*Última atualização: 2026-11-18. O site em produção não tem integração (sem API, formulário, pagamento nem script de terceiro). As interfaces abaixo são de build e CI; as de produção estão planejadas.*

| ID | Interface | Origem → Destino | Dados trafegados (e classificação) | Método/protocolo | Frequência | Autenticação · escopo · rotação | Contrato/mapeamento | Dono | Criticidade |
|----|-----------|------------------|------------------------------------|------------------|-----------|---------------------------------|---------------------|------|-------------|
| I-01 | Registro npm | CI e máquina do autor → registro npm | pacotes públicos (código aberto) | HTTPS | a cada `npm ci` | anônima · leitura · n/a | `package-lock.json` (integridade por hash) | Pedro | Média |
| I-02 | GitHub Actions | GitHub → runner → `actions/*` | código do repositório (público) | HTTPS | a cada PR/push em `main` | `GITHUB_TOKEN` efêmero, `contents: read` · expira por run | `.github/workflows/ci.yml` (actions fixadas por SHA) | Pedro | Média |
| I-03 | Imagem do gitleaks no GHCR | runner → `ghcr.io/gitleaks/gitleaks` | imagem pública | HTTPS (pull) | a cada run do job `seguranca-segredos` | anônima · leitura · n/a | digest `sha256:c00b6bd0…` no `ci.yml` | Pedro | Média |
| I-04 | Semgrep (regras e pacote) | runner → PyPI (`pipx`) e registro de regras do Semgrep | pacote `semgrep==1.185.0`; regras `p/default`, `p/typescript`. Métricas desligadas (`--metrics=off`); o código analisado não é enviado | HTTPS | a cada run do job `seguranca-sast` | anônima · leitura · n/a | `ci.yml` (versão fixa). Se o download das regras exige conta ou envia dado: **não verificado** | Pedro | Baixa |
| I-05 | Dependabot e alertas | GitHub → repositório (PRs e alertas) | manifestos e lockfile (públicos) | plataforma GitHub | semanal (`.github/dependabot.yml`) | gerida pelo GitHub | `.github/dependabot.yml` | Pedro | Baixa |
| I-09 | Imagens base e Trivy (S11) | runner → Docker Hub (`node:22.23.4-alpine3.24`, `nginxinc/nginx-unprivileged:1.30.6-alpine3.24`) e banco do Trivy | imagens públicas; nada do site sai | HTTPS (pull) | a cada run do job `imagem` | anônima · leitura · n/a | tags exatas no `Dockerfile`; action do Trivy por SHA no `ci.yml` | Pedro | Média |
| I-06 | Publicação do site (**planejada, S07**) | CI/Pedro → imagem nginx → VPS com Traefik | HTML estático público | a definir na S07 | por release | a definir (Environment com aprovação) | a criar | Pedro | Alta |
| I-07 | DNS de `ailow.com.br` (**planejada, S07**) | registrador → Traefik | registros DNS | DNS | na criação | conta do registrador, MFA **não verificado** | a criar | Pedro | Alta |
| I-08 | `wa.me` (cartão `/cartao/`, em produção quando houver deploy) | navegador do visitante → `https://wa.me/<número>?text=<saudação>` | número digitado pelo próprio visitante (dado pessoal): vai só na URL do clique, nunca é gravado (storage, cookie, IndexedDB, cache) nem enviado ao site | navegação do navegador | por clique em Enviar | n/a | `src/data/cartao.ts`; testes `test/cartao.test.ts` e `e2e/cartao.e2e.ts` | Pedro | Baixa |

## Controles de integridade por interface (AUD-62/63/65/66/67)
| ID | Completude/exatidão | Idempotência | Validação na entrada | Tratamento de erro | Conciliação | Log de execução |
|----|---------------------|--------------|----------------------|--------------------|-------------|-----------------|
| I-01 | hash de integridade no lockfile; `npm ci` falha se divergir | sim | lockfile | job vermelho bloqueia o merge | n/a | log do run do GitHub |
| I-02 | actions por SHA | sim | ruleset exige os checks | job vermelho bloqueia o merge | n/a | log do run do GitHub |
| I-03 | imagem por digest | sim | digest | job vermelho | n/a | log do run |
| I-04 | versão do Semgrep fixa | sim | `--error` em severidade ERROR | job vermelho | n/a | log do run |
| I-05 | PRs revisados por humano | n/a | checks obrigatórios | PR aberto até decisão | n/a | histórico de PRs |
| I-06, I-07 | a definir na S07 (smoke test, rollback por tag) | | | | | |

## Transformações e mapeamento de campos (AUD-61)
Não se aplica: nenhuma interface transforma dados de negócio. O build gera `dist/` e `/pedro/feed.json` a partir dos `.md` de `src/content/prs/`.

## Fornecedor / terceiro (AUD-68)
| Terceiro | Contrato/SLA | Onde ficam os dados | Atestado de segurança · validade | Plano de saída | Última reavaliação |
|----------|--------------|---------------------|-----------------------------------|----------------|--------------------|
| GitHub (repositório, Actions, GHCR) | termos de uso do serviço gratuito/público | código público | não verificado | o repositório é git: clonar e hospedar em outro lugar | 2026-11-18 (este documento) |
| Registro npm | serviço público | n/a (só leitura de pacotes públicos) | não verificado | espelho/cache do lockfile | 2026-11-18 |
| Registrador do domínio | não verificado | n/a | não verificado | não verificado | pendente (S07) |
