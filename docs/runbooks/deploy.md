# Runbook: deploy do site (stack `ailow-index` no Swarm)

- **Serviço:** site `ailow.com.br` (um serviço `site`, nginx sem root, HTTPS pelo Traefik do host) · **Dono:** Pedro · **Criado:** 2026-11-18 (S12) · **Ensaiado em produção:** 2026-11-19 00:36 UTC, `v1.0.0` (1ª implantação; run 44429035808 aprovado pelo Pedro e cancelado no GitHub ~12 s depois do `stack deploy`; o `deploy.sh` concluiu no servidor: `ailow-index_site` 1/1, `tag-atual` = `v1.0.0`, `/health` ok, Cloud intacto). Conferido por fora com o IP fixado: `/`, `/pedro/`, `/cartao/`, `/health` 200; `www` → apex 301; HSTS 1 ano, CSP e `nosniff` presentes. `v1.1.0` em 2026-11-19 02:10 UTC (run 44439067295; implantado em 55 s; o run falhou só na verificação de fora porque o DNS ainda não publicava). DNS delegado à Cloudflare (registros só DNS, sem proxy). Certificado Let's Encrypt emitido às 04:09 UTC, depois de `docker service update --force ailow-index_site` com a mesma imagem (mudança manual, L-0033); conferido por fora: rotas 200, `www` → apex 308, HSTS, CSP, `nosniff`, Cloud 200. **Atenção:** cancelar o run depois do approval não interrompe o deploy no servidor (a sessão SSH cai, o script segue): para desfazer, rode o Deploy com a tag anterior.
- Regras: OPS-04 (deploy repetível e serializado), OPS-05 (gatilho de reversão), AUD-24/27 (mudança rastreável). Decisão: [ADR 004](../adr/004-pipeline-de-deploy.md).
- **Verificado só por testes sem servidor:** `bash scripts/deploy-test.sh` (job `deploy-test` do CI) e `test/deploy-stack.test.ts`. **Não verificado:** tudo o que depende do servidor, do Traefik, do DNS e do certificado.
- Neste repositório público não há IP, usuário nem hostname do servidor: eles vivem nos secrets do Environment `producao`.

## 1. Bootstrap único no servidor (à mão, uma vez; mudança registrada, AUD-24)
Como root ou com sudo. Docker (Swarm ativo) e Traefik do host já existem; o nome da rede do Traefik e do resolvedor ACME vêm de quem administra o host.
1. **Usuário de deploy:** o usuário SSH que o workflow usa precisa conseguir rodar `docker` (a chave só executa o comando forçado). Registrar quem é na matriz de acessos (sem o nome real neste repositório).
2. **Pastas:** `/opt/ailow-index/{repo,bin,estado}`.
3. **Clone somente leitura do repositório público:** `git clone https://github.com/ailowio/ailow-index.git /opt/ailow-index/repo`.
4. **Entrada do SSH:** copie `ops/deploy/ssh-entrada.sh` do clone para `/opt/ailow-index/bin/ssh-entrada.sh`, dono root, modo `0755`. Só root escreve ali (a chave não pode alterar o que ela executa). Alterar esse arquivo é mudança manual: exige registro e ADR.
5. **Variáveis:** `/opt/ailow-index/index.env` (dono root, `0600`), a partir de `ops/stack/index.env.example`: `CERT_RESOLVER` e `PROXY_NETWORK` com os valores reais do host (as outras são opcionais). Não há segredo nessa stack. O arquivo não é versionado.
6. **Chave de deploy dedicada** (gerada no PC do Pedro, nunca no servidor): `ssh-keygen -t ed25519 -f ailow-index-deploy -C ailow-index-deploy-github` sem frase-senha (o runner precisa usá-la sem prompt). Linha do `authorized_keys` do usuário de deploy:
   ```text
   command="/opt/ailow-index/bin/ssh-entrada.sh",restrict ssh-ed25519 AAAA...(chave pública) ailow-index-deploy-github
   ```
   `restrict` desliga pty, encaminhamento de porta, agente e X11; o `command=` limita a chave ao `deploy vX.Y.Z`. Guarde a privada só no secret (apague o arquivo local depois).
7. **Impressão digital do host** (para `DEPLOY_HOST_KEY`): do PC, `ssh-keyscan -t ed25519 <host>` e confira a impressão digital com a do servidor por outro canal antes de guardar.
8. **Conferir sem implantar:** do PC, `ssh -i ailow-index-deploy <usuário>@<host> ls` deve **recusar** (código 2). Registrar no diário.

## 2. GitHub (uma vez, pelo Pedro)
- **Environment `producao`** (Settings > Environments): revisor obrigatório = Pedro; restrito à branch `main`. Se já existir (o Cloud usa o mesmo nome em outro repositório), crie o deste repositório separadamente: Environments não são compartilhados entre repositórios.
- **Secrets do Environment** (não do repositório): `DEPLOY_SSH_KEY` (a privada do passo 6), `DEPLOY_HOST_KEY` (saída do `ssh-keyscan` conferida), `DEPLOY_HOST`, `DEPLOY_USER`.
- **Pacote GHCR público:** depois do primeiro `Publicar imagem`, Packages > `ailow-index-web` > Package settings > Change visibility > Public. O servidor puxa sem credencial e o job `validar a tag` falha com mensagem clara se estiver privado.
- Branch `main` e ruleset continuam como estão; a tag é criada no commit mergeado.

## 3. DNS (pelo Pedro, no registrador)
- Registro **A** da raiz `ailow.com.br` apontando para o IP público do servidor (valor fora deste repositório).
- Registro **CNAME** `www` para `ailow.com.br`.
- Sem o DNS, o Traefik não emite o certificado e o `/health` de fora falha; o deploy em si (saúde de dentro do container) não depende do DNS.
- **DNS chegou depois do deploy** (L-0033, ocorreu em 2026-11-19): o Traefik v2 **não tenta o ACME de novo** só porque o DNS passou a resolver. Ele só tenta quando a configuração muda, e reaplicar a mesma tag pelo Deploy não muda nada (`stack deploy` idêntico). Sintoma: certificado `TRAEFIK DEFAULT CERT` e no log do Traefik `no valid A records` / `NXDOMAIN` antigos, depois só `Skipping unchanged configuration`. Correção: confirme o A em resolvedores públicos (`nslookup ailow.com.br 1.1.1.1`) e no servidor rode `docker service update --force ailow-index_site`. Isso cria uma tarefa nova com a mesma imagem, e o Traefik emite em segundos. Registre como mudança manual (AUD-24). Conferir: `openssl s_client -connect <ip>:443 -servername ailow.com.br` mostra o emissor Let's Encrypt.

## 4. Deploy pelo pipeline (caminho normal)
1. Antes: suba `package.json` version e o CHANGELOG no PR antes de criar a tag (o rodapé do site mostra essa versão; o workflow recusa tag diferente). Tag `vX.Y.Z` criada **no commit mergeado em `main`**; o workflow `Publicar imagem` termina verde (digest no resumo do run).
2. GitHub > Actions > **Deploy** > Run workflow (branch `main`) > tag. O job `validar a tag` confere formato, existência, commit na `main` e a imagem no GHCR sem credencial.
3. O job `implantar em producao` **fica esperando a aprovação** no Environment `producao`. Aprovar é um ato do Pedro, separado do disparo.
4. No servidor, `ops/deploy/deploy.sh`: confere as variáveis (só nomes e não vazio) e a imagem no registro, `docker stack deploy`, espera 1/1, imagem na tag, nenhuma tarefa `Failed` nova e **3 `/health` 200 seguidos** de dentro do container; grava a tag em `/opt/ailow-index/estado/tag-atual`. Se falhar, reimplanta a tag anterior.
5. O run termina com a verificação de fora: `https://ailow.com.br/health` 200, `/` 200, HSTS de 1 ano, `https://www.ailow.com.br/pedro/` 301/308 para `https://ailow.com.br/pedro/`. O resumo traz `web=<imagem@digest>`.

Códigos de saída do servidor: `0` ok · `2..5` comando/tag recusados · `10` variáveis ausentes ou vazias · `11` imagem não encontrada no registro (2..5, 10 e 11: nada foi alterado) · `20` falhou e **a reversão funcionou** · `21` falhou e a reversão **não** se confirmou, ou foi a 1a implantação sem versão para voltar (nada é apagado; seguir [rollback](rollback.md)).

## 5. Verificar depois (smoke manual, 3 min)
Abrir `https://ailow.com.br/` no celular (360 px) nos dois temas; navegar Home > `/pedro/` > Voltar; `/cartao/` instalável em HTTPS real (conferir o `beforeinstallprompt` que os testes não cobrem); `curl -sI` com HSTS; logs: `docker service logs --since 5m ailow-index_site` (JSON, sem 5xx).

## 6. Depois
Registrar no release (versão, digest, aprovador, resultado, tempo medido). Se algo falhou ou quase: lição (`node harness/scripts/licoes.mjs nova`) e atualizar este runbook.
