# Matriz de acessos — ailow-index   (AUD-01/03/06/09)

- **Dono do sistema:** Pedro · **Dono dos dados:** Pedro (o site não guarda dado de terceiro) · **Classificação dos dados:** públicos (conteúdo institucional); sem dado pessoal ou financeiro · **Última atualização:** 2026-11-18
- Estado: repositório público; deploy entregue na S12 (ADR 004); 1ª implantação em produção em 2026-11-19 (`v1.0.0`, ver `docs/runbooks/deploy.md`). Itens "não verificado" dependem do Pedro conferir na plataforma.

## 1. Perfis (papéis) e o que cada um pode fazer
| Perfil | Descrição / função | Dados e telas acessíveis | Pode alterar? | Privilegiado? | Justificativa (menor privilégio) |
|---|---|---|---|---|---|
| Visitante | qualquer pessoa na internet | repositório e site (públicos); sem login | não | não | o conteúdo é público por desenho |
| Dono do repositório (`ailowio`) | Pedro | configuração do repositório, ruleset, Dependabot, secrets, Environments (quando existirem) | sim | **sim** | única pessoa do time |
| Agente de IA (Claude) | par de programação | só o que a sessão local permite; abre PR sob pedido | propõe via PR; não aprova nem faz merge | não | AUD-96: sem acesso permanente a produção, sem credencial própria no GitHub (a verificar quando houver token) |

## 2. Quem tem qual perfil
| Pessoa | Função | Perfil(is) | Concedido em | Solicitado por | Aprovado por (dono) | MFA? | Próxima revisão |
|---|---|---|---|---|---|---|---|
| Pedro (conta `ailowio`) | dono e único mantenedor | Dono do repositório | criação do repositório | Pedro | Pedro | **não verificado** | 2027-02-18 |

Colaboradores adicionais no repositório: **não verificado** (conferir em Settings → Collaborators). Prazo de remoção ao sair alguém: imediato, executado pelo Pedro.

## 3. Contas privilegiadas e de serviço (AUD-06/09)
| Conta / credencial | Tipo | Dono | Escopo | Criada em | Rotação (prazo/última) | Onde é guardada |
|---|---|---|---|---|---|---|
| `GITHUB_TOKEN` dos workflows | credencial efêmera do CI | GitHub | `contents: read` (declarado em `.github/workflows/ci.yml`) | por run | expira ao fim do run | n/a (gerado pelo GitHub) |
| Secrets do Environment `producao` (S12): `DEPLOY_SSH_KEY`, `DEPLOY_HOST_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` | credenciais de deploy | Pedro | só o job `implantar em producao` do `deploy.yml`, com aprovação do revisor | 2026-11-18: Environment `producao` criado pelo orquestrador (revisor obrigatório: conta do Pedro; só a `main`); 4 secrets gravados por `gh secret set` lendo de arquivo, sem imprimir | revisão em 2027-02-18; rotação da chave: trocar o par e o `authorized_keys` | GitHub Environment (valores nunca no repositório) |
| Chave de deploy do ailow-index (S12) | chave SSH ed25519 dedicada, **acesso novo** | Pedro | `command="/opt/ailow-index/bin/ssh-entrada.sh",restrict`: só `deploy vX.Y.Z`; sem shell, pty ou encaminhamento | 2026-11-18: criada pelo orquestrador com ok explícito do Pedro ("Pode fazer"); impressão `SHA256:s+snZYVB/ze/20dzoL+qnxmjQuHGPTrIFP8eatHJElM`; backup do `authorized_keys` antes; host key conferida por 2 canais; teste: `ls` → 2, `deploy v0.0.0` → 4; privada apagada do PC | idem | privada só no secret; pública no `authorized_keys` do usuário de deploy no servidor |
| Registrador do domínio / DNS de `ailow.com.br` | conta de terceiro (registro no Registro.br; zona delegada à Cloudflare em 2026-11-18, pelo Pedro) | Pedro | domínio e registros (apex, `www`, `cloud`, todos só DNS, sem proxy) | não verificado | não verificado | contas do Pedro; delegação conferida em 2026-11-19 nos 2 nameservers da Cloudflare e em resolvedores públicos |
| Acesso ao servidor (SSH, Docker, Traefik do host) | conta do Pedro no host; usuário de deploy (nome fora do repositório) | Pedro | administrar o servidor; o usuário de deploy só é alcançado pela chave acima | n/a | n/a | fora do repositório |

## 4. Regras
- Conta nominal; sem compartilhamento. Concessão só com aprovação do dono registrada aqui.
- Saída/mudança de função ⇒ remoção em até **1 dia** (hoje não se aplica: time de uma pessoa).
- Acesso de emergência: não há. Quem autorizar seria o Pedro, com registro em `docs/execucao/diario/`.
- Controles de plataforma conferidos pelo orquestrador em 2026-11-18: ruleset `proteger-main` sem bypass, secret scanning e push protection ligados. Exceção EX-01 (aprovação ≠ autor) em `docs/excecoes.md`.
