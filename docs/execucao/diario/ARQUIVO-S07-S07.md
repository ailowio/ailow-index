# Diário — arquivo (S07)

Entradas movidas de `ATUAL.md` sem edição. Ler só sob demanda.

### S07 — Institucional, `/pulse`, `/cloud` — 2026-11-18 — Claude Sonnet 5.5 (subagente), orquestrado por Claude Opus 5.5
Feito: miolo de `/sobre`, `/pulse` e `/cloud` trocado por conteúdo real (`App.astro`, cabeçalho, Voltar e `noindex` intactos); `src/styles/institucional.css` (tokens, 2 temas). `/sobre`: frase-mãe da tese (dossiê, seção 5), operação por assinatura, infra da Ailow com URL e credencial, ERP de terceiro opcional. `/pulse`: máquina, gateway, MQTT, Postgres; diz que ainda não há tela nem alerta (entradas #056 e #076). `/cloud`: ERP no celular, assinatura por módulo, RLS, loja piloto Marcant sem dado real (#070, #075, #078, #079), link `https://cloud.ailow.com.br`. Cada página linka para `/pedro/label/...` (escopo-pulse, escopo-cloud, escopo-iot, mqtt, openapi). Sem logo extra: a do cabeçalho já é o asset travado por hash.
Números: testes Vitest 179 -> 184; E2E 184 -> 234 (`e2e/institucional.e2e.ts`: 3 rotas x 2 temas x 2 projetos x 4 testes + 2 de rede). Peso das 3 rotas ~6,3 KiB gz, JS 0,62 KiB (orçamento 150 e 10).
Decisões: sem tagline (frase-mãe como texto); sem número de versão do Cloud; sem tópico, IP ou número de voltas; link externo só em `/cloud`, como `<a>` com `rel="noopener noreferrer"`; o teste de conteúdo proibido lê o fonte `.astro` (`test/institucional-conteudo.test.ts`); `noindex` mantido, o deploy decide a indexação.
Canário (L-0006): `<p>venda por voz</p>` injetado em `pulse.astro` reprovou o teste (`expected ['venda por voz'] to deeply equal []`); revertido, verde. O E2E novo também reprovou de início (strict mode do seletor `main, body`), corrigido no próprio teste novo.
Pendências para a próxima: S08 (`/pedro/entrevistas`). Revisão visual do Pedro em lote; a tagline fina segue pendente com ele.
Verificação: `npm run verify` e `npm run e2e` verdes no Windows; screenshots em `D:/apps/_scratch/ailow-index-s07/`.

