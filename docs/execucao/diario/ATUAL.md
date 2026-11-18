# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S06 — `/pedro` (feed) no Pulso — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/pedro` com nome, cargo "Produtos Digitais e Operações", apresentação só com fatos, links (LinkedIn, Instagram, Entrevistas), bloco "Antes do primeiro commit", filtro por frente, painel "Ferramentas" derivado (por categoria, nº de PRs e "desde #NNN"; `<details>` fechado) e feed de 81 cartões de PR (#082 no topo; selo merged/open/closed, data AAAA-MM, `+ferramenta` na 1ª aparição, soft skills, prova pública como link e privada como texto). 87 páginas `/pedro/label/<slug>` (ferramenta = id; frente = `escopo-<id>`, porque `n8n` é ferramenta e escopo). Corpo renderizado com `render()` do Astro. Código: `src/changelog/labels.ts`, `CartaoPR.astro`, `feed.css`.
Números: testes 171 -> 179; E2E 138 -> 184 (`e2e/pedro-feed.e2e.ts`: 3 rotas x 2 temas x 2 viewports). `/pedro` 20,4 KiB gz (JS 0,62); labels 7-9 KiB; orçamento padrão 150 (labels usam o `padrao`; o script não tem curinga).
Decisões: rola só o `main` (exceção UXM-01), a página não; painel recolhido para o feed aparecer logo; chips com alvo de 48 px; sem ícone nem embed de terceiros.
Canário (L-0006): um cartão extra injetado em `/pedro` reprovou a contagem (esperado 81, recebido 82); removido. Pendentes/`fora` conferidos contra o disco.
Pendências para a próxima: S07. Revisão visual do Pedro em lote.
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots em `D:/apps/_scratch/ailow-index-s06/`.

### S07 — Institucional, `/pulse`, `/cloud` — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: miolo de `/sobre`, `/pulse` e `/cloud` trocado por conteúdo real (`App.astro`, cabeçalho, Voltar e `noindex` intactos); `src/styles/institucional.css` (tokens, 2 temas). `/sobre`: frase-mãe da tese (dossiê, seção 5), operação por assinatura, infra da Ailow com URL e credencial, ERP de terceiro opcional. `/pulse`: máquina, gateway, MQTT, Postgres; diz que ainda não há tela nem alerta (entradas #056 e #076). `/cloud`: ERP no celular, assinatura por módulo, RLS, loja piloto Marcant sem dado real (#070, #075, #078, #079), link `https://cloud.ailow.com.br`. Cada página linka para `/pedro/label/...` (escopo-pulse, escopo-cloud, escopo-iot, mqtt, openapi). Sem logo extra: a do cabeçalho já é o asset travado por hash.
Números: testes Vitest 179 -> 184; E2E 184 -> 234 (`e2e/institucional.e2e.ts`: 3 rotas x 2 temas x 2 projetos x 4 testes + 2 de rede). Peso das 3 rotas ~6,3 KiB gz, JS 0,62 KiB (orçamento 150 e 10).
Decisões: sem tagline (frase-mãe como texto); sem número de versão do Cloud; sem tópico, IP ou número de voltas; link externo só em `/cloud`, como `<a>` com `rel="noopener noreferrer"`; o teste de conteúdo proibido lê o fonte `.astro` (`test/institucional-conteudo.test.ts`); `noindex` mantido, o deploy decide a indexação.
Canário (L-0006): `<p>venda por voz</p>` injetado em `pulse.astro` reprovou o teste (`expected ['venda por voz'] to deeply equal []`); revertido, verde. O E2E novo também reprovou de início (strict mode do seletor `main, body`), corrigido no próprio teste novo.
Pendências para a próxima: S08 (`/pedro/entrevistas`). Revisão visual do Pedro em lote; a tagline fina segue pendente com ele.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s07/`.

### S08 — `/pedro/entrevistas` — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: página com 3 cartões (TV Verdes Mares #037, TV Record #014, Programa Experiências Inspiradoras da UFC #012; mais recente primeiro), cada um com imagem WebP 640 px, veículo, data, 1 frase só com fatos do BRIEF/feed e link de prova `/pedro#pr-NNN`. Fonte única `src/data/entrevistas.ts`; `src/styles/entrevistas.css`; `public/entrevistas/*.webp`; `test/entrevistas.test.ts`; `e2e/entrevistas.e2e.ts`. Seta Voltar segue para `/pedro`; o link "Entrevistas" de `/pedro` já apontava para a rota. Sem link externo e sem nome de entrevistador (lista de bloqueio no teste e no E2E: Cláudia, Buhamra, Viviane, Bastos).
Quadros (ffmpeg; D:/videos só leitura): UFC t=400 s (22 KB), Record t=60 s com `yadif` (30 KB), Verdes Mares t=80 s com `yadif` e corte de 24 px da faixa de URL no rodapé (17 KB). As tarjas têm só título genérico.
Números: Vitest 184 -> 191; E2E 234 -> 258 (5 testes x 2 temas x 2 projetos + 2 testes x 2 projetos). Peso `/pedro/entrevistas`: 74,86 KiB gz de 400 (o `peso.mjs` conta as imagens), JS 0,62 KiB. A chave da rota no orçamento já existia (400).
Canários (L-0006): nome injetado num cartão e limite de imagem baixado a 1 KB reprovaram os dois testes correspondentes; revertidos, 7/7 verdes.
Decisões: âncora `#pr-NNN` como prova; primeira imagem `eager`, demais `lazy`.
Pendências para a próxima: S09. Revisão visual do Pedro em lote (conferir os quadros escolhidos).
Verificação: `npm run verify` e `npm run e2e` (258 passed) verdes; screenshots em `D:/apps/_scratch/ailow-index-s08/`.
