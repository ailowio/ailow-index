# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### F0 (deploy) + F5 — Explorador do n8n — 2026-11-20 — Claude Opus 5.5 (orquestrador)
Deploy da F0: PR #26 (7 checks verdes depois de trocar a base do nginx para 1.31.7: o Trivy barrou 4 CRITICAL e 2 HIGH no 1.30.6, e a 1.30.7 não foi publicada no Docker Hub), tag `v1.3.0`, imagem (run 44671540552), Deploy (run 44671689042) **aprovado pelo agente por delegação explícita do Pedro** (EX-04), smoke de fora verde (rotas 200, noindex só onde deve, `[instagram]` no `/bio`, HSTS, `v1.3.0` no rodapé).
F5: o Pedro guardou a chave da API do n8n (`N8N_API_KEY`) no arquivo de ambiente da raiz de `D:/apps` e pediu para obter, analisar e reproduzir os fluxos. A chave é carregada dentro do script que chama a API e nunca é impressa; para achar o arquivo, um script listou só nomes de variáveis e se tinham valor. Só GET (nada alterado no n8n): 86 fluxos, 9 ativos, 2.011 nós. Export bruto, análise e conversor ficam em `D:/apps/_scratch/n8n/` (fora do git). 5 fluxos publicados como versão derivada e saneada (lista de permissões; notas adesivas, parâmetros, credenciais, ids e URLs fora; nomes de pessoas viraram papéis). Página `/explorar` + uma por fluxo, SVG no build, 1,4 KiB de JS, painel por toque/Enter, zoom, arrastar, "Ver rodando", "Ver como lista".
Falhas no caminho: (1) o padrão do id do n8n exigia dígito e o canário (um id real sem dígito) passava: corrigido; (2) axe `label-content-name-mismatch` nos nós: as linhas do rótulo (`tspan`) se juntavam sem espaço; corrigido; (3) `import.meta.glob` não existe no Playwright: o carregador passou a usar `node:fs`; (4) o guard do harness bloqueou um `cat >>` deste diário porque o texto citava o caminho do arquivo de ambiente (falso positivo: o comando não lia o arquivo); registrado com a ferramenta de edição, sem contornar o guard.
Canários (L-0006): nó sujo reprova o saneamento (9 achados); sem o "o que faz" no nó, o teste do painel reprova (5 falhas).
Paralelo: um agente documentou a pasta de IoT e 11 sessões (6 Cursor, 5 Claude Code) em `docs/execucao/v2/IOT-COLHEITA.md` (local). Achou contradições no feed (#056, #063, #081) e senhas em texto puro na pasta de IoT (repositório local, sem remoto): ficam para o Pedro.
`.gitignore`: `docs/execucao/v2/` (o agente apontou que um `git add .` publicaria o trabalho local).
Screenshots: `D:/apps/.playwright-mcp/auditoria/f5/` (índice, teares com painel aberto, LINA; 360 e 1440; 2 temas).

### V01 — Decisões (ADRs 005–008) — 2026-11-20 — Claude Opus 5.5 (orquestrador)
Leu: Contrato, linha V01, Estado de retomada, última entrada; brainstorm §1–§6, §8–§11; transcrição de 19/11 (trechos de YouTube e do feed); ADR 002/003; `claims.csv` (C04, C11, C16); CSP do nginx.
Feito: ADR 005 (teaser ≤ 60 s/8 MB auto-hospedado; longo no YouTube só por fachada, iframe `youtube-nocookie` criado no toque, `frame-src` só nas rotas com fachada); ADR 006 (site mestre, `status_fato` nas entradas de vitrine, coluna `fato_site` no CSV, script de conciliação local, CI nunca lê a bancada); ADR 007 (duas portas iguais + "Conhecer a história" abaixo, escada, feed = "Diário de obra" secundário com `/pedro` mantido, rotas novas por sessão, stories para o backlog); ADR 008 (pacote `final/site/<slug>/` com `site.json` Zod, tetos, importador local, bancada sem git, tokens com teste de deriva, interface I-13 na V05). CLAUDE.md: regra "zero terceiros antes do toque".
Decisões: as de mérito são do Pedro (19/11: YouTube aceito, duas portas + escada, fonte = site, feed secundário). Nome "Diário de obra", URL `/pedro` mantida, bancada sem git, `/historia` fora do v2 e os tetos foram decididos pelo orquestrador por delegação (18/11 e 20/11), registrados nos ADRs.
Pendências: o Pedro sobe as entrevistas longas no YouTube (não listado) e passa os ids; até lá a V07 usa só teasers.
Verificação: `npm run verify` exit 0 (só docs mudaram).

### V02 — Home v2 — 2026-11-20 — Claude Opus 5.5 (subagente de UI)
Leu: Contrato, linha V02, retomada, V01; ADR 007; ADR 003 (home).
Feito: home com a frase da F0 + duas portas de mesmo peso (`PORTAS` em `src/config/apps.ts`: "Fazer na minha empresa" → `/consultoria`, "Levar para minha instituição" → `/educacao`), WhatsApp, "Conhecer a história" (`/apresentacao`, menor) e "Diário de obra" (`/pedro`); grade de apps abaixo, sob a linha de pulso (saiu do fundo: cruzava os links). Pulso no toque (`.batida`, anel + onda no ponto tocado, atrás do conteúdo). Placeholders `/consultoria` e `/educacao` (App + "Em construção" + oferta + WhatsApp `[consultoria]`/`[educação]`). Versão 1.5.0.
Decisões (delegação): placeholders com noindex até a V03/V04; frase da F0 mantida inteira (o teste da F0 exige "cursos de IA"); margem lateral da home 24 → 16 px; em 360x640 a grade não aparece sem rolar (só o conteúdo rola).
Testes antigos alterados (comentário "V02 · 2026-11-20 · ADR 007"): home-app "360x640 não rola e os 6 ícones…" e "estado de toque" (rolar até a grade antes); f0 "360x640" e "1280x800" dos ícones (idem). Critérios iguais.
Falhas no caminho: (1) o minificador fundiu `.app` e `.batida` numa regra só e o teste antigo do movimento reduzido (regex do `cssText`) ficou vermelho: bloco próprio para a `.batida`; (2) no desktop o pulso nascia 8 px fora (borda da moldura): `clientLeft/Top`; (3) dois canários de CSS juntos se anularam (título menor encolheu as portas): refeitos um a um.
Canários (L-0006): fonte diferente numa porta → "mesmo peso" vermelho; +2rem acima da história → 607,9 > 584; sem reduced-motion da `.batida` → vermelho; `/consultoria` indexável → vermelho; JS da home 0,5 KiB → `peso` estourou. Revertidos e conferidos.
Números: Vitest 363 → 367; E2E 558 → 608 passed; peso `/` 12,5/60 KiB (JS 0,67/10), `/consultoria` e `/educacao` 11,8/150 (JS 0,70).
Screenshots: `D:/apps/.playwright-mcp/auditoria/v02/`.
