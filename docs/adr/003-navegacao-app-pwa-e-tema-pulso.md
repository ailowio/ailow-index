# ADR 003: Navegação "Ailow como app", PWA só no cartão e tema Pulso em todo o site

- **Status:** proposto (aguarda decisão do Pedro; nada aqui está aceito, exceto o que a seção "Já decidido" marca)
- **Data:** 2026-11-18
- **Decisores:** Pedro (dono do produto); proposta preparada pelo agente (S03b)
- **Tier do app:** A (continua A enquanto nada gravar dado de terceiro; o número digitado no cartão vai direto ao `wa.me` e não é guardado)
- **Regras do harness relacionadas:** ARQ-08/09, UXM-01/02/03/08/10/11, PERF (orçamento), SEC-05, TEST-01, CI-01, DOC-02
- **Brief e evidências:** `docs/execucao/brief-app.md` (hipóteses H1–H5 contra a documentação oficial)

## Contexto

O Aprimoramento A1 pede que `ailow.com.br` abra como a tela inicial de um celular (ícones = Pulse, Cloud, portfólio,
institucional, entrevistas, contatos), com uma página de apresentação (QR, vídeo de pitch) e um cartão de visita
escondido e instalável. O ADR 001 fixou Astro estático, ≤ 10 KB gzip de JS por página e zero requisição a terceiros.
O ADR 002 fixou o feed de PRs, válido em qualquer alternativa.

Forças: uma pessoa mantém o site; o repositório é público; público-alvo com pouca afinidade tecnológica (UXM);
o Android vem primeiro; o hospedeiro é nginx estático (S06/S07).

### Já decidido pelo Pedro (2026-11-18, não reabrir)

- O site **inteiro** usa o design system **Pulso**; o DS do Cloud não muda e não entra no site. Revoga "/pedro Pulso, resto Ailow" e dissolve o conflito do `/pedro` com a UXM-08.
- Marca pública **Ailow** (ADR 001). NFC fora do escopo. Android primeiro; iOS só depois do Android pronto.
- Entrevistas: todas entram, com imagem. Vídeo de pitch gravado pelo Pedro.

## Atributos de qualidade afetados

| Atributo | Meta proposta (a calibrar no primeiro build) | Efeito desta decisão |
|---|---|---|
| JS por rota | ≤ 10 KB gzip (cartão ≤ 20 KB) | exige transição nativa em vez de roteador |
| Peso por rota (sem fontes e sem vídeo) | home ≤ 60 KB, apresentação ≤ 150 KB, cartão ≤ 100 KB, entrevistas ≤ 400 KB (gzip) | gate de CI novo |
| LCP | ≤ 2,5 s em celular simulado | depende do vídeo não carregar sozinho |
| Layout 360 px e 1280 px, 2 temas | sem scroll horizontal | medido por E2E |
| Acessibilidade | axe sem serious/critical | o tema claro derivado do Pulso é o risco |
| Requisições a terceiros | 0 | elimina embed de vídeo e ícones remotos |
| Toques até a ação | ≤ 1 ícone→conteúdo; ≤ 2 do cartão ao WhatsApp (sem a digitação) | define o tipo de navegação |

## Decisões (separadas)

### D1 — Navegação (a escolha principal)

Alternativas:

| | A. App-shell em tudo (SPA com roteador de cliente, `<ClientRouter />`) | B. App-shell só na home; demais páginas são páginas normais com `@view-transition` nativo | C. Site comum; uma única página "app" |
|---|---|---|---|
| Sensação de app | máxima (transições contínuas, estado persistente) | alta na home, boa nas transições (sem estado persistente) | baixa fora da página-app |
| JS | roteador no cliente em toda página; peso **não medido** (a doc do Astro diz que é preciso reinicializar scripts) | zero para a transição (CSS) | zero a baixo |
| Cabe em 10 KB gz | provavelmente não garante; medir | sim | sim |
| Voltar do Android (UXM-03) | tratado pelo roteador | histórico normal do navegador (na raiz o Voltar sai; ver exceção) | histórico normal |
| Suporte | roteador funciona onde há JS | Chrome 126+, Safari 18.2; Firefox sem animação, navegação normal | irrelevante |
| Custo/risco | alto: ADR 001 reaberto, estado, a11y de foco entre rotas | médio: tokens e grade de ícones | baixo |
| Aderência ao pedido R1 ("tela inicial de um celular") | total | **a home é o app**; o resto é conteúdo | só uma rota |

**Recomendação: B.** Entrega o pedido R1 (home como tela de celular), mantém o orçamento do ADR 001 e não reabre a stack.
**Contraponto:** B não tem estado persistente nem "janelas" entre ícones; se o Pedro quer a sensação de app dentro de cada
"app", só A entrega, ao custo de JS e de testes. C é a mais barata e a mais fraca para R1. A decisão é do Pedro.

Exceções locais registradas junto com a decisão (protocolo §7; revisão em 2026-12-18):
- UXM-01: a apresentação (R3) e o feed do `/pedro` rolam (pedido do Pedro). Home e rotas de app seguem em `100dvh`.
- UXM-03: na raiz, o Voltar do navegador sai do site (sem armadilha de `pushState`); nas demais páginas o histórico normal retrocede. Decisão do Pedro.
- UXM-08 (parte "derivada da cor do A da logo, dark em cinza chumbo"): substituída pela paleta do Pulso (D5).

### D2 — Vídeo de pitch

| | Auto-hospedado (`<video>` + arquivo no nginx) | Embed de plataforma | Facade (imagem; carrega o player após o toque) |
|---|---|---|---|
| Zero terceiros | sim | **não** (requisição a terceiro no carregamento) | sim até o toque; depois, terceiro |
| Peso | alvo ≤ 8 MB/60 s (estimativa, não medida) servido só após o toque | quem paga é a plataforma | cartaz leve; player de terceiro depois |
| Controle/privacidade | total | cookies e rastreio de terceiro | parcial |
| Custo | banda da VPS (cada play ≈ tamanho do arquivo) | zero | zero, mas viola o critério após o toque |

**Recomendação: auto-hospedado**, `preload="none"`, cartaz em imagem, MP4 H.264 720p vertical, legenda `.vtt`. Banda: com 1.000 plays
de 8 MB seriam ~8 GB (conta de multiplicação sobre a estimativa; medir com o arquivo real). **Contraponto:** se o vídeo
viralizar, a VPS paga a banda; fallback é mudar para embed por novo ADR (o critério "zero terceiros" é do Pedro, não do harness).
Hospedar o vídeo atrás de uma CDN própria é opção futura, fora do escopo.

### D3 — Orçamento de JS e de peso por rota

O plano diz ≤ 10 KB gzip por página. **O A1 cabe** com B, porque:
- a transição entre páginas é CSS (`@view-transition`), 0 KB de JS;
- alternância de tema: script inline ≤ 1 KB;
- grade de ícones, rotas de conteúdo, entrevistas e a apresentação não precisam de JS além do botão do vídeo (≈ 1 KB, estimativa).

**O que muda:** (1) o **cartão** passa de 10 KB: normalização do número, `wa.me`, `navigator.share`/`canShare`, registro do service worker
e gancho de instalação ≈ ≤ 20 KB gzip (estimativa a medir; proponho teto de 20 KB só nessa rota); (2) entra um **orçamento de peso por rota** (tabela de
atributos acima) além do de JS; (3) a medição vira script de CI sobre o `dist/` (S06/S10), com canário que reprova ao estourar. Se o Pedro escolher A,
o teto de JS sobe (valor a medir com o roteador real, **não verificado**) e o ADR 001 precisa de revisão.

### D4 — PWA: manifest e service worker

| | Site todo | Só o cartão |
|---|---|---|
| Manifest e SW | `scope: /` | `scope: /<rota-do-cartao>/` |
| Instalação | o visitante comum vê o convite | só quem abre o cartão |
| Risco de cache | SW de escopo amplo pode servir páginas velhas do changelog | contido |
| Custo | alto (estratégia de cache do site inteiro) | baixo |

**Recomendação: só o cartão.** O SW fica no diretório do cartão (a doc diz que o escopo padrão é o diretório do worker; ampliar exige
`Service-Worker-Allowed`), com cache apenas da própria página e dos ativos. Fora do `scope` o navegador não bloqueia a navegação, mas
mostra a barra de URL (MDN): aceitável, pois o cartão leva ao site. **Contraponto:** com escopo do cartão, o site em si não é instalável
nem funciona offline; se o Pedro quiser "instalar a Ailow", o escopo sobe para `/`, com política de cache e invalidação por versão.
O service worker não é requisito de instalação na doc consultada (MDN), mas o offline é útil em evento com sinal ruim; o Pedro decide se
entra (pergunta abaixo). HTTPS é exigido (a instalação real só após a S07; `localhost` vale para o teste).

### D5 — Tema Pulso no site todo (decidido pelo Pedro; este ADR só registra o custo)

- **Fato:** o README do Pulso diz que ele "Não é um DS de produto: não existe tela, botão nem navegação aqui"; os tokens vêm em px de canvas de vídeo 1080×1920 e só há paleta escura (`grafite`) mais `estudio` (papel claro).
- **Consequência:** a S04 deriva **tokens de produto** (espaçamento e tipografia em rem; botão, ícone de app, foco, estados; tema claro baseado em `estudio` e `tinta`), com testes de contraste. O próprio DS marca `amarelo` sobre `estudio` = 1,4:1 e `linha` = 2,3:1: esses pares não servem para texto. Fontes do Pulso (Barlow, Barlow Condensed, JetBrains Mono) auto-hospedadas, OFL conferida na S04.
- **Risco:** a marca Ailow (logo) convive com a paleta Pulso; a relação entre as duas (logo sobre grafite? versão para fundo claro?) é decisão do Pedro. Marca pública continua Ailow.
- **Verificação:** E2E de contraste (axe) nos 2 temas; canário com par de cores reprovado.

### D6 — Alternância de tema claro/escuro

Recomendo: padrão por `prefers-color-scheme`, botão no topo (1 toque) que grava a escolha em `localStorage` (try/catch; a página funciona sem), script inline ≤ 1 KB no `<head>` para evitar flash.
**Alternativa:** só escuro (a natureza do Pulso), sem toggle: menos custo, mas o plano e a UXM-11 pedem os 2 temas e o Pedro pediu o seletor.
**Contraponto:** o tema claro é derivado, não é do Pulso (D5): pode parecer "outra marca"; precisa de revisão visual do Pedro.

## Decisão

**Proposta (não aceita):** D1 = B; D2 = auto-hospedado; D3 = orçamento por rota como acima; D4 = PWA só no cartão; D5 = tema Pulso com tokens de produto derivados (decidido pelo Pedro); D6 = padrão do sistema + botão. Android primeiro; variante iOS e seletor de estilo ficam para depois.

## Alternativas consideradas

Ver D1 (A, B, C), D2, D4 e D6 acima; cada uma traz prós, contras e custo.

## Consequências

- **Positivas:** home com cara de app sem reabrir a stack; JS ≈ 0 na maior parte das rotas; zero terceiros; instalação do cartão no Android.
- **Negativas / custo:** tokens de produto e tema claro a criar (S04); gate de peso novo; sem estado persistente entre ícones; Voltar sai na raiz (exceção); Firefox sem animação entre páginas.
- **Riscos e mitigação:**
  - Rota do cartão no repositório público: "escondida" é obscuridade. Mitigação: `noindex`, fora do sitemap e sem link; sem segredo no cartão. Alternativa: rota vinda de variável do CI (contraria "o site não usa variáveis"; decisão do Pedro).
  - SW com cache velho: escopo só do cartão e versão de cache no nome.
  - Vídeo pesado: `preload="none"`, medir o arquivo real.
  - Direitos das imagens das entrevistas: não verificado; perguntar ao Pedro.
- **Como saberemos que deu certo:** E2E (360 px e 1280 px, 2 temas) sem scroll horizontal, axe limpo, 0 requisição externa; script de peso por rota verde, com canário que reprova; teste de que o número digitado não é gravado; decodificação do QR; 3 entrevistas listadas.
- **Revisão em:** 2026-12-18 (junto com a EX-02 e as exceções acima) ou ao medir o primeiro build.

## Perguntas para o Pedro

1. Alternativa de navegação: A, B (recomendada) ou C?
2. A relação logo Ailow × paleta Pulso (logo sobre grafite; versão para fundo claro?). Posso derivar o tema claro do `estudio`?
3. "Material" para Android conflita com Pulso em tudo: ficamos com Pulso + alvos de toque e voltar nativos, sem imitar Material?
4. Voltar na raiz sair do site é aceitável (exceção à UXM-03)?
5. Rota do cartão pode estar no repositório público (obscuridade), ou vem de variável privada do CI?
6. O cartão precisa funcionar offline (service worker)? O escopo é só o cartão?
7. O avatar pop-up da apresentação entra agora ou depois?
8. As imagens das entrevistas são material seu (gravação, foto) ou capturas de emissora? Pode mostrar?
9. O teto de 20 KB de JS só no cartão e os números de peso por rota estão bons como ponto de partida?
10. Gerador de QR: aceita uma dependência nova (verificada na hora) ou prefere o QR gerado uma vez fora do projeto e guardado como SVG?

## Proposta de sessões S04+ (não altera a tabela do plano)

Pressupõe D1 = B. S03 (curadoria, parte 2) segue em paralelo e antes do `/pedro` publicar conteúdo.

| Sessão | Título | Escopo | Pronto quando | Não fazer |
|---|---|---|---|---|
| S04 | Fundações: Pulso de produto | tokens do Pulso em rem + tema claro derivado (testes de contraste), fontes auto-hospedadas (OFL), layout base, botão de tema, Playwright + axe, script de peso por rota, `@view-transition` | E2E: sem scroll horizontal 360/1280 nos 2 temas; axe limpo; 0 requisição externa; canário de contraste e de peso reprovam | páginas de conteúdo, vídeo, PWA |
| S05 🚦 | Home como app | grade de 6 ícones, estados de toque, transição nativa entre páginas | home sem scroll de página em 360×640; 1 toque ícone→conteúdo; JS ≤ 10 KB; aprovação visual do Pedro | rotas internas completas |
| S06 | `/pedro` (feed) no Pulso | bloco "antes do primeiro commit", feed de PRs, `/pedro/label/<id>`, painel derivado | E2E dos 2 temas; axe; zero terceiros | produtos |
| S07 🚦 | Institucional, `/pulse`, `/cloud` | copy só da tese de mar/2026 e fatos confirmados; logo com hash do oficial (L-0028) | E2E + texto aprovado pelo Pedro | tagline inventada |
| S08 🚦 | Entrevistas e procedência | collection das 3 entrevistas com imagem, página de seção | teste de contagem = 3; imagens ≤ 80 KB; direitos confirmados pelo Pedro | nomes de entrevistadores |
| S09 🚦 | Apresentação (R3) | página rolável, vídeo `preload="none"` com cartaz, ícones de contato SVG (placeholders) | rota ≤ 150 KB sem vídeo; 0 byte de vídeo antes do toque; vídeo gravado e aprovado pelo Pedro | embed de terceiros |
| S10 🚦 | Cartão de visita (R4) PWA | rota escondida, manifest, SW do cartão, `wa.me`, share de arquivos, QR com logo (dependência de QR só após decisão) | testes de número, `canShare`, instalação e decodificação do QR; número não é gravado; rota/telefone reais só por placeholder no repo | NFC, rota real e telefone no repo |
| S11 | Endurecimento | nginx não-root com log JSON, orçamentos de JS e peso no CI, E2E igual ao CI (L-0025) | `verify` + E2E verdes no CI | deploy |
| S12 🚦 | Deploy (só com pedido) | rota Traefik, DNS pelo Pedro, workflow parado no approval (L-0027), inventários de auditoria | site no ar + smoke test; teste de instalação do PWA em HTTPS real | aprovar o deploy pelo Pedro |
| S13 🚦 | Variante iOS | só depois do Android pronto; instruções de instalação (sem `beforeinstallprompt`) | aprovação do Pedro | antes do Android fechar |
