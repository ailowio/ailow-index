# Runbook: rollback do site (voltar para a versão anterior)

- **Serviço:** site `ailow.com.br` · **Dono:** Pedro · **Criado:** 2026-11-18 (S12) · **Ensaiado em produção:** não (medir e registrar aqui depois da 1a troca de versão).
- Regras: OPS-05/06, AUD-24. Site estático sem banco nem volume: reverter é só reimplantar uma tag anterior.

## 1. Sintoma (quando usar)
`https://ailow.com.br/health` diferente de 200 em 3 checagens seguidas, página quebrada no smoke, 5xx nos logs, ou conteúdo errado publicado. Sem debate: voltar primeiro, investigar depois.

## 2. Confirmar
- No servidor: `docker service ls` (esperado `ailow-index_site` 1/1), `docker service ps ailow-index_site --no-trunc` (tarefas `Failed` novas?), `docker service inspect ailow-index_site --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'`, `cat /opt/ailow-index/estado/tag-atual`.
- `docker service logs --since 15m ailow-index_site`.

## 3. Mitigar
### 3.1 Pelo pipeline (normal)
Rodar o workflow **Deploy** com a **tag anterior** (a que estava em `estado/tag-atual` antes do problema). Mesma aprovação no Environment `producao`. O `deploy.sh` confere a imagem no registro, implanta e espera 3 `/health`.

### 3.2 O deploy falhou sozinho
- Código `20`: o servidor já voltou para a tag anterior e confirmou a saúde. Nada a fazer além de investigar a tag que falhou.
- Código `21`: a reversão não se confirmou. Parar e olhar o estado (seção 2). Se há uma tag boa conhecida: `docker service update --rollback ailow-index_site`, ou repetir o deploy dela. **Primeira implantação** que falha também sai `21`: o serviço novo **não é removido**; corrija a causa (variáveis em `index.env`, pacote GHCR privado, rede do Traefik) e rode o Deploy de novo com a mesma tag, ou, se for desistir, `docker stack rm ailow-index` por decisão humana registrada (não há volume nem dado a perder).
- Códigos `2..5`, `10`, `11`: nada foi alterado; a mensagem diz o motivo.

### 3.3 Imagem da tag anterior ausente
Republique-a rodando de novo o workflow `Publicar imagem` para aquela tag (re-run do run original). Nunca construir à mão no servidor.

## 4. Depois
Registrar versão revertida, motivo e duração da indisponibilidade; postmortem sem culpa se afetou visitantes; lição no registro (MC). Atualizar a data e o tempo medido no cabeçalho.
