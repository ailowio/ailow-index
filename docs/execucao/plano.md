# Plano de execução — ailow-index

Origem (plano aprovado em 2026-11-17, leitura integral só se faltar contexto):
`C:\Users\pedro\.claude\plans\pasted-content-id-80dc-pensei-aqui-swirling-gem.md`.
Dossiê de entrada: `D:\apps\_scratch\ilo-index-discovery-2026-11-17.md` (gitignored, não commitar).

Resumo: site da Ailow em `ailow.com.br` (Astro estático, tier A). `/pedro` é o portfólio do Pedro
em formato de **changelog em feed de PRs** (marca Pulso); `/`, `/pulse`, `/cloud` usam a marca Ailow.
Decisões do Pedro: ADR 001 (stack) e ADR 002 (modelo do changelog) em `docs/adr/`.

## Contrato de toda sessão

1. **Abrir em camadas:** este Contrato + a linha da sessão + Estado de retomada, e a última entrada
   de `diario/ATUAL.md`. O resto (ADRs, dossiê, plano de origem) só sob demanda. Declarar o que leu.
2. **Gate do harness:** tier A; regras e lições listadas no ADR 001 e no `CLAUDE.md` do app.
3. **Estado real:** conferir `git -C D:/apps/ailow-index rev-parse --show-toplevel` = pasta do app
   (L-0010), `git status`, versão do Node, antes de escrever.
4. **Escopo fechado:** não adiantar a próxima sessão; respeitar o "não fazer".
5. **Test-first** nas regras do changelog; cada gate novo ganha um **canário** que tem de reprovar (L-0006).
6. **Verificar:** `npm run verify` (e `npm run e2e` a partir da S04), com a saída citada no diário.
7. **Commit/push/PR/merge:** o Pedro delegou ao orquestrador (2026-11-18) commit, push, PR, merge e deleção de branches, com os 4 checks verdes; **subagente não commita**. **Deploy/DNS só com pedido do Pedro**; o deploy para no approval (L-0027). Arquivos só com Write/Edit (L-0002).
8. **Conteúdo público:** nada de IP, segredo, número de fatura, nome de cliente/prospect, projeto pessoal privado,
   grafia `ilo.`, KPI sem claim confirmado, feature que não existe. Só entra entrada `confirmado`.
9. **Fechar:** diário curto + poda + Estado de retomada sobrescrito + prompt da próxima (ou portão).
10. Identificar a LLM no fim da resposta e na linha do diário.

## Sessões

| Sessão | Título | Escopo | Pronto quando | Não fazer |
|---|---|---|---|---|
| S01 | Scaffold | git próprio, `.gitignore`, README, `CLAUDE.md`, `.env.example`, Astro estático + Biome + Vitest + `astro check`, `verify`, CI (verify + gitleaks), PR template, ADR 001/002 | `npm run verify` verde local; `rev-parse` = pasta do app | conteúdo do feed, UI, remoto, commit sem ok |
| S02 | Modelo do changelog (TDD) | schema da collection `prs`, catálogos `ferramentas`/`soft-skills`, ordem número×data, diff derivado `+ferramenta`, filtro `confirmado`, linter de conteúdo (lista de bloqueio) | testes vermelhos→verdes; 1 canário por gate reprova; fixture `pendente` fora do `dist/` | páginas visuais, conteúdo real |
| S02b | Governança do repositório (subagente) | `seguranca-sast` (Semgrep igual ao Cloud), Dependabot, threat model, inventários de auditoria, harness-adoption, CONTRIBUTORS, SECURITY, `docs/ia.md`, CHANGELOG | `verify` + gitleaks verdes; PR aberto pelo orquestrador | `src/`, `test/`, deps, licença (decisão do Pedro) |
| S03b 🚦 | Discovery do A1 + ADR 003 (subagente) | ver "Aprimoramento A1": verificar viabilidade técnica nas docs oficiais, escrever `docs/execucao/brief-app.md` e o ADR 003 **proposto** com alternativas, propor nova tabela S04+ | brief + ADR 003 proposto + tabela proposta; cada hipótese marcada verificada/não verificada com link oficial | código, dependência nova, decidir pelo Pedro |
| S03 🚦 | Curadoria com o Pedro | gerar `docs/curadoria.md` com as sementes; o Pedro marca `confirmado`/`fora`, escreve cargo e #001, escolhe fluxos n8n, passa LinkedIn; conferir handles vivos da company page | lista aprovada pelo Pedro (portão humano). **Parte 2 feita no #7** (feed gravado: 67 entradas, 47 confirmadas) | publicar algo não marcado |
| S03c | ADR 003 aceito + plano S04+ | status Aceito, 13 decisões registradas, tabela abaixo | feita (este PR) | código |
| S03d | Feed parte 3 | aplicar as respostas do Pedro ao feed: fluxos n8n, certificações do LinkedIn, quadro de comando NR-10/12, hospedagem Netlify→Vercel→VPS/Hostinger/Cloudflare, ferramentas em excesso | `verify` verde; cada entrada `confirmado` com prova | UI |
| S04 | Fundações: Pulso de produto | tokens do Pulso em rem + tema claro derivado (testes de contraste), logo em versão clara e escura, fontes auto-hospedadas (OFL), layout base, botão de tema, Playwright + axe, script de peso por rota, `@view-transition` | E2E: sem scroll horizontal 360/1280 nos 2 temas; axe limpo; 0 requisição externa; canários de contraste e de peso reprovam | páginas de conteúdo, vídeo, PWA |
| S05 🔎 | Home como app + Voltar | grade de 6 ícones, estados de toque, transição nativa "excelente" (iterar e testar), Voltar igual ao Cloud (ADR 003, item 4: nunca sai do site) | home sem scroll em 360×640; 1 toque ícone→conteúdo; E2E: Voltar na raiz não sai; JS ≤ 10 KB gz | rotas internas completas |
| S06 🔎 | `/pedro` (feed) no Pulso | cargo "Produtos Digitais e Operações" no topo, bloco "antes do primeiro commit", feed de PRs, `/pedro/label/<id>`, painel derivado | E2E dos 2 temas; axe; zero terceiros | produtos |
| S07 🔎 | Institucional, `/pulse`, `/cloud` | copy só da tese de mar/2026 e fatos confirmados; logo com hash do oficial (L-0028) | E2E verde; texto só de fatos confirmados | tagline inventada |
| S08 🔎 | `/pedro/entrevistas` | subpágina de `/pedro` com todas as entrevistas e imagem (material em `D:/videos`, só leitura; direitos liberados) | contagem = entrevistas do material; imagens ≤ 80 KB; página ≤ 400 KB gz | nomes de entrevistadores |
| S09 🔎 | Apresentação (R3) + avatar pop-up | página rolável, vídeo `preload="none"` com cartaz, ícones de contato SVG, avatar pop-up expansível | rota ≤ 150 KB sem vídeo; 0 byte de vídeo antes do toque; o vídeo vem do roteiro gerado pelo prompt | embed de terceiros |
| S10 🔎 | Cartão de visita (R4) PWA | rota escondida (sem link, `noindex`, fora do sitemap; pode estar no repo público), manifest, SW só do cartão, `wa.me`, share de arquivos, QR estático gerado em build (lib verificada no registro; o Cloud usa `uqr`), offline opcional (backlog se complicado) | testes de número, `canShare`, instalação e decodificação do QR; número não é gravado; JS ≤ 20 KB gz | NFC, iOS |
| S11 ✅ | Endurecimento | nginx não-root com log JSON, orçamentos de JS e peso no CI, E2E igual ao CI (L-0025) | `verify` + E2E verdes no CI | deploy |
| S12 🚦 | Deploy (só com pedido) | rota Traefik, DNS pelo Pedro, workflow parado no approval (L-0027), inventários de auditoria; **revisão visual do Pedro em lote antes** | site no ar + smoke test; instalação do PWA em HTTPS real | aprovar o deploy pelo Pedro |
| S12b | Feed #080 + Stack visível | corpo da #080 com o relato de 18/11 (sem números de pulsos); `/pedro/stack` com todas as ferramentas do catálogo e link "Stack (N)" no `/pedro` | Vitest + E2E novos verdes; canários reprovam; peso dentro do orçamento | mudar entrada existente além da #080 (e #081 se contraditória); mexer em E2E existente |
| S12c 🐞 | Voltar intermitente | reproduzir com E2E o relato do Pedro "o voltar às vezes não funciona" antes de corrigir | E2E que reproduz fica verde | mudar o comportamento do Voltar sem reproduzir |
| S12d | Mídia no portfólio | página por item `/pedro/pr/NNN` com imagens (prints dos fluxos do n8n, saneados: sem URL de webhook, credencial, e-mail, cliente ou número) e vídeos (teasers de 60 s da série de entrevistas reencodados 720p, `preload="none"`, capa e legenda); ADR 005 do armazenamento de mídia (no repo com teto testado ~8 MB/vídeo e ~40 MB no total; pasta fora do git na VPS se crescer; embed de terceiros descartado) | imagens ≤ 80 KB revisadas uma a uma pelo orquestrador; vídeo 0 byte antes do toque; tetos de mídia no teste | JSON de fluxo n8n; entrevista completa no repo (só link público); avatar de IA sem selo |
| S12e | Logo canário + versão no rodapé | logo das páginas em amarelo (pastilha grafite no claro, `--logo-fundo`); `vX.Y.Z` clicável no rodapé (fonte: `package.json`) abrindo `/versoes` (histórico lido do CHANGELOG no build); passo no `publicar.yml` que barra tag != versão | `verify` e E2E verdes; canários reprovam; `/cartao/` sem rodapé | mudar teste existente (pendente: 2 expectativas de cor em `e2e/fundacoes.e2e.ts`, decisão do Pedro) |
| S13 | Variante iOS | só depois do Android pronto; instruções de instalação (sem `beforeinstallprompt`) | aprovação do Pedro | antes do Android fechar |

> 🚦 = portão bloqueante (só a S12). 🔎 = revisão visual do Pedro **em lote antes do deploy** (ele pediu para finalizar tudo e revisar depois); não bloqueia a sessão seguinte.

## Aprimoramento A1

Decidido: ver `docs/adr/003-navegacao-app-pwa-e-tema-pulso.md` (Aceito) e o brief `docs/execucao/brief-app.md`.

## Modelo do prompt de handoff

```text
Sessão SNN de 13 — <título> (plano "ailow-index").
Plano: D:/apps/ailow-index/docs/execucao/plano.md · Diário: D:/apps/ailow-index/docs/execucao/diario/ATUAL.md
Abra em camadas (NÃO leia o plano de origem inteiro): Contrato + linha da SNN + Estado de
retomada, e a última entrada do diário. Leia o resto só se precisar.
Skills/regras desta sessão: execucao-em-sessoes, <outras>.
Escopo: <da tabela>.
Pronto quando: <da tabela>.
Não fazer: <da tabela>.
Ao terminar: diário curto + poda + Estado de retomada; entregue o prompt da SNN+1 (ou portão).
```

### Estado de retomada

- **Data:** 2026-11-19 · **Última sessão:** S12e (subagente Sonnet 5.5: logo amarela, versão `v1.2.0` no rodapé, `/versoes`, trava tag = versão; 322 Vitest; E2E 432 verdes + 2 falhas em `e2e/fundacoes.e2e.ts` que esperam a logo ciano: decisão do Pedro/orquestrador trocar as 2 cores para `rgb(255, 196, 0)`; ao publicar, tag `v1.2.0`). Antes: S12c (subagente Sonnet 5.5, em PR: seta sem laço, toque duplo e dialog do avatar com o Voltar; 398 E2E). Antes: S12b: #080 com o relato de 18/11 e `/pedro/stack` (todas as 88 ferramentas do catálogo) + link "Stack (88)" no `/pedro`; 292 testes Vitest, 376 E2E. **Estado do deploy:** a v1.0.0 está publicada no GHCR; o `Deploy` run 44429035808 espera o approval do Pedro no Environment `producao` (L-0027; não aprovar pelo agente). O DNS do apex e do `www` está montado no Registro.br e ainda não publicado. **Próxima: S12d (mídia: imagens do n8n e teasers, pedido do Pedro em 18/11); depois S13 (variante iOS), só depois do Android fechado.** Material do cartão (`material: []`) aguarda o PDF do Pedro. Depois do deploy: conferir o `beforeinstallprompt` do `/cartao/` em HTTPS real e registrar tempos nos runbooks. Execução: um subagente Sonnet por sessão, uma por vez, orquestrado pelo Opus.
- **Git:** `main` em `df5c34c` (S10 mergeada no PR #17); a S11 vive em PR aberto pelo orquestrador. Só a branch `main`; forks privados. O orquestrador torna o check `e2e` obrigatório no ruleset 27518794 (feito fora do PR). Remoto `ailowio/ailow-index` (público); `main` protegida por ruleset (checks `verify`, `seguranca-sca`, `seguranca-sast`, `seguranca-segredos`, mais `e2e`; o novo `imagem` fica a critério do orquestrador); secret scanning, push protection, Dependabot e private vulnerability reporting ligados. Mudança só por PR.
- **Ambiente:** Node 22.23.5 · Astro 7.4.12 · TypeScript 6.0.3 · `@types/node` 22 · gitleaks 8.30.1 local (winget). Exceção EX-02 (picomatch sem correção) em `docs/excecoes.md`. Feed: 82 entradas, 81 confirmadas (1 `fora`).
- **Pendências do Pedro:**
  - ligar MFA no GitHub e no Registro.br (no fim);
  - publicar o DNS e, só depois, aprovar o deploy (run 44429035808);
  - revisão visual em lote;
  - dizer onde o Voltar falhou (página, celular ou PC, seta ou gesto) se a S12c não reproduzir;
  - rodar o prompt do pitch em `D:/videos` e gravar o vídeo;
  - lista bloqueada local: nada a bloquear por enquanto (Pedro, 2026-11-18); o mecanismo fica.
- **Pendências do feed (decisão do Pedro):** uso de Cloudflare (sem evidência; só no catálogo); hospedagem do Outline e do Jessica; Meta Graph API, Claude API, OpenAI API, Codex, C6 Developers, servidor de e-mail próprio e Google Calendar estão no catálogo sem entrada que os use.
- **Pendências abertas:** `CHANGELOG.md` do sgi-copel com ano errado em v1.0.0/v1.1.0 (decisão do Pedro: não corrigir; no SGI só leitura).
