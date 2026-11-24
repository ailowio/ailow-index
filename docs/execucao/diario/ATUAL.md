# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V14 — IA no seu negócio — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: regras, Contrato, V14, retomada, V13; ADR 007; brainstorm §5.5 S3; entradas de n8n, SGI e Cloud; os 5 fluxos; /consultoria e /educacao.
Feito: `/ia-no-seu-negocio` (escolha de setor por link) + `/ia-no-seu-negocio/{grafica,textil,comercio,servico}`: 3 níveis (celular · automação · sistema) × 3 usos; cada uso = fato "Na Copel"/"No Cloud" com #NNN ou "Ver o fluxo" + sugestão tracejada com selo "Sugestão numa …". Fim: /educacao e /consultoria + WhatsApp `[ia-no-seu-negocio · <setor>]`. Link "Ver usos de IA para o seu setor" na escada das duas ofertas. Sitemap, orçamento, seção nova em `apps.ts`. Sem script. Versão 1.14.0.
Decisões (delegação): 15 usos-base (`src/data/ia-no-seu-negocio.ts`); LINA (#007) fora (desligada, não deu conta); NF-e só no têxtil (nota de balcão e de serviço são outro mecanismo); portal do cliente (#050) entra em serviço com "ainda não afirmo uso"; o "GPT próprio" se prova pelo fluxo pcp-no-asana (a #029 não cita GPT); título do cabeçalho "IA por setor" (o nome inteiro corta em 360 px).
Testes antigos alterados: `indexacao.test.ts` (+5 rotas) e `v08-chao-de-fabrica.test.ts` (SECOES + `ia-no-seu-negocio`), comentário V14 · ADR 007 item 5.
Canários (L-0006): permanentes (sem prova, #999, #083 pendente, fluxo inexistente, número fora da fonte, garantia, %, resultado, número em sugestão); mutação no dado (13→14 de nov., "garantido… economiza", prs vazio: 4 vermelhos); E2E (link de fluxo quebrado, link de 26rem, alvo < 48 px: 9 vermelhos); título "IA no negócio" (173 > 164 px) pego pelo E2E novo. Revertidos.
Números: Vitest 662 → 742; E2E 902 → 1052 passed; JS 0,70/2 KiB; peso 13,7 (índice) e 15,2–15,3/60 KiB.
Pendências: revisar os 15 fatos e as 36 sugestões (`src/data/ia-no-seu-negocio.ts`); a caixinha "Tu trabalha com quê?" (brainstorm S3) não foi usada: sem respostas no repo.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v14/`.

### V18 — Trajetória — 2026-11-23 — Claude Opus 5.5 (subagente de UI)
Leu: CLAUDE.md, Contrato, retomada, V14; TRAJETORIA.md §1 e §4 da bancada; 9 trechos curtos da transcrição local de 19/11 (só para conferir marca e fato).
Feito: `/trajetoria` (pedido do Pedro, antes da V15): traço SVG desenhado pela rolagem (CSS `view-timeline`; sem suporte, IntersectionObserver), paradas reveladas por recorte, contador fixo "ano · N ferramentas até aqui"; 10 marcos à mão com fonte + 12 destaques do feed + toda entrada com ferramenta nova (chips na 1ª aparição, 72 no total; HeyGen na #071, ElevenLabs na #082). Sem JS ou com movimento reduzido: estático e inteiro. 7º ícone na home; links na /apresentacao (e /bio), /sobre e Diário de obra; sitemap e orçamento. Versão 1.15.0.
Decisões (delegação): layout só "jul 2025" (bancada diz 19/07, a transcrição "17 de julho, um sábado"); No Code Startup fora como marco (sem data; o Supabase entra pela #021); #057 é a fonte do marco da v2 (a entrada vira o marco); nomes barrados por lista de permitidos (maiúscula fora da lista reprova; nenhum nome real no repo); grade da home segue com 3 colunas (UXM-10), o 7º abre a 3ª fileira.
Testes antigos alterados (comentário V18 · 2026-11-23): `indexacao.test.ts` (+/trajetoria/), contagem 6→7 em `v02-home.test.ts`, `home-app`, `v02-home`, `voltar-regressao`, títulos em `f0-trilha-rapida`; `apresentacao.test.ts` (+ link).
Canários (L-0006): sem a guarda de movimento reduzido (2 E2E vermelhos); chip com 23rem (2 vermelhos em 360); sem `scroll-padding` (Shift+Tab sob o contador: 2 vermelhos); sem a regra de foco (4 vermelhos); "R$", #999 e chip sem a 1ª aparição (9 Vitest vermelhos; o build cai com #999). Revertidos.
Falha no caminho: o minificador juntou `animation-timeline` no shorthand e o Chrome descartou (nada animava); agora só longhands.
Números: Vitest 742 → 777; E2E 1052 → 1106 passed; JS 1,32/2 KiB; peso 18,6/60 KiB.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v18/`.

### V15 — Desktop por rota — 2026-11-24 — Claude Opus 5.5 (subagente de UI)
Leu: CLAUDE.md, Contrato, V15, retomada, V18; ADR 007; CSS e marcação das 7 rotas; E2E de home, Diário e Trajetória.
Feito: ≥ 80 rem, em `src/styles/desktop/` (1 bloco @media por arquivo, só a página da rota importa). Home sem moldura: frase + proposta, portas lado a lado, WhatsApp sob a 1ª, história/Diário sob a 2ª, 7 apps numa fileira abaixo. Ofertas: topo 2 colunas, título de seção numa trilha à esquerda, "Na Copel" ao lado da etapa, raio-x com a mensagem ao lado. Na TV: tarja à esquerda, trechos à direita. Diário: perfil/frentes à esquerda, visita + feed à direita (ordem do DOM igual). Explorar: título ao lado dos cartões. Trajetória: esq e dir dividem a faixa (zigue-zague), topo 2 colunas. ADR 007 ganha a revisão V15. Versão 1.16.0.
Decisões (delegação): regressão por geometria, não por imagem (o CI é Linux); moldura sai no desktop, a grade continua abaixo (item 1); cabeçalho interno segue de ponta a ponta (compartilhado com rotas fora do escopo).
Teste antigo alterado (comentário V15 · 2026-11-23): `v09-diario.e2e.ts` (ordem do topo: ramo < 1280 intacto; ≥ 1280 confere as 2 colunas).
Canários (L-0006): regra das ofertas fora do @media (guarda Vitest e E2E 360 "pares empilhados" vermelhos; a suíte v03 de 360 não pegou); sem o import da home (5 vermelhos + guarda); `.pr-corpo p` sem largura máxima (4 vermelhos, 78 ch); `.escada-tv` com 90rem (4 vermelhos, 144–224 px de sobra). Revertidos.
Prova do celular: geometria de todo elemento em 360 e 375 (7 rotas + chão de fábrica + foto) igual à `main` (0 diferenças; a mesma comparação em 1440 acusa 3349).
Números: Vitest 777 → 790; E2E 1106 → 1150 passed; JS igual; peso +0,25–0,58 KiB.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v15/` (1280/1440 × 2 temas, `celular/`, `trechos/`, `antes/`).
Fechamento pelo orquestrador (Claude Opus 5.5, 24/11): o subagente foi parado antes do relatório; `npm run verify` exit 0 e `npx playwright test` 1150 passed / 44 skipped, exit 0, rodados de novo; canário próprio (home a partir de 20 rem): 1 Vitest + 5 E2E de 360 vermelhos, revertido e verde.
