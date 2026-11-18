# Diário — arquivo (S08)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S08 — `/pedro/entrevistas` — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: página com 3 cartões (TV Verdes Mares #037, TV Record #014, Programa Experiências Inspiradoras da UFC #012; mais recente primeiro), cada um com imagem WebP 640 px, veículo, data, 1 frase só com fatos do BRIEF/feed e link de prova `/pedro#pr-NNN`. Fonte única `src/data/entrevistas.ts`; `src/styles/entrevistas.css`; `public/entrevistas/*.webp`; `test/entrevistas.test.ts`; `e2e/entrevistas.e2e.ts`. Seta Voltar segue para `/pedro`; o link "Entrevistas" de `/pedro` já apontava para a rota. Sem link externo e sem nome de entrevistador (lista de bloqueio no teste e no E2E: Cláudia, Buhamra, Viviane, Bastos).
Quadros (ffmpeg; D:/videos só leitura): UFC t=400 s (22 KB), Record t=60 s com `yadif` (30 KB), Verdes Mares t=80 s com `yadif` e corte de 24 px da faixa de URL no rodapé (17 KB). As tarjas têm só título genérico.
Números: Vitest 184 -> 191; E2E 234 -> 258 (5 testes x 2 temas x 2 projetos + 2 testes x 2 projetos). Peso `/pedro/entrevistas`: 74,86 KiB gz de 400 (o `peso.mjs` conta as imagens), JS 0,62 KiB. A chave da rota no orçamento já existia (400).
Canários (L-0006): nome injetado num cartão e limite de imagem baixado a 1 KB reprovaram os dois testes correspondentes; revertidos, 7/7 verdes.
Decisões: âncora `#pr-NNN` como prova; primeira imagem `eager`, demais `lazy`.
Pendências para a próxima: S09. Revisão visual do Pedro em lote (conferir os quadros escolhidos).
Verificação: `npm run verify` e `npm run e2e` (258 passed) verdes; screenshots em `D:/apps/_scratch/ailow-index-s08/`.
