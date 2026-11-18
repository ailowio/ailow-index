# ADR 003: Navegação "Ailow como app", PWA só no cartão e tema Pulso em todo o site

- **Status:** Aceito (2026-11-18, Pedro)
- **Data:** 2026-11-18
- **Decisores:** Pedro (dono do produto); proposta preparada pelo agente (S03b); aceite registrado na S03c
- **Tier do app:** A (continua A enquanto nada gravar dado de terceiro; o número digitado no cartão vai direto ao `wa.me` e não é guardado)
- **Regras do harness relacionadas:** ARQ-08/09, UXM-01/02/03/08/10/11, PERF (orçamento), SEC-05, TEST-01, CI-01, DOC-02
- **Brief e evidências:** `docs/execucao/brief-app.md` (hipóteses H1–H5 contra a documentação oficial)

## Contexto

O Aprimoramento A1 pede que `ailow.com.br` abra como a tela inicial de um celular (ícones = Pulse, Cloud, portfólio,
institucional, entrevistas, contatos), com uma página de apresentação (QR, vídeo de pitch) e um cartão de visita
escondido e instalável. O ADR 001 fixou Astro estático, ≤ 10 KB gzip de JS por página e zero requisição a terceiros.
O ADR 002 fixou o feed de PRs, válido em qualquer alternativa.

Forças: uma pessoa mantém o site; o repositório é público; público-alvo com pouca afinidade tecnológica (UXM);
o Android vem primeiro; o hospedeiro é nginx estático (S06/S07 originais; hoje S11/S12).

### Já decidido pelo Pedro antes da proposta (2026-11-18)

- O site **inteiro** usa o design system **Pulso**; o DS do Cloud não muda e não entra no site. Revoga "/pedro Pulso, resto Ailow" e dissolve o conflito do `/pedro` com a UXM-08.
- Marca pública **Ailow** (ADR 001). NFC fora do escopo. Android primeiro; iOS só depois do Android pronto.
- Entrevistas: todas entram, com imagem. Vídeo de pitch gravado pelo Pedro.

## Atributos de qualidade afetados

| Atributo | Meta (aprovada; calibrar no primeiro build) | Efeito desta decisão |
|---|---|---|
| JS por rota | ≤ 10 KB gzip (cartão ≤ 20 KB) | exige transição nativa em vez de roteador |
| Peso por rota (sem fontes e sem vídeo) | home ≤ 60 KB, apresentação ≤ 150 KB, cartão ≤ 100 KB, entrevistas ≤ 400 KB (gzip) | gate de CI novo |
| LCP | ≤ 2,5 s em celular simulado | depende do vídeo não carregar sozinho |
| Layout 360 px e 1280 px, 2 temas | sem scroll horizontal | medido por E2E |
| Acessibilidade | axe sem serious/critical | o tema claro derivado do Pulso é o risco |
| Requisições a terceiros | 0 | elimina embed de vídeo e ícones remotos |
| Toques até a ação | ≤ 1 ícone→conteúdo; ≤ 2 do cartão ao WhatsApp (sem a digitação) | define o tipo de navegação |

## Alternativas e contrapontos (histórico da decisão)

### D1 — Navegação

| | A. App-shell em tudo (SPA, `<ClientRouter />`) | B. App-shell só na home; demais páginas normais com `@view-transition` nativo | C. Site comum; uma única página "app" |
|---|---|---|---|
| Sensação de app | máxima (transições contínuas, estado persistente) | alta na home, boa nas transições (sem estado persistente) | baixa fora da página-app |
| JS | roteador no cliente em toda página; peso **não medido** | zero para a transição (CSS) | zero a baixo |
| Cabe em 10 KB gz | provavelmente não garante; medir | sim | sim |
| Voltar do Android | tratado pelo roteador | histórico normal; a raiz exige controle (ver "Decisão", 3) | histórico normal |
| Suporte | onde há JS | Chrome 126+, Safari 18.2; Firefox sem animação, navegação normal | irrelevante |
| Custo/risco | alto: ADR 001 reaberto, estado, a11y de foco entre rotas | médio: tokens e grade de ícones | baixo |
| Aderência a R1 | total | **a home é o app**; o resto é conteúdo | só uma rota |

Contraponto registrado: B não tem estado persistente nem "janelas" entre ícones; só A entrega isso, ao custo de JS e de testes.

### D2 — Vídeo de pitch

| | Auto-hospedado (`<video>` + arquivo no nginx) | Embed de plataforma | Facade (imagem; player após o toque) |
|---|---|---|---|
| Zero terceiros | sim | **não** | sim até o toque; depois, terceiro |
| Peso | alvo ≤ 8 MB/60 s (estimativa, não medida), só após o toque | quem paga é a plataforma | cartaz leve; player de terceiro depois |
| Controle/privacidade | total | cookies e rastreio de terceiro | parcial |
| Custo | banda da VPS | zero | zero, mas viola o critério após o toque |

Banda: 1.000 plays de 8 MB ≈ 8 GB (multiplicação sobre a estimativa; medir com o arquivo real). Contraponto: se viralizar, a VPS paga a banda; fallback é embed por novo ADR.

### D3 — Orçamento de JS e de peso por rota

Com B o A1 cabe em ≤ 10 KB: transição é CSS (0 KB); tema é script inline ≤ 1 KB; botão do vídeo ≈ 1 KB (estimativa). O cartão passa disso (número, `wa.me`, `share`/`canShare`, SW, instalação) ≈ ≤ 20 KB (estimativa a medir). Entra orçamento de peso por rota e script de CI sobre o `dist/` com canário. Com A o teto de JS subiria (não verificado) e o ADR 001 seria revisto.

### D4 — PWA

| | Site todo | Só o cartão |
|---|---|---|
| Manifest e SW | `scope: /` | `scope: /<rota-do-cartao>/` |
| Instalação | o visitante comum vê o convite | só quem abre o cartão |
| Risco de cache | SW amplo pode servir changelog velho | contido |
| Custo | alto | baixo |

O escopo padrão do SW é o diretório do worker (ampliar exige `Service-Worker-Allowed`). Fora do `scope` o navegador mostra a barra de URL (MDN). SW não é requisito de instalação na doc consultada; HTTPS é (instalação real só na S12). Contraponto: com escopo do cartão o site em si não é instalável.

### D5 — Tema Pulso no site todo

- **Fato:** o README do Pulso diz que ele "Não é um DS de produto: não existe tela, botão nem navegação aqui"; tokens em px de canvas 1080×1920; só paleta escura (`grafite`) e `estudio` (papel claro).
- **Consequência:** derivar **tokens de produto** (rem; botão, ícone de app, foco, estados; tema claro de `estudio` e `tinta`) com testes de contraste. `amarelo` sobre `estudio` = 1,4:1 e `linha` = 2,3:1 não servem para texto. Fontes (Barlow, Barlow Condensed, JetBrains Mono) auto-hospedadas, OFL conferida.
- **Verificação:** axe nos 2 temas; canário com par de cores reprovado.

### D6 — Tema claro/escuro

Padrão por `prefers-color-scheme`, botão no topo (1 toque) com `localStorage` (try/catch), script inline ≤ 1 KB no `<head>`. Alternativa descartada: só escuro. Contraponto: o claro é derivado e pode parecer "outra marca"; exige revisão visual do Pedro.

## Decisão (aceita em 2026-11-18, registrada fielmente do áudio do Pedro)

1. **D1 = B.** Home como app; demais páginas normais com `@view-transition`. A transição tem de ser "excelentemente bem feita": iterar e testar (E2E e revisão visual).
2. **D2 = auto-hospedado** (`preload="none"`, cartaz, MP4 H.264 720p vertical, legenda `.vtt`); **D3** com orçamentos aprovados (10 KB gz de JS por página; 20 KB no cartão; pesos da tabela); **D4 = PWA só no cartão**; **D5 = tema Pulso**; **D6 = padrão do sistema + botão**.
3. **Logo e tema:** o SVG da logo pode mudar de cor e vai sobre o grafite; o site terá **versões clara e escura** para mostrar o serviço. Tema claro derivado do Pulso: aprovado.
4. **Android:** seguir as mesmas diretrizes de "parecer app" do Ailow Cloud. **O Voltar NUNCA fecha o app**, nem na raiz; só o botão de tela inicial/multitarefa. Isso revoga a exceção UXM-03 proposta: a UXM-03 passa a valer. Referência da implementação futura (não copiar código; adaptar ao site estático): `D:/apps/harness/practices/ux-mobile.md:16` (UXM-03); no Cloud, `D:/apps/ailow-cloud/apps/web/src/componentes/navegacao.tsx:14-45` (`TravaVoltar`: entrada de reserva no 1º gesto, porque o navegador só respeita entradas criadas após gesto; linha 29 empurra a reserva; linha 41 avança de novo se o Voltar pousa na entrada 0), `:69-75` (`useVoltar`) e `:114-137` (modal ligado ao histórico). A seta de Voltar nas páginas internas leva ao pai quando não há passo anterior (link direto).
5. **Rota do cartão** pode ficar no repositório público (até como inspiração); só não aparece na interface: sem link, `noindex`, fora do sitemap.
6. **Offline do cartão:** desejável; se for complicado, vai para o backlog. Escopo do SW: só o cartão.
7. **Avatar pop-up** da apresentação entra agora, na sessão da apresentação.
8. **Entrevistas:** todas entram com imagem; material em `D:/videos` (harness próprio, só leitura). Direitos liberados pelo Pedro. As entrevistas são do **Pedro, não da Ailow**: viram subpágina de `/pedro` (ex.: `/pedro/entrevistas`).
9. **Orçamentos** de 10 KB gz de JS por página e 20 KB no cartão: aprovados.
10. **QR:** estático, aponta para página da própria infraestrutura; geração **em build** (zero JS no cliente). O Ailow Cloud já usa `uqr` 0.1.3 (`D:/apps/ailow-cloud/apps/web/package.json:30`, `apps/api/package.json:32`); a escolha final da lib fica para a sessão do cartão, com versão verificada no registro.
11. **NFC fora.** iOS só depois do Android pronto.
12. **Cargo** no topo de `/pedro`: "Produtos Digitais e Operações".
13. **Pitch:** o repositório guarda um prompt (`docs/execucao/roteiro-pitch.md`) que o Pedro roda no harness de vídeos. **Processo:** o Pedro delegou ao orquestrador o merge dos PRs deste repositório e a deleção de branches, com os 4 checks verdes; subagentes não commitam; deploy/DNS só com pedido, e o deploy para no approval (L-0027).

### Exceções locais (protocolo §7; revisão em 2026-12-18)

- **UXM-01 continua:** a apresentação (R3) e o feed do `/pedro` rolam (pedido do Pedro). Home e rotas de app seguem em `100dvh`.
- **UXM-03: removida.** Passa a valer integralmente (item 4).
- **UXM-08:** a parte "derivada da cor do A da logo, dark em cinza chumbo" é substituída pela paleta do Pulso (D5).

## Consequências

- **Positivas:** home com cara de app sem reabrir a stack; JS ≈ 0 na maior parte das rotas; zero terceiros; instalação do cartão no Android; Voltar coerente com o Cloud.
- **Negativas / custo:** tokens de produto e tema claro a criar; gate de peso novo; sem estado persistente entre ícones; Firefox sem animação entre páginas. **O Voltar não sai mais do site:** isso exige histórico controlado na home e no cartão (entrada de reserva criada no 1º gesto), ou seja, JS mínimo. Estimativa (não medida): ≤ 1 KB gz, dentro dos 10 KB; medir na S05. Risco: armadilha de histórico pode irritar quem quer sair; é a escolha do Pedro, com a mesma ressalva do Cloud (o botão de tela inicial sempre sai).
- **Riscos e mitigação:**
  - Rota do cartão pública no repositório: decidido aceitar; `noindex`, fora do sitemap, sem link, sem segredo no cartão.
  - SW com cache velho: escopo só do cartão e versão de cache no nome.
  - Vídeo pesado: `preload="none"`, medir o arquivo real.
  - Direitos das imagens das entrevistas: **confirmados pelo Pedro** (2026-11-18).
- **Como saberemos que deu certo:** E2E (360 px e 1280 px, 2 temas) sem scroll horizontal, axe limpo, 0 requisição externa; script de peso por rota verde, com canário; E2E de que o Voltar na raiz não sai do site; número digitado não é gravado; decodificação do QR; entrevistas listadas.
- **Revisão em:** 2026-12-18 (junto com a EX-02 e as exceções acima) ou ao medir o primeiro build.

## Respostas do Pedro (2026-11-18)

1. Navegação: **B**, com transição "excelentemente bem feita".
2. Logo pode mudar de cor, sobre grafite; versões clara e escura; tema claro derivado do `estudio`/Pulso: aprovado.
3. Android: mesmas diretrizes de "parecer app" do Cloud (alvos de toque e Voltar nativos), sem imitar Material à risca.
4. Voltar na raiz: **não pode sair**; a UXM-03 vale (a exceção proposta foi recusada).
5. Rota do cartão: pode ficar no repositório público; só não aparece na interface.
6. Offline do cartão: desejável; se complicado, backlog; SW só no cartão.
7. Avatar pop-up: entra agora.
8. Entrevistas: material do Pedro (não da Ailow), direitos liberados; subpágina `/pedro/entrevistas`.
9. Orçamentos (10 KB por página, 20 KB no cartão, pesos por rota): aprovados.
10. QR: estático, gerado em build, lib verificada na sessão do cartão (o Cloud usa `uqr`).

## Sequência de sessões

Vive em `docs/execucao/plano.md` (S03d, S04–S13); este ADR não a duplica.
