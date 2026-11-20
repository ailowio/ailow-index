# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V03 — `/consultoria` — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V03, retomada, V02; ADR 007; brainstorm §1/§5.4; colheita de IoT §7 (#081).
Feito: método em 4 etapas com "Na Copel" e as entradas que provam; escada (Aprender → `/educacao`); casos Copel e Cloud "com a loja piloto"; raio-x de 5 perguntas em forma de OS (`mensagemRaioX`/`linkRaioX` em `contato.ts`, prévia da mensagem, envio abre o `wa.me`). Textos em `src/data/consultoria.ts`; teste exige entrada confirmada por bloco e todo número presente numa delas. Rota indexável, no sitemap. Versão 1.6.0.
Decisões (delegação): sem nome do cliente do Cloud (o feed #070 e o `/cloud` já citam: fica para o Pedro); "todas as máquinas" da #081 não é repetido (contradição em aberto na colheita); sem foto/clipe por etapa e sem slot de vídeo até a V05/V06; botão de enviar desligado sem JS (o form não manda nada ao servidor nem sem JS).
Testes antigos alterados (comentário "V03 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (lista ganha `/consultoria/`) e o placeholder do `v02-home.e2e.ts` (fica só `/educacao`).
Falhas no caminho: (1) o rádio invisível sobre o chip intercepta o clique no texto (o teste passou a tocar o rádio); (2) o `astro preview` de screenshot na 4330 impediu o webServer do Playwright na 4329 ("another preview running"): parado e porta conferida (L-0012); (3) a escada do desktop não subia (`align-items: end`): virou teste; (4) no CI o `getAnimations()` pegou 7 transições de 0,01 ms do reduced-motion global: conta só duração > 1 ms (canário `animate()` de 5 s reprova).
Canários (L-0006): "em 30 dias" no texto, `/consultoria/` fora da lista, `sessionStorage` no script (Vitest vermelho); pixel `/px` ao digitar, `turnos` trocado no envio, escada com `end` (E2E vermelho). Revertidos.
Números: Vitest 367 → 402; E2E 608 → 648 passed; `/consultoria` JS 1,63/10 KiB, peso 16,3/150.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v03/` (360 e 1440, 2 temas, página inteira).

### V04 — `/educacao` — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V04, retomada, V03; ADR 007; brainstorm §1/§5.5; ESTRATEGIA §3.4/§4 e TRAJETORIA §1/§3 (bancada); README da série Ensinando IA.
Feito: formatos (palestra, oficina, trilha) com selo "Proposta" e sem número; áreas temáticas; palco e mídia (#044, #048, #014, #012) com o tipo real; "do outro lado da mesa" (Sebraetec, IEL, FIEC, Sebrae); kit do analista em ficha; escada com o Aprender em destaque e o Automatizar → `/consultoria`. Textos em `src/data/educacao.ts`. Sem script. Indexável, no sitemap. Versão 1.7.0.
Decisões (delegação): "ensinei a equipe a usar o ChatGPT" fora (só no áudio, sem revisão); sem CNPJ, ementa, duração ou valor; credenciamento: páginas do Sebrae por JS e editais PDF ilegíveis aqui, então "não verificado" e só "consulte a sua instituição"; sem citar a série (IA-00 só em 23/11).
Testes antigos alterados (comentário "V04 · 2026-11-20 · ADR 007 item 5"): `indexacao.test.ts` (ganha `/educacao/`); `v02-home.e2e.ts` perde o bloco de placeholder (sem rota).
Falhas no caminho: (1) "Exemplos reais" caiu no filtro de preço (`reais`): texto trocado; (2) meu E2E "sem script no main" pegou o script da seta do layout: passou a aceitar só ele (a regra "sem script próprio" fica no Vitest).
Canários (L-0006): "oficina de 4 h", "Para 40 empresários", "Sou credenciado… edital" (Vitest vermelho); destaque só pela cor (E2E vermelho). Revertidos.
Números: Vitest 402 → 462; E2E 648 → 684 passed; `/educacao` JS 0,70/10 KiB, peso 15,5/150.
Pendências: ver "Pendências do Pedro" na retomada (itens da V04).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v04/`.

### V05 — Ponte bancada → site — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: Contrato, linha V05, retomada, V04; ADR 008, ADR 005 itens 1–2; `tokens.json` da bancada.
Feito: schema Zod estrito (`src/midia/pacote.ts`, via `astro/zod`, sem dependência nova); `validarPacote`/`importarPacote` (`src/midia/validar.ts`): inventário por lista de permissões, tetos, cabeçalho de mp4/webp/png/vtt, `.vtt` obrigatório com vídeo, linter no `site.json` e nas legendas, tudo ou nada (copia para pasta temporária e renomeia); `npm run importar-midia -- <pasta>`; cópia `src/styles/pulso-tokens.json` + `pulso-deriva.ts` (MAPA de 31 tokens) + teste de deriva; `npm run tokens:sincronizar`; `docs/contratos/bancada-site.md`; I-13 no inventário; fixtures sintéticos em `test/fixtures/midia/`.
Decisões (delegação): sem bump de versão nem CHANGELOG (ferramenta interna; entrada em [Unreleased] apareceria em `/versoes`); MB/KB decimais (mais estrito); a cópia dos tokens leva só nome e valor (as notas de uso citam o clone, ainda não público); `sinal-fraco` (#1b6fb0 no site, #2a6fae na bancada) e `fonte-mono` (sem IBM Plex) ficam como divergência declarada com teste que reprova exceção obsoleta; CLI roda TS por `--experimental-strip-types` (Node 22 do `.nvmrc`).
Limites declarados: duração real do mp4, proporção do pôster, dado em tela e existência dos `#NNN` no feed não são conferidos.
Canários (L-0006): mutação (teto ×1000, `.vtt` não exigido) deixou 4 testes vermelhos; revertida. Casos: vídeo > 8 MB, pôster/og acima do teto, > 60 s, sem `.vtt`, `.exe/.mov/.html`, subpasta, IP e `ilo.com.br`, termo local, cabeçalho falso; tokens: cor, duração, raio, espaço, traço, easing, token removido.
Falhas no caminho: `astro check` rejeitou `groups` extra no tipo de `reduzirTokens`: tipo afrouxado.
Números: Vitest 462 → 498; E2E 684 passed (sem mudança de rota).
Pendências do Pedro: alinhar ou documentar `sinal-fraco`; V06 precisa dos derivados em `final/site/`.
