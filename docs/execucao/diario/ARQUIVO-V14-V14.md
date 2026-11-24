### V14 — IA no seu negócio — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V14, retomada, V13; ADR 007; brainstorm §5.5 S3; entradas de n8n, SGI e Cloud; os 5 fluxos; /consultoria e /educacao.
Feito: `/ia-no-seu-negocio` (escolha de setor por link) + `/ia-no-seu-negocio/{grafica,textil,comercio,servico}`: 3 níveis (celular · automação · sistema) × 3 usos; cada uso = fato "Na Copel"/"No Cloud" com #NNN ou "Ver o fluxo" + sugestão tracejada com selo "Sugestão numa …". Fim: /educacao e /consultoria + WhatsApp `[ia-no-seu-negocio · <setor>]`. Link "Ver usos de IA para o seu setor" na escada das duas ofertas. Sitemap, orçamento, seção nova em `apps.ts`. Sem script. Versão 1.14.0.
Decisões (delegação): 15 usos-base (`src/data/ia-no-seu-negocio.ts`); LINA (#007) fora (desligada, não deu conta); NF-e só no têxtil (nota de balcão e de serviço são outro mecanismo); portal do cliente (#050) entra em serviço com "ainda não afirmo uso"; o "GPT próprio" se prova pelo fluxo pcp-no-asana (a #029 não cita GPT); título do cabeçalho "IA por setor" (o nome inteiro corta em 360 px).
Testes antigos alterados: `indexacao.test.ts` (+5 rotas) e `v08-chao-de-fabrica.test.ts` (SECOES + `ia-no-seu-negocio`), comentário V14 · ADR 007 item 5.
Canários (L-0006): permanentes (sem prova, #999, #083 pendente, fluxo inexistente, número fora da fonte, garantia, %, resultado, número em sugestão); mutação no dado (13→14 de nov., "garantido… economiza", prs vazio: 4 vermelhos); E2E (link de fluxo quebrado, link de 26rem, alvo < 48 px: 9 vermelhos); título "IA no negócio" (173 > 164 px) pego pelo E2E novo. Revertidos.
Números: Vitest 662 → 742; E2E 902 → 1052 passed; JS 0,70/2 KiB; peso 13,7 (índice) e 15,2–15,3/60 KiB.
Pendências: revisar os 15 fatos e as 36 sugestões (`src/data/ia-no-seu-negocio.ts`); a caixinha "Tu trabalha com quê?" (brainstorm S3) não foi usada: sem respostas no repo.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v14/`.

