# ADR 007: Navegação v2 — duas portas, a escada e o feed como "Diário de obra"

- **Status:** Aceito (2026-11-20)
- **Data:** 2026-11-20 (sessão V01 do plano v2)
- **Decisores:** Pedro (decisões de mérito em 2026-11-19); nome do feed, rotas e detalhes delegados ao agente orquestrador (2026-11-18 e 2026-11-20).
- **Tier do app:** A
- **Regras do harness relacionadas:** ARQ-08/09, UXM-01/02/08/10/11, PERF (orçamento por rota), TEST-01, DOC-02
- **Revisa:** ADR 003 (a home deixa de ser só a grade de ícones; os ícones continuam como camada de "apps"). O resto do ADR 003 (tema Pulso, PWA só no cartão, transição nativa, EX-03) continua valendo.

## Contexto

A auditoria de 19/11 e uma pessoa não técnica da família ("não entendo direito, mas está muito bem
construído") mostraram que seis ícones de mesmo peso não dizem por onde começar. O Pedro declarou dois
objetivos: consultoria sob medida e educação corporativa (Sistema S). O feed de PRs, hoje o centro do
`/pedro`, é prova técnica, não porta de entrada.

### Decisões já dadas pelo Pedro

- **2026-11-19** (lacuna 1, opção C): "as duas ofertas com o mesmo peso, ligadas pela escada *Aprender (curso) → Automatizar → Sistema sob medida*. A home tem duas portas iguais (consultoria e educação) e a terceira, 'Conhecer a história', fica abaixo delas."
- **2026-11-19** (áudio "visão v2"): sobre o feed, "a gente não precisa desperdiçar. Só vamos mudar o nome [...] e deixar ele como secundário"; "o ícone da entrevista tem que ter"; "fazer um portfólio bonito, realmente, que seja entendível"; mobile primeiro e depois uma fase de desktop rota por rota.
- **2026-11-20** (F0): a trava do Voltar fica só no cartão (EX-03).

## Decisão

1. **Home (`/`):** frase de posicionamento + **duas portas de mesmo peso** — "Fazer na minha empresa" → `/consultoria` e "Levar para minha instituição" → `/educacao` — e, abaixo e menor, "Conhecer a história". Fundo de pulso em SVG/CSS. A grade de ícones continua **abaixo**, como "apps". Em 360×640 as portas e o contato cabem sem rolagem.
2. **A escada** *Aprender → Automatizar → Sistema sob medida* aparece nas duas páginas de oferta e as liga: quem chega pelo curso vê o degrau seguinte.
3. **Feed renomeado para "Diário de obra"**, subtítulo "cada entrega, com data e prova". Fica **secundário** (link na home abaixo das portas e no rodapé, não como porta). **A URL `/pedro` é mantida** (links já publicados, QR); `/diario-de-obra` não é criado agora para não duplicar conteúdo indexável.
4. **Lente "Para empresários / Para técnicos"** no Diário de obra, com o campo opcional `resumo_dono` nas entradas de vitrine (V09).
5. **Rotas novas** (cada uma na sua sessão): `/consultoria` (V03), `/educacao` (V04), `/na-tv` (V07, o ícone de entrevista aponta para ela; `/pedro/entrevistas` redireciona com 301), `/chao-de-fabrica` (V08), `/vem-ai` (V12), `/ia-no-seu-negocio/<setor>` (V14), `/como-e-feito` (V16). `/explorar/*`, `/cloud`, `/pulse`, `/apresentacao`, `/cartao`, `/bio` já existem e ficam.
6. **"Capítulos em stories" (`/historia/*`) não entra no v2:** "Conhecer a história" aponta para o `/apresentacao` (que já conta a trajetória) e para o Diário de obra. Vai para o backlog.
7. **Cada página tem uma ação principal** (WhatsApp com a marca de origem, `src/config/contato.ts`); no máximo um elemento em movimento por tela; `prefers-reduced-motion` desliga tudo.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| A. Capítulos em stories como estrutura principal | Esconde conteúdo da busca e exige carrossel acessível (pausa, teclado, leitor); custo alto sem material gravado (T1–T9 ainda não existem). Fica no backlog |
| B. "Painel da fábrica" (andon) na home | Fala menos com o Sistema S e com leigos; a luz de estado entra só nos cards do Vem aí |
| C. Manter a home de ícones como única camada | É o formato que a pessoa leiga não entendeu |
| Três portas de mesmo peso | O Pedro escolheu duas iguais e a história abaixo (2026-11-19) |
| Nome "Changelog", "Commits", "Git Ailow" | Jargão para leigo; "Git ILO" ainda esbarra na grafia bloqueada (ADR 001); "GitHub Ailow" usa marca de terceiro |
| Mudar a URL para `/diario-de-obra` com 301 de `/pedro` | Quebra o hábito dos links publicados sem ganho para o visitante; o nome visível é o que importa |

## Consequências

- **Positivas:** a home diz por onde começar; as duas ofertas ganham página própria e indexável.
- **Negativas / custo:** testes da home da F0 (grade de ícones no topo) mudam na V02, com comentário "V02" e esta decisão como referência.
- **Riscos e mitigação:** duas ofertas confundirem → teste da pessoa não técnica (V17) com critério fixado antes do resultado (L-0017).
- **Como saberemos que deu certo:** V17: 3 de 3 leigos dizem em 30 s o que o Pedro faz e acham o contato em ≤ 2 toques.
- **Revisão em:** depois da V17.

## Revisão em 2026-11-23 (V15): desktop por rota

- **Decisão (orquestrador, por delegação do Pedro de 2026-11-20 e 2026-11-23):** em ≥ 80 rem (1280 px) a home **deixa a moldura de aparelho** da S05 e vira uma composição larga, **sem mudar a hierarquia do item 1**: frase (com a proposta ao lado), as duas portas de mesmo peso lado a lado (mesma largura e altura), o contato sob a 1ª porta e "Conhecer a história" + "Diário de obra" sob a 2ª, e a grade de apps **abaixo**, numa fileira de 7 (uma doca). As rotas internas do escopo ganham layout próprio no mesmo ponto de quebra; o celular não muda.
- **Mecanismo:** todo o CSS de desktop da V15 fica em `src/styles/desktop/<rota>.css`, cada arquivo um único bloco `@media (min-width: 80rem)`, importado só pela página da rota (guarda `test/v15-desktop-css.test.ts`, com canários). A regressão visual é por geometria (`e2e/v15-desktop.e2e.ts`), não por imagem: o CI roda em Linux e imagens base do Windows não batem.
- **Alternativas descartadas:** (a) manter a moldura e só centralizar: 4/5 da tela vazios e a grade de apps escondida sob a dobra; (b) apps numa coluna à direita das portas: a grade sobe ao lado das portas e contraria "a grade abaixo" do item 1 (o E2E `v02-home` cobra isso também em 1280); (c) regressão por screenshot com imagens base geradas no CI: exige um job para gerar e versionar as imagens Linux a cada mudança de layout e não diz *o que* quebrou.
- **Contraponto:** a moldura era a forma mais literal de "o site é um app"; no desktop essa metáfora fica só na doca de ícones e na transição de abrir app (ADR 003, D1).
