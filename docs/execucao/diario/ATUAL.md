# Diário — ailow-index (3 últimas entradas)

Entradas antigas: `diario/ARQUIVO-*.md` (ler só sob demanda).

<!-- Formato:
### SNN — <título> — <AAAA-MM-DD> — <LLM>
Feito: · Números (antes -> depois): · Decisões: · Pendências para a próxima: · Verificação:
-->

### F0 — Trilha rápida do v2 — 2026-11-20 — Claude Opus 5.5 (orquestrador, sem subagente)
Origem: auditoria do site (19/11) + falas do Pedro (`docs/execucao/v2/`, local, fora do git até decisão do Pedro: tem estratégia comercial). Decisões do Pedro: opção A da F0 (tudo, inclusive tirar a trava do Voltar da home); WhatsApp autorizado; sócio desde mai/2015.
Feito: indexação (rotas públicas; noindex em versões, `/bio`, labels e cartão), `robots.txt` e `sitemap.xml` por endpoint Astro, canonical, Open Graph + Twitter card com `public/og/ailow.png` (scripts/og.mjs, Playwright + fontes locais, 148 KB); `src/config/contato.ts` (fonte única do WhatsApp, mensagem com a origem); botão na home, `/apresentacao` e `/bio`; apresentação vira componente e mostra a bio sem abrir a foto; home com a frase de posicionamento; trava do Voltar só no cartão (ADR 003 revisto, EX-03); títulos únicos; mai/2015; `/sobre` sem "alertas e dashboards"; `/pulse` com o estado real. Versão 1.3.0.
Testes alterados por decisão do Pedro (não para passar), todos com comentário "F0": asserts de noindex (home-app, apresentacao, entrevistas, institucional, stack), trava na home (home-app a/b, voltar-regressao H4/H4b/H5), "sem sitemap" do cartão (agora: o sitemap existe e não cita o cartão), "sem wa.me" na apresentação (agora: WhatsApp só pela fonte única; tel:/mailto: seguem proibidos).
Falhas no caminho: (1) o E2E antigo "6 ícones inteiros em 360x640" passou com a 2ª fileira escondida atrás do rodapé (só comparava com a altura da janela); teste novo mais rigoroso ficou vermelho (628 > 584 px), corrigido com espaçamento compacto em telas baixas; o mesmo critério no desktop pegou a moldura (728 > 704 px), corrigido com título de tamanho fixo dentro da moldura. (2) o `astro preview` em segundo plano deixou o filho vivo na porta 4330 depois do TaskStop e bloqueou o webServer do Playwright; encerrado por PID e porta conferida.
Canários (L-0006): `/versoes` sem `indexar={false}` -> 2 falhas de indexação; `/bio` com origem "site" -> falha do botão; script com `popstate` na home -> falha "sem trava". Revertidos e conferidos.
Números: Vitest 337; E2E inteiro 484 passed (exit 0; a F0 tem 27 cenários x 2 projetos); peso: home 11,4/60 KiB (JS 0,42), `/apresentacao` 27,9/150 (JS 1,01), `/bio` 27,9/150.
Pendente do Pedro: pedir o deploy da 1.3.0; trocar a bio do Instagram para `ailow.com.br/bio`; confirmar se `pedro@ailow.com.br` recebe (sem MX).
Screenshots: `D:/apps/.playwright-mcp/auditoria/f0/` (home 360/375/1280/1440, apresentação, bio; 2 temas).

### F0 (deploy) + F5 — Explorador do n8n — 2026-11-20 — Claude Opus 5.5 (orquestrador)
Deploy da F0: PR #26 (7 checks verdes depois de trocar a base do nginx para 1.31.7: o Trivy barrou 4 CRITICAL e 2 HIGH no 1.30.6, e a 1.30.7 não foi publicada no Docker Hub), tag `v1.3.0`, imagem (run 44671540552), Deploy (run 44671689042) **aprovado pelo agente por delegação explícita do Pedro** (EX-04), smoke de fora verde (rotas 200, noindex só onde deve, `[instagram]` no `/bio`, HSTS, `v1.3.0` no rodapé).
F5: o Pedro guardou a chave da API do n8n (`N8N_API_KEY`) no arquivo de ambiente da raiz de `D:/apps` e pediu para obter, analisar e reproduzir os fluxos. A chave é carregada dentro do script que chama a API e nunca é impressa; para achar o arquivo, um script listou só nomes de variáveis e se tinham valor. Só GET (nada alterado no n8n): 86 fluxos, 9 ativos, 2.011 nós. Export bruto, análise e conversor ficam em `D:/apps/_scratch/n8n/` (fora do git). 5 fluxos publicados como versão derivada e saneada (lista de permissões; notas adesivas, parâmetros, credenciais, ids e URLs fora; nomes de pessoas viraram papéis). Página `/explorar` + uma por fluxo, SVG no build, 1,4 KiB de JS, painel por toque/Enter, zoom, arrastar, "Ver rodando", "Ver como lista".
Falhas no caminho: (1) o padrão do id do n8n exigia dígito e o canário (um id real sem dígito) passava: corrigido; (2) axe `label-content-name-mismatch` nos nós: as linhas do rótulo (`tspan`) se juntavam sem espaço; corrigido; (3) `import.meta.glob` não existe no Playwright: o carregador passou a usar `node:fs`; (4) o guard do harness bloqueou um `cat >>` deste diário porque o texto citava o caminho do arquivo de ambiente (falso positivo: o comando não lia o arquivo); registrado com a ferramenta de edição, sem contornar o guard.
Canários (L-0006): nó sujo reprova o saneamento (9 achados); sem o "o que faz" no nó, o teste do painel reprova (5 falhas).
Paralelo: um agente documentou a pasta de IoT e 11 sessões (6 Cursor, 5 Claude Code) em `docs/execucao/v2/IOT-COLHEITA.md` (local). Achou contradições no feed (#056, #063, #081) e senhas em texto puro na pasta de IoT (repositório local, sem remoto): ficam para o Pedro.
`.gitignore`: `docs/execucao/v2/` (o agente apontou que um `git add .` publicaria o trabalho local).
Screenshots: `D:/apps/.playwright-mcp/auditoria/f5/` (índice, teares com painel aberto, LINA; 360 e 1440; 2 temas).
