# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V12 — Vem aí — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V12, retomada, V11; ADR 006, 007 item 5; brainstorm §5.7; COLHEITA K14; entradas com status; /pulse, /cloud; STATUS e ESTRATEGIA da bancada.
Feito: `/vem-ai` com 4 colunas (Em uso · Em teste · Construindo · Próximo passo) e luz de estado do Pulso (acesa, meia, fita de obra, apagada: cor + padrão + palavra); painel do topo leva a cada coluna; 360 px = listas empilhadas, ≥ 72 rem = 4 lado a lado; sem JS próprio. 7 cards: #078, #033, #054 (uso); #080, #076 (testando); #081 (construindo); plataforma de monitoramento do Pulse (próximo passo, citação literal da #081). Status derivado do `status_fato` (`montarQuadro`; o build cai com o feed real). Links no `/pedro` e no `/pulse`; sitemap; selo em `SECOES`. Versão 1.12.0.
Decisões (delegação): fora por falta de fonte pública: "A fábrica no celular" (só estratégia da bancada), Engenharia de Produtos v2 (só áudio/colheita), Ensinando IA (nenhum episódio publicado), novos módulos do Cloud; #032 (testando, bancada de jan/2026) fora do quadro. Em uso preenchido com as 3 entradas `uso` (nenhum candidato estava em uso).
Testes antigos alterados (comentário "V12 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/vem-ai/`), `v08-chao-de-fabrica.test.ts` (SECOES = chão + vem-ai).
Canários (L-0006): verbo errado, sem fonte, entrada sem status/inexistente/pendente, status duplicado, citação inventada, rota inexistente, 9 promessas (Vitest); card com #069 derruba o build; CSS em carrossel e sem foco (6 E2E vermelhos); rótulo do painel quebrando (E2E vermelho). Revertidos.
Falhas no caminho: teste de Tab dava a volta na página (parar no último link); fixture builds sem as entradas (erro só com o feed real); "Construind/o" no painel em 360 px (visto no screenshot; agora E2E).
Números: Vitest 622 → 645; E2E 814 → 852 passed; `/vem-ai` JS 0,70/2 KiB, peso 14,2/60.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v12/`.

### V13 — Explorador de fotos — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V13, retomada, V12; ADR 008; brainstorm §5.3; Explorador (Fluxo.astro, explorar.css, e2e); catálogo da bancada (quadro, gateway, sensoriza), PLANO da série §3 e §9 e claims C14, C16, C17 (só leitura).
Feito: modo foto em `/explorar/<slug>` (`Foto.astro`, `src/fotos/`, `src/data/fotos/*.json`): pontos `<button>` por % com clamp, painel do fluxo (o que é + detalhe técnico), Esc devolve o foco, "Ver como lista", pulso com movimento reduzido. Fotos: V156 t=0,5 s (botoeira e quadro do tear, #047; recorte tira caixa de papelão) e V385 t=3 s (caixa de sensores do piloto, #081; marcas DR, disjuntor, gateway e cabo borradas), WebP 720 px, 62,8 e 64,5 KB, sem metadados. Índice do /explorar ganha "Fotos do chão de fábrica"; sitemap. ADR 008 ganha a revisão "fotos estáticas" (PR + teto 80 KB + lista de permissões de pasta). Versão 1.13.0.
Decisões (delegação): V149–V153 fora (gate 7 do PLANO da série: só depois de D6); quadro = V156 (C17 cita V146–V156 como prova da #047); caixa = V385 (C16 cita V384–V435, caixas do piloto); V442 fora (etiqueta com código de barras); antena sem ponto (função não confirmada); nada de "conforme NR".
Testes antigos alterados: `indexacao.test.ts` (+2 rotas, comentário V13 · ADR 007 item 5 e ADR 008).
Canários (L-0006): foto de 156 KB (2 Vitest vermelhos); clamp tirado + ponto em x=99 (E2E "sai da imagem" vermelho; com clamp, verde); sem a rolagem do ponto (2 vermelhos "painel cobre"); sem a regra de movimento reduzido (2 vermelhos); revertidos. Canários permanentes de pasta, WebP, esquema e conformidade.
Números: Vitest 645 → 662; E2E 852 → 902 passed; fotos JS 1,18/2 KiB, peso 76,8 e 78,7/100 KiB.
Pendência: a #047 diz 25/05; o vídeo do acervo (V156) é de 14/05 (a página diz só a data do vídeo).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v13/`.

### V14 — IA no seu negócio — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V14, retomada, V13; ADR 007; brainstorm §5.5 S3; entradas de n8n, SGI e Cloud; os 5 fluxos; /consultoria e /educacao.
Feito: `/ia-no-seu-negocio` (escolha de setor por link) + `/ia-no-seu-negocio/{grafica,textil,comercio,servico}`: 3 níveis (celular · automação · sistema) × 3 usos; cada uso = fato "Na Copel"/"No Cloud" com #NNN ou "Ver o fluxo" + sugestão tracejada com selo "Sugestão numa …". Fim: /educacao e /consultoria + WhatsApp `[ia-no-seu-negocio · <setor>]`. Link "Ver usos de IA para o seu setor" na escada das duas ofertas. Sitemap, orçamento, seção nova em `apps.ts`. Sem script. Versão 1.14.0.
Decisões (delegação): 15 usos-base (`src/data/ia-no-seu-negocio.ts`); LINA (#007) fora (desligada, não deu conta); NF-e só no têxtil (nota de balcão e de serviço são outro mecanismo); portal do cliente (#050) entra em serviço com "ainda não afirmo uso"; o "GPT próprio" se prova pelo fluxo pcp-no-asana (a #029 não cita GPT); título do cabeçalho "IA por setor" (o nome inteiro corta em 360 px).
Testes antigos alterados: `indexacao.test.ts` (+5 rotas) e `v08-chao-de-fabrica.test.ts` (SECOES + `ia-no-seu-negocio`), comentário V14 · ADR 007 item 5.
Canários (L-0006): permanentes (sem prova, #999, #083 pendente, fluxo inexistente, número fora da fonte, garantia, %, resultado, número em sugestão); mutação no dado (13→14 de nov., "garantido… economiza", prs vazio: 4 vermelhos); E2E (link de fluxo quebrado, link de 26rem, alvo < 48 px: 9 vermelhos); título "IA no negócio" (173 > 164 px) pego pelo E2E novo. Revertidos.
Números: Vitest 662 → 742; E2E 902 → 1052 passed; JS 0,70/2 KiB; peso 13,7 (índice) e 15,2–15,3/60 KiB.
Pendências: revisar os 15 fatos e as 36 sugestões (`src/data/ia-no-seu-negocio.ts`); a caixinha "Tu trabalha com quê?" (brainstorm S3) não foi usada: sem respostas no repo.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v14/`.
