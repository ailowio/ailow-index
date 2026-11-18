# Matriz de acessos — ailow-index   (AUD-01/03/06/09)

- **Dono do sistema:** Pedro · **Dono dos dados:** Pedro (o site não guarda dado de terceiro) · **Classificação dos dados:** públicos (conteúdo institucional); sem dado pessoal ou financeiro · **Última atualização:** 2026-11-18
- Estado: repositório público; **sem deploy ainda** (S07). Itens "não verificado" dependem do Pedro conferir na plataforma.

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
| Secrets de Actions e Environments | — | Pedro | **nenhum secret é usado hoje** (o CI não referencia `secrets.*`) | n/a | n/a | n/a. Os do deploy entram na S07 e este item deve ser atualizado |
| Registrador do domínio / DNS de `ailow.com.br` | conta de terceiro | Pedro | domínio e registros | não verificado | não verificado | não verificado. A registrar na S07 |
| Acesso à VPS (SSH, Traefik) | planejado (S07) | Pedro | publicar a imagem do site | n/a | n/a | n/a. Entra com o deploy |

## 4. Regras
- Conta nominal; sem compartilhamento. Concessão só com aprovação do dono registrada aqui.
- Saída/mudança de função ⇒ remoção em até **1 dia** (hoje não se aplica: time de uma pessoa).
- Acesso de emergência: não há. Quem autorizar seria o Pedro, com registro em `docs/execucao/diario/`.
- Controles de plataforma conferidos pelo orquestrador em 2026-11-18: ruleset `proteger-main` sem bypass, secret scanning e push protection ligados. Exceção EX-01 (aprovação ≠ autor) em `docs/excecoes.md`.
