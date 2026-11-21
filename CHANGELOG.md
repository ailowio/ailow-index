# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/). Tags publicadas: `v1.0.0` e `v1.1.0` (2026-11-18); `v1.1.1` (2026-11-19).

## [Unreleased]

## [1.12.0] - 2026-11-20

### Adicionado
- V12 (ADR 007 item 5): **`/vem-ai`, o quadro Em uso · Em teste · Construindo · Próximo passo**, com a luz de estado do Pulso em cada coluna (luz acesa, meia luz, fita de obra e luz apagada: cor, padrão e palavra juntos). Sete cartões, cada um com uma frase que começa pelo verbo do estado ("Uso", "Estou testando", "Estou construindo", "O próximo passo é") e a prova no Diário de obra: o Cloud (#078), o Agente de Produção dos teares (#033) e o resumo diário de gestão (#054) em uso; a v1.9 do firmware (#080) e o coletor do Pulse (#076) em teste; a implantação dos sensores (#081) em construção; e a plataforma de monitoramento do Pulse como próximo passo. Em 360 px as colunas viram listas empilhadas, com um painel no topo que leva a cada uma; em tela larga, as 4 ficam lado a lado. Sem JavaScript próprio.
- V12 (ADR 006): o estado de cada cartão vem da própria entrada do Diário de obra; se a entrada mudar, o cartão muda de coluna e o build reprova o verbo antigo. Um teste reprova cartão sem fonte, data futura, prazo, promessa ("em breve", "até dezembro", "lançamento") e preço (com canários).
- V12: links para o Vem aí no Diário de obra e no `/pulse`; a rota entra no sitemap.

## [1.11.1] - 2026-11-20

### Corrigido
- V11 (ADR 002, ADR 006): **correções de conteúdo do Diário de obra a partir da colheita de IoT**, cada uma com a prova citada no campo `prova` da entrada. #063: as 25 entradas e o buffer de cerca de 4 dias são de 2 de setembro (em 31 de agosto eram 17), a v1.8 foi gravada só no gateway 1 e a leitura dos módulos usa o protocolo próprio do fabricante (sem "Modbus"). #056: a v1.6 foi escrita, mas nunca gravada em hardware. #081: a implantação dos sensores está em andamento, em parte das máquinas, com o mapa canal-máquina em conferência (`status_fato: construindo`, estado `open`); o `/pulse` deixa de dizer "todas as máquinas". #080: a conferência formal da v1.9 segue pendente (continua "em validação").

### Adicionado
- V11: duas entradas candidatas, #083 (firmware v1.7 do gateway 2) e #084 (gravação em campo dos dois gateways), com `verificacao: pendente`: não aparecem no site até a curadoria do Pedro. As 81 entradas publicadas seguem iguais, na mesma ordem.

## [1.11.0] - 2026-11-20

### Adicionado
- V09 (ADR 007 item 4): **lente "Para empresários / Para técnicos" no Diário de obra.** Dois botões no topo trocam a mesma entrada entre a leitura técnica (o changelog como sempre foi) e um resumo em frase simples, escrito só com o que a própria entrada diz. Entrada sem resumo mostra, na leitura para empresários, o título sem o prefixo técnico e a prova. A escolha vale só nesta sessão do navegador (sem cookie). Sem JavaScript, a página fica na leitura técnica e o resumo aparece rotulado "Para empresários:" em cada entrada de vitrine.
- V09: **"Os 3 que eu mostraria numa visita"** no topo do Diário de obra: o quadro de comando adequado às NR-10 e NR-12 (#047), os sete módulos do SGI na versão nova (#069) e o Cloud em produção (#078), uma por frente, todas confirmadas e entregues, cada uma com o link para a entrada.
- V09: campo opcional `resumo_dono` nas entradas, preenchido nas 26 entradas que a `/consultoria`, a `/educacao`, o Chão de Fábrica e a `/na-tv` citam. Ele passa pelo mesmo linter de conteúdo do resto (canário: um resumo com endereço IP derruba o build), não traz número que não esteja na entrada e não usa as frases fortes que o campo ainda não confirma.

### Alterado
- V09 (ADR 007 item 3): **o feed do `/pedro` passa a se chamar "Diário de obra"**, com o subtítulo "cada entrega, com data e prova". A URL `/pedro` e o `/pedro/feed.json` não mudam. Título da aba, preview de link, o ícone da home (agora "Diário"), links da `/apresentacao`, do Cloud e do Pulse, e as páginas de frente, de ferramenta e da stack deixam de dizer "portfólio" e "feed". A contagem e a ordem das 81 entradas publicadas não mudam (teste compara com a versão anterior).

## [1.10.0] - 2026-11-20

### Adicionado
- V08 (ADR 007): **`/chao-de-fabrica`, a série Chão de Fábrica episódio por episódio**, presa a um "cabo" vertical com o número de cada episódio num borne amarelo. #1 "Dois quadros na parede" (10 nov 2026) e #2 "O sinal chegou" (11 nov 2026) com os vídeos da série: o vídeo só baixa depois do toque (`preload="none"`, pôster próprio, legenda em português), a fala aparece numa legenda grande abaixo do quadro e cada um avisa "Narração com voz gerada por IA".
- V08: **#3 "Firmware v1.9" como relatório de campo** em texto: sintoma, hipótese, o que era, decisão e estado, só com o que está na entrada #080 do Diário de obra.
- V08 (ADR 006): cada episódio liga às suas entradas do Diário de obra (#081, #062, #076, #080). O que ainda não fechou leva a fita de **"em validação"**: o sensor em cada máquina (#081) e a v1.9 em campo (#080). Um teste reprova as frases fortes que o campo ainda não confirma ("todas as máquinas", "concluída", v1.9 "validada" ou "aprovada", "resolvido") e todo número que não esteja numa entrada citada ou na fala do próprio vídeo (com canário).

### Alterado
- V08: o Diário de obra (`/pedro`) e a `/na-tv` ganham o link para o Chão de Fábrica; `/chao-de-fabrica` entra no sitemap, indexável. A home não muda (a grade segue com 6 apps).
- V08: na `/na-tv` (e no Chão de Fábrica), **a caixa da legenda grande não reserva mais duas linhas vazias antes do play**: mostra só a dica numa linha pequena (de ~68 px para ~36 px) e passa a reservar as duas linhas no primeiro play, para nada pular entre uma fala e outra.

## [1.9.0] - 2026-11-20

### Adicionado
- V07 (ADR 007): **`/na-tv`, a história contada como escada**: a entrevista no programa Experiências Inspiradoras, da UFC (2025), a reportagem da TV Record (2025) e a entrevista na TV Verdes Mares, afiliada Globo (2026), em ordem, cada uma numa tarja de TV no Pulso (chapéu amarelo com o degrau, nome do veículo e data), só com o nome em texto, sem logo de emissora, e com a prova no Diário de obra (#012, #014, #037).
- V07: **os teasers "Improvisar sob pressão" e "A teoria na prática" dentro do degrau da UFC** (as duas falas são dessa conversa). Cada um com **perguntas que levam o player ao segundo em que a resposta começa** (o tempo vem da legenda `.vtt`; funciona no teclado, com foco visível) e uma **legenda grande abaixo do vídeo**. O vídeo só baixa depois do toque (`preload="none"`, pôster próprio) e toca um de cada vez. A Record e a afiliada Globo aparecem sem vídeo.
- V07 (ADR 005): componente próprio de **fachada do YouTube** (pôster, botão e aviso de privacidade; o iframe do `youtube-nocookie` só nasce no toque, até 1 KB de JS). Só aparece quando uma entrevista tiver o id do vídeo; hoje nenhuma tem, então nada aparece.

### Alterado
- V07: **`/pedro/entrevistas` responde 301 para `/na-tv`** (nginx) e sai do sitemap; `/na-tv` entra, indexável. O ícone de entrevista da home passa a se chamar "Na TV" e, como os links do `/pedro` e da `/apresentacao`, aponta para a rota nova.
- V07: o orçamento de peso passa a contar o pôster do vídeo (o `.mp4` e a legenda continuam fora). `/na-tv`: JS 1,09 KiB gzip (orçamento 10), peso 60,7 KiB (orçamento 150).

## [1.8.0] - 2026-11-20

### Adicionado
- V06 (ADR 005 e 008): **a `/apresentacao` (e a `/bio`) ganha o vídeo "O que eu faço?"**, no slot que já existia. O vídeo só começa a baixar depois do toque (`preload="none"`, pôster próprio, legenda em português); a página avisa que parte da imagem e da voz é gerada por IA. E2E conta as requisições: 0 de vídeo antes do toque, e o toque carrega o `.mp4` do próprio site.
- V06: **5 pacotes da bancada importados** com `npm run importar-midia` para `public/midia/<slug>/`, cada um em 720p (H.264 + AAC, até 60 s e 8 MB), com pôster WebP (até 80 KB) e legenda `.vtt`: os teasers das entrevistas P1 e P2, o Fixado 00 e os episódios #1 e #2 do Chão de Fábrica. As páginas que os usam vêm nas próximas sessões; o episódio E6 (mais de 60 s) fica para o YouTube.
- V06: teste de que todo arquivo em `public/midia` tem até 8 MB, que todo vídeo tem `.vtt` e pôster e que cada pasta ainda é um pacote válido (com canário que reprova arquivo grande, vídeo sem legenda e sem pôster).

## [1.7.0] - 2026-11-20

### Adicionado
- V04 (ADR 007): **`/educacao` ganha conteúdo, "Levar para minha instituição"**: IA para empresários e equipes, em linguagem de analista do Sistema S. Os formatos (palestra, oficina e trilha) aparecem marcados como **proposta**, sem duração nem preço: formato, duração, público e conteúdo são ajustados com a instituição. Áreas temáticas só com o que o Pedro pratica na Copel, cada uma com a entrada do Diário de obra que mostra.
- V04: **palco e mídia** só com fatos confirmados: a palestra na Sindigráfica-CE (#044), a visita do Sebrae e do SENAI para o vídeo do Sebraetec (#048), a reportagem da TV Record (#014) e a entrevista da UFC (#012), cada uma com o tipo do que foi (palestra, gravação, reportagem, entrevista). "Do outro lado da mesa": a fábrica atendida pelo Sebraetec e os cursos no IEL, na FIEC e no Sebrae.
- V04: **kit do analista**, uma ficha com quem é, formação (MBA e IA aplicada a negócios na FGV, IEL e FIEC, FullCycle 4.0), palco e mídia, áreas temáticas, duração e valores ("combinados com a instituição"), credenciamento ("consulte a sua instituição": nenhum requisito sem fonte oficial lida, e a página nunca diz "credenciado") e o WhatsApp com a marca `[educação]`.
- V04: a escada *Aprender → Automatizar → Sistema sob medida* com o **Aprender em destaque** ("Você está aqui", borda mais grossa) e o degrau seguinte levando à `/consultoria`.
- Textos em `src/data/educacao.ts`; `test/v04-educacao.test.ts` exige entrada confirmada para cada fato, todo número numa delas, nenhum número nos formatos e reprova carga horária, preço, "credenciado" e requisito de edital (canários).

### Alterado
- V04: `/educacao` sai do noindex do placeholder e entra no sitemap, com título e descrição próprios. A página não tem script próprio: JS da rota 0,70 KiB gzip (o do layout; orçamento 10), peso 15,5 KiB (orçamento 150).

## [1.6.0] - 2026-11-20

### Adicionado
- V03 (ADR 007): **`/consultoria` ganha conteúdo, "Faz aqui na minha"**. O método em 4 etapas (diagnóstico no chão de fábrica, protótipo, implantação, operação), cada uma com o que aconteceu na Copel, a fábrica do Pedro e cliente zero, e as entradas do Diário de obra que provam (#048, #047, #067, #032, #062, #081, #080, #033, #054). A escada *Aprender → Automatizar → Sistema sob medida* (o "Aprender" leva aos cursos, `/educacao`) e os casos: Copel e o Cloud com a loja piloto. Os textos ficam em `src/data/consultoria.ts`, e um teste exige que cada bloco cite entradas confirmadas e que todo número do texto esteja numa delas.
- V03: **raio-x de 5 perguntas** (processo que dói, como mede hoje, pessoas, turnos, sistema atual) em forma de ordem de serviço. A mensagem é montada no aparelho, aparece antes de enviar e abre no WhatsApp com a marca `[consultoria]` (`mensagemRaioX` e `linkRaioX` em `src/config/contato.ts`). Nada vai a servidor e nada fica guardado: E2E conta 0 requisição ao preencher e só a abertura do `wa.me` ao enviar, e confere o texto da URL.

### Alterado
- V03: `/consultoria` sai do noindex do placeholder e entra no sitemap, com título ("Consultoria sob medida para empresas") e descrição próprios. JS da rota 1,6 KiB gzip (orçamento 10), peso 16,3 KiB (orçamento 150).

## [1.5.0] - 2026-11-20

### Adicionado
- V02 (ADR 007): **home v2 com duas portas de mesmo peso**: "Fazer na minha empresa" (consultoria sob medida) leva a `/consultoria` e "Levar para minha instituição" (cursos de IA) leva a `/educacao`. Abaixo delas, o "Falar no WhatsApp", "Conhecer a história" (menor, abre a `/apresentacao`) e o link secundário "Diário de obra" (`/pedro`). A grade de apps continua logo abaixo, sob uma linha de pulso. Em 360x640 a frase, as portas, o contato e a história cabem sem rolar, acima do rodapé (E2E mede contra o contêiner e o rodapé em 360, 375, 1280 e 1440, nos 2 temas).
- V02: fundo de pulso que bate no toque: um anel e a onda de um batimento nascem no ponto onde o dedo tocou, atrás do conteúdo (nunca cobre texto). Todo o JS da home (tema + pulso) fica em 0,67 KiB gzip, orçamento 10; com movimento reduzido, nada anima (E2E confere o estilo computado).
- V02: `/consultoria` e `/educacao` com placeholder honesto ("Em construção", a frase da oferta e o WhatsApp com a origem de cada página, `[consultoria]` e `[educação]`). Ficam fora do Google até ganharem conteúdo (V03 e V04); orçamento de peso próprio (JS 10 KiB, peso 150 KiB).

## [1.4.0] - 2026-11-20

### Adicionado
- F5: **Explorador dos fluxos do n8n** (`/explorar` e uma página por fluxo). Cinco fluxos reais, do mais simples ao mais complexo: transcritor de áudio (5 passos), agente de produção dos teares (14), do gateway ao banco (22), lançamento do PCP no Asana (45) e LINA, atendimento no WhatsApp (70). O desenho reproduz a posição e as ligações do editor do n8n (ligações de IA tracejadas); tocar ou dar Enter num passo abre o painel com o que ele faz; zoom, arrastar, "Ver rodando" (desligado com movimento reduzido) e a alternativa "Ver como lista" para teclado e leitor de tela. SVG gerado no build; 1,4 KiB de JS.
- Os dados (`src/data/fluxos/*.json`) são uma versão **derivada e saneada**, gerada fora do repositório a partir do export do n8n (lista de permissões: posição, categoria, rótulo revisado, ligações). Notas adesivas, parâmetros, credenciais, IDs e URLs não entram; nomes de pessoas viraram papéis. `test/fluxos.test.ts` valida o esquema e reprova URL, e-mail, IP, id do n8n, número longo e campos do n8n (canário com um nó sujo).
- Cards do diário com fluxo ganham "Explorar o fluxo, passo a passo"; o perfil do `/pedro` ganha "Fluxos do n8n (5)". As 6 rotas novas entram no sitemap.

### Segurança
- `docs/execucao/v2/` no `.gitignore`: o trabalho do v2 (estratégia, colheita, transcrições) fica local até o Pedro decidir.

## [1.3.0] - 2026-11-20

### Adicionado
- F0 (trilha rápida): o site entra no Google. As rotas públicas ficam indexáveis, com `robots.txt`, `sitemap.xml` e `link rel="canonical"` (`src/config/indexacao.ts`). Ficam de fora (noindex) as versões, o `/bio`, as labels do feed e o cartão. E2E confere que as páginas sem noindex do `dist/` são exatamente as do sitemap.
- F0: preview de links (Open Graph e Twitter card) em todas as páginas, com a imagem `public/og/ailow.png` (1200x630, 148 KB), gerada por `scripts/og.mjs` só com arquivos locais (fontes do site, foto e logo oficial recolorida).
- F0: contato por WhatsApp autorizado pelo Pedro (`src/config/contato.ts`, fonte única). Botão "Falar no WhatsApp" na home, na `/apresentacao` e no `/bio`, com mensagem pronta que diz a origem (`[site]`, `[apresentação]`, `[instagram]`). O e-mail ainda não é publicado: o domínio não tinha registro MX em 2026-11-20.
- F0: `/bio`, destino do link da bio do Instagram (mesmo conteúdo da apresentação, fora do Google).

### Alterado
- F0: a home diz o que o Pedro faz ("Digitalizei e sensorizei a minha fábrica." + consultoria e cursos de IA para empresários) no lugar do cartão "AILOW / ailow.com.br"; espaçamentos compactos em telas baixas e título de tamanho fixo dentro da moldura do desktop, com E2E de que os 6 ícones ficam acima do rodapé em 360x640 e 1280x800.
- F0: a `/apresentacao` mostra quem é o Pedro sem precisar abrir a foto; a apresentação vira componente (`src/components/Apresentacao.astro`), usado também pelo `/bio`.
- F0: a trava do Voltar sai da home e fica só no cartão instalado (ADR 003 item 4 revisto; exceção EX-03 à UXM-03). Quem chega por link volta à origem.
- F0: títulos das abas sem repetição ("Sobre a empresa", "Versões do site", "Stack de ferramentas", "Apresentação de Pedro Fernandes").

### Segurança
- Imagem base do nginx de `1.30.6` para `1.31.7` (mainline, Alpine 3.24): o Trivy do job `imagem` passou a barrar 4 CVEs CRITICAL e 2 HIGH do nginx 1.30.6-r1 (corrigidas no 1.30.7-r0), e a imagem `nginx-unprivileged` 1.30.7 não foi publicada. A v1.2.0 em produção tem a mesma base; este deploy a corrige.

### Corrigido
- F0: sócio da Copel desde **mai/2015** (o `/pedro` dizia jan/2015; confirmado pelo Pedro em 2026-11-20).
- F0: `/sobre` não promete mais "alertas e dashboards" (o Pulse ainda não tem painel); `/pulse` diz o estado real: sensores em todas as máquinas, dois gateways, firmware v1.9 em validação em campo desde 19/11/2026.

## [1.2.0] - 2026-11-19

### Adicionado
- S12e: a versão do site (`v1.2.0`, lida do `package.json`) no rodapé da home e das páginas internas, como link para `/versoes`, que mostra o histórico de todas as versões publicadas lendo este `CHANGELOG.md` no build. O cartão de visita fica sem o rodapé. Como o cartão é rota escondida, a página de versões omite a rota dele ao ler este arquivo.
- Workflow `Publicar imagem`: passo que falha se a tag `vX.Y.Z` não for igual à versão do `package.json`.

### Alterado
- S12e: a logo das páginas passa do ciano para o amarelo canário (`--amarelo`); no tema claro ela fica sobre uma pastilha grafite (`--logo-fundo`), porque amarelo sobre o papel `estudio` dá 1,4:1.

## [1.1.1] - 2026-11-19

### Corrigido
- Ícones alinhados ao app: o A oficial em amarelo (`--amarelo`) sobre o grafite, no lugar do ciano da marca, nos 3 ícones do PWA do cartão. Site inteiro ganha favicon (`/favicon.svg` e `/favicon-32.png`) e `apple-touch-icon`. Gerados por `scripts/icones.mjs` a partir de `public/logo.svg` (intocada) e travados por `test/icones.test.ts`: cores, tamanhos, opacidade e zona segura do maskable; canário com o ícone antigo reprova.

## [1.1.0] - 2026-11-18

### Adicionado
- S12b: `/pedro/stack` com as 88 ferramentas do catálogo em 10 categorias (com e sem entrada no feed) e link "Stack (88)" no perfil do `/pedro`.

### Alterado
- S12b: entrada #080 (firmware v1.9, segue aberta) com o relato de 18/11/2026: v1.9 gravada nos dois gateways, validação em campo a partir de 19/11. #081 coerente.

### Corrigido
- S12c: seta Voltar em laço (label ↔ `/pedro`), Voltar do sistema com o dialog do avatar aberto saindo da página e toque duplo andando 2 telas; E2E de regressão com 11 cenários (PR #21).

### Corrigido
- CI: versiona a pasta da collection `prs` (PR #1).
- Dependabot: ignora major de `typescript` (o `@astrojs/check` 0.9.12 aceita só `^5 || ^6`) e de `@types/node` (segue o Node 22).
- `@types/node` volta de 26.6.6 para 22.20.5 (o #3 subiu o major antes do `ignore`; os tipos seguem o Node 22 do `.nvmrc`).

### Adicionado
- S06, `/pedro` no Pulso: perfil, bloco "Antes do primeiro commit", feed de cartões de PR (só `confirmado`, mais recente no topo, `+ferramenta` derivado), painel "Ferramentas" derivado e 87 páginas estáticas `/pedro/label/<slug>` (ferramenta ou `escopo-<frente>`). Código em `src/changelog/labels.ts`, `src/components/CartaoPR.astro`, `src/styles/feed.css`; testes em `test/changelog/labels.test.ts` e `e2e/pedro-feed.e2e.ts`.
- S05, home como app + Voltar (ADR 003): `/` vira a tela inicial de celular (grade de 6 ícones SVG, papel de parede Pulso, moldura de aparelho no desktop), páginas internas mínimas "em construção" (`/pedro`, `/pedro/entrevistas`, `/pulse`, `/cloud`, `/sobre`, `/apresentacao`, todas `noindex`) com layout `App.astro`, transição nativa "abrir/fechar app" (`view-transition-name` ícone↔selo, zero JS) e trava do Voltar (≤ 1 KB gz) que nunca deixa o navegador sair da home. E2E em `e2e/home-app.e2e.ts`; rotas novas em `scripts/orcamentos-peso.json`.
- S04, fundações do Pulso de produto (ADR 003): tokens em rem com tema escuro (padrão) e claro derivado (`src/styles/`), fontes Barlow, Barlow Condensed e JetBrains Mono auto-hospedadas (`@fontsource`, OFL), layout base com tema sem flash, botão de tema, `@view-transition` e logo oficial em máscara (`src/layouts/Base.astro`, `public/logo.svg`).
- Playwright + axe (`npm run e2e`, pasta `e2e/`): sem scroll horizontal em 360 e 1280 px nos 2 temas, axe sem serious/critical, zero requisição externa, tema persistente, logo com a assinatura oficial.
- Teste de contraste dos tokens (`test/contraste.test.ts`) e orçamento de peso por rota (`scripts/peso.mjs`, `scripts/orcamentos-peso.json`, dentro do `verify`).
- Job `e2e` no CI.
- Job `seguranca-sast` (Semgrep 1.185.0) no CI.
- `.github/dependabot.yml` (npm e GitHub Actions, semanal, minor/patch agrupados).
- Threat model, matriz de acessos, inventários de interfaces e de rotinas (`docs/seguranca/`, `docs/auditoria/`).
- `docs/harness-adoption.md`, `docs/ia.md`, `CONTRIBUTORS.md`, `SECURITY.md` e este `CHANGELOG.md`.

## [1.0.0] - 2026-11-18

Primeira versão publicável do site `ailow.com.br` (a tag `v1.0.0` é criada depois do merge).

### Adicionado
- S12, deploy: stack Swarm `ops/stack/index.yaml` (Traefik, HSTS de 1 ano, `www` redireciona para o apex), `ops/deploy/ssh-entrada.sh` e `deploy.sh` (comando forçado, saúde de dentro do container, reversão automática), workflows `Publicar imagem` e `Deploy` (approval no Environment `producao`), `scripts/deploy-test.sh` com canário e job `deploy-test` no CI, `test/deploy-stack.test.ts`, runbooks de deploy e rollback, ADR 004 e inventários de auditoria atualizados.
- S11, endurecimento: imagem nginx sem root, log JSON, CSP por hash, job `imagem` (Trivy), orçamentos de peso e de JS.
- S10, cartão de visita `/cartao/` (rota escondida, PWA, QR gerado no build, `wa.me`).
- S09, `/apresentacao` com avatar em pop-up e espaço para o vídeo.
- S08, `/pedro/entrevistas`.
- S07, páginas institucional, `/pulse` e `/cloud`.
- S06, `/pedro`: feed de PRs, rótulos derivados e painel de ferramentas.
- S05, home como app com transição nativa e trava do Voltar.
- S04, fundações do Pulso de produto (tokens, tema claro e escuro, fontes auto-hospedadas) e E2E com axe.
- S03, curadoria do feed (82 entradas, 81 confirmadas).
- S02, modelo do changelog (ADR 002) e linter de conteúdo público; S02b, governança do repositório (threat model, inventários, Dependabot, SAST).
- S01, scaffold Astro estático com `verify` e CI.

## [0.1.0] - 2026-11-18

Bootstrap do app (tier A).

### Adicionado
- S01: scaffold do site estático em Astro (ADR 001), Biome, Vitest, CI com `verify`, `seguranca-sca` e `seguranca-segredos`, template de PR, `CLAUDE.md` e `README.md`.
- S02: modelo do changelog do portfólio (ADR 002): esquema das entradas, regras de ordem e catálogos, linter de conteúdo público, feed em `/pedro/feed.json`.
- Exceções EX-01 e EX-02 em `docs/excecoes.md`.
