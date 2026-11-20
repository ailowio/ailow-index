# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### V05 — Ponte bancada → site — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: Contrato, linha V05, retomada, V04; ADR 008, ADR 005 itens 1–2; `tokens.json` da bancada.
Feito: schema Zod estrito (`src/midia/pacote.ts`, via `astro/zod`, sem dependência nova); `validarPacote`/`importarPacote` (`src/midia/validar.ts`): inventário por lista de permissões, tetos, cabeçalho de mp4/webp/png/vtt, `.vtt` obrigatório com vídeo, linter no `site.json` e nas legendas, tudo ou nada (copia para pasta temporária e renomeia); `npm run importar-midia -- <pasta>`; cópia `src/styles/pulso-tokens.json` + `pulso-deriva.ts` (MAPA de 31 tokens) + teste de deriva; `npm run tokens:sincronizar`; `docs/contratos/bancada-site.md`; I-13 no inventário; fixtures sintéticos em `test/fixtures/midia/`.
Decisões (delegação): sem bump de versão nem CHANGELOG (ferramenta interna; entrada em [Unreleased] apareceria em `/versoes`); MB/KB decimais (mais estrito); a cópia dos tokens leva só nome e valor (as notas de uso citam o clone, ainda não público); `sinal-fraco` (#1b6fb0 no site, #2a6fae na bancada) e `fonte-mono` (sem IBM Plex) ficam como divergência declarada com teste que reprova exceção obsoleta; CLI roda TS por `--experimental-strip-types` (Node 22 do `.nvmrc`).
Limites declarados: duração real do mp4, proporção do pôster, dado em tela e existência dos `#NNN` no feed não são conferidos.
Canários (L-0006): mutação (teto ×1000, `.vtt` não exigido) deixou 4 testes vermelhos; revertida. Casos: vídeo > 8 MB, pôster/og acima do teto, > 60 s, sem `.vtt`, `.exe/.mov/.html`, subpasta, IP e `ilo.com.br`, termo local, cabeçalho falso; tokens: cor, duração, raio, espaço, traço, easing, token removido.
Falhas no caminho: `astro check` rejeitou `groups` extra no tipo de `reduzirTokens`: tipo afrouxado.
Números: Vitest 462 → 498; E2E 684 passed (sem mudança de rota).
Pendências do Pedro: alinhar ou documentar `sinal-fraco`; V06 precisa dos derivados em `final/site/`.

### V06 — Pacotes de vídeo — 2026-11-20 — Claude Sonnet 5.5 (subagente)
Leu: Contrato, linha V06, retomada, V05; ADR 005/008; STATUS e PUBLICAR da bancada.
Feito: 5 pacotes importados (6 prontos na bancada; P3 retirado, ver abaixo) em `final/site/<slug>/` da bancada (só essa pasta), importados com `npm run importar-midia`: `teaser-p1-improvisar-sob-pressao`, `teaser-p2-teoria-na-pratica`, `fixado-00-o-que-eu-faco`, `chao-1-dois-quadros`, `chao-2-sinal-chegou`. 720x1280, 5,2–6,9 MB; pôster 15–67 KB; `.vtt` pela AssemblyAI (chave lida dentro do script, nunca impressa). `/apresentacao` e `/bio` ganham o Fixado 00 no slot (`preload="none"`, aviso "parte da imagem e da voz é gerada por IA"). Versão 1.8.0.
Decisões (delegação): E6 (v5, 76 s, sem teaser) NÃO importado: pendência "subir no YouTube"; Fixado 00 como pitch (aprovado v8; é clone e voz de IA, `selo_ia` true; o pitch "gravado por ele" do ADR 003 segue possível depois); `aprovado_em` = 2026-11-19 (data do STATUS, que não traz data por peça); `fatos` vazio (V08 liga #080/#081); `selo_ia` true também nos 2 Chão (tarja "VOZ IA"); teasers sem selo (entrevista real).
Revisão de tela (1 frame a cada 3 s, 6 derivados olhados): sem CNPJ, NF, IP, placa nem nome de cliente. Ressalva: no P3 (t≈27–36 s) aparece, desfocada, uma tela do ERP com colunas "R$" ilegíveis e a marca de emissora no rodapé borrado; o orquestrador viu o frame de 31 s (datas legíveis, "R$" parcial) e RETIROU o P3 do PR (pacote segue em `final/site/` da bancada; pendência do Pedro: vetar ou liberar, e reimportar se liberar).
Testes antigos alterados (comentário V06): `e2e/apresentacao.e2e.ts`, "zero requisição…": `video` count 0 → 1 com `preload="none"` (mesma prova de 0 mídia antes do toque).
Canários (L-0006): `preload="auto"` deixou 4 E2E vermelhos (revertido); `violacoes()` reprova arquivo > 8 MB, vídeo sem `.vtt` e sem pôster (teste com pasta temporária).
Falhas no caminho: Biome proíbe `export` em teste; no Chromium headless o 1º toque no pôster só mostra controles (o E2E clica e chama `play()`); o `.vtt` (1 KB) baixa no carregamento por causa do `<track default>`, não é vídeo.
Números: Vitest 498 → 504; E2E 684 → 686 passed; `/apresentacao` JS 1,01/10 KiB, peso 28,65/150; `public/midia` 30,1 MB somados (5 pacotes; eram 36,3 com o P3) (5 pacotes; só o Fixado 00 é servido por página até a V07/V08), a imagem do nginx cresce o mesmo.
Screenshots: `D:/apps/.playwright-mcp/auditoria/v06/`.

### V07 — Na TV (entrevistas) — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, V07, retomada, V06; ADR 005, 007 item 5; brainstorm §5.2; `.vtt` dos teasers; roteiro da série (bancada).
Feito: `/na-tv` com a escada UFC → Record → afiliada Globo em tarjas de TV (GC) no Pulso, só com o nome em texto; P1 e P2 no degrau da UFC com 4 chips cada (tempo = início de um cue do `.vtt`) e legenda grande fora do quadro (a nativa fica `hidden`: os teasers já têm legenda queimada). Fachada do YouTube (`FachadaYoutube.astro` + `fachada-youtube.ts`, cliente 1 KB) só com `youtubeId`: hoje nenhum, nada renderiza, CSP intacta; I-12 no inventário como inativa. `/pedro/entrevistas` → 301 `/na-tv/` no nginx (+ meta refresh noindex do build); ícone "Na TV" na home; sitemap. `peso.mjs` passa a contar `poster=`. Versão 1.9.0.
Decisões (delegação): P2 no degrau da UFC, não da Record (o pôster traz o selo "UFC · Experiências Inspiradoras" e a fala é da UFC); fotos das emissoras fora (têm bug/logo; arquivos e dados de `entrevistas.ts` ficam); `/na-tv` com orçamento 150 (os 400 do ADR 003 eram das fotos); pai da seta = início.
Testes antigos alterados (comentário "V07 · 2026-11-20 · ADR 007 item 5"): `entrevistas.e2e.ts`, `voltar-regressao.e2e.ts` (H1, H1b, H3), `home-app.e2e.ts` (c), `csp.e2e.ts`, `pedro-feed.e2e.ts`, `apresentacao.e2e.ts`, `entrevistas.test.ts`, `indexacao.test.ts`, `apresentacao.test.ts`, `peso.test.ts`, `scripts/smoke-imagem.mjs`.
Canários (L-0006): chip fora do cue, iframe no HTML, iframe no carregamento, 302 no nginx (Vitest vermelho); `preload="auto"` e seek +2 s (E2E vermelho); pôster acima do teto (peso). Revertidos.
Falhas no caminho: preview na 4330 esquecido travou o `webServer` do Playwright (L-0012); estilo computado de `<source>`/`<track>` vem vazio.
Números: Vitest 504 → 529; E2E 686 → 734 passed; `/na-tv` JS 1,09/10 KiB, peso 60,7/150; `/apresentacao` e `/bio` 28,65 → 50,2 (pôster passou a contar).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v07/`.
