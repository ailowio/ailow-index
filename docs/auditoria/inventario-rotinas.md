# Inventário de rotinas computacionais — ailow-index   (AUD-40..44)

*Última atualização: 2026-11-18. Rotina = tudo que roda sem alguém apertar o botão. O site não tem cron, job de aplicação, backup nem sincronização: o conteúdo vive no git.*

| ID | Rotina | Finalidade | Dono | Onde roda | Agenda | Entradas → Saídas | Criticidade | Quem pode alterar/agendar | Como sei que rodou | Alerta em falha? | Reprocessável? | Runbook |
|----|--------|-----------|------|-----------|--------|-------------------|-------------|---------------------------|--------------------|------------------|----------------|---------|
| R-01 | CI (`verify`, `e2e`, `seguranca-sca`, `seguranca-sast`, `seguranca-segredos`) | portão de qualidade e segurança antes do merge | Pedro | GitHub Actions | a cada PR e push em `main` | código → pass/fail | Alta | quem altera `.github/workflows/ci.yml` por PR (ruleset exige os checks) | aba Actions do GitHub | check vermelho no PR; e-mail do GitHub (configuração de notificação: não verificado) | sim (re-run) | `README.md` |
| R-02 | Dependabot (npm e github-actions) | PRs de atualização de dependência | Pedro | GitHub | semanal (`.github/dependabot.yml`) | manifestos → PRs agrupados | Média | dono do repositório | aba Insights → Dependency graph → Dependabot | PR aberto | sim | n/a |
| R-03 | Alertas de segurança do Dependabot e secret scanning | detectar CVE e segredo | Pedro | GitHub | contínua | repositório → alertas | Alta | dono do repositório | aba Security | notificação do GitHub (canal: não verificado) | n/a | `docs/excecoes.md` (EX-02) |
| R-05 | Job `imagem` do CI | build da imagem nginx não-root, smoke (rotas, cabeçalhos, CSP por hash, manifest, sw.js) e Trivy | Pedro | GitHub Actions | a cada PR e push em `main` | `Dockerfile` + `ops/web/` → pass/fail | Alta | quem altera `ci.yml` por PR | aba Actions | check vermelho no PR | sim (re-run) | `README.md` |
| R-04 | Deploy do site (**planejada, S07**) | publicar a imagem | Pedro | GitHub Actions → VPS | manual, com approval | tag → imagem nginx | Alta | dono, com aprovação do Environment | a definir | a definir | sim (reimplantar a tag anterior) | a criar na S07 |

## Backups e continuidade (AUD-43/44)
| Sistema | Escopo | Frequência | Retenção | Cifrado? | Local (separado?) | Último teste de restauração | RPO | RTO |
|---------|--------|-----------|----------|----------|-------------------|-----------------------------|-----|-----|
| Repositório (git, GitHub) | todo o código e conteúdo | a cada push; cada clone é uma cópia completa | histórico completo | n/a (público) | GitHub + clone local do Pedro | **não realizado** (nenhum clone de restauração testado) | até o último push | quanto durar reconfigurar ruleset e Actions; não medido |
| Site em produção | n/a (estático, reconstruível pelo build) | n/a | n/a | n/a | n/a | n/a (sem deploy ainda; ensaio de rollback na S07) | n/a | a medir na S07 |

## Revisão
- Revisado por: Pedro (pendente) em ____ · Rotinas sem dono ou sem alerta: R-01/R-03, canal de notificação a confirmar (⇒ conferir Settings → Notifications do GitHub).
