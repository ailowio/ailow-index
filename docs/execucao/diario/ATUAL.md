# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### S05 — Home como app + Voltar — 2026-11-18 — Claude Sonnet 5.5 (subagente)
Feito: `/` é a tela inicial (widget Ailow, grade 3x2 de 6 ícones SVG, halo amarelo e pulso de fundo, barra de gesto); `App.astro` + 6 rotas "em construção" `noindex`; transição `@view-transition` com `view-transition-name: app-<id>` (ícone↔selo do cabeçalho), "abrir" 0,94→1 e "fechar" 1,05→1 (`:root:has(.tela-home)`), desligada em movimento reduzido; trava do Voltar inline (script < 1 KB gz).
Números: testes 165→171; E2E 28→138. Home: JS 0,67 KiB gz, total 5,89 KiB (orç. 10 e 60).
Decisões: desktop = moldura de aparelho (24 rem) centralizada, não grade ampla (uma só experiência, sem scroll); tokens novos `--moldura`, `--icone-fundo`, `--icone-traco` (par no teste de contraste); hora omitida (exigiria JS); "Contato" = rótulo da rota `/apresentacao`; seta das internas: `history.back()` se o referrer é do site, senão link ao pai. Voltar: pushState de reserva no 1º gesto; `popstate` sem a marca → `forward()`. Limitação: sem gesto o navegador pode sair (igual ao Cloud).
Canário (L-0006): sem o pushState de reserva, E2E (a), (b) e (b2) reprovaram; restaurado, verdes. A transição só foi vista por regras CSS, screenshot e vídeo (webm no `_scratch`); Firefox não testado.
Pendências para a próxima: S06. Revisão visual do Pedro em lote (tema claro, transição).
Verificação: `npm run verify` e `npm run e2e` verdes; screenshots/vídeo em `D:/apps/_scratch/ailow-index-s05/`.

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
