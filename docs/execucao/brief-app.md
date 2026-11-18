# Brief — "a Ailow como app" (A1)

Sessão S03b, 2026-11-18. Subagente Sonnet 5.5, orquestrado por Claude Opus 5.5. Status: **rascunho para decisão do Pedro**
(a decisão estrutural está no [ADR 003](../adr/003-navegacao-app-pwa-e-tema-pulso.md), status Proposto).

Regras e IDs: UXM-01/02/03/08/10/11 (`practices/ux-mobile.md`), TEST-01, SEC-05, DOC-02, CI-01. Tier: **A** (nada grava dado de terceiro).

## 1. Decisões do Pedro tomadas como dadas (2026-11-18)

- O site **inteiro** usa o design system **Pulso**. O DS do Cloud não muda e não é usado no site. Isso **revoga** "/pedro Pulso, resto Ailow".
- Marca pública continua **Ailow** (ADR 001; a grafia "ilo" é bloqueada por teste).
- **NFC está fora do escopo.**
- **Android primeiro; iOS só depois do Android pronto.**
- Cartão de visita: saudação do WhatsApp cortês e direta, sem propaganda, sem "entre em contato". O material vai como link, imagem ou PDF.
- O vídeo de pitch não existe; o Pedro grava. Proposta de roteiro: [`roteiro-pitch.md`](roteiro-pitch.md).
- Entrevistas: todas entram e mostram imagem (hoje 3: programa da UFC, 2025-09-05; TV Record, 2025-10-03; TV Verdes Mares, 2026-02-12).

## 2. Hipóteses H1–H5 contra a documentação oficial

Método: `WebFetch` das páginas abaixo em 2026-11-18. Onde a tabela de compatibilidade não veio no texto, a hipótese fica **não verificada** naquele ponto.

| Id | Hipótese | Veredito | Fonte e trecho |
|---|---|---|---|
| H1 | Web NFC grava/lê etiquetas no Chrome Android; sem envio celular→celular | **Fora do escopo (decisão do Pedro).** A doc diz: lê e grava etiquetas, só Android | [Chrome](https://developer.chrome.com/docs/capabilities/nfc): "launched in Chrome 89 for Android". [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API): "experimental technology", "Limited availability". "Android Beam saiu no Android 10": **não verificada** |
| H2a | `wa.me/<número>?text=` abre a conversa com o texto | **Verificada** | [WhatsApp FAQ](https://faq.whatsapp.com/5913398998672934): "wa.me/<number>"; texto "codificada em URL"; número em formato internacional, sem zeros, parênteses ou travessões. Sem número, abre seletor de contato |
| H2b | `wa.me` não anexa arquivo | **Não verificada**: a página não menciona anexos (silêncio não prova ausência; L-0005). Tratar como "não há garantia de anexo" | mesma página |
| H3a | `navigator.share({files})` existe e aceita PDF, imagem, vídeo | **Verificada** (tipos), com condições | [MDN share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share): "must be triggered off a UI event like a button click"; HTTPS; lista inclui `.pdf`, `.png`, `.mp4`. [web.dev](https://web.dev/articles/web-share): "Certain types of audio, image, pdf, video... can be shared" |
| H3b | Suporte a arquivos no Chrome Android × Safari iOS | **Parcial.** `canShare` existe no Chrome Android (listado 157) e no Safari iOS (14+) segundo o [caniuse](https://caniuse.com/mdn-api_navigator_canshare). Suporte a `files` por versão **não verificado** (a tabela do MDN não veio; o web.dev não separa Android/iOS). Padrão obrigatório: `canShare({files})` antes de `share` | MDN: canShare retorna falso se "the implementation does not support file sharing" |
| H3c | A pessoa escolhe o contato dentro do WhatsApp | **Não verificada** (comportamento do sistema operacional, fora da doc web) | — |
| H4 | Vídeo auto-hospedado × embed | **Não é questão de doc**: é critério do projeto (zero terceiros, CLAUDE.md). Peso real só se mede depois da gravação | ADR 003, D2 |
| H5a | PWA instalável no Chrome: manifest + HTTPS | **Verificada.** `name` ou `short_name`, `start_url`, `display`, ícones 192 e 512 px, HTTPS | [MDN installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable); [web.dev](https://web.dev/articles/install-criteria): "Be served over HTTPS" |
| H5b | PWA exige service worker | **Refutada pela doc consultada**: "While not a requirement for a PWA to be installable, many PWAs use service workers" (MDN). Não verificado se o Chrome Android de hoje mantém isso na prática; testar no S10 | MDN |
| H5c | iOS instala PWA | **Verificada** só em parte: iOS 16.4+ instala pelo menu Compartilhar de vários navegadores; `beforeinstallprompt` "not supported on iOS". Logo, no iOS só instruções, sem botão "Instalar" | MDN installable |
| H5d | Escopo do service worker e do manifest | **Verificada.** SW: "default scope ... is the directory where the worker is located"; ampliar exige `Service-Worker-Allowed`. Manifest: navegar fora do `scope` "not blocked", mostra barra de URL | [MDN SW](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers); [MDN scope](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope). SW exige HTTPS; `localhost` vale (S07 só depois, mas dá para testar local) |
| V | View Transitions entre páginas (MPA), CSS `@view-transition` | **Verificada** | [Chrome](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document): "supported in Chrome from Chrome 126"; Safari 18.2 listado como suportado; Firefox "not supported"; só mesma origem. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition): `navigation: auto` nos dois documentos. Plataforma (Android × desktop) não separada na página. Sem suporte, a navegação segue normal (degradação) |
| V2 | Astro | **Verificada.** `<ClientRouter />` "can turn your multi-page app into a single-page app" e exige reinicializar scripts; a transição nativa "simply add animations"; com reduced motion as animações são desligadas | [Astro](https://docs.astro.build/en/guides/view-transitions/). Peso em KB do ClientRouter: **não verificado** (medir antes de adotar) |

## 3. Requisitos como histórias, com critério mensurável

Convenções de medição (E2E Playwright, 360×640, e 1280×800 para desktop; os dois temas): `scrollWidth <= clientWidth`; axe sem `serious`/`critical`; peso por rota medido sobre o `dist/` em gzip (script de CI, a criar); contagem de requisições externas = 0. Os números abaixo são **propostas** a calibrar no primeiro build (o ADR 003 D3 explica); alterar um critério depois exige decisão do Pedro (L-0017).

### R1 — Home como tela de celular
*Como visitante, quero abrir ailow.com.br numa tela de celular com ícones, para descobrir a Ailow tocando.*
- 6 ícones (Pulse, Cloud, portfólio, institucional, entrevistas, contatos) em grade de 3 colunas (UXM-10); **sem scroll de página** em 360×640 (UXM-01).
- Toques da home até o conteúdo de qualquer ícone: **1**. Voltar à home: **1** (botão Voltar do navegador ou ícone).
- LCP da home ≤ 2,5 s em perfil de celular simulado (limiar "bom" do Core Web Vitals; **não verificado** nesta sessão).
- Peso da home (HTML+CSS+JS+imagens críticas, sem fontes e sem vídeo) ≤ 60 KB gzip; JS ≤ 10 KB gzip.
- Transição entre páginas por `@view-transition` nativo; com `prefers-reduced-motion` fica sem animação (teste lê o computed style).
- Sem scroll horizontal 360 px nos 2 temas; axe limpo; 0 requisição externa.
- Viável hoje: sim, sem JS de roteador. Não viável como "app" verdadeiro: sem janelas sobrepostas ou estado persistente entre ícones (isso exigiria SPA).

### R2 — Plataforma e tema
*Como visitante Android, quero uma experiência afinada ao meu aparelho e escolher claro ou escuro.*
- **Android primeiro.** A variante iOS e o "seletor de estilo" ficam fora até o Android estar pronto (decisão do Pedro).
- Seletor de tema claro/escuro no topo: **1 toque** troca; a escolha persiste (localStorage com try/catch) e o padrão segue `prefers-color-scheme`; sem flash de tema errado (script inline ≤ 1 KB, medido).
- Os dois temas passam no contraste (axe) em todas as rotas. Risco: o Pulso só define o tema escuro; o claro será derivado (ADR 003 D5).
- "Material" como estilo visual **conflita** com "Pulso em tudo": proponho que a variante Android seja o Pulso com comportamentos nativos (tamanho de toque ≥ 48 px, voltar do sistema), sem imitar Material. Pergunta ao Pedro.
- Viável: sim. iOS depois: viável com ressalvas (instalação só por instruções; H5c).

### R3 — Página de apresentação (destino do QR)
*Como pessoa que leu o QR, quero ver quem é o Pedro e o que ele faz, com vídeo, rolando a página.*
- Mobile first, também em 1280 px; **rolagem liberada** nesta rota (exceção explícita à UXM-01, pedida pelo Pedro; registrada no ADR 003).
- O vídeo **não carrega sozinho**: `preload="none"` com cartaz; a requisição do arquivo de vídeo só ocorre após o toque (teste: 0 bytes de vídeo antes do toque).
- Peso da rota sem vídeo ≤ 150 KB gzip; JS ≤ 10 KB gzip; LCP ≤ 2,5 s.
- Ícones de contato (Instagram, telefone, sites) são **SVG embutido**, sem biblioteca de ícones e sem requisição externa; links com ≥ 48 px de alvo. Telefone e links reais só entram com ok do Pedro (placeholders até lá).
- Avatar em segundo plano/pop-up expansível: **adiar** (decisão do Pedro se entra; custo de JS e de acessibilidade do diálogo). Alternativa honesta: imagem estática.
- Viável: sim. O vídeo depende da gravação do Pedro (roteiro proposto).

### R4 — Cartão de visita (rota escondida, instalável)
*Como Pedro, quero um cartão no meu celular que, com o número do contato, abre o WhatsApp com a saudação pronta e me deixa mandar o material.*
- Rota: `/<rota-do-cartao>/` (placeholder; ver risco abaixo). `noindex`, fora do sitemap, sem link a partir de nenhuma página.
- **QR estilizado com o logo:** SVG gerado no build (0 JS em execução). Critério: o QR decodifica para a URL esperada num leitor real (teste de decodificação no E2E). Gerar o QR pede um gerador; dependência nova só depois de verificar versão e licença (decisão 🚦).
- **Instalar como PWA no Android:** manifest com `name`, `start_url`, `display: standalone`, ícones 192 e 512 px; E2E verifica o manifest e que o Chrome dispara `beforeinstallprompt` (em ambiente sem HTTPS real o teste usa `localhost`). Escopo proposto: só a rota do cartão (ADR 003 D4).
- **(b) WhatsApp:** campo numérico; ao tocar "Enviar", abre `https://wa.me/<número>?text=<saudação codificada>`. Critérios: de abrir o app até o WhatsApp aberto, **≤ 2 toques fora a digitação** (focar o campo e enviar); número normalizado para o formato internacional (testes unitários: com `+`, espaços, parênteses, traços, `0` inicial; número inválido mostra aviso sem navegar); o número **não é gravado** (teste: nada em localStorage/IndexedDB/cookies após o envio) e **não vai a terceiros** além do `wa.me` do próprio clique. Saudação (rascunho, o Pedro aprova): "Muito prazer, meu nome é Pedro. Segue meu trabalho abaixo; fico à disposição. <link>". Sem "entre em contato".
- **(c) Material:** viável **em dois caminhos separados**, e não em um só gesto:
  1. texto com **link** da apresentação pelo `wa.me` (determinístico, vai para o número digitado);
  2. botão "Compartilhar PDF/imagem/vídeo" com `navigator.share({files})` (precisa de gesto do usuário e HTTPS; a escolha do contato acontece na folha de compartilhamento, não no número digitado; H3c não verificada). O botão só aparece se `navigator.canShare({files})` for verdadeiro; senão mostra o link. Critério: E2E com `canShare` simulado nos dois ramos.
  - Número digitado + anexo no mesmo toque: **não há garantia na doc consultada** (H2b). Não prometer.
- **(a) NFC:** fora do escopo.
- Peso da rota ≤ 100 KB gzip sem o material; JS ≤ 20 KB gzip (único ponto acima de 10 KB; justificativa no ADR 003 D3).
- Viável: sim, exceto o anexo no mesmo gesto. **Risco:** o repositório é público; a rota do cartão aparece no código-fonte. "Escondida" aqui é obscuridade, não segurança (não há segredo no cartão). Para que a rota nem esteja no repositório, ela viria de uma variável do CI (muda o CLAUDE.md, que diz que o site não usa variáveis). Pergunta ao Pedro (ADR 003, perguntas).

### R5 — Entrevistas e procedência
*Como visitante, quero ver as entrevistas como prova do trabalho.*
- 3 entrevistas hoje (UFC, 2025-09-05; Record, 2025-10-03; Verdes Mares, 2026-02-12), cada uma com **imagem**. A seção é requisito; entra como ícone da home.
- Dado em collection com schema (data `AAAA-MM-DD`, veículo, título, imagem com `alt`, link público opcional). Teste de contagem: a seção lista todas as entradas `confirmado` (3 hoje).
- Imagens auto-hospedadas, ≤ 80 KB cada em WebP/AVIF (a ferramenta de conversão não está no projeto: verificar antes de adicionar dependência), com `width`/`height` (sem deslocamento de layout). Peso da rota ≤ 400 KB com as 3 imagens.
- Sem nomes de entrevistadores. Direitos de uso das imagens (quadro da emissora × material do Pedro): **não verificado** (pergunta ao Pedro).
- Viável: sim.

## 4. O que não é viável hoje (resumo honesto)

- Envio celular→celular por NFC: fora do escopo; o Web NFC só lê/grava etiquetas e só no Chrome Android (H1).
- Número digitado + anexo no mesmo gesto pelo WhatsApp: sem garantia (H2b).
- Botão "Instalar" no iOS: não há `beforeinstallprompt`; só instruções (H5c).
- `@view-transition` em Firefox: não suporta; a navegação funciona sem animação.
- "Janelas" de app com estado entre ícones sem roteador de cliente: exigiria SPA (alternativa A do ADR 003).
- UXM-03 ("Voltar nunca sai do app", na raiz permanece): num site de várias páginas o Voltar segue o histórico; "ficar na raiz" só se obtém com armadilha de histórico (`pushState`), que é anti-padrão e não foi verificada em doc. Proposta: declarar exceção local (protocolo §7) para a raiz. Decisão do Pedro.

## 5. Conflitos com o harness (registro)

- **UXM-08 (paleta única, derivada do "A" da logo, dark em cinza chumbo):** a decisão "Pulso em todo o site" dá paleta única (o conflito com o `/pedro` some), mas o Pulso é grafite com acento amarelo, não derivada do "A" da logo Ailow. Registrar exceção local à parte "derivada da logo" no ADR 003 (protocolo §7: regra, motivo, risco, data de revisão).
- **UXM-01:** vale na home e nas rotas de app; a apresentação (R3) e o feed do `/pedro` rolam (pedido explícito).
- **Pulso não é DS de produto.** O README do DS diz: "Não é um DS de produto: não existe tela, botão nem navegação aqui". Não há tema claro nem componentes de UI. O site precisa de **tokens de produto derivados** (botão, ícone de app, foco, estados), com contraste conferido por teste: o próprio DS avisa `amarelo` sobre `estudio` = 1,4:1 e `linha` = 2,3:1. Isso entra como custo na S04 (ADR 003). Fontes do Pulso: Barlow, Barlow Condensed, JetBrains Mono; licença (OFL) a conferir na S04, como já previsto.
- **Zero terceiros:** ícones sociais e vídeo auto-hospedados/embutidos resolvem; o embed de vídeo não.

## 6. Nova tabela S04+

Está no ADR 003, seção "Proposta de sessões S04+". Não substitui a tabela do plano até o Pedro decidir.
