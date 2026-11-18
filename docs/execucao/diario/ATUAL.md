# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

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

### S09 — Apresentação (R3) + avatar pop-up — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: `/apresentacao` rolável (scroll do `.conteudo`, como as demais): saudação exata, avatar redondo que abre `<dialog>` nativo (foto grande, nome, cargo, 1 frase do `/pedro`; botão fechar 48 px com `aria-label`; Esc, clique no fundo, Tab preso, foco devolvido ao gatilho), caminho com 5 links internos, 3 ícones SVG (LinkedIn, Instagram, GitHub `ailowio`) de 48 px. Fonte única `src/data/apresentacao.ts` (`video: null` + `marcaVideo()`), `src/styles/apresentacao.css`, `test/apresentacao.test.ts`, `e2e/apresentacao.e2e.ts`. Foto real: TV Verdes Mares, t=84 s, `yadif`, recorte de 780 px no rosto sem tarja, WebP 160 px (3,4 KB) e 480 px (12 KB) em `public/pedro-foto/`.
Números: Vitest 191 -> 200; E2E 258 -> 286 (7 testes x 2 temas x 2 projetos + 2 x 2 projetos). `/apresentacao` 22,06 KiB gz de 150, JS 0,87 KiB de 10.
Canários (L-0006): `preload="auto"` e `tel:` em contatos reprovaram o Vitest; "retirar" o `g.focus()` NÃO reprovou (o Chromium já devolve o foco do `<dialog>`), então o canário foi reforçado (tirar o foco do gatilho ao fechar) e reprovou os 4 E2E de avatar. Tudo revertido.
Como plugar o vídeo (Pedro grava depois): copiar para `public/apresentacao/` o mp4 (720p H.264, alvo ≤ 8 MB), o poster WebP e o `.vtt`; em `src/data/apresentacao.ts` trocar `video: null` por `{ mp4, poster, vtt, largura, altura }`. A seção aparece com `preload="none"`. Nenhum teste precisa mudar: o teste de dados confere que os 3 arquivos existem quando o vídeo está configurado (o orquestrador trocou, antes do merge, o teste que travava `video: null`).
Decisões: sem telefone, e-mail ou WhatsApp; ícone do GitHub é um glifo `</>` genérico (sem copiar a marca); Tab dentro do dialog é interceptado (1 só elemento focável).
Pendências do Pedro: ok para publicar telefone/e-mail/WhatsApp (o WhatsApp é o cartão da S10); gravar o vídeo; conferir a foto escolhida.
Pendências para a próxima: S10 (cartão PWA). Revisão visual em lote.
Verificação: `npm run verify` (200 testes, peso ok) e `npm run e2e` (286 passed) verdes; screenshots em `D:/apps/_scratch/ailow-index-s09/`.
